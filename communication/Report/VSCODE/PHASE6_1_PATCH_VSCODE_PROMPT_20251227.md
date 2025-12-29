# PHASE6_1_PATCH_VSCODE_PROMPT_20251227

## Goal
Phase 6 CLOSE에서 지적된 UI 미비 사항(Error State, Pro-locked UX)을 수정한다.

## Actions
1. **AnalysisPanel.tsx**
   - `uiState === 'error'` 분기 처리 추가 (사용자 친화적 에러 메시지 표시).
   - Backtest 결과 카드 등에서 `PremiumLock` 컴포넌트와의 연동성 강화 (클릭 시 모달/오버레이 동작 고려).

2. **StockPanel.tsx**
   - Pro-locked 상태에서 분석 결과 전체를 가리지 않고, 상세 수치(Drawdown 등)만 블러 처리하도록 수정.
   - `AnalysisPanel`과 UX 일관성 확보.

3. **PremiumLock Component**
   - 현재 단순 정적 컴포넌트인지 확인. 필요 시 `onClick`, `onClose` 등 인터랙션 추가 여부 검토 (단, 이번 패치에서는 사용처에서 오버레이로 감싸는 방식이 더 안전할 수 있음).

## Rules
- Analyis Logic (`orchestrator.ts`) 수정 금지.
- Data Fetching 로직 수정 금지.
- UI/UX 표현만 변경.
