export const WEIGHT_MATRIX = {
    // Key: indicator name
    // Value: weight (0.0 to 1.0)

    // Trend Indicators (Highest Weight)
    'MA': 1.0,
    'EMA': 1.0,
    'MACD': 0.9,
    'ADX': 0.8,

    // Momentum (Medium Weight)
    'RSI': 0.7,
    'Stochastic': 0.6,
    'CCI': 0.6,
    'WilliamsR': 0.6,

    // Volatility (Conditional Weight)
    'BollingerBands': 0.5,
    'ATR': 0.5,

    // Default fallback
    'DEFAULT': 1.0
};

export function getWeight(indicatorName: string): number {
    const key = Object.keys(WEIGHT_MATRIX).find(k => k.toLowerCase() === indicatorName.toLowerCase());
    if (key && key in WEIGHT_MATRIX) {
        return WEIGHT_MATRIX[key as keyof typeof WEIGHT_MATRIX];
    }
    return WEIGHT_MATRIX.DEFAULT;
}
