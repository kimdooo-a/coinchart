# R9 / T02 — 커뮤니티 쿼리 단위 테스트 + 뉴스/검색 E2E 신규 spec

> 이 문서는 **새 Claude Code 세션의 첫 메시지로 정독·실행**하는 자기완결 통합 프롬프트다.
> 너는 kdydispatch 지휘자의 위임을 받은 **일꾼 터미널 T02 / 10**이다. 아래 9섹션을 순서대로 수행하라.

---

## 1. 컨텍스트

- **프로젝트**: 코인·주식 커뮤니티 (Next.js 16 App Router / TypeScript Strict / Supabase / Vitest + Playwright)
- **루트**: `G:\11_dev\260601 코인 차트분석`
- **라운드**: R9 (gap-verify) — 기존 커뮤니티 코드의 **테스트 갭을 메우는** 라운드. 코드 동작 변경 없음, 테스트만 추가.
- **역할**: **T02 / 10** — 커뮤니티 쿼리 모듈 **단위 테스트** + 뉴스/검색 **E2E 신규 spec** 작성.
- **핵심 원칙**: 프로덕션 코드(`lib/`, `app/`, `components/`)는 **읽기만**. 기존 테스트/spec은 **읽기만**. **신규 테스트 파일만 추가**한다.

## 2. 공통 SOT (읽기 전용 — 먼저 정독)

작업 전 아래를 반드시 읽어라. 추측 금지.

- `CLAUDE.md` — 프로젝트 개요·기술 스택·SSOT 규칙
- `docs/status/current.md` — 현재 상태·진행 라운드
- `docs/references/_API_REFERENCE.md` — API 엔드포인트 스펙 (뉴스/검색 라우트 확인)
- `docs/rules/*.md` — 개발 규칙 (모듈화·SSOT 분리)
- **대상 모듈 3종** (테스트 작성 전 시그니처·반환 타입 정독 필수):
  - `lib/community/board-queries.ts` (490줄)
  - `lib/community/news-queries.ts` (118줄)
  - `lib/community/coin-queries.ts` (260줄)
- **기존 패턴 참조**:
  - `__tests__/lib/news-classifier.test.ts`, `__tests__/lib/blog-utils.test.ts` (Vitest 헤더·describe/it/expect 패턴)
  - `e2e/community-news.spec.ts`, `e2e/community-board.spec.ts`, `e2e/community-coin.spec.ts` (기존 spec — **읽기만**)
  - `e2e/auth.setup.ts`, `e2e/_helpers.ts` (셋업·헬퍼)
  - `e2e/playwright.config.ts` (`testDir: __dirname`, `testMatch` 규칙 확인)

## 3. 공통 의무

- 한국어 주석/커밋 메시지.
- `.env`·`.env.local`·`nul` 커밋·생성 금지.
- SSOT 교차 import 금지: Crypto는 `lib/supabase/crypto.ts`, Stock은 `lib/supabase/stock.ts`. 테스트도 이 경계를 침범하지 말 것.
- import 경로는 `@/` alias 사용 (기존 테스트 패턴 준수).
- 프로덕션 코드를 수정해야 테스트가 통과한다고 판단되면 **수정하지 말고** handover에 "코드 갭"으로 기록만 한다.

## 4. 작업 목표

### (A) 단위 테스트 — 순수 함수 위주, `__tests__/lib/community/` 신규 디렉터리

| 파일(신규) | 대상 export | 검증 포인트 |
|---|---|---|
| `__tests__/lib/community/board-queries.test.ts` | `toBoardListItem()`, `toBoardPostDetail()`, `toBoardComment()` | row→DTO 매핑 정확성, 정렬/검색 매핑 헬퍼, null/누락 필드 방어 |
| `__tests__/lib/community/news-queries.test.ts` | `mapApiNews()`, `categoryLabel()`, `formatRelativeTime()` | `categoryLabel` 영문→한글 **8값**(`regulation/tech/exchange/onchain/etf/altcoin_news/macro/market`), 미지정·null 입력 시 undefined, `formatRelativeTime` 경계(방금/분/시간/일), `mapApiNews` 인덱스·카테고리 합성 |
| `__tests__/lib/community/coin-queries.test.ts` | `getCoinRoomMeta()`, `buildCoinView()`, `toTickerItems()` | 유효 slug→meta / 미존재 slug→null, ticker null 병합, `toTickerItems` 배열 변환·정렬 |

- **순수 함수 우선**: Supabase 클라이언트가 필요한 함수는 입력/출력만 단언하거나, 인메모리 fixture row를 주입해 매핑 로직만 검증한다. 실제 DB 호출 금지.
- 실제 반환 타입은 모듈을 읽고 확인할 것 (위 표의 검증 포인트는 가이드, 시그니처는 소스가 SOT).

### (B) E2E 신규 spec — `e2e/` 신규 파일만 (기존 spec **수정 절대 금지**)

신규 파일 예: `e2e/community-news-detail.spec.ts` (필요 시 검색용 추가 spec 1개까지).

