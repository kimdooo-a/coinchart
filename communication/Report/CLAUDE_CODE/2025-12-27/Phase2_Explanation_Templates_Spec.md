# Explanation Templates Specification

**Phase**: 2 | Step 4
**Type**: Design Only (No Implementation)
**Date**: 2025-12-27

---

## 1. Overview

사용자에게 "왜 이 분석 결과인가?"를 규칙 기반으로 설명하는 템플릿 시스템.
관망/분할/손절 각 상황에 대해 3단 구조(근거 요약 → 리스크 → 다음 관찰 포인트)로 제공한다.

**핵심 원칙**:
- 확정적 표현 금지 (→ 확률/가능성 표현으로 대체)
- 투자 권유/보장 표현 금지
- 모든 설명은 과거 데이터 기반 통계임을 명시

---

## 2. Prohibited Expressions Checklist (금지 표현)

### 2.1 절대 사용 금지

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

### 2.2 Validation Function

```typescript
const PROHIBITED_PATTERNS = [
    /반드시|확실히|무조건|100%|보장|원금|손실.*없/g,
    /사세요|팔아야|매수하세요|매도하세요/g,
    /AI.*예측|인공지능.*예측/g,
    /투자.*권장|권유|추천/g,
    /자동.*매매|오토.*트레이딩/g
];

function validateExplanation(text: string): ValidationResult {
    const violations = [];
    for (const pattern of PROHIBITED_PATTERNS) {
        const matches = text.match(pattern);
        if (matches) {
            violations.push({ pattern: pattern.source, matches });
        }
    }
    return {
        isValid: violations.length === 0,
        violations
    };
}
```

---

## 3. Template Structure (3단 구조)

모든 설명은 다음 3단 구조를 따른다:

```
1. 근거 요약 (Rationale Summary)
   - 왜 이 결론인가? (지표/패턴 기반)

2. 리스크 (Risk Factors)
   - 반대 시나리오 가능성
   - 주의해야 할 조건

3. 다음 관찰 포인트 (Next Watch Points)
   - 어떤 조건이 바뀌면 재평가 필요
   - 확인해야 할 지표/가격 레벨
```

---

## 4. Action Type Templates

### 4.1 관망 (HOLD/WAIT)

**트리거 조건**:
- 신뢰도 등급 D 이하
- 지표 간 충돌 (Bullish/Bearish 혼재)
- 변동성 극심 (ATR > 6%)
- 주요 지지/저항선 근접 (±1%)

#### Template: HOLD_MIXED_SIGNALS

```json
{
    "type": "HOLD",
    "reason": "MIXED_SIGNALS",
    "template": {
        "rationale": {
            "headline": "혼재된 시그널로 관망 권장",
            "detail": "{bullishCount}개 상승 지표와 {bearishCount}개 하락 지표가 충돌합니다. {strongestBullish}은(는) 상승을, {strongestBearish}은(는) 하락을 시사합니다."
        },
        "risk": {
            "primary": "{dominantDirection} 방향으로 급격한 움직임 발생 시 기회 비용",
            "secondary": "횡보 장기화 시 거래 비용 누적 가능"
        },
        "watchPoints": [
            "{keyIndicator}이(가) {threshold}을(를) {direction}할 경우 재평가",
            "{priceLevel} 가격대 돌파/이탈 시 방향성 확인",
            "거래량 {volumeThreshold}배 이상 증가 시 주목"
        ]
    }
}
```

**출력 예시**:
```
📊 분석 결과: 관망

[근거]
혼재된 시그널로 관망 권장
3개 상승 지표와 2개 하락 지표가 충돌합니다.
RSI(32.5)는 상승을, MACD 히스토그램(-0.02)은 하락을 시사합니다.

[리스크]
• 상승 방향으로 급격한 움직임 발생 시 기회 비용
• 횡보 장기화 시 거래 비용 누적 가능

[관찰 포인트]
• RSI가 40을 상향 돌파할 경우 재평가
• $42,500 가격대 돌파 시 방향성 확인
• 거래량 1.5배 이상 증가 시 주목
```

---

#### Template: HOLD_HIGH_VOLATILITY

```json
{
    "type": "HOLD",
    "reason": "HIGH_VOLATILITY",
    "template": {
        "rationale": {
            "headline": "극심한 변동성으로 관망 권장",
            "detail": "현재 ATR이 {atrPercent}%로 평균 대비 {atrRatio}배 높습니다. 변동성이 높을 때 지표 신뢰도가 저하됩니다."
        },
        "risk": {
            "primary": "급격한 방향성 형성 시 진입 기회 상실",
            "secondary": "변동성 지속 시 손절 빈도 증가 가능"
        },
        "watchPoints": [
            "ATR이 {normalAtr}% 이하로 하락할 때까지 대기",
            "볼린저밴드 폭이 축소되면 돌파 준비",
            "거래량 감소와 함께 변동성 축소 확인"
        ]
    }
}
```

---

#### Template: HOLD_NEAR_RESISTANCE

