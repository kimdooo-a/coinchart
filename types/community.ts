// 커뮤니티 도메인 타입 센트럴라이제이션 (R9 / T03, 2026-06-13)
//
// 산재해 있던 community DB row 타입(snake_case)과 API 응답/RPC 반환 타입을 한곳에 모은다.
// 필드는 추측이 아니라 실제 select 컬럼·RPC 시그니처를 근거로 도출했다.
//   - 게시글/댓글 행: lib/community/board-queries.ts(PostListRow/PostDetailRow/CommentRow),
//     lib/community/queries.ts, app/api/community/comment/route.ts의 select 컬럼 기준
//   - 좋아요 RPC 반환: supabase/migrations/2026052400000{1,2} + 20260613000001
//
// 범위(R9/T03): 핵심 타입 정의 + export만 수행한다. 기존 모듈의 인라인 interface를
//   본 파일 재노출로 일괄 교체하는 작업은 범위 폭증 방지를 위해 후속 라운드 권고로 남긴다.

// ─────────────────────────────────────────────────────────────
// 1. DB row 타입 (snake_case) — Supabase 테이블/select 원형
// ─────────────────────────────────────────────────────────────

/** community_posts 목록 행 (select: id, board_slug, title, ... 기준) */
export interface CommunityPost {
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

/** community_posts 상세 행 (목록 컬럼 + 본문/삭제 플래그) */
export interface CommunityPostDetail extends CommunityPost {
  content_html: string | null;
  is_deleted: boolean;
}

/** community_comments 행 (select: id, post_id, parent_id, content, ... 기준) */
export interface CommunityComment {
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

/** community_post_likes / community_comment_likes 적재 행 (value: 1=추천, -1=비추) */
export interface CommunityLikeRow {
  id: string;
  user_id: string | null;
  ip_hash: string | null;
  value: 1 | -1;
  created_at: string;
}

/** 게시글 좋아요 행 (community_post_likes) */
export interface CommunityPostLikeRow extends CommunityLikeRow {
  post_id: string;
}

/** 댓글 좋아요 행 (community_comment_likes) */
export interface CommunityCommentLikeRow extends CommunityLikeRow {
  comment_id: string;
}

// ─────────────────────────────────────────────────────────────
// 2. RPC 반환 행 (RETURNS TABLE → 배열 첫 행, snake_case)
// ─────────────────────────────────────────────────────────────

/**
 * community_toggle_post_like / community_toggle_comment_like 공통 반환 행.
 * - liked: 토글 후 추천(value=1)이 활성인지
 * - like_count: 추천 수(value=1 합), dislike_count: 비추 수(value=-1 합)
 */
export interface ToggleLikeRow {
  liked: boolean;
  like_count: number;
  dislike_count: number;
}

// ─────────────────────────────────────────────────────────────
// 3. API 응답 타입 (camelCase) — 라우트 계약
// ─────────────────────────────────────────────────────────────

/** POST /api/community/like 응답 — 추천/비추 분리 집계 포함 */
export interface PostLikeResult {
  liked: boolean;
  likeCount: number;
  dislikeCount: number;
}

/** PATCH /api/community/comment 응답 — 기존 계약 { liked, likeCount } 유지 */
export interface CommentLikeResult {
  liked: boolean;
  likeCount: number;
}
