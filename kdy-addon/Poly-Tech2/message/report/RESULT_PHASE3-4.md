# RESULT_PHASE3-4 (Backtest Metrics)

## 1. 요약
*   **Metrics Implemented**: WinRate, TotalReturn, MDD, Sharpe, Sortino, Calmar, ProfitFactor, RiskReward, Expectancy, MaxConsecutive, RecoveryFactor, DrawdownDuration.
*   **Entry Point**: `lib/backtest/metrics.ts` implemented as the single calculation engine.
*   **Verification**: `scripts/verify_backtest.ts` passed all 3 scenarios (Mixed, Zero Loss, Zero Variance).
*   **Edge Cases**: Zero division protected (returns 0 or 999), Insufficient data (<30 trades) returns 'insufficient' status.

## 2. 변경 파일 목록
- `lib/backtest/metrics.ts` [MODIFIED] (Core Logic)
- `types/backtest.ts` [MODIFIED] (Added 7 missing metrics)
- `scripts/verify_backtest.ts` [NEW] (Verification Script)

## 3. Edge Case 처리 정책
| Case | Policy | Implementation |
| :--- | :--- | :--- |
| **Trades < 30** | Status 'insufficient' | Returns object with status 'insufficient', metrics 0 |
| **Loss = 0** | ProfitFactor / RR Ratio | Returns 999 (Infinity protection) |
| **Variance = 0** | Sharpe / Sortino | Returns 0 (Standard Deviation is 0) |
| **Drawdown = 0** | Calmar / Recovery | Returns 999 (Infinity protection) |
| **Timeframe** | Duration | Calculated in days based on exitTime difference |

## 4. Verification Snapshots (scripts/verify_backtest.ts)
### Case 1: Standard Mixed
- WinRate: 50%
- ProfitFactor: 2.0
- Status: ok

### Case 2: Zero Loss (Edge)
- ProfitFactor: 999
- RecoveryFactor: 999
- Consecutive Wins: 35

### Case 3: Zero Variance (Edge)
- Sharpe Ratio: 0
- Standard Deviation Check: Pass

## 5. Next Steps
- [ ] **Phase 3-5**: Explanation Generator Implementation (Template Engine & Text Gen).