```json
{
    "type": "HOLD",
    "reason": "NEAR_RESISTANCE",
    "template": {
        "rationale": {
            "headline": "주요 저항선 근접으로 관망 권장",
            "detail": "현재가 ${currentPrice}가 저항선 ${resistanceLevel} 대비 {distancePercent}% 이내입니다. 과거 {testCount}회 테스트에서 {rejectionRate}% 하락 반전되었습니다."
        },
        "risk": {
            "primary": "강한 돌파 시 급격한 상승 추세 형성 가능",
            "secondary": "돌파 실패 시 조정 폭 확대 가능"
        },
        "watchPoints": [
            "${resistanceLevel} 돌파 + 종가 유지 시 상승 전환 신호",
            "거래량 급증과 함께 돌파 시 신뢰도 상승",
            "3회 이상 저항 테스트 시 돌파 확률 증가"
        ]
    }
}
```

---

### 4.2 분할 (PARTIAL/SCALED)

**트리거 조건**:
- 신뢰도 등급 B-C
- 일부 지표 확인, 일부 미확인
- 추세 초기 단계
- 리스크 관리 필요

#### Template: PARTIAL_ENTRY_TREND_EARLY

```json
{
    "type": "PARTIAL",
    "reason": "TREND_EARLY_STAGE",
    "template": {
        "rationale": {
            "headline": "추세 초기 단계 - 분할 진입 검토",
            "detail": "{trendDirection} 추세 초기 신호가 감지되었습니다. {confirmedIndicators}개 지표 확인, {pendingIndicators}개 지표 확인 대기 중입니다."
        },
        "risk": {
            "primary": "추세 확정 전 반전 시 손실 가능",
            "secondary": "조기 진입으로 더 좋은 가격 기회 상실 가능"
        },
        "watchPoints": [
            "1차 진입 후 {confirmLevel} 확인 시 2차 진입 검토",
            "손절 라인: ${stopLoss} ({stopLossPercent}%)",
            "{pendingIndicator} 확인 시 추가 진입 고려"
        ]
    },
    "suggestedAllocation": {
        "phase1": "30%",
        "phase2": "40%",
        "phase3": "30%",
        "conditions": ["각 단계 사이 지표 확인 필수"]
    }
}
```

**출력 예시**:
```
📊 분석 결과: 분할 진입 검토

[근거]
상승 추세 초기 단계 - 분할 진입 검토
상승 추세 초기 신호가 감지되었습니다.
3개 지표 확인, 2개 지표 확인 대기 중입니다.

[리스크]
• 추세 확정 전 반전 시 손실 가능
• 조기 진입으로 더 좋은 가격 기회 상실 가능

[관찰 포인트]
• 1차 진입 후 MACD 골든크로스 확인 시 2차 진입 검토
• 손절 라인: $41,200 (-3.5%)
• ADX 25 상향 돌파 시 추가 진입 고려

[분할 비율 참고]
• 1차: 30% | 2차: 40% | 3차: 30%
• 각 단계 사이 지표 확인 필수
```

---

#### Template: PARTIAL_EXIT_PROFIT_TAKING

```json
{
    "type": "PARTIAL",
    "reason": "PROFIT_TAKING",
    "template": {
        "rationale": {
            "headline": "목표가 도달 - 분할 익절 검토",
            "detail": "현재 수익률 +{profitPercent}%로 1차 목표 ${target1} 도달. 과거 유사 패턴에서 {continuationRate}% 확률로 추가 상승했습니다."
        },
        "risk": {
            "primary": "조기 익절 시 추가 수익 기회 상실",
            "secondary": "미익절 시 수익 환수 가능"
        },
        "watchPoints": [
            "1차 익절 후 ${target2} 2차 목표 관찰",
            "트레일링 스탑 ${trailingStop}로 수익 보호",
            "거래량 감소 + 음봉 출현 시 전량 청산 검토"
        ]
    },
    "suggestedAllocation": {
        "phase1": "50%",
        "remaining": "50%",
        "conditions": ["트레일링 스탑으로 보호"]
    }
}
```

---

### 4.3 손절 (STOP_LOSS)

**트리거 조건**:
- 진입 기준 무효화
- 손절 라인 도달
- 추세 반전 확정
- 시스템적 리스크 감지

#### Template: STOP_LOSS_BREAKDOWN

```json
{
    "type": "STOP_LOSS",
    "reason": "SUPPORT_BREAKDOWN",
    "template": {
        "rationale": {
            "headline": "지지선 붕괴 - 손절 검토",
            "detail": "핵심 지지선 ${supportLevel}이(가) 하향 이탈되었습니다. 과거 동일 패턴에서 {furtherDropRate}% 확률로 추가 하락이 발생했습니다."
        },
        "risk": {
            "primary": "일시적 휩쏘(Whipsaw) 후 반등 가능성 {whipsawRate}%",
            "secondary": "손절 후 V자 반등 시 재진입 비용 발생"
        },
        "watchPoints": [
            "${nextSupport} 다음 지지선에서 반등 여부 관찰",
            "4시간봉 종가가 ${supportLevel} 상회 시 손절 보류 검토",
            "거래량 급증 없는 하락은 약한 신호일 수 있음"
        ]
    },
    "urgency": "HIGH",
    "suggestedAction": "설정된 손절 라인 준수 권장"
}
```

