# R9 T01 — 분석/확률/백테스트 엔진 단위 테스트 (인수인계서)

- **라운드**: R9 (gap-verify) / **역할**: T01 / 10 (Wave 1, 독립)
- **일자**: 2026-06-13
- **목표**: 핵심 엔진 5종의 Vitest 단위 테스트 신규 작성 (커버리지 0% → 회귀 안전망 확보)
- **결과**: ✅ **완료** — 신규 27개 테스트 전부 pass, 테스트 파일 타입 에러 0, 실 네트워크 호출 없음(결정론적)

---

## 1. 작성 파일 (5개, 모두 `__tests__/lib/` 하위)

| # | 파일 | 대상 엔진 | it 케이스 수 | 모킹 |
|---|------|-----------|:---:|------|
| 1 | `__tests__/lib/fractal_engine.test.ts` | `lib/fractal_engine.ts` | 5 | 불필요 |
| 2 | `__tests__/lib/signal_engine.test.ts` | `lib/signal_engine.ts` | 3 | `vi.stubGlobal('fetch')` (global fetch) |
| 3 | `__tests__/lib/analysis.test.ts` | `lib/analysis.ts` | 5 | 불필요 |
| 4 | `__tests__/lib/probability/engine.test.ts` | `lib/probability/engine.ts` | 7 | 불필요 |
| 5 | `__tests__/lib/backtest/engine.test.ts` | `lib/backtest/engine.ts` | 7 | 불필요 |
| | **합계** | | **27** | |

### 케이스 요약
- **fractal_engine** (5): ① 빈 배열→WAIT/0 ② 116개(임계 117 미만)→WAIT ③ 전부 동일값 120개→분모 0 가드(NaN/Infinity 부재) WAIT ④ 반복 패턴→구조 불변식(confidence 0~100, similarity≤100, bestMatches≤5) ⑤ 톱니파 정렬 검증.
- **signal_engine** (3): ① 평탄 구간→신호 없음→INFO 브리핑 2개(BTC/ETH) ② 단조 하락→RSI<30→BUY 신호 ③ 마지막 +5% 급등→WARNING('급등') 신호. `fetchCandles`가 미export라 **global `fetch`를 모킹**(time 초 단위 → 엔진이 ×1000), `calculateRSI`는 실제 계산.
- **analysis** (5): ① 데이터 부족(30<60)→indicators []·winRate 50·marketState UNCERTAIN·priceLevels undefined ② 상승 ③ 하락 ④ 횡보 픽스처→구조 불변식(winRate 10~90 clamp, lossRate=100−winRate, marketState union 멤버십) ⑤ `lang:'ko'`→한국어 recommendation.
- **probability/engine** (7): ① 신호 0개→50/SIDEWAYS ② 전부 BUY→85/UP(상한) ③ 전부 SELL→15/DOWN(하한) ④ 상충 신호→~50/SIDEWAYS ⑤ mtfMultiplier=1.0 무영향 ⑥ mtfMultiplier=0.5 감쇠 ⑦ 전 케이스 불변식(15≤probability≤85, 정수).
- **backtest/engine** (7): generateHistoricalTrades — ① 빈 배열→[] ② 49개→[] ③ 100개 진동→Trade 형태/유한성. analyzeRollingWindow — ④ 0건→전부 0 ⑤ 9건(<10)→전부 0 ⑥ 최근 전승 10건→allTime 100/recent 100/drift false ⑦ 과거승 10 + 최근패 5→allTime≈66.7/recent 0/driftMagnitude≈66.7/strategyDrift true.

---

## 2. 검증 결과 (§7 통합 실행)

