# R9 / T10 — scripts 디렉토리 타입 안전성 (any 제거) 인수인계서

- **라운드**: R9 (gap-verify) · **역할**: T10 / 10 · **도메인**: TypeScript 타입 안전성
- **작성일**: 2026-06-13
- **쓰기 천장**: `scripts/` (전체) — 천장 외 파일 0건 수정
- **핵심 원칙 준수**: 타입 주석만 변경, 런타임 동작 불변. `as any` / `as unknown as X` / `@ts-ignore` / `@ts-expect-error` 신규 추가 0건.

## 한 줄 요약 (지휘자 보고용)

> **scripts/ `any` 43건(실측, 문서 추정 23건보다 많음) → 0건 완전 제거. `unknown`+타입가드·기존 타입 재사용으로 처리, `as any` 2건도 부수 제거. `tsc --noEmit` 0 유지, 부수효과 없는 verify_explanation dry-run PASS, ESLint no-explicit-any/no-restricted-imports 위반 0.**

---

## 1. 전/후 카운트 (파일별)

> 베이스라인 측정: `grep -rn ": any" scripts/` = **43건 / 15개 파일** (작업 문서의 "23건" 추정치보다 실제로 더 많았음).
> 작업 후: `: any` / `as any` / `as unknown as` / `@ts-ignore` / `@ts-expect-error` / `any[]` / `Array<any>` / `<any>` 통합 스캔 = **0건**.

| 파일 | 전 (`: any`) | 후 | 패턴 |
|------|:---:|:---:|------|
| `batch_orchestrator.ts` | 6 | 0 | catch 6건 |
| `alert_engine.ts` | 8 | 0 | 콜백 시그니처 4 + evaluateConditions 2 + catch 4 → 합 8 (※ 콜백 2줄에 각 2개) |
| `batch_analysis.ts` | 4 | 0 | `result?: any` 1 + catch 3 |
| `preflight.ts` | 4 | 0 | catch 4 |
| `report_generator.ts` | 3 | 0 | `StateChange.from/to` 2 + catch 1 |
| `update-market-data.ts` | 3 | 0 | Yahoo 콜백 `(d: any)` 3 |
| `seed_prices_v2.ts` | 3 | 0 | Yahoo 콜백 `(d: any)` 3 |
| `healthcheck.ts` | 2 | 0 | catch 2 |
| `verify_explanation.ts` | 2 | 0 | `regime: any`, `grade: any` |
| `seed_bch.ts` | 2 | 0 | `klines: any[]`, `(k: any[])` |
| `release_quality_gate.ts` | 2 | 0 | catch 2 (`error.stderr`, `e.toString()`) |
| `weekly_cron.ts` | 1 | 0 | catch 1 |
| `seed_prices.ts` | 1 | 0 | Yahoo 콜백 `(p: any)` 1 |
| `daily_cron.ts` | 1 | 0 | catch 1 |
| `debug_analysis.ts` | 1 | 0 | `candles: any[]` |
| **합계** | **43** | **0** | |

### 보너스 — 기존 `as any` 제거 (베이스라인 43건 외, 별도 발견)

| 파일 | 위치 | 처리 |
|------|------|------|
| `verify_explanation.ts` | `grade: 'A' as any` | `grade: 'A'` (`'A'`는 `ConfidenceGrade` 유효값 → 단언 불필요) |
| `migrate-blog-content-to-html.ts` | `post.content as any` (+ `eslint-disable` 주석) | `post.content as JSONContent` (`@tiptap/core` 타입 정식 좁히기) + disable 주석 제거 |

---

## 2. 파일별 변경 요약 (어떤 패턴 → 어떤 타입)

### 2-1. catch 블록 (대다수) — 표준 가드 패턴
`catch (error: any)` → `catch (error: unknown)` + `const message = error instanceof Error ? error.message : String(error);`
`error.stack` 접근부는 `const stack = error instanceof Error ? error.stack : undefined;`
- 적용: `daily_cron`, `weekly_cron`, `healthcheck`(2), `preflight`(4), `batch_orchestrator`(6), `batch_analysis`(3), `report_generator`(1), `alert_engine`(일부)
- `logger`(`lib/logger.ts`)는 `...args: unknown[]` 시그니처라 `stack: string | undefined` 전달이 안전.

### 2-2. `alert_engine.ts` (특수 — error.code)
`catch (error: any)` 에서 `error.code === 'PGRST116'` 접근 → `error && typeof error === 'object' && 'code' in error && error.code === 'PGRST116'` 가드 (런타임 동치: code 부재 시 기존에도 false 분기).

