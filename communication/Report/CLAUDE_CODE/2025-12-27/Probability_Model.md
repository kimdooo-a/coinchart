# PROBABILITY MODEL — 확률 계산 로직 고도화

**Version**: 1.0
**Date**: 2025-12-27
**Author**: Claude Code
**Constraint**: ML 모델 / 외부 LLM 호출 금지

---

## 1. 현재 문제점 분석

### 1-A. 기존 확률 계산의 한계

```typescript
// 현재 코드 (backtest.ts)
const isWin = exitPrice > entryPrice;
winRate = (wins / total) * 100;  // 단순 비율
```

**문제점:**
1. **이진 분류만 존재** — 0.01% 상승도 "상승", 10% 상승도 "상승"
2. **크기 무시** — 작은 상승/큰 하락 조합이면 손실인데 승률 높게 표시
3. **맥락 없음** — "왜 이 확률인가?" 설명 불가
4. **시장 상태 미반영** — 추세장/횡보장 구분 없이 동일 계산
5. **신뢰구간 부재** — 샘플 수 적어도 "60%" 표시

---

## 2. 고도화된 확률 모델 설계

### 2-A. 다차원 확률 구조

```typescript
interface ProbabilityResult {
  // 방향 확률 (기존)
  riseProb: number;           // 상승 확률 (0-100)
  dropProb: number;           // 하락 확률 (0-100)

  // 크기별 확률 (신규)
  magnitude: {
    strongRise: number;       // +3% 이상 상승 확률
    moderateRise: number;     // +1~3% 상승 확률
    slightRise: number;       // 0~1% 상승 확률
    slightDrop: number;       // 0~-1% 하락 확률
    moderateDrop: number;     // -1~-3% 하락 확률
    strongDrop: number;       // -3% 이상 하락 확률
  };

  // 신뢰도 지표
  confidence: {
    score: number;            // 0-100 (샘플수/일관성 기반)
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    sampleSize: number;
    consistency: number;      // 지표간 일치도
  };

  // 기대값
  expectedReturn: number;     // 기대 수익률 (%)
  riskRewardRatio: number;    // 손익비

  // 조건부 확률
  conditional: {
    givenUptrend: number;     // 상승추세일 때 상승 확률
    givenDowntrend: number;   // 하락추세일 때 상승 확률
    givenHighVolatility: number;
    givenLowVolatility: number;
  };
}
```

### 2-B. 확률 계산 엔진

```typescript
// lib/probability/engine.ts

interface ProbabilityConfig {
  lookForward: number;        // 예측 기간 (캔들 수)
  minSamples: number;         // 최소 샘플 수 (기본 30)
  magnitudeThresholds: {
    strong: number;           // ±3%
    moderate: number;         // ±1%
  };
}

function calculateProbability(
  candles: CandleData[],
  currentSignal: SignalState,
  config: ProbabilityConfig
): ProbabilityResult {

  // 1. 동일 시그널 히스토리 추출
  const historicalMatches = findHistoricalMatches(candles, currentSignal);

  // 2. 각 매치에 대한 결과 계산
  const outcomes = historicalMatches.map(match => {
    const entryPrice = candles[match.index].close;
    const exitPrice = candles[match.index + config.lookForward]?.close;
    if (!exitPrice) return null;

    const returnPct = ((exitPrice - entryPrice) / entryPrice) * 100;
    const regime = classifyRegime(candles, match.index);

    return { returnPct, regime, similarity: match.similarity };
  }).filter(Boolean);

  // 3. 크기별 분류
  const magnitude = classifyByMagnitude(outcomes, config.magnitudeThresholds);

  // 4. 가중 확률 계산 (유사도 기반 가중치)
  const weightedProb = calculateWeightedProbability(outcomes);

  // 5. 조건부 확률
  const conditional = calculateConditionalProbability(outcomes);

  // 6. 신뢰도 계산
  const confidence = calculateConfidence(outcomes, config.minSamples);

  // 7. 기대값 계산
  const expectedReturn = calculateExpectedReturn(outcomes);
  const riskRewardRatio = calculateRiskReward(outcomes);

  return {
    riseProb: weightedProb.rise,
    dropProb: weightedProb.drop,
    magnitude,
    confidence,
    expectedReturn,
    riskRewardRatio,
    conditional
  };
}
```

### 2-C. 시그널 상태 정의 (매칭 기준)