```
$ npx vitest run __tests__/lib
 Test Files  11 passed (11)
      Tests  117 passed (117)
   Duration  1.14s
```
- T01 신규 5파일 = 27 tests 전부 pass (fractal 5 / signal 3 / analysis 5 / probability 7 / backtest 7).
- 나머지 90개는 기존 테스트(indicators, news-classifier, blog-utils, community/*) — 회귀 없음.

```
$ npx tsc --noEmit | grep __tests__   →  NO_TEST_FILE_ERRORS
```
- **`__tests__/lib` 내부 타입 에러 0** (T01 5파일 모두 타입 클린).
- 합격 기준 충족: 5파일 존재 확인, vitest green, 테스트 파일 tsc 0, 모킹으로 오프라인 결정론적 통과.

### ⚠️ tsc 잔여 에러 1건 — T01 범위/천장 밖 (수정 불가, 보고)
```
components/hooks/useAnalysisResult.ts(57,13): error TS2322:
  Type 'string' is not assignable to type '"pro" | "free"'.
```
- 이 파일은 **다른 R9 터미널이 동시 진행 중인 untracked 신규 파일**(AnalysisPanel 리팩터링 산출물). T01의 쓰기 천장(`__tests__/lib/`) 밖이며 엔진/컴포넌트 수정 금지 규칙에 따라 **건드리지 않음**.
- 실행 중 `lib/analysis/aggregation.ts`의 `@/components/Analysis/AnalysisPanel` CandleData export 누락 에러가 잠시 관측되었으나 재실행 시 사라짐(동시 터미널이 수정 진행 중인 것으로 추정). **T01 산출물과 무관**.
- 조치 요청: 지휘자 터미널이 통합 마감 시 위 1건을 담당 터미널(AnalysisPanel/useAnalysisResult 작업자)에 귀속 처리.

---

## 3. 발견 사항 (엔진 미흡 — 수정하지 않고 보고만)

> 모든 항목은 정상 경로 동작에 영향 없음. 안전성/명료성 개선 후보로만 기록.

1. **[signal_engine] RSI NaN 가드가 `null/undefined`만 검사** — `lib/signal_engine.ts` L71·L132의 가드는 `currentRSI === null || currentRSI === undefined`만 검사. `calculateRSI`(`lib/indicators.ts`)는 데이터 부족 시 **NaN**으로 채우는데 NaN은 통과한다. `NaN<30`/`NaN>70`은 항상 false라 잘못된 신호는 안 생기지만, INFO 브리핑(L140 `currentRSI.toFixed(1)`)에서 `'NaN'` 문자열 노출 가능. → **`Number.isFinite()` 기준 가드 권장**. (정상 경로는 candles≥20 사전 차단 + 50캔들에서 RSI 정상 산출되어 무해.)

2. **[signal_engine] 완전 평탄(동일값) 구간 RSI=100 처리** — `calculateRSI`는 avgLoss===0이면 RSI를 무조건 100으로 산출(`indicators.ts` L62~67). 따라서 평탄 구간은 RSI>70 → SELL 신호도 동반 발생할 수 있음. 의도 여부 확인 필요(펌프 테스트는 '급등 WARNING 존재'만 검증하므로 영향 없음).

3. **[probability/engine] 지시서와 clamp 스펙 불일치** — 지시서 §73은 "확률 0~1 clamp"를 기대했으나, 실제 엔진(`lib/probability/engine.ts` L61~64·L90)은 **15~85(0~100 스케일)로 clamp 후 `Math.round` 정수 반환**한다. probability는 0~1 비율이 아니라 15~85 정수 백분율. → 테스트는 **실제 동작**(15≤x≤85, 정수)을 검증했고, 지시서 설명 보정 필요.

4. **[backtest/engine] MDD 미존재** — `generateHistoricalTrades`/`analyzeRollingWindow`엔 MDD(최대낙폭) 계산 없음. MDD는 `lib/backtest/metrics.ts` 소관 → 본 파일(`backtest/engine.ts`) 범위 밖. 지시서 §78의 MDD 검증은 metrics 테스트(별도)에서 다뤄야 함.

5. **[backtest/engine] 죽은 표현식 흔적** — `lib/backtest/engine.ts` L57 `(exitPrice - entryPrice)/entryPrice*entryPrice`가 주석 더미로 방치됨. 실제 사용 값은 L74~75 `positionSize*priceChangePct`. 동작 무해하나 dead/혼동 코드 — 정리 후보.

6. **[backtest/engine] 미청산 포지션 누락** — 진입(BUY) 후 SELL 신호 전까지만 거래를 닫고, 루프 종료 시 열린 포지션은 `trades`에 미포함. 마지막 미체결 손익이 통계에서 누락 가능(설계 의도일 수 있음).

7. **[fractal_engine] confidence 상한 적용 시점** — `maxSim>95` 시 +10 부스트 후 `Math.min(confidence,100)`로 단일 지점에서 상한. BUY/SELL/WAIT 전 분기에서 안전하나 상한 적용이 부스트 이후 한 곳뿐 — 버그 아님(관찰).

8. **[analysis] riskRewardRatio 비유한 가능성** — `priceLevels.riskRewardRatio = (takeProfit−current)/(current−stopLoss)`. 특정 약세/경계 입력에서 분모 0 또는 음수로 비유한 값 가능. 테스트는 구조 불변식만 검증하므로 무해(관찰).

---

## 4. 내부 병렬 사용 내역

- **모드**: kdyswarm 내부 팬아웃 = **Workflow (mode 5, 사전 승인)** — `--worker-parallel aggressive`.
- **subagent 수**: 5 (파일당 1개, `parallel()` 동시 실행).
- **분담/산출**:
  | sub | 산출 파일 | 자가검증 | testCount |
  |-----|-----------|:---:|:---:|
  | A:fractal | `fractal_engine.test.ts` | ✅ | 5 |
  | B:signal | `signal_engine.test.ts` | ✅ | 3 |
  | C:analysis | `analysis.test.ts` | ✅ | 5 |
  | D:probability | `probability/engine.test.ts` | ✅ | 7 |
  | E:backtest | `backtest/engine.test.ts` | ✅ | 7 |
- 각 sub는 `npx vitest run <자기파일>`로 자가검증 후 구조화 출력(StructuredOutput) 반환. 메인이 5파일 회수 후 §7 통합 검증 1회 실행 + 본 handover 작성.
- **특이사항**: 5개 모두 1회차 통과(재시도/직렬 폴백 불요). 토큰 ~224k, 32 tool calls, 65초. 쓰기 천장(`__tests__/lib/`) 위반 0건.

---

## 5. 후속/주의

- T02가 쓰는 `__tests__/lib/community/`는 T01이 건드리지 않음(분리 유지 확인). 통합 vitest에서 community 테스트(63개)도 함께 green.
- 세션 종료(cs)는 수행하지 않음 — 통합·마감은 지휘자 터미널 담당.
- 발견 사항 1·3은 차기 라운드에서 엔진 측 보정 가치 있음(가드 `Number.isFinite`, 지시서 clamp 스펙 정정).
