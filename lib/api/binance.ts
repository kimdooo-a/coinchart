import { ColorType } from 'lightweight-charts';

export type CandleData = {
    time: number; // Unix timestamp in seconds
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
};

export type TickerData = {
    symbol: string;
    price: number;
    changePercent: number; // 24h change
};

const BINANCE_API_URL = 'https://api.binance.com/api/v3';
const BINANCE_WS_URL = 'wss://stream.binance.com:9443/ws';

function isStockSymbol(symbol: string): boolean {
    // Simple heuristic: If it doesn't end in USDT, it's likely a stock for our app context
    // Our crypto symbols are like BTCUSDT, ETHUSDT. Stocks are AAPL, TSLA.
    return !symbol.endsWith('USDT');
}

function generateMockCandles(symbol: string, limit: number): CandleData[] {
    const data: CandleData[] = [];
    let price = 150; // Base price for mock stocks
    if (symbol === 'NVDA') price = 130;
    if (symbol === 'TSLA') price = 220;
    if (symbol === 'AAPL') price = 230;

    const now = Math.floor(Date.now() / 1000);
    const intervalSeconds = 60; // 1m assumed

    for (let i = limit; i > 0; i--) {
        const time = now - (i * intervalSeconds);
        const volatility = price * 0.002;
        const change = (Math.random() - 0.5) * volatility;
        const open = price;
        const close = price + change;
        const high = Math.max(open, close) + Math.random() * volatility * 0.5;
        const low = Math.min(open, close) - Math.random() * volatility * 0.5;
        const volume = Math.floor(Math.random() * 100000);

        data.push({ time, open, high, low, close, volume });
        price = close;
    }
    return data;
}

/**
 * Fetch historical K-line data (Candles)
 */
export async function getKlines(symbol: string, interval: string = '1m', limit: number = 1000): Promise<CandleData[]> {
    if (isStockSymbol(symbol)) {
        // Return Mock Data for Stocks
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(generateMockCandles(symbol, limit));
            }, 500); // Simulate network delay
        });
    }

    const url = `${BINANCE_API_URL}/klines?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=${limit}`;
    const res = await fetch(url);

    if (!res.ok) {
        throw new Error('Failed to fetch klines');
    }

    const data = await res.json();

    // Binance response format: [ [time, open, high, low, close, volume, ...], ... ]
    // Time from Binance is in ms, Lightweight Charts expects seconds (for UTCTimestamp) or just distinct numbers
    return data.map((d: any) => ({
        time: d[0] / 1000,
        open: parseFloat(d[1]),
        high: parseFloat(d[2]),
        low: parseFloat(d[3]),
        close: parseFloat(d[4]),
        volume: parseFloat(d[5]),
    }));
}

/**
 * Subscribe to realtime price ticker
 */
export function subscribeToTicker(symbol: string, callback: (data: TickerData) => void) {
    if (isStockSymbol(symbol)) {
        // Mock Ticker for Stocks
        const intervalId = setInterval(() => {
            const volatility = 0.5;
            const change = (Math.random() - 0.5) * volatility;
            // Use a stable-ish mock price based on symbol
            let basePrice = 150;
            if (symbol === 'NVDA') basePrice = 130;
            if (symbol === 'TSLA') basePrice = 220;

            callback({
                symbol: symbol,
                price: basePrice + (Math.random() * 5),
                changePercent: (Math.random() * 2) - 1
            });
        }, 2000);
        return () => clearInterval(intervalId);
    }

    const ws = new WebSocket(`${BINANCE_WS_URL}/${symbol.toLowerCase()}@ticker`);

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        // data.c is current price, data.P is price change percent
        callback({
            symbol: data.s,
            price: parseFloat(data.c),
            changePercent: parseFloat(data.P),
        });
    };

    return () => ws.close();
}

/**
 * Subscribe to realtime K-line updates
 */
export function subscribeToKlines(symbol: string, interval: string, callback: (data: CandleData) => void) {
    if (isStockSymbol(symbol)) {
        // Mock Kline Updates
        // logic... just return nothing or simple interval
        return () => { };
    }

    const ws = new WebSocket(`${BINANCE_WS_URL}/${symbol.toLowerCase()}@kline_${interval}`);

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const k = data.k;
        // k.t is start time of kline (ms)
        callback({
            time: k.t / 1000,
            open: parseFloat(k.o),
            high: parseFloat(k.h),
            low: parseFloat(k.l),
            close: parseFloat(k.c),
            volume: parseFloat(k.v),
        });
    };

    return () => ws.close();
}
