# Probability Model Design Document

**Phase**: 2 | Step 4
**Type**: Design Only (No Implementation)
**Date**: 2025-12-27

---

## 1. Overview

ChartMaster의 확률 기반 분석 시스템 설계서.
"Historical pattern matching + statistical validation" 기반으로 RISE/DROP 확률 및 신뢰도를 산출한다.

**용어 규칙**:
- "예측(prediction)" → "확률 기반 분석(probability-based analysis)"
- "AI 분석" → "통계적 패턴 분석(statistical pattern analysis)"
- "예측 정확도" → "과거 검증 정확도(historical validation accuracy)"

---

## 2. Input Features (입력 정의)

### 2.1 Primary Indicators (1차 지표)

| Feature | 타입 | 범위 | 설명 |
|---------|------|------|------|
| `rsi` | number | 0-100 | Relative Strength Index |
| `macd_histogram` | number | -∞ ~ +∞ | MACD Histogram 값 |
| `macd_signal_cross` | enum | 'bullish' \| 'bearish' \| 'none' | MACD 시그널 교차 |
| `bb_position` | number | 0-1 | 볼린저밴드 내 위치 (0=하단, 1=상단) |
| `stoch_k` | number | 0-100 | Stochastic %K |
| `stoch_d` | number | 0-100 | Stochastic %D |
| `cci` | number | -∞ ~ +∞ | Commodity Channel Index |
| `williams_r` | number | -100 ~ 0 | Williams %R |

### 2.2 Trend Indicators (추세 지표)

| Feature | 타입 | 범위 | 설명 |
|---------|------|------|------|
| `adx` | number | 0-100 | Average Directional Index |
| `plus_di` | number | 0-100 | +DI (상승 방향성) |
| `minus_di` | number | 0-100 | -DI (하락 방향성) |
| `ema_alignment` | enum | 'bullish' \| 'bearish' \| 'mixed' | EMA 정렬 상태 |
| `price_vs_ema20` | number | % | 현재가 vs EMA20 이격도 |
| `price_vs_ema50` | number | % | 현재가 vs EMA50 이격도 |

### 2.3 Volatility Indicators (변동성 지표)

| Feature | 타입 | 범위 | 설명 |
|---------|------|------|------|
| `atr_percent` | number | 0-∞ | ATR / 현재가 × 100 |
| `bb_width` | number | 0-∞ | (상단-하단) / 중앙 × 100 |
| `volatility_regime` | enum | 'low' \| 'normal' \| 'high' \| 'extreme' | 변동성 구간 |

### 2.4 Volume Indicators (거래량 지표)

| Feature | 타입 | 범위 | 설명 |
|---------|------|------|------|
| `volume_ratio` | number | 0-∞ | 현재 거래량 / 20일 평균 |
| `obv_trend` | enum | 'rising' \| 'falling' \| 'flat' | OBV 추세 |
| `volume_price_confirm` | boolean | - | 거래량-가격 일치 여부 |

### 2.5 Pattern Features (패턴 지표)

| Feature | 타입 | 범위 | 설명 |
|---------|------|------|------|
| `fractal_correlation` | number | -1 ~ 1 | 프랙탈 패턴 상관계수 |
| `fractal_outcome` | number | % | 매칭 패턴의 과거 수익률 |
| `support_distance` | number | % | 지지선까지 거리 |
| `resistance_distance` | number | % | 저항선까지 거리 |

---

## 3. Probability Calculation (확률 산식)

### 3.1 Base Score Calculation

각 지표별 시그널 점수 산출 (−100 ~ +100)

```
// 의사코드
function calculateIndicatorScore(indicator, value):
    switch indicator:
        case 'rsi':
            if value < 30: return +80 × (30 - value) / 30  // 과매도 → 상승 시그널
            if value > 70: return -80 × (value - 70) / 30  // 과매수 → 하락 시그널
            return 0

        case 'macd_signal_cross':
            if value == 'bullish': return +70
            if value == 'bearish': return -70
            return 0

        case 'bb_position':
            if value < 0.2: return +60  // 하단 이탈 → 반등 기대
            if value > 0.8: return -60  // 상단 이탈 → 하락 기대
            return 0

        // ... 각 지표별 정의
```

