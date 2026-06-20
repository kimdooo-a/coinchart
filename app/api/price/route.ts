
import { NextRequest, NextResponse } from 'next/server';
import { fetchBinanceTickers } from '@/lib/supabase/crypto';

export const dynamic = 'force-dynamic';

// 실시간 단일 심볼 가격. crypto SSOT(lib/supabase/crypto.ts)의 fetchBinanceTickers를 경유한다
// (Binance 직접 인라인 호출 금지 — SSOT 단일 외부접근 chokepoint·60s 캐시 공유). 응답 shape는
// 기존 Binance ticker/price와 동일하게 { symbol, price } 유지(호출부 무수정).
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol');

    if (!symbol) {
        return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    const pair = `${symbol.toUpperCase()}USDT`;

    try {
        const [ticker] = await fetchBinanceTickers([pair]);
        if (!ticker || !Number.isFinite(ticker.price)) {
            return NextResponse.json({ error: 'Price not available' }, { status: 404 });
        }
        return NextResponse.json({ symbol: pair, price: String(ticker.price) });
    } catch (error) {
        console.error('Price Fetch Error:', error);
        return NextResponse.json({ error: 'Failed to fetch price' }, { status: 500 });
    }
}
