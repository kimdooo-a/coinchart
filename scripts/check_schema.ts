import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function checkSchema() {
    // Select one row and inspect keys
    const { data, error } = await supabase
        .from('market_prices')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error:", error);
    } else if (data && data.length > 0) {
        console.log("market_prices keys:", Object.keys(data[0]));
        console.log("Sample:", data[0]);
    } else {
        console.log("No data in market_prices");
    }
}

checkSchema();
