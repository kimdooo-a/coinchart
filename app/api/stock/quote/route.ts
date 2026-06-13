
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const symbolParam = searchParams.get('symbol');
    // Normalize BRK-B to BRK.B for Twelve Data
    const symbol = symbolParam === 'BRK-B' ? 'BRK.B' : symbolParam;

    if (!symbol) {
        return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    const apiKey = process.env.TWELVEDATA_API_KEY;

    if (!apiKey) {
        console.error('TWELVEDATA_API_KEY is not set');
        // Return a 500 but obscure the reason for security or just say config error
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    try {
        const res = await fetch(
            `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${apiKey}`,
            { next: { revalidate: 60 } } // Cache for 60 seconds
        );

        // R9/T04: 게이트웨이성 5xx 응답 = API 다운 → 503
        if (res.status >= 500) {
            console.error('Twelve Data upstream 5xx:', res.status);
            return NextResponse.json({ error: 'Stock data service unavailable' }, { status: 503 });
        }

        const data = await res.json();

        if (data.status === 'error') {
            console.error('Twelve Data Error:', data.code, data.message);
            // R9/T04: "심볼 없음" vs "API 다운"을 구분.
            // 판별 기준: data.code(TwelveData 에러 코드) 또는 data.message 패턴.
            const code = typeof data.code === 'number' ? data.code : undefined;
            const message = typeof data.message === 'string' ? data.message : '';

            // 심볼 없음/잘못된 심볼 → 404
            if (code === 404 || /not found|symbol|no data/i.test(message)) {
                return NextResponse.json(data, { status: 404 });
            }
            // TwelveData 측 서버 오류(5xx) → 503
            if (code !== undefined && code >= 500) {
                return NextResponse.json(data, { status: 503 });
            }
            // 그 외 잘못된 요청 → 기존 400 유지
            return NextResponse.json(data, { status: 400 });
        }

        return NextResponse.json(data);
    } catch (error) {
        // R9/T04: 네트워크 예외/타임아웃/JSON 파싱 실패 = API 다운 → 503
        console.error('Stock Quote Proxy Error:', error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 503 });
    }
}
