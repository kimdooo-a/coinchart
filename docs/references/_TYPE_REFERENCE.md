# Type Reference

> 프로젝트 전체 타입/인터페이스 인덱스
> 최종 업데이트: 2026-02-28

---

## 핵심 데이터 타입

### CandleData
- **위치**: `lib/api/binance.ts`
- **설명**: OHLCV 캔들 데이터 (Binance, 차트 공통)
- **필드**:
  - `time: number` — Unix timestamp (초)
  - `open: number`
  - `high: number`
  - `low: number`
  - `close: number`
  - `volume: number`
- **참고**: `lib/backtest/engine.ts`에도 동일 구조로 로컬 재선언 존재

### TickerData
- **위치**: `lib/api/binance.ts`
- **설명**: 실시간 가격 티커 데이터
- **필드**:
  - `symbol: string`
  - `price: number`
  - `changePercent: number` — 24시간 변동률

---

## TwelveData API 타입

### TwelveDataCandle
- **위치**: `lib/api/twelvedata.ts`
- **설명**: TwelveData API 캔들 데이터 (주식용)
- **필드**: `time`, `open`, `high`, `low`, `close`, `volume` (CandleData와 동일 구조)

### TwelveDataTicker
- **위치**: `lib/api/twelvedata.ts`
- **설명**: TwelveData 실시간 호가 데이터
- **필드**:
  - `symbol: string`
  - `price: number`
  - `changePercent: number`

---

## 분석 엔진 타입 (lib/analysis.ts)

### AnalysisResult (analysis.ts)
- **위치**: `lib/analysis.ts`
- **설명**: 기술적 분석 결과 (레거시 단일 분석)
- **필드**:
  - `recommendation: string` — 추천 ('강력 매수' ~ '강력 매도')
  - `score: number` — 정규화 점수
  - `indicators: IndicatorResult[]` — 개별 지표 결과 배열
  - `winRate: number` — 상승 확률 (0-100)
  - `lossRate: number` — 하락 확률 (0-100)
  - `priceLevels?` — 지지/저항/피봇/손절/이익실현/위험보상비율
  - `marketState: MarketState`
  - `volatility: { current, average, level }`
  - `meta?: { recCode: Signal, totalWeight }`

### IndicatorResult (analysis.ts)
- **위치**: `lib/analysis.ts`
- **설명**: 개별 기술 지표 분석 결과
- **필드**:
  - `name: string`
  - `signal: 'BUY' | 'SELL' | 'NEUTRAL'`
  - `value: number | string`
  - `winRate: number`
  - `message: string`
  - `meta?: { totalSignals?, weight?, confidence? }`

### MarketState
- **위치**: `lib/analysis.ts`
- **설명**: 시장 상태 분류
- **값**: `'TRENDING_UP' | 'TRENDING_DOWN' | 'RANGING' | 'VOLATILE' | 'UNCERTAIN'`

### AnalysisOptions
- **위치**: `lib/analysis.ts`
- **설명**: analyzeMarket 함수 옵션
- **필드**:
  - `lang?: 'en' | 'ko'`
  - `minCandles?: number`
  - `horizonBars?: number`
  - `rsiPeriod?: number`
  - `stochPeriod?: number`

---

## 지표 라이브러리 타입 (lib/indicators.ts)

### IndicatorResult (indicators.ts)
- **위치**: `lib/indicators.ts`
- **설명**: 단일 지표 해석 결과 (analyzeRSI, analyzeTrend 등)
- **필드**:
  - `value: number`
  - `signal: 'BUY' | 'SELL' | 'NEUTRAL'`
  - `interpretation: string`
- **참고**: `lib/analysis.ts`의 IndicatorResult와 이름은 같으나 구조가 다름

### 주요 내보내기 함수 시그니처
| 함수 | 반환 타입 | 설명 |
|------|----------|------|
| `calculateSMA(prices, period)` | `number[]` | 단순이동평균 |
| `calculateEMA(prices, period)` | `number[]` | 지수이동평균 |
| `calculateRSI(prices, period)` | `number[]` | RSI 배열 |
| `calculateMACD(prices)` | `{ macd, signal, histogram }` | MACD 3-Line |
| `calculateBollingerBands(prices)` | `{ middle, upper, lower }[]` | 볼린저 밴드 |
| `calculateStochastic(H, L, C)` | `{ k: number[], d: number[] }` | 스토캐스틱 |
| `calculateCCI(H, L, C, period)` | `number[]` | CCI |
| `calculateWilliamsR(H, L, C)` | `number[]` | 윌리엄스 %R |
| `calculateATR(H, L, C, period)` | `number[]` | ATR |
| `calculateADX(H, L, C, period)` | `{ adx, plusDI, minusDI }` | ADX + DI |
| `calculateOBV(closes, volumes)` | `number[]` | OBV |
| `calculateVWAP(H, L, C, V)` | `number[]` | VWAP |

