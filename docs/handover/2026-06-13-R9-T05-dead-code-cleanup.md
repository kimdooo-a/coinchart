# R9 / T05 — Dead Code 검증 후 안전 삭제 (인수인계)

- **라운드**: R9 (gap-verify)
- **태스크**: T05 / 10 — dead code 검증·정리
- **일자**: 2026-06-13
- **원칙**: 추측 금지·증거 우선. 모든 삭제는 import·참조 0건 grep 증명 후에만 수행. 애매하면 보존+보고.
- **천장 준수**: 쓰기는 `lib/` 하위 2개 파일에만. SSOT(`crypto.ts`/`stock.ts`)·T04(`fng.ts`)·T07(`components/Analysis·Stock`) 무수정.

---

## 1. 결정 표

| # | 대상 | 판정 | 근거 (grep 요약) |
|---|------|------|------------------|
| C1 | `lib/logger.ts` (`createLogger`) | **보존** | import **8건** 발견 — `scripts/`의 batch_orchestrator·alert_engine·daily_cron·batch_analysis·healthcheck·report_generator·preflight·weekly_cron 전부 `import { createLogger } from '../lib/logger'` 후 활발히 호출. 미사용 아님 → 삭제 불가. (지시서 헤더의 "logger 미사용"은 grep으로 반증됨) |
| C2 | `lib/economic_events.ts` (`ECONOMIC_EVENTS`/`EconomicEvent`) | **보존 + 보고** | 외부 코드 import **0건**(자기 정의만). 그러나 `/calendar` 라우트(`app/calendar/page.tsx`)가 **동일 도메인(경제 캘린더)의 이벤트 데이터를 인라인 배열 `EVENTS`로 보유** 중 → economic_events.ts를 향후 SSOT로 통합·연계할 의도가 농후. 지시서 C2 단서("라우트가 참조 의도를 남겼으면 보존+보고") 적용 → **삭제하지 않음**. |
| C3 | `lib/config/gates.ts` | **부분 삭제** | `getFeatureGates()` → **보존**(① `scripts/preflight.ts:16,130`에서 import·사용 ② `getFeatureGatesCached`가 내부 `:71`에서 호출). `getFeatureGatesCached()` → **보존**(지시서 명시·호출자). `resetFeatureGatesCache()` → **삭제**(외부 import 0건 + 내부 호출 0건, "for testing" 전용 함수). `cachedGates` 변수는 `getFeatureGatesCached`가 사용하므로 유지. |
| C4 | `lib/analysis/stock/fetchStockSSOT.ts` | **부분 삭제** | `fetchStockSSOT()` → **보존**(`app/api/analysis/stock/[symbol]/route.ts:8,23`에서 사용). `interface`(StockCandleData/FetchStockSSOTOptions/FetchStockSSOTResult) → **보존**(`fetchStockSSOT`가 사용). `fetchStockSSOTByDays()`·`fetchStockSSOTLatest()` → **삭제**(외부 import 0건, README 문서·자기 정의에서만 언급). |
| 보고 | `lib/backtest/engine.ts` (`generateHistoricalTrades`/`analyzeRollingWindow`) | **미사용 import 없음** | `generateHistoricalTrades`는 `components/Stock/StockAnalysisPanel.tsx`·`components/Analysis/AnalysisPanel.tsx`에서 import·**호출 중**. `analyzeRollingWindow`는 `lib/analysis/orchestrator.ts`에서 import·**호출 중**. → T07에 넘길 미사용 import 없음. |

---

## 2. 삭제한 함수 목록

| 파일 | 삭제 단위 | 라인 수 | 사용처 증거 |
|------|-----------|---------|-------------|
| `lib/config/gates.ts` | `resetFeatureGatesCache()` + 주석 | -7 라인 | 전역 grep 외부 0건·내부 호출 0건 |
| `lib/analysis/stock/fetchStockSSOT.ts` | `fetchStockSSOTByDays()` | -27 라인(주석 포함) | 전역 grep 외부 0건 |
| `lib/analysis/stock/fetchStockSSOT.ts` | `fetchStockSSOTLatest()` | -21 라인(주석 포함) | 전역 grep 외부 0건 |

- 합계: 2개 파일, 3개 export 함수 제거 (gates.ts -7 / fetchStockSSOT.ts -48 라인).
- **파일 전체 삭제는 없음** — C3/C4 모두 export 함수 단위 제거. 보존 대상 함수/타입은 모두 유지.

## 3. 보존한 항목과 사유

- `lib/logger.ts` — scripts 8개에서 활발히 사용 중.
- `lib/economic_events.ts` — import 0건이나 `/calendar` 라우트가 동일 도메인 데이터를 인라인 보유, 향후 SSOT 연계 의도 농후(증거 기반 보존).
- `getFeatureGates`/`getFeatureGatesCached`/`cachedGates` — 사용 중 심볼.
- `fetchStockSSOT` + 3개 interface — 사용 중 심볼.

## 4. 검증 결과

| 항목 | 결과 |
|------|------|
| `npx tsc --noEmit` | ✅ PASS (타입 에러 0) |
| `npm run build` | ✅ green (전 라우트 정상 빌드) |
| 변경 파일 eslint (gates.ts / fetchStockSSOT.ts) | ✅ 0 errors (warning 1건: `count` 미사용 — **삭제와 무관한 기존 사항**, `fetchStockSSOT` 함수 본문) |
| `no-restricted-imports` (SSOT) 위반 | ✅ 0건 |
| 삭제 후보 재-grep | ✅ `resetFeatureGatesCache`/`fetchStockSSOTByDays`/`fetchStockSSOTLatest` 전역 0건 |
| SSOT(`crypto.ts`/`stock.ts`) 무변경 | ✅ `git status --porcelain` 출력 없음 |

> 참고: `npm run lint` 전체에는 102 errors가 있으나 **전부 `scripts/`의 기존 `no-explicit-any`**로 본 태스크 변경과 무관(pre-existing). 빌드·tsc는 green.

## 5. T07에 넘길 미사용 import 보고

- **없음.** `generateHistoricalTrades`/`analyzeRollingWindow`는 컴포넌트·오케스트레이터에서 실제 호출 중이라 미사용 import이 아님.

## 6. 동시 라운드 주의 (커밋 격리)

- 작업 중 `git diff --stat`에 본 태스크가 만지지 않은 파일(`app/api/...`, `lib/community/fng.ts`(T04), `scripts/daily_cron.ts` 등)이 다수 등장 → **다른 일꾼 터미널이 같은 워킹트리에서 동시 작업 중**으로 판단.
- 타 일꾼 작업을 휩쓸지 않도록 **본 태스크가 변경한 2개 파일 + 본 handover만 명시적으로 stage**하여 커밋. `git add -A`/`git commit -am` 사용 안 함.
- 커밋 대상: `lib/config/gates.ts`, `lib/analysis/stock/fetchStockSSOT.ts`, `docs/handover/2026-06-13-R9-T05-dead-code-cleanup.md`.

## 7. 후속 제안 (삭제 아님, 제안만)

- C2 `lib/economic_events.ts`: `/calendar` 페이지의 인라인 `EVENTS` 배열과 데이터가 중복됨. 향후 calendar 페이지를 economic_events.ts SSOT로 통합하거나, 통합 의사가 없다면 별도 라운드에서 둘 중 하나를 정리하는 것을 제안. (현 라운드에서는 연계 의도가 있어 보존)
