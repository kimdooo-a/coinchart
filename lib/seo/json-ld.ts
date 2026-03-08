import type { BlogPost } from '@/types/blog';
import { getSiteUrl } from '@/lib/blog-utils';

/**
 * Article JSON-LD 구조화 데이터 생성
 */
export function generateArticleJsonLd(post: BlogPost) {
  const siteUrl = getSiteUrl();

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.meta_title || post.title,
    description: post.meta_description || post.excerpt || '',
    image: post.featured_image ? [post.featured_image] : [],
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at || post.published_at || post.created_at,
    url: `${siteUrl}/blog/${post.slug}`,
    publisher: {
      '@type': 'Organization',
      name: 'ChartMaster',
      url: siteUrl,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteUrl}/blog/${post.slug}`,
    },
  };
}

/**
 * BreadcrumbList JSON-LD 구조화 데이터 생성
 */
export function generateBreadcrumbJsonLd(
  items: { name: string; url: string }[]
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * WebSite JSON-LD 구조화 데이터 생성 (전역용)
 */
export function generateWebsiteJsonLd() {
  const siteUrl = getSiteUrl();

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'ChartMaster',
    url: siteUrl,
    description: 'AI 기반 암호화폐/주식 시장 분석 플랫폼',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/blog?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}
