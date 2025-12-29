# RESULT — CLAUDE CODE

**Date**: 2025-12-27
**Agent**: Claude Code
**Phase**: 2 | Step 4
**Last Updated**: Session 8 (Intelligence Blueprint - Design Only)

---

## 요약 (5줄)

1. **확률 모델 재정의 완료** — 18개 입력 피처, 시장 상태별 동적 가중치, Sigmoid 변환 확률 산출 (15-85% 범위 제한)
2. **신뢰도 5요소 시스템** — 지표합의도(30%) + 추세정합성(25%) + 거래량확인(20%) + 과거정확도(15%) + 변동성감점(-10%)
3. **12개 고급 백테스트 지표 설계** — MDD, Sharpe, Sortino, Calmar, Profit Factor, Risk-Reward, Expectancy 등
4. **3단 구조 설명 템플릿** — (근거 → 리스크 → 관찰 포인트) × 3가지 행동(관망/분할/손절)
5. **금지 표현 검증 시스템** — "확정적 예측/AI 예측/투자 권유" 등 자동 필터링 로직 포함

---

## 설계 결정사항 (핵심 bullet)

### 확률 모델
- 확률 범위: 15% ~ 85% (0%/100% 금지)
- 시장 상태 3단계(STRONG_TREND/RANGING/HIGH_VOLATILITY) 가중치 매트릭스
- "AI 예측" → "통계적 패턴 분석" 용어 통일

### 신뢰도
- A등급(80+): 강한 합의 + 추세 일치 + 거래량 확인
- F등급(<35): 관망 권장
- 데이터 품질(표본 수/지연/거래량) 보정 적용

### 백테스트
- 최소 데이터: 지표별 10~50회 거래
- 데이터 부족 시 "insufficient" 상태 반환
- Division by Zero 방지 로직 필수

### 설명 템플릿
- 금지 표현 10개 카테고리 정규식 검증
- Free: 요약 + 리스크 1개 + 관찰점 1개
- PRO: 전체 상세 + 분할 비율 + 긴급도

---

## 확률/신뢰도 산식 (의사코드)

```
// 1. 개별 지표 점수 (-100 ~ +100)
indicatorScore = calculateIndicatorScore(indicator, value)

// 2. 시장 상태별 가중치 적용
weight = WEIGHT_MATRIX[marketRegime][indicator]
weightedScore = Σ(indicatorScore × weight) / Σ(weight)

// 3. 확률 변환 (Sigmoid-like)
normalized = (weightedScore + 100) / 200
riseProb = clamp(50 + (normalized - 0.5) × 70, 15, 85)

// 4. 신뢰도 계산
confidence = indicatorAgreement(30)
           + trendAlignment(25)
           + volumeConfirmation(20)
           + historicalAccuracy(15)
           + volatilityPenalty(-10~0)

// 5. 데이터 품질 보정
if (sampleSize < 30) confidence × 0.7
if (dataAge > 60sec) confidence × 0.8
```

---

## 백테스트 지표 정의/계산 요약

| 지표 | 계산식 | 최소 데이터 | Free/PRO |
|------|--------|-------------|----------|
| Win Rate | wins / total × 100 | 10회 | Free |
| Total Return | (final - initial) / initial × 100 | 10회 | Free |
| MDD | max(peak - trough) / peak × 100 | 20회 | PRO |
| Sharpe | (avgReturn - rf) / stdDev × √252 | 30회 | PRO |
| Sortino | (avgReturn - rf) / downsideDev × √252 | 30회 | PRO |
| Calmar | annualReturn / MDD | 50회 | PRO |
| Profit Factor | grossProfit / grossLoss | 20회 | PRO |
| Risk-Reward | avgWin / avgLoss | 10회 | PRO |
| Expectancy | (winRate × avgWin) - (lossRate × avgLoss) | 10회 | PRO |

---

## 사용자 설명 템플릿 (관망/분할/손절)

