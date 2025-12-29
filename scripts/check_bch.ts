
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBCH() {
    console.log("Checking BCHUSDT...");
    const { data, error } = await supabase
        .from('market_prices')
        .select('*')
        .eq('symbol', 'BCHUSDT')
        .limit(5);

    if (error) {
        console.error("Error:", error);
    } else {
        console.log(`Found ${data.length} records for BCHUSDT`);
        if (data.length > 0) {
            console.log("Sample:", data[0]);
        }
    }
}

checkBCH();
