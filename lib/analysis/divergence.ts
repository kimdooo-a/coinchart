// lib/analysis/divergence.ts
// 다이버전스 감지 모듈 - RSI/MACD 기반 반전 신호

export interface DivergenceResult {
    type: 'BULLISH' | 'BEARISH' | 'HIDDEN_BULLISH' | 'HIDDEN_BEARISH' | 'NONE';
    signal: 'BUY' | 'SELL' | 'NEUTRAL';
    strength: number; // 0.0 ~ 1.5
    description: string;
}

interface PivotPoint {
    index: number;
    value: number;
}

/**
 * 피봇 로우 감지 (가격 또는 지표 배열에서)
 */
function findPivotLows(data: number[], leftBars: number = 3, rightBars: number = 3): PivotPoint[] {
    const pivots: PivotPoint[] = [];
    for (let i = leftBars; i < data.length - rightBars; i++) {
        if (!Number.isFinite(data[i])) continue;
        let isPivot = true;
        for (let j = i - leftBars; j < i; j++) {
            if (!Number.isFinite(data[j]) || data[j] <= data[i]) { isPivot = false; break; }
        }
        if (!isPivot) continue;
        for (let j = i + 1; j <= i + rightBars; j++) {
            if (!Number.isFinite(data[j]) || data[j] <= data[i]) { isPivot = false; break; }
        }
        if (isPivot) pivots.push({ index: i, value: data[i] });
    }
    return pivots;
}

/**
 * 피봇 하이 감지
 */
function findPivotHighs(data: number[], leftBars: number = 3, rightBars: number = 3): PivotPoint[] {
    const pivots: PivotPoint[] = [];
    for (let i = leftBars; i < data.length - rightBars; i++) {
        if (!Number.isFinite(data[i])) continue;
        let isPivot = true;
        for (let j = i - leftBars; j < i; j++) {
            if (!Number.isFinite(data[j]) || data[j] >= data[i]) { isPivot = false; break; }
        }
        if (!isPivot) continue;
        for (let j = i + 1; j <= i + rightBars; j++) {
            if (!Number.isFinite(data[j]) || data[j] >= data[i]) { isPivot = false; break; }
        }
        if (isPivot) pivots.push({ index: i, value: data[i] });
    }
    return pivots;
}

/**
 * 다이버전스 감지
 * @param closes 종가 배열
 * @param indicator 지표 값 배열 (RSI, MACD 등)
 * @param lookback 최근 N개 캔들에서 피봇 탐색 (기본 50)
 */
export function detectDivergence(
    closes: number[],
    indicator: number[],
    lookback: number = 50
): DivergenceResult {
    if (closes.length < lookback || indicator.length < lookback) {
        return { type: 'NONE', signal: 'NEUTRAL', strength: 0, description: '' };
    }

    const recentCloses = closes.slice(-lookback);
    const recentIndicator = indicator.slice(-lookback);

    // 피봇 탐색 (leftBars=3, rightBars=3)
    const priceLows = findPivotLows(recentCloses, 3, 3);
    const priceHighs = findPivotHighs(recentCloses, 3, 3);
    const indicatorLows = findPivotLows(recentIndicator, 3, 3);
    const indicatorHighs = findPivotHighs(recentIndicator, 3, 3);

    // Bullish Divergence: 가격 Lower Low + 지표 Higher Low → BUY
    if (priceLows.length >= 2 && indicatorLows.length >= 2) {
        const [prevPriceLow, curPriceLow] = priceLows.slice(-2);
        const [prevIndLow, curIndLow] = indicatorLows.slice(-2);

        // 피봇 인덱스가 가까운지 확인 (동일 영역에서 비교)
        if (Math.abs(curPriceLow.index - curIndLow.index) <= 5 &&
            Math.abs(prevPriceLow.index - prevIndLow.index) <= 5) {
            if (curPriceLow.value < prevPriceLow.value && curIndLow.value > prevIndLow.value) {
                return {
                    type: 'BULLISH',
                    signal: 'BUY',
                    strength: 1.3,
                    description: 'Bullish Divergence: 가격 Lower Low + 지표 Higher Low'
                };
            }
        }
    }

    // Bearish Divergence: 가격 Higher High + 지표 Lower High → SELL
    if (priceHighs.length >= 2 && indicatorHighs.length >= 2) {
        const [prevPriceHigh, curPriceHigh] = priceHighs.slice(-2);
        const [prevIndHigh, curIndHigh] = indicatorHighs.slice(-2);

        if (Math.abs(curPriceHigh.index - curIndHigh.index) <= 5 &&
            Math.abs(prevPriceHigh.index - prevIndHigh.index) <= 5) {
            if (curPriceHigh.value > prevPriceHigh.value && curIndHigh.value < prevIndHigh.value) {
                return {
                    type: 'BEARISH',
                    signal: 'SELL',
                    strength: 1.3,
                    description: 'Bearish Divergence: 가격 Higher High + 지표 Lower High'
                };
            }
        }
    }

    // Hidden Bullish: 가격 Higher Low + 지표 Lower Low → 추세 지속 BUY
    if (priceLows.length >= 2 && indicatorLows.length >= 2) {
        const [prevPriceLow, curPriceLow] = priceLows.slice(-2);
        const [prevIndLow, curIndLow] = indicatorLows.slice(-2);

        if (Math.abs(curPriceLow.index - curIndLow.index) <= 5 &&
            Math.abs(prevPriceLow.index - prevIndLow.index) <= 5) {
            if (curPriceLow.value > prevPriceLow.value && curIndLow.value < prevIndLow.value) {
                return {
                    type: 'HIDDEN_BULLISH',
                    signal: 'BUY',
                    strength: 1.0,
                    description: 'Hidden Bullish Divergence: 추세 지속 신호'
                };
            }
        }
    }

    // Hidden Bearish: 가격 Lower High + 지표 Higher High → 추세 지속 SELL
    if (priceHighs.length >= 2 && indicatorHighs.length >= 2) {
        const [prevPriceHigh, curPriceHigh] = priceHighs.slice(-2);
        const [prevIndHigh, curIndHigh] = indicatorHighs.slice(-2);

        if (Math.abs(curPriceHigh.index - curIndHigh.index) <= 5 &&
            Math.abs(prevPriceHigh.index - prevIndHigh.index) <= 5) {
            if (curPriceHigh.value < prevPriceHigh.value && curIndHigh.value > prevIndHigh.value) {
                return {
                    type: 'HIDDEN_BEARISH',
                    signal: 'SELL',
                    strength: 1.0,
                    description: 'Hidden Bearish Divergence: 하락 추세 지속 신호'
                };
            }
        }
    }

    return { type: 'NONE', signal: 'NEUTRAL', strength: 0, description: '' };
}
