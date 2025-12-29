import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol');
    const limit = parseInt(searchParams.get('limit') || '365', 10);

    if (!symbol) {
        return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    try {
        let { data, error } = await supabaseAdmin
            .from('stock_prices')
            .select('time, open, high, low, close, volume, symbol, currency, source')
            .eq('symbol', symbol.toUpperCase())
            .order('time', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('[Stock API] Supabase Error (stock_prices):', error);
            throw new Error(error.message);
        }

        // Fallback to market_prices if no data found in stock_prices
        // This handles cases where stocks like BRK-B, LLY, AVGO are stored in market_prices
        if (!data || data.length === 0) {
            console.log(`[Stock API] No data in stock_prices for ${symbol}, checking market_prices...`);
            const { data: marketData, error: marketError } = await supabaseAdmin
                .from('market_prices')
                .select('date, open, high, low, close, volume, symbol')
                .eq('symbol', symbol.toUpperCase())
                .order('date', { ascending: false })
                .limit(limit);

            if (marketError) {
                console.error('[Stock API] Supabase Error (market_prices):', marketError);
            } else if (marketData && marketData.length > 0) {
                // Map market_prices (date based) to stock_prices format (time based)
                data = marketData.map(d => ({
                    ...d,
                    // Convert date string/timestamp to unix seconds for the chart
                    time: d.date ? Math.floor(new Date(d.date).getTime() / 1000) : 0,
                    currency: 'USD',
                    source: 'market_prices_fallback'
                }));
            }
        }

        if (!data) {
            return NextResponse.json([]);
        }

        // Format and sort ascending
        const formatted = data
            .map((d: any) => ({
                time: Number(d.time), // Ensure number
                open: Number(d.open),
                high: Number(d.high),
                low: Number(d.low),
                close: Number(d.close),
                volume: Number(d.volume),
            }))
            .sort((a, b) => a.time - b.time);

        return NextResponse.json(formatted, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
            },
        });
    } catch (error) {
        console.error('[Stock API] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch stock history' },
            { status: 500 }
        );
    }
}
