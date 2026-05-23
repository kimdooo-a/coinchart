
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(req.url);
        const queryParam = searchParams.get('query');
        const langParam = searchParams.get('lang'); // 'ko' or 'en' or 'ko,en'
        const categoryParam = searchParams.get('category'); // R1/T06: 'regulation' | 'tech' | ...
        const minImportanceParam = searchParams.get('minImportance'); // R1/T06: 1~10

        const pageParam = searchParams.get('page');
        const page = parseInt(pageParam || '0', 10);
        const pageSize = 20;
        const from = page * pageSize;
        const to = from + pageSize - 1;

        let dbQuery = supabase
            .from('news')
            .select('id, title, link, pub_date, source, sentiment, snippet, symbol, category, importance_score, sentiment_score, language, created_at')
            .order('pub_date', { ascending: false })
            .range(from, to);

        // Language Filter
        if (langParam && langParam !== 'ALL') {
            const languages = langParam.split(',');
            dbQuery = dbQuery.in('language', languages);
        }

        // R1/T06: Category Filter
        if (categoryParam && categoryParam !== 'ALL') {
            dbQuery = dbQuery.eq('category', categoryParam);
        }

        // R1/T06: 중요도 하한 Filter
        if (minImportanceParam) {
            const minImportance = parseInt(minImportanceParam, 10);
            if (Number.isFinite(minImportance) && minImportance >= 1 && minImportance <= 10) {
                dbQuery = dbQuery.gte('importance_score', minImportance);
            }
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

        // Transform to frontend format
        // R1/T06: category/importance_score/sentiment_score 추가 노출 (T15 메인 NewsRow 소비)
        const items = data.map(item => ({
            title: item.title,
            link: item.link,
            pubDate: item.pub_date,
            publisher: item.source,
            sentiment: item.sentiment,
            snippet: item.snippet,
            symbol: item.symbol,
            category: item.category,
            importance: item.importance_score,
            sentimentScore: item.sentiment_score,
        }));

        return NextResponse.json({ items });

    } catch (error) {
        console.error('DB News Fetch Error:', error);
        return NextResponse.json({ items: [] });
    }
}
