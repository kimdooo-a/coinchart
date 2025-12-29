# RESULT_PHASE3-5 (Explanation System)

## 1. 요약
*   **System Implemented**: `templates`, `validator` (Regex safety), `renderer` (Variable substitution), `generator` (Action logic).
*   **Features**:
    *   3-Part Structure: Evidence / Risk / Watch.
    *   Action Logic: PARTIAL (Strong Trend + High Grade), HOLD (Uncertain/High Vol), STOP_LOSS (High Drop Prob).
    *   Tier Differentiation: Free (Standard) vs Pro (Detailed + Backtest Stats).
    *   Safety: Prohibited terms (e.g., "AI 예측") automatically replaced.
*   **Verification**: `scripts/verify_explanation.ts` passed 3 scenarios (Uptrend/Pro, Volatile/Free, Drop/StopLoss).

## 2. 변경 파일
- `lib/explanation/templates.ts` [NEW]
- `lib/explanation/validator.ts` [NEW]
- `lib/explanation/renderer.ts` [NEW]
- `lib/explanation/generator.ts` [NEW]
- `types/explanation.ts` [MODIFIED]
- `scripts/verify_explanation.ts` [NEW]

## 3. Case Verification Snapshots
### Case A: Uptrend + High Confidence (Pro)
- **Action**: PARTIAL
- **Evidence**: "...(과거 승률 60.0%, 손익비 2.50)" included.
- **Risk**: Standard risk template.

### Case B: High Vol + Low Confidence (Free)
- **Action**: HOLD
- **Validator**: "AI 예측 확실" -> "통계적 패턴 분석 확실" (Replaced & Flagged).
- **Flags**: `['Replaced prohibited pattern: /AI\\s*예측/gi']`

### Case C: High Drop Probability
- **Action**: STOP_LOSS
- **Text**: "하락 통계가 80%로 우세... 리스크 관리를 최우선..."

## 4. Next Steps
- [ ] **Phase 3-6**: Integration & Final Test.
