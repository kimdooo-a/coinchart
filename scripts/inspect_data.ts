import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function checkData() {
    console.log("Checking market_prices schema and data sample...");

    // Get 5 rows to see the 'date' format
    const { data, error } = await supabase
        .from('market_prices')
        .select('symbol, date, close')
        .eq('symbol', 'BTCUSDT')
        .limit(5);

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log("Sample Data (BTCUSDT):");
    console.table(data);
}

checkData();
