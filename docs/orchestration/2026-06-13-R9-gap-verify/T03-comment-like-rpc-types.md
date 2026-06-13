# T03 — 댓글 좋아요 RPC + 타입 센트럴라이제이션 (R9 / gap-verify)

> 자기완결 통합 프롬프트. 본 파일만 정독하면 단독 실행 가능. 역할 **T03 / 10**.

---

## 1. 컨텍스트

- **프로젝트**: 코인·주식 정보 공유 커뮤니티 (Next.js 16 App Router, TypeScript Strict, Supabase Auth/DB/RPC).
- **루트**: `G:\11_dev\260601 코인 차트분석` — 모든 명령은 이 디렉토리 기준.
- **라운드**: R9 (gap-verify) — R1~R8 마감(빌드 green) 이후 "부족한 모든 내용"을 포괄 검증·보강하는 라운드.
- **본 작업의 핵심 비대칭(배경)**:
  - **게시글 좋아요**는 `community_toggle_post_like` RPC로 통일됨 — 원자적 추천/비추 토글 + **회원전이 dedup**(익명 ip_hash 행을 회원 행으로 승계/정리)을 단일 트랜잭션으로 처리.
  - 반면 **댓글 좋아요만 RPC 없이** `app/api/community/comment/route.ts` PATCH 핸들러가 `community_comment_likes` 테이블을 **직접 CUD**(SELECT→INSERT/UPDATE/DELETE)하며 **회원전이 dedup이 미실장**됨 → 익명으로 좋아요 후 로그인하면 중복표/유실 가능.
  - 본 작업은 이 비대칭을 해소: 댓글용 토글 RPC를 신설하고, PATCH 핸들러를 RPC 호출로 단순화한다.
- **부수 목표**: 산재한 community DB row/view 타입을 `types/community.ts`로 센트럴라이즈.

## 2. 공통 SOT (읽기 전용 — 절대 수정 금지)

- `CLAUDE.md` (진입점)
- `docs/references/_SCHEMA_REFERENCE.md` — DB 테이블/RPC/뷰 구조 (열람만; **갱신은 T09 전담**)
- `docs/references/_TYPE_REFERENCE.md` — 타입 인덱스 (열람만)
- `docs/rules/*.md`, `docs/SSOT_SEPARATION_RULES.md`
- **패턴 참조 원본(필독)**: `supabase/migrations/20260524000002_post_likes_rpc.sql` (게시글 토글 RPC 정본),
  `supabase/migrations/20260524000001_comment_likes.sql` (댓글 테이블/트리거/RLS/유니크 인덱스 정의),
  `app/api/community/comment/route.ts` (개조 대상 PATCH 핸들러).

## 3. 공통 의무

- 주석·커밋 메시지 **한국어**.
- `.env`·`.env.local`·`nul` 커밋 **금지**.
- **SSOT**: `lib/supabase/crypto.ts` ↔ `lib/supabase/stock.ts` 교차 import 금지 (본 작업은 SSOT와 무관하나 규칙 인지).
- 자기 천장 디렉토리 **밖 쓰기 금지** (PreToolUse `dispatch-write-guard` hook이 exit 2로 차단).
- 코드 변경 시 천장 내 관련 문서만 갱신; 천장 밖 레퍼런스 갱신은 **T09에 위임**.

## 4. 작업 목표 (쓰기 천장: `supabase/migrations/`, `types/community.ts`(신규), `app/api/community/comment/`)

### (1) 신규 마이그레이션 — `supabase/migrations/20260613000001_create_comment_likes_rpc.sql`
- 함수: `community_toggle_comment_like(p_comment_id UUID, p_user_id UUID, p_ip_hash TEXT, p_value SMALLINT)`
  `RETURNS TABLE (liked BOOLEAN, like_count BIGINT, dislike_count BIGINT)`.
- **`20260524000002_post_likes_rpc.sql`의 `community_toggle_post_like`를 그대로 차용**하되 `post_id`→`comment_id`, `community_post_likes`→`community_comment_likes`로 치환:
  - (A) **회원전이 dedup**: `p_user_id`·`p_ip_hash` 모두 있을 때 — 회원 행 존재 시 동일 ip_hash 익명 행 DELETE(정리), 회원 행 없으면 익명 행을 `user_id 부여 + ip_hash=NULL`로 UPDATE(승계, value 보존 → 카운트 불변).
  - (B) 기존 표 조회(회원=user_id / 익명=ip_hash AND user_id IS NULL).
  - (C) 토글: 없음→INSERT, value 동일→DELETE(취소), value 상이→UPDATE(전환).
  - (D) 토글 반영 후 분리 집계(`value=1` 합=like_count, `value=-1` 합=dislike_count) + `liked`(value=1 활성) 반환.
  - 입력 방어: `p_value NOT IN (-1,1)` → RAISE EXCEPTION; `p_user_id IS NULL AND p_ip_hash IS NULL` → RAISE.
- **멱등**: 함수 본체는 `CREATE OR REPLACE FUNCTION`로 충분하나, 시그니처(반환 타입) 변경 시 충돌 대비 선행 `DROP FUNCTION IF EXISTS community_toggle_comment_like(UUID, UUID, TEXT, SMALLINT);` 추가. `COMMENT ON FUNCTION ...` 한국어 1줄 첨부.
- 주의: `community_comments.like_count`는 기존 트리거 `trg_community_comment_likes_count`(SUM(value))가 자동 갱신 → **함수에서 like_count 컬럼을 직접 건드리지 않는다**(post 패턴과 동일).

