# RESULT — uiState별 한국어/영어 문구 세트 (보조도구 톤)

**Date**: 2025-12-27
**Agent**: Claude Code
**Phase**: 4-2 | Step COPY
**Status**: COMPLETE

---

## 톤 가이드

| 사용 | 금지 |
|------|------|
| 관찰, 근거, 가능성, 해석 | 추천, 확정, 보장, 예측 |
| ~로 해석됩니다 | ~할 것입니다 |
| ~가능성이 있습니다 | ~확실합니다 |
| 참고 정보 | 투자 조언 |

---

## 1. uiState별 문구 세트

### 1.1 `normal` (정상 표시)

#### 확률 카드

| 요소 | 한국어 | English |
|------|--------|---------|
| **헤더** | 통계 분석 결과 | Statistical Analysis |
| **서브텍스트** | 과거 패턴 기반 해석 | Based on historical patterns |
| **상승 라벨** | 상승 가능성 | Rise Probability |
| **하락 라벨** | 하락 가능성 | Drop Probability |
| **면책** | 참고용 통계이며, 투자 판단은 본인 책임입니다 | For reference only. You are responsible for your decisions |

#### 신뢰도 카드

| 요소 | 한국어 | English |
|------|--------|---------|
| **헤더** | 신뢰도 등급 | Confidence Grade |
| **A등급** | 지표 합의도 높음 | High indicator agreement |
| **B등급** | 대부분 지표 일치 | Most indicators aligned |
| **C등급** | 혼재된 시그널 | Mixed signals |
| **D등급** | 낮은 합의도 | Low agreement |
| **F등급** | 해석 어려움 — 관망 구간 | Hard to interpret — Hold zone |

#### 행동 제안 카드

| Action | 헤더 (KO) | 헤더 (EN) | 서브텍스트 (KO) | 서브텍스트 (EN) |
|--------|-----------|-----------|-----------------|-----------------|
| **HOLD** | 관망 구간 | Hold Zone | 명확한 방향성이 관찰되지 않습니다 | No clear direction observed |
| **PARTIAL** | 분할 검토 가능 | Scaled Entry Possible | 일부 지표에서 긍정 신호 관찰 | Positive signals in some indicators |
| **STOP_LOSS** | 리스크 점검 필요 | Risk Check Needed | 하락 시그널이 다수 관찰됩니다 | Multiple bearish signals observed |

#### 시장 상태 라벨

| Regime | 한국어 | English |
|--------|--------|---------|
| STRONG_TREND | 추세 구간 | Trending |
| RANGING | 횡보 구간 | Range-bound |
| HIGH_VOLATILITY | 변동성 확대 | High Volatility |

---

### 1.2 `insufficient` (데이터 부족)

#### 공통 패턴

| 요소 | 한국어 | English |
|------|--------|---------|
| **헤더** | 데이터 부족 | Insufficient Data |
| **아이콘** | 📊 (차트) 또는 ⏳ (대기) | 📊 or ⏳ |

#### 상황별 서브텍스트

| 상황 | 한국어 | English |
|------|--------|---------|
| **확률 분석** | 통계 산출에 필요한 데이터가 부족합니다 | Not enough data for statistical analysis |
| **백테스트** | 검증에 필요한 거래 이력이 부족합니다 | Insufficient trade history for validation |
| **프랙탈** | 패턴 비교를 위한 히스토리가 부족합니다 | Not enough history for pattern comparison |
| **신뢰도** | 신뢰도 계산에 필요한 지표가 부족합니다 | Missing indicators for confidence calculation |

#### 상세 정보

| 요소 | 한국어 | English |
|------|--------|---------|
| **현재/필요** | 현재 {n}건 / 최소 {min}건 필요 | Current: {n} / Required: {min} |
| **안내** | 데이터가 축적되면 자동으로 분석됩니다 | Analysis will run automatically when data accumulates |

#### 버튼 라벨

| 용도 | 한국어 | English |
|------|--------|---------|
| **새로고침** | 다시 확인 | Refresh |
| **돌아가기** | 돌아가기 | Go Back |

---

### 1.3 `pro-locked` (PRO 전용)

#### 공통

| 요소 | 한국어 | English |
|------|--------|---------|
| **헤더** | PRO 전용 | PRO Only |
| **아이콘** | 🔒 | 🔒 |

#### 기능별 서브텍스트

| 기능 | 한국어 | English |
|------|--------|---------|
| **신뢰도 점수** | 상세 점수와 구성 요소 확인 | View detailed score breakdown |
| **고급 지표** | MDD, Sharpe 등 전문 지표 확인 | Access MDD, Sharpe & more |
| **전체 리포트** | 리스크 분석 및 관찰 포인트 확인 | Full risk analysis & watch points |
| **분할 비율** | 진입/청산 비율 가이드 확인 | Entry/exit ratio guide |
| **자산 곡선** | 과거 성과 시각화 확인 | Historical performance chart |

