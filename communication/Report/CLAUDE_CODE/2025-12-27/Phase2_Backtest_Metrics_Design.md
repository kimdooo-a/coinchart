# Advanced Backtest Metrics Design Document

**Phase**: 2 | Step 4
**Type**: Design Only (No Implementation)
**Date**: 2025-12-27

---

## 1. Overview

ChartMaster 백테스트 시스템의 고급 지표 설계서.
단순 승률을 넘어 리스크 조정 수익률, 최대 낙폭, 손익비 등 전문 트레이더 수준의 분석 지표를 제공한다.

---

## 2. Metrics Definition (지표 정의)

### 2.1 Basic Metrics (기본 지표)

#### Win Rate (승률)
```
정의: 수익 거래 수 / 총 거래 수 × 100

계산식:
winRate = (profitableTrades / totalTrades) × 100

최소 데이터: 10회 이상
```

**사용자 표시 문구**:
| 범위 | 표시 |
|------|------|
| 70%+ | "높은 승률 (과거 {n}회 중 {w}회 수익)" |
| 50-70% | "보통 승률 (과거 {n}회 중 {w}회 수익)" |
| <50% | "낮은 승률 - 손익비 확인 필요" |

---

#### Total Return (총 수익률)
```
정의: 전체 기간 누적 수익률

계산식:
totalReturn = (finalEquity / initialEquity - 1) × 100

단위: %
```

---

### 2.2 Risk Metrics (리스크 지표)

#### Maximum Drawdown (MDD, 최대 낙폭)
```
정의: 고점 대비 최대 하락폭 - 최악의 손실 구간을 측정

계산식:
for each point in equityCurve:
    peak = max(peak, equity)
    drawdown = (peak - equity) / peak × 100
    maxDrawdown = max(maxDrawdown, drawdown)

단위: %
최소 데이터: 20회 이상 (충분한 변동 필요)
```

**사용자 표시 문구**:
| MDD | 표시 |
|-----|------|
| <10% | "낮은 리스크 (최대 낙폭 {mdd}%)" |
| 10-25% | "보통 리스크 (최대 낙폭 {mdd}%)" |
| 25-50% | "높은 리스크 - 자금 관리 중요" |
| >50% | "매우 높은 리스크 - 주의 필요" |

---

#### Average Drawdown (평균 낙폭)
```
정의: 전체 낙폭의 평균

계산식:
avgDrawdown = sum(allDrawdowns) / count(allDrawdowns)
```

---

#### Drawdown Duration (낙폭 지속 기간)
```
정의: 고점 회복까지 걸린 최대 기간

계산식:
maxDuration = max(recoveryTime for each drawdown period)

단위: 일 또는 봉 수
```

---

### 2.3 Risk-Adjusted Returns (리스크 조정 수익률)

#### Sharpe Ratio (샤프 비율)
```
정의: 무위험 수익률 대비 초과 수익 / 변동성
       리스크 대비 수익 효율성 측정

계산식:
returns[] = 각 거래의 수익률
avgReturn = mean(returns)
stdDev = standardDeviation(returns)
riskFreeRate = 0.02 / 252  // 연 2% 기준, 일일 환산

sharpeRatio = (avgReturn - riskFreeRate) / stdDev × sqrt(252)

최소 데이터: 30회 이상
```

**사용자 표시 문구**:
| Sharpe | 표시 |
|--------|------|
| >2.0 | "우수한 리스크 대비 수익" |
| 1.0-2.0 | "양호한 리스크 대비 수익" |
| 0-1.0 | "보통 수준" |
| <0 | "리스크 대비 수익 부정적" |

---

#### Sortino Ratio (소르티노 비율)
```
정의: Sharpe의 변형 - 하방 변동성만 고려
       손실 리스크 대비 수익 측정

계산식:
negativeReturns = returns.filter(r => r < 0)
downsideDev = standardDeviation(negativeReturns)

sortinoRatio = (avgReturn - riskFreeRate) / downsideDev × sqrt(252)

최소 데이터: 30회 이상 (최소 10회 손실 거래 필요)
```

**사용자 표시 문구**:
| Sortino | 표시 |
|---------|------|
| >2.0 | "손실 대비 수익 효율 우수" |
| 1.0-2.0 | "손실 대비 수익 효율 양호" |
| <1.0 | "손실 리스크 관리 필요" |

