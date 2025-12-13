
import { CandleData } from './api/binance';

export type PatternMatch = {
    startIndex: number;
    endIndex: number;
    similarity: number; // 0-100%
    nextMovePercent: number; // Profit/Loss in next N candles
    timestamp: string;
};

export type FractalAnalysisResult = {
    symbol: string;
    recommendedPosition: 'BUY' | 'SELL' | 'WAIT';
    confidence: number; // 0-100
    avgReturn: number; // Expected return based on history
    bestMatches: PatternMatch[];
};

/**
 * Calculates Pearson Correlation Coefficient between two arrays
 * Returns value between -1 and 1
 */
function calculateCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    if (denominator === 0) return 0;
    return numerator / denominator;
}

/**
 * Normalizes an array of numbers to percentage change from the first element
 * This makes the pattern scale-invariant (shape matters, not absolute price)
 */
function normalizePattern(data: number[]): number[] {
    if (data.length === 0) return [];
    const first = data[0];
    return data.map(val => ((val - first) / first) * 100);
}

export async function analyzeFractalPattern(
    symbol: string,
    historyCandles: CandleData[],
    patternLength: number = 14, // Look at last 14 candles (e.g., 2 weeks if daily)
    forecastHorizon: number = 3  // Predict next 3 candles
): Promise<FractalAnalysisResult> {

    // 1. Get Current Pattern
    if (historyCandles.length < patternLength + forecastHorizon + 100) {
        // Not enough data
        return {
            symbol,
            recommendedPosition: 'WAIT',
            confidence: 0,
            avgReturn: 0,
            bestMatches: []
        };
    }

    const currentSegment = historyCandles.slice(-patternLength);
    const currentCloses = currentSegment.map(c => c.close);
    const currentNormalized = normalizePattern(currentCloses);

    // 2. Search History
    // We stop `forecastHorizon` before the end so we know the outcome of the match
    const matches: PatternMatch[] = [];

    // Scan backwards from (current - patternLength)
    // Limit scan to 1000 candles for performance if needed, or scan all
    const scanLimit = Math.min(historyCandles.length - patternLength - forecastHorizon, 1000);
    const startIndexForScan = historyCandles.length - patternLength - forecastHorizon;

    for (let i = startIndexForScan; i >= 0; i--) {
        const candidateSegment = historyCandles.slice(i, i + patternLength);
        const candidateCloses = candidateSegment.map(c => c.close);
        const candidateNormalized = normalizePattern(candidateCloses);

        // Calculate Similarity (Correlation)
        // We want positive correlation (same shape)
        const correlation = calculateCorrelation(currentNormalized, candidateNormalized);

        // Threshold: > 0.85 (Very similar)
        if (correlation > 0.85) {
            // Calculate what happened NEXT
            const entryPrice = historyCandles[i + patternLength - 1].close; // Last candle of pattern
            const exitPrice = historyCandles[i + patternLength + forecastHorizon - 1].close; // Forecast horizon close
            const percentChange = ((exitPrice - entryPrice) / entryPrice) * 100;

            matches.push({
                startIndex: i,
                endIndex: i + patternLength - 1,
                similarity: correlation * 100,
                nextMovePercent: percentChange,
                timestamp: new Date(historyCandles[i + patternLength - 1].time).toISOString()
            });
        }
    }

    // 3. Analyze Matches
    // Sort by similarity desc
    matches.sort((a, b) => b.similarity - a.similarity);
    const topMatches = matches.slice(0, 5); // Top 5 similar pasts

    if (topMatches.length === 0) {
        return {
            symbol,
            recommendedPosition: 'WAIT',
            confidence: 0,
            avgReturn: 0,
            bestMatches: []
        };
    }

    // Weighted Average of outcomes
    // Weight by similarity
    let weightedSum = 0;
    let totalWeight = 0;

    // Also count ups vs downs
    let ups = 0;
    let downs = 0;

    topMatches.forEach(m => {
        weightedSum += m.nextMovePercent * (m.similarity / 100);
        totalWeight += (m.similarity / 100);
        if (m.nextMovePercent > 0.5) ups++;
        else if (m.nextMovePercent < -0.5) downs++;
    });

    const avgReturn = totalWeight > 0 ? weightedSum / totalWeight : 0;

    // 4. Recommendation Logic
    let position: 'BUY' | 'SELL' | 'WAIT' = 'WAIT';
    let confidence = 0;

    // Simple majority voting with return check
    if (avgReturn > 1.0 && ups > downs) {
        position = 'BUY';
        confidence = (ups / topMatches.length) * 100;
    } else if (avgReturn < -1.0 && downs > ups) {
        position = 'SELL';
        confidence = (downs / topMatches.length) * 100;
    } else {
        position = 'WAIT';
        confidence = 50;
    }

    // Boost confidence if similarity is very high
    const maxSim = topMatches[0].similarity;
    if (maxSim > 95) confidence += 10;

    return {
        symbol,
        recommendedPosition: position,
        confidence: Math.min(confidence, 100),
        avgReturn,
        bestMatches: topMatches
    };
}
