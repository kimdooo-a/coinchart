import { CandleData } from './api/binance';

export type BacktestResult = {
    totalSignals: number;
    winRate: number; // 0-100
    profitability: number; // Average % return per signal
};

/**
 * Runs a backtest associated with a specific signal logic.
 * @param candles Historical data
 * @param signalFn Function that returns 'BUY' | 'SELL' | null for a given index
 * @param lookForward Number of periods to check for profitability (default 3)
 */
export function runBacktest(
    candles: CandleData[],
    signalFn: (index: number) => 'BUY' | 'SELL' | 'NEUTRAL' | null,
    lookForward: number = 3,
    targetSignal?: 'BUY' | 'SELL' | 'NEUTRAL' | null
): BacktestResult {
    let wins = 0; // Counts times price INCREASED (Long Win)
    let total = 0;
    let totalReturn = 0;

    // We need lookForward space at the end, so stop early
    for (let i = 50; i < candles.length - lookForward; i++) {
        const signal = signalFn(i);

        // If targetSignal is provided, only test matching signals.
        // If not provided, skip NEUTRAL/Null as before (backward compatibility if needed, though we will always provide target)
        if (targetSignal !== undefined) {
            if (signal !== targetSignal) continue;
        } else {
            if (!signal || signal === 'NEUTRAL') continue;
        }

        const entryPrice = candles[i].close;
        const exitPrice = candles[i + lookForward].close;

        // User Query: "Probability of profit if I BUY at this signal"
        // So we ALWAYS test for Price Rise (exit > entry)
        const pnl = (exitPrice - entryPrice) / entryPrice;
        const isWin = exitPrice > entryPrice;

        total++;
        if (isWin) wins++;
        totalReturn += pnl;
    }

    return {
        totalSignals: total,
        winRate: total > 0 ? Math.round((wins / total) * 100) : 0,
        profitability: total > 0 ? (totalReturn / total) * 100 : 0
    };
}