```typescript
interface SignalState {
  // 단일 지표 상태
  rsi: 'OVERSOLD' | 'NEUTRAL' | 'OVERBOUGHT';
  macd: 'BULLISH_CROSS' | 'BEARISH_CROSS' | 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  stochastic: 'OVERSOLD' | 'NEUTRAL' | 'OVERBOUGHT';
  bollinger: 'LOWER_TOUCH' | 'MIDDLE' | 'UPPER_TOUCH';

  // 복합 상태
  regime: MarketRegime;
  volumeState: 'SURGE' | 'NORMAL' | 'DRY';
  priceAction: 'BREAKOUT' | 'PULLBACK' | 'CONSOLIDATION';
}

function matchSignalState(
  current: SignalState,
  historical: SignalState
): number {
  let matchScore = 0;
  let totalWeight = 0;

  // 가중치 정의
  const weights = {
    regime: 3.0,        // 시장 상태 가장 중요
    rsi: 2.0,
    macd: 2.0,
    stochastic: 1.5,
    bollinger: 1.5,
    volumeState: 1.0,
    priceAction: 2.0
  };

  // 각 요소 비교
  if (current.regime === historical.regime) {
    matchScore += weights.regime;
  }
  totalWeight += weights.regime;

  if (current.rsi === historical.rsi) {
    matchScore += weights.rsi;
  }
  totalWeight += weights.rsi;

  // ... 나머지 요소들

  return (matchScore / totalWeight) * 100;  // 0-100% 유사도
}
```

### 2-D. 크기별 확률 분류

```typescript
function classifyByMagnitude(
  outcomes: Outcome[],
  thresholds: { strong: number; moderate: number }
): MagnitudeProbability {
  const total = outcomes.length;
  if (total === 0) return getDefaultMagnitude();

  const counts = {
    strongRise: 0,
    moderateRise: 0,
    slightRise: 0,
    slightDrop: 0,
    moderateDrop: 0,
    strongDrop: 0
  };

  outcomes.forEach(o => {
    const r = o.returnPct;
    if (r >= thresholds.strong) counts.strongRise++;
    else if (r >= thresholds.moderate) counts.moderateRise++;
    else if (r >= 0) counts.slightRise++;
    else if (r >= -thresholds.moderate) counts.slightDrop++;
    else if (r >= -thresholds.strong) counts.moderateDrop++;
    else counts.strongDrop++;
  });

  return {
    strongRise: (counts.strongRise / total) * 100,
    moderateRise: (counts.moderateRise / total) * 100,
    slightRise: (counts.slightRise / total) * 100,
    slightDrop: (counts.slightDrop / total) * 100,
    moderateDrop: (counts.moderateDrop / total) * 100,
    strongDrop: (counts.strongDrop / total) * 100
  };
}
```

---

## 3. 신뢰도 계산 모델

### 3-A. 다요소 신뢰도 공식

```typescript
interface ConfidenceFactors {
  sampleSize: number;         // 샘플 수 기반 (0-30)
  consistency: number;        // 지표 일치도 (0-25)
  recency: number;            // 최근성 가중치 (0-20)
  regimeMatch: number;        // 시장 상태 일치 (0-15)
  volatilityPenalty: number;  // 변동성 감점 (-10~0)
}

function calculateConfidence(
  outcomes: Outcome[],
  minSamples: number
): ConfidenceResult {

  // 1. 샘플 수 점수 (30점 만점)
  // 30개 미만이면 감점, 100개 이상이면 만점
  const sampleScore = Math.min(30, (outcomes.length / 100) * 30);

  // 2. 일관성 점수 (25점 만점)
  // 결과의 표준편차가 낮을수록 높은 점수
  const returns = outcomes.map(o => o.returnPct);
  const stdDev = calculateStdDev(returns);
  const avgAbsReturn = average(returns.map(Math.abs));
  const cv = stdDev / (avgAbsReturn + 0.001);  // 변동계수
  const consistencyScore = Math.max(0, 25 - cv * 5);

  // 3. 최근성 점수 (20점 만점)
  // 최근 결과가 전체 결과와 일치할수록 높은 점수
  const recentOutcomes = outcomes.slice(-20);
  const recentWinRate = recentOutcomes.filter(o => o.returnPct > 0).length / recentOutcomes.length;
  const totalWinRate = outcomes.filter(o => o.returnPct > 0).length / outcomes.length;
  const recencyScore = 20 - Math.abs(recentWinRate - totalWinRate) * 40;

  // 4. 시장 상태 일치 점수 (15점 만점)
  const regimeMatchRate = outcomes.filter(o => o.regimeMatched).length / outcomes.length;
  const regimeScore = regimeMatchRate * 15;

  // 5. 변동성 감점 (-10~0)
  const currentVolatility = calculateCurrentVolatility();
  const volatilityPenalty = currentVolatility > 5 ? -10 : currentVolatility > 3 ? -5 : 0;

  // 최종 점수
  const totalScore = Math.max(0, Math.min(100,
    sampleScore + consistencyScore + recencyScore + regimeScore + volatilityPenalty
  ));

  // 등급 변환
  const grade = totalScore >= 80 ? 'A' :
                totalScore >= 65 ? 'B' :
                totalScore >= 50 ? 'C' :
                totalScore >= 35 ? 'D' : 'F';

  return {
    score: Math.round(totalScore),
    grade,
    sampleSize: outcomes.length,
    consistency: consistencyScore,
    breakdown: {
      sampleScore,
      consistencyScore,
      recencyScore,
      regimeScore,
      volatilityPenalty
    }
  };
}
```

