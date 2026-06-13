import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/supabase/admin-guard';
import { SUPPORTED_COINS, TOP_US_STOCKS } from '@/lib/constants';
import { fetchStockPrices } from '@/lib/supabase/stock';

export const dynamic = 'force-dynamic';

export async function GET() {
    // 관리자 권한 검증 (공통 SSOT)
    const gate = await requireAdmin();
    if (!gate.ok) return gate.res;

    // service_role 클라이언트로 DB 작업 (RLS 우회). 기존 브라우저 anon 클라(@/lib/supabase/client)는
    // API 라우트에서 쿠키 세션을 못 읽어 인증·DB write 모두 실패하던 잠재 버그였음 — 정상화.
    const supabase = createAdminClient();

    try {
        const prices = [];
        const now = new Date().toISOString();

        // 1. Crypto Update (All Supported Coins)
        try {
            // Fetch ALL prices from Binance once to save requests
            // Returns array: [{ symbol: 'BTCUSDT', price: '95000.00' }, ...]
            const binanceRes = await fetch('https://api.binance.com/api/v3/ticker/price', { next: { revalidate: 0 } });

            if (binanceRes.ok) {
                const allTickers = await binanceRes.json();

                // Create a Map for O(1) lookup
                const tickerMap = new Map<string, string>(allTickers.map((t: { symbol: string; price: string }) => [t.symbol, t.price]));

                for (const coin of SUPPORTED_COINS) {
                    const pair = `${coin.symbol}USDT`;
                    const priceStr = tickerMap.get(pair);

                    if (priceStr) {
                        prices.push({
                            symbol: coin.symbol, // Store as 'BTC', 'ETH' (not pair)
                            price: parseFloat(priceStr),
                            asset_type: 'CRYPTO',
                            recorded_at: now
                        });
                    }
                }
            } else {
                console.error("Binance Fetch Error:", binanceRes.statusText);
            }
        } catch (e) {
            console.error("Crypto Fetch Error", e);
        }

        // 2. Stock Update (All Supported Stocks)
        // stock_prices 테이블(SSOT)에서 각 종목의 최신 종가를 조회하여 반환
        // 조회 실패 또는 빈 결과이면 기존 mock 값으로 fallback하여 데이터 깨짐 방지
        const mockStock = (base: number) => {
            const variation = (Math.random() * 4 - 2) / 100; // +/- 2%
            return base * (1 + variation);
        };

        // fallback 기준 가격 (stock_prices 조회 실패 시 사용)
        const basePrices: Record<string, number> = {
            'AAPL': 170, 'MSFT': 420, 'NVDA': 900, 'GOOGL': 175, 'AMZN': 180,
            'META': 480, 'TSLA': 175, 'BRK-B': 410, 'LLY': 780, 'AVGO': 1300
        };

        for (const stock of TOP_US_STOCKS) {
            let stockPrice: number | null = null;

            // stock_prices 테이블에서 최신 종가 조회 (SSOT: lib/supabase/stock.ts)
            try {
                const stockData = await fetchStockPrices(stock.symbol, 1);
                if (stockData && stockData.length > 0) {
                    stockPrice = stockData[stockData.length - 1].close;
                }
            } catch (e) {
                console.error(`[market-data] stock_prices 조회 오류 (${stock.symbol}):`, e);
            }

            // 실제 데이터 없으면 mock fallback
            if (stockPrice === null || stockPrice <= 0) {
                const base = basePrices[stock.symbol] || 150;
                stockPrice = mockStock(base);
            }

            prices.push({
                symbol: stock.symbol,
                price: stockPrice,
                asset_type: 'STOCK',
                recorded_at: now
            });
        }


        // 3. Database Operations
        const results = {
            deleted: 0,
            inserted: 0,
            errors: [] as string[]
        };

        // 3.1 Cleanup Old Data (> 2000 days)
        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - 2000);

        const { error: deleteError, count: deleteCount } = await supabase
            .from('market_prices')
            .delete()
            .lt('recorded_at', dateLimit.toISOString());

        if (deleteError) results.errors.push(`Delete Error: ${deleteError.message}`);
        if (deleteCount !== null) results.deleted = deleteCount;


        // 3.2 Insert New Data
        const todayStart = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        for (const p of prices) {
            // Check existence (Prevent duplicate daily entry)
            const { data: existing } = await supabase
                .from('market_prices')
                .select('id')
                .eq('symbol', p.symbol)
                .gte('recorded_at', todayStart)
                .limit(1);

            if (existing && existing.length > 0) {
                continue; // Skip if already updated today
            }

            // Insert
            const { error: insertError } = await supabase
                .from('market_prices')
                .insert(p);

            if (insertError) {
                results.errors.push(`Insert Error (${p.symbol}): ${insertError.message}`);
            } else {
                results.inserted++;
            }
        }

        return NextResponse.json({
            success: true,
            data: prices,
            report: results
        });

    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