- **뉴스 4차원 필터 조합**: 코인 + 호재(감정) + 중요도순 정렬 동시 적용 → URL 쿼리 반영·결과 렌더 확인.
- **검색 0건 처리**: 결과 0건 화면에서 "필터 초기화" 링크 클릭 → 필터 리셋·복귀 동작.
- **URL 지속성**: 정렬/감정 토글 후 새로고침해도 상태 유지(쿼리스트링 persistence).
- **DB 무관(SSR 렌더) 시나리오 우선**. DB 의존 시나리오는 `E2E_DB_READY` 환경변수 가드로 **graceful skip** (`test.skip(!process.env.E2E_DB_READY, "DB 미준비 — skip")` 패턴, `e2e/_helpers.ts`에 헬퍼 있으면 재사용).
- 셀렉터는 기존 spec의 role/text 셀렉터 컨벤션을 따른다(임의 추측 금지 — `community-news.spec.ts` 정독 후 동일 패턴).

## 5. 도구 권장

- `Read`로 대상 3개 모듈 + 참조 테스트/spec 정독.
- `Grep`으로 export 시그니처·기존 셀렉터·`E2E_DB_READY` 사용처 확인.
- `Write`로 신규 테스트 파일 생성(천장 내).
- 검증은 `Bash`(bash) 또는 `PowerShell`(PS) — 7섹션 명령 사용.
- 막히면 `Explore` 서브에이전트로 fixture 형태·row 타입 위치 탐색.

## 6. 의존성

- **선행**: 없음 (T02는 기존 코드 위 테스트 추가 — 독립).
- **공유 천장 충돌 주의**: 다른 일꾼이 `lib/community/*` 프로덕션 코드를 수정 중일 수 있으나 너는 **읽기만** 하므로 충돌 없음. 테스트 디렉터리(`__tests__/lib/community/`, `e2e/` 신규 파일)는 너의 **전용 쓰기 천장**.
- **금지**: 기존 `e2e/*.spec.ts` 수정, `e2e/playwright.config.ts` 수정(읽기만), 프로덕션 코드 수정.

## 7. 검증 (PS + bash 병기)

작성 후 아래를 **모두** 통과시켜라.

**bash:**
```bash
cd "G:/11_dev/260601 코인 차트분석"
npx vitest run __tests__/lib/community          # 단위 테스트 전체 green
npx playwright test e2e/community-news-detail --list   # 신규 spec 수집 확인 (실행 전 목록)
npx tsc --noEmit                                # 타입 에러 0
```

**PowerShell:**
```powershell
Set-Location "G:\11_dev\260601 코인 차트분석"
npx vitest run __tests__/lib/community
npx playwright test e2e/community-news-detail --list
npx tsc --noEmit
```

- `vitest run` 은 **반드시 green**. red 발생 시 코드 갭이면 handover에 기록(코드 수정 금지), 테스트 오류면 수정.
- `playwright --list` 로 신규 spec이 testMatch에 잡히는지 확인. 풀 run은 DB·서버 의존이 있으면 `E2E_DB_READY` 미설정 시 skip되어야 한다.
- `tsc --noEmit` 0 에러 필수.

## 8. 완료 신호

- 산출 handover: `docs/handover/2026-06-13-R9-T02-community-tests-e2e.md`
  - 작성한 신규 파일 목록(경로·테스트 케이스 수)
  - 검증 3종 결과(vitest green/케이스 수, playwright --list 수집 수, tsc 0)
  - **내부 병렬 내역**(9섹션 mode 2 팬아웃 결과 — 모듈별 담당·통합 순서)
  - 발견한 코드 갭(있으면) — 수정하지 않은 채 기록
- 지휘자에게는 한 줄로 보고: `T02 완료: 단위 N파일/M케이스 + E2E 신규 K spec, vitest green / tsc 0`

## 9. 내부 병렬 — mode 2 (팬아웃)

- **3개 쿼리 모듈 + E2E** 를 4갈래로 병렬 팬아웃하라.
  - A: `board-queries.test.ts`  B: `news-queries.test.ts`  C: `coin-queries.test.ts`  D: `e2e/community-news-detail.spec.ts`
- 각 갈래는 자기 파일만 Write — **쓰기 천장 `__tests__/lib/community/`·`e2e/`(신규)** 안에서만.
- 팬아웃 결과를 회수해 본체에서 **검증(7섹션)·handover(8섹션)** 를 통합 수행한다.
- 병렬 서브에이전트에게도 "프로덕션·기존 spec 읽기만, 신규 파일만 Write" 제약을 명시 전달하라.

---

## 안티패턴 (하지 말 것)

- ❌ 프로덕션 코드(`lib/community/*`, `app/*`, `components/*`) 수정.
- ❌ 기존 `e2e/*.spec.ts`·`playwright.config.ts`·기존 `__tests__/*` 수정.
- ❌ 단위 테스트에서 실제 Supabase/네트워크 호출 (fixture 주입으로 매핑만 검증).
- ❌ DB 의존 E2E를 무가드로 추가 (반드시 `E2E_DB_READY` graceful skip).
- ❌ 셀렉터·반환 타입 추측 (소스/기존 spec 정독이 SOT).
- ❌ SSOT 교차 import (crypto↔stock).
- ❌ `.env`·`nul` 생성/커밋, 한국어 외 주석.
- ❌ 천장 밖 파일 생성, 산출물 외 문서 추가 생성.
