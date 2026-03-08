import { Trade } from '@/types/backtest';

export interface RiskAnalysis {
    kellyPercent: number;        // Kelly Criterion 최적 배팅 비율 (%)
    halfKelly: number;           // Half Kelly (보수적)
    ruinProbability: number;     // 파산 확률 (0-1)
    optimalPositionSize: number; // 최적 포지션 사이즈 ($, 자본 대비)
    riskOfRuin: string;          // 위험 등급: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    maxLeverage: number;         // 권장 최대 레버리지
}

/**
 * Kelly Criterion 계산
 * f* = (bp - q) / b
 * b = 평균 승/평균 패 비율 (odds)
 * p = 승률, q = 패률
 */
function calculateKelly(winRate: number, avgWin: number, avgLoss: number): number {
    if (avgLoss === 0 || winRate <= 0) return 0;

    const p = winRate;       // 0-1 승률
    const q = 1 - p;         // 패률
    const b = avgWin / avgLoss; // 보상/위험 비율

    const kelly = (b * p - q) / b;
    // Kelly는 음수일 수 있음 (기대값 음수 = 배팅 금지)
    return Math.max(0, kelly) * 100; // % 단위
}

/**
 * 파산 확률 (Risk of Ruin) 근사 계산
 * 단순 공식: R = ((1-edge)/(1+edge))^units
 * edge = (winRate * avgWin - lossRate * avgLoss) / avgLoss
 * units = capital / risk per trade
 */
function calculateRuinProbability(
    winRate: number,
    avgWin: number,
    avgLoss: number,
    capitalUnits: number
): number {
    if (avgLoss === 0 || capitalUnits <= 0) return 0;

    const edge = (winRate * avgWin - (1 - winRate) * avgLoss) / avgLoss;

    if (edge <= 0) return 1; // 기대값 음수 → 파산 필연

    const ratio = (1 - edge) / (1 + edge);
    if (ratio >= 1) return 1;
    if (ratio <= 0) return 0;

    return Math.pow(ratio, capitalUnits);
}

/**
 * 리스크 분석: Kelly Criterion, 파산 확률, 최적 포지션 사이즈
 */
export function analyzeRisk(trades: Trade[], initialCapital: number = 10000): RiskAnalysis {
    const defaultResult: RiskAnalysis = {
        kellyPercent: 0,
        halfKelly: 0,
        ruinProbability: 1,
        optimalPositionSize: 0,
        riskOfRuin: 'HIGH',
        maxLeverage: 1
    };

    if (!trades || trades.length < 10) return defaultResult;

    const wins = trades.filter(t => t.pnl > 0);
    const losses = trades.filter(t => t.pnl <= 0);

    if (wins.length === 0 || losses.length === 0) {
        return {
            ...defaultResult,
            kellyPercent: wins.length > 0 ? 100 : 0,
            ruinProbability: wins.length > 0 ? 0 : 1,
            riskOfRuin: wins.length > 0 ? 'LOW' : 'CRITICAL'
        };
    }

    const winRate = wins.length / trades.length;
    const avgWin = wins.reduce((s, t) => s + t.pnl, 0) / wins.length;
    const avgLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0) / losses.length);

    // Kelly Criterion
    const kelly = calculateKelly(winRate, avgWin, avgLoss);
    const halfKelly = kelly / 2;

    // 파산 확률 (자본을 평균 손실 단위로 환산)
    const capitalUnits = avgLoss > 0 ? initialCapital / avgLoss : 100;
    const ruinProb = calculateRuinProbability(winRate, avgWin, avgLoss, capitalUnits);

    // 최적 포지션 사이즈 (Half Kelly 기반)
    const optimalSize = (halfKelly / 100) * initialCapital;

    // 위험 등급 판정
    let riskOfRuin: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    if (ruinProb < 0.01) riskOfRuin = 'LOW';
    else if (ruinProb < 0.05) riskOfRuin = 'MEDIUM';
    else if (ruinProb < 0.25) riskOfRuin = 'HIGH';
    else riskOfRuin = 'CRITICAL';

    // 권장 최대 레버리지 (Kelly 기반, 최소 1x)
    const maxLeverage = Math.max(1, Math.min(10, Math.floor(kelly / 10)));

    return {
        kellyPercent: Math.round(kelly * 100) / 100,
        halfKelly: Math.round(halfKelly * 100) / 100,
        ruinProbability: Math.round(ruinProb * 10000) / 10000,
        optimalPositionSize: Math.round(optimalSize),
        riskOfRuin,
        maxLeverage
    };
}