### 2-3. `release_quality_gate.ts` (특수)
- `error.stderr.toString().trim()` → `error && typeof error === 'object' && 'stderr' in error && error.stderr` 가드 후 `String(error.stderr).trim()` (Buffer→String 동치).
- `e.toString()` → `String(e)` (Error 객체에 대해 동일 출력).

### 2-4. `batch_analysis.ts` — `result?: any`
신규 `BatchAnalysisResult` 인터페이스 정의 (export). **기존 분석 반환 타입을 `Pick`으로 재사용**:
```ts
export interface BatchAnalysisResult {
    probability: Pick<ProbabilityResult, 'probability'>;
    confidence: Pick<ConfidenceResult, 'grade'>;
    signals?: Array<{ type?: string }>;
}
```
- **설계 근거**: 소비처(`report_generator`, `alert_engine`)가 `result.signals` / `signal.type` 를 읽는데, 실제 반환 타입 `AnalysisResult`/`StockAnalysisResult`에는 `signals` 필드가 **없음**(speculative/dead 접근). 따라서 실제 union으로 좁히면 소비처가 컴파일 에러 → 런타임(`.signals` 분기) 제거가 불가피해짐(금지). 대신 "소비처가 읽는 필드"만 모은 구조적 타입을 정의하되, `probability`/`confidence` 내부 형태는 실제 타입을 `Pick`으로 재사용해 정합성 유지.
- `AnalysisResult`/`StockAnalysisResult` 모두 이 타입에 **구조적 할당 가능**(probability·confidence 보유, signals optional) → 생산부 무손상.

### 2-5. `alert_engine.ts` — 콜백/evaluateConditions
- `condition: (current: BatchAnalysisResult, previous: BatchAnalysisResult | null) => boolean` (조건은 `if(!previous) return false` 가드 보유 → nullable 허용).
- `message: (current: BatchAnalysisResult, previous: BatchAnalysisResult) => string` (message는 조건 true(=previous 존재)일 때만 호출 → non-null).
- 호출부 `condition.message(current, previous!)` — **non-null 단언(`!`)** 사용. 근거: 모든 condition이 `!previous`에서 false를 반환하므로 `triggered === true ⟹ previous !== null` 불변식이 성립. (현재 호출부는 항상 `null` 전달 → 조건 전부 false → message 미호출, 즉 dead path라 실질 영향 0.) `as any`/`@ts-ignore` 아님.

### 2-6. `report_generator.ts`
- `StateChange.from/to: any` → `unknown` (해당 배열 `stateChanges`는 현재 코드상 항상 `[]`, 미할당 → unknown 안전).
- `record.result` 접근부는 `BatchAnalysisResult`로 자동 정합 (probability·confidence·signals 모두 컴파일).

### 2-7. `verify_explanation.ts`
- `mockProb(prob, regime: any)` → `regime: MarketRegime` (`types/probability`).
- `mockConf(grade: any)` → `grade: ConfidenceGrade`.
- `grade: 'A' as any` → `grade: 'A'`.

### 2-8. `seed_bch.ts`
- Binance klines 응답을 12-요소 튜플 `BinanceKline = [number, string×5, number, string, number, string×3]`로 정의. `klines: any[]` → `BinanceKline[]`, `(k: any[])` → 추론(`(k)`). 가격(string)→`parseFloat`, 시간(number)→`new Date` 모두 정합.

### 2-9. Yahoo Finance 스크립트 3종 (`seed_prices`, `seed_prices_v2`, `update-market-data`)
- 각 파일에 로컬 `YahooChartResponse` / `YahooChartResult` / `YahooQuote` 인터페이스 정의(사용 필드만; OHLCV 배열은 `(number | null)[]`).
- `const data = await res.json()` → `const data: YahooChartResponse = await res.json()`.
- `.filter((p/d: any) => ...)` / `.map((d: any) => ...)` → 어노테이션 제거(추론). 응답 타입화로 `timestamps`/`quote`/`cleanData` 전 체인 정합.
- 신규 **타입 파일**은 만들지 않음(로컬 인터페이스만; 3파일 소량 중복은 자기완결성·import 결합 최소화 목적).

### 2-10. `debug_analysis.ts`
- `const candles: any[] = []` → `CandleData[]` (`lib/api/binance`의 기존 타입 재사용, push 객체 형태와 정확히 일치, `analyzeMarket(candles, ...)` 시그니처와 정합).

