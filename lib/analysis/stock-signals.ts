// lib/analysis/stock-signals.ts
// STOCK SIGNALS ONLY - NO CRYPTO SIGNALS
// Do NOT import from signal_engine.ts (crypto)

import { IndicatorSignal } from '@/types/probability';

export interface StockPriceData {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    symbol: string;
    currency?: string;
    source?: string;
}

/**
 * Generate stock-specific technical signals
 * NO crypto shared logic
 */
export function generateStockSignals(candles: StockPriceData[]): {
    signals: IndicatorSignal[];
    adxValue?: number;
    bbWidth?: number;
    rawIndicators?: any;
} {
    if (!candles || candles.length < 14) {
        return { signals: [] };
    }

    const signals: IndicatorSignal[] = [];
    const now = Date.now();

    // 1. SMA (Simple Moving Average)
    const sma20 = calculateSMA(candles, 20);
    const sma50 = calculateSMA(candles, 50);
    const sma200 = calculateSMA(candles, 200);

    // SMA Crossover Signal
    if (sma20 > sma50 && sma50 > sma200) {
        signals.push({
            name: 'SMA_Golden_Cross',
            signal: 'BUY',
            strength: 0.8,
            timestamp: now
        });
    } else if (sma20 < sma50 && sma50 < sma200) {
        signals.push({
            name: 'SMA_Death_Cross',
            signal: 'SELL',
            strength: 0.8,
            timestamp: now
        });
    }

    // 2. RSI (Relative Strength Index)
    const rsi = calculateRSI(candles, 14);
    if (rsi < 30) {
        signals.push({
            name: 'RSI_Oversold',
            signal: 'BUY',
            strength: 0.6,
            timestamp: now
        });
    } else if (rsi > 70) {
        signals.push({
            name: 'RSI_Overbought',
            signal: 'SELL',
            strength: 0.6,
            timestamp: now
        });
    }

    // 3. MACD (Moving Average Convergence Divergence)
    const { macdLine, signalLine, histogram } = calculateMACD(candles);
    if (macdLine > signalLine && histogram > 0) {
        signals.push({
            name: 'MACD_Bullish',
            signal: 'BUY',
            strength: 0.7,
            timestamp: now
        });
    } else if (macdLine < signalLine && histogram < 0) {
        signals.push({
            name: 'MACD_Bearish',
            signal: 'SELL',
            strength: 0.7,
            timestamp: now
        });
    }

    // 4. Volume Trend
    const volumeTrend = calculateVolumeTrend(candles);
    if (volumeTrend > 1.2) {
        signals.push({
            name: 'Volume_Increasing',
            signal: 'BUY',
            strength: 0.5,
            timestamp: now
        });
    }

    // 5. Price Position
    const pricePosition = calculatePricePosition(candles, 50);
    if (pricePosition > 0.7) {
        signals.push({
            name: 'Price_High_Range',
            signal: 'BUY',
            strength: 0.4,
            timestamp: now
        });
    }

    return {
        signals,
        adxValue: calculateADX(candles),
        bbWidth: calculateBBWidth(candles)
    };
}

// Helper functions (Stock-specific)

function calculateSMA(candles: StockPriceData[], period: number): number {
    const closes = candles.slice(-period).map(c => c.close);
    return closes.reduce((a, b) => a + b, 0) / closes.length;
}

function calculateRSI(candles: StockPriceData[], period: number): number {
    const changes = [];
    for (let i = 1; i < candles.length; i++) {
        changes.push(candles[i].close - candles[i - 1].close);
    }

    const gains = changes.filter(c => c > 0).reduce((a, b) => a + b, 0);
    const losses = Math.abs(changes.filter(c => c < 0).reduce((a, b) => a + b, 0));

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
}

function calculateMACD(candles: StockPriceData[]): {
    macdLine: number;
    signalLine: number;
    histogram: number;
} {
    const ema12 = calculateEMA(candles, 12);
    const ema26 = calculateEMA(candles, 26);
    const macdLine = ema12 - ema26;
    const signalLine = macdLine * 0.9; // Simplified
    const histogram = macdLine - signalLine;

    return { macdLine, signalLine, histogram };
}

function calculateEMA(candles: StockPriceData[], period: number): number {
    const closes = candles.map(c => c.close);
    const multiplier = 2 / (period + 1);
    let ema = closes[0];

    for (let i = 1; i < closes.length; i++) {
        ema = closes[i] * multiplier + ema * (1 - multiplier);
    }

    return ema;
}

function calculateVolumeTrend(candles: StockPriceData[]): number {
    const recentVolume = candles.slice(-10).reduce((a, b) => a + b.volume, 0) / 10;
    const historicalVolume = candles.slice(-50, -10).reduce((a, b) => a + b.volume, 0) / 40;
    return recentVolume / historicalVolume;
}

function calculatePricePosition(candles: StockPriceData[], period: number): number {
    const closes = candles.slice(-period).map(c => c.close);
    const min = Math.min(...closes);
    const max = Math.max(...closes);
    const current = closes[closes.length - 1];

    return (current - min) / (max - min);
}

function calculateADX(candles: StockPriceData[], period: number = 14): number {
    // Simplified ADX calculation
    const volatility = candles.slice(-period).reduce((acc, c, i) => {
        if (i === 0) return acc;
        return acc + Math.abs(candles[i].high - candles[i - 1].low);
    }, 0) / period;

    return Math.min(100, volatility);
}

function calculateBBWidth(candles: StockPriceData[], period: number = 20): number {
    const sma = calculateSMA(candles, period);
    const closes = candles.slice(-period).map(c => c.close);
    const variance = closes.reduce((acc, c) => acc + Math.pow(c - sma, 2), 0) / period;
    const stdDev = Math.sqrt(variance);
    const bbWidth = 2 * stdDev;

    return bbWidth;
}