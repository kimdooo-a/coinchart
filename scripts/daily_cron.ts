import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables locally (for testing)
// In GitHub Actions, these will be injected via secrets
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TWELVEDATA_API_KEY = process.env.TWELVEDATA_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing Supabase Credentials');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false }
});

const SUPPORTED_COINS = [
    { symbol: 'BTC', name: 'Bitcoin' },
    { symbol: 'ETH', name: 'Ethereum' },
    { symbol: 'XRP', name: 'Ripple' },
    { symbol: 'SOL', name: 'Solana' },
    { symbol: 'BCH', name: 'Bitcoin Cash' },
    { symbol: 'DOGE', name: 'Dogecoin' }
];

const TOP_US_STOCKS = [
    { symbol: 'AAPL', name: 'Apple' },
    { symbol: 'MSFT', name: 'Microsoft' },
    { symbol: 'NVDA', name: 'Nvidia' },
    { symbol: 'GOOGL', name: 'Alphabet' },
    { symbol: 'AMZN', name: 'Amazon' },
    { symbol: 'META', name: 'Meta' },
    { symbol: 'TSLA', name: 'Tesla' },
    { symbol: 'BRK.B', name: 'Berkshire' }, // Note: TwelveData might use BRK-B or BRK.B
    { symbol: 'LLY', name: 'Eli Lilly' },
    { symbol: 'AVGO', name: 'Broadcom' }
];

const POPULAR_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'XRPUSDT', 'SOLUSDT', 'BCHUSDT', 'DOGEUSDT'];

// --- Sub-Tasks ---

async function syncStocks() {
    console.log('\n📈 Starting STOCK Sync...');
    if (!TWELVEDATA_API_KEY) {
        console.error('❌ Missing TwelveData API Key');
        return;
    }

    const intervals = ['1day', '1week']; // use TwelveData format directly

    for (const stock of TOP_US_STOCKS) {
        let symbol = stock.symbol;
        if (symbol === 'BRK.B') symbol = 'BRK-B'; // Fix for some APIs if needed

        for (const interval of intervals) {
            try {
                // Rate limit handling: Sleep 8 seconds roughly if needed. 
                // But GitHub Actions has plenty of time, so safe to just await.
                // However, free Twelve Data key is strict. 8 req/min.
                // We will sleep 8s between EVERY request.
                await new Promise(r => setTimeout(r, 8000));

                const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${interval}&outputsize=990&apikey=${TWELVEDATA_API_KEY}`;
                const res = await fetch(url);
                if (!res.ok) throw new Error(`Fetch failed ${res.status}`);

                const data = await res.json();
                if (data.status === 'error') throw new Error(data.message);
                if (!data.values) continue;

                const dbInterval = interval === '1day' ? '1d' : '1w';

                const rows = data.values.map((v: any) => ({
                    symbol: stock.symbol, // Use clean symbol
                    interval: dbInterval,
                    time: new Date(v.datetime).getTime() / 1000,
                    open: parseFloat(v.open),
                    high: parseFloat(v.high),
                    low: parseFloat(v.low),
                    close: parseFloat(v.close),
                    volume: parseFloat(v.volume)
                }));

                const { error } = await supabase.from('stock_candles').upsert(rows, { onConflict: 'symbol,interval,time' });
                if (error) console.error(`  ❌ DB Error ${symbol} ${dbInterval}:`, error.message);
                else console.log(`  ✅ Synced ${symbol} ${dbInterval} (${rows.length} rows)`);

            } catch (err: any) {
                console.error(`  ❌ Failed ${symbol} ${interval}:`, err.message);
            }
        }
    }
}

async function syncCoins() {
    console.log('\n🪙 Starting COIN Sync (Binance)...');

    for (const symbol of POPULAR_SYMBOLS) {
        try {
            await new Promise(r => setTimeout(r, 500)); // Gentle delay
            const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1d&limit=2`);
            if (!res.ok) continue;
            const data = await res.json();
            if (!data || data.length < 2) continue;

            const candle = data[0]; // Yesterday's complete candle
            const dateStr = new Date(candle[0]).toISOString().split('T')[0];
            const cleanSymbol = symbol.replace('USDT', '');

            const record = {
                symbol: cleanSymbol,
                date: dateStr,
                open: parseFloat(candle[1]),
                high: parseFloat(candle[2]),
                low: parseFloat(candle[3]),
                close: parseFloat(candle[4]),
                volume: parseFloat(candle[5]),
                type: 'CRYPTO'
            };

            const { error } = await supabase.from('market_prices').upsert(record, { onConflict: 'symbol,date' });
            if (error) console.error(`  ❌ DB Error ${cleanSymbol}:`, error.message);
            else console.log(`  ✅ Synced ${cleanSymbol} ${dateStr}`);

        } catch (err: any) {
            console.error(`  ❌ Failed ${symbol}:`, err.message);
        }
    }
}

