import { NextResponse } from 'next/server';

// 마지막으로 성공한 USD/KRW 환율을 모듈 캐시에 보관 → 외부 API 실패 시 고정값 대신 최신값 폴백.
// 서버리스 인스턴스 생존 동안 유효(콜드스타트 시 DEFAULT_RATE로 초기화).
const DEFAULT_RATE = 1450;
let lastKnownRate = DEFAULT_RATE;

export async function GET() {
    // Common headers to mimic a browser
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
    };

    try {
        // 1. Fetch Exchange Rate (USD to KRW) — 실패 시 마지막 성공값(lastKnownRate) 폴백
        let exchangeRate = lastKnownRate;
        try {
            const exRes = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
                next: { revalidate: 3600 },
                headers
            });
            if (exRes.ok) {
                const exData = await exRes.json();
                if (exData && exData.rates && typeof exData.rates.KRW === 'number' && exData.rates.KRW > 0) {
                    exchangeRate = exData.rates.KRW;
                    lastKnownRate = exData.rates.KRW; // 성공값 캐시 갱신
                }
            }
        } catch {
            console.error(`Exchange rate fetch failed, using last known rate: ${lastKnownRate}`);
        }

        // 2. Fetch Bithumb Prices (KRW)
        const bithumbRes = await fetch('https://api.bithumb.com/public/ticker/ALL_KRW', {
            cache: 'no-store',
            headers
        });

        if (!bithumbRes.ok) throw new Error(`Bithumb API Failed: ${bithumbRes.status}`);
        const bithumbJson = await bithumbRes.json();
        const bithumbData = bithumbJson.data;

        // 3. Fetch Binance Prices (USDT)
        const binanceSymbols = '["BTCUSDT","ETHUSDT","SOLUSDT","XRPUSDT","BCHUSDT","DOGEUSDT"]';
        const binanceRes = await fetch(`https://api.binance.com/api/v3/ticker/price?symbols=${binanceSymbols}`, {
            cache: 'no-store',
            headers
        });

        if (!binanceRes.ok) throw new Error(`Binance API Failed: ${binanceRes.status}`);
        const binanceData = await binanceRes.json();

        // 4. Combine Data
        const results = [];
        const coins = ['BTC', 'ETH', 'SOL', 'XRP', 'BCH', 'DOGE'];

        for (const coin of coins) {
            const bithumbItem = bithumbData[coin];
            // Bithumb Item Structure: { opening_price, closing_price, min_price, max_price, ... }

            const binanceItem = binanceData.find((item: { symbol: string; price: string }) => item.symbol === `${coin}USDT`);

            if (bithumbItem && binanceItem) {
                const krwPrice = parseFloat(bithumbItem.closing_price); // Bithumb returns string
                const usdPrice = parseFloat(binanceItem.price);
                const globalKrwPrice = usdPrice * exchangeRate;

                const premium = ((krwPrice - globalKrwPrice) / globalKrwPrice) * 100;

                results.push({
                    symbol: coin,
                    krwPrice,
                    usdPrice,
                    premium: parseFloat(premium.toFixed(2)),
                    exchangeRate
                });
            }
        }

        return NextResponse.json({
            data: results,
            timestamp: new Date().toISOString(),
            exchangeRate
        });

    } catch (error: unknown) {
        console.error('Kimchi API Error:', error);
        return NextResponse.json({
            error: 'Failed to fetch data',
            details: (error as Error).message
        }, { status: 500 });
    }
}
