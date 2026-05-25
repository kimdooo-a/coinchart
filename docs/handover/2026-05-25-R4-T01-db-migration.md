# R4 / T01 인수인계 — 실 DB 적용 준비 (마이그레이션 검증 + db push 런북 + 스모크)

**세션**: 2026-05-25 / R4 (community-wiring) / T01 (Wave 1, 독립)
**역할**: R3 추가 마이그레이션 2종을 운영 DB에 안전 적용하기 위한 **검증·런북·스모크 준비**
**실제 push 수행 안 함** — 운영 자격증명 미보유. 운영자가 런북대로 1회 실행.

---

## 1. Phase 1 — 마이그레이션 정적 검증 결과

검증 대상:
- `supabase/migrations/20260524_post_likes_rpc.sql`
- `supabase/migrations/20260524_comment_likes.sql`

대조 코드: `app/api/community/like/route.ts`, `app/api/community/comment/route.ts`, 선행 `20260523_create_community_tables.sql`

| 항목 | 판정 | 근거 |
|------|------|------|
| **RPC 시그니처 일치** | ✅ PASS | SQL `community_toggle_post_like(p_post_id UUID, p_user_id UUID, p_ip_hash TEXT, p_value SMALLINT)` ↔ `like/route.ts`의 `admin.rpc("community_toggle_post_like", { p_post_id, p_user_id, p_ip_hash, p_value })` — 인자명/순서/타입 완전 일치 |
| **RPC 반환행 일치** | ✅ PASS | SQL `RETURNS TABLE (liked BOOLEAN, like_count BIGINT, dislike_count BIGINT)` ↔ 라우트 `ToggleLikeRow { liked, like_count, dislike_count }`. 라우트가 `Number(result?.like_count ?? 0)`로 BIGINT→number 캐스팅 처리 |
| **comment_likes 컬럼 계약** | ✅ PASS | 테이블 컬럼 `comment_id/user_id/ip_hash/value` ↔ `comment/route.ts` PATCH의 select(`id,value,user_id,ip_hash`)·필터(`comment_id`,`user_id`/`ip_hash`)·insert(`comment_id,value,user_id`/`ip_hash`) 일치 |
| **UNIQUE/트리거 계약** | ✅ PASS | `uniq_..._user`(comment_id,user_id) + `uniq_..._iphash`(comment_id,ip_hash) 부분 인덱스로 회원/익명 dedup. 트리거 `trg_community_comment_likes_count`가 `community_comments.like_count`를 SUM(value)로 동기화 → 라우트가 토글 후 재조회하는 `like_count`와 일치 |
| **멱등성 (post_likes_rpc)** | ✅ PASS | 두 함수 모두 `CREATE OR REPLACE` → 완전 멱등, 재적용 안전 |
| **멱등성 (comment_likes)** | ⚠️ 부분 | `ADD COLUMN IF NOT EXISTS`/`CREATE TABLE IF NOT EXISTS`/`CREATE ... INDEX IF NOT EXISTS`/`CREATE OR REPLACE FUNCTION`/`DROP TRIGGER IF EXISTS`는 멱등. **단 RLS `CREATE POLICY` 3개는 비멱등** — 재실행 시 `policy already exists` 오류. 최초 1회 적용은 무관(신규 테이블). R3/T08 handover에도 기록된 기지 사항 |
| **적용 순서** | ✅ PASS | 파일명 사전순 `comment_likes`(c)→`post_likes_rpc`(p). 둘은 상호 독립(각각 R1 선행 테이블에만 의존)이라 순서 무관. 공통 선행: `20260523_create_community_tables.sql` |
| **RLS·권한** | ✅ PASS | 라우트는 `createAdminClient()`(service_role)로 호출 → RLS 우회. RPC는 `SECURITY DEFINER` 없으나 service_role 호출이므로 RLS 비적용. 함수 기본 실행권한 PUBLIC → service_role 실행 가능 |

**발견된 결함**: 차단(blocker) 없음. ⚠️ 단 `CREATE POLICY` 비멱등 1건(재적용 시에만 영향) — 마이그레이션 수정은 읽기 전용 규칙상 보류, 런북 §3-1에 재실행 절차 명시.

**스키마 레퍼런스 갱신 필요 여부**: 본 마이그레이션 객체는 R3에서 `docs/references/_SCHEMA_REFERENCE.md`에 이미 반영됨(공통 SOT 읽기 전용 — 본 터미널 미수정).

---

## 2. 산출 파일 (2종)

| 파일 | 내용 |
|------|------|
| `docs/db/R4-db-apply-runbook.md` | 적용 대상·순서, 사전 점검(login/link/migration list), `db push`(dry-run→push) 절차, SQL Editor 대안, 본 세션 `! ` 직접 실행 예시, 적용 후 스모크, 롤백 SQL(DROP 역순), 체크리스트 |
| `scripts/smoke/community-like-smoke.ts` | `npx tsx`로 실행하는 적용 후 스모크. (1) RPC 토글 ON→취소 라운드트립 (2) `community_comment_likes` SELECT (3) 트리거 like_count INSERT/DELETE 라운드트립. 객체 누락 시 어느 객체인지 명시 + 종료코드 1. 합성 ip_hash 행은 자체 원상복구 |

---

## 3. 검증 (본 터미널에서 실행 완료)

| 검증 | 결과 |
|------|------|
| `Test-Path docs/db/R4-db-apply-runbook.md` | ✅ 생성됨 |
| `Test-Path scripts/smoke/community-like-smoke.ts` | ✅ 생성됨 |
| `npx tsc --noEmit` | ✅ exit 0 (타입 에러 없음) |
| 자격증명 하드코딩 검사 (`eyJ\|service_role.*=.*"`) | ✅ 매치 없음 (env 참조만) |

---

## 4. ⚠️ 다음 액션 (운영자/사용자)

**실제 `supabase db push`는 운영자가 `docs/db/R4-db-apply-runbook.md`대로 실행합니다.**

사용자가 본 세션에서 직접 실행할 수 있는 명령 1줄(적용 후 검증):
```
! npx tsx scripts/smoke/community-like-smoke.ts
```
(적용 전이라면 동일 명령이 "어떤 객체가 없는지"를 출력하며 FAIL → 런북의 push 절차 선행)

본 산출물(런북·스모크)은 **T04(E2E)의 실행 선행조건** 안내가 됩니다 — DB 적용 + 스모크 PASS 후 E2E 진행.

---

## 5. 안티패턴 준수 확인

- ✅ `supabase/migrations/*.sql` 미수정 (결함은 보고만)
- ✅ 자격증명·service_role 키 하드코딩 없음
- ✅ `docs/db/`·`scripts/smoke/`·handover 밖 쓰기 없음 (격리 준수)
- ✅ 공통 SOT(`_SCHEMA_REFERENCE.md` 등) 미수정
- ✅ 한국어 주석/문서, handover 작성
