// lib/supabase/crypto.ts
// CRYPTO SSOT ONLY - Fetch from market_prices (Binance, Coinbase data)
// DO NOT import stock functions from here

import { createClient } from '@/lib/supabase/client';

export interface CryptoPriceData {
    time: number;          // Unix timestamp (seconds)
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    symbol: string;
}

/**
 * Fetch Crypto market prices from Supabase (SSOT)
 * Source: market_prices table (Binance data)
 *
 * @param symbol - Crypto symbol (e.g., 'BTCUSDT', 'ETHUSDT')
 * @param limit - Number of records to fetch (default: 990)
 * @returns Array of CryptoPriceData or null if error
 */
export async function fetchCryptoMarketPrices(
    symbol: string,
    limit: number = 990
): Promise<CryptoPriceData[] | null> {
    try {
        const supabase = createClient();

        const { data, error } = await supabase
            .from('market_prices')
            .select('date, open, high, low, close, volume, symbol')
            .eq('symbol', symbol.toUpperCase())
            .order('date', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('[Crypto SSOT] Fetch Error:', error);
            return null;
        }

        if (!data || data.length === 0) {
            console.warn(`[Crypto SSOT] No data found for symbol: ${symbol}`);
            return null;
        }

        // Map and sort ascending for analysis
        return data
            .map(d => ({
                time: new Date(d.date).getTime() / 1000, // Convert date string to Unix timestamp (seconds)
                open: Number(d.open),
                high: Number(d.high),
                low: Number(d.low),
                close: Number(d.close),
                volume: Number(d.volume),
                symbol: d.symbol
            }))
            .sort((a, b) => a.time - b.time);
    } catch (err) {
        console.error('[Crypto SSOT] Exception:', err);
        return null;
    }
}