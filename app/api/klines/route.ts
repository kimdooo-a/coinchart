import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';


/**
 * Binance getKlines 프록시 API Route
 * STEP 4-4B: TTL 캐시로 Binance 호출 최소화
 * 
 * 캐시 전략:
 * - Next.js fetch cache 사용 (revalidate: 60초)
 * - 동일한 symbol/interval 조합은 60초간 캐시
 * - 클라이언트에서 직접 Binance 호출 대신 이 API 사용
 */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol');
    const interval = searchParams.get('interval') || '1d';
    const limit = parseInt(searchParams.get('limit') || '990', 10);

    if (!symbol) {
        return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    try {
        // Fetch from Supabase (SSOT)
        const { data, error } = await supabaseAdmin
            .from('market_prices')
            .select('date, open, high, low, close, volume')
            .eq('symbol', symbol.toUpperCase())
            .order('date', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Supabase Fetch Error:', error);
            throw new Error(error.message);
        }

        if (!data) {
            return NextResponse.json([]);
        }

        // Format for Chart (Sort Ascending based on time)
        // market_prices date is likely ISO string or timestamp. 
        // We need to return the format the frontend expects.
        // Frontend (AnalysisPage) expects: `data` array which it maps:
        // `d.time` (seconds) -> new Date(d.time * 1000)
        // But previously route returned: { time: seconds, ... }
        // The previous route mapped Binance data: time: d[0] / 1000 (seconds)

        const formatted = data
            .map((d: any) => ({
                time: new Date(d.date).getTime() / 1000,
                open: Number(d.open),
                high: Number(d.high),
                low: Number(d.low),
                close: Number(d.close),
                volume: Number(d.volume),
            }))
            .sort((a: any, b: any) => a.time - b.time);

        return NextResponse.json(formatted, {
            headers: {
                'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=59',
            },
        });
    } catch (error) {
        console.error('Klines API Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch klines' },
            { status: 500 }
        );
    }
}

