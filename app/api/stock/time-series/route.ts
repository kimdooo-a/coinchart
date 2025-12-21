
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const symbolParam = searchParams.get('symbol');
    // Normalize BRK-B to BRK.B for DB query
    const symbol = symbolParam === 'BRK-B' ? 'BRK.B' : symbolParam;
    const intervalParam = searchParams.get('interval') || '1day';
    const outputsize = parseInt(searchParams.get('outputsize') || '365');

    if (!symbol) {
        return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    // Map TwelveData interval style to DB style
    // API receives: 1day, 1week (from lib/api/twelvedata.ts)
    // DB stores: 1d, 1w
    let dbInterval = '1d';
    if (intervalParam === '1week' || intervalParam === '1w') dbInterval = '1w';
    else if (intervalParam === '1day' || intervalParam === '1d') dbInterval = '1d';
    else {
        // Fallback for other intervals if we ever support them, though DB currently only has 1d/1w
        // If it's something else, we might not have it in DB.
        // For now, default to 1d or return error?
        // Let's assume 1d if unknown, or allow it to pass if we expand DB later.
        if (intervalParam.includes('min') || intervalParam.includes('h')) {
            return NextResponse.json({ values: [] }); // Not supported in DB yet
        }
    }

    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('stock_candles')
            .select('*')
            .eq('symbol', symbol)
            .eq('interval', dbInterval)
            .order('time', { ascending: false })
            .limit(outputsize);

        if (error) {
            console.error('Supabase Stock Fetch Error:', error);
            throw error;
        }

        // Transform to Twelve Data format
        // DB time is Unix seconds. Frontend implementation (StockChart.tsx via getTwelveDataTimeSeries)
        // expects: datetime (string YYYY-MM-DD or similar), open, high, low, close, volume
        // Actually getTwelveDataTimeSeries maps datetime to Date object.
        // twelve-data response: { values: [ { datetime: "2023-01-01", open: "100.00", ... } ] }

        const values = (data || []).map(row => {
            // Convert unix timestamp to YYYY-MM-DD string for consistency with what the frontend parser expects
            const dateObj = new Date(row.time * 1000);
            const dateStr = dateObj.toISOString().split('T')[0];

            return {
                datetime: dateStr,
                open: row.open.toString(),
                high: row.high.toString(),
                low: row.low.toString(),
                close: row.close.toString(),
                volume: row.volume.toString()
            };
        });

        // If DB is empty, strictly speaking we return empty.
        // The cron job is responsible for population.

        return NextResponse.json({
            meta: {
                symbol,
                interval: intervalParam,
                currency: "USD",
                timezone: "America/New_York",
                type: "Common Stock"
            },
            values: values,
            status: "ok"
        });

    } catch (error) {
        console.error('Stock TimeSeries Error:', error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}
