# 📊 코인 차트 분석 프로젝트 - 단계별 분석 (Step-by-Step Analysis)

## 개요
이 문서는 프로젝트의 핵심 로직을 **1단계 → 2단계 → 3단계**로 나누어 각 단계의 **reasoning(추론 과정)**을 명확히 분리하여 설명합니다.

---

## 🔵 1단계: 데이터 수집 및 전처리 (Data Collection & Preprocessing)

### 목적
- 외부 API에서 원시 데이터를 수집하고, 분석 가능한 형태로 변환
- 데이터의 일관성과 신뢰성 확보

### Reasoning (추론 과정)

#### 1.1 데이터 소스 선택
```
Reasoning: 
- Binance API 선택 이유: 
  * 전 세계 최대 거래량을 가진 거래소 (데이터 신뢰성)
  * 무료 Public API 제공 (Rate Limit: 1200 req/min)
  * WebSocket 지원 (실시간 데이터)
  * 표준화된 K-line 형식 제공
```

**구현 위치**: `lib/api/binance.ts`
- `getKlines()`: 과거 캔들 데이터 수집
- `subscribeToTicker()`: 실시간 가격 구독
- `subscribeToKlines()`: 실시간 캔들 업데이트

#### 1.2 데이터 정규화
```
Reasoning:
- Binance는 밀리초 타임스탬프를 반환하지만, Lightweight Charts는 초 단위를 기대
- 변환: time = d[0] / 1000
- 가격 데이터는 문자열로 오므로 parseFloat()로 숫자 변환
- 이는 차트 라이브러리와의 호환성을 위한 필수 전처리
```

**구현 위치**: `lib/api/binance.ts:77-84`
```typescript
return data.map((d: any) => ({
    time: d[0] / 1000,  // ms → seconds 변환
    open: parseFloat(d[1]),
    high: parseFloat(d[2]),
    low: parseFloat(d[3]),
    close: parseFloat(d[4]),
    volume: parseFloat(d[5]),
}));
```

#### 1.3 데이터 저장 전략
```
Reasoning:
- Supabase에 일일 가격 데이터 저장 (market_prices 테이블)
- 이유:
  * API 호출 횟수 절감 (비용/속도 최적화)
  * 오프라인 분석 가능
  * 장기 데이터 보관 (3년치)
- 최신 990개만 조회: .limit(990) (성능 최적화)
```

**구현 위치**: `app/analysis/[symbol]/page.tsx:83-88`
```typescript
const { data: prices } = await supabase
    .from('market_prices')
    .select('date, open, high, low, close, volume')
    .eq('symbol', symbol)
    .order('date', { ascending: false })
    .limit(990)
```

#### 1.4 실시간 가격 폴링
```
Reasoning:
- 5초마다 실시간 가격 갱신
- 이유: 
  * WebSocket 대신 HTTP 폴링 선택 (구현 단순성)
  * 5초 간격: 사용자 경험과 서버 부하의 균형
  * API Rate Limit 내에서 안전하게 동작
```

**구현 위치**: `app/analysis/[symbol]/page.tsx:70-71`
```typescript
const interval = setInterval(fetchRealtimePrice, 5000)
```

---

## 🟡 2단계: 기술적 지표 계산 및 시장 상태 분류 (Technical Indicators & Market State Classification)

### 목적
- 원시 가격 데이터를 의미 있는 기술적 지표로 변환
- 현재 시장이 어떤 상태인지 자동으로 진단

### Reasoning (추론 과정)

#### 2.1 지표 선택 전략
```
Reasoning:
선택한 지표들:
1. RSI (14): 모멘텀 지표 - 과매수/과매도 판단
2. MACD: 추세 지표 - 상승/하락 전환점 포착
3. Stochastic: 모멘텀 - 골든크로스/데드크로스
4. CCI: 변동성 - 극단적 가격 움직임 감지
5. Williams %R: 모멘텀 - RSI와 유사하지만 다른 계산 방식
6. Bollinger Bands: 변동성 - 지지/저항선 역할
7. ATR: 변동성 강도 측정
8. ADX: 추세 강도 측정

이유:
- 모멘텀 지표(RSI, Stochastic, CCI, Williams) + 추세 지표(MACD, ADX) + 변동성 지표(BB, ATR)
- 서로 다른 관점에서 시장을 분석하여 종합 판단 가능
- 단일 지표의 오류를 다른 지표로 보완
```

