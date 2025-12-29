# RESULT — SSOT 고지 문구 최종본 (한/영)

**Date**: 2025-12-27
**Agent**: Claude Code
**Phase**: 4-3 | Step COPY
**Status**: COMPLETE

---

## 1. 최종 고지 문구 (Analysis 페이지)

### 1.1 짧은 버전 (1줄) — 권장

| 언어 | 문구 |
|------|------|
| **KO** | 과거 패턴 기반 통계이며, 실시간 시세와 분석 데이터는 별도로 처리됩니다. |
| **EN** | Historical pattern statistics. Live prices and analysis data are processed separately. |

### 1.2 표준 버전 (2줄)

| 언어 | 문구 |
|------|------|
| **KO** | 본 분석은 과거 패턴 기반 통계 해석입니다.<br>실시간 시세는 표시용이며, 분석에는 별도 수집된 데이터가 사용됩니다. |
| **EN** | This analysis is a statistical interpretation based on historical patterns.<br>Live prices are for display; analysis uses separately collected data. |

### 1.3 전체 버전 (면책 포함)

| 언어 | 문구 |
|------|------|
| **KO** | 본 분석은 과거 패턴 기반 통계 해석이며, 미래 수익을 보장하지 않습니다.<br>실시간 시세는 표시용이고, 분석에는 별도 수집된 데이터가 사용됩니다.<br>모든 투자 판단의 책임은 사용자 본인에게 있습니다. |
| **EN** | This analysis is based on historical patterns and does not guarantee future results.<br>Live prices are for display; analysis uses separately collected data.<br>All investment decisions are your sole responsibility. |

---

## 2. 툴팁용 문구 (선택)

### 2.1 "실시간 시세" 옆 (i) 아이콘

| 언어 | 문구 |
|------|------|
| **KO** | 현재 표시되는 가격은 실시간 시세이며, 분석 결과와는 별도입니다. |
| **EN** | The displayed price is real-time and separate from analysis results. |

### 2.2 "분석 결과" 옆 (i) 아이콘

| 언어 | 문구 |
|------|------|
| **KO** | 과거 데이터 기반 통계 해석입니다. 참고용으로만 활용하세요. |
| **EN** | Statistical interpretation based on historical data. For reference only. |

### 2.3 "신뢰도" 옆 (i) 아이콘

| 언어 | 문구 |
|------|------|
| **KO** | 지표 간 합의도와 데이터 품질을 종합한 등급입니다. |
| **EN** | Grade based on indicator agreement and data quality. |

### 2.4 "확률" 옆 (i) 아이콘

| 언어 | 문구 |
|------|------|
| **KO** | 과거 유사 패턴에서 관찰된 통계적 비율입니다. |
| **EN** | Statistical ratio observed in similar historical patterns. |

---

## 3. 금지표현 Self-Check

### 3.1 체크리스트

| 금지 표현 | 포함 여부 | 상태 |
|-----------|-----------|------|
| AI / 인공지능 | X | PASS |
| 예측 (prediction) | X | PASS |
| 추천 (recommend) | X | PASS |
| 확정 / 확실 | X | PASS |
| 보장 (guarantee) | "보장하지 않습니다" 형태로만 사용 | PASS |
| 반드시 / 무조건 | X | PASS |
| 사세요 / 팔아야 | X | PASS |
| 권장 / 권유 | X | PASS |
| 100% | X | PASS |

### 3.2 사용된 표현

| 표현 | 용도 | 적합성 |
|------|------|--------|
| 통계 | 데이터 기반 해석 | OK |
| 해석 | 분석 결과 설명 | OK |
| 패턴 | 과거 데이터 참조 | OK |
| 참고용 | 면책 표현 | OK |
| 별도 처리 | 데이터 분리 설명 | OK |
| 책임 | 면책 표현 | OK |

### 3.3 검증 완료

```
[PASS] 금지 표현 미포함
[PASS] 과장/압박 표현 미포함
[PASS] 투자 권유 표현 미포함
[PASS] 보조도구 톤 유지
```

---

## 4. 적용 위치 가이드

| 위치 | 버전 | 비고 |
|------|------|------|
| Analysis 페이지 상단 배너 | 짧은 (1줄) | 항상 표시 |
| Analysis 페이지 하단 | 표준 (2줄) | 스크롤 시 노출 |
| 분석 카드 내부 | 짧은 (1줄) | 작은 폰트 |
| 팝업/모달 | 전체 (3줄) | PRO 업그레이드 시 |
| 각 지표 옆 | 툴팁 | (i) 아이콘 hover |

---

## 5. 코드 적용 예시

```typescript
// lib/ui/disclaimer.ts
export const DISCLAIMER = {
    ko: {
        short: "과거 패턴 기반 통계이며, 실시간 시세와 분석 데이터는 별도로 처리됩니다.",
        standard: "본 분석은 과거 패턴 기반 통계 해석입니다. 실시간 시세는 표시용이며, 분석에는 별도 수집된 데이터가 사용됩니다.",
        full: "본 분석은 과거 패턴 기반 통계 해석이며, 미래 수익을 보장하지 않습니다. 실시간 시세는 표시용이고, 분석에는 별도 수집된 데이터가 사용됩니다. 모든 투자 판단의 책임은 사용자 본인에게 있습니다."
    },
    en: {
        short: "Historical pattern statistics. Live prices and analysis data are processed separately.",
        standard: "This analysis is a statistical interpretation based on historical patterns. Live prices are for display; analysis uses separately collected data.",
        full: "This analysis is based on historical patterns and does not guarantee future results. Live prices are for display; analysis uses separately collected data. All investment decisions are your sole responsibility."
    }
};

export const TOOLTIPS = {
    ko: {
        livePrice: "현재 표시되는 가격은 실시간 시세이며, 분석 결과와는 별도입니다.",
        analysis: "과거 데이터 기반 통계 해석입니다. 참고용으로만 활용하세요.",
        confidence: "지표 간 합의도와 데이터 품질을 종합한 등급입니다.",
        probability: "과거 유사 패턴에서 관찰된 통계적 비율입니다."
    },
    en: {
        livePrice: "The displayed price is real-time and separate from analysis results.",
        analysis: "Statistical interpretation based on historical data. For reference only.",
        confidence: "Grade based on indicator agreement and data quality.",
        probability: "Statistical ratio observed in similar historical patterns."
    }
};
```

---

## 산출물 위치

```
communication/Report/ClaudeCode/2025-12-27/
└── RESULT_PHASE4_STEP4-3_CLAUDE.md  (본 문서)
```

---

**Document Status**: COMPLETE
**Deliverables**:
- KO/EN 최종 고지 문구 (짧은/표준/전체 3버전)
- 툴팁용 문구 4종
- 금지표현 Self-Check 완료 (ALL PASS)
