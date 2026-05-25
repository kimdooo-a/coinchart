// 게시판 SSR 서버 사이드 fetch (R3/T02, 2026-05-24)
//
// R2/T01에서 게시판 3종은 "use client" + board-queries.ts 클라 fetch로 실데이터화됐다.
// R3/T02는 SEO 강화를 위해 목록·상세를 SSR로 전환한다 — 본 모듈은 서버 컴포넌트가
// Supabase 서버 클라이언트로 초기 데이터를 직접 조회하는 단일 진입점이다.
// (참고 패턴: R1/T15 lib/community/queries.ts의 fetchMainPageData — supabase 서버 클라 직접 조회)
//
// 주의: 본 모듈은 next/headers(cookies)를 쓰는 @/lib/supabase/server를 import하므로 서버 전용이다.
//       클라이언트 컴포넌트에서 import하면 빌드 에러가 난다(server-only 강제).
//       인터랙션(추천/댓글/삭제/작성)은 board-queries.ts의 클라 fetch 래퍼를 계속 사용한다.

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  toBoardListItem,
  toBoardPostDetail,
  toBoardComment,
  type BoardListResult,
  type BoardPostResult,
  type BoardSortKey,
  type PostListRow,
  type PostDetailRow,
  type CommentRow,
} from "@/lib/community/board-queries";
import type { BoardSlug } from "@/lib/community/board-meta";

// API 라우트(GET /api/board/*)와 동일한 SELECT 필드 — 응답 계약 일치 유지
const POST_LIST_FIELDS =
  "id, board_slug, title, author_id, guest_nickname, guest_ip_masked, category, tags, coin_symbol, view_count, like_count, comment_count, is_notice, is_hot, created_at, updated_at";
const POST_DETAIL_FIELDS =
  "id, board_slug, title, content_html, author_id, guest_nickname, guest_ip_masked, category, tags, coin_symbol, view_count, like_count, comment_count, is_notice, is_hot, is_deleted, created_at, updated_at";
const COMMENT_FIELDS =
  "id, post_id, parent_id, content, author_id, guest_nickname, guest_ip_masked, like_count, is_deleted, created_at, updated_at";

// ─────────────────────────────────────────────────────────────
// 목록 — SSR (searchParams 기반, GET /api/board/[slug] GET 핸들러와 동일 규칙)
// ─────────────────────────────────────────────────────────────

export interface BoardListServerOpts {
  page?: number;
  limit?: number;
  sort?: BoardSortKey;
  search?: string;
  category?: string;
}

export async function fetchBoardListServer(
  slug: BoardSlug,
  opts: BoardListServerOpts = {}
): Promise<BoardListResult> {
  const { page = 1, limit = 30, sort = "latest", search = "", category = "" } = opts;
  const supabase = await createClient();

  // 공지글 (페이지와 무관하게 항상 상단)
  const noticeQuery = supabase
    .from("community_posts")
    .select(POST_LIST_FIELDS)
    .eq("board_slug", slug)
    .eq("is_deleted", false)
    .eq("is_notice", true)
    .order("created_at", { ascending: false });

  // 일반글 (페이지·정렬·검색·카테고리)
  let q = supabase
    .from("community_posts")
    .select(POST_LIST_FIELDS, { count: "exact" })
    .eq("board_slug", slug)
    .eq("is_deleted", false)
    .eq("is_notice", false)
    .range((page - 1) * limit, page * limit - 1);

  // 페이지 정렬 키 → Supabase order (API GET 핸들러와 동일)
  if (sort === "popular")
    q = q.order("like_count", { ascending: false }).order("created_at", { ascending: false });
  else if (sort === "views")
    q = q.order("view_count", { ascending: false }).order("created_at", { ascending: false });
  else if (sort === "comments")
    q = q.order("comment_count", { ascending: false }).order("created_at", { ascending: false });
  else q = q.order("created_at", { ascending: false }); // latest

  if (search.trim()) q = q.ilike("title", `%${search.trim()}%`);
  if (category && category !== "전체") q = q.eq("category", category);

  const [noticeRes, postRes] = await Promise.all([noticeQuery, q]);

  const total = postRes.count ?? 0;
  const offset = (page - 1) * limit;

  return {
    notices: ((noticeRes.data ?? []) as PostListRow[]).map(toBoardListItem),
    posts: ((postRes.data ?? []) as PostListRow[]).map((row, i) => {
      const item = toBoardListItem(row);
      // 표시용 No: 최신순 기준 내림차순 시퀀스(다른 정렬에선 근사값 — 표시 전용)
      item.number = Math.max(1, total - offset - i);
      return item;
    }),
    total,
    page,
    limit,
  };
}

