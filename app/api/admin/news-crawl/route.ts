import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    // Basic auth check
    // In real app, verify user.ID or role
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
        const items = [];
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match;

        while ((match = itemRegex.exec(xmlText)) !== null) {
            const itemContent = match[1];
            const titleMatch = itemContent.match(/<title>(.*?)<\/title>/);
            const linkMatch = itemContent.match(/<link>(.*?)<\/link>/);
            const pubDateMatch = itemContent.match(/<pubDate>(.*?)<\/pubDate>/);
            const sourceMatch = itemContent.match(/<source url=".*?">(.*?)<\/source>/);

            if (titleMatch && linkMatch) {
                items.push({
                    title: titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, ''), // Clean CDATA
                    link: linkMatch[1],
                    pub_date: pubDateMatch ? new Date(pubDateMatch[1]).toISOString() : new Date().toISOString(),
                    source: sourceMatch ? sourceMatch[1] : 'Google News',
                    snippet: titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, ''), // Use title as snippet for now
                    language: lang,
                    sentiment: 'neutral', // Default, placeholder for AI
                    symbol: 'GENERAL' // Default tag
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
                // Determine symbol tag based on content
                let symbol = 'GENERAL';
                const lowerTitle = item.title.toLowerCase();
                if (lowerTitle.includes('bitcoin') || lowerTitle.includes('btc') || lowerTitle.includes('비트코인')) symbol = 'BTC';
                else if (lowerTitle.includes('ethereum') || lowerTitle.includes('eth') || lowerTitle.includes('이더리움')) symbol = 'ETH';
                else if (lowerTitle.includes('xrp') || lowerTitle.includes('ripple') || lowerTitle.includes('리플')) symbol = 'XRP';
                else if (lowerTitle.includes('solana') || lowerTitle.includes('sol') || lowerTitle.includes('솔라나')) symbol = 'SOL';
                else if (lowerTitle.includes('stock') || lowerTitle.includes('sp500') || lowerTitle.includes('주식')) symbol = 'STOCK';

                item.symbol = symbol;

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
