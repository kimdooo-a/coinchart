# R9 / T07 — Analysis·Stock 대형 컴포넌트 리팩토링 + 라이트화 (handover)

> 라운드 **R9 (gap-verify)** / 역할 **T07 / 10**
> 작성일: 2026-06-13 / 작성: 일꾼 터미널 (통합 cs는 지휘자 수행)
> SOT: `docs/orchestration/2026-06-13-R9-gap-verify/T07-analysis-stock-refactor.md`

## 1. 요약

Analysis 영역 3개 대형 컴포넌트를 **동작 동등(behavior-preserving)** 으로 분할·훅 추출하고, 천장 4영역(`components/Analysis/`, `components/Stock/`, `components/hooks/`, `app/analysis/`)에 남아 있던 **다크 톤 잔재를 전부 라이트화**했다. 기능 회귀 없이 구조와 대비만 개선.

- (A) `TradingStrategyGuide.tsx` — AI 박스 라이트화 + 하위 3컴포넌트 분할
- (B) `AnalysisPanel.tsx` — fetch·analysis 로직 2개 커스텀 훅 추출 (본문 < 250줄)
- (C) `app/analysis/[symbol]/page.tsx` — 6개 컴포넌트 모듈화 + 라이트화
- (D) 미사용 backtest import 정리 → **제거 대상 없음** (호출처 살아있어 보존, 아래 §5)
- (보강) 작업 항목 외 천장 내 잔재(`ChartAnalysisPanel`·`StockPanel`·`AnalysisPanel` 백테스트 카드·stock 페이지·`StockRSIHeatmap`) 라이트화 — 검증 4번(천장 4영역 다크 잔재 0) 충족용

## 2. 분할 전후 줄수 표

| 파일 | before | after | 비고 |
|------|-------:|------:|------|
| `components/Analysis/TradingStrategyGuide.tsx` | 372 | 242 | 부모(상태·계산 로직 유지), 경로 불변 |
| `components/Analysis/AnalysisPanel.tsx` | 359 | 249 | 본문 < 250 목표 달성 |
| `app/analysis/[symbol]/page.tsx` | 807 | 441 | fetch useEffect·상태·분기 골격 유지, JSX 카드 분리 |

## 3. 신설 컴포넌트 / 훅 목록

### TradingStrategyGuide 분할 (`components/Analysis/TradingStrategyGuide/`)
| 파일 | 줄수 | 역할 |
|------|-----:|------|
| `AIAdviceSection.tsx` | 28 | AI 요약 박스 (aiAdvice·t props) |
| `ConfigSection.tsx` | 89 | 매매스타일·진입스타일·손절 슬라이더 설정 UI |
| `EntryPlanSection.tsx` | 101 | 진입 계획표(1·2·3차 + StopLoss 카드), getEntryComment 포함 |
| `types.ts` | 25 | 공용 타입 `TradingStyle`/`EntryStyle`/`TStrings` |

상태(`tradingStyle`/`entryStyle`/`stopLossPercent`)·계산(`getAIAdvice`/`getEntryLevels`/`getSplitRatios`/`useEffect`/`t`)은 부모 유지, 결과/콜백만 props 전달.

### AnalysisPanel 훅 추출 (`components/hooks/`)
| 파일 | 줄수 | 시그니처 |
|------|-----:|----------|
| `useAnalysisCandles.ts` | 84 | `(symbol, interval) → { candles, isLoading, error }` — `/api/klines` fetch + `aggregateCandles` |
| `useAnalysisResult.ts` | 66 | `(candles, symbol, interval, userTier) → AnalysisResult \| null` — `generateSignals` + `generateHistoricalTrades` + `performAnalysis` |

`CandleData` 타입은 `useAnalysisCandles`에서 export하고 `AnalysisPanel`이 `export type { CandleData }`로 재노출 → 외부(`lib/analysis/aggregation`) import 경로 호환 유지.

