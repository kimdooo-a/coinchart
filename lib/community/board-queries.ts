// 게시판 3종(목록/상세/작성) 클라이언트 fetch 래퍼 + row→props 매퍼 (R2/T01, 2026-05-23)
//
// T12 board/community API(/api/board/*, /api/community/*)를 클라이언트에서 호출하고,
// snake_case DB row를 컴포넌트 props(BoardPost 등)로 변환한다.
// 사이드바 위젯(/api/coins/ticker · /api/coins/hot-issues · /api/fng · /api/blog)도 함께 래핑.
//
// 주의: 본 모듈은 브라우저(클라이언트 컴포넌트)에서만 호출된다 — 상대 URL fetch 사용.
//       서버 전용 모듈(@/lib/supabase/server 등)은 import하지 않는다(타입만 import).

import type { BoardPost } from "@/components/community/BoardRow";
import type { TickerItem } from "@/components/community/widgets/PriceTickerWidget";
import type { HotIssue, HotIssueTrend } from "@/components/community/widgets/HotIssueWidget";
import type { OfficialPost } from "@/components/community/widgets/OfficialPostsWidget";
import type { CoinTicker } from "@/types/coins";
import type { BoardSlug } from "@/lib/community/board-meta";

// BoardSlug는 board-meta.ts(SSOT)에서 재노출 — 기존 import 경로 호환 유지 (R3/T02)
export type { BoardSlug };

// ─────────────────────────────────────────────────────────────
// DB row 형태 (T12 API 응답 — snake_case)
// ─────────────────────────────────────────────────────────────

export interface PostListRow {
  id: string;
  board_slug: string;
  title: string;
  author_id: string | null;
  guest_nickname: string | null;
  guest_ip_masked: string | null;
  category: string | null;
  tags: string[] | null;
  coin_symbol: string | null;
  view_count: number;
  like_count: number;
  comment_count: number;
  is_notice: boolean;
  is_hot: boolean;
  created_at: string;
  updated_at: string;
}

export interface PostDetailRow extends PostListRow {
  content_html: string | null;
  is_deleted: boolean;
}

export interface CommentRow {
  id: string;
  post_id: string;
  parent_id: string | null;
  content: string;
  author_id: string | null;
  guest_nickname: string | null;
  guest_ip_masked: string | null;
  like_count: number;
  is_deleted?: boolean;
  created_at: string;
  updated_at?: string;
}

// ─────────────────────────────────────────────────────────────
// 뷰 타입 (컴포넌트가 소비하는 형태)
// ─────────────────────────────────────────────────────────────

/** 목록 행: BoardRow에 그대로 넘길 BoardPost + 라우팅/key용 uuid */
export interface BoardListItem extends BoardPost {
  /** 실제 DB UUID (href·React key에 사용). BoardPost.id(number)는 표시용 placeholder. */
  uuid: string;
}

export interface BoardPostDetail {
  id: string; // UUID
  boardSlug: string;
  title: string;
  contentHtml: string;
  author: string;
  authorIp?: string;
  isAdmin: boolean;
  category?: string;
  tags: string[];
  coinSymbol?: string;
  views: number;
  likes: number; // 추천 수 — 상세는 분리 집계(community_post_like_counts) 정확값, 미제공 시 like_count(순합산) 폴백
  dislikes: number; // 비추 수 — 분리 집계. counts 미제공 시 0
  commentCount: number;
  isNotice: boolean;
  isHot: boolean;
  createdAt: string; // 상대시간 라벨
}

export interface BoardCommentItem {
  id: string; // UUID
  parentId: string | null;
  author: string;
  authorIp?: string;
  isAdmin: boolean;
  content: string;
  createdAt: string; // 상대시간 라벨
  likes: number;
}

// ─────────────────────────────────────────────────────────────
// 표시 헬퍼
// ─────────────────────────────────────────────────────────────