---

#### Calmar Ratio (칼마 비율)
```
정의: 연환산 수익률 / MDD
       최악의 손실 대비 연 수익 효율

계산식:
annualizedReturn = totalReturn × (252 / tradingDays)
calmarRatio = annualizedReturn / maxDrawdown

최소 데이터: 50회 이상
```

**사용자 표시 문구**:
| Calmar | 표시 |
|--------|------|
| >3.0 | "MDD 대비 수익 매우 우수" |
| 1.0-3.0 | "MDD 대비 수익 양호" |
| <1.0 | "MDD 대비 수익 부족" |

---

### 2.4 Trade Analysis (거래 분석)

#### Profit Factor (손익 비율)
```
정의: 총 수익 / 총 손실
       1 이상이면 수익 시스템

계산식:
grossProfit = sum(profitableTrades.map(t => t.profit))
grossLoss = abs(sum(losingTrades.map(t => t.loss)))

profitFactor = grossProfit / grossLoss

최소 데이터: 20회 이상 (최소 5회 손실 필요)
```

**사용자 표시 문구**:
| PF | 표시 |
|----|------|
| >2.0 | "수익이 손실의 2배 이상" |
| 1.5-2.0 | "양호한 손익 구조" |
| 1.0-1.5 | "수익 우위이나 마진 적음" |
| <1.0 | "손실이 수익보다 큼" |

---

#### Risk-Reward Ratio (손익비)
```
정의: 평균 수익 / 평균 손실
       개별 거래의 손익 효율

계산식:
avgWin = mean(profitableTrades.map(t => t.profit))
avgLoss = abs(mean(losingTrades.map(t => t.loss)))

riskRewardRatio = avgWin / avgLoss

최소 데이터: 10회 이상 (최소 3회 손실 필요)
```

**사용자 표시 문구**:
| RR | 표시 |
|----|------|
| >3:1 | "수익 거래가 손실의 3배 이상" |
| 2-3:1 | "양호한 손익비" |
| 1-2:1 | "보통 수준의 손익비" |
| <1:1 | "손익비 개선 필요" |

---

#### Expectancy (기대값)
```
정의: 거래당 평균 기대 수익
       장기적 수익성의 핵심 지표

계산식:
expectancy = (winRate × avgWin) - ((1 - winRate) × avgLoss)

또는:
expectancy = avgReturn per trade

단위: % 또는 금액
```

**사용자 표시 문구**:
| Expectancy | 표시 |
|------------|------|
| >1% | "거래당 평균 +{e}% 기대" |
| 0-1% | "소폭 양의 기대값" |
| <0 | "음의 기대값 - 전략 재검토 필요" |

---

### 2.5 Consistency Metrics (일관성 지표)

#### Max Consecutive Wins/Losses (최대 연속 승/패)
```
계산식:
maxConsecutiveWins = max(연속 수익 거래 수)
maxConsecutiveLosses = max(연속 손실 거래 수)
```

**사용자 표시 문구**:
```
"최대 연속 수익 {w}회 / 최대 연속 손실 {l}회"
```

---

#### Recovery Factor (회복 계수)
```
정의: 총 수익 / MDD
       낙폭 대비 회복 능력

계산식:
recoveryFactor = totalReturn / maxDrawdown
```

---

#### Payoff Ratio (보상 비율)
```
정의: avgWin / avgLoss의 다른 표현

계산식:
payoffRatio = avgWin / avgLoss
```

---

## 3. Data Requirements (최소 데이터 요구조건)

| 지표 | 최소 거래 수 | 권장 거래 수 | 특수 조건 |
|------|-------------|-------------|-----------|
| Win Rate | 10 | 50+ | - |
| MDD | 20 | 100+ | 변동 포함 필수 |
| Sharpe | 30 | 100+ | - |
| Sortino | 30 | 100+ | 손실 거래 10+ |
| Calmar | 50 | 200+ | 1년 이상 권장 |
| Profit Factor | 20 | 100+ | 손실 거래 5+ |
| Risk-Reward | 10 | 50+ | 손실 거래 3+ |
| Expectancy | 10 | 50+ | - |

### 3.1 Insufficient Data Handling