---

## 시그널 엔진 타입 (lib/signal_engine.ts)

### Signal (signal_engine.ts)
- **위치**: `lib/signal_engine.ts`
- **설명**: 시장 스캔 시그널
- **필드**:
  - `symbol: string`
  - `type: 'BUY' | 'SELL' | 'WARNING' | 'INFO'`
  - `title: string`
  - `description: string`
  - `score: number` — 0-100 심각도
  - `timestamp: number`
  - `metrics?: string`

---

## 프랙탈 엔진 타입 (lib/fractal_engine.ts)

### PatternMatch
- **위치**: `lib/fractal_engine.ts`
- **설명**: 과거 유사 패턴 매칭 결과
- **필드**:
  - `startIndex: number`
  - `endIndex: number`
  - `similarity: number` — 0-100%
  - `nextMovePercent: number` — 이후 N캔들 수익률
  - `timestamp: string`

### FractalAnalysisResult
- **위치**: `lib/fractal_engine.ts`
- **설명**: 프랙탈 분석 종합 결과
- **필드**:
  - `symbol: string`
  - `recommendedPosition: 'BUY' | 'SELL' | 'WAIT'`
  - `confidence: number` — 0-100
  - `avgReturn: number` — 예상 수익률
  - `bestMatches: PatternMatch[]`

---

## 백테스트 타입

### BacktestResult
- **위치**: `lib/backtest.ts`
- **설명**: 단순 백테스트 결과 (analysis.ts에서 사용)
- **필드**:
  - `totalSignals: number`
  - `winRate: number` — 0-100
  - `profitability: number` — 평균 수익률 (%)
  - `horizonResults?: HorizonResult[]` — 다기간 결과

### HorizonResult
- **위치**: `lib/backtest.ts`
- **설명**: 개별 기간 백테스트 결과
- **필드**:
  - `horizon: number`
  - `winRate: number`
  - `totalSignals: number`
  - `profitability: number`

### Trade
- **위치**: `types/backtest.ts`
- **설명**: 개별 거래 기록
- **필드**:
  - `id: string`
  - `entryPrice: number`
  - `exitPrice: number`
  - `entryTime: number`
  - `exitTime: number`
  - `direction: 'LONG' | 'SHORT'`
  - `pnl: number`
  - `pnlPercent: number`

### BacktestMetrics
- **위치**: `types/backtest.ts`
- **설명**: 백테스트 종합 성과 지표
- **필드**:
  - `status: 'ok' | 'insufficient'`
  - `totalTrades, winRate, profitFactor, sharpeRatio`
  - `maxDrawdown, maxDrawdownPercent`
  - `avgTrade, bestTrade, worstTrade`
  - `avgWin, avgLoss`
  - `expectancy, totalReturn`
  - `sortinoRatio, calmarRatio, riskRewardRatio`
  - `maxConsecutiveWins, maxConsecutiveLosses`
  - `recoveryFactor, drawdownDuration`

### RollingWindowResult
- **위치**: `lib/backtest/engine.ts`
- **설명**: 롤링 윈도우 비교 결과 (전략 유효성 변화 감지)
- **필드**:
  - `recent90DayWinRate: number`
  - `allTimeWinRate: number`
  - `strategyDrift: boolean`
  - `driftMagnitude: number` — 차이 크기 (pp)

---

## 확률 엔진 타입 (lib/probability/)

### MarketRegime
- **위치**: `types/probability.ts`
- **값**: `'STRONG_UPTREND' | 'STRONG_DOWNTREND' | 'STRONG_TREND' | 'RANGING' | 'HIGH_VOLATILITY' | 'ACCUMULATION'`

### IndicatorSignal
- **위치**: `types/probability.ts`
- **설명**: 표준화된 지표 시그널 (확률 엔진 입력)
- **필드**:
  - `name: string`
  - `signal: 'BUY' | 'SELL' | 'NEUTRAL'`
  - `strength: number` — 0~1
  - `timestamp: number`

### ProbabilityResult
- **위치**: `types/probability.ts`
- **설명**: 확률 엔진 출력
- **필드**:
  - `direction: 'UP' | 'DOWN' | 'SIDEWAYS'`
  - `probability: number` — 상승 확률 (0-100)
  - `confidence: ConfidenceResult`
  - `regime: MarketRegime`
  - `signals: IndicatorSignal[]`

