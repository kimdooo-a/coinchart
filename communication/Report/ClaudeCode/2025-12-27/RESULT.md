# RESULT — Intelligence Blueprint (Design Only)

**Date**: 2025-12-27
**Agent**: Claude Code
**Phase**: 2 | Step 4
**Status**: COMPLETE

---

## 요약 (5줄)

1. **확률 모델 완전 재정의** — 18개 입력 피처, 시장 상태별 동적 가중치(STRONG_TREND/RANGING/HIGH_VOLATILITY), Sigmoid 변환 확률 산출 (15-85% 범위 제한으로 극단값 방지)
2. **신뢰도 5요소 시스템 설계** — 지표합의도(30%) + 추세정합성(25%) + 거래량확인(20%) + 과거정확도(15%) + 변동성감점(-10%) = 0~100점, A~F 등급화
3. **12개 고급 백테스트 지표 설계** — MDD, Sharpe, Sortino, Calmar, Profit Factor, Risk-Reward, Expectancy 등 전문 트레이더 수준 분석 지원
4. **3단 구조 설명 템플릿 완성** — (근거 요약 → 리스크 → 관찰 포인트) × 3가지 행동 타입(관망/분할/손절), 상황별 6개 세부 템플릿
5. **금지 표현 검증 시스템** — 10개 카테고리 정규식 자동 필터링, "AI 예측" → "통계적 패턴 분석" 용어 강제 치환

---

## 설계 결정사항 (핵심 bullet)

### 확률 모델
- **입력 피처**: 18개 (RSI, MACD, BB, Stoch, CCI, Williams%R, ADX, DI, EMA, ATR, Volume, Fractal 등)
- **확률 범위**: 15% ~ 85% (0%/100% 절대 금지)
- **시장 상태 분류**: 3단계(STRONG_TREND/RANGING/HIGH_VOLATILITY) 가중치 매트릭스
- **용어 통일**: "AI 예측" → "통계적 패턴 분석(statistical pattern analysis)"

### 신뢰도
- **A등급(80+)**: 강한 합의 + 추세 일치 + 거래량 확인
- **F등급(<35)**: 관망 권장
- **데이터 품질 보정**: 표본 수(<30 → ×0.7), 데이터 지연(>60초 → ×0.8), 거래량 부족(<0.3 → ×0.85)

### 백테스트
- **지표별 최소 데이터**: 10~50회 거래 (지표마다 상이)
- **데이터 부족 시**: `status: 'insufficient'` 반환 + 현재 데이터 수 표시
- **안전장치**: Division by Zero 방지, IQR 기반 이상치 제거

### 설명 템플릿
- **금지 표현**: 10개 카테고리 정규식 검증
- **Free 사용자**: 요약 + 리스크 1개 + 관찰점 1개
- **PRO 사용자**: 전체 상세 + 분할 비율 + 긴급도 + 과거 통계

---

## 확률/신뢰도 산식 (의사코드/수식)

### 확률 계산
```
// 1. 개별 지표 점수 산출 (-100 ~ +100)
function calculateIndicatorScore(indicator, value):
    switch indicator:
        case 'rsi':
            if value < 30: return +80 × (30 - value) / 30  // 과매도 → 상승
            if value > 70: return -80 × (value - 70) / 30  // 과매수 → 하락
            return 0
        case 'macd_signal_cross':
            if value == 'bullish': return +70
            if value == 'bearish': return -70
            return 0
        // ... 18개 지표 각각 정의

// 2. 시장 상태별 가중치 적용
WEIGHT_MATRIX = {
    'STRONG_TREND': { rsi: 0.8, macd: 1.5, adx: 1.3, bb: 0.7, stoch: 0.6 },
    'RANGING':      { rsi: 1.4, macd: 0.7, adx: 0.5, bb: 1.3, stoch: 1.4 },
    'HIGH_VOLATILITY': { rsi: 0.6, macd: 0.8, adx: 1.0, bb: 0.5, stoch: 0.5 }
}

weight = WEIGHT_MATRIX[marketRegime][indicator]
weightedScore = SUM(indicatorScore × weight) / SUM(weight)

// 3. 확률 변환 (Sigmoid-like)
normalized = (weightedScore + 100) / 200  // 0~1
riseProb = 50 + (normalized - 0.5) × 70
riseProb = clamp(riseProb, 15, 85)  // 극단값 방지
dropProb = 100 - riseProb
```

