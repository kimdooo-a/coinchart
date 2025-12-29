import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function check() {
    const { count: cryptoCount, error: cryptoError } = await supabase
        .from('market_prices')
        .select('*', { count: 'exact', head: true })

    if (cryptoError) console.error('Crypto Check Error:', cryptoError.message)
    else console.log(`Crypto Rows (market_prices): ${cryptoCount}`)

    const { count: stockCount, error: stockError } = await supabase
        .from('stock_prices')
        .select('*', { count: 'exact', head: true })

    if (stockError) console.error('Stock Check Error:', stockError.message)
    else console.log(`Stock Rows (stock_prices): ${stockCount}`)
}

check()