// ─────────────────────────────────────────────────────────────
// 상세 — SSR (글 + 댓글 + view_count 증가)
// ─────────────────────────────────────────────────────────────

/**
 * 게시글 본문 행 단건 조회. React cache로 동일 요청 내 중복 호출(generateMetadata + 페이지)을 1회로 dedupe.
 * 부수효과(view_count 증가) 없음 — 메타 생성에서 호출해도 조회수가 중복 증가하지 않는다.
 */
export const getPostRecord = cache(
  async (slug: BoardSlug, postId: string): Promise<PostDetailRow | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("community_posts")
      .select(POST_DETAIL_FIELDS)
      .eq("id", postId)
      .eq("board_slug", slug)
      .eq("is_deleted", false)
      .single();
    // 잘못된 UUID 형식 등은 Supabase가 {error}로 반환(throw 안 함) → null 처리
    if (error || !data) return null;
    return data as PostDetailRow;
  }
);

/**
 * 상세 페이지 초기 데이터 — 글 + 첫 페이지 댓글. 글이 없으면 null.
 * view_count +1은 기존 API(GET /api/board/[slug]/[postId]) 동작을 유지한다(요청당 1회 증가).
 * 표시 조회수는 증가 전 값(API와 동일 — 읽은 뒤 증가).
 */
export async function fetchBoardPostServer(
  slug: BoardSlug,
  postId: string
): Promise<BoardPostResult | null> {
  const post = await getPostRecord(slug, postId);
  if (!post) return null;

  // 조회수 증가 (service_role) — 베스트 에포트. 실패해도 본문 응답에 영향 없음.
  // (SSR에서 detached promise는 보장되지 않으므로 await — 요청당 1회만 실행)
  try {
    const admin = createAdminClient();
    await admin
      .from("community_posts")
      .update({ view_count: (post.view_count ?? 0) + 1 })
      .eq("id", postId);
  } catch (e) {
    console.error("[board-server] view_count 증가 실패:", e);
  }

  // 댓글 첫 페이지(created_at 오름차순 100) + 추천/비추 분리 집계(community_post_like_counts) 병렬 조회
  const supabase = await createClient();
  const [commentsRes, countsRes] = await Promise.all([
    supabase
      .from("community_comments")
      .select(COMMENT_FIELDS)
      .eq("post_id", postId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true })
      .limit(100),
    supabase.rpc("community_post_like_counts", { p_post_id: postId }),
  ]);

  // RETURNS TABLE → 배열 첫 행. BIGINT는 supabase-js에서 number|string으로 올 수 있어 Number() 변환.
  // RPC 실패/빈 결과 시 counts 미전달 → toBoardPostDetail이 like_count(순합산) 폴백, dislikes=0.
  const countRow = (Array.isArray(countsRes.data) ? countsRes.data[0] : countsRes.data) as
    | { like_count: number | string; dislike_count: number | string }
    | undefined;
  const counts = countRow
    ? { likes: Number(countRow.like_count) || 0, dislikes: Number(countRow.dislike_count) || 0 }
    : undefined;

  return {
    post: toBoardPostDetail(post, counts),
    comments: ((commentsRes.data ?? []) as CommentRow[]).map(toBoardComment),
  };
}

// ─────────────────────────────────────────────────────────────
// SEO 보조 — content_html에서 메타 description용 평문 요약 추출
// ─────────────────────────────────────────────────────────────

/** HTML 태그를 제거하고 공백을 정리해 메타 description용 요약 문자열을 만든다. */
export function summarizeHtml(html: string | null, maxLen = 120): string {
  if (!html) return "";
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > maxLen ? `${text.slice(0, maxLen)}…` : text;
}
