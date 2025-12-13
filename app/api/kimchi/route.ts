import { NextResponse } from 'next/server';

export async function GET() {
    // Common headers to mimic a browser
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
    };

    try {
        // 1. Fetch Exchange Rate (USD to KRW)
        let exchangeRate = 1450;
        try {
            const exRes = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
                next: { revalidate: 3600 },
                headers
            });
            if (exRes.ok) {
                const exData = await exRes.json();
                if (exData && exData.rates && exData.rates.KRW) {
                    exchangeRate = exData.rates.KRW;
                }
            }
        } catch (e) {
            console.error('Exchange rate fetch failed, using fallback');
        }

        // 2. Fetch Upbit Prices (KRW)
        const upbitSymbols = 'KRW-BTC,KRW-ETH,KRW-SOL,KRW-XRP,KRW-BCH,KRW-DOGE';
        const upbitRes = await fetch(`https://api.upbit.com/v1/ticker?markets=${upbitSymbols}`, {
            cache: 'no-store',
            headers
        });

        if (!upbitRes.ok) throw new Error(`Upbit API Failed: ${upbitRes.status}`);
        const upbitData = await upbitRes.json();

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
            const upbitItem = upbitData.find((item: any) => item.market === `KRW-${coin}`);
            const binanceItem = binanceData.find((item: any) => item.symbol === `${coin}USDT`);

            if (upbitItem && binanceItem) {
                const krwPrice = upbitItem.trade_price;
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

    } catch (error: any) {
        console.error('Kimchi API Error:', error);
        return NextResponse.json({
            error: 'Failed to fetch data',
            details: error.message
        }, { status: 500 });
    }
}
