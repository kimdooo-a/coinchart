// R3 2026-05-24 / T06 — 관리자 전용 공지(is_notice) 라우트
// GET   /api/admin/board?slug=free  — 보드별 공지 목록 + 최근 일반글(공지 승격용)
// POST  /api/admin/board            — 새 공지 작성 (is_notice=true)
// PATCH /api/admin/board            — 기존 글의 is_notice 토글 (승격/해제)
//
// 설계: 옵션 B — 공개 board API(app/api/board/[slug]/route.ts)를 일절 수정하지 않고
//   admin 전용 라우트를 신설. board API 응답 계약(notices/posts/total/page/limit)이
//   그대로 유지되므로 T02(board SSR)의 호출이 깨지지 않는다.
// 권한: 서버에서 cookie 세션 → getUser() → isAdminEmail() 검증 (클라 신뢰 금지).
//   community_posts RLS는 update를 author 본인으로 제한하므로, 쓰기는 service_role
//   admin 클라이언트로 수행한다(공개 board POST의 createAdminClient 패턴과 동일).
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/admin-guard";

// board API(app/api/board/[slug]/route.ts)의 VALID_SLUGS와 동일하게 유지
const VALID_SLUGS = new Set([
  "free", "market", "info",
  "coin-btc", "coin-eth", "coin-xrp", "coin-sol", "coin-altcoin", "coin-kimp",
]);

// board API와 동일한 select 필드 — 응답 행 구조를 공개 API와 일치시켜 UI 재사용 용이
const POST_SELECT_FIELDS =
  "id, board_slug, title, author_id, guest_nickname, guest_ip_masked, category, tags, coin_symbol, view_count, like_count, comment_count, is_notice, is_hot, created_at, updated_at";

// GET — 보드별 공지 목록 + 최근 일반글(공지 승격 후보)
export async function GET(req: NextRequest) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.res;

  const slug = (new URL(req.url).searchParams.get("slug") ?? "").trim();
  if (!VALID_SLUGS.has(slug)) {
    return NextResponse.json({ error: "Unknown board" }, { status: 404 });
  }

  const admin = createAdminClient();

  // 공지글(is_notice=true) — 항상 전량 노출
  const noticeQuery = admin
    .from("community_posts")
    .select(POST_SELECT_FIELDS)
    .eq("board_slug", slug)
    .eq("is_deleted", false)
    .eq("is_notice", true)
    .order("created_at", { ascending: false });

  // 일반글(is_notice=false) — 최근 30개(공지로 승격할 후보)
  const postQuery = admin
    .from("community_posts")
    .select(POST_SELECT_FIELDS)
    .eq("board_slug", slug)
    .eq("is_deleted", false)
    .eq("is_notice", false)
    .order("created_at", { ascending: false })
    .limit(30);

  const [{ data: notices, error: noticeErr }, { data: posts, error: postErr }] =
    await Promise.all([noticeQuery, postQuery]);

  if (noticeErr) return NextResponse.json({ error: noticeErr.message }, { status: 500 });
  if (postErr) return NextResponse.json({ error: postErr.message }, { status: 500 });

  return NextResponse.json({ notices: notices ?? [], posts: posts ?? [] });
}

interface CreateNoticeBody {
  slug?: unknown;
  title?: unknown;
  contentHtml?: unknown;
  category?: unknown;
}

// POST — 새 공지 작성 (관리자 본인 author_id로 적재, is_notice=true)
export async function POST(req: NextRequest) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.res;

  let body: CreateNoticeBody;
  try {
    body = (await req.json()) as CreateNoticeBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const contentHtml = typeof body.contentHtml === "string" ? body.contentHtml : "";
  const category =
    typeof body.category === "string" && body.category.trim() ? body.category.trim() : "공지";

  if (!VALID_SLUGS.has(slug)) {
    return NextResponse.json({ error: "Unknown board" }, { status: 404 });
  }
  if (!title || title.length > 200) {
    return NextResponse.json({ error: "제목은 1~200자" }, { status: 400 });
  }
  if (!contentHtml || contentHtml.length < 1) {
    return NextResponse.json({ error: "본문 필수" }, { status: 400 });
  }

  const admin = createAdminClient();
  // 관리자는 로그인 사용자 → author_id로 CHECK 제약(author XOR guest)을 만족
  const { data, error } = await admin
    .from("community_posts")
    .insert({
      board_slug: slug,
      title,
      content_html: contentHtml,
      category,
      tags: [],
      coin_symbol: null,
      author_id: gate.userId,
      is_notice: true,
    })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "공지 생성 실패" }, { status: 500 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}

interface ToggleNoticeBody {
  postId?: unknown;
  isNotice?: unknown;
}

// PATCH — 기존 글의 is_notice 토글 (일반글↔공지 승격/해제)
export async function PATCH(req: NextRequest) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.res;

  let body: ToggleNoticeBody;
  try {
    body = (await req.json()) as ToggleNoticeBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const postId = typeof body.postId === "string" ? body.postId.trim() : "";
  if (!postId) {
    return NextResponse.json({ error: "postId 필수" }, { status: 400 });
  }
  if (typeof body.isNotice !== "boolean") {
    return NextResponse.json({ error: "isNotice(boolean) 필수" }, { status: 400 });
  }
  const isNotice = body.isNotice;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("community_posts")
    .update({ is_notice: isNotice })
    .eq("id", postId)
    .eq("is_deleted", false)
    .select("id, is_notice")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "공지 토글 실패(글 없음)" }, { status: 404 });
  }

  return NextResponse.json({ id: data.id, isNotice: data.is_notice });
}
