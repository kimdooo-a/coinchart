
import { CandleData } from './api/binance';
import {
    calculateRSI, calculateMACD, calculateSMA, calculateBollingerBands,
    calculateStochastic, calculateCCI, calculateWilliamsR, calculateADX,
    calculateATR, calculateEMA
} from './indicators';
import { runBacktest } from './backtest';

type Signal = 'BUY' | 'SELL' | 'NEUTRAL';
export type MarketState = 'TRENDING_UP' | 'TRENDING_DOWN' | 'RANGING' | 'VOLATILE' | 'UNCERTAIN';

export type IndicatorResult = {
    name: string;
    signal: Signal;
    value: number | string;
    winRate: number;
    message: string;
    meta?: {
        totalSignals?: number;
        weight?: number;
        confidence?: number;
    };
};

export type AnalysisResult = {
    recommendation: string;
    score: number;
    indicators: IndicatorResult[];
    winRate: number;  // Probability of Price Rise
    lossRate: number; // Probability of Price Drop
    priceLevels?: {
        support: number[];
        resistance: number[];
        pivot: number;
        current: number;
        stopLoss: number;
        takeProfit: number;
        riskRewardRatio: number;
    };
    marketState: MarketState;
    volatility: {
        current: number;
        average: number;
        level: 'LOW' | 'NORMAL' | 'HIGH';
    };
    meta?: {
        recCode: Signal;
        totalWeight: number;
    };
};

const TRANSLATIONS = {
    en: {
        strongBuy: 'STRONG BUY', buy: 'BUY', neutral: 'NEUTRAL', sell: 'SELL', strongSell: 'STRONG SELL',
        bullish: 'Bullish', bearish: 'Bearish',
        rsiOversold: 'RSI Oversold', rsiOverbought: 'RSI Overbought',
        stochGolden: 'Stoch Cross Up', stochDeath: 'Stoch Cross Down',
        cciOversold: 'CCI Oversold', cciOverbought: 'CCI Overbought',
        willOversold: 'Oversold', willOverbought: 'Overbought',
        macdBull: 'MACD Bullish', macdBear: 'MACD Bearish',
        bbLower: 'Band Support', bbUpper: 'Band Resist',
        adxTrend: 'ADX Trend Strength',
        adxStrong: 'Strong Trend', adxWeak: 'Weak Trend',
        winRate: 'Rise Prob.'
    },
    ko: {
        strongBuy: '강력 매수', buy: '매수', neutral: '관망', sell: '매도', strongSell: '강력 매도',
        bullish: '상승세', bearish: '하락세',
        rsiOversold: 'RSI 과매도', rsiOverbought: 'RSI 과매수',
        stochGolden: '스토캐 골든크로스', stochDeath: '스토캐 데드크로스',
        cciOversold: 'CCI 과매도', cciOverbought: 'CCI 과매수',
        willOversold: '과매도 구간', willOverbought: '과매수 구간',
        macdBull: 'MACD 상승반전', macdBear: 'MACD 하락반전',
        bbLower: '볼밴 하단 터치', bbUpper: '볼밴 상단 터치',
        adxTrend: 'ADX 추세 강도',
        adxStrong: '강한 추세', adxWeak: '약한 추세',
        winRate: '상승 확률'
    }
} as const;

export interface AnalysisOptions {
    lang?: 'en' | 'ko';
    minCandles?: number;
    horizonBars?: number; // Backtest horizon
    rsiPeriod?: number;
    stochPeriod?: number;
}

function clamp(n: number, lo: number, hi: number) {
    return Math.max(lo, Math.min(hi, n));
}

function isFiniteNumber(x: unknown): x is number {
    return typeof x === 'number' && Number.isFinite(x);
}

// --- HELPER FUNCTIONS ---

function findPivotLows(candles: CandleData[], leftBars: number = 3, rightBars: number = 3): number[] {
    const pivots: number[] = [];
    for (let i = leftBars; i < candles.length - rightBars; i++) {
        const currentLow = candles[i].low;
        let isPivot = true;
        for (let j = i - leftBars; j < i; j++) if (candles[j].low <= currentLow) isPivot = false;
        for (let j = i + 1; j <= i + rightBars; j++) if (candles[j].low <= currentLow) isPivot = false;
        if (isPivot) pivots.push(currentLow);
    }
    return pivots;
}

function findPivotHighs(candles: CandleData[], leftBars: number = 3, rightBars: number = 3): number[] {
    const pivots: number[] = [];
    for (let i = leftBars; i < candles.length - rightBars; i++) {
        const currentHigh = candles[i].high;
        let isPivot = true;
        for (let j = i - leftBars; j < i; j++) if (candles[j].high >= currentHigh) isPivot = false;
        for (let j = i + 1; j <= i + rightBars; j++) if (candles[j].high >= currentHigh) isPivot = false;
        if (isPivot) pivots.push(currentHigh);
    }
    return pivots;
}

