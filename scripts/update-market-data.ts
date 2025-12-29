import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { SUPPORTED_COINS, TOP_US_STOCKS } from '../lib/constants';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Helper to fetch from Yahoo Finance
async function fetchYahooData(symbol: string) {
    console.log(`Fetching ${symbol} from Yahoo Finance...`);
    // Fetch last 5 days just to be safe and ensure we get the latest closed candle
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`;
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
        const data = await res.json();

        const result = data.chart?.result?.[0];
        if (!result) return null;

        const timestamps = result.timestamp;
        const quote = result.indicators.quote[0];

        if (!timestamps || !quote) return null;

        const cleanData = timestamps.map((ts: number, i: number) => ({
            timestamp: ts,
            dateStr: new Date(ts * 1000).toISOString().split('T')[0],
            open: quote.open[i],
            high: quote.high[i],
            low: quote.low[i],
            close: quote.close[i],
            volume: quote.volume[i]
        })).filter((d: any) => d.close !== null && d.close !== undefined);

        return cleanData;
    } catch (e) {
        console.error(`Failed to fetch ${symbol}:`, e);
        return null; // Continue despite error
    }
}

async function updateMarketData() {
    console.log('--- Starting Market Data Update ---');

    // 1. Process Cryptos
    console.log('\n[Processing Crypto]');
    // Map internal symbols (BTC) to Yahoo symbols (BTC-USD)
    for (const coin of SUPPORTED_COINS) {
        const yahooSymbol = `${coin.symbol}-USD`;
        const rawData = await fetchYahooData(yahooSymbol);

        if (!rawData || rawData.length === 0) continue;

        // Use symbol stored in DB (BTC) or mapped one (BTCUSDT)? 
        // Existing seed script used BTCUSDT, let's stick to consistent mapping if possible.
        // Checking seed_prices_v2.ts: "BTC-USD -> BTCUSDT".
        // Let's deduce standard: If app uses 'BTC', 'ETH' in most places, but 'market_prices' has 'BTCUSDT', we follow that.
        // The constants.ts says 'POPULAR_SYMBOLS = ... + "USDT"'. So likely "BTCUSDT".
        const appSymbol = `${coin.symbol}USDT`;

        const dbRows = rawData.map((d: any) => ({
            symbol: appSymbol,
            date: d.dateStr,
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close,
            volume: d.volume,
            type: 'CRYPTO'
        }));

        const { error } = await supabase.from('market_prices').upsert(dbRows, { onConflict: 'symbol,date' });
        if (error) console.error(`Error updating ${appSymbol}:`, error.message);
        else console.log(`✓ Updated ${appSymbol} (Last date: ${dbRows[dbRows.length - 1].date})`);

        await new Promise(r => setTimeout(r, 500));
    }

    // 2. Process Stocks
    console.log('\n[Processing Stocks]');
    for (const stock of TOP_US_STOCKS) {
        const rawData = await fetchYahooData(stock.symbol);

        if (!rawData || rawData.length === 0) continue;

        const dbRows = rawData.map((d: any) => ({
            symbol: stock.symbol,
            time: d.timestamp,
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close,
            volume: d.volume,
            currency: 'USD',
            source: 'yahoo_daily_cron'
        }));

        const { error } = await supabase.from('stock_prices').upsert(dbRows, { onConflict: 'symbol,time' });
        if (error) console.error(`Error updating ${stock.symbol}:`, error.message);
        else console.log(`✓ Updated ${stock.symbol} (Last time: ${new Date(dbRows[dbRows.length - 1].time * 1000).toISOString()})`);

        await new Promise(r => setTimeout(r, 500));
    }

    console.log('\n--- Market Data Update Completed ---');
}

updateMarketData().catch(console.error);
