import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkDataCounts() {
    console.log('--- Checking News Counts ---');
    const { data: news } = await supabase.from('news').select('symbol');
    const newsCounts: Record<string, number> = {};
    news?.forEach(n => {
        const sym = n.symbol || 'NULL';
        newsCounts[sym] = (newsCounts[sym] || 0) + 1;
    });
    console.table(newsCounts);

    console.log('--- Checking Crypto Counts (Sample) ---');
    const { data: cryptoTypes } = await supabase.from('market_prices').select('symbol').limit(1000);
    const cryptoCounts: Record<string, number> = {};
    // This is just a sample lookup, might not be accurate for full DB if large
    // Better to use SQL count if possible, but client side grouping:

    // Fetch unique symbols to query specific counts
    const { data: symbols } = await supabase.from('market_prices').select('symbol').not('symbol', 'is', null);
    const uniqueSymbols = Array.from(new Set(symbols?.map(s => s.symbol) || []));

    for (const sym of uniqueSymbols.slice(0, 5)) { // Check first 5
        const { count } = await supabase.from('market_prices').select('*', { count: 'exact', head: true }).eq('symbol', sym);
        console.log(`Crypto ${sym}: ${count}`);
    }
}

checkDataCounts().catch(console.error);
