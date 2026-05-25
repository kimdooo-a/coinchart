# Dispatch Checkpoint — R4 (community-wiring)

- round: R4
- tag: community-wiring
- started_at: 2026-05-25
- terminals: 4
- hierarchy: flat (CEO + 일꾼 4)
- status: phase-4-aggregation (Wave1 회수 PASS + 실 DB 적용 완료 / T04 발사 가능)
- orchestrator_session: 본 세션 (CEO)

## 이전 라운드
- R3 summary: docs/handover/2026-05-24-R3-_SUMMARY.md
- R1 `60d4298` + R2 `81b9624` + R3 `30cdbd5`/`c34f264`/`d789d07` → **모두 origin/main push 완료** (세션 29, 2026-05-25)

## 매트릭스

| T | short_name | goal | output_dir | depends_on | wave | allowed_dirs |
|---|-----------|------|-----------|-----------|------|--------------|
| T01 | db-migration | 마이그레이션 2종 검증 + db push 런북 + 스모크 스크립트 | docs/db/, scripts/smoke/ | [] | 1 | `docs/db/`·`scripts/smoke/`·`docs/handover/2026-05-25-R4-T01-*.md` |
| T02 | ui-wiring | 게시글 비추(dislikeCount)+댓글 추천(PATCH) 결선 | lib/community/, components/community/ | [] | 1 | `lib/community/board-queries.ts`·`components/community/PostVoteButtons.tsx`·`components/community/CommentSection.tsx`·`docs/handover/2026-05-25-R4-T02-*.md` |
| T03 | dead-code | news-queries.ts unused 정리 | lib/community/ | [] | 1 | `lib/community/news-queries.ts`·`docs/handover/2026-05-25-R4-T03-*.md` |
| T04 | e2e | board/news/coin SSR + 추천/댓글/공지 E2E | e2e/, docs/e2e/ | [T01, T02] | 2 | `e2e/`·`docs/e2e/`·`docs/handover/2026-05-25-R4-T04-*.md` |

## 회수 상태 (Phase 4 갱신 — 2026-05-25)

| T | PID | 발사 | handover | 자가검증 | 격리 | 비고 |
|---|-----|------|----------|----------|------|------|
| T01 | 49076 | ✅ | ✅ db-migration | PASS | ✅ docs/db·scripts/smoke | 마이그레이션 2종 검증 all PASS, CREATE POLICY 비멱등 1건(최초적용 무관, 런북 명시). 실 push는 운영자 |
| T02 | 52692 | ✅ | ✅ ui-wiring | PASS | ✅ 3파일 | togglePostLike+dislikeCount, toggleCommentLike 신규, PostVoteButtons 가짜값 제거, CommentSection onClick. tsc/eslint/build PASS. 런타임토글은 T01 db push 후 |
| T03 | 46128 | ✅ | ✅ dead-code | PASS | ✅ news-queries 1파일 | 사용처 전수조사 후 14심볼 제거(248→119줄), 7 export 보존. server 모듈 무결성 OK |
| T04 | 56452 | ⏳ Wave2 | — | — | — | T01 db push + T02 wiring 선행. 미발사(또는 진행중) |

## 검증 메트릭 (Phase 4)
- 완료율: 3/4 (T04 Wave2 발사 가능 — 선행 충족)
- 자가검증 PASS율: 3/3 (100%)
- 안티패턴 위반: 0 (전원 자기 쓰기영역만 수정)
- 통합 검증: tsc 0 ✅ / build exit 0 ✅ (board ƒ·coin ● 6종·news ƒ)

## 실 DB 적용 (지휘자 직접 — 2026-05-25, Management API)
- **발견**: 운영 DB(enksnhshciyvllwfiwrm "Crypto Chart Analysi")에 커뮤니티 마이그레이션 **5종 전부 미적용**이었음 (community_* 테이블 0, news 분류컬럼 0, RPC 0). 기존 news/blog_posts만 존재.
- **적용**: `.env.local`의 SUPABASE_ACCESS_TOKENS로 Management API `database/query`에 5종 순차 적용 (DB password 불요):
  1. `20260523_create_community_tables.sql` (테이블 4 + 보드시드 9 + 트리거 + RLS)
  2. `20260523_alter_news_classify.sql` (news category/importance_score/sentiment_score)
  3. `20260523_create_hot_issues_rpc.sql` (community_hot_issues)
  4. `20260524_comment_likes.sql` (R4 — comment_likes 테이블/트리거)
  5. `20260524_post_likes_rpc.sql` (R4 — toggle/counts RPC)
  → 전부 HTTP 201. post-check: 테이블 5·RPC 4·보드시드 9·news컬럼 3 확인.
- **시드**: `scripts/seed-community.ts` → 게시글 156행.
- **스모크**: `scripts/smoke/community-like-smoke.ts` → PASS 2 / SKIP 1(댓글 트리거, 댓글시드 없음→T04) / FAIL 0. 토글 RPC 라운드트립 like 0→1→0 정상.
- ⚠️ Management API 적용은 `supabase_migrations.schema_migrations`에 **히스토리 미기록** — 차후 정식 `supabase db push` 시 IF NOT EXISTS/OR REPLACE로 대부분 멱등이나 CREATE POLICY 3종은 `DROP POLICY IF EXISTS` 선행 필요(런북 §3-1).

## R4 발견 → R5 후보
- **detail API dislike 집계 미노출** (T02): `BoardPostDetail`/`PostDetailRow`에 비추 집계 필드 부재 → `PostVoteButtons`의 `initialDislikes`가 호출처(`app/board/[slug]/[postId]`)에서 미전달(초기 0, 클릭후 실값). detail API 응답 확장 + 호출처 연결 필요.
- **coin-queries.ts dead code** (T03): news-queries와 동일하게 SSR 전환 후 unused 클라 fetch 잔존 가능성 — 강력 추천.
- queries.ts SSOT 환원 · 차트 방향색 KR 정렬 · 토큰계 통일 · 게시글 수정/대댓글 (기존 R5 후보 유지)