function classifyMarket(candles: CandleData[], atr: number[], avgATR: number): MarketState {
    const closes = candles.map(c => c.close);
    const currentATR = atr[atr.length - 1] || avgATR;
    const isHighVolatility = currentATR > avgATR * 1.5;

    if (isHighVolatility) return 'VOLATILE';

    // Trend Strength check via crude Price vs SMA
    const sma20 = calculateSMA(closes, 20);
    const currentSMA = sma20[sma20.length - 1];
    if (currentSMA) {
        const trendStrength = Math.abs((closes[closes.length - 1] - currentSMA) / currentSMA) * 100;
        if (trendStrength < 1.0) return 'RANGING'; // Tunable threshold
    }

    // Trend Direction via EMA
    const ema9 = calculateEMA(closes, 9);
    const ema21 = calculateEMA(closes, 21);
    const cEMA9 = ema9[ema9.length - 1];
    const cEMA21 = ema21[ema21.length - 1];

    if (cEMA9 && cEMA21) {
        if (cEMA9 > cEMA21) return 'TRENDING_UP';
        if (cEMA9 < cEMA21) return 'TRENDING_DOWN';
    }

    return 'UNCERTAIN';
}

function getIndicatorBaseWeight(indicator: string, marketState: MarketState): number {
    const baseWeights: Record<string, number> = {
        'RSI (14)': 1.0,
        'MACD': 1.5,
        'Stoch (14,3)': 1.2,
        'CCI (20)': 1.1,
        'Will %R': 0.9,
        'Bollinger': 0.8, // Volatility indicator
        'ADX': 1.3
    };

    let weight = baseWeights[indicator] || 1.0;

    switch (marketState) {
        case 'TRENDING_UP':
        case 'TRENDING_DOWN':
            if (indicator === 'MACD' || indicator.includes('ADX')) weight *= 1.3;
            if (indicator.includes('RSI') || indicator.includes('Stoch')) weight *= 0.8;
            break;
        case 'RANGING':
            if (indicator.includes('RSI') || indicator.includes('Stoch')) weight *= 1.4;
            if (indicator === 'MACD') weight *= 0.7;
            break;
        case 'VOLATILE':
            if (indicator.includes('Bollinger')) weight *= 1.5;
            weight *= 0.8;
            break;
    }
    return weight;
}

function calculateKeyLevels(candles: CandleData[], currentPrice: number) {
    const recent50 = candles.slice(-50);
    const recent20 = candles.slice(-20);

    const pivotLows = findPivotLows(recent20);
    const pivotHighs = findPivotHighs(recent20);

    // Fibonacci Retracement on recent 50
    const high = Math.max(...recent50.map(c => c.high));
    const low = Math.min(...recent50.map(c => c.low));
    const diff = high - low;

    // Simple Fib levels
    const fibSupport = [low + diff * 0.382, low + diff * 0.618];
    const fibResistance = [high - diff * 0.382, high - diff * 0.618];

    // Collect Supports
    const supportLevels = [
        ...pivotLows.filter(p => p < currentPrice),
        ...fibSupport.filter(p => p < currentPrice)
    ].sort((a, b) => b - a).slice(0, 3);

    // Collect Resistances
    const resistanceLevels = [
        ...pivotHighs.filter(p => p > currentPrice),
        ...fibResistance.filter(p => p > currentPrice)
    ].sort((a, b) => a - b).slice(0, 3);

    // Defaults
    const nearestSupport = supportLevels[0] || currentPrice * 0.95;
    const nearestResistance = resistanceLevels[0] || currentPrice * 1.05;

    // StopLoss / TakeProfit
    const stopLoss = nearestSupport * 0.98;
    const takeProfit = nearestResistance * 1.02;
    const riskRewardRatio = (takeProfit - currentPrice) / (currentPrice - stopLoss);

    return {
        support: supportLevels.length ? supportLevels : [nearestSupport],
        resistance: resistanceLevels.length ? resistanceLevels : [nearestResistance],
        pivot: (Math.max(...recent50.map(c => c.high)) + Math.min(...recent50.map(c => c.low)) + candles[candles.length - 1].close) / 3,
        current: currentPrice,
        stopLoss,
        takeProfit,
        riskRewardRatio
    };
}

// --- MAIN FUNCTION ---

