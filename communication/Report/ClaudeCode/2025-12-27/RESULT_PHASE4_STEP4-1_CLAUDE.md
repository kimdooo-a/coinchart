# RESULT — UI 문구/Explain 표준화 (금지표현 QA)

**Date**: 2025-12-27
**Agent**: Claude Code
**Phase**: 4 | Step 4-1
**Status**: COMPLETE

---

## 1. 요약

ChartMaster UI 전체에서 사용되는 문구를 **"통계 기반 판단 보조"** 톤으로 표준화.
- uiState별(loading/insufficient/pro-locked/ok) 추천 문구 세트 정의
- PRO 잠금 CTA 문구 (과장/확정 금지)
- 금지표현 체크리스트 및 검색 키워드 제공

---

## 2. uiState별 추천 문구 세트

### 2.1 상태 정의

| State | 트리거 조건 | 사용자 경험 |
|-------|-------------|-------------|
| `loading` | 데이터 로딩 중 | 스켈레톤/스피너 표시 |
| `insufficient` | 데이터 부족 (n < minRequired) | 분석 불가 안내 |
| `pro-locked` | Free 사용자가 PRO 기능 접근 | 블러 + CTA |
| `ok` | 정상 데이터 표시 | 분석 결과 표시 |

---

### 2.2 loading 상태 문구

```typescript
const LOADING_MESSAGES = {
    ko: {
        default: "데이터를 불러오는 중입니다...",
        analysis: "패턴을 분석하고 있습니다...",
        probability: "통계 데이터를 계산하고 있습니다...",
        backtest: "과거 데이터를 검증하고 있습니다...",
        chart: "차트를 준비하고 있습니다..."
    },
    en: {
        default: "Loading data...",
        analysis: "Analyzing patterns...",
        probability: "Calculating statistical data...",
        backtest: "Validating historical data...",
        chart: "Preparing chart..."
    }
};
```

**사용 규칙**:
- "예측 중" → "분석 중" 또는 "계산 중" 사용
- "AI가 분석" → 단순히 "분석 중" 사용
- 로딩 시간이 3초 이상일 경우 진행 상태 표시 권장

---

### 2.3 insufficient 상태 문구

```typescript
const INSUFFICIENT_MESSAGES = {
    ko: {
        // 기본
        default: {
            title: "데이터가 부족합니다",
            desc: "분석에 필요한 최소 데이터가 충족되지 않았습니다.",
            action: "더 많은 데이터가 수집되면 자동으로 분석이 시작됩니다."
        },
        // 확률 분석
        probability: {
            title: "통계 분석 불가",
            desc: "신뢰할 수 있는 통계를 산출하기 위한 데이터가 부족합니다.",
            detail: "현재 {currentCount}건 / 최소 {minRequired}건 필요",
            action: "충분한 거래 데이터가 쌓이면 분석이 가능합니다."
        },
        // 백테스트
        backtest: {
            title: "백테스트 데이터 부족",
            desc: "과거 검증을 위한 거래 이력이 부족합니다.",
            detail: "현재 {currentCount}건 / 최소 {minRequired}건 필요",
            action: "더 긴 기간의 데이터가 필요합니다."
        },
        // 프랙탈 패턴
        fractal: {
            title: "패턴 매칭 불가",
            desc: "유사 패턴을 찾기 위한 히스토리 데이터가 부족합니다.",
            action: "충분한 가격 히스토리가 축적되면 패턴 분석이 가능합니다."
        }
    },
    en: {
        default: {
            title: "Insufficient Data",
            desc: "Minimum data required for analysis is not met.",
            action: "Analysis will begin automatically when more data is collected."
        },
        probability: {
            title: "Statistical Analysis Unavailable",
            desc: "Not enough data for reliable statistics.",
            detail: "Current: {currentCount} / Required: {minRequired}",
            action: "Analysis will be available once sufficient trading data accumulates."
        },
        backtest: {
            title: "Backtest Data Insufficient",
            desc: "Not enough trade history for validation.",
            detail: "Current: {currentCount} / Required: {minRequired}",
            action: "Longer historical data is needed."
        },
        fractal: {
            title: "Pattern Matching Unavailable",
            desc: "Not enough historical data for pattern matching.",
            action: "Pattern analysis will be available once sufficient price history accumulates."
        }
    }
};
```

