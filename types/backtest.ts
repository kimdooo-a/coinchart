export interface Trade {
    id: string;
    entryPrice: number;
    exitPrice: number;
    entryTime: number;
    exitTime: number;
    direction: 'LONG' | 'SHORT';
    pnl: number;
    pnlPercent: number;
}

export interface BacktestMetrics {
    status: 'ok' | 'insufficient';
    totalTrades: number;
    winRate: number;
    profitFactor: number;
    sharpeRatio: number;
    maxDrawdown: number;
    maxDrawdownPercent: number;
    avgTrade: number;
    bestTrade: number;
    worstTrade: number;
    avgWin: number;
    avgLoss: number;
    expectancy: number; // Expectancy
    totalReturn: number; // Total Return %
    sortinoRatio: number; // Sortino
    calmarRatio: number; // Calmar
    riskRewardRatio: number; // Risk/Reward
    maxConsecutiveWins: number; // Max Consecutive
    maxConsecutiveLosses: number; // Max Consecutive
    recoveryFactor: number; // Recovery Factor
    drawdownDuration: number; // Max Drawdown Duration (days/bars)
}
