import { fetchPublishedPosts } from '@/lib/supabase/blog';
import { getSiteUrl } from '@/lib/blog-utils';

export async function GET() {
  const siteUrl = getSiteUrl();
  const { posts } = await fetchPublishedPosts({ limit: 50 });

  const items = posts
    .map((post) => {
      const pubDate = post.published_at || post.created_at;
      const link = `${siteUrl}/blog/${post.slug}`;
      const categoryTag = post.category
        ? `<category>${escapeXml(post.category.name_en)}</category>`
        : '';

      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${new Date(pubDate).toUTCString()}</pubDate>
      <description>${escapeXml(post.excerpt || '')}</description>
      ${categoryTag}
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>ChartMaster Blog</title>
    <link>${siteUrl}/blog</link>
    <description>투자 인사이트와 시장 분석</description>
    <language>ko</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