**사용 규칙**:
- 부족한 이유를 명확히 설명
- 사용자 탓이 아님을 암시 (시스템 한계)
- 언제 가능해지는지 안내

---

### 2.4 pro-locked 상태 문구

```typescript
const PRO_LOCKED_MESSAGES = {
    ko: {
        // 기능별 설명
        features: {
            confidenceScore: {
                title: "신뢰도 상세 분석",
                desc: "신뢰도 점수와 구성 요소 분석을 확인하세요"
            },
            advancedMetrics: {
                title: "고급 백테스트 지표",
                desc: "MDD, Sharpe, Sortino 등 10개 전문 지표"
            },
            fullExplanation: {
                title: "상세 분석 리포트",
                desc: "전체 리스크 분석과 관찰 포인트 확인"
            },
            splitRatio: {
                title: "분할 비율 제안",
                desc: "진입/청산 분할 전략 가이드"
            },
            equityCurve: {
                title: "자산 곡선 차트",
                desc: "과거 성과 시각화 차트"
            }
        },
        // 일반 잠금
        general: {
            title: "PRO 전용 기능",
            desc: "더 상세한 분석 정보를 확인할 수 있습니다"
        }
    },
    en: {
        features: {
            confidenceScore: {
                title: "Detailed Confidence Analysis",
                desc: "View confidence score and component breakdown"
            },
            advancedMetrics: {
                title: "Advanced Backtest Metrics",
                desc: "MDD, Sharpe, Sortino and 10 professional metrics"
            },
            fullExplanation: {
                title: "Full Analysis Report",
                desc: "Complete risk analysis and watch points"
            },
            splitRatio: {
                title: "Split Ratio Suggestions",
                desc: "Entry/exit split strategy guide"
            },
            equityCurve: {
                title: "Equity Curve Chart",
                desc: "Historical performance visualization"
            }
        },
        general: {
            title: "PRO Feature",
            desc: "Access more detailed analysis information"
        }
    }
};
```

---

### 2.5 ok 상태 문구 (분석 결과)

```typescript
const OK_MESSAGES = {
    ko: {
        // 확률 표시
        probability: {
            rise: "상승 통계: {prob}%",
            drop: "하락 통계: {prob}%",
            disclaimer: "과거 패턴 기반 통계이며, 투자 결정은 본인 책임입니다."
        },
        // 신뢰도 등급
        confidence: {
            A: "신뢰도 높음 - 지표 합의 및 추세 일치",
            B: "신뢰도 양호 - 대부분 조건 충족",
            C: "신뢰도 보통 - 혼재된 시그널",
            D: "신뢰도 낮음 - 불확실성 높음",
            F: "신뢰도 매우 낮음 - 관망 권장"
        },
        // 행동 제안
        action: {
            HOLD: "현재 관망이 유리한 구간입니다",
            PARTIAL: "분할 진입을 검토할 수 있는 조건입니다",
            STOP_LOSS: "리스크 관리 관점에서 포지션 점검이 필요합니다"
        },
        // 시장 상태
        regime: {
            STRONG_TREND: "뚜렷한 추세 구간",
            RANGING: "횡보/박스권 구간",
            HIGH_VOLATILITY: "고변동성 구간"
        }
    },
    en: {
        probability: {
            rise: "Rise Statistics: {prob}%",
            drop: "Drop Statistics: {prob}%",
            disclaimer: "Based on historical patterns. Investment decisions are your responsibility."
        },
        confidence: {
            A: "High Confidence - Indicator agreement with trend alignment",
            B: "Good Confidence - Most conditions met",
            C: "Moderate Confidence - Mixed signals",
            D: "Low Confidence - High uncertainty",
            F: "Very Low Confidence - Hold recommended"
        },
        action: {
            HOLD: "Currently favorable to hold position",
            PARTIAL: "Conditions may warrant scaled entry consideration",
            STOP_LOSS: "Risk management review of position recommended"
        },
        regime: {
            STRONG_TREND: "Strong Trend Phase",
            RANGING: "Range-Bound Phase",
            HIGH_VOLATILITY: "High Volatility Phase"
        }
    }
};
```

