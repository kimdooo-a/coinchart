import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing Supabase credentials in .env.local')
    process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

// Symbols to seed
const CRYPTO_SYMBOLS = ['BTC-USD', 'ETH-USD', 'XRP-USD', 'SOL-USD', 'DOGE-USD', 'ADA-USD']
const STOCK_SYMBOLS = ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'TSLA', 'SPY', 'QQQ']

// Helper to fetch from Yahoo Finance
async function fetchYahooData(symbol: string) {
    console.log(`Fetching ${symbol} from Yahoo Finance...`)
    // Fetch 1 year of daily data
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1y`
    try {
        const res = await fetch(url)
        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
        const data = await res.json()

        const result = data.chart?.result?.[0]
        if (!result) return null

        const timestamps = result.timestamp
        const quote = result.indicators.quote[0]

        if (!timestamps || !quote) return null

        const cleanData = timestamps.map((ts: number, i: number) => ({
            timestamp: ts,
            dateStr: new Date(ts * 1000).toISOString().split('T')[0],
            open: quote.open[i],
            high: quote.high[i],
            low: quote.low[i],
            close: quote.close[i],
            volume: quote.volume[i]
        })).filter((d: any) => d.close !== null && d.close !== undefined)

        return cleanData
    } catch (e) {
        console.error(`Failed to fetch ${symbol}:`, e)
        return null
    }
}

async function seed() {
    console.log('--- Starting Seed Process ---')

    // 1. Process Cryptos -> 'market_prices' table
    console.log('\n[Processing Crypto]')
    for (const yahooSymbol of CRYPTO_SYMBOLS) {
        const rawData = await fetchYahooData(yahooSymbol)
        if (!rawData) continue

        // Symbol mapping (BTC-USD -> BTCUSDT for consistency with Binance/App usage)
        const appSymbol = yahooSymbol.replace('-USD', 'USDT')

        const dbRows = rawData.map((d: any) => ({
            symbol: appSymbol,
            date: d.dateStr, // market_prices uses 'date' column (YYYY-MM-DD)
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close,
            volume: d.volume,
            type: 'CRYPTO'
        }))

        const { error } = await supabase.from('market_prices').upsert(dbRows, { onConflict: 'symbol,date' })
        if (error) console.error(`Error inserting ${appSymbol}:`, error.message)
        else console.log(`✓ Inserted/Updated ${dbRows.length} rows for ${appSymbol}`)

        await new Promise(r => setTimeout(r, 500)) // Rate limit politeness
    }

    // 2. Process Stocks -> 'stock_prices' table
    console.log('\n[Processing Stocks]')
    for (const symbol of STOCK_SYMBOLS) {
        const rawData = await fetchYahooData(symbol)
        if (!rawData) continue

        const dbRows = rawData.map((d: any) => ({
            symbol: symbol,
            time: d.timestamp, // stock_prices uses 'time' column (Unix seconds)
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close,
            volume: d.volume,
            currency: 'USD',
            source: 'yahoo_seed'
        }))

        const { error } = await supabase.from('stock_prices').upsert(dbRows, { onConflict: 'symbol,time' })
        if (error) {
            console.error(`Error inserting ${symbol}:`, error.message)
            // Error handling: if table doesn't exist, user needs to run migration
            if (error.code === '42P01') {
                console.error('!!! Table stock_prices does not exist. Please run migration script.')
                process.exit(1)
            }
        }
        else console.log(`✓ Inserted/Updated ${dbRows.length} rows for ${symbol}`)

        await new Promise(r => setTimeout(r, 500))
    }

    console.log('\n--- Seed Completed ---')
}

seed().catch(console.error)