### 3-B. 신뢰구간 계산

```typescript
function calculateConfidenceInterval(
  probability: number,
  sampleSize: number,
  confidenceLevel: number = 0.95
): { lower: number; upper: number } {
  // 윌슨 스코어 구간 (소표본에서 더 정확)
  const z = confidenceLevel === 0.95 ? 1.96 :
            confidenceLevel === 0.99 ? 2.576 : 1.645;

  const p = probability / 100;
  const n = sampleSize;

  const denominator = 1 + z * z / n;
  const center = (p + z * z / (2 * n)) / denominator;
  const margin = (z / denominator) * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n));

  return {
    lower: Math.max(0, (center - margin) * 100),
    upper: Math.min(100, (center + margin) * 100)
  };
}

// 사용 예시
// probability: 65%, sampleSize: 50
// 결과: { lower: 50.3, upper: 77.5 }
// → "65% (신뢰구간: 50-78%)"
```

---

## 4. 백테스트 지표 개선

### 4-A. 고급 지표 세트

```typescript
interface AdvancedMetrics {
  // === 수익성 지표 ===
  totalReturn: number;           // 총 수익률
  cagr: number;                  // 연복리수익률
  avgWin: number;                // 평균 이익
  avgLoss: number;               // 평균 손실
  profitFactor: number;          // 총이익/총손실
  expectancy: number;            // 기대수익 (매 거래당)

  // === 리스크 지표 ===
  maxDrawdown: number;           // 최대 낙폭 (%)
  maxDrawdownDuration: number;   // MDD 지속 기간 (일)
  volatility: number;            // 수익률 변동성
  downside: number;              // 하방 변동성
  ulcerIndex: number;            // 울서 지수 (장기 스트레스)

  // === 리스크 조정 수익률 ===
  sharpeRatio: number;           // (Return - Rf) / Std
  sortinoRatio: number;          // (Return - Rf) / Downside
  calmarRatio: number;           // CAGR / MDD
  omegaRatio: number;            // 승률 × 평균이익 / 패률 × 평균손실

  // === 거래 품질 ===
  winRate: number;               // 승률
  payoffRatio: number;           // 평균이익 / 평균손실
  sqn: number;                   // System Quality Number

  // === 연속성 ===
  maxConsecWins: number;
  maxConsecLosses: number;
  avgWinStreak: number;
  avgLossStreak: number;
}
```

### 4-B. 핵심 지표 계산

```typescript
// Sharpe Ratio (위험 조정 수익률)
function calculateSharpe(
  returns: number[],
  riskFreeRate: number = 0
): number {
  const avgReturn = average(returns);
  const stdDev = calculateStdDev(returns);
  if (stdDev === 0) return 0;

  // 연환산 (거래 빈도에 따라 조정)
  const annualizedReturn = avgReturn * Math.sqrt(252);
  const annualizedStd = stdDev * Math.sqrt(252);

  return (annualizedReturn - riskFreeRate) / annualizedStd;
}

// Sortino Ratio (하방 변동성만 고려)
function calculateSortino(
  returns: number[],
  riskFreeRate: number = 0
): number {
  const avgReturn = average(returns);
  const negativeReturns = returns.filter(r => r < 0);
  const downside = Math.sqrt(average(negativeReturns.map(r => r * r)));

  if (downside === 0) return avgReturn > 0 ? Infinity : 0;
  return (avgReturn - riskFreeRate) / downside;
}

// System Quality Number (전략 품질)
function calculateSQN(returns: number[]): number {
  const avgReturn = average(returns);
  const stdDev = calculateStdDev(returns);
  const n = returns.length;

  if (stdDev === 0) return 0;

  // SQN = (평균 R-Multiple / 표준편차) × √거래수
  // 간소화: (평균수익 / 표준편차) × √min(거래수, 100)
  return (avgReturn / stdDev) * Math.sqrt(Math.min(n, 100));
}

// SQN 해석
// 1.6-1.9: 평균 이하
// 2.0-2.4: 평균
// 2.5-2.9: 좋음
// 3.0-5.0: 우수
// 5.0+: 슈퍼스타
```

### 4-C. 리스크 지표