### (2) PATCH 핸들러 단순화 — `app/api/community/comment/route.ts`
- 현재 `existingQuery` 조립 → `maybeSingle` → 분기 INSERT/UPDATE/DELETE → `like_count` 재조회(약 60줄)를 **RPC 1콜로 대체**.
- 댓글 존재/삭제 검증(`is_deleted`)과 `value`/`commentId` 입력 검증, 익명 시 `x-client-ip-hash` 헤더 필수 체크는 **유지**.
- 회원: `p_user_id=user.id` + `p_ip_hash=req.headers.get("x-client-ip-hash")`(있으면 전달 → 회원전이 dedup 활성). 익명: `p_user_id=null`, `p_ip_hash=ipHash`.
- `admin.rpc("community_toggle_comment_like", {...})` 호출 → 에러 시 500. 응답 형태는 **기존 계약 유지**: `{ liked, likeCount }` (RPC의 `like_count`를 camelCase로 매핑). `dislikeCount`는 RPC가 반환하므로 응답에 추가 노출 여부는 기존 게시글 라우트 계약과 정합되게 결정(과확장 금지 — 기존 `{ liked, likeCount }` 유지가 안전, 필요 시 handover에 확장 제안).

### (3) 타입 센트럴라이제이션 — `types/community.ts` (신규)
- 산재한 community **DB row 타입(snake_case)** + **view/응답 타입(camelCase)**을 통합 정의·export: 최소 `CommunityPost`, `CommunityComment`(+ 좋아요 토글 응답 타입 `CommentLikeResult` 등).
- 기존 컴포넌트/라우트의 인라인 `interface`를 참고해 필드를 도출(추측 금지 — 실제 select 컬럼 기준).
- **범위 관리**: import 경로 일괄 교체가 크면 **핵심 타입 정의 + export만** 하고, 전면 교체는 handover에 후속 권고로 남긴다(과확장 금지).

## 5. 도구 권장

- `Glob`/`Grep`: community 관련 인라인 타입·`community_comment_likes` 사용처 탐색.
- `Read`: §2 패턴 원본 3종 정독 후 착수.
- `Edit`/`Write`: 마이그(신규 Write), route.ts(Edit), types/community.ts(신규 Write).
- 검증: `npx tsc --noEmit`, (가능 시) `supabase db lint`.

## 6. 의존성

- **독립 작업(Wave 1)**. 다른 T와 쓰기 천장 충돌 없음.
- T09(레퍼런스 정합)가 본 작업의 신규 RPC 시그니처/route 변경을 lazy 반영 → **본 일꾼은 `_SCHEMA_REFERENCE.md`를 직접 수정하지 않고**, 신규 RPC 시그니처·테이블·트리거 의존 관계를 **handover에 명기**만 한다.
- 내부 순서: (1)RPC → (2)route는 **순차 의존**(route가 RPC 시그니처에 의존). (3)types는 (1)(2)와 **병렬 가능**.

## 7. 검증

1. `npx tsc --noEmit` → 0 에러 (route.ts·types/community.ts 타입 정합).
2. RPC 시그니처 grep: `grep -n "community_toggle_comment_like" supabase/migrations/20260613000001_*.sql app/api/community/comment/route.ts` → 정의 1 + 호출 1.
3. 멱등 확인: 마이그에 `DROP FUNCTION IF EXISTS ...` 선행 라인 존재.
4. (가능 시) `supabase db lint` 경고 없음.
5. PATCH 핸들러에서 직접 테이블 CUD(`.from("community_comment_likes").insert/update/delete`)가 **모두 제거**되었는지 grep 확인.

## 8. 완료 신호

- 산출 코드 3곳 + 검증 통과 후 `docs/handover/2026-06-13-R9-T03-comment-like-rpc-types.md` 작성.
- handover 필수 포함: 신규 RPC **정확한 시그니처**(파라미터·반환), 신규/변경 파일 목록, types 통합 범위와 미교체 잔여(후속 권고), **내부 kdyswarm 사용 내역**(모드/subagent 수/산출), `tsc`·grep 검증 결과.
- **실DB 직접 변경 금지** — 마이그 파일만 작성, 적용은 지휘자/사용자.

## 9. 내부 병렬 (auto)

- 천장 3영역: `supabase/migrations/`(RPC) · `app/api/community/comment/`(route) · `types/`(types).
- 권장: **RPC → route 순차**, **types 병렬**(mode 2 소규모 팬아웃). 의존 경계가 명확하므로 mode 2면 충분.
- 충돌 방지: 같은 파일 동시 편집 금지(route.ts는 단일 에이전트).

---

## 안티패턴 (반드시 회피)

- ❌ 실DB 직접 변경 — 마이그 파일만 작성 (적용은 지휘자/사용자).
- ❌ `_SCHEMA_REFERENCE.md` 등 천장 밖 레퍼런스 직접 수정 — **T09 전담**, handover 명기만.
- ❌ `community_comments.like_count`를 RPC에서 직접 UPDATE (트리거가 담당 — post 패턴 위반).
- ❌ 마이그 비멱등(`DROP FUNCTION IF EXISTS` 누락)으로 재적용 실패.
- ❌ PATCH 응답 계약 무단 변경(`{ liked, likeCount }` 임의 변형) — 프론트 호환 깨짐.
- ❌ types 전면 교체로 범위 폭증 — 핵심 정의 + export, 잔여는 후속 권고.
- ❌ 한국어 주석/커밋 누락, `.env`·`nul` 커밋, handover·내부 병렬 내역 누락.
