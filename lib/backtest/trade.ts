import { Trade } from '@/types/backtest';

export interface MAEMFEResult {
    mae: number;       // Maximum Adverse Excursion (진입 후 최대 불리 이동, %)
    mfe: number;       // Maximum Favorable Excursion (진입 후 최대 유리 이동, %)
}

export interface TradeAnalysis {
    trades: (Trade & MAEMFEResult)[];
    avgMAE: number;         // 평균 MAE (%)
    avgMFE: number;         // 평균 MFE (%)
    avgWinMAE: number;      // 승리 거래 평균 MAE
    avgLossMAE: number;     // 패배 거래 평균 MAE
    avgWinMFE: number;      // 승리 거래 평균 MFE
    avgLossMFE: number;     // 패배 거래 평균 MFE
    efficiencyRatio: number; // 실현 수익 / MFE 비율 (수익 캡처 효율)
}

/**
 * 캔들 데이터로 MAE/MFE 계산
 * 거래 진입-청산 구간의 캔들 고가/저가로 최대 불리/유리 이동 계산
 */
export function calculateMAEMFE(
    trade: Trade,
    candles: { time: number; high: number; low: number }[]
): MAEMFEResult {
    // 거래 구간 캔들 필터
    const entryTime = trade.entryTime;
    const exitTime = trade.exitTime;
    const inRange = candles.filter(c => {
        const t = c.time < 1e12 ? c.time * 1000 : c.time;
        return t >= entryTime && t <= exitTime;
    });

    if (inRange.length === 0) {
        return { mae: 0, mfe: 0 };
    }

    const entry = trade.entryPrice;
    let maxAdverse = 0;
    let maxFavorable = 0;

    for (const candle of inRange) {
        if (trade.direction === 'LONG') {
            // LONG: 불리 = 저가 하락, 유리 = 고가 상승
            const adverse = ((entry - candle.low) / entry) * 100;
            const favorable = ((candle.high - entry) / entry) * 100;
            if (adverse > maxAdverse) maxAdverse = adverse;
            if (favorable > maxFavorable) maxFavorable = favorable;
        } else {
            // SHORT: 불리 = 고가 상승, 유리 = 저가 하락
            const adverse = ((candle.high - entry) / entry) * 100;
            const favorable = ((entry - candle.low) / entry) * 100;
            if (adverse > maxAdverse) maxAdverse = adverse;
            if (favorable > maxFavorable) maxFavorable = favorable;
        }
    }

    return {
        mae: Math.round(maxAdverse * 100) / 100,
        mfe: Math.round(maxFavorable * 100) / 100
    };
}

/**
 * 전체 거래 MAE/MFE 분석
 * candles가 없으면 pnlPercent 기반 근사 계산
 */
export function analyzeTradeExcursions(
    trades: Trade[],
    candles?: { time: number; high: number; low: number }[]
): TradeAnalysis {
    const emptyResult: TradeAnalysis = {
        trades: [],
        avgMAE: 0,
        avgMFE: 0,
        avgWinMAE: 0,
        avgLossMAE: 0,
        avgWinMFE: 0,
        avgLossMFE: 0,
        efficiencyRatio: 0
    };

    if (!trades || trades.length === 0) return emptyResult;

    const analyzed = trades.map(trade => {
        let maeMfe: MAEMFEResult;

        if (candles && candles.length > 0) {
            maeMfe = calculateMAEMFE(trade, candles);
        } else {
            // 캔들 데이터 없으면 pnlPercent 기반 근사
            const pct = Math.abs(trade.pnlPercent);
            maeMfe = {
                mae: trade.pnl <= 0 ? pct : pct * 0.3,  // 패배면 MAE ≈ 손실, 승리면 30% 근사
                mfe: trade.pnl > 0 ? pct * 1.2 : pct * 0.2  // 승리면 MFE > 실현 수익
            };
        }

        return { ...trade, ...maeMfe };
    });

    const wins = analyzed.filter(t => t.pnl > 0);
    const losses = analyzed.filter(t => t.pnl <= 0);

    const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    const avgMAE = avg(analyzed.map(t => t.mae));
    const avgMFE = avg(analyzed.map(t => t.mfe));

    // 수익 캡처 효율: 실현 수익 / MFE (얼마나 유리한 이동을 잡았는가)
    const totalRealizedPct = wins.reduce((s, t) => s + Math.abs(t.pnlPercent), 0);
    const totalMFE = wins.reduce((s, t) => s + t.mfe, 0);
    const efficiency = totalMFE > 0 ? totalRealizedPct / totalMFE : 0;

    return {
        trades: analyzed,
        avgMAE: Math.round(avgMAE * 100) / 100,
        avgMFE: Math.round(avgMFE * 100) / 100,
        avgWinMAE: Math.round(avg(wins.map(t => t.mae)) * 100) / 100,
        avgLossMAE: Math.round(avg(losses.map(t => t.mae)) * 100) / 100,
        avgWinMFE: Math.round(avg(wins.map(t => t.mfe)) * 100) / 100,
        avgLossMFE: Math.round(avg(losses.map(t => t.mfe)) * 100) / 100,
        efficiencyRatio: Math.round(efficiency * 100) / 100
    };
}
