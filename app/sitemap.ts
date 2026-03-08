import type { MetadataRoute } from 'next';
import { fetchPublishedPosts } from '@/lib/supabase/blog';
import { getSiteUrl } from '@/lib/blog-utils';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();

  // 정적 페이지
  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${siteUrl}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${siteUrl}/news`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.7 },
    { url: `${siteUrl}/market-mood`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.7 },
    { url: `${siteUrl}/stock`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${siteUrl}/signal`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.6 },
    { url: `${siteUrl}/calendar`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.5 },
  ];

  // 블로그 포스트 (동적)
  try {
    const { posts } = await fetchPublishedPosts({ limit: 100 });
    const blogPages: MetadataRoute.Sitemap = posts.map((post) => ({
      url: `${siteUrl}/blog/${post.slug}`,
      lastModified: new Date(post.updated_at || post.published_at || post.created_at),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

    return [...staticPages, ...blogPages];
  } catch {
    return staticPages;
  }
}
