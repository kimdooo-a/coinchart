import { ConfidenceResult, ConfidenceGrade, IndicatorSignal } from '@/types/probability';

interface ConfidenceInput {
    signals: IndicatorSignal[];
    adxValue?: number;
    volumeRatio?: number; // Current Vol / Avg Vol
    historicalAccuracy?: number; // 0-1
    atrValue?: number;
    sampleSize?: number;
    dataAgeSeconds?: number;
}

const WEIGHTS = {
    AGREEMENT: 30,
    TREND: 25,
    VOLUME: 20,
    HISTORY: 15,
    VOLATILITY_PENALTY: -10
};

export function calculateConfidence(input: ConfidenceInput): ConfidenceResult {
    const { signals, adxValue, volumeRatio, historicalAccuracy, atrValue, sampleSize, dataAgeSeconds } = input;
    const issues: string[] = [];

    // 1. Agreement Ratio (30pts)
    // How many signals agree with the majority direction?
    let buyCount = 0;
    let sellCount = 0;
    let neutralCount = 0;

    signals.forEach(s => {
        if (s.signal === 'BUY') buyCount++;
        else if (s.signal === 'SELL') sellCount++;
        else neutralCount++;
    });

    const totalSignals = signals.length || 1;
    const maxConsensus = Math.max(buyCount, sellCount, neutralCount);
    const agreementRatio = maxConsensus / totalSignals; // 0.33 ~ 1.0
    const scoreAgreement = agreementRatio * WEIGHTS.AGREEMENT;

    // 2. Trend Score (25pts)
    // If ADX > 25, full points? Proportional?
    // Let's say ADX 50+ is max score.
    const adx = adxValue || 0;
    const trendFactor = Math.min(adx, 50) / 50; // 0 to 1
    const scoreTrend = trendFactor * WEIGHTS.TREND;

    // 3. Volume Confirm (20pts)
    // Ratio > 1.2 is good?
    const vol = volumeRatio || 0;
    let volFactor = 0;
    if (vol >= 1.0) volFactor = 1;
    else if (vol >= 0.5) volFactor = 0.5;
    const scoreVolume = volFactor * WEIGHTS.VOLUME;

    // 4. Historical Accuracy (15pts)
    const accuracy = historicalAccuracy || 0; // Default 0 if missing
    const scoreHistory = accuracy * WEIGHTS.HISTORY;

    if (historicalAccuracy === undefined) {
        issues.push('Missing historical accuracy');
    }

    // 5. Volatility Penalty (-10pts)
    // If ATR is "High" -> Penalty. Needs context what is high.
    // Simplifying: If we don't have context, assume 0 penalty unless strictly defined.
    // For now, placeholder: no penalty logic without Avg ATR context.
    const scoreVolatility = 0;

    // Sum Raw Score
    let rawScore = scoreAgreement + scoreTrend + scoreVolume + scoreHistory + scoreVolatility;

    // 6. Data Quality Multipliers
    let multiplier = 1.0;

    if ((sampleSize || 100) < 30) {
        multiplier *= 0.7;
        issues.push('Small sample size');
    }

    if ((dataAgeSeconds || 0) > 60) {
        multiplier *= 0.8;
        issues.push('Stale data (>60s)');
    }

    if (volumeRatio !== undefined && volumeRatio < 0.3) {
        multiplier *= 0.85;
        issues.push('Very low volume');
    }

    const finalScore = rawScore * multiplier;

    // 7. Grade
    const grade = scoreToGrade(finalScore);

    // 8. Level
    let level: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (finalScore >= 70) level = 'HIGH';
    else if (finalScore >= 40) level = 'MEDIUM';

    return {
        score: Math.round(finalScore),
        grade,
        level,
        factors: issues, // Using issues as factors for now, or could map strong points
        breakdown: {
            agreement: Math.round(scoreAgreement),
            trend: Math.round(scoreTrend),
            volume: Math.round(scoreVolume),
            history: Math.round(scoreHistory),
            volatility: Math.round(scoreVolatility)
        },
        dataQuality: {
            multiplier,
            issues
        }
    };
}

function scoreToGrade(score: number): ConfidenceGrade {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
}
