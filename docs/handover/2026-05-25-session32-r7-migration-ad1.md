# 인수인계서 — 세션 32 (R7 단독: 운영 DB 마이그 정합 + AD1 CI 통합 fallback)

> 작성일: 2026-05-25
> 이전 세션: [session31](./2026-05-25-session31-r6-conductor.md)
> 저널: [journal-2026-05-25.md](../logs/journal-2026-05-25.md) (세션 29까지 — 본 세션은 히스토리 재구성)

---

## 작업 요약
세션 31 인계 R7 후보 중 **#1(운영 DB schema_migrations 정합)** 과 **#2(AD1 CI 통합 generateLink fallback)** 를 단독 세션으로 완결. R7-1은 backfill을 Management API 트랜잭션으로 적용해 6행(8자리)→14행(14자리) 정합. R7-2는 `auth.setup`에 비번 없는 service_role magiclink fallback을 추가하고 AD1 spec의 collection 타이밍 함정을 수정해 fresh **2 passed** 실증.

## 대화 다이제스트

### 토픽 1: R7-1 선택 + 현황 파악
> **사용자**: "1"

세션 31 cs 인계 R7 후보 4건 중 1번(마이그 정합). kdydb 스킬 로드 후 추측 배제 위해 런북 §9-4·T02 handover·backfill SQL·config.toml 정독. 운영 DB 객체는 세션 29에 이미 적용됨 — 남은 건 `schema_migrations` 히스토리 기록 정합뿐임을 확인.

**결론**: 코드(T02)는 완료, 운영 DB 기록만 보충.

### 토픽 2: 정합 순서 함정 + 읽기 조회
운영 DB `schema_migrations` 읽기조회 → 6행 모두 8자리 version(세션30 진단과 일치). 로컬 파일은 T02가 14자리로 정규화 → mismatch. **핵심 함정**: 이 상태로 `db push`를 먼저 돌리면 CLI가 14개를 전부 미적용으로 오인해 재실행(비멱등 충돌 위험). 따라서 backfill로 `schema_migrations`를 먼저 14자리로 정합한 뒤 `db push --dry-run`이 0건임을 확인하는 순서가 안전.

**결론**: backfill 선행 → 검증 순서 확정.

### 토픽 3: 정합 범위 결정 + 적용
> **사용자**(질문 응답): "Part A+B (완전 정합)"

backfill Part A(커뮤니티 5종 INSERT) + Part B(기존 8자리 6행 DELETE→14자리 9종 재INSERT)를 `BEGIN;…COMMIT;` 트랜잭션으로 감싸 Management API `database/query` 1회 원자 적용. 첫 시도는 한글 주석이 PowerShell `ConvertTo-Json`에서 깨져 400 → 주석 라인 제외(실행 SQL은 순수 ASCII) 후 성공. 적용 후 14자리 14종 = 로컬 14파일 1:1.

**결론**: 운영 DB `schema_migrations` 완전 정합. 객체/데이터 불변, 히스토리 테이블만.

### 토픽 4: CLI 검증 시도 → BOM 발견 → 동등검증
런북 §9-4의 `supabase link`+`db push --dry-run` 0건 검증 시도. 그러나 supabase CLI가 cwd `.env.local`을 파싱하다 `'»'`에서 거부 → `.env.local` 선두 3바이트 = `EF BB BF`(UTF-8 BOM) 확정. 추가로 `db push --dry-run`은 db password 필요(세션29부터 Management API 전용으로 미보유). → `schema_migrations` 직접 조회(14종=로컬 14파일)가 `db push --dry-run` 0건과 동등함을 근거로 동등검증 채택.

**결론**: CLI 직접검증은 환경 제약으로 생략, 읽기조회 동등검증. BOM은 향후 제거 권장 이슈로 기록.

### 토픽 5: R7-2 — generateLink fallback 실측
> **사용자**: "다음 r7 진행"

R7 #2(AD1 CI 통합). T01 handover §6의 미검증 대안(generateLink magiclink). 추측 배제 위해 임시 스크립트로 운영 DB에서 `admin.generateLink({type:'magiclink'})`→`verifyOtp({token_hash,type})` 실측: type `'magiclink'`/`'email'` 둘 다 세션 획득, 쿠키 2개(`sb-…-auth-token.0/.1`). 의미상 정확한 `'magiclink'` 채택.

**결론**: 비번 없이 service_role로 관리자 세션 생성 가능 실증.

### 토픽 6: auth.setup 분기 + collection 함정 수정
`auth.setup.ts`에 경로 A(`signInWithPassword`)/경로 B(generateLink fallback) 분기 추가. `E2E_ADMIN_EMAIL` opt-in 보존(미주입 시 graceful skip). 첫 admin 실행에서 setup은 성공했으나 AD1이 skip → 원인: `RUN_AD1`이 spec 모듈 top-level에서 평가되는데 playwright test collection이 모든 프로젝트 실행보다 먼저 1회 일어나 `admin.ready`가 아직 없어 CI fresh 첫 회 항상 skip. `RUN_AD1`을 함수화해 beforeAll 가드 + test 본문 `test.skip(!runAd1())` 런타임 평가로 전환.