/** "211.34.*.*" → "211.34" (BoardRow가 (앞2옥텟.*.*)로 표시) */
function maskedIpToShort(masked: string | null): string | undefined {
  if (!masked) return undefined;
  return masked.replace(/\.\*\.\*$/, "");
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffMin = Math.floor((Date.now() - then) / 60000);
  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분전`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}시간전`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}일전`;
  return `${Math.floor(diffD / 7)}주전`;
}

// ─────────────────────────────────────────────────────────────
// row → props 매퍼
// ─────────────────────────────────────────────────────────────

export function toBoardListItem(row: PostListRow): BoardListItem {
  const isAnon = !row.author_id;
  return {
    uuid: row.id,
    id: 0, // 표시는 number로 (caller가 채움). routing/key는 uuid 사용.
    title: row.title,
    author: isAnon ? row.guest_nickname ?? "익명" : "회원",
    authorIp: isAnon ? maskedIpToShort(row.guest_ip_masked) : undefined,
    createdAt: relativeTime(row.created_at),
    views: row.view_count,
    likes: row.like_count,
    commentCount: row.comment_count,
    isNotice: row.is_notice,
    isHot: row.is_hot,
    category: row.category && row.category !== "전체" ? row.category : undefined,
  };
}

/**
 * 게시글 상세 매퍼. `counts`(community_post_like_counts 분리 집계)를 주면 추천/비추를 정확히 반영하고,
 * 미제공 시(분리 집계 미조회 경로) likes는 like_count 순합산으로 폴백하고 dislikes는 0이다.
 */
export function toBoardPostDetail(
  row: PostDetailRow,
  counts?: { likes: number; dislikes: number }
): BoardPostDetail {
  const isAnon = !row.author_id;
  return {
    id: row.id,
    boardSlug: row.board_slug,
    title: row.title,
    contentHtml: row.content_html ?? "",
    author: isAnon ? row.guest_nickname ?? "익명" : "회원",
    authorIp: isAnon ? maskedIpToShort(row.guest_ip_masked) : undefined,
    isAdmin: false, // T12 API는 운영자 플래그를 노출하지 않음 (후속 라운드)
    category: row.category && row.category !== "전체" ? row.category : undefined,
    tags: row.tags ?? [],
    coinSymbol: row.coin_symbol ?? undefined,
    views: row.view_count,
    likes: counts ? counts.likes : row.like_count,
    dislikes: counts ? counts.dislikes : 0,
    commentCount: row.comment_count,
    isNotice: row.is_notice,
    isHot: row.is_hot,
    createdAt: relativeTime(row.created_at),
  };
}

export function toBoardComment(row: CommentRow): BoardCommentItem {
  const isAnon = !row.author_id;
  return {
    id: row.id,
    parentId: row.parent_id ?? null,
    author: isAnon ? row.guest_nickname ?? "익명" : "회원",
    authorIp: isAnon ? maskedIpToShort(row.guest_ip_masked) : undefined,
    isAdmin: false,
    content: row.content,
    createdAt: relativeTime(row.created_at),
    likes: row.like_count ?? 0,
  };
}

// ─────────────────────────────────────────────────────────────
// 게시판 목록 — GET /api/board/{slug}
// ─────────────────────────────────────────────────────────────

export type BoardSortKey = "latest" | "popular" | "comments" | "views";

// 페이지 정렬 키 → T12 API 정렬 키
const SORT_MAP: Record<BoardSortKey, string> = {
  latest: "recent",
  popular: "popular",
  comments: "comments",
  views: "views",
};

export interface BoardListResult {
  notices: BoardListItem[];
  posts: BoardListItem[];
  total: number;
  page: number;
  limit: number;
}

export async function fetchBoardList(
  slug: BoardSlug,
  opts: {
    page?: number;
    limit?: number;
    sort?: BoardSortKey;
    search?: string;
    category?: string;
  } = {}
): Promise<BoardListResult> {
  const { page = 1, limit = 30, sort = "latest", search = "", category = "" } = opts;

  const qs = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sort: SORT_MAP[sort] ?? "recent",
  });
  if (search.trim()) qs.set("search", search.trim());
  if (category && category !== "전체") qs.set("category", category);

  const res = await fetch(`/api/board/${slug}?${qs.toString()}`, { cache: "no-store" });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error((j as { error?: string }).error ?? `목록 조회 실패 (${res.status})`);
  }

  const json = (await res.json()) as {
    notices: PostListRow[];
    posts: PostListRow[];
    total: number;
    page: number;
    limit: number;
  };

  const total = json.total ?? 0;
  const resolvedPage = json.page ?? page;
  const resolvedLimit = json.limit ?? limit;
  const offset = (resolvedPage - 1) * resolvedLimit;

  return {
    notices: (json.notices ?? []).map(toBoardListItem),
    posts: (json.posts ?? []).map((row, i) => {
      const item = toBoardListItem(row);
      // 표시용 No: 최신순 기준 내림차순 시퀀스(다른 정렬에선 근사값 — 표시 전용)
      item.number = Math.max(1, total - offset - i);
      return item;
    }),
    total,
    page: resolvedPage,
    limit: resolvedLimit,
  };
}

// ─────────────────────────────────────────────────────────────
// 게시글 상세 — GET /api/board/{slug}/{postId}
// ─────────────────────────────────────────────────────────────

export interface BoardPostResult {
  post: BoardPostDetail;
  comments: BoardCommentItem[];
}

export async function fetchBoardPost(slug: BoardSlug, postId: string): Promise<BoardPostResult> {
  const res = await fetch(`/api/board/${slug}/${postId}`, { cache: "no-store" });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error((j as { error?: string }).error ?? `게시글 조회 실패 (${res.status})`);
  }
  const json = (await res.json()) as { post: PostDetailRow; comments: CommentRow[] };
  return {
    post: toBoardPostDetail(json.post),
    comments: (json.comments ?? []).map(toBoardComment),
  };
}

// ─────────────────────────────────────────────────────────────
// 작성 — POST /api/board/{slug}
// ─────────────────────────────────────────────────────────────

export interface CreatePostInput {
  title: string;
  contentHtml: string;
  category: string;
  tags: string[];
  coinSymbol?: string;
  postAsAnonymous: boolean;
  guestNickname?: string;
  guestPassword?: string;
}

/** 성공 시 새 게시글 UUID 반환 */
export async function createBoardPost(slug: BoardSlug, input: CreatePostInput): Promise<string> {
  const res = await fetch(`/api/board/${slug}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const json = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
  if (!res.ok || !json.id) {
    throw new Error(json.error ?? `작성 실패 (${res.status})`);
  }
  return json.id;
}

