
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config(); // Fallback to .env

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
if (!supabaseUrl || !supabaseKey) { console.error("❌ Missing Env Vars"); process.exit(1); }

console.log("Supabase URL:", supabaseUrl.substring(0, 20) + "...");

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

async function seedBCH() {
    console.log("🚀 Starting BCH Data Seeding...");

    try {
        // 0. Debug Check
        console.log("Checking existing schema with BTCUSDT...");
        const { data: btc, error: btcErr } = await supabase.from('market_prices').select('*').eq('symbol', 'BTCUSDT').limit(1);
        if (btcErr) {
            console.error("Failed to fetch BTC:", btcErr);
            return;
        }
        if (btc && btc.length > 0) {
            console.log("BTC Sample Keys:", Object.keys(btc[0]));
        } else {
            console.log("No BTC data found either??");
        }

        // 1. Fetch from Binance
        console.log("Fetching BCHUSDT klines from Binance...");
        const url = 'https://api.binance.com/api/v3/klines?symbol=BCHUSDT&interval=1d&limit=1000';
        const response = await fetch(url);
        const klines: any[] = await response.json();
        console.log(`Fetched ${klines.length} candles.`);

        // 2. Transform Data
        const records = klines.map((k: any[]) => ({
            symbol: 'BCHUSDT',
            date: new Date(k[0]).toISOString(), // Timestamp
            open: parseFloat(k[1]),
            high: parseFloat(k[2]),
            low: parseFloat(k[3]),
            close: parseFloat(k[4]),
            volume: parseFloat(k[5]),
            updated_at: new Date().toISOString()
        }));

        // 3. Insert without onConflict first to see if it works
        const { error } = await supabase.from('market_prices').insert(records.slice(0, 10)); // Try just 10

        if (error) {
            console.error(`Error inserting sample:`, error);
        } else {
            console.log(`Successfully inserted 10 records!`);
            // If successful, proceed with rest? Use loop if needed.
        }

    } catch (e) {
        console.error("Seeding Failed:", e);
    }
}

seedBCH();
