import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    const supabaseAuth = await createClient();

    // Check authentication
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user || user.email !== 'smartkdy7@gmail.com') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use Admin Client for database operations (bypass RLS)
    const supabase = createAdminClient();

    try {
        const body = await req.json();
        const limit = body.limit || 2000; // Default limit for market data
        const target = body.target || 'all'; // 'all', 'crypto', 'stock', 'news'

        const results: Record<string, { status: string; deleted: number; message?: string }> = {
            crypto: { status: 'skipped', deleted: 0 },
            stock: { status: 'skipped', deleted: 0 },
            news: { status: 'skipped', deleted: 0 }
        };

        // 1. Clean Crypto Data (market_prices)
        if (target === 'all' || target === 'crypto') {
            // SQL to keep only top N records per symbol
            // Note: Since Supabase Client doesn't support complex DELETE with subqueries easily via JS SDK,
            // we'll use rpc if available, or raw SQL if enabled, but safest is to fetch IDs to delete.
            // However, fetching IDs for ALL symbols might be heavy.
            // Best approach without raw SQL access is usually a stored procedure.
            // Assuming we don't have a stored proc, we'll try to do it symbol by symbol for safety in this script,
            // OR use a loop here similar to update scripts. Symbol-by-symbol is safer for timeouts.

            // Fetch all symbols first
            const { data: symbols } = await supabase.from('market_prices').select('symbol').not('symbol', 'is', null);
            // Distinct symbols
            const uniqueSymbols = Array.from(new Set(symbols?.map(s => s.symbol) || []));

            let totalDeleted = 0;

            for (const sym of uniqueSymbols) {
                // Get the Nth date boundary
                const { data: nthRow } = await supabase
                    .from('market_prices')
                    .select('date')
                    .eq('symbol', sym)
                    .order('date', { ascending: false })
                    .range(limit, limit) // Logic: Get the (limit+1)th item. Indexes are 0-based. so range(limit, limit) gets the item at index 'limit', which is the (limit+1)th newest.
                    .single();

                if (nthRow) {
                    // Delete everything older than this date
                    const { count } = await supabase
                        .from('market_prices')
                        .delete({ count: 'exact' })
                        .eq('symbol', sym)
                        .lt('date', nthRow.date);

                    if (count) totalDeleted += count;
                }
            }
            results.crypto = { status: 'success', deleted: totalDeleted };
        }

        // 2. Clean Stock Data (stock_prices)
        if (target === 'all' || target === 'stock') {
            const { data: symbols } = await supabase.from('stock_prices').select('symbol').not('symbol', 'is', null);
            const uniqueSymbols = Array.from(new Set(symbols?.map(s => s.symbol) || []));

            let totalDeleted = 0;

            for (const sym of uniqueSymbols) {
                // Stock prices usually use 'time' (unix timestamp) or 'date' depending on schema.
                // Based on `update-market-data.ts`, it uses `time` (number).

                const { data: nthRow } = await supabase
                    .from('stock_prices')
                    .select('time')
                    .eq('symbol', sym)
                    .order('time', { ascending: false })
                    .range(limit, limit)
                    .single();

                if (nthRow) {
                    const { count } = await supabase
                        .from('stock_prices')
                        .delete({ count: 'exact' })
                        .eq('symbol', sym)
                        .lt('time', nthRow.time);

                    if (count) totalDeleted += count;
                }
            }
            results.stock = { status: 'success', deleted: totalDeleted };
        }

        // 3. Clean News Data
        if (target === 'all' || target === 'news') {
            const newsLimit = 1000; // Updated limit for news (Global)

            // Global Cleanup logic:
            // Find the Nth newest record globally, based on pub_date
            const { data: nthRow } = await supabase
                .from('news')
                .select('pub_date')
                .order('pub_date', { ascending: false })
                .range(newsLimit, newsLimit) // Get the (1001)th record
                .single();

            if (nthRow) {
                // Delete everything older than this date globally
                const { count } = await supabase
                    .from('news')
                    .delete({ count: 'exact' })
                    .lt('pub_date', nthRow.pub_date);

                if (count) results.news = { status: 'success', deleted: count };
            } else {
                results.news = { status: 'success', deleted: 0, message: 'Not enough data to clean' };
            }
        }

        return NextResponse.json({ success: true, results });

    } catch (error: unknown) {
        console.error('Cleanup error:', error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