export function analyzeMarket(candles: CandleData[], options: AnalysisOptions = {}): AnalysisResult {
    const {
        lang = 'en',
        minCandles = 60,
        horizonBars = 3,
    } = options;

    const t = TRANSLATIONS[lang];

    if (!candles || candles.length < minCandles) {
        return {
            recommendation: t.neutral,
            score: 0,
            indicators: [],
            winRate: 50,
            lossRate: 50,
            marketState: 'UNCERTAIN',
            volatility: { current: 0, average: 0, level: 'NORMAL' },
            meta: { recCode: 'NEUTRAL', totalWeight: 0 }
        };
    }

    const closes = candles.map(c => c.close);
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);

    // 1. Volatility & Market State
    const atrRaw = calculateATR(highs, lows, closes, 14);
    // Replace nulls with 0 or filter. For logic, we need aligned arrays, so we replace null with 0 or previous value.
    // Better: Filter for average, keep aligned for classification if improved logic handles it.
    // However, classifyMarket takes number[]. Let's replace nulls with 0 for safety.
    const atr = atrRaw.map(v => v ?? 0);

    const avgATR = atr.slice(-50).reduce((sum, val) => sum + val, 0) / 50;
    const currentATR = atr[atr.length - 1];
    const marketState = classifyMarket(candles, atr, avgATR);

    let volatilityLevel: 'LOW' | 'NORMAL' | 'HIGH' = 'NORMAL';
    if (currentATR > avgATR * 1.5) volatilityLevel = 'HIGH';
    else if (currentATR < avgATR * 0.7) volatilityLevel = 'LOW'; // Fixed logic: lower ATR = LOW

    // 2. Indicators
    const rsi = calculateRSI(closes, 14);
    const { k: stochK, d: stochD } = calculateStochastic(highs, lows, closes);
    const cci = calculateCCI(highs, lows, closes, 20);
    const williams = calculateWilliamsR(highs, lows, closes);
    const { histogram } = calculateMACD(closes);
    const bb = calculateBollingerBands(closes);
    const upper = bb.map(b => b.upper);
    const lower = bb.map(b => b.lower);
    const adx = calculateADX(highs, lows, closes);

    const idx = candles.length - 1;
    const indicators: IndicatorResult[] = [];
    let totalWeightedScore = 0;
    let totalWeight = 0;

    let riseProbSum = 0;
    let riseProbWeightSum = 0;

    const analyzeIndicator = (
        name: string,
        signalFn: (i: number) => Signal,
        messageFn: (i: number, sig: Signal) => string,
        formatValue: (i: number) => string
    ) => {
        const currentSignal = signalFn(idx);
        const currentValue = formatValue(idx);
        const msg = messageFn(idx, currentSignal);

        const bt = runBacktest(candles, signalFn, horizonBars, currentSignal);

        const winRate = isFiniteNumber(bt.winRate) ? bt.winRate : 50;
        const totalSignals = isFiniteNumber(bt.totalSignals) ? bt.totalSignals : 0;

        // Dynamic Weighting
        const base = getIndicatorBaseWeight(name, marketState);
        const sampleConfidence = clamp(totalSignals / 20, 0, 1);
        const weight = base * (0.5 + 0.5 * sampleConfidence); // Mix of base and sample reliability

        const confidence = Math.round(sampleConfidence * 100);

        indicators.push({
            name,
            signal: currentSignal,
            value: currentValue,
            winRate: Number(winRate.toFixed(1)),
            message: msg,
            meta: { totalSignals, weight: Number(weight.toFixed(3)), confidence }
        });

        if (winRate > 55) totalWeightedScore += 1 * weight;
        else if (winRate < 45) totalWeightedScore -= 1 * weight;

        totalWeight += weight;

        if (currentSignal !== 'NEUTRAL' && totalSignals > 0) {
            riseProbSum += winRate * weight;
            riseProbWeightSum += weight;
        }
    };

    // --- INDICATORS 
    // RSI
    analyzeIndicator('RSI (14)', (i) => {
        const v = rsi[i]; if (!isFiniteNumber(v)) return 'NEUTRAL';
        if (v < 30) return 'BUY'; if (v > 70) return 'SELL'; return 'NEUTRAL';
    }, (i, s) => s === 'BUY' ? t.rsiOversold : s === 'SELL' ? t.rsiOverbought : t.neutral,
        (i) => rsi[i]?.toFixed(1) ?? 'N/A');

    // Stochastic
    analyzeIndicator('Stoch (14,3)', (i) => {
        const k = stochK[i]; const d = stochD[i];
        if (!isFiniteNumber(k) || !isFiniteNumber(d)) return 'NEUTRAL';
        if (k < 20 && k > d) return 'BUY';
        if (k > 80 && k < d) return 'SELL';
        return 'NEUTRAL';
    }, (i, s) => s === 'BUY' ? t.stochGolden : s === 'SELL' ? t.stochDeath : t.neutral,
        (i) => `${stochK[i]?.toFixed(0)}/${stochD[i]?.toFixed(0)}`);

    // CCI
    analyzeIndicator('CCI (20)', (i) => {
        const v = cci[i]; if (!isFiniteNumber(v)) return 'NEUTRAL';
        if (v < -100) return 'BUY'; if (v > 100) return 'SELL'; return 'NEUTRAL';
    }, (i, s) => s === 'BUY' ? t.cciOversold : s === 'SELL' ? t.cciOverbought : t.neutral,
        (i) => cci[i]?.toFixed(0) ?? 'N/A');

    // Williams
    analyzeIndicator('Will %R', (i) => {
        const v = williams[i]; if (!isFiniteNumber(v)) return 'NEUTRAL';
        if (v < -80) return 'BUY'; if (v > -20) return 'SELL'; return 'NEUTRAL';
    }, (i, s) => s === 'BUY' ? t.willOversold : s === 'SELL' ? t.willOverbought : t.neutral,
        (i) => williams[i]?.toFixed(1) ?? 'N/A');

    // MACD
    analyzeIndicator('MACD', (i) => {
        const h = histogram[i]; const hp = histogram[i - 1];
        if (!isFiniteNumber(h) || !isFiniteNumber(hp)) return 'NEUTRAL';
        if (h > 0 && hp <= 0) return 'BUY';
        if (h < 0 && hp >= 0) return 'SELL';
        return 'NEUTRAL';
    }, (i, s) => s === 'BUY' ? t.macdBull : s === 'SELL' ? t.macdBear : t.neutral,
        (i) => histogram[i]?.toFixed(4) ?? 'N/A');

    // Bollinger
    analyzeIndicator('Bollinger', (i) => {
        const c = closes[i]; const l = lower[i]; const u = upper[i];
        if (!isFiniteNumber(c) || !isFiniteNumber(l) || !isFiniteNumber(u)) return 'NEUTRAL';
        if (c < l) return 'BUY'; if (c > u) return 'SELL'; return 'NEUTRAL';
    }, (i, s) => s === 'BUY' ? t.bbLower : s === 'SELL' ? t.bbUpper : t.neutral,
        (i) => 'Band');

    // ADX
    analyzeIndicator('ADX', (i) => {
        const v = adx[i]; if (!isFiniteNumber(v)) return 'NEUTRAL';
        if (v > 25) {
            // Strong trend. Direction depends on MACD or Trend EMA.
            // Here we just indicate Strength.
            return 'NEUTRAL';
        }
        return 'NEUTRAL';
    }, (i) => {
        const v = adx[i] || 0;
        return v > 25 ? t.adxStrong : t.adxWeak;
    }, (i) => adx[i]?.toFixed(1) ?? 'N/A');


    // 3. Final Scoring
    const normalizedScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;

    let recommendation: string = t.neutral;
    if (normalizedScore >= 0.6) recommendation = t.strongBuy;
    else if (normalizedScore >= 0.2) recommendation = t.buy;
    else if (normalizedScore <= -0.6) recommendation = t.strongSell;
    else if (normalizedScore <= -0.2) recommendation = t.sell;

    // 4. Win Rate
    let calculatedWinRate = riseProbWeightSum > 0 ? (riseProbSum / riseProbWeightSum) : 50;

    // Confidence Adjustment
    // Boost if score is aligned with win rate, dampen if sample is low.
    const signalStrength = Math.abs(normalizedScore);
    const adjustment = signalStrength * 5 * (totalWeight > 5 ? 1 : 0.5);

    if (normalizedScore > 0) calculatedWinRate += adjustment;
    if (normalizedScore < 0) calculatedWinRate -= adjustment;

    calculatedWinRate = clamp(calculatedWinRate, 10, 90);

    // 5. Price Levels (Advanced)
    const levels = calculateKeyLevels(candles, closes[closes.length - 1]);

    return {
        recommendation,
        score: Number(normalizedScore.toFixed(3)),
        indicators,
        winRate: Number(calculatedWinRate.toFixed(1)),
        lossRate: Number((100 - calculatedWinRate).toFixed(1)),
        marketState,
        volatility: {
            current: Number(currentATR.toFixed(4)),
            average: Number(avgATR.toFixed(4)),
            level: volatilityLevel
        },
        priceLevels: levels,
        meta: {
            recCode: normalizedScore > 0.2 ? 'BUY' : (normalizedScore < -0.2 ? 'SELL' : 'NEUTRAL'),
            totalWeight: Number(totalWeight.toFixed(3))
        }
    };
}