### analysis/[symbol] 모듈화 (`app/analysis/[symbol]/_components/`)
| 파일 | 줄수 | props |
|------|-----:|-------|
| `AnalysisHeader.tsx` | 78 | symbol, lang, setLang, avgPrice, currentPrice, t, onBack (getPriceColor 내장) |
| `ChartSection.tsx` | 46 | loading, historyData, avgPrice, symbol, t |
| `ProbabilityConfidenceCards.tsx` | 80 | analysisResult, lang (badge variant 헬퍼 내장) |
| `ExplanationCard.tsx` | 94 | analysisResult, lang |
| `BacktestCard.tsx` | 113 | analysisResult, userTier, lang (PRO gate 포함) |
| `PositionFractalCards.tsx` | 97 | avgPrice, historyData, fractalResult, t, lang |

fetch useEffect·useState·useRef(StrictMode guard)·interval 정리·4 uiState 분기는 page.tsx 유지.

## 4. 라이트화한 클래스 매핑

### (A) TradingStrategyGuide
| 위치 | before | after |
|------|--------|-------|
| 상승/강력매수 박스 | `text-green-400 border-green-500 bg-green-900/20` | `bg-green-50 text-green-700 border-green-300` |
| 매수 박스 | `text-green-300 border-green-500/50 bg-green-900/10` | `bg-green-50 text-green-700 border-green-200` |
| 하락/매도 박스 | `text-red-400 border-red-500 bg-red-900/20` | `bg-red-50 text-red-700 border-red-300` |
| 선택 버튼 그림자 | `shadow-blue-900/50` | `shadow-blue-200` |
| stopLoss 퍼센트 | `text-red-400` | `text-red-600` |
| Entry 1차 카드 | `bg-blue-900/20 border-blue-500/50` | `bg-blue-50 border-blue-300` |
| Stop Loss 카드 | `bg-red-900/10 border-red-500/50` / `text-red-400` / `text-red-300/70` / `bg-red-500/10` | `bg-red-50 border-red-300` / `text-red-700` / `text-red-600` / `bg-red-100` |

### (C) app/analysis/[symbol]/page.tsx (분리 컴포넌트 포함)
| 위치 | before | after |
|------|--------|-------|
| 에러/insufficient/프랙탈 카드 border | `border-red-800`/`border-orange-800`/`border-indigo-800` | `border-*-300` |
| 프랙탈 desc | `bg-indigo-900/30 text-indigo-300` | `bg-indigo-50 text-indigo-700` |
| PRO lock 오버레이 | `bg-on-surface/40` | `bg-on-surface/20` |
| 확률·등급·라벨 의미색 | `text-{green,red,blue,yellow,orange,purple,indigo}-400` | `...-600` |
| 가격/포지션 손익 | `text-green-500`/`text-red-500` | `text-green-600`/`text-red-600` |

### (보강) 작업 항목 외 천장 내 잔재
| 파일 | before → after |
|------|----------------|
| `AnalysisPanel.tsx` 백테스트 카드 | `text-red-400`/`text-blue-400`/`text-indigo-400` → `-600` |
| `ChartAnalysisPanel.tsx` 관망·돌파·StopLoss 박스 | `bg-blue-900/20`·`bg-red-900/20`·`text-{blue,indigo,purple,red}-400`·`text-blue-200/80`·`text-red-400/70` → `bg-*-50`·`border-*-300`·`text-*-700`/`-600` |
| `StockPanel.tsx` 타이틀·지표·근거 | `text-{green,red,blue,yellow}-400` → `-600` |
| `app/analysis/stock/page.tsx`, `app/analysis/stock/[symbol]/page.tsx` 헤더 | `text-green-400` → `text-green-600` |
| `StockRSIHeatmap.tsx` 변화율 | `text-green-300`/`text-red-300` → `text-green-700`/`text-red-700` |

**의미색 보존**: green=상승/매수, red=하락/매도 방향 의미는 전부 유지. 라이트 배경 대비만 교정(`-400→-600/-700`, `-900 배경→-50`). 심볼 제목 gradient·장식 bar fill·BETA 배지는 의도상 유지.

## 5. (D) 미사용 import 판정 결과

`generateHistoricalTrades` 는 **두 곳 모두 실제 호출 중** → 제거하지 않음.
- `components/Analysis/AnalysisPanel.tsx`: result useMemo에서 호출 → R9에서 `useAnalysisResult.ts` 훅으로 **이동**(보존).
- `components/Stock/StockAnalysisPanel.tsx`(SOT 문서의 `Analysis/StockAnalysisPanel`는 실제 경로 `Stock/`): 91행에서 호출 중 → **그대로 유지**(미수정).