```typescript
// Maximum Drawdown (최대 낙폭)
function calculateMaxDrawdown(equityCurve: number[]): {
  mdd: number;
  mddStart: number;
  mddEnd: number;
  mddDuration: number;
} {
  let peak = equityCurve[0];
  let maxDD = 0;
  let mddStart = 0, mddEnd = 0;
  let currentDDStart = 0;

  equityCurve.forEach((equity, i) => {
    if (equity > peak) {
      peak = equity;
      currentDDStart = i;
    }

    const dd = (peak - equity) / peak * 100;
    if (dd > maxDD) {
      maxDD = dd;
      mddStart = currentDDStart;
      mddEnd = i;
    }
  });

  return {
    mdd: maxDD,
    mddStart,
    mddEnd,
    mddDuration: mddEnd - mddStart
  };
}

// Ulcer Index (장기 스트레스 지표)
function calculateUlcerIndex(equityCurve: number[]): number {
  const drawdowns: number[] = [];
  let peak = equityCurve[0];

  equityCurve.forEach(equity => {
    if (equity > peak) peak = equity;
    const dd = ((peak - equity) / peak) * 100;
    drawdowns.push(dd * dd);  // 낙폭의 제곱
  });

  return Math.sqrt(average(drawdowns));
}
```

---

## 5. 확률 표시 포맷

### 5-A. UI 표시 형식

```typescript
interface ProbabilityDisplay {
  // 메인 표시
  mainText: string;           // "상승 확률 65%"
  subText: string;            // "(신뢰구간: 52-78%)"

  // 시각적 표현
  barWidth: number;           // 0-100
  color: string;              // 확률에 따른 색상

  // 등급 배지
  gradeBadge: {
    letter: 'A' | 'B' | 'C' | 'D' | 'F';
    color: string;
    tooltip: string;
  };

  // 크기별 분포
  magnitudeChart: {
    labels: string[];
    values: number[];
    colors: string[];
  };
}

function formatProbabilityDisplay(result: ProbabilityResult): ProbabilityDisplay {
  const { riseProb, confidence, magnitude } = result;

  // 신뢰구간 계산
  const ci = calculateConfidenceInterval(riseProb, confidence.sampleSize);

  // 색상 결정
  const color = riseProb >= 65 ? '#22C55E' :  // 녹색
                riseProb >= 55 ? '#84CC16' :  // 연두
                riseProb >= 45 ? '#6B7280' :  // 회색
                riseProb >= 35 ? '#F59E0B' :  // 주황
                '#EF4444';                     // 빨강

  return {
    mainText: `상승 확률 ${Math.round(riseProb)}%`,
    subText: `(신뢰구간: ${Math.round(ci.lower)}-${Math.round(ci.upper)}%)`,
    barWidth: riseProb,
    color,
    gradeBadge: {
      letter: confidence.grade,
      color: confidence.grade === 'A' ? '#22C55E' :
             confidence.grade === 'B' ? '#3B82F6' :
             confidence.grade === 'C' ? '#F59E0B' :
             confidence.grade === 'D' ? '#EF4444' : '#6B7280',
      tooltip: `신뢰도 ${confidence.score}점 (샘플 ${confidence.sampleSize}개)`
    },
    magnitudeChart: {
      labels: ['+3%↑', '+1~3%', '0~1%', '0~-1%', '-1~-3%', '-3%↓'],
      values: [
        magnitude.strongRise,
        magnitude.moderateRise,
        magnitude.slightRise,
        magnitude.slightDrop,
        magnitude.moderateDrop,
        magnitude.strongDrop
      ],
      colors: ['#15803D', '#22C55E', '#86EFAC', '#FCA5A5', '#EF4444', '#B91C1C']
    }
  };
}
```

---

## 6. 구현 우선순위

| 순위 | 기능 | 난이도 | 효과 |
|------|------|--------|------|
| 1 | 다차원 확률 구조 | ★★★☆☆ | 정보 품질 ↑ |
| 2 | 신뢰도 공식 | ★★☆☆☆ | 투명성 ↑ |
| 3 | 크기별 분류 | ★★☆☆☆ | 실용성 ↑ |
| 4 | 신뢰구간 표시 | ★☆☆☆☆ | 정직성 ↑ |
| 5 | 고급 백테스트 | ★★★★☆ | 프로 유저 유입 |
| 6 | 조건부 확률 | ★★★☆☆ | 상황별 인사이트 |

---

## 7. 파일 구조 제안

```
lib/
├── probability/
│   ├── engine.ts           # 메인 확률 계산 엔진
│   ├── confidence.ts       # 신뢰도 계산
│   ├── magnitude.ts        # 크기별 분류
│   ├── conditional.ts      # 조건부 확률
│   └── display.ts          # UI 포맷팅
├── backtest/
│   ├── advanced.ts         # 고급 백테스트
│   ├── metrics.ts          # 지표 계산
│   └── equity.ts           # 자산곡선 분석
└── types/
    └── probability.ts      # 타입 정의
```

---

**Status**: DESIGN COMPLETE
**Next**: Commander 승인 → 구현
