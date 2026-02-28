import { CandleData } from './api/binance';

export type HorizonResult = {
    horizon: number;
    winRate: number; // 0-100
    totalSignals: number;
    profitability: number;
};

export type BacktestResult = {
    totalSignals: number;
    winRate: number; // 0-100 (기본 lookForward 기준)
    profitability: number; // Average % return per signal
    horizonResults?: HorizonResult[]; // 다기간 백테스트 결과
};

/**
 * 단일 기간 백테스트 실행
 */
function runSingleHorizon(
    candles: CandleData[],
    signalFn: (index: number) => 'BUY' | 'SELL' | 'NEUTRAL' | null,
    lookForward: number,
    targetSignal?: 'BUY' | 'SELL' | 'NEUTRAL' | null
): { wins: number; total: number; totalReturn: number } {
    let wins = 0;
    let total = 0;
    let totalReturn = 0;

    for (let i = 50; i < candles.length - lookForward; i++) {
        const signal = signalFn(i);

        if (targetSignal !== undefined) {
            if (signal !== targetSignal) continue;
        } else {
            if (!signal || signal === 'NEUTRAL') continue;
        }

        const entryPrice = candles[i].close;
        const exitPrice = candles[i + lookForward].close;
        const pnl = (exitPrice - entryPrice) / entryPrice;
        const isWin = exitPrice > entryPrice;

        total++;
        if (isWin) wins++;
        totalReturn += pnl;
    }

    return { wins, total, totalReturn };
}

/**
 * 다기간 백테스트 실행
 * @param candles Historical data
 * @param signalFn Signal function
 * @param lookForward 기본 look-forward 기간 (default 3)
 * @param targetSignal 타겟 신호
 * @param multiHorizon true면 [3, 5, 10] 다기간 실행
 */
export function runBacktest(
    candles: CandleData[],
    signalFn: (index: number) => 'BUY' | 'SELL' | 'NEUTRAL' | null,
    lookForward: number = 3,
    targetSignal?: 'BUY' | 'SELL' | 'NEUTRAL' | null,
    multiHorizon: boolean = false
): BacktestResult {
    // 기본 백테스트
    const primary = runSingleHorizon(candles, signalFn, lookForward, targetSignal);

    const result: BacktestResult = {
        totalSignals: primary.total,
        winRate: primary.total > 0 ? Math.round((primary.wins / primary.total) * 100) : 0,
        profitability: primary.total > 0 ? (primary.totalReturn / primary.total) * 100 : 0
    };

    // 다기간 백테스트
    if (multiHorizon) {
        const horizons = [3, 5, 10];
        result.horizonResults = horizons.map(h => {
            const hr = runSingleHorizon(candles, signalFn, h, targetSignal);
            return {
                horizon: h,
                winRate: hr.total > 0 ? Math.round((hr.wins / hr.total) * 100) : 0,
                totalSignals: hr.total,
                profitability: hr.total > 0 ? (hr.totalReturn / hr.total) * 100 : 0
            };
        });
    }

    return result;
}