---

## 3. PRO 잠금 CTA 문구

### 3.1 CTA 버튼 문구 (과장/확정 금지)

| 상황 | 권장 문구 (KO) | 권장 문구 (EN) |
|------|----------------|----------------|
| 기본 업그레이드 | "PRO로 더 알아보기" | "Explore PRO" |
| 상세 분석 잠금 | "상세 분석 확인하기" | "View Full Analysis" |
| 백테스트 잠금 | "고급 지표 확인하기" | "View Advanced Metrics" |
| 설명 잠금 | "전체 리포트 보기" | "See Full Report" |

### 3.2 금지 CTA 문구

| 금지 문구 | 이유 | 대체 문구 |
|-----------|------|-----------|
| "지금 바로 수익 내세요" | 수익 보장 암시 | "더 알아보기" |
| "놓치지 마세요!" | 과장/압박 | "PRO 기능 살펴보기" |
| "100% 정확한 분석" | 확정적 표현 | "상세 분석 확인" |
| "AI가 추천하는 종목" | 투자 권유 | "분석 결과 보기" |
| "무조건 업그레이드" | 강압적 | "PRO로 전환하기" |
| "프로처럼 투자하세요" | 성과 암시 | "더 많은 정보 확인" |

### 3.3 표준 CTA 컴포넌트 문구

```typescript
const PRO_CTA = {
    ko: {
        // 버튼 텍스트
        button: {
            primary: "PRO로 더 알아보기",
            secondary: "가격 확인하기",
            minimal: "PRO"
        },
        // 설명 문구
        description: {
            default: "더 상세한 분석 정보를 확인할 수 있습니다",
            metrics: "전문 트레이더급 지표를 확인할 수 있습니다",
            report: "전체 분석 리포트와 관찰 포인트를 확인할 수 있습니다"
        },
        // 혜택 나열
        benefits: [
            "신뢰도 상세 분석",
            "12개 고급 백테스트 지표",
            "전체 리스크 분석",
            "분할 비율 가이드"
        ]
    },
    en: {
        button: {
            primary: "Explore PRO",
            secondary: "View Pricing",
            minimal: "PRO"
        },
        description: {
            default: "Access more detailed analysis information",
            metrics: "View professional-grade metrics",
            report: "See full analysis report and watch points"
        },
        benefits: [
            "Detailed confidence analysis",
            "12 advanced backtest metrics",
            "Full risk analysis",
            "Split ratio guide"
        ]
    }
};
```

---

## 4. 금지표현 체크리스트

### 4.1 금지 표현 카테고리

#### Category 1: 확정적 예측 (PREDICTION_CERTAINTY)

| 금지 표현 | 검색 키워드 | 대체 표현 |
|-----------|-------------|-----------|
| "반드시 상승" | `반드시`, `확실히` | "상승 가능성이 높은 패턴" |
| "확실히 하락" | `확실`, `틀림없` | "하락을 시사하는 지표" |
| "무조건 수익" | `무조건`, `100%` | "과거 유사 패턴에서 N% 수익 발생" |
| "~할 것입니다" | `할 것입니다`, `될 것` | "~할 수 있습니다" / "~가능성이 있습니다" |
| "예측됩니다" | `예측` | "분석됩니다" / "시사합니다" |