---

## 3. `unknown`+가드로 남긴 / 부득이 남긴 케이스

- **부득이하게 남긴 `any`: 0건.** scripts/ 전체 `any` 패턴 스캔 결과 0.
- **`unknown`으로 남긴(정당) 케이스**:
  - 모든 catch `error`/`e`: `unknown` + `instanceof Error` 가드 (스로된 값의 타입을 정적으로 알 수 없음 → 표준 처리).
  - `StateChange.from/to`: `unknown` (메트릭 전/후 값은 number·string 등 가변, 현재 미할당).
  - `release_quality_gate` `error.stderr`: `'stderr' in error` 가드 후 `String()` (execSync 에러 객체 형태 비표준).
- **non-`as any` 단언 사용처(허용 범위)**:
  - `alert_engine` 호출부 `previous!` (불변식 기반 non-null 단언).
  - `migrate-blog-content-to-html` `as JSONContent` (`as any` 대체, 정식 좁히기).
  - 기존 `grade as keyof typeof gradeMap`(alert_engine)는 사전 존재·정당 → 유지.

---

## 4. 검증 결과

| 항목 | 결과 |
|------|------|
| `npx tsc --noEmit` (작업 전) | **0** (베이스라인 클린) |
| `npx tsc --noEmit` (작업 후) | **0** ✅ |
| scripts/ `any` 패턴 잔여 | **0** (전 43 → 후 0) ✅ |
| dry-run `npx tsx scripts/verify_explanation.ts` | **`✅ ALL CHECKS PASSED`, exit 0** (부수효과 없는 순수 테스트, 런타임 불변 입증) ✅ |
| ESLint `no-explicit-any` 위반 | **0** ✅ |
| ESLint `no-restricted-imports`(SSOT 교차) 위반 | **0** ✅ |

### ESLint 잔여 항목 (T10 범위 밖 / 기존 이슈, 미수정)
`npx eslint scripts/` 는 exit 1이나, 4 errors·10 warnings 모두 **본 작업과 무관한 사전 존재 이슈**:
- `batch_analysis.ts:382 prefer-const` (`let symbols`, 내가 수정 안 한 라인) — any와 무관.
- `check_bch_cjs.js`, `preflight.ts:159` `no-require-imports` — 기존 require 사용.
- 다수 `no-unused-vars` warning (collect_kpi, healthcheck:228 validateConfiguration의 `catch(error)` 등) — 기존.
→ T10은 "any 제거" 전담이므로 위 항목은 손대지 않음(다른 라운드/역할 후보).

---

## 5. 천장 / 충돌 / 후속

- **쓰기 천장 준수**: 수정 파일 전부 `scripts/` 내부. `lib/`·`types/`·`docs/references/`는 읽기만(타입 재사용 참조).
- **SSOT**: crypto↔stock 교차 import 신규 0건. 추가한 import는 타입 전용(`ProbabilityResult`/`ConfidenceResult`/`MarketRegime`/`ConfidenceGrade`/`CandleData`/`JSONContent`)뿐.
- **다른 역할(T01~T09)과 충돌 없음**: scripts 전용 천장, 타 디렉토리 무수정.
- **수정 파일 16개**: daily_cron, weekly_cron, healthcheck, preflight, batch_orchestrator, batch_analysis, alert_engine, report_generator, release_quality_gate, verify_explanation, seed_bch, seed_prices, seed_prices_v2, update-market-data, debug_analysis, migrate-blog-content-to-html.
- **커밋 여부**: 일꾼 터미널은 통합 cs를 수행하지 않으므로 **미커밋 상태로 산출물(코드 변경 + 본 handover)만 남김**. 통합 커밋은 지휘자(conductor) 라운드 마감 시 회수·수행.

### 내부 병렬 전략 메모
작업 문서는 worktree/Workflow 병렬을 권장했으나, 본 작업은 43건 중 대다수가 **동일한 `catch (error: any)` 가드 패턴**의 기계적 치환이고 `BatchAnalysisResult` 공유 타입이 `batch_analysis → report_generator/alert_engine` 로 **파일 간 의존**을 만들므로(병렬 시 타입가드 패턴 불일치·머지 마찰 위험), **단일 일관 패스로 직접 처리**하는 것이 일관성·안전성에서 우월하다고 판단하여 그렇게 수행함. tsc 0·dry-run PASS로 결과 동치 확인.
