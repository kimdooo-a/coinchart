
import { POPULAR_SYMBOLS } from '@/lib/constants';
import { calculateRSI } from '@/lib/indicators';

export type Signal = {
    symbol: string;
    type: 'BUY' | 'SELL' | 'WARNING' | 'INFO';
    title: string;
    description: string;
    score: number; // 0-100 severity
    timestamp: number;
    metrics?: string;
};

// Fetch Candles for a single symbol
type Candle = {
    close: number;
    high: number;
    low: number;
    volume: number;
    time: number;
};

async function fetchCandles(symbol: string, interval: string = '1h', limit: number = 100): Promise<Candle[]> {
    try {
        const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`);
        const data = await res.json();
        // [time, open, high, low, close, volume, ...]
        if (!Array.isArray(data)) return [];
        return data.map((d: any) => ({
            close: parseFloat(d[4]),
            high: parseFloat(d[2]),
            low: parseFloat(d[3]),
            volume: parseFloat(d[5]),
            time: d[0]
        }));
    } catch (e) {
        console.error(`Failed to fetch ${symbol}`, e);
        return [];
    }
}

export async function scanMarket(): Promise<Signal[]> {
    const signals: Signal[] = [];

    // Parallel Fetch for all symbols
    const results = await Promise.all(
        POPULAR_SYMBOLS.map(async (sym) => {
            const candles = await fetchCandles(sym, '1h', 50); // 1h candles
            return { symbol: sym, candles };
        })
    );

    for (const { symbol, candles } of results) {
        if (!candles || candles.length < 20) continue;

        const closePrices = candles.map(c => c.close);
        const currentPrice = closePrices[closePrices.length - 1];
        const prevPrice = closePrices[closePrices.length - 2];
        const displaySym = symbol.replace('USDT', '');

        // 1. RSI Check
        const rsiArray = calculateRSI(closePrices, 14);
        const currentRSI = rsiArray[rsiArray.length - 1];

        if (currentRSI === null || currentRSI === undefined) continue;

        if (currentRSI < 30) {
            signals.push({
                symbol: displaySym,
                type: 'BUY',
                title: '📉 과매도 구간 진입 (RSI Buy)',
                description: `${displaySym}의 RSI가 ${currentRSI.toFixed(1)}로 30이하입니다. 단기 반등이 예상됩니다.`,
                score: 80 + (30 - currentRSI), // Lower RSI = Higher Score
                timestamp: Date.now(),
                metrics: `RSI: ${currentRSI.toFixed(1)}`
            });
        } else if (currentRSI > 70) {
            signals.push({
                symbol: displaySym,
                type: 'SELL',
                title: '📈 과매수 구간 도달 (RSI Sell)',
                description: `${displaySym}의 RSI가 ${currentRSI.toFixed(1)}로 과열 상태입니다. 조정 가능성이 있습니다.`,
                score: 70 + (currentRSI - 70),
                timestamp: Date.now(),
                metrics: `RSI: ${currentRSI.toFixed(1)}`
            });
        }

        // 2. Sudden Price Change (Pump/Dump)
        const priceChange = ((currentPrice - prevPrice) / prevPrice) * 100;

        if (priceChange > 3) { // >3% in 1 hour
            signals.push({
                symbol: displaySym,
                type: 'WARNING',
                title: '🚀 급등 포착 (Pump Alert)',
                description: `${displaySym} 가격이 지난 1시간 동안 ${priceChange.toFixed(2)}% 급등했습니다. 추격 매수에 주의하세요.`,
                score: 85,
                timestamp: Date.now(),
                metrics: `+${priceChange.toFixed(2)}% (1h)`
            });
        } else if (priceChange < -3) {
            signals.push({
                symbol: displaySym,
                type: 'WARNING',
                title: '💧 급락 발생 (Dump Alert)',
                description: `${displaySym} 가격이 지난 1시간 동안 ${priceChange.toFixed(2)}% 하락했습니다. 바닥 확인이 필요합니다.`,
                score: 85,
                timestamp: Date.now(),
                metrics: `${priceChange.toFixed(2)}% (1h)`
            });
        }
    }

    // Sort by priority (score)
    const sortedSignals = signals.sort((a, b) => b.score - a.score);

    // If no signals found, add a Market Briefing (INFO) for BTC & ETH
    if (sortedSignals.length === 0) {
        for (const { symbol, candles } of results) {
            if (symbol !== 'BTCUSDT' && symbol !== 'ETHUSDT') continue;

            const closePrices = candles.map(c => c.close);
            const rsiArray = calculateRSI(closePrices, 14);
            const currentRSI = rsiArray[rsiArray.length - 1];
            if (currentRSI === null || currentRSI === undefined) continue;

            const displaySym = symbol.replace('USDT', '');

            sortedSignals.push({
                symbol: displaySym,
                type: 'INFO',
                title: `${displaySym} 시장 브리핑`,
                description: `현재 특이사항 없이 안정적인 흐름을 보이고 있습니다. (RSI: ${currentRSI.toFixed(1)})`,
                score: 10,
                timestamp: Date.now(),
                metrics: `RSI: ${currentRSI.toFixed(1)}`
            });
        }
    }

    return sortedSignals;
}
