import { Trade } from '@/types/backtest';

export interface EquityPoint {
    time: number;      // 타임스탬프 (ms)
    equity: number;    // 자산 총액
    drawdown: number;  // 현재 DD 금액
    drawdownPct: number; // 현재 DD 비율 (%)
    tradeIndex: number; // 해당 거래 인덱스
}

export interface EquityCurve {
    points: EquityPoint[];
    initialCapital: number;
    finalEquity: number;
    peakEquity: number;
    totalReturn: number;      // 총 수익률 (%)
    totalReturnAmount: number; // 총 수익 금액
}

/**
 * 에쿼티 커브 생성: 시계열 자산 추이
 */
export function buildEquityCurve(trades: Trade[], initialCapital: number = 10000): EquityCurve {
    const emptyResult: EquityCurve = {
        points: [{ time: Date.now(), equity: initialCapital, drawdown: 0, drawdownPct: 0, tradeIndex: -1 }],
        initialCapital,
        finalEquity: initialCapital,
        peakEquity: initialCapital,
        totalReturn: 0,
        totalReturnAmount: 0
    };

    if (!trades || trades.length === 0) return emptyResult;

    const sorted = [...trades].sort((a, b) => a.exitTime - b.exitTime);
    const points: EquityPoint[] = [];

    // 초기 포인트
    points.push({
        time: sorted[0].entryTime,
        equity: initialCapital,
        drawdown: 0,
        drawdownPct: 0,
        tradeIndex: -1
    });

    let equity = initialCapital;
    let peak = initialCapital;

    sorted.forEach((trade, i) => {
        equity += trade.pnl;
        if (equity > peak) peak = equity;

        const dd = peak - equity;
        const ddPct = peak > 0 ? (dd / peak) * 100 : 0;

        points.push({
            time: trade.exitTime,
            equity,
            drawdown: dd,
            drawdownPct: ddPct,
            tradeIndex: i
        });
    });

    return {
        points,
        initialCapital,
        finalEquity: equity,
        peakEquity: peak,
        totalReturn: ((equity - initialCapital) / initialCapital) * 100,
        totalReturnAmount: equity - initialCapital
    };
}