**구현 위치**: `lib/indicators.ts`
- 각 지표는 독립적인 함수로 구현
- Wilder's Smoothing 적용 (RSI, ADX): 정확도 향상

#### 2.2 시장 상태 분류 로직
```
Reasoning:
시장 상태를 5가지로 분류:

1. VOLATILE (고변동성)
   - 조건: currentATR > avgATR * 1.5
   - 이유: 변동성이 평균의 1.5배 이상이면 예측 불가능한 움직임

2. RANGING (횡보)
   - 조건: trendStrength < 1.0% (현재가와 SMA20 차이)
   - 이유: 가격이 이동평균선 근처에서 움직이면 횡보장

3. TRENDING_UP (상승 추세)
   - 조건: EMA9 > EMA21
   - 이유: 단기 이동평균이 장기 이동평균 위에 있으면 상승 추세

4. TRENDING_DOWN (하락 추세)
   - 조건: EMA9 < EMA21
   - 이유: 단기 이동평균이 장기 이동평균 아래에 있으면 하락 추세

5. UNCERTAIN (불확실)
   - 위 조건에 모두 해당하지 않을 때
```

**구현 위치**: `lib/analysis.ts:124-151`
```typescript
function classifyMarket(candles: CandleData[], atr: number[], avgATR: number): MarketState {
    const currentATR = atr[atr.length - 1] || avgATR;
    const isHighVolatility = currentATR > avgATR * 1.5;
    
    if (isHighVolatility) return 'VOLATILE';
    
    // Trend Strength check
    const sma20 = calculateSMA(closes, 20);
    const trendStrength = Math.abs((closes[closes.length - 1] - currentSMA) / currentSMA) * 100;
    if (trendStrength < 1.0) return 'RANGING';
    
    // Trend Direction via EMA
    const ema9 = calculateEMA(closes, 9);
    const ema21 = calculateEMA(closes, 21);
    if (cEMA9 > cEMA21) return 'TRENDING_UP';
    if (cEMA9 < cEMA21) return 'TRENDING_DOWN';
    
    return 'UNCERTAIN';
}
```

#### 2.3 동적 가중치 시스템
```
Reasoning:
시장 상태에 따라 지표의 중요도를 자동 조절:

예시:
- TRENDING_UP/DOWN 시장:
  * MACD, ADX 가중치 ↑ (1.3배) - 추세 지표가 중요
  * RSI, Stochastic 가중치 ↓ (0.8배) - 모멘텀 지표는 덜 중요

- RANGING 시장:
  * RSI, Stochastic 가중치 ↑ (1.4배) - 과매수/과매도가 중요
  * MACD 가중치 ↓ (0.7배) - 추세 지표는 덜 중요

- VOLATILE 시장:
  * Bollinger Bands 가중치 ↑ (1.5배) - 변동성 지표가 중요
  * 전체 가중치 ↓ (0.8배) - 불확실성이 높으므로 신호 신뢰도 낮춤

이유:
- 시장 상황에 맞는 지표를 더 중요하게 반영해야 정확도 향상
- 횡보장에서 추세 지표를 믿으면 손실 발생 가능
```

**구현 위치**: `lib/analysis.ts:153-182`
```typescript
function getIndicatorBaseWeight(indicator: string, marketState: MarketState): number {
    let weight = baseWeights[indicator] || 1.0;
    
    switch (marketState) {
        case 'TRENDING_UP':
        case 'TRENDING_DOWN':
            if (indicator === 'MACD' || indicator.includes('ADX')) weight *= 1.3;
            if (indicator.includes('RSI') || indicator.includes('Stoch')) weight *= 0.8;
            break;
        case 'RANGING':
            if (indicator.includes('RSI') || indicator.includes('Stoch')) weight *= 1.4;
            if (indicator === 'MACD') weight *= 0.7;
            break;
        // ...
    }
    return weight;
}
```

#### 2.4 지표별 신호 생성 규칙
```
Reasoning:
각 지표마다 명확한 임계값 설정:

1. RSI:
   - BUY: < 30 (과매도)
   - SELL: > 70 (과매수)
   - 이유: 전통적인 기술적 분석 기준

2. Stochastic:
   - BUY: K < 20 && K > D (골든크로스)
   - SELL: K > 80 && K < D (데드크로스)
   - 이유: 모멘텀 전환점 포착

3. MACD:
   - BUY: Histogram > 0 && 이전 <= 0 (0선 돌파)
   - SELL: Histogram < 0 && 이전 >= 0 (0선 이탈)
   - 이유: 추세 전환 신호

4. Bollinger Bands:
   - BUY: 가격 < 하단 밴드 (지지선 터치)
   - SELL: 가격 > 상단 밴드 (저항선 터치)
   - 이유: 평균 회귀 이론
```

