/**
 * lib/analysis/stock/fetchStockSSOT.ts
 * 
 * STOCK SSOT FETCHER - Analysis Only
 * 
 * Purpose:
 * - Fetch stock price data from Supabase stock_prices table ONLY
 * - Block any external API calls (TwelveData, Alpha Vantage, etc.)
 * - Single Source of Truth (SSOT) for stock analysis
 * 
 * Usage:
 * - Import this function in stock analysis pages/components
 * - DO NOT use lib/api/twelvedata.ts or any external API directly in analysis
 * 
 * Data Source:
 * - Supabase stock_prices table (populated by daily_cron.ts)
 * - No external API calls allowed
 */

import { createClient } from '@/lib/supabase/client';

export interface StockCandleData {
    time: number;          // Unix timestamp (seconds)
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    symbol: string;
    currency?: string;     // e.g., 'USD'
    source?: string;       // e.g., 'twelvedata'
}

export interface FetchStockSSOTOptions {
    symbol: string;
    limit?: number;        // Default: 365 (1 year)
    startTime?: number;    // Optional: Unix timestamp (seconds) - fetch from this time
    endTime?: number;      // Optional: Unix timestamp (seconds) - fetch until this time
}

export interface FetchStockSSOTResult {
    success: boolean;
    data: StockCandleData[] | null;
    error: string | null;
    count: number;
}

/**
 * Fetch Stock prices from Supabase stock_prices table (SSOT)
 * 
 * BLOCKS any external API usage - Supabase only
 * 
 * @param options - Fetch options (symbol, limit, time range)
 * @returns FetchStockSSOTResult with data or error
 * 
 * @example
 * ```typescript
 * const result = await fetchStockSSOT({ symbol: 'AAPL', limit: 365 });
 * if (result.success && result.data) {
 *   // Use result.data for analysis
 * }
 * ```
 */
export async function fetchStockSSOT(
    options: FetchStockSSOTOptions
): Promise<FetchStockSSOTResult> {
    const { symbol, limit = 365, startTime, endTime } = options;

    // Validation
    if (!symbol || typeof symbol !== 'string' || symbol.trim().length === 0) {
        return {
            success: false,
            data: null,
            error: 'Invalid symbol: symbol must be a non-empty string',
            count: 0
        };
    }

    if (limit < 1 || limit > 10000) {
        return {
            success: false,
            data: null,
            error: 'Invalid limit: must be between 1 and 10000',
            count: 0
        };
    }

    try {
        const supabase = createClient();

        // Build query - ONLY from stock_prices table
        let query = supabase
            .from('stock_prices')
            .select('time, open, high, low, close, volume, symbol, currency, source')
            .eq('symbol', symbol.toUpperCase().trim());

        // Apply time range filters if provided
        if (startTime !== undefined && startTime > 0) {
            query = query.gte('time', startTime);
        }
        if (endTime !== undefined && endTime > 0) {
            query = query.lte('time', endTime);
        }

        // Order by time descending (newest first), then limit
        query = query
            .order('time', { ascending: false })
            .limit(limit);

        const { data, error, count } = await query;

        if (error) {
            console.error('[fetchStockSSOT] Supabase Error:', error);
            return {
                success: false,
                data: null,
                error: `Database error: ${error.message}`,
                count: 0
            };
        }

        if (!data || data.length === 0) {
            return {
                success: true,
                data: [],
                error: null,
                count: 0
            };
        }

        // Transform to StockCandleData format
        // Sort ascending by time for analysis (oldest to newest)
        const candles: StockCandleData[] = data
            .map((row: any) => ({
                time: Number(row.time),
                open: Number(row.open),
                high: Number(row.high),
                low: Number(row.low),
                close: Number(row.close),
                volume: Number(row.volume),
                symbol: row.symbol,
                currency: row.currency || 'USD',
                source: row.source || 'unknown'
            }))
            .sort((a, b) => a.time - b.time); // Ascending order for analysis

        return {
            success: true,
            data: candles,
            error: null,
            count: candles.length
        };

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('[fetchStockSSOT] Exception:', err);
        return {
            success: false,
            data: null,
            error: `Exception: ${errorMessage}`,
            count: 0
        };
    }
}

/**
 * Helper: Fetch stock data for a specific date range
 * 
 * @param symbol - Stock ticker (e.g., 'AAPL')
 * @param days - Number of days to fetch (default: 365)
 * @returns StockCandleData[] or null
 */
export async function fetchStockSSOTByDays(
    symbol: string,
    days: number = 365
): Promise<StockCandleData[] | null> {
    const endTime = Math.floor(Date.now() / 1000); // Current time in seconds
    const startTime = endTime - (days * 24 * 60 * 60); // days ago

    const result = await fetchStockSSOT({
        symbol,
        startTime,
        endTime,
        limit: days + 100 // Add buffer for weekends/holidays
    });

    if (!result.success || !result.data) {
        return null;
    }

    return result.data;
}

/**
 * Helper: Fetch latest N candles for a symbol
 * 
 * @param symbol - Stock ticker (e.g., 'AAPL')
 * @param limit - Number of candles to fetch (default: 365)
 * @returns StockCandleData[] or null
 */
export async function fetchStockSSOTLatest(
    symbol: string,
    limit: number = 365
): Promise<StockCandleData[] | null> {
    const result = await fetchStockSSOT({ symbol, limit });

    if (!result.success || !result.data) {
        return null;
    }

    return result.data;
}