#### 버튼 라벨

| 용도 | 한국어 | English |
|------|--------|---------|
| **Primary** | PRO로 더 보기 | Explore PRO |
| **Secondary** | 가격 확인 | View Pricing |
| **Minimal** | 잠금 해제 | Unlock |

#### 혜택 요약 (선택 표시)

```
KO: "12개 고급 지표 • 상세 리포트 • 분할 가이드"
EN: "12 advanced metrics • Full reports • Split guide"
```

---

### 1.4 `error` (오류 상태)

#### 공통

| 요소 | 한국어 | English |
|------|--------|---------|
| **헤더** | 일시적 오류 | Temporary Error |
| **아이콘** | ⚠️ | ⚠️ |

#### 오류 유형별 서브텍스트

| 유형 | 한국어 | English |
|------|--------|---------|
| **네트워크** | 연결 상태를 확인해 주세요 | Please check your connection |
| **서버** | 잠시 후 다시 시도해 주세요 | Please try again shortly |
| **타임아웃** | 응답 시간이 초과되었습니다 | Request timed out |
| **알 수 없음** | 문제가 발생했습니다 | Something went wrong |

#### 버튼 라벨

| 용도 | 한국어 | English |
|------|--------|---------|
| **재시도** | 다시 시도 | Retry |
| **홈으로** | 홈으로 | Go Home |
| **문의** | 문의하기 | Contact Support |

---

## 2. 999 / N/A 상황 문구

### 2.1 값이 999인 경우 (무한대/계산불가)

| 지표 | 원인 | 한국어 표시 | English |
|------|------|-------------|---------|
| **Profit Factor = 999** | 손실 거래 0건 | 손실 없음 (해석 주의) | No losses (interpret with caution) |
| **Sharpe = 999** | 표준편차 0 | 변동 없음 (산출 불가) | No variance (cannot calculate) |
| **Risk-Reward = 999** | 손실 거래 0건 | 손실 없음 (해석 주의) | No losses (interpret with caution) |

#### 표시 방식

```typescript
// 999 값 표시
if (value >= 999) {
    return {
        display: "—",  // 또는 "∞"
        tooltip: "손실 거래가 없어 산출되지 않습니다"
    };
}
```

---

### 2.2 N/A (계산 불가) 상황

| 상황 | 원인 | 한국어 | English |
|------|------|--------|---------|
| **데이터 0건** | 거래 이력 없음 | 거래 이력이 없습니다 | No trade history |
| **표본 부족** | n < minRequired | 최소 {min}건 필요 | Requires at least {min} trades |
| **0으로 나눔** | 분모가 0 | 계산할 수 없습니다 | Cannot calculate |
| **기간 부족** | 분석 기간 미달 | 더 긴 기간이 필요합니다 | Longer period required |

#### 지표별 N/A 문구

| 지표 | N/A 사유 (KO) | N/A Reason (EN) |
|------|---------------|-----------------|
| **Win Rate** | 거래 이력 없음 | No trades recorded |
| **MDD** | 변동 데이터 부족 | Not enough price movement |
| **Sharpe** | 최소 30건 거래 필요 | Requires 30+ trades |
| **Sortino** | 손실 거래 10건 미만 | Less than 10 losing trades |
| **Calmar** | 최소 50건 거래 필요 | Requires 50+ trades |
| **Expectancy** | 승/패 데이터 부족 | Missing win/loss data |

---

### 2.3 해석 불가 안내 문구

```typescript
const INTERPRETATION_UNAVAILABLE = {
    ko: {
        header: "해석 불가",
        reasons: {
            noData: "분석에 필요한 데이터가 없습니다",
            divisionByZero: "계산에 필요한 값이 0입니다",
            insufficientSample: "통계적으로 유의미한 표본이 부족합니다",
            outlierDetected: "이상치로 인해 신뢰할 수 없습니다",
            staleData: "데이터가 오래되어 유효하지 않습니다"
        },
        action: "충분한 데이터가 쌓이면 자동으로 표시됩니다"
    },
    en: {
        header: "Cannot Interpret",
        reasons: {
            noData: "No data available for analysis",
            divisionByZero: "Required value is zero",
            insufficientSample: "Sample size too small for significance",
            outlierDetected: "Unreliable due to outliers",
            staleData: "Data is stale and invalid"
        },
        action: "Will display automatically when enough data accumulates"
    }
};
```

---

## 3. 금지 문구 → 대체 표현표

### 3.1 확정적 표현 → 가능성 표현

| 금지 | 대체 (KO) | 대체 (EN) |
|------|-----------|-----------|
| 반드시 상승합니다 | 상승 가능성이 관찰됩니다 | Upside potential observed |
| 확실히 하락 | 하락 시그널이 다수 관찰됩니다 | Multiple bearish signals observed |
| ~할 것입니다 | ~가능성이 있습니다 | May / Could / Possible |
| 예측됩니다 | 해석됩니다 / 시사합니다 | Interpreted as / Suggests |
| 틀림없이 | 높은 가능성으로 | With high probability |

