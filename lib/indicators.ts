export interface IndicatorResult {
    value: number;
    signal: 'BUY' | 'SELL' | 'NEUTRAL';
    interpretation: string;
}

// --- HELPER MA ---
export const calculateSMA = (prices: number[], period: number): number[] => {
    const sma = [];
    for (let i = 0; i <= prices.length - period; i++) {
        const slice = prices.slice(i, i + period);
        const sum = slice.reduce((a, b) => a + b, 0);
        sma.push(sum / period);
    }
    // Pad to match original length? Use explicit logic. 
    // Standard: result[0] corresponds to prices[period-1].
    // To keep it simple for index alignment in analysis.ts (which uses data[i]), 
    // we should return an array where arr[i] corresponds to prices[i].
    // So we pad the beginning with nulls or 0.
    const padded = new Array(period - 1).fill(NaN).concat(sma);
    return padded;
}

export const calculateEMA = (prices: number[], period: number): number[] => {
    const k = 2 / (period + 1);
    const ema = new Array(prices.length).fill(NaN);

    // Start with SMA
    if (prices.length < period) return ema;

    let sum = 0;
    for (let i = 0; i < period; i++) sum += prices[i];
    ema[period - 1] = sum / period;

    for (let i = period; i < prices.length; i++) {
        ema[i] = (prices[i] * k) + (ema[i - 1] * (1 - k));
    }
    return ema;
}

// --- RSI ---
export const calculateRSI = (prices: number[], period: number = 14): number[] => {
    const rsi = new Array(prices.length).fill(NaN);
    if (prices.length <= period) return rsi;

    let avgGain = 0;
    let avgLoss = 0;

    for (let i = 1; i <= period; i++) {
        const change = prices[i] - prices[i - 1];
        if (change > 0) avgGain += change;
        else avgLoss += Math.abs(change);
    }

    avgGain /= period;
    avgLoss /= period;

    rs(period);

    function rs(idx: number) {
        let res = 100;
        if (avgLoss !== 0) {
            const r = avgGain / avgLoss;
            res = 100 - (100 / (1 + r));
        } else {
            res = 100;
        }
        rsi[idx] = res;
    }

    for (let i = period + 1; i < prices.length; i++) {
        const change = prices[i] - prices[i - 1];
        const gain = change > 0 ? change : 0;
        const loss = change < 0 ? Math.abs(change) : 0;

        avgGain = ((avgGain * (period - 1)) + gain) / period;
        avgLoss = ((avgLoss * (period - 1)) + loss) / period;
        rs(i);
    }
    return rsi;
}

export const analyzeRSI = (rsiValue: number): IndicatorResult => {
    if (rsiValue >= 70) return { value: rsiValue, signal: 'SELL', interpretation: 'Overbought (High risk of reversal)' };
    if (rsiValue <= 30) return { value: rsiValue, signal: 'BUY', interpretation: 'Oversold (Potential bounce)' };
    return { value: rsiValue, signal: 'NEUTRAL', interpretation: 'Neutral Zone' };
}

// --- MACD ---
export const calculateMACD = (prices: number[], fast: number = 12, slow: number = 26, signal: number = 9) => {
    const emaFast = calculateEMA(prices, fast);
    const emaSlow = calculateEMA(prices, slow);

    const macdLine = new Array(prices.length).fill(NaN);
    for (let i = 0; i < prices.length; i++) {
        if (!isNaN(emaFast[i]) && !isNaN(emaSlow[i])) {
            macdLine[i] = emaFast[i] - emaSlow[i];
        }
    }

    const signalLine = calculateEMA(macdLine.filter(x => !isNaN(x)), signal); // This logic needs alignment preservation
    // Correct way: Calculate EMA of MACD line array, preserving indices. 
    // But calculateEMA expects continuous numbers.
    // Let's implement simplified logic for MACD signal calculation or reuse EMA but handle NaNs carefully.

    // Re-impl simple loop for signal line
    const finalSignal = new Array(prices.length).fill(NaN);
    const validMacd = [];
    const validIndices = [];

    for (let i = 0; i < macdLine.length; i++) {
        if (!isNaN(macdLine[i])) {
            validMacd.push(macdLine[i]);
            validIndices.push(i);
        }
    }

    const emaSignal = calculateEMA(validMacd, signal);

    // Map back
    for (let i = 0; i < emaSignal.length; i++) {
        if (!isNaN(emaSignal[i])) {
            finalSignal[validIndices[i]] = emaSignal[i];
        }
    }

    const histogram = new Array(prices.length).fill(NaN);
    for (let i = 0; i < prices.length; i++) {
        if (!isNaN(macdLine[i]) && !isNaN(finalSignal[i])) {
            histogram[i] = macdLine[i] - finalSignal[i];
        }
    }

    return { macd: macdLine, signal: finalSignal, histogram };
}

