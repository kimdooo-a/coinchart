import { BacktestMetrics, Trade } from '@/types/backtest';

// Helper for standard deviation
function standardDeviation(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (values.length - 1);
    return Math.sqrt(variance);
}

// Helper for downside deviation (Sortino)
function downsideDeviation(values: number[], target: number = 0): number {
    const downsides = values.filter(v => v < target);
    if (downsides.length === 0) return 0;
    const sumSq = downsides.reduce((a, b) => a + Math.pow(b - target, 2), 0);
    return Math.sqrt(sumSq / values.length); // Usually N, not N-1 for semi-deviation often
}

export function calculateMetrics(trades: Trade[], initialCapital: number = 10000): BacktestMetrics {
    // 1. Safety Checks
    if (!trades || trades.length === 0) {
        return {
            status: 'insufficient',
            totalTrades: trades ? trades.length : 0,
            winRate: 0,
            profitFactor: 0,
            sharpeRatio: 0,
            maxDrawdown: 0,
            maxDrawdownPercent: 0,
            avgTrade: 0,
            bestTrade: 0,
            worstTrade: 0,
            avgWin: 0,
            avgLoss: 0,
            expectancy: 0,
            totalReturn: 0,
            sortinoRatio: 0,
            calmarRatio: 0,
            riskRewardRatio: 0,
            maxConsecutiveWins: 0,
            maxConsecutiveLosses: 0,
            recoveryFactor: 0,
            drawdownDuration: 0
        };
    }

    // 2. Basic Metrics
    const wins = trades.filter(t => t.pnl > 0);
    const losses = trades.filter(t => t.pnl <= 0);
    const totalTrades = trades.length;
    const winRate = (wins.length / totalTrades) * 100;

    const grossProfit = wins.reduce((sum, t) => sum + t.pnl, 0);
    const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0));

    // Profit Factor (Handle 0 Loss)
    const profitFactor = grossLoss === 0 ? (grossProfit > 0 ? 999 : 0) : grossProfit / grossLoss;

    const netProfit = grossProfit - grossLoss;
    const totalReturn = (netProfit / initialCapital) * 100;

    const avgWin = wins.length > 0 ? grossProfit / wins.length : 0;
    const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0; // Absolute value
    const avgTrade = netProfit / totalTrades;

    // Risk Reward Ratio
    const riskRewardRatio = avgLoss === 0 ? (avgWin > 0 ? 999 : 0) : avgWin / avgLoss;

    // Expectancy = (Win% * AvgWin) - (Loss% * AvgLoss)
    // Note: Win% is 0-100 here, need 0-1
    const winProb = wins.length / totalTrades;
    const lossProb = losses.length / totalTrades;
    const expectancy = (winProb * avgWin) - (lossProb * avgLoss);

    // Consecutive
    let maxWins = 0;
    let maxLosses = 0;
    let currentWins = 0;
    let currentLosses = 0;
    trades.forEach(t => {
        if (t.pnl > 0) {
            currentWins++;
            currentLosses = 0;
            if (currentWins > maxWins) maxWins = currentWins;
        } else {
            currentLosses++;
            currentWins = 0;
            if (currentLosses > maxLosses) maxLosses = currentLosses;
        }
    });

    const bestTrade = Math.max(...trades.map(t => t.pnl));
    const worstTrade = Math.min(...trades.map(t => t.pnl));

    // 3. Curve Based Metrics (DD, Sharpe, etc.)
    // We assume trades are sorted by time? If not, should sort.
    const sortedTrades = [...trades].sort((a, b) => a.exitTime - b.exitTime);

    let peakEquity = initialCapital;
    let currentEquity = initialCapital;
    let maxDrawdown = 0;
    let maxDrawdownPercent = 0;
    let maxDDDuration = 0; // In trade count or time? SSOT says DrawdownDuration. Let's strictly use Time (days) if timestamps exist, else bars/trades.
    // Using simple approach: duration in milliseconds converted to days? Or just trade count?
    // User SSOT says "DrawdownDuration". Let's use Time (Days).

    let ddStartTime = 0;
    let inDrawdown = false;
    let currentDDDepth = 0;

    // Returns for Sharpe (Percentage returns per trade)
    const returns: number[] = sortedTrades.map(t => (t.pnl / initialCapital) * 100);
    // Ideally Sharpe uses periodic returns (daily), but trade-based Sharpe is common proxy.
    // We will use trade returns for now.

    sortedTrades.forEach(t => {
        currentEquity += t.pnl;
        if (currentEquity > peakEquity) {
            peakEquity = currentEquity;
            if (inDrawdown) {
                // End of DD
                const duration = t.exitTime - ddStartTime;
                const durationDays = duration / (1000 * 3600 * 24);
                if (durationDays > maxDDDuration) maxDDDuration = durationDays;
                inDrawdown = false;
            }
        } else {
            const dd = peakEquity - currentEquity;
            const ddPct = (dd / peakEquity) * 100;
            if (dd > maxDrawdown) maxDrawdown = dd;
            if (ddPct > maxDrawdownPercent) maxDrawdownPercent = ddPct;

            if (!inDrawdown) {
                inDrawdown = true;
                ddStartTime = t.exitTime;
            }
        }
    });

    // Handle ongoing DD duration
    if (inDrawdown) {
        // Duration until last trade
        const lastTrade = sortedTrades[sortedTrades.length - 1];
        const duration = lastTrade.exitTime - ddStartTime;
        const durationDays = duration / (1000 * 3600 * 24);
        if (durationDays > maxDDDuration) maxDDDuration = durationDays;
    }

    // Sharpe Ratio
    // Risk Free Rate = 0 for crypto simplifiction
    const stdDev = standardDeviation(returns);
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const sharpeRatio = stdDev === 0 ? 0 : avgReturn / stdDev;

    // Sortino Ratio
    const downsideDev = downsideDeviation(returns, 0);
    const sortinoRatio = downsideDev === 0 ? (avgReturn > 0 ? 999 : 0) : avgReturn / downsideDev;

    // Calmar Ratio
    // Annualized Return / Max DD %. 
    // Since we don't have annualization factor easily without full duration, 
    // we use Total Return / Max DD % as proxy or Simple definition.
    // Standard Calmar = CAGR / MaxDD. 
    // Let's use Total Return / MaxDD for now (Modified Calmar).
    const calmarRatio = maxDrawdownPercent === 0 ? (totalReturn > 0 ? 999 : 0) : totalReturn / maxDrawdownPercent;

    // Recovery Factor
    // Net Profit / Max Drawdown
    const recoveryFactor = maxDrawdown === 0 ? (netProfit > 0 ? 999 : 0) : netProfit / maxDrawdown;

    return {
        status: 'ok',
        totalTrades,
        winRate,
        profitFactor,
        sharpeRatio,
        maxDrawdown,
        maxDrawdownPercent,
        avgTrade,
        bestTrade,
        worstTrade,
        avgWin,
        avgLoss,
        expectancy,
        totalReturn,
        sortinoRatio,
        calmarRatio,
        riskRewardRatio,
        maxConsecutiveWins: maxWins,
        maxConsecutiveLosses: maxLosses,
        recoveryFactor,
        drawdownDuration: maxDDDuration
    };
}
