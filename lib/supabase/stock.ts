// lib/supabase/stock.ts
// STOCK SSOT ONLY - Fetch from stock_prices (TwelveData, Alpha Vantage data)
// DO NOT import crypto functions from here

import { createClient } from '@/lib/supabase/client';

export interface StockPriceData {
    time: number;          // Unix timestamp (seconds)
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    symbol: string;
    currency: string;      // e.g., 'USD'
    source: string;        // e.g., 'twelvedata'
}

/**
 * Fetch Stock prices from Supabase (SSOT)
 * Source: stock_prices table (TwelveData, Alpha Vantage, etc.)
 *
 * @param symbol - Stock ticker symbol (e.g., 'AAPL', 'MSFT')
 * @param limit - Number of records to fetch (default: 365)
 * @returns Array of StockPriceData or null if error
 */
export async function fetchStockPrices(
    symbol: string,
    limit: number = 365
): Promise<StockPriceData[] | null> {
    try {
        const supabase = createClient();

        const { data, error } = await supabase
            .from('stock_prices')
            .select('time, open, high, low, close, volume, symbol, currency, source')
            .eq('symbol', symbol.toUpperCase())
            .order('time', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('[Stock SSOT] Fetch Error:', error);
            return null;
        }

        if (!data || data.length === 0) {
            console.warn(`[Stock SSOT] No data found for symbol: ${symbol}`);
            return null;
        }

        // Map and sort ascending for analysis
        return data
            .map(d => ({
                time: d.time,
                open: Number(d.open),
                high: Number(d.high),
                low: Number(d.low),
                close: Number(d.close),
                volume: Number(d.volume),
                symbol: d.symbol,
                currency: d.currency || 'USD',
                source: d.source || 'unknown'
            }))
            .sort((a, b) => a.time - b.time);
    } catch (err) {
        console.error('[Stock SSOT] Exception:', err);
        return null;
    }
}