
import { createClient } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';
import { SUPPORTED_COINS, TOP_US_STOCKS } from '@/lib/constants';

export async function GET() {
    const supabase = createClient();

    try {
        const { data: { user } } = await supabase.auth.getUser();
        // Auth check logic omitted for demo as per previous implementation

        const prices = [];
        const now = new Date().toISOString();

        // 1. Crypto Update (All Supported Coins)
        try {
            // Fetch ALL prices from Binance once to save requests
            // Returns array: [{ symbol: 'BTCUSDT', price: '95000.00' }, ...]
            const binanceRes = await fetch('https://api.binance.com/api/v3/ticker/price', { next: { revalidate: 0 } });

            if (binanceRes.ok) {
                const allTickers = await binanceRes.json();

                // Create a Map for O(1) lookup
                const tickerMap = new Map<string, string>(allTickers.map((t: any) => [t.symbol, t.price]));

                for (const coin of SUPPORTED_COINS) {
                    const pair = `${coin.symbol}USDT`;
                    const priceStr = tickerMap.get(pair);

                    if (priceStr) {
                        prices.push({
                            symbol: coin.symbol, // Store as 'BTC', 'ETH' (not pair)
                            price: parseFloat(priceStr),
                            asset_type: 'CRYPTO',
                            recorded_at: now
                        });
                    }
                }
            } else {
                console.error("Binance Fetch Error:", binanceRes.statusText);
            }
        } catch (e) {
            console.error("Crypto Fetch Error", e);
        }

        // 2. Stock Update (All Supported Stocks)
        // Using Mock generator as requested/established, but applying to ALL stock constants
        const mockStock = (base: number) => {
            const variation = (Math.random() * 4 - 2) / 100; // +/- 2%
            return base * (1 + variation);
        };

        // Base prices for simulation (optional, or just random around 100-1000)
        // We can just use a hash of the symbol to get a "stable" random base if we wanted, 
        // to make it look realistic, or just randomized ranges.
        // Let's assume a generic base range for demo if specific bases aren't known, 
        // OR better: use a simple mapping for realism if possible.
        const basePrices: Record<string, number> = {
            'AAPL': 170, 'MSFT': 420, 'NVDA': 900, 'GOOGL': 175, 'AMZN': 180,
            'META': 480, 'TSLA': 175, 'BRK-B': 410, 'LLY': 780, 'AVGO': 1300
        };

        for (const stock of TOP_US_STOCKS) {
            const base = basePrices[stock.symbol] || 150; // Default 150 if new stock added
            prices.push({
                symbol: stock.symbol,
                price: mockStock(base),
                asset_type: 'STOCK',
                recorded_at: now
            });
        }


        // 3. Database Operations
        const results = {
            deleted: 0,
            inserted: 0,
            errors: [] as string[]
        };

        // 3.1 Cleanup Old Data (> 2000 days)
        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - 2000);

        const { error: deleteError, count: deleteCount } = await supabase
            .from('market_prices')
            .delete()
            .lt('recorded_at', dateLimit.toISOString());

        if (deleteError) results.errors.push(`Delete Error: ${deleteError.message}`);
        if (deleteCount !== null) results.deleted = deleteCount;


        // 3.2 Insert New Data
        const todayStart = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        for (const p of prices) {
            // Check existence (Prevent duplicate daily entry)
            const { data: existing } = await supabase
                .from('market_prices')
                .select('id')
                .eq('symbol', p.symbol)
                .gte('recorded_at', todayStart)
                .limit(1);

            if (existing && existing.length > 0) {
                continue; // Skip if already updated today
            }

            // Insert
            const { error: insertError } = await supabase
                .from('market_prices')
                .insert(p);

            if (insertError) {
                results.errors.push(`Insert Error (${p.symbol}): ${insertError.message}`);
            } else {
                results.inserted++;
            }
        }

        return NextResponse.json({
            success: true,
            data: prices,
            report: results
        });

    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
