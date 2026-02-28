// import { CandleData } from '@/components/Analysis/AnalysisPanel'; // REMOVED to avoid circular dependency and Node issues
import { Trade } from '@/types/backtest';
import { calculateRSI, calculateBollingerBands, calculateMACD } from '@/lib/indicators';

export type CandleData = {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
};

/**
 * Generates historical trades for backtesting purposes.
 * Strategy: Simple Trend Following + Mean Reversion (RSI + MACD)
 * - BUY: RSI < 30 OR (MACD > Signal AND RSI < 60)
 * - SELL: RSI > 70 OR (MACD < Signal AND RSI > 40)
 */
export function generateHistoricalTrades(candles: CandleData[]): Trade[] {
    if (!candles || candles.length < 50) return [];

    const closes = candles.map(c => c.close);
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);

    // 1. Calculate Indicators (Full History)
    const rsi = calculateRSI(closes, 14);
    const { macd: macdLine, signal: signalLine } = calculateMACD(closes);
    // const bb = calculateBollingerBands(closes); // Not used in this simple strategy yet

    const trades: Trade[] = [];
    let position: { entryPrice: number; entryTime: number; quantity: number } | null = null;

    // Start from 50 to allow indicators to stabilize
    for (let i = 50; i < candles.length; i++) {
        const curRSI = rsi[i];
        const curMACD = macdLine[i];
        const curSig = signalLine[i];

        // Prev values for crossovers
        const prevMACD = macdLine[i - 1];
        const prevSig = signalLine[i - 1];

        // Signal Logic
        const isBuy = (curRSI < 30) || (prevMACD < prevSig && curMACD > curSig && curRSI < 60);
        const isSell = (curRSI > 70) || (prevMACD > prevSig && curMACD < curSig && curRSI > 40);

        const currentPrice = closes[i];
        const currentTime = candles[i].time; // seconds

        // Execute Trades
        if (position) {
            // Check for Exit
            if (isSell) {
                const exitPrice = currentPrice;
                const pnl = (exitPrice - position.entryPrice) / position.entryPrice * position.entryPrice; // Simple PnL amount based on 1 unit? 
                // Wait, Trade type says pnl and pnlPercent.
                // Let's assume 1 unit size? Or PnL percentage * capital?
                // Metrics calculation in metrics.ts uses raw pnl sum. 
                // Let's assume standardized 1000 USD position size for simplicity or percentages. 
                // Actually metrics.ts: totalReturn = (netProfit / initialCapital) * 100.
                // Let's store pure Price Delta as PnL? Or Percentage?
                // metrics.ts: const pnl = (exitPrice - entryPrice) / entryPrice; (Wait, looking at metrics.ts again...)

                // Re-reading metrics.ts from Step 395:
                // Line 48: const wins = trades.filter(t => t.pnl > 0);
                // Line 53: const grossProfit = wins.reduce((sum, t) => sum + t.pnl, 0);
                // Line 60: const totalReturn = (netProfit / initialCapital) * 100;

                // If PnL is raw currency profit, we need position size.
                // Let's assume fixed position size (e.g. $1000) for every trade.
                const positionSize = 1000;
                const priceChangePct = (exitPrice - position.entryPrice) / position.entryPrice;
                const tradePnl = positionSize * priceChangePct;

                trades.push({
                    id: `trade-${i}`,
                    entryPrice: position.entryPrice,
                    exitPrice: exitPrice,
                    entryTime: position.entryTime,
                    exitTime: currentTime * 1000, // Convert to ms for Trade interface if needed? candles.time is seconds.
                    // AnalysisPage formatted: time = d.time (seconds). Metrics might expect ms?
                    // metrics.ts line 123: t.exitTime - ddStartTime. ddStartTime init to t.exitTime.
                    // Javascript Date expects ms. Let's send ms.
                    direction: 'LONG',
                    pnl: tradePnl,
                    pnlPercent: priceChangePct * 100
                });

                position = null;
            }
        } else {
            // Check for Entry
            if (isBuy) {
                position = {
                    entryPrice: currentPrice,
                    entryTime: currentTime * 1000, // ms
                    quantity: 1000 / currentPrice
                };
            }
        }
    }

    return trades;
}

export interface RollingWindowResult {
    recent90DayWinRate: number;
    allTimeWinRate: number;
    strategyDrift: boolean; // 전략 유효성 변화 감지
    driftMagnitude: number; // 차이 크기 (pp)
}

/**
 * 롤링 윈도우 비교: 최근 90일 vs 전체 기간 승률 비교
 */
export function analyzeRollingWindow(trades: Trade[]): RollingWindowResult {
    if (trades.length < 10) {
        return { recent90DayWinRate: 0, allTimeWinRate: 0, strategyDrift: false, driftMagnitude: 0 };
    }

    // 전체 기간 승률
    const totalWins = trades.filter(t => t.pnl > 0).length;
    const allTimeWinRate = (totalWins / trades.length) * 100;

    // 최근 90일 거래 필터 (exitTime 기준)
    const now = Date.now();
    const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
    const recentTrades = trades.filter(t => (now - t.exitTime) < ninetyDaysMs);

    if (recentTrades.length < 5) {
        return { recent90DayWinRate: allTimeWinRate, allTimeWinRate, strategyDrift: false, driftMagnitude: 0 };
    }

    const recentWins = recentTrades.filter(t => t.pnl > 0).length;
    const recent90DayWinRate = (recentWins / recentTrades.length) * 100;

    // 전략 유효성 변화 감지: 10%p 이상 차이면 drift
    const driftMagnitude = Math.abs(recent90DayWinRate - allTimeWinRate);
    const strategyDrift = driftMagnitude >= 10;

    return {
        recent90DayWinRate: Math.round(recent90DayWinRate * 10) / 10,
        allTimeWinRate: Math.round(allTimeWinRate * 10) / 10,
        strategyDrift,
        driftMagnitude: Math.round(driftMagnitude * 10) / 10
    };
}