#### Category 2: AI/인공지능 관련 (AI_TERMINOLOGY)

| 금지 표현 | 검색 키워드 | 대체 표현 |
|-----------|-------------|-----------|
| "AI 예측" | `AI.*예측` | "통계적 패턴 분석" |
| "인공지능 분석" | `인공지능.*분석` | "알고리즘 분석" |
| "AI가 추천" | `AI.*추천`, `AI.*권장` | "분석 결과" |
| "머신러닝 예측" | `머신러닝.*예측` | "데이터 기반 분석" |

#### Category 3: 투자 권유 (INVESTMENT_ADVICE)

| 금지 표현 | 검색 키워드 | 대체 표현 |
|-----------|-------------|-----------|
| "지금 사세요" | `사세요`, `매수하세요` | "매수 검토 가능한 조건" |
| "팔아야 합니다" | `팔아야`, `매도하세요` | "청산 검토 권장" |
| "투자를 권장" | `투자.*권장`, `권유` | "참고 정보로 활용" |
| "추천 종목" | `추천.*종목` | "분석 대상 종목" |
| "수익 보장" | `보장`, `원금` | (사용 불가) |

#### Category 4: 과장/압박 (EXAGGERATION)

| 금지 표현 | 검색 키워드 | 대체 표현 |
|-----------|-------------|-----------|
| "놓치지 마세요" | `놓치`, `기회` | (제거 또는 중립화) |
| "지금 아니면" | `지금 아니면` | (제거) |
| "한정 기회" | `한정`, `마지막` | (제거) |
| "급등 예정" | `급등.*예정` | "변동성 확대 가능" |
| "대박" | `대박`, `폭등` | "상승 가능성" |

#### Category 5: 자동화/시스템 (AUTOMATION)

| 금지 표현 | 검색 키워드 | 대체 표현 |
|-----------|-------------|-----------|
| "자동 매매" | `자동.*매매` | (사용 불가) |
| "오토 트레이딩" | `오토.*트레이딩` | (사용 불가) |
| "알아서 매수" | `알아서` | (사용 불가) |
| "자동 실행" | `자동.*실행` | (사용 불가) |

---

### 4.2 검증 정규식 (확장)

```typescript
export const PROHIBITED_PATTERNS_V2 = [
    // Category 1: 확정적 예측
    {
        category: 'PREDICTION_CERTAINTY',
        regex: /반드시|확실히|확실한|무조건|틀림없이|100%|할\s*것입니다|될\s*것입니다|예측됩니다/gi,
        severity: 'HIGH',
        replacement: null  // 컨텍스트에 따라 수동 대체
    },

    // Category 2: AI 관련
    {
        category: 'AI_TERMINOLOGY',
        regex: /AI\s*예측|인공지능\s*예측|AI\s*추천|인공지능\s*추천|AI\s*분석|머신러닝\s*예측/gi,
        severity: 'HIGH',
        replacement: '통계적 패턴 분석'
    },

    // Category 3: 투자 권유
    {
        category: 'INVESTMENT_ADVICE',
        regex: /사세요|팔아야|매수하세요|매도하세요|투자.*권장|투자.*추천|권유합니다/gi,
        severity: 'CRITICAL',
        replacement: null
    },

    // Category 4: 보장/원금
    {
        category: 'GUARANTEE',
        regex: /보장|원금|손실\s*없/gi,
        severity: 'CRITICAL',
        replacement: null  // 대체 불가, 삭제 필요
    },

    // Category 5: 과장 표현
    {
        category: 'EXAGGERATION',
        regex: /놓치지\s*마|지금\s*아니면|한정\s*기회|급등\s*예정|대박|폭등/gi,
        severity: 'MEDIUM',
        replacement: null
    },

    // Category 6: 자동화
    {
        category: 'AUTOMATION',
        regex: /자동\s*매매|오토\s*트레이딩|알아서\s*매수|자동\s*실행/gi,
        severity: 'CRITICAL',
        replacement: null  // 대체 불가, 삭제 필요
    }
];
```

