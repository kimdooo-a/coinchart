import { CandleData } from '@/lib/api/binance';
import {
    calculateRSI, calculateMACD, calculateBollingerBands,
    calculateStochastic, calculateCCI, calculateWilliamsR, calculateADX
} from '@/lib/indicators';
import { IndicatorSignal } from '@/types/probability';

export interface MarketData {
    signals: IndicatorSignal[];
    adxValue: number; // For trend strength
    atrValue: number | undefined;
    bbWidth: number | undefined;
    rawIndicators: {
        RSI: number;
        StochK: number;
        StochD: number;
        CCI: number;
        MACD: number;
        WillR: number;
        ADX: number;
        BB: string;
        StdDev: number;
    };
    supportResistance?: {
        resistance: number;
        support: number;
        current: number;
    };
}

function getSignal(val: number, buyThresh: number, sellThresh: number, isReversed = false): 'BUY' | 'SELL' | 'NEUTRAL' {
    if (!Number.isFinite(val)) return 'NEUTRAL';
    if (isReversed) {
        if (val < buyThresh) return 'BUY';
        if (val > sellThresh) return 'SELL';
    } else {
        if (val < buyThresh) return 'BUY'; // Standard oversold = BUY
        if (val > sellThresh) return 'SELL';
    }
    return 'NEUTRAL';
}

export function generateSignals(candles: CandleData[]): MarketData {
    if (!candles || candles.length < 50) {
        return {
            signals: [],
            adxValue: 0,
            atrValue: 0, // Mock or recalc if needed
            bbWidth: 0,
            rawIndicators: {
                RSI: 0, StochK: 0, StochD: 0, CCI: 0, MACD: 0, WillR: 0, ADX: 0, BB: 'NEUTRAL', StdDev: 0
            },
            supportResistance: { resistance: 0, support: 0, current: 0 }
        };
    }

    const closes = candles.map(c => c.close);
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    const idx = candles.length - 1;

    // 1. Calculate Indicators using existing lib
    const rsi = calculateRSI(closes, 14);
    const { k: stochK, d: stochD } = calculateStochastic(highs, lows, closes);
    const cci = calculateCCI(highs, lows, closes, 20);
    const williams = calculateWilliamsR(highs, lows, closes);
    const { histogram } = calculateMACD(closes);
    const bb = calculateBollingerBands(closes);
    const adx = calculateADX(highs, lows, closes);

    // 2. Current Values
    const curRSI = rsi[idx];
    const curStochK = stochK[idx];
    const curStochD = stochD[idx];
    const curCCI = cci[idx];
    const curWill = williams[idx];
    const curMACD = histogram[idx];
    const prevMACD = histogram[idx - 1];
    const curBB = bb[idx]; // { upper, lower, middle }
    const curADX = adx[idx] || 0;

    // 3. Map to IndicatorSignal[] - Always include all signals (even neutral)
    const signals: IndicatorSignal[] = [];
    const now = Date.now();

    // RSI (< 30 => BUY, > 70 => SELL)
    const rsiSig = getSignal(curRSI, 30, 70);
    signals.push({ name: 'RSI', signal: rsiSig, strength: rsiSig === 'NEUTRAL' ? 0.5 : 1, timestamp: now });

    // Stochastic (K < 20 => BUY, K > 80 => SELL)
    let stochSig: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL';
    if (curStochK < 20) stochSig = 'BUY';
    else if (curStochK > 80) stochSig = 'SELL';
    signals.push({ name: 'Stochastic', signal: stochSig, strength: stochSig === 'NEUTRAL' ? 0.4 : 0.8, timestamp: now });

    // CCI (< -100 => BUY, > 100 => SELL)
    const cciSig = getSignal(curCCI, -100, 100);
    signals.push({ name: 'CCI', signal: cciSig, strength: cciSig === 'NEUTRAL' ? 0.45 : 0.9, timestamp: now });

    // Williams %R (< -80 => BUY, > -20 => SELL)
    const willSig = getSignal(curWill, -80, -20);
    signals.push({ name: 'Williams %R', signal: willSig, strength: willSig === 'NEUTRAL' ? 0.4 : 0.8, timestamp: now });

    // MACD (Histogram flip)
    let macdSig: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL';
    if (curMACD > 0 && prevMACD <= 0) macdSig = 'BUY';
    else if (curMACD < 0 && prevMACD >= 0) macdSig = 'SELL';
    else if (curMACD > 0) macdSig = 'BUY'; // Bullish momentum
    else if (curMACD < 0) macdSig = 'SELL'; // Bearish momentum
    signals.push({ name: 'MACD', signal: macdSig, strength: macdSig === 'NEUTRAL' ? 0.5 : 1.2, timestamp: now });

    // Bollinger (Price touch bands)
    const price = closes[idx];
    let bbSig: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL';
    if (curBB.lower && price <= curBB.lower) bbSig = 'BUY';
    else if (curBB.upper && price >= curBB.upper) bbSig = 'SELL';
    signals.push({ name: 'Bollinger', signal: bbSig, strength: bbSig === 'NEUTRAL' ? 0.5 : 1.1, timestamp: now });

    // BB Width (Upper - Lower) / Middle
    const bbWidth = (curBB.upper && curBB.lower && curBB.middle)
        ? (curBB.upper - curBB.lower) / curBB.middle
        : undefined;

    return {
        signals,
        adxValue: curADX,
        atrValue: undefined, // Analysis lib calculates it but we can skip if not critical, or add calls.
        bbWidth,
        rawIndicators: {
            RSI: curRSI,
            StochK: curStochK,
            StochD: curStochD,
            CCI: curCCI,
            MACD: curMACD,
            WillR: curWill,
            ADX: curADX,
            BB: bbSig,
            StdDev: Number.isFinite(curBB.upper) ? (curBB.upper - curBB.middle) : 0
        },
        supportResistance: calculateSupportResistance(candles)
    };
}

// Simple S/R Calculation based on recent Pivot Points (High/Low of 20 candles)
function calculateSupportResistance(candles: CandleData[]) {
    if (candles.length < 20) return { support: 0, resistance: 0, current: 0 };
    const recent = candles.slice(-50); // Look at last 50
    const highest = Math.max(...recent.map(c => c.high));
    const lowest = Math.min(...recent.map(c => c.low));
    const current = candles[candles.length - 1].close;

    // Findings nearest levels
    return {
        resistance: highest,
        support: lowest,
        current
    };
}