### 신뢰도 계산
```
function calculateConfidence(features, historicalData):
    // 1. 지표 합의도 (30점 만점)
    agreementRatio = countSameDirection(signals) / totalSignals
    indicatorScore = agreementRatio × 30

    // 2. 추세 정합성 (25점 만점)
    if adx > 25:
        trendScore = (plus_di > minus_di) == (riseProb > 50) ? 25 : 0
    else:
        trendScore = 12  // 횡보장 = 중립

    // 3. 거래량 확인 (20점 만점)
    volumeScore = volume_price_confirm ? 20 : 5

    // 4. 과거 정확도 (15점 만점)
    historicalScore = historicalData.accuracy × 15

    // 5. 변동성 감점 (-10~0점)
    volatilityPenalty = volatility_regime == 'extreme' ? -10 :
                        volatility_regime == 'high' ? -5 : 0

    totalScore = indicatorScore + trendScore + volumeScore
                 + historicalScore + volatilityPenalty

    return {
        score: clamp(totalScore, 0, 100),
        grade: scoreToGrade(totalScore)  // 80+:A, 65-79:B, 50-64:C, 35-49:D, <35:F
    }

// 데이터 품질 보정
if sampleSize < 30: confidence.score *= 0.7
if dataAge > 60sec: confidence.score *= 0.8
if volumeRatio < 0.3: confidence.score *= 0.85
```

---

## 백테스트 지표 정의/계산 요약

| 지표 | 정의 | 계산식 | 최소 데이터 | Free/PRO |
|------|------|--------|-------------|----------|
| **Win Rate** | 수익 거래 비율 | wins / total × 100 | 10회 | Free |
| **Total Return** | 누적 수익률 | (final - initial) / initial × 100 | 10회 | Free |
| **MDD** | 최대 낙폭 | max(peak - trough) / peak × 100 | 20회 | PRO |
| **Sharpe Ratio** | 리스크 대비 수익 | (avgReturn - rf) / stdDev × sqrt(252) | 30회 | PRO |
| **Sortino Ratio** | 하방 리스크 대비 수익 | (avgReturn - rf) / downsideDev × sqrt(252) | 30회 | PRO |
| **Calmar Ratio** | MDD 대비 연수익 | annualReturn / MDD | 50회 | PRO |
| **Profit Factor** | 손익 비율 | grossProfit / grossLoss | 20회 | PRO |
| **Risk-Reward** | 평균 손익비 | avgWin / avgLoss | 10회 | PRO |
| **Expectancy** | 거래당 기대값 | (winRate × avgWin) - (lossRate × avgLoss) | 10회 | PRO |
| **Max Consecutive** | 최대 연속 승/패 | max(연속 수익/손실) | 10회 | PRO |
| **Recovery Factor** | 회복 계수 | totalReturn / MDD | 20회 | PRO |
| **Drawdown Duration** | 낙폭 지속 기간 | max(회복 소요 시간) | 20회 | PRO |

### 해석 가이드 (사용자 표시)
| 지표 | 범위 | 표시 문구 |
|------|------|----------|
| Sharpe > 2.0 | 우수 | "우수한 리스크 대비 수익" |
| Sharpe 1.0-2.0 | 양호 | "양호한 리스크 대비 수익" |
| MDD < 10% | 낮음 | "낮은 리스크 (최대 낙폭 {mdd}%)" |
| MDD 25-50% | 높음 | "높은 리스크 - 자금 관리 중요" |
| PF > 2.0 | 우수 | "수익이 손실의 2배 이상" |
| RR > 3:1 | 우수 | "수익 거래가 손실의 3배 이상" |