// ─────────────────────────────────────────────────────────────
// 댓글 작성 — POST /api/community/comment
// ─────────────────────────────────────────────────────────────

export interface CreateCommentInput {
  postId: string;
  parentId?: string | null;
  content: string;
  postAsAnonymous: boolean;
  guestNickname?: string;
  guestPassword?: string;
}

export async function createComment(input: CreateCommentInput): Promise<BoardCommentItem> {
  const res = await fetch(`/api/community/comment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const json = (await res.json().catch(() => ({}))) as { comment?: CommentRow; error?: string };
  if (!res.ok || !json.comment) {
    throw new Error(json.error ?? `댓글 등록 실패 (${res.status})`);
  }
  return toBoardComment(json.comment);
}

// ─────────────────────────────────────────────────────────────
// 추천/비추 토글 — POST /api/community/like
// ─────────────────────────────────────────────────────────────

export async function togglePostLike(
  postId: string,
  value: 1 | -1
): Promise<{ liked: boolean; likeCount: number; dislikeCount: number }> {
  const res = await fetch(`/api/community/like`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ postId, value }),
  });
  const json = (await res.json().catch(() => ({}))) as {
    liked?: boolean;
    likeCount?: number;
    dislikeCount?: number;
    error?: string;
  };
  if (!res.ok) throw new Error(json.error ?? `추천 실패 (${res.status})`);
  // dislikeCount = 비추 수(분리 집계). 기존 호출부 호환 — 필드 추가만.
  return {
    liked: !!json.liked,
    likeCount: Number(json.likeCount ?? 0),
    dislikeCount: Number(json.dislikeCount ?? 0),
  };
}

// ─────────────────────────────────────────────────────────────
// 댓글 추천 토글 — PATCH /api/community/comment
// ─────────────────────────────────────────────────────────────

/**
 * 댓글 추천 토글 래퍼 (R4/T02, 2026-05-25).
 * body: { commentId, value?: 1 | -1 } (value 미지정 시 1=추천).
 * 익명 dedup 헤더(x-client-ip-hash)는 middleware가 자동 주입 — 클라는 명시하지 않는다.
 */
export async function toggleCommentLike(
  commentId: string,
  value: 1 | -1 = 1
): Promise<{ liked: boolean; likeCount: number }> {
  const res = await fetch(`/api/community/comment`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ commentId, value }),
  });
  const json = (await res.json().catch(() => ({}))) as {
    liked?: boolean;
    likeCount?: number;
    error?: string;
  };
  if (!res.ok) throw new Error(json.error ?? `댓글 추천 실패 (${res.status})`);
  return { liked: !!json.liked, likeCount: Number(json.likeCount ?? 0) };
}

// ─────────────────────────────────────────────────────────────
// 수정 — PATCH /api/board/{slug}/{postId}
// ─────────────────────────────────────────────────────────────

export interface UpdatePostInput {
  title?: string;
  contentHtml?: string;
  category?: string;
  tags?: string[];
  coinSymbol?: string;
  guestPassword?: string;
}

/** 게시글 수정. 익명 글은 guestPassword 필수. 성공 시 void. */
export async function updateBoardPost(
  slug: BoardSlug,
  postId: string,
  input: UpdatePostInput
): Promise<void> {
  const res = await fetch(`/api/board/${slug}/${postId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const json = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) {
    throw new Error(json.error ?? `수정 실패 (${res.status})`);
  }
}

// ─────────────────────────────────────────────────────────────
// 수정 권한 사전 검증 — POST /api/board/{slug}/{postId}/verify-edit
// ─────────────────────────────────────────────────────────────

/**
 * 수정 페이지의 익명 비밀번호 게이트가 편집기 진입 전 호출 (HIGH-1, 2026-06-20).
 * 서버가 PATCH와 동일한 비번 검증을 수행 → 틀리면 throw(게이트 유지), 맞으면 통과.
 * 회원 글은 guestPassword 없이도 세션으로 통과한다.
 */
export async function verifyPostEditAccess(
  slug: BoardSlug,
  postId: string,
  guestPassword?: string
): Promise<void> {
  const res = await fetch(`/api/board/${slug}/${postId}/verify-edit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ guestPassword: guestPassword ?? "" }),
  });
  const json = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) {
    throw new Error(json.error ?? `비밀번호 확인 실패 (${res.status})`);
  }
}

// ─────────────────────────────────────────────────────────────
// 삭제 — DELETE /api/board/{slug}/{postId}
// ─────────────────────────────────────────────────────────────

export async function deleteBoardPost(
  slug: BoardSlug,
  postId: string,
  guestPassword?: string
): Promise<void> {
  const qs = guestPassword ? `?guestPassword=${encodeURIComponent(guestPassword)}` : "";
  const res = await fetch(`/api/board/${slug}/${postId}${qs}`, { method: "DELETE" });
  const json = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new Error(json.error ?? `삭제 실패 (${res.status})`);
}

// ─────────────────────────────────────────────────────────────
// 사이드바 위젯 — 클라 fetch (코인 시세 / 핫이슈 / FNG / 공식글)
// ─────────────────────────────────────────────────────────────

// 코인 브랜드 메타 (정적 표시 사전 — 시세 실데이터에 한국어명·링크를 덧입힘)
const COIN_META: Record<string, { nameKo: string; href: string }> = {
  BTC: { nameKo: "비트코인", href: "/coin/btc" },
  ETH: { nameKo: "이더리움", href: "/coin/eth" },
  XRP: { nameKo: "리플", href: "/coin/xrp" },
  SOL: { nameKo: "솔라나", href: "/coin/sol" },
  DOGE: { nameKo: "도지코인", href: "/coin/altcoin" },
  ADA: { nameKo: "카르다노", href: "/coin/altcoin" },
  BNB: { nameKo: "바이낸스코인", href: "/coin/altcoin" },
  TRX: { nameKo: "트론", href: "/coin/altcoin" },
  LINK: { nameKo: "체인링크", href: "/coin/altcoin" },
  AVAX: { nameKo: "아발란체", href: "/coin/altcoin" },
};

const HOT_TREND_MAP: Record<string, HotIssueTrend> = {
  UP: "up",
  DOWN: "down",
  NEW: "new",
  FLAT: "same",
};

export async function fetchSidebarTickers(): Promise<TickerItem[]> {
  const res = await fetch(`/api/coins/ticker`, { cache: "no-store" });
  if (!res.ok) throw new Error(`ticker ${res.status}`);
  const json = (await res.json()) as { tickers: CoinTicker[] };
  return (json.tickers ?? []).map((t) => {
    const meta = COIN_META[t.baseSymbol];
    return {
      symbol: t.baseSymbol,
      name: meta?.nameKo ?? t.baseSymbol,
      price: t.price,
      changePct: t.changePct,
      href: meta?.href ?? `/coin/${t.baseSymbol.toLowerCase()}`,
    };
  });
}

export async function fetchSidebarHotIssues(): Promise<HotIssue[]> {
  const res = await fetch(`/api/coins/hot-issues`, { cache: "no-store" });
  if (!res.ok) throw new Error(`hot-issues ${res.status}`);
  const json = (await res.json()) as { items: { rank: number; symbol: string; trend: string }[] };
  return (json.items ?? []).map((h) => ({
    rank: h.rank,
    keyword: COIN_META[h.symbol]?.nameKo ?? h.symbol,
    trend: HOT_TREND_MAP[h.trend] ?? "same",
    href: COIN_META[h.symbol]?.href,
  }));
}

export interface SidebarFng {
  value: number;
  prevValue?: number;
}

export async function fetchSidebarFng(): Promise<SidebarFng> {
  const res = await fetch(`/api/fng`, { cache: "no-store" });
  if (!res.ok) throw new Error(`fng ${res.status}`);
  const json = (await res.json()) as { value: number; prevValue?: number };
  return { value: json.value, prevValue: json.prevValue };
}

export async function fetchSidebarOfficialPosts(): Promise<OfficialPost[]> {
  const res = await fetch(`/api/blog?limit=3`, { cache: "no-store" });
  if (!res.ok) throw new Error(`blog ${res.status}`);
  const json = (await res.json()) as {
    posts: { slug: string; title: string; published_at: string | null; created_at: string }[];
  };
  return (json.posts ?? []).map((p) => ({
    slug: p.slug,
    title: p.title,
    date: (p.published_at ?? p.created_at ?? "").slice(0, 10),
  }));
}
