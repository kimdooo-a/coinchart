import { ProbabilityResult, IndicatorSignal, MarketRegime } from '@/types/probability';
import { getWeight } from './weights';
import { calculateConfidence } from './confidence';

interface EngineInput {
    signals: IndicatorSignal[];
    regime: MarketRegime;
    // Optional confidence parameters (if not provided, uses defaults)
    adxValue?: number;
    volumeRatio?: number;
    historicalAccuracy?: number;
    sampleSize?: number;
    dataAgeSeconds?: number;
    atrValue?: number;
    avgAtrValue?: number;
    bbWidth?: number;
    mtfMultiplier?: number; // MTF 가중치 조정 계수 (상위 TF 일치/불일치)
}

export function calculateProbability(input: EngineInput): ProbabilityResult {
    const { signals, regime } = input;

    // 1. Calculate Weighted Score
    let totalWeight = 0;
    let weightedSum = 0;
    const signalDetails: { name: string; contribution: number }[] = [];

    signals.forEach(sig => {
        // 레짐 기반 가중치 적용
        const weight = getWeight(sig.name, regime);
        // Score: BUY = +100, SELL = -100, NEUTRAL = 0
        let rawScore = 0;
        if (sig.signal === 'BUY') rawScore = 100;
        else if (sig.signal === 'SELL') rawScore = -100;

        // Adjust by signal strength if available (0-1)
        const effectiveScore = rawScore * (sig.strength || 1);

        weightedSum += effectiveScore * weight;
        totalWeight += weight;

        signalDetails.push({
            name: sig.name,
            contribution: Math.abs(effectiveScore * weight)
        });
    });

    let finalScore = totalWeight > 0 ? weightedSum / totalWeight : 0; // -100 to +100

    // MTF 멀티플라이어 적용: 상위 타임프레임과의 정합성 반영
    if (input.mtfMultiplier !== undefined && input.mtfMultiplier !== 1.0) {
        finalScore *= input.mtfMultiplier;
        // 범위 제한 (-100 ~ +100)
        finalScore = Math.max(-100, Math.min(100, finalScore));
    }

    // 2. Normalize to Probability (0 to 100)
    // Score -100 => 0% Rise (100% Drop)
    // Score 0 => 50% Rise
    // Score +100 => 100% Rise
    let riseProbability = (finalScore + 100) / 2; // 0 to 100

    // 3. Clamp (15% - 85%) as per SSOT
    riseProbability = Math.max(15, Math.min(85, riseProbability));

    // 4. Determine Direction
    let direction: 'UP' | 'DOWN' | 'SIDEWAYS' = 'SIDEWAYS';
    if (riseProbability > 55) direction = 'UP';
    else if (riseProbability < 45) direction = 'DOWN';

    // 5. Reasoning (Top 3 contributors)
    signalDetails.sort((a, b) => b.contribution - a.contribution);
    const topFactors = signalDetails.slice(0, 3).map(f => f.name);

    // 6. Confidence Calculation (using input values or defaults)
    const confidenceResult = calculateConfidence({
        signals,
        adxValue: input.adxValue ?? 30,
        volumeRatio: input.volumeRatio ?? 1.0,
        historicalAccuracy: input.historicalAccuracy ?? 0.5, // 실측값 없으면 보수적 기본값 (기존 0.8 → 0.5)
        sampleSize: input.sampleSize ?? signals.length,
        dataAgeSeconds: input.dataAgeSeconds ?? 0,
        atrValue: input.atrValue,
        avgAtrValue: input.avgAtrValue,
        bbWidth: input.bbWidth
    });

    return {
        direction,
        probability: Math.round(riseProbability), // Rise Probability
        confidence: confidenceResult,
        regime: regime,
        signals
    };
}