### 관망 (HOLD)
```
[근거] 혼재된 시그널로 관망 권장
       {bullishCount}개 상승 vs {bearishCount}개 하락 지표 충돌

[리스크] 급격한 방향성 형성 시 기회 비용 발생 가능

[관찰] • {keyIndicator}이(가) {threshold} 돌파 시 재평가
       • 거래량 {ratio}배 증가 시 주목
```

### 분할 (PARTIAL)
```
[근거] 추세 초기 단계 - 분할 진입 검토
       {confirmed}개 지표 확인, {pending}개 확인 대기

[리스크] 추세 확정 전 반전 시 손실 가능

[관찰] • 1차 진입 후 {nextSignal} 확인 시 2차 검토
       • 손절 라인: ${stopLoss} ({percent}%)

[분할 비율] 1차 30% → 2차 40% → 3차 30%
```

### 손절 (STOP_LOSS)
```
[근거] 지지선 붕괴 - 손절 검토 ⚠️
       ${supportLevel} 하향 이탈, 추가 하락 확률 {dropRate}%

[리스크] 휩쏘 후 반등 가능성 {whipsawRate}%

[관찰] • ${nextSupport} 다음 지지선 반등 여부
       • 4시간봉 종가 회복 시 손절 보류 검토

⚠️ 설정된 손절 라인 준수 권장
```

---

## 리스크/보류사항

| 항목 | 상태 | 설명 |
|------|------|------|
| 코드 구현 | **금지** | 본 Step은 설계만, Phase 3에서 구현 |
| 샘플 사이즈 임계값 | **결정 필요** | 30회 vs 50회 vs 100회 |
| 과거 정확도 데이터 | **필요** | 히스토리컬 시그널 DB 구축 선행 |
| Free/PRO 경계 | **확정** | 본 문서 기준으로 고정 |
| 성능 테스트 | **Phase 3** | 계산 지연 측정 필요 |

---

## 다음 Step 체크리스트 (Phase 3 구현 시 필요한 입력)

### 선행 조건
- [ ] 히스토리컬 시그널 DB 스키마 확정
- [ ] Free/PRO 기능 목록 최종 승인
- [ ] 샘플 사이즈 임계값 결정 (Commander)

### 구현 대상 파일
- [ ] `lib/probability/engine.ts` — 확률 계산 핵심 로직
- [ ] `lib/probability/confidence.ts` — 신뢰도 산출
- [ ] `lib/probability/regime.ts` — 시장 상태 분류
- [ ] `lib/probability/weights.ts` — 가중치 매트릭스
- [ ] `lib/backtest/metrics.ts` — 12개 지표 계산
- [ ] `lib/backtest/equity.ts` — Equity Curve
- [ ] `lib/explanation/templates.ts` — 템플릿 정의
- [ ] `lib/explanation/renderer.ts` — 변수 치환
- [ ] `lib/explanation/validator.ts` — 금지 표현 검증
- [ ] `types/probability.ts` — 인터페이스 정의
- [ ] `types/backtest.ts` — 인터페이스 정의
- [ ] `types/explanation.ts` — 인터페이스 정의

### 테스트 케이스
- [ ] 극단값 (0%, 100% 확률 방지)
- [ ] Division by Zero (손실 거래 0회)
- [ ] 금지 표현 검출 테스트
- [ ] 데이터 부족 시 graceful degradation

---

## 산출물 위치

```
F:\11 dev\251206 코인 차트분석\communication\Report\CLAUDE_CODE\2025-12-27\
├── PROMPT.md                              (Prompt 1-8 기록)
├── RESULT.md                              (본 문서)
├── Phase2_Probability_Model_Design.md     ← NEW (확률 모델 설계서)
├── Phase2_Backtest_Metrics_Design.md      ← NEW (백테스트 지표 설계서)
├── Phase2_Explanation_Templates_Spec.md   ← NEW (설명 템플릿 규격)
├── Probability_Model.md                   (이전 세션)
└── Explanation_Templates.md               (이전 세션)
```

---

**Status**: COMPLETE (Phase 2 | Step 4)
**Deliverables**: 3종 완료 (확률 모델 + 백테스트 지표 + 설명 템플릿)
**Next Phase**: Commander 승인 → Phase 3 구현
