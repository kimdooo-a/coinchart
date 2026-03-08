import { MarketRegime } from '@/types/probability';

// 기본 가중치 매트릭스
export const WEIGHT_MATRIX: Record<string, number> = {
    // Trend Indicators
    'MA': 1.0,
    'EMA': 1.0,
    'MACD': 0.9,
    'ADX': 0.8,

    // Momentum
    'RSI': 0.7,
    'Stochastic': 0.6,
    'CCI': 0.6,
    'WilliamsR': 0.6,
    'Williams %R': 0.6,

    // Volatility
    'BollingerBands': 0.5,
    'Bollinger': 0.5,
    'ATR': 0.5,

    // Volume
    'OBV': 0.6,
    'VWAP': 0.5,

    // Trend Following
    'Supertrend': 0.8,
    'PSAR': 0.7,

    // Pattern/Divergence
    'RSI Divergence': 0.8,
    'MACD Divergence': 0.8,
    'Candlestick': 0.6,

    // Default
    'DEFAULT': 1.0
};

// 레짐별 가중치 조정 계수
const REGIME_ADJUSTMENTS: Record<string, Record<string, number>> = {
    'STRONG_UPTREND': {
        'MACD': 1.2, 'ADX': 1.0, 'RSI': 0.5, 'Stochastic': 0.5,
        'OBV': 1.1, 'VWAP': 0.9,
        'Supertrend': 1.3, 'PSAR': 1.2,
        'RSI Divergence': 0.7, 'MACD Divergence': 0.7,
        'Candlestick': 0.6,
    },
    'STRONG_DOWNTREND': {
        'MACD': 1.2, 'ADX': 1.0, 'RSI': 0.5, 'Stochastic': 0.5,
        'OBV': 1.1, 'VWAP': 0.9,
        'Supertrend': 1.3, 'PSAR': 1.2,
        'RSI Divergence': 0.7, 'MACD Divergence': 0.7,
        'Candlestick': 0.6,
    },
    'UPTREND': {
        'MACD': 1.1, 'ADX': 0.9, 'RSI': 0.7, 'Stochastic': 0.7,
        'OBV': 1.0, 'VWAP': 0.9,
        'Supertrend': 1.1, 'PSAR': 1.0,
        'RSI Divergence': 0.9, 'MACD Divergence': 0.9,
        'Candlestick': 0.8,
    },
    'DOWNTREND': {
        'MACD': 1.1, 'ADX': 0.9, 'RSI': 0.7, 'Stochastic': 0.7,
        'OBV': 1.0, 'VWAP': 0.9,
        'Supertrend': 1.1, 'PSAR': 1.0,
        'RSI Divergence': 0.9, 'MACD Divergence': 0.9,
        'Candlestick': 0.8,
    },
    'STRONG_TREND': {
        'MACD': 1.2, 'ADX': 1.0, 'RSI': 0.5, 'Stochastic': 0.5,
        'OBV': 1.1, 'VWAP': 0.9,
    },
    'RANGING': {
        'RSI': 1.0, 'Stochastic': 0.9, 'CCI': 0.8, 'MACD': 0.4,
        'ADX': 0.3, 'Bollinger': 0.8,
        'Supertrend': 0.4, 'PSAR': 0.4, // 횡보에서 추세 지표 약화
        'RSI Divergence': 1.5, 'MACD Divergence': 1.5,
        'Candlestick': 1.0,
    },
    'HIGH_VOLATILITY': {
        'Bollinger': 1.0, 'BollingerBands': 1.0, 'ATR': 0.8,
        // 고변동성에서 모든 지표 신뢰도 감쇠
        '_GLOBAL_DAMPING': 0.7,
    },
    'ACCUMULATION': {
        'Bollinger': 1.2, 'RSI': 0.8, 'MACD': 0.6,
        'ADX': 0.3, // 축소 구간에서 ADX 의미 적음
        'RSI Divergence': 1.3,
        'Candlestick': 1.2, // 돌파 패턴 중요
    }
};

/**
 * 레짐 기반 가중치 반환
 * @param indicatorName 지표 이름
 * @param regime 현재 시장 레짐 (optional, 없으면 기본 가중치)
 */
export function getWeight(indicatorName: string, regime?: MarketRegime): number {
    // 기본 가중치 찾기
    const key = Object.keys(WEIGHT_MATRIX).find(k => k.toLowerCase() === indicatorName.toLowerCase());
    let baseWeight = (key && key in WEIGHT_MATRIX) ? WEIGHT_MATRIX[key] : WEIGHT_MATRIX.DEFAULT;

    if (!regime) return baseWeight;

    // 레짐 조정
    const adjustments = REGIME_ADJUSTMENTS[regime];
    if (!adjustments) return baseWeight;

    // 글로벌 감쇠 적용 (HIGH_VOLATILITY 등)
    const globalDamping = adjustments['_GLOBAL_DAMPING'] || 1.0;

    // 지표별 조정 계수 적용
    const adjustKey = Object.keys(adjustments).find(k => k.toLowerCase() === indicatorName.toLowerCase());
    if (adjustKey && adjustKey !== '_GLOBAL_DAMPING') {
        baseWeight *= adjustments[adjustKey];
    }

    return baseWeight * globalDamping;
}
