export type MarketRegime = 'STRONG_TREND' | 'RANGING' | 'HIGH_VOLATILITY';

export type ConfidenceGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface ConfidenceResult {
    score: number; // 0 to 100
    grade: ConfidenceGrade;
    level: 'LOW' | 'MEDIUM' | 'HIGH';
    factors: string[];
    breakdown: {
        agreement: number;
        trend: number;
        volume: number;
        history: number;
        volatility: number;
    };
    dataQuality: {
        multiplier: number;
        issues: string[];
    };
}

export interface IndicatorSignal {
    name: string;
    signal: 'BUY' | 'SELL' | 'NEUTRAL';
    strength: number; // 0 to 1
    timestamp: number;
}

export interface ProbabilityResult {
    direction: 'UP' | 'DOWN' | 'SIDEWAYS';
    probability: number; // 0 to 100
    confidence: ConfidenceResult;
    regime: MarketRegime;
    signals: IndicatorSignal[];
}
