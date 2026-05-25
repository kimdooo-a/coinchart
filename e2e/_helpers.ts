// e2e/_helpers.ts — R4/T04 커뮤니티 E2E 공통 상수·헬퍼
//
// 추천/비추/댓글 토글·관리자 공지 토글은 R1 community_* 테이블 + R4 RPC/comment_likes +
// 시드 데이터가 있어야 실제로 통과한다. 2026-05-25 현재 운영 DB 미적용
// (scripts/smoke/community-like-smoke.ts FAIL: community_posts/community_comments/
//  community_comment_likes 전부 PGRST205 부재) 이므로 해당 시나리오는 기본 skip한다.
//
// 활성화: docs/db/R4-db-apply-runbook.md 의 `supabase db push`(마이그레이션 3종) +
//         `npx tsx scripts/seed-community.ts`(게시글 시드) 적용 후
//         환경변수 E2E_DB_READY=1 로 본 스위트를 재실행한다.

/** 실 DB(추천/비추/댓글/관리자토글)에 의존하는 테스트의 skip 여부. E2E_DB_READY=1이면 실행. */
export const SKIP_DB_DEPENDENT = process.env.E2E_DB_READY !== "1";

/** DB 의존 테스트 skip 사유 — handover/리포트에 그대로 노출된다. */
export const DB_SKIP_REASON =
  "실 DB 미적용 (community_* 테이블/RPC/comment_likes 부재). " +
  "docs/db/R4-db-apply-runbook.md db push + seed-community 후 E2E_DB_READY=1 로 재실행";

/** 형식상 유효하지만 DB에 존재하지 않는 게시글 UUID (소프트 404 안내 검증용). */
export const NONEXISTENT_POST_ID = "00000000-0000-0000-0000-000000000000";

/** 게시판 슬러그 + h1 표시 텍스트(이모지 포함, board-meta.ts SSOT와 동기). */
export const BOARDS = [
  { slug: "free", h1: "💬 자유게시판" },
  { slug: "market", h1: "📈 시세토론" },
  { slug: "info", h1: "📚 정보공유" },
] as const;

/** 코인룸 6종 슬러그 (coin/[symbol] generateStaticParams 와 동기). */
export const COIN_SLUGS = ["btc", "eth", "xrp", "sol", "altcoin", "kimp"] as const;
