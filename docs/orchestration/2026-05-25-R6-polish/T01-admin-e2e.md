# T01 — AD1 관리자 storageState로 관리자 E2E 활성화

## 1. 컨텍스트
- 프로젝트: Crypto Chart Analysis (코인 차트 분석) — Next.js 16 + Supabase + Playwright
- 작업 디렉토리: `F:\11_dev\260523 코인 차트분석`
- 본 터미널 역할: **T01 / 5** (R6-polish Wave 1) — E2E 관리자 인증 셋업
- 쓰기 영역(격리): `e2e/` 하위만 (`e2e/auth.setup.ts` 신규, `e2e/playwright.config.ts`, `e2e/community-admin.spec.ts`)

## 2. 배경
현재 `e2e/community-admin.spec.ts`의 **AD1**(관리자 is_notice 토글) 테스트는 `test.skip(true, "관리자 인증 storageState 미구성 + DB...")`로 비활성. 직전 R5 풀검증에서 **29 passed / 0 failed / 1 skipped(AD1)** — 이 1 skip이 AD1이다. 관리자 인증 storageState를 구성해 AD1을 활성화하는 것이 목표.

`/admin/*`는 `middleware.ts`(protectedPaths: `/admin`)가 보호 → 비로그인 시 `/auth/login` 리다이렉트. 인증 방식은 **Supabase Auth**.

## 2-1. ⚠️ 라이브 프로덕션 DB 경고 (필독)
운영 Supabase는 **실제 배포된 라이브 환경**(R4에서 커뮤니티 스키마 + 156행 시드 수동 적용). AD1은 라이브 DB에 공지(`is_notice`)를 토글하므로, 정리가 실패하면 테스트 공지가 게시판 상단에 영구 노출된다. **다음 안전장치를 반드시 구현**:
- **정리 보장**: 공지 해제·생성 게시글 삭제를 `test.afterEach`/`finally`에 두어 **테스트 중단·실패에도 반드시 원복**. 본문 단계 실패가 정리를 건너뛰지 않게.
- **식별 마커**: 자체 생성 게시글 제목에 `[E2E-TEST]` prefix → 실 게시글과 구분 + 사후 일괄 정리 가능.
- **상태 스냅샷·원복**: 테스트 시작 전 대상 게시판의 공지 상태를 기록 → 종료 후 동일 상태로 원복 검증.
- **잔여 0 증거**: 종료 후 `is_notice=true`인 `[E2E-TEST]` 게시글 0건 + 생성 게시글 0건을 Management API/쿼리로 확인해 handover에 증거 첨부.

## 3. 공통 SOT (읽기 전용)
- `CLAUDE.md` — 프로젝트 규약
- `docs/handover/2026-05-25-session30-r5.md` — 직전 R5 인계(E2E 29 passed 맥락)
- `docs/solutions/2026-05-25-e2e-db-dependent-test-reliability.md` — **필독**. DB 의존 E2E 신뢰성 패턴(`E2E_DB_READY`, 운영 DB URL 주입, 자체 데이터 생성·정리)
- `docs/e2e/R4-scenarios.md` — E2E 시나리오 정의
- `e2e/_helpers.ts` — `DB_SKIP_REASON` 등 공용 헬퍼
- `middleware.ts` — protectedPaths 인증 보호 로직
- `app/auth/login/` — 로그인 폼 구조(셀렉터 파악용)

## 4. 작업 목표

### Phase 1: 관리자 자격 파악
1. Supabase 관리자 계정 식별: 관리자 판별 로직을 코드에서 확인(`/admin/board` 클라 컴포넌트의 "접근 권한 없음" 게이트 — 관리자 role/이메일 화이트리스트 여부). 자격증명은 환경변수로 주입: `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD`.
2. 관리자 계정이 없으면: handover에 "관리자 계정 생성 필요(자격증명·role 부여 방법)"를 명시하고, setup은 환경변수 부재 시 graceful skip 되도록 구성(자격 주입 시 자동 활성).

### Phase 2: auth.setup.ts (storageState 캡처)
- `e2e/auth.setup.ts` 신규: `/auth/login`에서 `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD`로 로그인 → 인증 쿠키를 `e2e/.auth/admin.json`에 `storageState` 저장.
- `e2e/.auth/`는 `.gitignore`에 추가(쿠키 커밋 금지 — 글로벌 룰 .env 금지 정신).

### Phase 3: playwright.config projects 분리
- `e2e/playwright.config.ts`에 `setup` 프로젝트(`*.setup.ts` 매칭) + `admin` 프로젝트(`storageState: e2e/.auth/admin.json`, `dependencies: ['setup']`) 추가. 기존 비인증 프로젝트는 유지(community-board/coin/news는 비로그인 그대로).

### Phase 4: AD1 활성화 (라이브 DB — §2-1 안전장치 필수)
- `community-admin.spec.ts` AD1의 `test.skip` 해제(또는 `E2E_DB_READY && fs.existsSync(admin.json)` 조건부). 운영 DB URL 주입 + `E2E_DB_READY=1` 시 실행되도록.
- AD1을 `admin` 프로젝트에서 실행. 흐름: **시작 전 공지 상태 스냅샷** → `[E2E-TEST]` 게시글 **자체 생성**(R5 패턴) → 공지 토글 → 목록 상단 공지 노출 검증 → 공지 해제 → **생성 데이터 삭제** → 스냅샷 원복 검증. 정리는 `afterEach`/`finally`로 **중단·실패에도 보장**.

## 5. 도구 권장
- `/kdye2e` 스킬(E2E 시나리오·실행·진단) 활용 가능. 또는 직접 작성.

## 6. 의존성
- 독립(다른 Wave1 터미널과 파일 겹침 없음).
- 운영 DB 접속: R5 solution의 dev 서버 운영 DB URL 주입 패턴 참조.

## 7. 검증
```powershell
# storageState 셋업 + AD1 실행 (운영 DB URL 주입 + E2E_DB_READY=1 환경에서)
npx playwright test --config e2e/playwright.config.ts --project=admin
# 전체 회귀 (Wave1 다른 작업 무관 — 29 passed 유지 + AD1 추가 통과 확인)
npx playwright test --config e2e/playwright.config.ts
# .auth 쿠키 커밋 방지 확인
git status --porcelain e2e/.auth   # 출력 없어야 함(gitignore)
```
- 자격증명 부재로 setup이 skip되면 그 사실 + 활성화 절차를 handover에 명시(부분 완료 허용).

## 8. 완료 신호
`docs/handover/2026-05-25-R6-T01-admin-e2e.md` 작성. 포함: 관리자 자격 구성 방식, auth.setup.ts/config 변경, AD1 결과(passed/skip 사유), 운영 DB 정리 잔여 0 확인.

## 안티패턴
- ❌ `e2e/` 밖 파일 수정(앱 코드·middleware 변경 금지 — 인증 로직 변경 필요 시 handover에 권고만)
- ❌ 관리자 쿠키/자격증명을 커밋(`.auth/`·`.env` 커밋 금지)
- ❌ E2E 생성 데이터 미정리(운영 DB 잔여 0 보장)
- ❌ 정리 로직을 테스트 본문에만 배치 (중단 시 라이브에 공지 잔존 — `afterEach`/`finally` 필수)
- ❌ 실 게시글을 공지 토글 대상으로 사용 (반드시 `[E2E-TEST]` 자체 생성분만)
- ❌ 한국어 주석 누락 / handover 누락
