import { MarketRegime } from '@/types/probability';

interface RegimeInput {
    adx?: number;        // Trend strength
    atr?: number;        // Volatility
    price?: number;      // For normalization
    bbWidth?: number;    // Alternative volatility
}

// Thresholds (Project constants)
const ADX_TREND_THRESHOLD = 25;
const BB_WIDTH_VOLATILITY_THRESHOLD = 0.10; // 10% width relative to price? Needs context.
// Assuming normalized values or relying on ADX mostly for trend.

export function detectRegime(input: RegimeInput): { regime: MarketRegime; reason: string } {
    // 1. Check Volatility first (Safety)
    // If ATR or BB Width is extremely high, we call High Volatility
    // Implementation note: Without historical average, absolute ATR is hard to judge.
    // We will rely on ADX for Trend vs Ranging primarily, and BB Width for Volatility if provided.

    // Placeholder logic for BB Width Volatility check
    if (input.bbWidth && input.bbWidth > BB_WIDTH_VOLATILITY_THRESHOLD) {
        return { regime: 'HIGH_VOLATILITY', reason: `High Bollinger Band Width (${(input.bbWidth * 100).toFixed(2)}%)` };
    }

    // 2. Check Trend Strength
    if (input.adx !== undefined) {
        if (input.adx >= ADX_TREND_THRESHOLD) {
            return { regime: 'STRONG_TREND', reason: `ADX (${input.adx.toFixed(2)}) indicates strong trend` };
        } else {
            return { regime: 'RANGING', reason: `ADX (${input.adx.toFixed(2)}) indicates weak trend` };
        }
    }

    // 3. Fallback
    return { regime: 'RANGING', reason: 'Insufficient data for regime classification (Defaulting)' };
}
