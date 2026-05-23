// lib/supabase/crypto.ts
// CRYPTO SSOT ONLY - Fetch from market_prices (Binance, Coinbase data)
// DO NOT import stock functions from here

import { createClient } from '@/lib/supabase/client';
import type { CoinTicker } from '@/types/coins';

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

// ----------------------------------------------------------------------------
// R1 (2026-05-23) — Binance 24h ticker SSOT
// 메인페이지 시세 스트립·코인룸 6카드·사이드바 시세 위젯이 공유하는 단일 진실 공급원.
// 60초 메모리 캐시 + Next fetch revalidate 60초 (이중 캐시).
// ----------------------------------------------------------------------------

const BINANCE_TICKER_URL = "https://api.binance.com/api/v3/ticker/24hr";
const TICKER_CACHE = new Map<string, { data: CoinTicker[]; expiresAt: number }>();
const TICKER_TTL_MS = 60_000;

export async function fetchBinanceTickers(symbols: string[]): Promise<CoinTicker[]> {
    const key = symbols.slice().sort().join(",");
    const cached = TICKER_CACHE.get(key);
    const now = Date.now();
    if (cached && cached.expiresAt > now) return cached.data;

    const url = `${BINANCE_TICKER_URL}?symbols=${encodeURIComponent(JSON.stringify(symbols))}`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`[ticker] Binance ${res.status}`);
    const raw = (await res.json()) as Array<Record<string, string>>;
    const list: CoinTicker[] = raw.map((r) => ({
        symbol: r.symbol,
        baseSymbol: r.symbol.replace(/USDT$/, ""),
        price: Number(r.lastPrice),
        changePct: Number(r.priceChangePercent),
        volume24hUsd: Number(r.quoteVolume),
        high24h: Number(r.highPrice),
        low24h: Number(r.lowPrice),
        source: "binance",
        fetchedAt: now,
    }));
    TICKER_CACHE.set(key, { data: list, expiresAt: now + TICKER_TTL_MS });
    return list;
}

const COMMUNITY_DEFAULT_SYMBOLS = [
    "BTCUSDT", "ETHUSDT", "XRPUSDT", "SOLUSDT", "DOGEUSDT",
    "ADAUSDT", "BNBUSDT", "TRXUSDT", "LINKUSDT", "AVAXUSDT",
];

export async function fetchCommunityTickers(): Promise<CoinTicker[]> {
    return fetchBinanceTickers(COMMUNITY_DEFAULT_SYMBOLS);
}