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

            const binanceItem = binanceData.find((item: any) => item.symbol === `${coin}USDT`);

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

    } catch (error: any) {
        console.error('Kimchi API Error:', error);
        return NextResponse.json({
            error: 'Failed to fetch data',
            details: error.message
        }, { status: 500 });
    }
}
