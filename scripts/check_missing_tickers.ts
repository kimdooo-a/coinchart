import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const SYMBOLS_TO_CHECK = [
    'BCHUSDT', // Coin
    'BCH',     // Coin variant
    'BRK-B',   // Stock
    'BRK.B',   // Stock variant
    'LLY',     // Stock
    'AVGO'     // Stock
];

async function checkData() {
    console.log("Checking for missing tickers...");

    for (const symbol of SYMBOLS_TO_CHECK) {
        const { data, error, count } = await supabase
            .from('market_prices')
            .select('symbol', { count: 'exact', head: true })
            .eq('symbol', symbol);

        if (error) {
            console.error(`Error checking ${symbol}:`, error.message);
        } else {
            console.log(`Symbol: ${symbol} - Count: ${count}`);
        }
    }
}

checkData();
