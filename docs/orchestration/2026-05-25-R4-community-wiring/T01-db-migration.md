# T01 — 실 DB 적용 준비 (마이그레이션 검증 + db push 런북 + 스모크 스크립트)

## 1. 컨텍스트

- 프로젝트: **코인 차트 분석** (Next.js 16 + Supabase, v2.0 커뮤니티 피벗)
- 작업 디렉토리: `F:\11_dev\260523 코인 차트분석`
- 본 터미널 역할: **T01 / 4** — R3에서 추가된 마이그레이션 2종을 운영 DB에 안전하게 적용하기 위한 **검증·런북·스모크 준비**
- 라운드: R4 (community-wiring) · 발사 차수: **Wave 1 (독립)**

## 2. 배경 (왜 필요한가)

R3(T07·T08)에서 커뮤니티 추천/댓글 기능의 백엔드가 마이그레이션 2개로 추가됐으나 **운영 DB에 미적용** 상태다. 이 함수/테이블이 없으면 다음 라우트가 런타임 500을 던진다:
- `POST /api/community/like` → RPC `community_toggle_post_like(p_post_id, p_user_id, p_ip_hash, p_value)` 호출
- `PATCH /api/community/comment` → 테이블 `community_comment_likes` + 트리거(like_count 반영) 사용

본 터미널은 **실제 `supabase db push`를 직접 실행하지 않는다** (운영 자격증명은 사용자/운영자만 보유). 대신 **(a) 마이그레이션 검증, (b) 안전한 적용 런북, (c) 적용 후 스모크 검증 스크립트**를 산출하여 운영자가 1회 실행으로 적용·확인하도록 한다.

## 3. 공통 SOT (읽기 전용)

```
CLAUDE.md                                          진입점·커밋 규칙
docs/PROJECT_DIRECTION.md                          v2.0 방향성
docs/references/_SCHEMA_REFERENCE.md               community_comment_likes·RPC·트리거·RLS (R3 갱신본)
docs/DEPLOYMENT_RUNBOOK.md (있으면)                 기존 배포 런북 톤 참고
supabase/migrations/20260524_post_likes_rpc.sql    검증 대상 ①
supabase/migrations/20260524_comment_likes.sql     검증 대상 ②
supabase/migrations/20260523_create_community_tables.sql  선행 스키마 (community_posts/comments)
app/api/community/like/route.ts                    RPC 호출 계약 (인자명·반환행)
app/api/community/comment/route.ts                 PATCH 계약 (comment_likes 컬럼: comment_id/value/user_id/ip_hash)
```

> `supabase/migrations/`는 **읽기 전용** — 마이그레이션 파일 자체는 R3에서 커밋 완료됐으므로 수정 금지. 검증 중 결함 발견 시 handover에 보고만.

## 4. 작업 목표

### Phase 1: 마이그레이션 정적 검증
대상 2개 SQL을 정독하고 다음을 확인:
1. **RPC 시그니처 일치**: `community_toggle_post_like`의 인자명/순서/타입이 `like/route.ts`의 `admin.rpc("community_toggle_post_like", { p_post_id, p_user_id, p_ip_hash, p_value })` 및 반환행 `{ liked, like_count, dislike_count }`와 정확히 일치하는지.
2. **comment_likes 계약**: 테이블 컬럼(`comment_id`, `value`, `user_id`, `ip_hash`)·UNIQUE 제약·트리거가 `comment/route.ts` PATCH 핸들러가 기대하는 형태인지.
3. **멱등/순서 안전성**: 선행 테이블(`community_posts`/`community_comments`) 존재 가정이 맞는지, 동일 객체 재생성 시 `create or replace` / `if not exists` 사용 여부, 적용 순서 의존성.
4. **RLS·권한**: service_role(admin client)로 호출되므로 RLS 우회 가정이 맞는지.

### Phase 2: 적용 런북 작성 → `docs/db/R4-db-apply-runbook.md`
- 적용 대상 2파일 명시 + 적용 순서(post_likes_rpc → comment_likes, 의존 분석 결과 반영)
- `supabase db push` 절차 (link 상태 확인 → dry-run/diff → push) — 운영자가 그대로 따라 실행
- 사용자가 `! <command>` 형태로 본 세션에서 직접 실행할 수 있는 명령 예시 포함
- 롤백 노트 (함수 DROP / 테이블 DROP 역순)
- ⚠️ 자격증명·서비스 키는 **절대 문서에 기입 금지** — `.env`/`supabase login` 참조로만

### Phase 3: 적용 후 스모크 스크립트 → `scripts/smoke/community-like-smoke.ts`
- `npx tsx scripts/smoke/community-like-smoke.ts` 로 실행하는 검증 스크립트
- service-role 클라이언트로 (1) RPC `community_toggle_post_like` 존재·호출 가능(존재하는 임의 post에 대해 토글→재토글로 원상복구), (2) `community_comment_likes` 테이블 SELECT 가능, (3) 트리거가 like_count를 갱신하는지 라운드트립 확인
- 환경변수는 기존 패턴(`scripts/seed-community.ts` 등) 재사용 — `NEXT_PUBLIC_SUPABASE_URL`·`SUPABASE_SERVICE_ROLE_KEY`
- DB 미적용 상태에서 실행하면 명확한 실패 메시지(어떤 객체가 없는지) 출력하도록

## 5. 도구 권장
- `/kdydb` (DB 마이그레이션 관리 스킬) 참고 가능 — 단 실제 push는 운영자
- 직접 SQL/TS 작성

## 6. 의존성
- (독립) — Wave 1 즉시 진행
- 본 산출물(런북·스모크)은 T04(E2E)의 실행 선행조건 안내가 됨

## 7. 검증

```powershell
# 산출물 존재
Test-Path docs/db/R4-db-apply-runbook.md
Test-Path scripts/smoke/community-like-smoke.ts
# 스모크 스크립트 타입체크 (실행은 운영자 db push 후)
npx tsc --noEmit
# 스크립트가 자격증명을 하드코딩하지 않았는지
Select-String -Path scripts/smoke/community-like-smoke.ts -Pattern 'eyJ|service_role.*=.*"' 
```

## 8. 완료 신호
`docs/handover/2026-05-25-R4-T01-db-migration.md` 작성:
- Phase 1 검증 결과 (RPC 시그니처·comment_likes 계약 일치 여부, 발견된 결함 PASS/FAIL)
- 산출 파일 2종 경로
- ⚠️ **실제 db push는 운영자가 런북대로 실행** 명시 + 사용자가 본 세션에서 실행할 명령 1줄

## 안티패턴
- ❌ `supabase/migrations/*.sql` 수정 (읽기 전용 — 결함은 보고만)
- ❌ 자격증명·service_role 키를 런북/스크립트에 하드코딩
- ❌ `docs/db/`·`scripts/smoke/` 밖 쓰기 (격리 위반)
- ❌ 공통 SOT(`_SCHEMA_REFERENCE.md` 등) 수정 — 갱신 필요 시 handover에 명시
- ❌ handover 누락 / 한국어 주석 누락