---

### 4.3 현재 코드베이스 QA 체크포인트

#### translations.ts 수정 필요 항목

| 위치 | 현재 문구 | 문제점 | 권장 수정 |
|------|-----------|--------|-----------|
| `ko.main.subtitle` | "인공지능 투자 비서" | AI_TERMINOLOGY | "통계 기반 분석 도구" |
| `ko.dashboard.subtitle` | "AI가 제공하는" | AI_TERMINOLOGY | "알고리즘 기반" |
| `ko.cards.analysis.desc` | "인공지능이" | AI_TERMINOLOGY | "시스템이" |
| `ko.cards.signal.desc` | "급등/급락" | EXAGGERATION | "가격 변동" |
| `ko.analysis.prediction` | "AI 예측" | AI_TERMINOLOGY | "패턴 분석 결과" |
| `en.main.heroSubtitle` | "predict market" | PREDICTION | "analyze market patterns" |
| `en.cards.stock.desc` | "AI price prediction" | PREDICTION | "AI-assisted analysis" |

#### validator.ts 확장 필요

현재 6개 패턴 → **15개 이상**으로 확장 권장

---

### 4.4 QA 검색 명령어

```bash
# 전체 금지 표현 검색
grep -rn "반드시\|확실히\|무조건\|100%\|보장\|원금" --include="*.ts" --include="*.tsx"

# AI 관련 표현 검색
grep -rn "AI.*예측\|인공지능.*예측\|AI.*추천" --include="*.ts" --include="*.tsx"

# 투자 권유 표현 검색
grep -rn "사세요\|팔아야\|권장\|추천" --include="*.ts" --include="*.tsx"

# 과장 표현 검색
grep -rn "급등\|폭등\|대박\|놓치" --include="*.ts" --include="*.tsx"
```

---

## 5. 필수 Disclaimer 문구

### 5.1 분석 결과 하단 (필수)

```typescript
const DISCLAIMER = {
    ko: {
        short: "과거 패턴 기반 통계 정보이며, 투자 결정은 본인 책임입니다.",
        full: "본 분석은 과거 데이터 기반 통계 정보로, 미래 수익을 보장하지 않습니다. 모든 투자 결정에 대한 책임은 사용자 본인에게 있습니다."
    },
    en: {
        short: "Statistical analysis based on historical patterns. Investment decisions are your responsibility.",
        full: "This analysis is based on historical data and does not guarantee future results. All investment decisions are the sole responsibility of the user."
    }
};
```

### 5.2 표시 위치

- 확률/신뢰도 카드 하단
- 분석 리포트 최하단
- 백테스트 결과 페이지
- 시그널 알림 하단

---

## 6. 구현 체크리스트

### Phase 4-1 완료 후 적용 대상

- [ ] `lib/translations.ts` — 금지 표현 수정
- [ ] `lib/explanation/validator.ts` — 패턴 확장 (6→15+)
- [ ] `components/PremiumLock.tsx` — CTA 문구 표준화
- [ ] 신규 상수 파일 생성: `lib/ui/messages.ts`
- [ ] Disclaimer 컴포넌트 생성: `components/Disclaimer.tsx`

---

## 7. 산출물 위치

```
communication/Report/ClaudeCode/2025-12-27/
└── RESULT_PHASE4_STEP4-1_CLAUDE.md  (본 문서)
```

---

**Document Status**: COMPLETE
**Deliverables**:
- uiState별 문구 세트 (4개 상태 × 다국어)
- PRO 잠금 CTA 문구 (금지/권장 목록)
- 금지표현 체크리스트 (6개 카테고리, 검색 키워드 포함)
**Next**: 코드베이스에 표준 문구 적용 (별도 Step)
