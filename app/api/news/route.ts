
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(req.url);
        const queryParam = searchParams.get('query');
        const langParam = searchParams.get('lang'); // 'ko' or 'en' or 'ko,en'

        let dbQuery = supabase
            .from('news')
            .select('*')
            .order('pub_date', { ascending: false })
            .limit(30);

        // Language Filter
        if (langParam && langParam !== 'ALL') {
            const languages = langParam.split(',');
            dbQuery = dbQuery.in('language', languages);
        }

        // Coin/Symbol Filter
        if (queryParam && queryParam !== 'ALL') {
            // Check if query is a clear Symbol (e.g. BTC, AAPL)
            // The crawler stores exact symbols in 'symbol' column
            // So we can try matching that first for efficiency
            dbQuery = dbQuery.or(`symbol.eq.${queryParam},title.ilike.%${queryParam}%,snippet.ilike.%${queryParam}%`);
        }

        const { data, error } = await dbQuery;

        if (error) throw error;

        // Transform to frontend format if needed (DB columns match frontend expectation mostly)
        const items = data.map(item => ({
            title: item.title,
            link: item.link,
            pubDate: item.pub_date,
            publisher: item.source,
            sentiment: item.sentiment,
            snippet: item.snippet
        }));

        return NextResponse.json({ items });

    } catch (error) {
        console.error('DB News Fetch Error:', error);
        return NextResponse.json({ items: [] });
    }
}
