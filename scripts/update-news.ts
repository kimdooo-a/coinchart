import Parser from 'rss-parser';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const parser = new Parser();

const RSS_FEEDS = [
    { url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', source: 'CoinDesk', type: 'crypto' },
    { url: 'https://cointelegraph.com/rss', source: 'CoinTelegraph', type: 'crypto' },
    { url: 'https://finance.yahoo.com/news/rssindex', source: 'Yahoo Finance', type: 'general' }
];

async function fetchAndProcessNews() {
    console.log('--- Starting News Update ---');
    let totalInserted = 0;

    for (const feed of RSS_FEEDS) {
        try {
            console.log(`Fetching ${feed.source}...`);
            const feedData = await parser.parseURL(feed.url);

            const items = feedData.items.map(item => ({
                title: item.title || 'No Title',
                link: item.link || '',
                pub_date: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
                source: feed.source,
                guid: item.guid || item.link || item.title, // Use GUID or fallback
                snippet: item.contentSnippet || item.content || '',
                language: 'en', // Default to English for these feeds
                image_url: item.enclosure?.url || null,
                category: feed.type
            }));

            // Deduplicate and Insert
            // We use 'link' or 'guid' as unique key. 
            // supabase 'news' table should have a unique constraint on 'link' or similar.
            // If not, we might need to check existence first or use upsert with ON CONFLICT.

            // Assuming 'link' is unique in DB schema. If not, this might duplicate unless constraint exists.
            // Let's try upserting on 'link' if it's the constraint, otherwise we do a manual check.
            // Based on previous analysis, we'll try upsert.

            for (const newsItem of items) {
                // Determine sentiment (mock/random for now, or simple keyword analysis)
                // In a real app, you'd use an NLP API here.
                const sentiment = analyzeSentiment(newsItem.title + ' ' + newsItem.snippet);

                const dbRow = {
                    title: newsItem.title,
                    link: newsItem.link,
                    pub_date: newsItem.pub_date,
                    source: newsItem.source,
                    snippet: newsItem.snippet.substring(0, 500), // Limit length
                    language: newsItem.language,
                    sentiment: sentiment,
                    symbol: 'ALL' // Default
                };

                const { error } = await supabase
                    .from('news')
                    .upsert(dbRow, { onConflict: 'link' }); // UNIQUE(link) assumed

                if (error) {
                    // console.error(`Failed to insert ${newsItem.title}: ${error.message}`);
                    // Often "duplicate key" if constraint exists and upsert not configured right or just skip
                } else {
                    totalInserted++;
                }
            }
        } catch (error) {
            console.error(`Error processing feed ${feed.url}:`, error);
        }
    }

    console.log(`--- News Update Completed. Inserted/Updated: ${totalInserted} items ---`);
}

function analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const lowerText = text.toLowerCase();
    const positiveWords = ['surge', 'jump', 'bull', 'gain', 'high', 'record', 'soar', 'up', 'growth', 'profit'];
    const negativeWords = ['crash', 'drop', 'bear', 'loss', 'low', 'down', 'plunge', 'fall', 'fail', 'concern'];

    let score = 0;
    positiveWords.forEach(w => { if (lowerText.includes(w)) score++; });
    negativeWords.forEach(w => { if (lowerText.includes(w)) score--; });

    if (score > 0) return 'positive';
    if (score < 0) return 'negative';
    return 'neutral';
}

fetchAndProcessNews().catch(console.error);
