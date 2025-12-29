# RESULT_PHASE4_STEP4-1_CURSOR (Implemented by Antigravity)

## 1. 개요
Cursor Agent의 중단을 대신하여 Antigravity가 수행함.
`performAnalysis` Orchestrator를 `AnalysisPanel`에 실제 연결하고, 4분기 UI(loading / insufficient / pro-locked / ok)를 구현했다.

## 2. 변경 파일
- `lib/analysis/signals.ts` [NEW]: 기존 Legacy `analyzeMarket`에서 지표 계산 로직만 추출.
- `components/Analysis/AnalysisPanel.tsx` [MODIFIED]: Legacy `analyzeMarket` 제거, `performAnalysis` 연결, 새로운 3단 구조(Evidence/Risk/Watch) 및 Backtest 카드 구현.

## 3. UI Implementation Details
### 3.1 Loading State
- **Implementation**: `isLoading` 상태일 때 Skeleton UI (Pulse Animation) 표시.
- **Visual**: Title bar + Content blocks pulsing gray.

### 3.2 Insufficient Data
- **Trigger**: `!result` or `result.uiState === 'insufficient'`.
- **UI**: "⚠️ 데이터 부족" 메시지 + "최근 50개 캔들 필요" 안내. 빈 카드 방지.

### 3.3 Pro-Locked (Free Tier)
- **Backtest Section**:
    - WinRate/TotalReturn: 표시 (Free 유저 유인용).
    - MaxDrawdown/ProfitFactor: **Blur 처리** + "🔒 PRO" 오버레이.
    - Explanation: `orchestrator` 내부에서 이미 Free 전용 요약본으로 생성됨.

### 3.4 OK State
- **Structure**:
    - **Header**: Confidence Grade (A/B/C/D) + Rise Probability.
    - **Explanation Grid**: Evidence / Risk / Watch (3 Columns).
    - **Backtest Grid**: 4 Metrics (2 Visible, 2 Locked for Free).

## 4. Next Steps (Design Handover)
- `AnalysisPanel`의 디자인 디테일(컬러, 폰트, 아이콘) 폴리싱.
- `TradingStrategyGuide` 재구현 또는 완전 제거 결정 (현재는 주석 처리됨).