```typescript
interface MetricResult {
    value: number | null;
    status: 'valid' | 'insufficient' | 'unavailable';
    message: string;
    minRequired: number;
    currentCount: number;
}

// 예시
{
    value: null,
    status: 'insufficient',
    message: "Sharpe Ratio 계산에 최소 30회 거래 필요 (현재 12회)",
    minRequired: 30,
    currentCount: 12
}
```

---

## 4. Free vs PRO Tier

| 지표 | Free | PRO |
|------|------|-----|
| Win Rate | O | O |
| Total Return | O | O |
| MDD | X | O |
| Sharpe Ratio | X | O |
| Sortino Ratio | X | O |
| Calmar Ratio | X | O |
| Profit Factor | X | O |
| Risk-Reward Ratio | X | O |
| Expectancy | X | O |
| Max Consecutive | X | O |
| Recovery Factor | X | O |
| Equity Curve Chart | X | O |

### 4.1 Free 사용자 표시

```
승률: 65.2%
총 수익률: +23.4%
---
[PRO] MDD, Sharpe, 손익비 등 10개 고급 지표 확인
```

---

## 5. Interpretation Guide (해석 가이드)

### 5.1 Metric Combinations

| 조합 | 해석 |
|------|------|
| 높은 승률 + 낮은 RR | "자주 이기지만 큰 손실 위험 있음" |
| 낮은 승률 + 높은 RR | "드물게 이기지만 이길 때 크게 이김" |
| 높은 Sharpe + 낮은 MDD | "안정적이고 효율적인 전략" |
| 높은 수익 + 높은 MDD | "고위험 고수익 전략" |
| PF < 1 | "장기적으로 손실 예상" |

### 5.2 Comprehensive Rating

```
function calculateOverallRating(metrics):
    score = 0

    // 승률 (20점)
    score += metrics.winRate > 60 ? 20 : metrics.winRate > 50 ? 15 : 10

    // MDD (20점)
    score += metrics.mdd < 15 ? 20 : metrics.mdd < 30 ? 15 : 5

    // Sharpe (20점)
    score += metrics.sharpe > 1.5 ? 20 : metrics.sharpe > 0.5 ? 15 : 5

    // Profit Factor (20점)
    score += metrics.pf > 1.5 ? 20 : metrics.pf > 1.0 ? 15 : 0

    // Expectancy (20점)
    score += metrics.expectancy > 0.5 ? 20 : metrics.expectancy > 0 ? 15 : 0

    return {
        score: score,
        grade: score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D',
        summary: generateSummary(score, metrics)
    }
```

---

## 6. Edge Cases & Safeguards

### 6.1 Division by Zero Prevention

```typescript
function safeDivide(numerator: number, denominator: number): number | null {
    if (denominator === 0 || !isFinite(denominator)) {
        return null;
    }
    return numerator / denominator;
}
```

### 6.2 Outlier Handling

```typescript
// 극단적 수익/손실 거래 처리 (IQR 방식)
function removeOutliers(returns: number[]): number[] {
    const q1 = percentile(returns, 25);
    const q3 = percentile(returns, 75);
    const iqr = q3 - q1;
    const lower = q1 - 1.5 * iqr;
    const upper = q3 + 1.5 * iqr;

    return returns.filter(r => r >= lower && r <= upper);
}
```

### 6.3 Disclaimer

모든 백테스트 결과 표시 시 필수 포함:
```
"과거 성과가 미래 수익을 보장하지 않습니다."
"Past performance does not guarantee future results."
```

---

## 7. Implementation Checklist (Phase 3용)

- [ ] `lib/backtest/metrics.ts` - 전체 지표 계산 함수
- [ ] `lib/backtest/equity.ts` - Equity Curve 생성
- [ ] `lib/backtest/drawdown.ts` - MDD 관련 계산
- [ ] `lib/backtest/risk.ts` - 리스크 지표 (Sharpe, Sortino, Calmar)
- [ ] `lib/backtest/trade.ts` - 거래 분석 (PF, RR, Expectancy)
- [ ] `types/backtest.ts` - TypeScript 인터페이스
- [ ] `components/BacktestReport.tsx` - Free/PRO 분기 UI
- [ ] Unit tests with edge cases

---

**Document Status**: COMPLETE
**Next Phase**: Phase 3 Implementation
