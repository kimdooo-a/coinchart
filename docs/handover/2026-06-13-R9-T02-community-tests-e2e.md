# R9 / T02 — 커뮤니티 쿼리 단위 테스트 + 뉴스/검색 E2E 신규 spec (인수인계)

- **일자**: 2026-06-13
- **라운드**: R9 (gap-verify) — 기존 커뮤니티 코드의 **테스트 갭 보강**. 코드 동작 변경 0, 테스트만 추가.
- **역할**: T02 / 10 (일꾼 터미널). 프로덕션·기존 spec **읽기만**, 신규 테스트 파일만 추가.
- **엔진**: kdyswarm 내부 병렬 (mode 2 팬아웃, 4갈래).

---

## 1. 작성한 신규 파일 (전용 쓰기 천장 내 — 5개)

| 파일(신규) | 종류 | 케이스 수 | 대상 export |
|---|---|---|---|
| `__tests__/lib/community/board-queries.test.ts` | Vitest 단위 | **30 it** | `toBoardListItem` · `toBoardPostDetail` · `toBoardComment` |
| `__tests__/lib/community/news-queries.test.ts` | Vitest 단위 | **20 it** | `categoryLabel` · `formatRelativeTime` · `mapApiNews` |
| `__tests__/lib/community/coin-queries.test.ts` | Vitest 단위 | **13 it** | `getCoinRoomMeta` · `buildCoinView` · `toTickerItems` |
| `e2e/community-news-detail.spec.ts` | Playwright E2E | **4 test** (N-D1~N-D4) | `/news` 4차원 필터·URL 지속·0건 처리 |

- 단위 합계: **3파일 / 63 케이스**. E2E: **1파일 / 4 test**.
- 모든 단위 테스트는 **인메모리 fixture 주입** — 실제 Supabase/네트워크 호출 0건.
- 신규 디렉터리 `__tests__/lib/community/` 생성(이 라운드 전용).

### 시간 의존성 처리

- `board-queries`의 내부 `relativeTime()`·`news-queries`의 `formatRelativeTime()`은 `Date.now()` 사용 → `vi.useFakeTimers()` + `vi.setSystemTime("2026-06-13T00:00:00Z")`로 시각 고정 후 경계("방금 전/N분/N시간/N일/N주") 결정적 단언. `afterEach`에서 `vi.useRealTimers()` 원복.
- 라벨 공백 차이 소스 확인 완료: **board는 공백 없음**("N분전"), **news는 공백 있음**("N분 전").
- `coin-queries`는 순수·시간 무관 → fake timers 미사용.

### E2E 시나리오 (셀렉터 SOT 확정값만 사용)

| ID | 시나리오 | DB 의존 | 가드 |
|---|---|---|---|
| N-D1 | 코인 BTC + 🔴 호재 + 중요도순 동시 적용 → `?coin=BTC&sentiment=positive&sort=importance` 동시 포함 + h1 graceful | 무관(SSR) | 결정적 |
| N-D2 | `?sentiment=positive&sort=importance` goto → `reload()` 후 쿼리 유지 | 무관(SSR) | 결정적 |
| N-D3 | 필터 적용 → "필터 초기화" 링크 `isVisible` 가드 후 클릭 → `/news` 복귀 (링크 부재 시 graceful 통과) | 무관 | graceful(N-N3 패턴) |
| N-D4 | 0건 결정 검증("조건에 맞는 뉴스가 없습니다" + 필터 초기화) | 의존 | `test.skip(SKIP_DB_DEPENDENT, DB_SKIP_REASON)` |

- 셀렉터: 코인행/분류행 라벨 중복("전체"·"BTC") 회피 위해 `getByRole("button", { name: "BTC" })` 사용. 감정/정렬 라벨은 고유.
- `_helpers.ts`의 `SKIP_DB_DEPENDENT`(`E2E_DB_READY !== "1"`)·`DB_SKIP_REASON` 재사용 — 무가드 DB 의존 0건.

---

## 2. 검증 결과 (7섹션)

| 검증 | 명령 | 결과 |
|---|---|---|
| 단위 green | `npx vitest run __tests__/lib/community` | ✅ **3 files / 63 passed / 0 failed** (691ms) |
| E2E 수집 | `npx playwright test e2e/community-news-detail --list --config=e2e/playwright.config.ts` | ✅ **Total: 4 tests in 1 file** (chromium 프로젝트 수집, setup/admin 제외 규칙 영향 없음) |
| 타입 | `npx tsc --noEmit` | ⚠️ exit 2 — **내 신규 파일 0 에러**. 전체 2건은 **타 일꾼 동시 작업**에서 비롯(아래 §3) |