**구현 위치**: `lib/analysis.ts:336-398`

---

## 🟢 3단계: AI 분석 및 신호 생성 (AI Analysis & Signal Generation)

### 목적
- 2단계에서 계산한 지표들을 종합하여 최종 매매 신호 생성
- 통계적 확률(Win Rate) 기반으로 신뢰도 높은 추천 제공

### Reasoning (추론 과정)

#### 3.1 백테스팅을 통한 Win Rate 계산
```
Reasoning:
각 지표의 신호가 실제로 얼마나 정확한지 과거 데이터로 검증:

알고리즘:
1. 과거 데이터를 순회하며 해당 지표의 신호 발생 시점 찾기
2. 신호 발생 후 N개 캔들(기본 3개) 뒤의 가격 확인
3. 가격이 상승했으면 "Win", 하락했으면 "Loss"
4. Win Rate = (Win 횟수 / 전체 신호 수) * 100

예시:
- RSI < 30 신호가 100번 발생
- 그 중 65번이 3캔들 후 상승 → Win Rate = 65%

이유:
- 이론적 지표 값보다 실제 성과가 중요
- 과거 성과가 미래 성과를 보장하지는 않지만, 통계적 신뢰도 제공
```

**구현 위치**: `lib/backtest.ts:15-55`
```typescript
export function runBacktest(
    candles: CandleData[],
    signalFn: (index: number) => 'BUY' | 'SELL' | 'NEUTRAL',
    lookForward: number = 3,
    targetSignal?: 'BUY' | 'SELL' | 'NEUTRAL'
): BacktestResult {
    let wins = 0;
    let total = 0;
    
    for (let i = 50; i < candles.length - lookForward; i++) {
        const signal = signalFn(i);
        if (targetSignal !== undefined && signal !== targetSignal) continue;
        
        const entryPrice = candles[i].close;
        const exitPrice = candles[i + lookForward].close;
        const isWin = exitPrice > entryPrice;
        
        total++;
        if (isWin) wins++;
    }
    
    return {
        totalSignals: total,
        winRate: total > 0 ? Math.round((wins / total) * 100) : 0
    };
}
```

#### 3.2 가중 평균 Win Rate 계산
```
Reasoning:
여러 지표의 Win Rate를 가중 평균으로 종합:

공식:
weightedWinRate = Σ(winRate_i * weight_i) / Σ(weight_i)

이유:
- 단순 평균이 아닌 가중 평균 사용
- 신뢰도 높은 지표(샘플 수 많음)에 더 높은 가중치
- 시장 상태에 맞는 지표에 더 높은 가중치 (2단계 동적 가중치)

예시:
- RSI Win Rate: 60%, Weight: 1.4 → 기여도: 84
- MACD Win Rate: 55%, Weight: 0.7 → 기여도: 38.5
- 최종 Win Rate = (84 + 38.5) / (1.4 + 0.7) = 58.3%
```

**구현 위치**: `lib/analysis.ts:291-333`
```typescript
let riseProbSum = 0;
let riseProbWeightSum = 0;

// 각 지표 분석 시
const weight = base * (0.5 + 0.5 * sampleConfidence);
if (currentSignal !== 'NEUTRAL' && totalSignals > 0) {
    riseProbSum += winRate * weight;
    riseProbWeightSum += weight;
}

// 최종 Win Rate
let calculatedWinRate = riseProbWeightSum > 0 
    ? (riseProbSum / riseProbWeightSum) 
    : 50;
```

#### 3.3 최종 추천 점수 계산
```
Reasoning:
지표들의 신호를 종합하여 -1 ~ +1 사이의 점수 생성:

알고리즘:
1. 각 지표의 신호를 점수로 변환:
   - BUY 신호: +1
   - SELL 신호: -1
   - NEUTRAL: 0

2. 가중치를 곱하여 합산:
   totalWeightedScore = Σ(signal_i * weight_i)

3. 정규화:
   normalizedScore = totalWeightedScore / totalWeight

4. 점수에 따른 추천:
   - >= 0.6: STRONG BUY
   - >= 0.2: BUY
   - <= -0.6: STRONG SELL
   - <= -0.2: SELL
   - 그 외: NEUTRAL

이유:
- 단순 다수결이 아닌 가중 다수결
- 신뢰도 높은 지표의 의견이 더 반영됨
```

