import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const SYMBOLS_TO_CHECK = [
    { table: 'market_prices', symbol: 'BCH' },
    { table: 'market_prices', symbol: 'BCHUSDT' },
    { table: 'stock_prices', symbol: 'BRK-B' },
    { table: 'stock_prices', symbol: 'LLY' },
    { table: 'stock_prices', symbol: 'AVGO' },
    { table: 'stock_prices', symbol: 'AAPL' }, // Control
];

async function checkData() {
    console.log("Checking latest dates...");

    for (const item of SYMBOLS_TO_CHECK) {
        const { data, error } = await supabase
            .from(item.table)
            .select('symbol, time')
            .eq('symbol', item.symbol)
            .order('time', { ascending: false })
            .limit(1);

        if (error) {
            console.error(`Error checking ${item.symbol}:`, error.message);
        } else if (data && data.length > 0) {
            const timeVal = data[0].time;
            const date = new Date(Number(timeVal) * 1000); // Assume unix seconds
            console.log(`Symbol: ${item.symbol} (${item.table}) - Latest: ${timeVal} (${date.toISOString()})`);
        } else {
            console.log(`Symbol: ${item.symbol} (${item.table}) - No Data`);
        }
    }
}

checkData();