---

## 사용자 설명 템플릿 (관망/분할/손절)

### 3단 구조
```
1. 근거 요약 (Rationale Summary) - 왜 이 결론인가?
2. 리스크 (Risk Factors) - 반대 시나리오/주의 조건
3. 다음 관찰 포인트 (Watch Points) - 재평가 조건
```

### 관망 (HOLD)
```
[근거]
혼재된 시그널로 관망 권장
{bullishCount}개 상승 지표와 {bearishCount}개 하락 지표가 충돌합니다.
{strongestBullish}은(는) 상승을, {strongestBearish}은(는) 하락을 시사합니다.

[리스크]
- {dominantDirection} 방향으로 급격한 움직임 발생 시 기회 비용
- 횡보 장기화 시 거래 비용 누적 가능

[관찰 포인트]
- {keyIndicator}이(가) {threshold}을(를) 돌파할 경우 재평가
- {priceLevel} 가격대 돌파/이탈 시 방향성 확인
- 거래량 {volumeThreshold}배 이상 증가 시 주목
```

### 분할 (PARTIAL)
```
[근거]
추세 초기 단계 - 분할 진입 검토
{trendDirection} 추세 초기 신호가 감지되었습니다.
{confirmedIndicators}개 지표 확인, {pendingIndicators}개 확인 대기 중입니다.

[리스크]
- 추세 확정 전 반전 시 손실 가능
- 조기 진입으로 더 좋은 가격 기회 상실 가능

[관찰 포인트]
- 1차 진입 후 {confirmLevel} 확인 시 2차 진입 검토
- 손절 라인: ${stopLoss} ({stopLossPercent}%)
- {pendingIndicator} 확인 시 추가 진입 고려

[분할 비율]
- 1차: 30% | 2차: 40% | 3차: 30%
- 각 단계 사이 지표 확인 필수
```

### 손절 (STOP_LOSS)
```
[근거]
지지선 붕괴 - 손절 검토 !!!
핵심 지지선 ${supportLevel}이(가) 하향 이탈되었습니다.
과거 동일 패턴에서 {furtherDropRate}% 확률로 추가 하락 발생.

[리스크]
- 일시적 휩쏘(Whipsaw) 후 반등 가능성 {whipsawRate}%
- 손절 후 V자 반등 시 재진입 비용 발생

[관찰 포인트]
- ${nextSupport} 다음 지지선에서 반등 여부 관찰
- 4시간봉 종가가 ${supportLevel} 상회 시 손절 보류 검토
- 거래량 급증 없는 하락은 약한 신호일 수 있음

!!! 설정된 손절 라인 준수 권장
```

### 금지 표현 체크리스트
| 금지 표현 | 대체 표현 |
|-----------|-----------|
| "반드시 상승합니다" | "상승 확률이 높은 패턴입니다" |
| "확실히 하락" | "하락 가능성을 시사하는 지표입니다" |
| "100% 수익" | "과거 유사 패턴에서 N% 수익 발생" |
| "지금 사세요" | "매수 검토 가능한 조건입니다" |
| "무조건 팔아야" | "리스크 관리 관점에서 청산 검토 권장" |
| "AI가 예측" | "통계적 패턴 분석 결과" |
| "투자를 권장" | "참고 정보로 활용하세요" |
| "원금 보장" | (사용 불가) |
| "손실 없음" | (사용 불가) |
| "자동 매매" | (사용 불가) |

```typescript
// 검증 정규식
const PROHIBITED_PATTERNS = [
    /반드시|확실히|무조건|100%|보장|원금|손실.*없/g,
    /사세요|팔아야|매수하세요|매도하세요/g,
    /AI.*예측|인공지능.*예측/g,
    /투자.*권장|권유|추천/g,
    /자동.*매매|오토.*트레이딩/g
];
```