// --- Bollinger Bands ---
export const calculateBollingerBands = (prices: number[], period: number = 20, multiplier: number = 2) => {
    const sma = calculateSMA(prices, period);
    const bands = [];

    for (let i = 0; i < prices.length; i++) {
        if (i < period - 1) {
            bands.push({ middle: NaN, upper: NaN, lower: NaN });
            continue;
        }

        const slice = prices.slice(i - period + 1, i + 1);
        const mean = sma[i];
        if (isNaN(mean)) {
            bands.push({ middle: NaN, upper: NaN, lower: NaN });
            continue;
        }

        const squaredDiffs = slice.map(p => Math.pow(p - mean, 2));
        const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
        const stdDev = Math.sqrt(variance);

        bands.push({
            middle: mean,
            upper: mean + (multiplier * stdDev),
            lower: mean - (multiplier * stdDev)
        });
    }
    return bands; // Returns array of objects aligned with input
}

// --- Stochastic ---
export const calculateStochastic = (highs: number[], lows: number[], closes: number[], period: number = 14, smoothK: number = 3, smoothD: number = 3) => {
    const kLine = new Array(closes.length).fill(NaN);

    for (let i = period - 1; i < closes.length; i++) {
        const periodLows = lows.slice(i - period + 1, i + 1);
        const periodHighs = highs.slice(i - period + 1, i + 1);
        const lowestLow = Math.min(...periodLows);
        const highestHigh = Math.max(...periodHighs);

        const currentClose = closes[i];
        if (highestHigh !== lowestLow) {
            kLine[i] = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
        } else {
            kLine[i] = 50;
        }
    }

    // Smooth K needs to handle NaNs. Filter out for EMA, then map back?
    // Analysis.ts expects strict array access.
    // Simple SMA smoothing for %D usually? Or EMA? Standard is SMA.
    const dLine = calculateSMA(kLine.map(x => (isNaN(x) ? 0 : x)), smoothD); // Crude handling of NaNs

    // Correct NaN restoring
    const finalK = kLine;
    const finalD = dLine.map((v, i) => i < period + smoothD ? NaN : v);

    return { k: finalK, d: finalD };
}

// --- CCI ---
export const calculateCCI = (highs: number[], lows: number[], closes: number[], period: number = 20) => {
    const tp = highs.map((h, i) => (h + lows[i] + closes[i]) / 3);
    const smaTP = calculateSMA(tp, period);

    const cci = new Array(closes.length).fill(NaN);

    for (let i = period - 1; i < closes.length; i++) {
        if (isNaN(smaTP[i])) continue;

        const slice = tp.slice(i - period + 1, i + 1);
        const meanDev = slice.reduce((sum, val) => sum + Math.abs(val - smaTP[i]), 0) / period;

        if (meanDev !== 0) {
            cci[i] = (tp[i] - smaTP[i]) / (0.015 * meanDev);
        } else {
            cci[i] = 0;
        }
    }
    return cci;
}

// --- Williams %R ---
export const calculateWilliamsR = (highs: number[], lows: number[], closes: number[], period: number = 14) => {
    const wR = new Array(closes.length).fill(NaN);

    for (let i = period - 1; i < closes.length; i++) {
        const periodLows = lows.slice(i - period + 1, i + 1);
        const periodHighs = highs.slice(i - period + 1, i + 1);
        const lowestLow = Math.min(...periodLows);
        const highestHigh = Math.max(...periodHighs);

        if (highestHigh !== lowestLow) {
            wR[i] = ((highestHigh - closes[i]) / (highestHigh - lowestLow)) * -100;
        } else {
            wR[i] = -50;
        }
    }
    return wR;
}

