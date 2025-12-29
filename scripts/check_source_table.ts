import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const CHECKS = [
    { table: 'stock_prices', symbol: 'BRK-B' },
    { table: 'stock_prices', symbol: 'LLY' },
    { table: 'stock_prices', symbol: 'AVGO' },
    { table: 'market_prices', symbol: 'BRK-B' }, // Verify availability here clearly
    { table: 'stock_prices', symbol: 'AAPL' }, // Control
];

async function checkData() {
    console.log("--- DATA CHECK START ---");

    for (const item of CHECKS) {
        const { data, error } = await supabase
            .from(item.table)
            .select('*') // Check all fields to see schema diff
            .eq('symbol', item.symbol)
            .limit(1);

        if (error) {
            console.error(`ERROR ${item.table} ${item.symbol}: ${error.message}`);
        } else if (data && data.length > 0) {
            console.log(`FOUND ${item.table} ${item.symbol}:`, JSON.stringify(data[0]));
        } else {
            console.log(`MISSING ${item.table} ${item.symbol}`);
        }
    }
    console.log("--- DATA CHECK END ---");
}

checkData();
