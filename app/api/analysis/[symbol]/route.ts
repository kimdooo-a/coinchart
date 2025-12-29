import { NextResponse } from 'next/server';
import { analyzeMarket } from '@/lib/analysis';
import { getCache, setCache } from '@/lib/cache/supabase-kv';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * 서버 사이드 분석 API
 * 
 * 클라이언트에서 무거운 지표 계산을 서버로 이동
 * - 캐싱 레이어 적용 (TTL: 5분)
 * - Supabase에서 데이터 로드
 * - 분석 결과 반환
 */

export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    const decodedSymbol = decodeURIComponent(symbol);
    const { searchParams } = new URL(request.url);
    const interval = searchParams.get('interval') || '1d';
    const lang = searchParams.get('lang') || 'ko';

    // 캐시 키 생성
    const cacheKey = `analysis:${symbol}:${interval}:${lang}`;

    // 1. 캐시 체크
    const cached = await getCache<any>(cacheKey);
    if (cached) {
      return NextResponse.json({
        ...cached,
        fromCache: true,
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      });
    }

    // 2. Supabase에서 데이터 로드
    const { data: prices, error: priceError } = await supabaseAdmin
      .from('market_prices')
      .select('date, open, high, low, close, volume')
      .eq('symbol', symbol)
      .order('date', { ascending: false })
      .limit(990);

    if (priceError) {
      console.error('Supabase fetch error:', priceError);
      return NextResponse.json(
        { error: 'Failed to fetch market data' },
        { status: 500 }
      );
    }

    if (!prices || prices.length < 60) {
      return NextResponse.json(
        { error: 'Insufficient data' },
        { status: 400 }
      );
    }

    // 3. 데이터 포맷팅
    const candles = prices
      .map(p => ({
        time: p.date,
        open: p.open,
        high: p.high,
        low: p.low,
        close: p.close,
        volume: p.volume,
      }))
      .reverse();

    // 4. 분석 실행
    const analysis = analyzeMarket(candles, {
      lang: lang as 'ko' | 'en',
      minCandles: 60,
      horizonBars: 3,
    });

    // 5. 캐싱 (TTL: 5분)
    await setCache(cacheKey, analysis, 300);

    return NextResponse.json({
      ...analysis,
      fromCache: false,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Analysis API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

