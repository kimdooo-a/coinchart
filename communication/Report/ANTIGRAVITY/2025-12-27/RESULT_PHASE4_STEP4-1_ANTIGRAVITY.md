# RESULT_PHASE4_STEP4-1_ANTIGRAVITY (Architecture Lock)

## 1. 개요
Phase 4는 **"UI 연결 및 시각적 정상화"**에만 집중하며, Phase 3에서 완성된 핵심 로직(Probability, Confidence, Backtest, Explanation)의 수정은 원칙적으로 금지한다. 본 문서는 UI 구현 시 지켜야 할 규칙과 수정 범위를 확정한다.

## 2. 수정 허용 범위 (File/Folder Scope)
### [ALLOWED] (수정 가능)
- `components/**/*.tsx` (모든 UI 컴포넌트)
- `app/**/*.tsx` (페이지 및 레이아웃)
- `lib/analysis/orchestrator.ts` (UI 연결을 위한 **어댑터 로직 보정만** 허용, 핵심 알고리즘 수정 금지)
- `styles/*.css` (디자인 수정)

### [LOCKED] (수정 금지 - Read Only)
- `lib/probability/*.ts` (Engine, Confidence, Regime, Weights)
- `lib/backtest/*.ts` (Metrics, Logic)
- `lib/explanation/*.ts` (Generator, Templates, Validator)
- `types/*.ts` (Type Definitions - UI 필요 시 확장만 가능, 기존 타입 변경 주의)

## 3. UI 필수 분기 및 요구사항 (State Logic)
`orchestrator.ts`가 반환하는 `uiState` 및 데이터 상태에 따라 아래 규칙을 강제한다.

| State | Condition | UI Requirement |
| :--- | :--- | :--- |
| **loading** | 초기 로딩, fetching | **Skeleton UI** (텍스트 3줄, 카드 형태 유지). 단순 스피너 지양. |
| **insufficient** | `signals.length === 0` | **"데이터 부족"** 메시지 표시. (예: "지표 3개 이상 필요") <br> 빈 카드나 아이콘만 덩그러니 남지 않게 처리. |
| **pro-locked** | `userTier='free'` & Pro feature | **Lock Icon + Blur/Text**. <br> 예: "PRO 버전에서 상세 분석 제공". **절대 빈 공간으로 두지 말 것.** |
| **ok** | 정상 데이터 존재 | 정상 렌더링. 단, 내부 필드 값 `null/undefined` 체크 필수. |

## 4. 데이터 표시 규칙 (Display Rules)
### 4.1. Backtest Protection (Infinity/Zero Handling)
- **Code Value**: `999` (Profit Factor, RR Ratio 등에서 Infinity 대응값)
- **Display**: 사용자 화면에는 반드시 **"N/A"** 또는 **"∞ (Loss 0)"**로 변환하여 표시. 절대 숫자 "999"를 그대로 노출하지 않는다.

### 4.2. Tier Differentiation
- **Explanation**: Free 유저는 `orchestrator`가 제공하는 요약된 텍스트만 표시.
- **Backtest Card**: Free 유저에게는 `Win Rate`, `Total Return`만 노출하고 나머지는 Lock 처리하거나 간략화.

## 5. 금지 문구 체크리스트 (Final QA)
UI 하드코딩 텍스트 및 동적 생성 텍스트에서 아래 표현이 발견되면 즉시 수정한다.
- [ ] "AI" / "인공지능" (→ "통계적", "알고리즘", "시스템")
- [ ] "예측" / "Prediction" (→ "분석", "Analysis", "전망")
- [ ] "보장" / "확실" (→ "가능성", "기대", "패턴")
- [ ] "매수 추천" / "매도 추천" (→ "매수 관점", "매도 관점", "진입 가능")

## 6. Next Steps
본 문서 확정 후, 즉시 Phase 4 UI 컴포넌트 구현을 시작한다.