**출력 예시**:
```
📊 분석 결과: 손절 검토 ⚠️

[근거]
지지선 붕괴 - 손절 검토
핵심 지지선 $41,500이(가) 하향 이탈되었습니다.
과거 동일 패턴에서 72% 확률로 추가 하락이 발생했습니다.

[리스크]
• 일시적 휩쏘(Whipsaw) 후 반등 가능성 15%
• 손절 후 V자 반등 시 재진입 비용 발생

[관찰 포인트]
• $40,000 다음 지지선에서 반등 여부 관찰
• 4시간봉 종가가 $41,500 상회 시 손절 보류 검토
• 거래량 급증 없는 하락은 약한 신호일 수 있음

⚠️ 설정된 손절 라인 준수 권장
```

---

#### Template: STOP_LOSS_TREND_REVERSAL

```json
{
    "type": "STOP_LOSS",
    "reason": "TREND_REVERSAL",
    "template": {
        "rationale": {
            "headline": "추세 반전 신호 - 포지션 정리 검토",
            "detail": "{reversingIndicators}개 지표가 추세 반전을 시사합니다. {keyReversal}이(가) 핵심 반전 신호로 작용합니다."
        },
        "risk": {
            "primary": "반전 확정까지 시간 소요로 추가 손실 가능",
            "secondary": "가짜 신호(False Signal) 시 불필요한 손절"
        },
        "watchPoints": [
            "{confirmationIndicator} 추가 확인 후 최종 결정",
            "반등 시 ${reentryLevel} 재진입 검토 가능",
            "거래량 동반 여부로 신호 강도 판단"
        ]
    }
}
```

---

## 5. Dynamic Variable Mapping

### 5.1 Variable Types

```typescript
interface TemplateVariables {
    // 가격 관련
    currentPrice: number;
    supportLevel: number;
    resistanceLevel: number;
    stopLoss: number;
    target1: number;
    target2: number;

    // 지표 관련
    rsi: number;
    macd: number;
    atr: number;
    adx: number;

    // 통계 관련
    bullishCount: number;
    bearishCount: number;
    rejectionRate: number;
    continuationRate: number;

    // 텍스트
    strongestBullish: string;
    strongestBearish: string;
    trendDirection: '상승' | '하락';
    dominantDirection: '상승' | '하락';
}
```

### 5.2 Rendering Function

```typescript
function renderTemplate(
    template: string,
    variables: TemplateVariables
): string {
    let result = template;

    for (const [key, value] of Object.entries(variables)) {
        const placeholder = `{${key}}`;
        const formattedValue = formatValue(key, value);
        result = result.replace(new RegExp(placeholder, 'g'), formattedValue);
    }

    // 금지 표현 검증
    const validation = validateExplanation(result);
    if (!validation.isValid) {
        console.error('Prohibited expression detected:', validation.violations);
        throw new Error('Template contains prohibited expressions');
    }

    return result;
}

function formatValue(key: string, value: any): string {
    if (key.includes('Price') || key.includes('Level') || key.includes('Loss')) {
        return `$${value.toLocaleString()}`;
    }
    if (key.includes('Percent') || key.includes('Rate')) {
        return `${value.toFixed(1)}%`;
    }
    return String(value);
}
```

---

## 6. Free vs PRO Tier

| 항목 | Free | PRO |
|------|------|-----|
| 근거 요약 (Headline) | O | O |
| 근거 상세 (Detail) | 요약만 | 전체 |
| 리스크 설명 | 1개만 | 전체 |
| 관찰 포인트 | 1개만 | 전체 |
| 분할 비율 제안 | X | O |
| 긴급도 표시 | X | O |
| 과거 통계 수치 | X | O |

### Free 사용자 표시 예시

```
📊 분석 결과: 관망

[근거]
혼재된 시그널로 관망 권장

[리스크]
• 상승/하락 급변동 시 기회 비용

[관찰 포인트]
• RSI가 40을 상향 돌파할 경우 재평가

---
[PRO] 상세 분석, 전체 리스크, 분할 비율 확인
```

---

## 7. Mandatory Disclaimer

모든 설명 하단에 필수 표시:

```
━━━━━━━━━━━━━━━━━━━━━━━
ⓘ 본 분석은 과거 패턴 기반 통계 정보이며,
   투자 결정에 대한 책임은 사용자 본인에게 있습니다.
━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 8. Implementation Checklist (Phase 3용)

- [ ] `lib/explanation/templates.ts` - 템플릿 정의
- [ ] `lib/explanation/renderer.ts` - 변수 치환 및 렌더링
- [ ] `lib/explanation/validator.ts` - 금지 표현 검증
- [ ] `lib/explanation/generator.ts` - 조건 기반 템플릿 선택
- [ ] `types/explanation.ts` - TypeScript 인터페이스
- [ ] `components/ExplanationCard.tsx` - Free/PRO 분기 UI
- [ ] Unit tests for all templates
- [ ] Prohibited expression test suite

---

**Document Status**: COMPLETE
**Next Phase**: Phase 3 Implementation