- vitest 3파일 전부 green, 회귀 0.
- playwright `--list`: N-D1~N-D4 모두 수집 확인. 풀 run 시 N-D4는 `E2E_DB_READY` 미설정이면 설계대로 skip(기본 3 run + 1 skip).

---

## 3. 발견한 코드 갭 (수정하지 않음 — 기록만)

### (a) 내 테스트 대상 모듈 갭: **없음**

`board/news/coin-queries.ts` 3종 매퍼·헬퍼 모두 소스 동작과 테스트가 정확히 일치. 프로덕션 수정 0건으로 63 케이스 전부 green.

### (b) tsc 전체 에러 2건 — **내 작업 범위 밖 (타 일꾼 동시 작업)**

```
components/hooks/useAnalysisResult.ts(57,13): error TS2322:
  Type 'string' is not assignable to type '"free" | "pro"'.
lib/analysis/aggregation.ts(1,10): error TS2305:
  Module '"@/components/Analysis/AnalysisPanel"' has no exported member 'CandleData'.
```

- `components/hooks/useAnalysisResult.ts` → `git status` 상 **untracked**(타 일꾼이 새로 생성한 미완성 파일).
- `components/Analysis/AnalysisPanel.tsx` → **modified**(타 일꾼 수정 중) → `aggregation.ts`가 아직 export되지 않은 `CandleData`를 import.
- 두 에러 모두 내 신규 테스트 파일과 **import 그래프상 무관**하며, tsc 출력에 내 파일 경로는 단 하나도 없음.
- 지시서 원칙(프로덕션 수정 금지 + 타 일꾼 천장 침범 금지)에 따라 **미수정**. 해당 일꾼(분석/차트 담당, T 추정) 작업 완료 후 tsc는 자연 해소될 것으로 판단. 지휘자 통합 단계에서 전체 tsc 0 재확인 필요.

> 결론: **내 산출물만 놓고 보면 vitest green / E2E 수집 / tsc 클린.** 전체 tsc 2건은 동시 진행 중인 분석 모듈 작업의 중간 상태이지 T02 회귀가 아님.

---

## 4. 내부 병렬 내역 (9섹션 mode 2 — 4갈래 팬아웃)

- **오케스트레이터(본체)**: SOT 일괄 정독(대상 모듈 3종 + 기존 테스트/spec + NewsFilters/news-meta/coins 타입/playwright config/_helpers) → 시그니처·셀렉터 확정 → 경량 프롬프트로 4 서브에이전트 동시 발사.

| 갈래 | 담당 | 산출 | 자체검증 | 토큰 |
|---|---|---|---|---|
| A | board-queries 단위 | 30 it | 30 passed | ~56k |
| B | news-queries 단위 | 20 it | 20 passed | ~47k |
| C | coin-queries 단위 | 13 it | 13 passed | ~51k |
| D | E2E 신규 spec | 4 test | `--list` 4 수집 | ~46k |

- 각 갈래는 **자기 파일 1개만 Write**(쓰기 천장 `__tests__/lib/community/`·`e2e/` 신규). 충돌 0.
- **통합 순서**: 4갈래 회수 → 본체에서 통합 검증(vitest 전체 → playwright --list → tsc) → handover. (병렬 산출물 간 의존 없음 → barrier 후 단일 통합.)
- 4갈래 모두 첫 실행 green(재시도 0).

---

## 5. 후속 / 인계 사항

- **N-D4 활성화**: 운영 DB 적용 + `E2E_DB_READY=1` + dev 서버(운영 DB URL 주입) 시 0건 결정 검증 실행. (R4 런북 `docs/db/R4-db-apply-runbook.md` 패턴.)
- **풀 E2E run 미수행**: 지시서대로 `--list` 수집만 확인(dev 서버·DB 의존). 지휘자 통합 시 dev 서버 기동 후 N-D1~N-D3 실제 통과 확인 권장.
- **전체 tsc 0**: §3-(b) 분석 모듈 일꾼 작업 완료 후 지휘자가 재확인.
- **커밋**: 일꾼 터미널 — cs/커밋 생략. 신규 5개 파일은 워킹트리에 둠. 통합 커밋은 지휘자(라운드 마감) 수행.

---

## 부록 — 한 줄 보고 (지휘자용)

`T02 완료: 단위 3파일/63케이스 + E2E 신규 1 spec(4 test), vitest 63 green / playwright --list 4 수집 / tsc 내 파일 0(전체 2건은 타 일꾼 분석모듈 동시작업 중간상태)`