### ConfidenceResult
- **위치**: `types/probability.ts`
- **설명**: 신뢰도 평가 결과
- **필드**:
  - `score: number` — 0-100
  - `grade: ConfidenceGrade` — 'A' | 'B' | 'C' | 'D' | 'F'
  - `level: 'LOW' | 'MEDIUM' | 'HIGH'`
  - `factors: string[]`
  - `breakdown: { agreement, trend, volume, history, volatility }`
  - `dataQuality: { multiplier, issues }`

### ConfidenceGrade
- **위치**: `types/probability.ts`
- **값**: `'A' | 'B' | 'C' | 'D' | 'F'`

### RegimeInput (내부)
- **위치**: `lib/probability/regime.ts`
- **필드**: `adx?, atr?, price?, bbWidth?, plusDI?, minusDI?`

### ConfidenceInput (내부)
- **위치**: `lib/probability/confidence.ts`
- **필드**: `signals, adxValue?, volumeRatio?, historicalAccuracy?, atrValue?, avgAtrValue?, bbWidth?, sampleSize?, dataAgeSeconds?`

---

## 설명 생성 타입 (types/explanation.ts)

### ExplanationOutput
- **위치**: `types/explanation.ts`
- **설명**: 분석 설명 생성 결과
- **필드**:
  - `title: string`
  - `summary: string`
  - `keyFactors: string[]`
  - `regimeAnalysis: string`
  - `action: 'HOLD' | 'PARTIAL' | 'STOP_LOSS'`
  - `sections: { evidence, risk, watch }`
  - `flags: string[]`
  - `grade?: string`
  - `score?: number`
  - `isPro: boolean`

---

## 오케스트레이터 타입 (lib/analysis/orchestrator.ts)

### AnalysisInput
- **위치**: `lib/analysis/orchestrator.ts`
- **설명**: 분석 오케스트레이터 입력
- **필드**:
  - `symbol: string`
  - `timeframe: string`
  - `signals: IndicatorSignal[]`
  - `adxValue?, atrValue?, avgAtrValue?, bbWidth?`
  - `plusDI?, minusDI?`
  - `trades?: Trade[]`
  - `userTier: 'free' | 'pro'`
  - `dataAgeSeconds?, sampleSize?, volumeRatio?, historicalAccuracy?`
  - `dataSource?: 'supabase' | 'binance' | 'unknown'`
  - `candles?: CandleData[]` — MTF 분석용
  - `fractalResult?: FractalAnalysisResult`

### AnalysisResult (orchestrator.ts)
- **위치**: `lib/analysis/orchestrator.ts`
- **설명**: 분석 오케스트레이터 출력
- **필드**:
  - `probability: any`
  - `confidence: any`
  - `backtest: any`
  - `explanation: any`
  - `mtf?: MTFResult`
  - `fractal?: any`
  - `uiState: 'loading' | 'insufficient' | 'ok' | 'pro-locked'`
  - `flags: string[]`
  - `reasons: string[]`
- **참고**: `lib/analysis.ts`의 AnalysisResult와 이름이 같으나 완전히 다른 타입

---

## 크립토 분석 타입 (lib/analysis/crypto.ts)

### CryptoAnalysisInput
- **위치**: `lib/analysis/crypto.ts`
- **설명**: 크립토 전용 분석 입력 (SSOT: supabase only)
- **필드**: AnalysisInput과 유사, `dataSource: 'supabase'` 필수

### CryptoAnalysisResult
- **위치**: `lib/analysis/crypto.ts`
- **필드**:
  - `probability, confidence, backtest, explanation: any`
  - `uiState: 'loading' | 'insufficient' | 'ok' | 'pro-locked' | 'error'`
  - `dataSource: 'supabase'`

---

## 주식 분석 타입 (lib/analysis/stock.ts, stock-signals.ts)

### StockAnalysisInput
- **위치**: `lib/analysis/stock.ts`
- **설명**: 주식 전용 분석 입력 (SSOT: supabase only)
- **필드**: CryptoAnalysisInput과 유사, `period` 사용 (timeframe 대신)

### StockAnalysisResult
- **위치**: `lib/analysis/stock.ts`
- **필드**: CryptoAnalysisResult와 동일 구조

### StockPriceData (stock-signals.ts)
- **위치**: `lib/analysis/stock-signals.ts`
- **설명**: 주식 가격 데이터 (신호 생성용)
- **필드**: `time, open, high, low, close, volume, symbol, currency?, source?`

---

