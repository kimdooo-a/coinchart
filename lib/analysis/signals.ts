import { CandleData } from '@/lib/api/binance';
import {
    calculateRSI, calculateMACD, calculateBollingerBands,
    calculateStochastic, calculateCCI, calculateWilliamsR, calculateADX,
    calculateATR, calculateOBV, calculateVWAP, calculateEMA
} from '@/lib/indicators';
import { IndicatorSignal } from '@/types/probability';
import { detectDivergence } from './divergence';
import { detectCandlestickPatterns } from './candlestick';

export interface MarketData {
    signals: IndicatorSignal[];
    adxValue: number; // For trend strength
    plusDI: number; // +DI (상승 방향)
    minusDI: number; // -DI (하락 방향)
    atrValue: number;
    avgAtrValue: number; // 평균 ATR (변동성 페널티 계산용)
    bbWidth: number | undefined;
    volumeRatio: number; // 현재 거래량 / 20일 평균 거래량
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
            plusDI: 0,
            minusDI: 0,
            atrValue: 0,
            avgAtrValue: 0,
            bbWidth: 0,
            volumeRatio: 0,
            rawIndicators: {
                RSI: 0, StochK: 0, StochD: 0, CCI: 0, MACD: 0, WillR: 0, ADX: 0, BB: 'NEUTRAL', StdDev: 0
            },
            supportResistance: { resistance: 0, support: 0, current: 0 }
        };
    }

    const closes = candles.map(c => c.close);
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    const volumes = candles.map(c => c.volume);
    const idx = candles.length - 1;

    // 1. Calculate Indicators using existing lib
    const rsi = calculateRSI(closes, 14);
    const { k: stochK, d: stochD } = calculateStochastic(highs, lows, closes);
    const cci = calculateCCI(highs, lows, closes, 20);
    const williams = calculateWilliamsR(highs, lows, closes);
    const { histogram } = calculateMACD(closes);
    const bb = calculateBollingerBands(closes);
    const { adx, plusDI, minusDI } = calculateADX(highs, lows, closes);
    const atrRaw = calculateATR(highs, lows, closes, 14);

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
    const curPlusDI = plusDI[idx] || 0;
    const curMinusDI = minusDI[idx] || 0;
    const curATR = Number.isFinite(atrRaw[idx]) ? atrRaw[idx] : 0;

    // 평균 ATR 계산 (최근 50개)
    const atrSlice = atrRaw.slice(-50).filter(v => Number.isFinite(v));
    const avgATR = atrSlice.length > 0 ? atrSlice.reduce((a, b) => a + b, 0) / atrSlice.length : 0;

    // 거래량 비율 계산 (현재 / 20일 평균)
    const curVolume = volumes[idx] || 0;
    const avgVolume = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
    const volumeRatio = avgVolume > 0 ? curVolume / avgVolume : 0;

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

    // ADX (+DI/-DI 방향 신호)
    let adxSig: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL';
    if (curADX > 25) {
        const curPlusDI = plusDI[idx];
        const curMinusDI = minusDI[idx];
        if (Number.isFinite(curPlusDI) && Number.isFinite(curMinusDI)) {
            if (curPlusDI > curMinusDI) adxSig = 'BUY';
            else if (curMinusDI > curPlusDI) adxSig = 'SELL';
        }
    }
    signals.push({ name: 'ADX', signal: adxSig, strength: adxSig === 'NEUTRAL' ? 0.4 : 1.0, timestamp: now });

    // Bollinger (Price touch bands)
    const price = closes[idx];
    let bbSig: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL';
    if (curBB.lower && price <= curBB.lower) bbSig = 'BUY';
    else if (curBB.upper && price >= curBB.upper) bbSig = 'SELL';
    signals.push({ name: 'Bollinger', signal: bbSig, strength: bbSig === 'NEUTRAL' ? 0.5 : 1.1, timestamp: now });

    // 캔들스틱 패턴
    const candlePatterns = detectCandlestickPatterns(candles.slice(-5));
    if (candlePatterns.length > 0) {
        const strongest = candlePatterns.reduce((a, b) => a.strength > b.strength ? a : b);
        signals.push({ name: 'Candlestick', signal: strongest.signal, strength: strongest.strength, timestamp: now });
    }

    // RSI Divergence
    const rsiDivergence = detectDivergence(closes, rsi.map(v => Number.isFinite(v) ? v : 0), 50);
    if (rsiDivergence.type !== 'NONE') {
        signals.push({ name: 'RSI Divergence', signal: rsiDivergence.signal, strength: rsiDivergence.strength, timestamp: now });
    }

    // MACD Divergence
    const macdDivergence = detectDivergence(closes, histogram.map(v => Number.isFinite(v) ? v : 0), 50);
    if (macdDivergence.type !== 'NONE') {
        signals.push({ name: 'MACD Divergence', signal: macdDivergence.signal, strength: macdDivergence.strength, timestamp: now });
    }

    // OBV (추세 확인 지표)
    const obv = calculateOBV(closes, volumes);
    const obvEma20 = calculateEMA(obv, 20);
    const curOBV = obv[idx];
    const curOBVEma = obvEma20[idx];
    let obvSig: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL';
    if (Number.isFinite(curOBV) && Number.isFinite(curOBVEma)) {
        if (curOBV > curOBVEma) obvSig = 'BUY';
        else if (curOBV < curOBVEma) obvSig = 'SELL';
    }
    signals.push({ name: 'OBV', signal: obvSig, strength: obvSig === 'NEUTRAL' ? 0.4 : 0.8, timestamp: now });

    // VWAP (가격 기준선)
    const vwap = calculateVWAP(highs, lows, closes, volumes);
    const curVWAP = vwap[idx];
    let vwapSig: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL';
    if (Number.isFinite(curVWAP) && curVWAP > 0) {
        const diff = (price - curVWAP) / curVWAP;
        if (diff > 0.01) vwapSig = 'BUY';
        else if (diff < -0.01) vwapSig = 'SELL';
    }
    signals.push({ name: 'VWAP', signal: vwapSig, strength: vwapSig === 'NEUTRAL' ? 0.4 : 0.7, timestamp: now });

    // BB Width (Upper - Lower) / Middle
    const bbWidth = (curBB.upper && curBB.lower && curBB.middle)
        ? (curBB.upper - curBB.lower) / curBB.middle
        : undefined;

    return {
        signals,
        adxValue: curADX,
        plusDI: curPlusDI,
        minusDI: curMinusDI,
        atrValue: curATR,
        avgAtrValue: avgATR,
        bbWidth,
        volumeRatio,
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