// --- ATR ---
export const calculateATR = (highs: number[], lows: number[], closes: number[], period: number = 14) => {
    const tr = new Array(closes.length).fill(0);
    // TR calculation requires previous close
    tr[0] = highs[0] - lows[0];
    for (let i = 1; i < closes.length; i++) {
        const hl = highs[i] - lows[i];
        const hpc = Math.abs(highs[i] - closes[i - 1]);
        const lpc = Math.abs(lows[i] - closes[i - 1]);
        tr[i] = Math.max(hl, hpc, lpc);
    }

    // ATR is usually RMA (Running Moving Average) or SMA depending on impl.
    // Wilder uses RMA (Smoothed MA which is basically EMA with alpha 1/N)
    // Let's use simple EMA helper here for approximate standard ATR behavior
    return calculateEMA(tr, period);
}

// --- ADX ---
export const calculateADX = (highs: number[], lows: number[], closes: number[], period: number = 14) => {
    // 1. Calculate +DM, -DM, TR
    const plusDM = new Array(closes.length).fill(0);
    const minusDM = new Array(closes.length).fill(0);
    const tr = new Array(closes.length).fill(0);

    tr[0] = highs[0] - lows[0];

    for (let i = 1; i < closes.length; i++) {
        const upMove = highs[i] - highs[i - 1];
        const downMove = lows[i - 1] - lows[i];

        if (upMove > downMove && upMove > 0) plusDM[i] = upMove;
        if (downMove > upMove && downMove > 0) minusDM[i] = downMove;

        const hl = highs[i] - lows[i];
        const hpc = Math.abs(highs[i] - closes[i - 1]);
        const lpc = Math.abs(lows[i] - closes[i - 1]);
        tr[i] = Math.max(hl, hpc, lpc);
    }

    // 2. Smoothed averages (Wilder's Smoothing)
    // Function for Wilder's Smoothing: (Prev * (n-1) + Curr) / n
    const smooth = (data: number[], p: number) => {
        const res = new Array(data.length).fill(0);
        let sum = 0;
        // First period SMA
        for (let i = 0; i < p; i++) if (data[i]) sum += data[i];
        res[p - 1] = sum / p;

        for (let i = p; i < data.length; i++) {
            res[i] = (res[i - 1] * (p - 1) + data[i]) / p;
        }
        return res;
    }

    const smoothPlusDM = smooth(plusDM, period);
    const smoothMinusDM = smooth(minusDM, period);
    const smoothTR = smooth(tr, period);

    // 3. DI calculation
    const plusDI = new Array(closes.length).fill(0);
    const minusDI = new Array(closes.length).fill(0);
    const dx = new Array(closes.length).fill(0);

    for (let i = 0; i < closes.length; i++) {
        if (smoothTR[i] !== 0) {
            plusDI[i] = (smoothPlusDM[i] / smoothTR[i]) * 100;
            minusDI[i] = (smoothMinusDM[i] / smoothTR[i]) * 100;
        }

        const diSum = plusDI[i] + minusDI[i];
        if (diSum !== 0) {
            dx[i] = (Math.abs(plusDI[i] - minusDI[i]) / diSum) * 100;
        }
    }

    // 4. ADX = SMA(DX) (or Wilder's smoothing of DX)
    const adx = smooth(dx, period);
    return adx;
}


export const analyzeTrend = (currentPrice: number, sma20: number): IndicatorResult => {
    if (isNaN(sma20)) return { value: 0, signal: 'NEUTRAL', interpretation: 'Insufficient Data' };
    if (currentPrice > sma20) return { value: sma20, signal: 'BUY', interpretation: 'Price above 20-day MA (Short-term Up)' };
    return { value: sma20, signal: 'SELL', interpretation: 'Price below 20-day MA (Short-term Down)' };
}