### 3.2 AI/예측 → 통계/분석

| 금지 | 대체 (KO) | 대체 (EN) |
|------|-----------|-----------|
| AI 예측 | 패턴 분석 결과 | Pattern analysis result |
| AI가 추천 | 통계상 긍정 신호 | Statistically positive signal |
| 인공지능 분석 | 알고리즘 분석 | Algorithmic analysis |
| 머신러닝 예측 | 데이터 기반 해석 | Data-driven interpretation |

### 3.3 투자 권유 → 정보 제공

| 금지 | 대체 (KO) | 대체 (EN) |
|------|-----------|-----------|
| 지금 사세요 | 매수 검토 가능 구간 | Entry consideration zone |
| 팔아야 합니다 | 청산 검토 권장 구간 | Exit consideration zone |
| 투자를 권장 | 참고 정보로 활용 | For reference |
| 추천 종목 | 분석 대상 | Analysis target |
| 매수 신호 | 긍정 시그널 관찰 | Positive signal observed |
| 매도 신호 | 부정 시그널 관찰 | Negative signal observed |

### 3.4 과장 → 중립

| 금지 | 대체 (KO) | 대체 (EN) |
|------|-----------|-----------|
| 급등 예정 | 상승 모멘텀 관찰 | Upward momentum observed |
| 폭락 위험 | 하락 압력 증가 | Downward pressure increasing |
| 대박 기회 | 주목할 만한 패턴 | Notable pattern |
| 놓치지 마세요 | (삭제 또는 미사용) | (Remove) |
| 지금 아니면 | (삭제) | (Remove) |

### 3.5 보장/확신 → 삭제

| 금지 | 조치 |
|------|------|
| 수익 보장 | **사용 불가** — 대체 없음 |
| 원금 보장 | **사용 불가** — 대체 없음 |
| 손실 없음 | **사용 불가** — 대체 없음 |
| 100% 확률 | **사용 불가** — 대체 없음 |
| 자동 매매 | **사용 불가** — 대체 없음 |

---

## 4. 빠른 참조 카드

### 헤더 문구 모음

```typescript
const HEADERS = {
    ko: {
        probability: "통계 분석",
        confidence: "신뢰도",
        backtest: "과거 검증",
        explanation: "해석 리포트",
        action: "행동 가이드"
    },
    en: {
        probability: "Statistics",
        confidence: "Confidence",
        backtest: "Backtest",
        explanation: "Interpretation",
        action: "Action Guide"
    }
};
```

### 버튼 라벨 모음

```typescript
const BUTTONS = {
    ko: {
        refresh: "새로고침",
        retry: "다시 시도",
        viewMore: "더 보기",
        unlock: "잠금 해제",
        goBack: "돌아가기",
        viewPricing: "가격 확인",
        explorePro: "PRO로 더 보기"
    },
    en: {
        refresh: "Refresh",
        retry: "Retry",
        viewMore: "View More",
        unlock: "Unlock",
        goBack: "Go Back",
        viewPricing: "View Pricing",
        explorePro: "Explore PRO"
    }
};
```

### 면책 문구

```typescript
const DISCLAIMER = {
    ko: {
        short: "참고용 통계입니다",
        medium: "과거 패턴 기반 해석이며, 투자 판단은 본인 책임입니다",
        full: "본 정보는 과거 데이터 기반 통계 해석으로, 미래 수익을 보장하지 않습니다. 모든 투자 결정의 책임은 사용자에게 있습니다."
    },
    en: {
        short: "For reference only",
        medium: "Historical pattern interpretation. You are responsible for your decisions",
        full: "This is a statistical interpretation based on historical data and does not guarantee future results. All investment decisions are your sole responsibility."
    }
};
```

---

## 5. 적용 우선순위

| 순위 | 파일 | 수정 내용 |
|------|------|-----------|
| 1 | `lib/ui/messages.ts` | 신규 생성 — 위 문구 상수화 |
| 2 | `lib/translations.ts` | 금지 표현 수정 |
| 3 | `components/PremiumLock.tsx` | CTA 문구 교체 |
| 4 | `lib/explanation/templates.ts` | 보조도구 톤으로 수정 |

---

## 산출물 위치

```
communication/Report/ClaudeCode/2025-12-27/
└── RESULT_PHASE4_STEP4-2_CLAUDE.md  (본 문서)
```

---

**Document Status**: COMPLETE
**Deliverables**:
- uiState별 문구 (헤더/서브텍스트/버튼) — 4개 상태
- 999/N/A 상황 문구 — 지표별 사유 포함
- 금지 문구 대체 표현표 — 5개 카테고리