AnalysisPanel 훅 추출 과정에서 정리한 데드코드(렌더 무영향): 미사용 state `isGuideOpen`/`error`/`showUpgradeModal`, 미사용 const `isPro`/`isLocked`, 미사용 번역 키 4개(`basis`/`loading`/`proLock`/`guideTitle`), destructure 미사용 `rawIndicators`.

## 6. 검증 결과

| 항목 | 결과 |
|------|------|
| `npx tsc --noEmit` | **0 에러** (clean) |
| `npm run build` | **green** (전 라우트 빌드 성공) |
| 다크 잔재 grep (천장 4영역, `bg-*-900`·`text-*-400`·`text-*-300/200`) | **0 매치** |
| 줄수 | TradingStrategyGuide 372→242, AnalysisPanel 359→249(<250), page 807→441 |
| 미사용 import | `generateHistoricalTrades` 호출처 살아있어 보존(이동) |

> ESLint 참고: `useAnalysisResult.ts`의 `Date.now()`는 memo 계산 시점 현재 시각 읽기 의도라 `eslint-disable-next-line react-hooks/purity` 처리. `no-restricted-imports`(orchestrator/signals)는 **원본 AnalysisPanel에 이미 존재하던 규칙(SSOT 데이터 교차가 아닌 분석 lib 공용 import)** 을 그대로 이전한 것으로 신규 위반 아님. Crypto↔Stock 데이터 SSOT 교차 import 신규 추가 없음.

## 7. 내부 병렬 내역

- **모드**: 3슬라이스 병렬(서브에이전트 3개, 동일 워크스페이스). 3개 대형 파일이 서로 다른 파일이고 신설 파일 경로(`TradingStrategyGuide/`, `components/hooks/`, `_components/`)가 겹치지 않아 worktree 격리 없이도 파일 충돌 없음.
  - 슬라이스1: TradingStrategyGuide.tsx 분할 + 라이트화
  - 슬라이스2: AnalysisPanel.tsx 훅 추출 + (D) 판정
  - 슬라이스3: app/analysis/[symbol]/page.tsx 모듈화 + 라이트화
- `_COMPONENT_MAP.md` 갱신은 병렬 동시 편집 충돌 방지를 위해 **머지 후 지휘 단계에서 한 번에** 수행.
- 최종 통합 검증(tsc/build/grep)과 작업 항목 외 잔재 보강은 병렬 종료 후 단일 수행.

## 8. 변경 파일 목록 (천장 내)

신설:
- `components/Analysis/TradingStrategyGuide/{AIAdviceSection,ConfigSection,EntryPlanSection,types}.tsx|ts`
- `components/hooks/{useAnalysisCandles,useAnalysisResult}.ts`
- `app/analysis/[symbol]/_components/{AnalysisHeader,ChartSection,ProbabilityConfidenceCards,ExplanationCard,BacktestCard,PositionFractalCards}.tsx`

수정:
- `components/Analysis/{TradingStrategyGuide,AnalysisPanel,ChartAnalysisPanel,StockPanel}.tsx`
- `components/Stock/StockRSIHeatmap.tsx`
- `app/analysis/[symbol]/page.tsx`
- `app/analysis/stock/page.tsx`, `app/analysis/stock/[symbol]/page.tsx`

레퍼런스:
- `docs/references/_COMPONENT_MAP.md` (Analysis 테이블 + 신설 훅·분할 컴포넌트 추가)

> `lib/chart/theme.ts`·`components/Chart/`·타 라우트 미수정. git status의 타 디렉토리(`app/api/`, `components/Blog/`, `components/SecureMemo/`, `components/community/`, `scripts/`, `lib/community/`, `__tests__/`, `e2e/`, `supabase/`, `types/`)는 **타 일꾼 터미널(R9 다른 역할) 작업**이며 본 역할 변경 아님.

## 9. 완료 신호

- handover 작성 완료(본 문서). 일꾼이므로 cs/커밋 생략 — 통합 cs·커밋은 지휘자 수행.
- 천장 밖 파일 변경 0 (본 역할 기준).
