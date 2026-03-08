import { Trade } from '@/types/backtest';

export interface DrawdownPeriod {
    startTime: number;    // DD 시작 시점 (ms)
    endTime: number;      // DD 회복 시점 (ms, 진행 중이면 마지막 거래 시점)
    peakEquity: number;   // DD 시작 시 자산 최고점
    troughEquity: number; // DD 구간 내 최저 자산
    depth: number;        // DD 금액 (peak - trough)
    depthPercent: number; // DD 비율 (%)
    durationDays: number; // DD 지속 기간 (일)
    recovered: boolean;   // 회복 여부
}

export interface DrawdownAnalysis {
    periods: DrawdownPeriod[];
    maxDrawdown: number;         // 최대 DD 금액
    maxDrawdownPercent: number;  // 최대 DD 비율
    avgDrawdown: number;         // 평균 DD 금액
    avgDrawdownPercent: number;  // 평균 DD 비율
    avgRecoveryDays: number;     // 평균 회복 기간 (일)
    longestDrawdownDays: number; // 최장 DD 기간 (일)
    totalDrawdownPeriods: number;
}

/**
 * 드로우다운 기간 분석: 개별 DD 구간 추적, 평균/최대 DD 계산
 */
export function analyzeDrawdowns(trades: Trade[], initialCapital: number = 10000): DrawdownAnalysis {
    const emptyResult: DrawdownAnalysis = {
        periods: [],
        maxDrawdown: 0,
        maxDrawdownPercent: 0,
        avgDrawdown: 0,
        avgDrawdownPercent: 0,
        avgRecoveryDays: 0,
        longestDrawdownDays: 0,
        totalDrawdownPeriods: 0
    };

    if (!trades || trades.length === 0) return emptyResult;

    const sorted = [...trades].sort((a, b) => a.exitTime - b.exitTime);
    const periods: DrawdownPeriod[] = [];

    let peakEquity = initialCapital;
    let equity = initialCapital;
    let inDrawdown = false;
    let currentPeriod: Partial<DrawdownPeriod> = {};

    for (const trade of sorted) {
        equity += trade.pnl;

        if (equity >= peakEquity) {
            // 새 고점 도달: 진행 중인 DD 종료
            if (inDrawdown && currentPeriod.startTime) {
                periods.push({
                    startTime: currentPeriod.startTime!,
                    endTime: trade.exitTime,
                    peakEquity: currentPeriod.peakEquity!,
                    troughEquity: currentPeriod.troughEquity!,
                    depth: currentPeriod.peakEquity! - currentPeriod.troughEquity!,
                    depthPercent: ((currentPeriod.peakEquity! - currentPeriod.troughEquity!) / currentPeriod.peakEquity!) * 100,
                    durationDays: (trade.exitTime - currentPeriod.startTime!) / (1000 * 3600 * 24),
                    recovered: true
                });
                inDrawdown = false;
            }
            peakEquity = equity;
        } else {
            // DD 구간
            if (!inDrawdown) {
                // 새 DD 시작
                inDrawdown = true;
                currentPeriod = {
                    startTime: trade.exitTime,
                    peakEquity: peakEquity,
                    troughEquity: equity
                };
            } else {
                // DD 진행 중: 최저점 갱신
                if (equity < (currentPeriod.troughEquity ?? equity)) {
                    currentPeriod.troughEquity = equity;
                }
            }
        }
    }

    // 미회복 DD 기록
    if (inDrawdown && currentPeriod.startTime) {
        const lastTime = sorted[sorted.length - 1].exitTime;
        periods.push({
            startTime: currentPeriod.startTime!,
            endTime: lastTime,
            peakEquity: currentPeriod.peakEquity!,
            troughEquity: currentPeriod.troughEquity!,
            depth: currentPeriod.peakEquity! - currentPeriod.troughEquity!,
            depthPercent: ((currentPeriod.peakEquity! - currentPeriod.troughEquity!) / currentPeriod.peakEquity!) * 100,
            durationDays: (lastTime - currentPeriod.startTime!) / (1000 * 3600 * 24),
            recovered: false
        });
    }

    if (periods.length === 0) return emptyResult;

    // 통계 계산
    const maxDD = Math.max(...periods.map(p => p.depth));
    const maxDDPct = Math.max(...periods.map(p => p.depthPercent));
    const avgDD = periods.reduce((s, p) => s + p.depth, 0) / periods.length;
    const avgDDPct = periods.reduce((s, p) => s + p.depthPercent, 0) / periods.length;
    const longestDays = Math.max(...periods.map(p => p.durationDays));

    const recoveredPeriods = periods.filter(p => p.recovered);
    const avgRecovery = recoveredPeriods.length > 0
        ? recoveredPeriods.reduce((s, p) => s + p.durationDays, 0) / recoveredPeriods.length
        : 0;

    return {
        periods,
        maxDrawdown: maxDD,
        maxDrawdownPercent: maxDDPct,
        avgDrawdown: avgDD,
        avgDrawdownPercent: avgDDPct,
        avgRecoveryDays: avgRecovery,
        longestDrawdownDays: longestDays,
        totalDrawdownPeriods: periods.length
    };
}