**구현 위치**: `lib/analysis.ts:325-408`
```typescript
// 각 지표 분석
if (winRate > 55) totalWeightedScore += 1 * weight;
else if (winRate < 45) totalWeightedScore -= 1 * weight;

// 최종 점수
const normalizedScore = totalWeight > 0 
    ? totalWeightedScore / totalWeight 
    : 0;

// 추천 결정
let recommendation: string = t.neutral;
if (normalizedScore >= 0.6) recommendation = t.strongBuy;
else if (normalizedScore >= 0.2) recommendation = t.buy;
else if (normalizedScore <= -0.6) recommendation = t.strongSell;
else if (normalizedScore <= -0.2) recommendation = t.sell;
```

#### 3.4 프랙탈 패턴 매칭 (Fractal Pattern Matching)
```
Reasoning:
과거와 유사한 차트 패턴을 찾아 미래 움직임 예측:

알고리즘:
1. 현재 패턴 추출: 최근 14개 캔들의 가격 움직임
2. 패턴 정규화: 절대 가격이 아닌 % 변화로 변환 (첫 가격 기준)
   - 이유: 100달러와 1000달러의 같은 움직임을 비교 가능하게
3. 과거 데이터 스캔: Pearson 상관계수로 유사도 계산
4. 유사도 > 0.85인 패턴 찾기
5. 해당 패턴 이후 실제 움직임 확인
6. 가중 평균으로 예상 수익률 계산

예시:
- 현재 BTC 패턴이 2023년 3월 패턴과 92% 유사
- 그때 이후 3일 뒤 +5% 상승
- → 현재도 비슷한 상승 예상

이유:
- "역사는 반복된다"는 가정
- 기술적 분석의 핵심 원리 중 하나
```

**구현 위치**: `lib/fractal_engine.ts:49-167`
```typescript
export async function analyzeFractalPattern(
    symbol: string,
    historyCandles: CandleData[],
    patternLength: number = 14,
    forecastHorizon: number = 3
): Promise<FractalAnalysisResult> {
    // 1. 현재 패턴 정규화
    const currentNormalized = normalizePattern(currentCloses);
    
    // 2. 과거 스캔
    for (let i = startIndexForScan; i >= 0; i--) {
        const candidateNormalized = normalizePattern(candidateCloses);
        const correlation = calculateCorrelation(currentNormalized, candidateNormalized);
        
        if (correlation > 0.85) {
            // 유사 패턴 발견 → 이후 움직임 확인
            const percentChange = ((exitPrice - entryPrice) / entryPrice) * 100;
            matches.push({ similarity: correlation * 100, nextMovePercent: percentChange });
        }
    }
    
    // 3. 가중 평균 계산
    const avgReturn = weightedSum / totalWeight;
    
    // 4. 추천 생성
    if (avgReturn > 1.0 && ups > downs) position = 'BUY';
    else if (avgReturn < -1.0 && downs > ups) position = 'SELL';
}
```

#### 3.5 가격 레벨 계산 (지지/저항선)
```
Reasoning:
매수/매도 타이밍과 손절/익절가 결정을 위한 가격 레벨 계산:

알고리즘:
1. Pivot Points 찾기:
   - 최근 20개 캔들에서 국지적 고점/저점 추출
   - 좌우 3개씩 비교하여 피벗 확인

2. Fibonacci Retracement:
   - 최근 50개 캔들의 고점/저점 기준
   - 38.2%, 61.8% 되돌림 레벨 계산

3. 지지선/저항선:
   - 현재가 아래의 피벗 저점들 → 지지선
   - 현재가 위의 피벗 고점들 → 저항선

4. 손절/익절가:
   - Stop Loss: 가장 가까운 지지선 * 0.98 (2% 여유)
   - Take Profit: 가장 가까운 저항선 * 1.02 (2% 여유)
   - Risk/Reward Ratio 계산

이유:
- 기술적 분석에서 지지/저항선은 중요한 가격 레벨
- 손절/익절가를 미리 설정하면 감정적 거래 방지
```