**결론**: fresh 재현(admin.ready 삭제 후 1회) → **2 passed**. graceful skip 회귀 보존, 운영 DB 잔여 0, 인증 산출물 gitignore 확인.

## 의사결정 요약

| # | 결정 | 선택지 | 선택 이유 |
|---|------|--------|----------|
| 1 | backfill 정합 범위 | Part A만 / **Part A+B** | 완전 정합(db push 0건) + 객체 불변이라 위험 낮음 |
| 2 | 적용 방식 | **Management API** / supabase CLI | CLI는 BOM+db password 제약, Management API는 세션29 검증·트랜잭션 가능 |
| 3 | CLI 검증 | 강행 / **동등검증** | BOM·password 제약, schema_migrations 직접 조회가 db push --dry-run 0건과 동등 |
| 4 | verifyOtp type | **magiclink** / email | 둘 다 작동, generateLink type과 일치하는 magiclink 채택 |
| 5 | AD1 skip 판정 | top-level / **런타임** | top-level은 collection 함정으로 CI fresh 첫 회 항상 skip |

## 수정 파일 (5개)

| # | 파일 | 변경 |
|---|------|------|
| 1 | `supabase/backfill_schema_migrations.sql` | 상단 주석 "적용 완료"로 정정(멱등 재실행 가이드) |
| 2 | `docs/db/R4-db-apply-runbook.md` | §10 운영 DB 정합 완료 기록 신설 |
| 3 | `e2e/auth.setup.ts` | generateLink(magiclink) fallback 경로 B + graceful 분기 재구성 + createClient import |
| 4 | `e2e/community-admin-auth.spec.ts` | `RUN_AD1`→`runAd1()` 런타임 평가 전환(collection 함정) + beforeAll 가드 |
| 5 | `docs/handover/next-dev-prompt.md` | R7-1·R7-2 완료 마킹 |

> 운영 DB는 코드 변경 외 `schema_migrations` 14행 정합(외부 상태 — git 무관).

## 상세 변경 사항

### 1. R7-1 운영 DB schema_migrations 정합
- backfill Part A+B를 `BEGIN;…COMMIT;` 트랜잭션으로 Management API 1회 적용.
- 적용 전 6행(8자리: 20241213·20241214·20251227·20260114·20260308·20260309) → 적용 후 14행(14자리: 9 비-커뮤니티 + 5 커뮤니티), 로컬 `migrations/*.sql` 14개와 1:1.
- 멱등: Part A/b-2는 `ON CONFLICT DO NOTHING`, Part B b-1 DELETE 대상(8자리 6행)은 정합 후 부재 → 재실행 안전.

### 2. R7-2 AD1 CI 통합 fallback
- `auth.setup.ts`: `email && !password && serviceRole` → service_role `admin.generateLink({type:'magiclink'})`의 `hashed_token`을 @supabase/ssr 클라(쿠키 jar)로 `verifyOtp({token_hash, type:'magiclink'})` 교환 → 인증 쿠키 캡처(signInWithPassword와 동일 청크 포맷). 비번 영구설정 불요.
- `community-admin-auth.spec.ts`: collection 함정 수정 — 활성 판정을 런타임으로.
- CI: `E2E_ADMIN_EMAIL` + `SUPABASE_SERVICE_ROLE_KEY` + `E2E_DB_READY=1` secret 주입으로 admin 프로젝트 자동화.

## 검증 결과
- `npx tsc --noEmit` — **0 에러** (2회)
- 운영 DB `schema_migrations` — **14자리 14종**, 로컬 14파일 1:1 (db push --dry-run 0건 동등)
- AD1 fresh 실행(비번 미주입, fallback 경로 B) — **2 passed**(setup+AD1)
- graceful skip 회귀(env 미주입) — AD1 skip, 운영 DB 무접촉 ✅
- AD1 운영 DB 잔여 — **0** (afterAll DELETE + CASCADE)
- 인증 산출물 — `e2e/.auth/admin.json`·`admin.ready` gitignore 확인

## 터치하지 않은 영역
- 앱 코드·`middleware.ts` (R7-2는 `e2e/` 격리)
- 마이그레이션 파일 내용 (T02 git mv 보존)
- `.env.local` BOM (제거는 사용자 승인 대기 — 커밋 금지 민감 파일)
- R7 #3(차트 라인·오버레이 색)·#4(토큰 변형 점검) 미착수

## 알려진 이슈
- **`.env.local` UTF-8 BOM**: supabase CLI 등 일부 도구가 거부(Next.js는 무시). 향후 CLI 작업 시 제거 필요(R7 잔여, 사용자 승인 후). solution `2026-05-25-env-local-utf8-bom-breaks-cli.md`

## 다음 작업 제안
- **R7 #3**: 차트 라인/오버레이 색 KR 정렬(RSI/MACD/MA/BB 라인·hero CSS 오버레이)
- **R7 #4**: 토큰 `bg-`/`border-` 변형 전수 점검
- **AD1 CI 워크플로 통합**: `.github/workflows/`에 E2E_ADMIN_EMAIL+SERVICE_ROLE+E2E_DB_READY secret + admin 프로젝트 잡 추가(코드는 준비 완료)
- **`.env.local` BOM 제거**(사용자 승인 시) — UTF-8(no BOM) 재저장, 내용 불변
