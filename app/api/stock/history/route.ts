import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
// Using admin here for simplicity, but public client is fine too since we have Public Select policy.
// Admin is strictly faster/easier to setup without auth headers context.

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get('symbol');
    const interval = searchParams.get('interval'); // '1d' or '1w'

    if (!symbol || !interval) {
        return NextResponse.json({ error: 'Symbol and interval required' }, { status: 400 });
    }

    try {
        const { data, error } = await supabaseAdmin
            .from('stock_candles')
            .select('time, open, high, low, close, volume')
            .eq('symbol', symbol)
            .eq('interval', interval)
            .order('time', { ascending: true });

        if (error) throw error;

        return NextResponse.json({ values: data });
    } catch (err) {
        console.error('DB Fetch Error:', err);
        return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }
}