### 3.2 Regime-Based Weight Matrix

시장 상태에 따른 지표별 가중치 동적 조정

```
WEIGHT_MATRIX = {
    'STRONG_TREND': {
        rsi: 0.8,      // 추세장에서 RSI 신뢰도 낮음
        macd: 1.5,     // MACD 신뢰도 높음
        adx: 1.3,
        bb: 0.7,
        stoch: 0.6
    },
    'RANGING': {
        rsi: 1.4,      // 횡보장에서 RSI 신뢰도 높음
        macd: 0.7,
        adx: 0.5,
        bb: 1.3,
        stoch: 1.4
    },
    'HIGH_VOLATILITY': {
        rsi: 0.6,      // 고변동성에서 대부분 지표 신뢰도 낮음
        macd: 0.8,
        adx: 1.0,
        bb: 0.5,
        stoch: 0.5
    }
}
```

### 3.3 Weighted Score Aggregation

```
function calculateWeightedScore(features, regime):
    weights = WEIGHT_MATRIX[regime]
    totalWeight = 0
    weightedSum = 0

    for each (indicator, value) in features:
        score = calculateIndicatorScore(indicator, value)
        weight = weights[indicator] ?? 1.0

        weightedSum += score × weight
        totalWeight += weight

    return weightedSum / totalWeight  // -100 ~ +100 범위
```

### 3.4 Score to Probability Conversion

```
function scoreToProbability(weightedScore):
    // Sigmoid-like mapping: -100~+100 → 0~100%
    normalized = (weightedScore + 100) / 200  // 0~1

    // 극단값 보정 (50% ± 35% 범위로 제한)
    riseProb = 50 + (normalized - 0.5) × 70
    riseProb = clamp(riseProb, 15, 85)  // 절대 0% 또는 100% 금지

    dropProb = 100 - riseProb

    return { riseProb, dropProb }
```

---

## 4. Confidence Score (신뢰도 산정)

### 4.1 Confidence Components

| 요소 | 가중치 | 설명 |
|------|--------|------|
| `indicatorAgreement` | 30% | 지표 간 일치도 |
| `trendAlignment` | 25% | 추세 정합성 |
| `volumeConfirmation` | 20% | 거래량 확인 |
| `historicalAccuracy` | 15% | 과거 검증 정확도 |
| `volatilityPenalty` | -10% | 변동성 감점 |

### 4.2 Calculation Formula

```
function calculateConfidence(features, historicalData):
    // 1. 지표 합의도 (30점 만점)
    signals = getAllIndicatorSignals(features)
    agreementRatio = countSameDirection(signals) / totalSignals
    indicatorScore = agreementRatio × 30

    // 2. 추세 정합성 (25점 만점)
    if features.adx > 25:
        trendScore = (features.plus_di > features.minus_di) == (probability.rise > 50)
                     ? 25 : 0
    else:
        trendScore = 12  // 횡보장 = 중립

    // 3. 거래량 확인 (20점 만점)
    volumeScore = features.volume_price_confirm ? 20 : 5

    // 4. 과거 정확도 (15점 만점)
    historicalScore = historicalData.accuracy × 15

    // 5. 변동성 감점 (-10~0점)
    volatilityPenalty = features.volatility_regime == 'extreme' ? -10 :
                        features.volatility_regime == 'high' ? -5 : 0

    totalScore = indicatorScore + trendScore + volumeScore
                 + historicalScore + volatilityPenalty

    return {
        score: clamp(totalScore, 0, 100),
        grade: scoreToGrade(totalScore),
        breakdown: { indicatorScore, trendScore, volumeScore,
                     historicalScore, volatilityPenalty }
    }
```

### 4.3 Grade Mapping

