// app/api/analysis/stock/[symbol]/route.ts
// STOCK ANALYSIS API ENDPOINT ONLY
// Source: Supabase stock_prices (SSOT)
// Do NOT use Crypto functions
// BLOCKS external API usage - uses fetchStockSSOT only

import { NextRequest, NextResponse } from 'next/server';
import { fetchStockSSOT } from '@/lib/analysis/stock/fetchStockSSOT';
import { generateSignals } from '@/lib/analysis/signals';
import { analyzeStock } from '@/lib/analysis/stock';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ symbol: string }> }
) {
    const { symbol: rawSymbol } = await params;
    const symbol = rawSymbol.toUpperCase();
    const period = req.nextUrl.searchParams.get('period') || '1d';
    const userTier = (req.nextUrl.searchParams.get('tier') || 'free') as 'free' | 'pro';

    try {
        // 1. Fetch Stock Prices from Supabase (SSOT) - NO external API calls
        const result = await fetchStockSSOT({ symbol, limit: 365 });
        
        if (!result.success || !result.data) {
            return NextResponse.json(
                {
                    error: result.error || 'Failed to fetch stock data',
                    symbol,
                    dataPoints: 0
                },
                { status: 400 }
            );
        }

        const priceData = result.data;

        if (priceData.length < 50) {
            return NextResponse.json(
                {
                    error: 'Insufficient stock price data',
                    symbol,
                    dataPoints: priceData.length
                },
                { status: 400 }
            );
        }

        // 2. Generate Signals (from SSOT data only)
        const { signals, adxValue, bbWidth } = generateSignals(priceData);

        // 3. Analyze Stock
        const analysisResult = analyzeStock({
            symbol,
            period,
            signals,
            adxValue,
            bbWidth,
            userTier,
            dataSource: 'supabase',
            sampleSize: priceData.length
        });

        // 4. Response
        return NextResponse.json(
            {
                success: true,
                symbol,
                period,
                data: analysisResult,
                dataPoints: priceData.length,
                timestamp: new Date().toISOString()
            },
            {
                status: 200,
                headers: {
                    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
                }
            }
        );
    } catch (error) {
        console.error('[Stock Analysis API] Error:', error);
        return NextResponse.json(
            { error: 'Analysis failed', symbol },
            { status: 500 }
        );
    }
}