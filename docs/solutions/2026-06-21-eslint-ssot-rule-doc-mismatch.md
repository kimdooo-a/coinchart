---
title: eslint no-restricted-imports 규칙이 SSOT 정책 문서를 과잉 구현 — 화이트리스트 정정
date: 2026-06-21
session: 56
tags: [eslint, no-restricted-imports, ssot, lib-analysis, lint-baseline, whitelist]
category: tooling
confidence: high
---

## 문제
`npm run lint`의 baseline error 중 `no-restricted-imports` 16건이 lib/analysis 하위 모듈 직접 import에서 발생. 메시지는 "❌ Invalid analysis import. Use @/lib/analysis/crypto or @/lib/analysis/stock only". 표면상 SSOT 분리 위반처럼 보여 기계적으로 못 고치고 baseline으로 방치돼 왔다.

실제 위반 import:
- `import type { AnalysisResult } from '@/lib/analysis/orchestrator'` (5)
- `import { performAnalysis } from '@/lib/analysis/orchestrator'` (3)
- `import { generateSignals } from '@/lib/analysis/signals'` (4)
- `import { aggregateCandles } from '@/lib/analysis/aggregation'` (3)
- `import { analyzeMarket } from '@/lib/analysis'` (1, 부모 직접)

## 원인
**eslint 규칙(`eslint.config.mjs`)이 정책 문서(`docs/SSOT_SEPARATION_RULES.md`)의 의도를 과잉/부정확하게 구현**한 것이 근본 원인. 두 산출물이 정면 충돌:

- 문서는 `generateSignals`(signals)·`generateStockSignals`(stock-signals)를 **명시적으로 ✅ ALLOWED**로 적시(문서 12·19행).
- 규칙의 patterns는 `["@/lib/analysis/*", "!@/lib/analysis/crypto", "!@/lib/analysis/stock"]` 로 crypto/stock만 예외 → signals·stock-signals·orchestrator·aggregation·mtf·divergence·candlestick을 **전부 차단**.

코드 실측 결과 이들은 모두 **자산-중립 범용 모듈**(`performAnalysis(input)`·`generateSignals(candles: CandleData[])`·`aggregateCandles(candles, tf)` — crypto/stock 특정 아님)이며, cross-asset **데이터** 위반(crypto 컴포넌트가 stock 데이터를 쓰거나 그 반대)은 **0건**. SSOT의 진짜 취지는 supabase 레이어의 데이터 분리(`@/lib/supabase/*` 규칙이 담당)이고, analysis 레이어에서 막아야 할 것은 `@/lib/analysis` **부모 직접 import**뿐이다.

## 해결
규칙을 문서 의도에 맞게 **화이트리스트로 정정**(정책 약화가 아닌 정합 복원):

1. `eslint.config.mjs` — analysis patterns 예외에 범용 모듈 추가:
```js
group: [
  "@/lib/analysis/*",
  "!@/lib/analysis/crypto", "!@/lib/analysis/stock", "!@/lib/analysis/stock/**",
  "!@/lib/analysis/signals", "!@/lib/analysis/stock-signals",
  "!@/lib/analysis/orchestrator", "!@/lib/analysis/aggregation",
  "!@/lib/analysis/mtf", "!@/lib/analysis/divergence", "!@/lib/analysis/candlestick"
]
```
이로써 차단되는 것은 `@/lib/analysis` 부모 직접(`paths` 규칙)과 화이트리스트 미등록 신규 모듈뿐. crypto↔stock 데이터 차단은 `@/lib/supabase/*` 규칙이 그대로 유지.

2. `lib/analysis/crypto.ts` — 부모 직접을 쓰던 소비자가 진입점 경유하도록 타입 노출 보강:
```ts
export type { AnalysisResult } from '../analysis';
```

3. `app/api/analysis/[symbol]/route.ts` — 부모 직접 import(문서상 진짜 위반)를 진입점 경유로:
```ts
// before: import { analyzeMarket, type AnalysisResult } from '@/lib/analysis';
import { analyzeMarket, type AnalysisResult } from '@/lib/analysis/crypto';
```

4. `docs/SSOT_SEPARATION_RULES.md` — 범용 모듈 허용 섹션 추가(문서↔규칙 정합 명문화).

결과: lint error 24→8 (no-restricted-imports 0), tsc 0·vitest 33/33·build 0.

## 교훈
- **lint baseline의 "정책 위반"이 실은 규칙 설정 버그일 수 있다.** 규칙 메시지를 곧이곧대로 믿지 말고, 같은 정책을 기술한 문서(`*_RULES.md`)와 대조하라. 두 산출물이 충돌하면 그 자체가 결함이다.
- **eslint no-restricted-imports는 파일별 컨텍스트를 구분하지 못한다.** "crypto 컴포넌트만 stock import 금지" 같은 방향성 규칙은 글로벌 패턴으로 표현 불가 — 그건 문서/리뷰로 관리하고, 규칙은 부모 직접 import 차단 + 모듈 화이트리스트 거버넌스로 한정하는 게 현실적.
- orchestrator/signals/aggregation/mtf/divergence/candlestick은 자산-중립 범용. crypto.ts/stock.ts는 이들을 wrapping하는 자산별 진입점.

## 관련 파일
- `eslint.config.mjs`
- `docs/SSOT_SEPARATION_RULES.md`
- `lib/analysis/crypto.ts` (`analyzeMarket`·`AnalysisResult` re-export)
- `lib/analysis/{orchestrator,signals,aggregation}.ts` (범용 엔진)
- 메모리 `eslint-baseline-discrepancy`