| Score | Grade | 해석 |
|-------|-------|------|
| 80+ | A | 높은 신뢰도 - 지표 합의, 추세 일치, 거래량 확인 |
| 65-79 | B | 양호한 신뢰도 - 대부분 조건 충족 |
| 50-64 | C | 보통 신뢰도 - 혼재된 시그널 |
| 35-49 | D | 낮은 신뢰도 - 불확실성 높음 |
| <35 | F | 매우 낮은 신뢰도 - 관망 권장 |

### 4.4 Data Quality Adjustments

```
function adjustForDataQuality(confidence, dataQuality):
    // 표본 수 보정
    if dataQuality.sampleSize < 30:
        confidence.score *= 0.7
        confidence.warning = "표본 수 부족 (30건 미만)"
    else if dataQuality.sampleSize < 100:
        confidence.score *= 0.9

    // 최근성 보정
    if dataQuality.latestDataAge > 60:  // 60초 이상 지연
        confidence.score *= 0.8
        confidence.warning = "데이터 지연 (1분 이상)"

    // 거래량 부족 보정
    if dataQuality.volumeRatio < 0.3:
        confidence.score *= 0.85
        confidence.warning = "거래량 부족"

    return confidence
```

---

## 5. Free vs PRO Tier Differentiation

### 5.1 Feature Matrix

| Feature | Free | PRO |
|---------|------|-----|
| **기본 확률 (RISE/DROP %)** | O | O |
| **신뢰도 등급 (A-F)** | O | O |
| **신뢰도 점수 (0-100)** | X (잠금) | O |
| **신뢰도 구성요소 분석** | X | O |
| **변동폭 분포 (6단계)** | X | O |
| **기대수익률 계산** | X | O |
| **손익비 (Risk-Reward)** | X | O |
| **과거 검증 상세** | 요약만 | 전체 |
| **시장 상태 분류** | 3단계 | 9단계 |
| **백테스트 지표** | 승률만 | 12개 전체 |
| **설명 레벨** | Level 1-2 | Level 1-4 |

### 5.2 Blur/Lock Implementation

```typescript
// Free 사용자용 데이터 마스킹
interface FreeUserData {
    riseProb: number;           // 노출
    dropProb: number;           // 노출
    confidenceGrade: string;    // 노출 ('A', 'B', ...)
    confidenceScore: null;      // 잠금 → "PRO에서 확인"
    magnitude: null;            // 잠금
    expectedReturn: null;       // 잠금
    explanation: {
        level1: string;         // 노출
        level2: string;         // 노출
        level3: null;           // 잠금
        level4: null;           // 잠금
    };
}
```

---

## 6. Edge Cases & Safeguards

### 6.1 극단값 처리

```
SAFEGUARDS = {
    MIN_PROBABILITY: 15,        // 최소 15% (0% 금지)
    MAX_PROBABILITY: 85,        // 최대 85% (100% 금지)
    MIN_CONFIDENCE: 0,
    MAX_CONFIDENCE: 100,
    MIN_SAMPLE_SIZE: 10,        // 10건 미만 시 "데이터 부족" 표시
    STALE_DATA_THRESHOLD: 300   // 5분 이상 지연 시 경고
}
```

### 6.2 Disclaimer Integration

모든 확률 표시 시 필수 포함:
```
"과거 패턴 기반 통계 분석이며, 투자 결정은 본인 책임입니다."
"This is statistical analysis based on historical patterns. Investment decisions are your own responsibility."
```

---

## 7. Implementation Checklist (Phase 3용)

- [ ] `lib/probability/engine.ts` - 핵심 확률 계산 로직
- [ ] `lib/probability/confidence.ts` - 신뢰도 산출 로직
- [ ] `lib/probability/regime.ts` - 시장 상태 분류
- [ ] `lib/probability/weights.ts` - 가중치 매트릭스
- [ ] `types/probability.ts` - TypeScript 인터페이스
- [ ] `components/ProbabilityDisplay.tsx` - Free/PRO 분기 UI
- [ ] Unit tests for edge cases

---

**Document Status**: COMPLETE
**Next Phase**: Phase 3 Implementation