async function syncNews() {
    console.log('\n📰 Starting NEWS Sync...');

    const TARGETS = [
        ...SUPPORTED_COINS.map(c => ({ keyword: c.name, symbol: c.symbol })),
        ...TOP_US_STOCKS.map(s => ({ keyword: s.name, symbol: s.symbol }))
    ];

    const LANGS = ['ko', 'en'];

    for (const lang of LANGS) {
        const hl = lang;
        const gl = lang === 'ko' ? 'KR' : 'US';
        const ceid = lang === 'ko' ? 'KR:ko' : 'US:en';

        for (const target of TARGETS) {
            try {
                await new Promise(r => setTimeout(r, 2000)); // Delay to avoid blocking
                const res = await fetch(`https://news.google.com/rss/search?q=${encodeURIComponent(target.keyword)}&hl=${hl}&gl=${gl}&ceid=${ceid}`);
                const text = await res.text();

                // Regex parsing logic (Simplified version of route handler)
                const itemRegex = /<item>([\s\S]*?)<\/item>/g;
                let match;
                let count = 0;

                while ((match = itemRegex.exec(text)) !== null && count < 3) {
                    const content = match[1];
                    const titleMatch = content.match(/<title>([\s\S]*?)<\/title>/);
                    const linkMatch = content.match(/<link>([\s\S]*?)<\/link>/);
                    const pubDateMatch = content.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
                    const sourceMatch = content.match(/<source[^>]*>([\s\S]*?)<\/source>/);

                    if (titleMatch && linkMatch && pubDateMatch) {
                        const title = titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim();
                        const link = linkMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim();
                        const pubDate = new Date(pubDateMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim());
                        const source = sourceMatch ? sourceMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : 'Google News';

                        // Simple Sentiment Keyword Check
                        const posKeys = ['폭등', '호재', '상승', 'bull', 'surge', 'rise'];
                        const negKeys = ['폭락', '악재', '하락', 'bear', 'crash', 'drop'];
                        let sentiment = 'neutral';
                        if (posKeys.some(k => title.toLowerCase().includes(k))) sentiment = 'positive';
                        if (negKeys.some(k => title.toLowerCase().includes(k))) sentiment = 'negative';

                        await supabase.from('news').upsert({
                            title,
                            link,
                            pub_date: pubDate.toISOString(),
                            source,
                            sentiment,
                            snippet: title,
                            symbol: target.symbol,
                            language: lang
                        }, { onConflict: 'link', ignoreDuplicates: true });
                        count++;
                    }
                }
                console.log(`  ✅ Synced News for ${target.symbol} (${lang})`);
            } catch (e) {
                // Ignore errors
            }
        }
    }
}

async function cleanup() {
    console.log('\n🧹 Starting Cleanup...');
    const now = new Date();

    // News 15 days
    const newsCutoff = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
    const { count: n } = await supabase.from('news').delete({ count: 'exact' }).lt('pub_date', newsCutoff.toISOString());
    console.log(`  🗑️ Deleted ${n} old news`);

    // Stocks 3 years
    const stockCutoff = Math.floor(now.getTime() / 1000) - 3 * 365 * 24 * 60 * 60;
    const { count: s } = await supabase.from('stock_candles').delete({ count: 'exact' }).lt('time', stockCutoff);
    console.log(`  🗑️ Deleted ${s} old stock candles`);

    // Market 3 years
    // market_prices uses YYYY-MM-DD string
    const marketCutoff = new Date(now.getTime() - 3 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const { count: m } = await supabase.from('market_prices').delete({ count: 'exact' }).lt('date', marketCutoff);
    console.log(`  🗑️ Deleted ${m} old market prices`);
}

async function run() {
    console.log('🚀 Daily Cron Started');
    await syncStocks();
    await syncCoins();
    await syncNews();
    await cleanup();
    console.log('🏁 Daily Cron Finished');
}

run();