**구현 위치**: `lib/analysis.ts:184-230`
```typescript
function calculateKeyLevels(candles: CandleData[], currentPrice: number) {
    const pivotLows = findPivotLows(recent20);
    const pivotHighs = findPivotHighs(recent20);
    
    // Fibonacci levels
    const fibSupport = [low + diff * 0.382, low + diff * 0.618];
    const fibResistance = [high - diff * 0.382, high - diff * 0.618];
    
    // Support/Resistance
    const supportLevels = [
        ...pivotLows.filter(p => p < currentPrice),
        ...fibSupport.filter(p => p < currentPrice)
    ].sort((a, b) => b - a).slice(0, 3);
    
    // Stop Loss / Take Profit
    const stopLoss = nearestSupport * 0.98;
    const takeProfit = nearestResistance * 1.02;
    const riskRewardRatio = (takeProfit - currentPrice) / (currentPrice - stopLoss);
}
```

#### 3.6 신뢰도 조정 (Confidence Adjustment)
```
Reasoning:
Win Rate에 신호 강도를 반영하여 최종 확률 조정:

알고리즘:
1. 신호 강도 계산: |normalizedScore|
2. 조정량 계산: signalStrength * 5 * (totalWeight > 5 ? 1 : 0.5)
3. Win Rate에 반영:
   - 매수 신호면: winRate += adjustment
   - 매도 신호면: winRate -= adjustment
4. 범위 제한: 10 ~ 90% (극단값 방지)

이유:
- 점수가 높을수록(강한 신호) 더 확신 있게 조정
- 샘플 수가 적으면(totalWeight < 5) 조정량 감소
- 과도한 확신 방지를 위해 범위 제한
```

**구현 위치**: `lib/analysis.ts:413-421`
```typescript
// Confidence Adjustment
const signalStrength = Math.abs(normalizedScore);
const adjustment = signalStrength * 5 * (totalWeight > 5 ? 1 : 0.5);

if (normalizedScore > 0) calculatedWinRate += adjustment;
if (normalizedScore < 0) calculatedWinRate -= adjustment;

calculatedWinRate = clamp(calculatedWinRate, 10, 90);
```

---

## 📊 전체 데이터 흐름도

```
[1단계] 데이터 수집
    ↓
Binance API → CandleData[] → Supabase 저장
    ↓
[2단계] 기술적 분석
    ↓
CandleData[] → Indicators 계산 → Market State 분류 → Dynamic Weighting
    ↓
[3단계] AI 분석
    ↓
Indicators + Market State → Backtest → Win Rate 계산 → Final Score → Recommendation
    ↓
Fractal Pattern Matching → Pattern Similarity → Expected Return
    ↓
Price Levels 계산 → Support/Resistance → Stop Loss/Take Profit
    ↓
[최종 출력]
    ↓
AnalysisResult {
    recommendation: "STRONG BUY" | "BUY" | "NEUTRAL" | "SELL" | "STRONG SELL",
    score: -1.0 ~ +1.0,
    winRate: 10 ~ 90%,
    priceLevels: { support, resistance, stopLoss, takeProfit },
    marketState: "TRENDING_UP" | "RANGING" | "VOLATILE" | ...
}
```

---

## 🎯 핵심 Reasoning 요약

### 1단계 Reasoning
- **데이터 소스**: Binance 선택 (신뢰성, 무료, 표준화)
- **정규화**: 차트 라이브러리 호환성을 위한 형식 변환
- **저장 전략**: API 호출 절감 및 오프라인 분석 가능

### 2단계 Reasoning
- **지표 선택**: 모멘텀 + 추세 + 변동성 지표의 조합
- **시장 분류**: ATR, SMA, EMA를 활용한 5가지 상태 구분
- **동적 가중치**: 시장 상태에 맞는 지표에 더 높은 가중치

### 3단계 Reasoning
- **백테스팅**: 이론이 아닌 실제 성과 기반 Win Rate 계산
- **가중 평균**: 신뢰도 높은 지표의 의견을 더 반영
- **프랙탈 매칭**: 과거 유사 패턴을 통한 미래 예측
- **가격 레벨**: 지지/저항선 기반 손절/익절가 제시

---

## 📝 결론

이 프로젝트는 **단순한 지표 나열이 아닌, 통계적 검증과 동적 가중치를 통한 지능형 분석 시스템**입니다.

각 단계의 reasoning은 다음과 같이 연결됩니다:
1. **1단계**: 신뢰할 수 있는 데이터 확보
2. **2단계**: 데이터를 의미 있는 지표로 변환하고 시장 상태 파악
3. **3단계**: 지표들을 종합하여 통계적으로 검증된 신호 생성

이러한 3단계 구조는 **데이터 → 지표 → 신호**의 명확한 추론 과정을 보장하며, 각 단계에서의 reasoning이 다음 단계의 기반이 됩니다.


