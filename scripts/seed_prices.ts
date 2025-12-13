import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing Supabase credentials in .env.local')
    process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const COINS = ['BTC-USD', 'ETH-USD', 'XRP-USD', 'SOL-USD', 'BCH-USD', 'DOGE-USD']
const STOCKS = ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'TSLA', 'BRK-B', 'LLY', 'AVGO']
const FOREX = ['KRW=X'] // USD to KRW

async function fetchYahooData(symbol: string, type: 'CRYPTO' | 'STOCK' | 'FOREX') {
    console.log(`Fetching data for ${symbol}...`)
    try {
        // Fetch 3 years of 1-day interval data
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=3y`
        const res = await fetch(url)
        const data = await res.json()

        if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
            console.error(`No data found for ${symbol}`)
            return null
        }

        const result = data.chart.result[0]
        const timestamps = result.timestamp
        const quote = result.indicators.quote[0]

        if (!timestamps || !quote) return null

        const prices = timestamps.map((ts: number, i: number) => ({
            symbol: symbol.replace('-USD', '').replace('=X', ''), // Clean symbol
            date: new Date(ts * 1000).toISOString().split('T')[0],
            open: quote.open[i],
            high: quote.high[i],
            low: quote.low[i],
            close: quote.close[i],
            volume: quote.volume[i],
            type: type
        })).filter((p: any) => p.close !== null)

        return prices
    } catch (error) {
        console.error(`Error fetching ${symbol}:`, error)
        return null
    }
}

async function seed() {
    console.log('Starting seed process...')

    // 1. Process Coins
    for (const coin of COINS) {
        const data = await fetchYahooData(coin, 'CRYPTO')
        if (data) {
            const { error } = await supabase.from('market_prices').upsert(data, { onConflict: 'symbol,date' })
            if (error) console.error(`Error inserting ${coin}:`, error.message)
            else console.log(`Inserted ${data.length} rows for ${coin}`)
        }
        await new Promise(r => setTimeout(r, 1000))
    }

    // 2. Process Stocks
    for (const stock of STOCKS) {
        const data = await fetchYahooData(stock, 'STOCK')
        if (data) {
            const { error } = await supabase.from('market_prices').upsert(data, { onConflict: 'symbol,date' })
            if (error) console.error(`Error inserting ${stock}:`, error.message)
            else console.log(`Inserted ${data.length} rows for ${stock}`)
        }
        await new Promise(r => setTimeout(r, 1000))
    }

    // 3. Process Forex
    for (const pair of FOREX) {
        const data = await fetchYahooData(pair, 'FOREX')
        if (data) {
            const { error } = await supabase.from('market_prices').upsert(data, { onConflict: 'symbol,date' })
            if (error) console.error(`Error inserting ${pair}:`, error.message)
            else console.log(`Inserted ${data.length} rows for ${pair}`)
        }
        await new Promise(r => setTimeout(r, 1000))
    }

    console.log('Seed completed!')
}

seed()