---

## 리스크/보류사항

| 항목 | 상태 | 설명 |
|------|------|------|
| 코드 구현 | **금지** | 본 Step은 설계만, Phase 3에서 구현 |
| 샘플 사이즈 임계값 | **결정 필요** | 30회 vs 50회 vs 100회 (Commander 결정) |
| 과거 정확도 데이터 | **선행 필요** | 히스토리컬 시그널 DB 구축 필요 |
| Free/PRO 경계 | **확정** | 본 문서 기준으로 고정 |
| 성능 테스트 | **Phase 3** | 계산 지연 측정 필요 |

---

## 다음 Step 체크리스트 (Phase 3 구현 시 필요한 입력)

### 선행 조건
- [ ] 히스토리컬 시그널 DB 스키마 확정
- [ ] Free/PRO 기능 목록 최종 승인 (Commander)
- [ ] 샘플 사이즈 임계값 결정 (Commander)

### 구현 대상 파일
```
lib/probability/
  - engine.ts      : 확률 계산 핵심 로직
  - confidence.ts  : 신뢰도 산출
  - regime.ts      : 시장 상태 분류
  - weights.ts     : 가중치 매트릭스

lib/backtest/
  - metrics.ts     : 12개 지표 계산 함수
  - equity.ts      : Equity Curve 생성
  - drawdown.ts    : MDD 관련 계산
  - risk.ts        : Sharpe, Sortino, Calmar
  - trade.ts       : PF, RR, Expectancy

lib/explanation/
  - templates.ts   : 템플릿 정의
  - renderer.ts    : 변수 치환 및 렌더링
  - validator.ts   : 금지 표현 검증
  - generator.ts   : 조건 기반 템플릿 선택

types/
  - probability.ts : 확률 관련 인터페이스
  - backtest.ts    : 백테스트 관련 인터페이스
  - explanation.ts : 설명 관련 인터페이스

components/
  - ProbabilityDisplay.tsx  : Free/PRO 분기 UI
  - BacktestReport.tsx      : Free/PRO 분기 UI
  - ExplanationCard.tsx     : Free/PRO 분기 UI
```

### 테스트 케이스
- [ ] 극단값 (0%, 100% 확률 방지)
- [ ] Division by Zero (손실 거래 0회)
- [ ] 금지 표현 검출 테스트
- [ ] 데이터 부족 시 graceful degradation
- [ ] 시장 상태별 가중치 적용 검증
- [ ] Free/PRO 데이터 마스킹 검증

---

## 산출물 위치

```
F:\11 dev\251206 코인 차트분석\communication\Report\
├── CLAUDE_CODE\2025-12-27\
│   ├── Phase2_Probability_Model_Design.md     (상세 확률 모델 설계서)
│   ├── Phase2_Backtest_Metrics_Design.md      (상세 백테스트 지표 설계서)
│   └── Phase2_Explanation_Templates_Spec.md   (상세 설명 템플릿 규격)
│
└── ClaudeCode\2025-12-27\
    ├── PROMPT.md     (본 프롬프트 원문)
    └── RESULT.md     (본 문서)
```

---

## 필수 Disclaimer

모든 분석 결과 표시 시 필수 포함:
```
"과거 패턴 기반 통계 분석이며, 투자 결정은 본인 책임입니다."
"This is statistical analysis based on historical patterns. Investment decisions are your own responsibility."

"과거 성과가 미래 수익을 보장하지 않습니다."
"Past performance does not guarantee future results."
```

---

**Document Status**: COMPLETE
**Deliverables**: 3종 완료 (확률 모델 + 백테스트 지표 + 설명 템플릿)
**Next Phase**: Commander 승인 후 Phase 3 구현 진행