## 주식 SSOT 타입 (lib/analysis/stock/fetchStockSSOT.ts)

### StockCandleData
- **위치**: `lib/analysis/stock/fetchStockSSOT.ts`
- **설명**: Supabase stock_prices 테이블 데이터
- **필드**: `time, open, high, low, close, volume, symbol, currency?, source?`

### FetchStockSSOTOptions
- **위치**: `lib/analysis/stock/fetchStockSSOT.ts`
- **필드**: `symbol, limit?, startTime?, endTime?`

### FetchStockSSOTResult
- **위치**: `lib/analysis/stock/fetchStockSSOT.ts`
- **필드**: `success: boolean, data: StockCandleData[] | null, error: string | null, count: number`

---

## Supabase 데이터 타입

### CryptoPriceData
- **위치**: `lib/supabase/crypto.ts`
- **설명**: Supabase market_prices 테이블 크립토 데이터
- **필드**: `time, open, high, low, close, volume, symbol`

### StockPriceData (supabase)
- **위치**: `lib/supabase/stock.ts`
- **설명**: Supabase stock_prices 테이블 주식 데이터
- **필드**: `time, open, high, low, close, volume, symbol, currency, source`

---

## 시그널 분석 타입 (lib/analysis/signals.ts)

### MarketData
- **위치**: `lib/analysis/signals.ts`
- **설명**: generateSignals 함수 출력 (크립토 지표 + 시그널)
- **필드**:
  - `signals: IndicatorSignal[]`
  - `adxValue: number`
  - `plusDI: number`
  - `minusDI: number`
  - `atrValue: number`
  - `avgAtrValue: number`
  - `bbWidth: number | undefined`
  - `volumeRatio: number`
  - `rawIndicators: { RSI, StochK, StochD, CCI, MACD, WillR, ADX, BB, StdDev }`
  - `supportResistance?: { resistance, support, current }`

---

## 다이버전스/캔들스틱 타입 (lib/analysis/)

### DivergenceResult
- **위치**: `lib/analysis/divergence.ts`
- **설명**: 다이버전스 감지 결과
- **필드**:
  - `type: 'BULLISH' | 'BEARISH' | 'HIDDEN_BULLISH' | 'HIDDEN_BEARISH' | 'NONE'`
  - `signal: 'BUY' | 'SELL' | 'NEUTRAL'`
  - `strength: number` — 0.0 ~ 1.5
  - `description: string`

### CandlestickPattern
- **위치**: `lib/analysis/candlestick.ts`
- **설명**: 캔들스틱 패턴 인식 결과
- **필드**:
  - `pattern: string` — Doji, Hammer, Engulfing 등
  - `signal: 'BUY' | 'SELL' | 'NEUTRAL'`
  - `strength: number` — 단일: 0.6, 2캔들: 0.8, 3캔들: 1.0
  - `description: string`

---

## MTF 분석 타입 (lib/analysis/mtf.ts)

### MTFResult
- **위치**: `lib/analysis/mtf.ts`
- **설명**: 멀티 타임프레임 분석 결과
- **필드**:
  - `higherTfTrend: 'UP' | 'DOWN' | 'NEUTRAL'`
  - `alignment: boolean` — 일봉-주봉 추세 일치 여부
  - `confidence: number` — 0-100
  - `weeklySignals: { emaTrend, rsiZone, macdMomentum }`

---

## 컨텍스트 타입 (context/)

### LanguageContextType
- **위치**: `context/LanguageContext.tsx`
- **설명**: 언어 설정 컨텍스트
- **필드**:
  - `lang: 'ko' | 'en'`
  - `toggleLang: () => void`
  - `setLang: (lang: Language) => void`
  - `isHydrated: boolean`

---

## 훅 반환 타입 (components/hooks/)

### SubscriptionTier
- **위치**: `components/hooks/useSubscription.ts`
- **값**: `'free' | 'pro' | 'enterprise'`

### SubscriptionState (useSubscription 반환)
- **위치**: `components/hooks/useSubscription.ts`
- **필드**:
  - `tier: SubscriptionTier`
  - `isLoading: boolean`

---

## 설정 타입 (lib/config/)

### AppMode
- **위치**: `lib/config/gates.ts`
- **값**: `'dev' | 'staging' | 'prod'`

### FeatureGates
- **위치**: `lib/config/gates.ts`
- **설명**: 런타임 기능 게이트
- **필드**:
  - `appMode: AppMode`
  - `isDisabledAutomation: boolean`
  - `isDisabledProGate: boolean`
  - `isDevelopment, isStaging, isProduction: boolean`
