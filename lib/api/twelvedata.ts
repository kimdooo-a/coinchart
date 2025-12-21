
export type TwelveDataCandle = {
    time: number; // Unix timestamp in seconds
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
};

export type TwelveDataTicker = {
    symbol: string;
    price: number;
    changePercent: number;
};

/**
 * Fetch Time Series (Candles) via detailed internal proxy
 */
export async function getTwelveDataTimeSeries(
    symbol: string,
    interval: string = '1d',
    outputsize: number = 365
): Promise<TwelveDataCandle[]> {
    // Interval Mapping
    const intervalMap: Record<string, string> = {
        '1m': '1min',
        '5m': '5min',
        '15m': '15min',
        '1h': '1h',
        '4h': '4h',
        '1d': '1day',
        '1w': '1week'
    };
    const mappedInterval = intervalMap[interval] || interval;

    try {
        const res = await fetch(`/api/stock/time-series?symbol=${symbol}&interval=${mappedInterval}&outputsize=${outputsize}`);

        if (!res.ok) {
            throw new Error(`Proxy error: ${res.statusText}`);
        }

        const data = await res.json();

        if (data.status === 'error' || data.error) {
            throw new Error(data.message || data.error);
        }

        if (!data.values || !Array.isArray(data.values)) {
            return [];
        }

        // Twelve Data returns newest first.
        const candles: TwelveDataCandle[] = data.values.map((item: any) => ({
            time: new Date(item.datetime).getTime() / 1000,
            open: parseFloat(item.open),
            high: parseFloat(item.high),
            low: parseFloat(item.low),
            close: parseFloat(item.close),
            volume: parseFloat(item.volume)
        })).reverse();

        return candles;

    } catch (error) {
        console.error('getTwelveDataTimeSeries Error:', error);
        return [];
    }
}

/**
 * Fetch Real-time (delayed) quote via internal proxy
 */
export async function getTwelveDataQuote(symbol: string): Promise<TwelveDataTicker | null> {
    try {
        const res = await fetch(`/api/stock/quote?symbol=${symbol}`);
        if (!res.ok) throw new Error('Network response was not ok');

        const data = await res.json();

        if (data.status === 'error' || data.error) {
            throw new Error(data.message || data.error);
        }

        return {
            symbol: data.symbol,
            price: parseFloat(data.close) || parseFloat(data.open) || 0,
            changePercent: parseFloat(data.percent_change) || 0
        };

    } catch (error) {
        console.error('getTwelveDataQuote Error:', error);

        // Return Mock/Fallback data to prevent UI crash
        return {
            symbol: symbol,
            price: 0,
            changePercent: 0
        };
    }
}
