import { createAdminClient } from '@/lib/supabase/admin';
import { classify } from '@/lib/news/classifier';
import { requireAdmin } from '@/lib/supabase/admin-guard';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    // 관리자 권한 검증 (공통 SSOT)
    const gate = await requireAdmin();
    if (!gate.ok) return gate.res;

    const { searchParams } = new URL(req.url);
    const lang = searchParams.get('lang') || 'ko';

    try {
        const supabase = createAdminClient();

        // 1. Fetch RSS from Google News
        // Queries: "Generic Crypto + specific coins"
        // Multilanguage support
        const query = lang === 'ko'
            ? '암호화폐 OR 비트코인 OR 이더리움 OR 리플 OR 솔라나 OR 주식시장'
            : 'Cryptocurrency OR Bitcoin OR Ethereum OR XRP OR Solana OR Stock Market';

        const hl = lang === 'ko' ? 'ko' : 'en-US';
        const gl = lang === 'ko' ? 'KR' : 'US';
        const ceid = lang === 'ko' ? 'KR:ko' : 'US:en';

        const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=${hl}&gl=${gl}&ceid=${ceid}`;

        const res = await fetch(rssUrl);
        const xmlText = await res.text();

        // 2. Parse XML (Simple regex parser for RSS items to avoid dependency issues)
        //    파싱 직후 classify() 호출하여 4차원(coin/category/sentiment/importance) 분류 결과를 함께 적재.
        const items: Array<{
            title: string;
            link: string;
            pub_date: string;
            source: string;
            snippet: string;
            language: string;
            sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
            symbol: string;
            category: string;
            importance_score: number;
            sentiment_score: number;
        }> = [];
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match;

        while ((match = itemRegex.exec(xmlText)) !== null) {
            const itemContent = match[1];
            const titleMatch = itemContent.match(/<title>(.*?)<\/title>/);
            const linkMatch = itemContent.match(/<link>(.*?)<\/link>/);
            const pubDateMatch = itemContent.match(/<pubDate>(.*?)<\/pubDate>/);
            const sourceMatch = itemContent.match(/<source url=".*?">(.*?)<\/source>/);

            if (titleMatch && linkMatch) {
                const title = titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '');
                const pub_date = pubDateMatch ? new Date(pubDateMatch[1]).toISOString() : new Date().toISOString();
                const source = sourceMatch ? sourceMatch[1] : 'Google News';
                const snippet = title; // RSS에 description 없음 → 일단 title 재사용

                // ── R1/T06: 룰베이스 분류 (T05 산출물) ─────────────────────
                const result = classify({
                    title,
                    snippet,
                    source,
                    pubDate: pub_date,
                });

                items.push({
                    title,
                    link: linkMatch[1],
                    pub_date,
                    source,
                    snippet,
                    language: lang,
                    // classifier 결과로 덮어쓰기 (스키마 enum과 1:1 일치)
                    sentiment: result.sentiment,
                    // coinTag "ALL" → DB 기본값 'ALL' 유지
                    symbol: result.coinTag,
                    category: result.category,
                    importance_score: result.importance,
                    sentiment_score: result.sentimentScore,
                });
            }
        }

        const report = {
            total_fetched: items.length,
            inserted: 0,
            errors: [] as string[]
        };

        // 3. Deduplicate & Insert
        // Check duplication by Link
        for (const item of items) {
            // Check existence
            const { data: existing } = await supabase
                .from('news')
                .select('id')
                .eq('link', item.link)
                .limit(1);

            if (!existing || existing.length === 0) {
                const { error } = await supabase.from('news').insert(item);
                if (error) {
                    report.errors.push(error.message);
                } else {
                    report.inserted++;
                }
            }
        }

        return NextResponse.json({
            success: true,
            report,
            sample_items: items.slice(0, 3)
        });

    } catch (e) {
        return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
    }
}
