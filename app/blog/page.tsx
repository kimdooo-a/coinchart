import type { Metadata } from 'next';
import { fetchPublishedPosts, fetchCategories, fetchTags } from '@/lib/supabase/blog';
import BlogPageClient from './BlogPageClient';

export const metadata: Metadata = {
  title: '블로그',
  description: 'AI 기반 암호화폐/주식 시장 분석 인사이트와 트레이딩 전략을 공유하는 ChartMaster 블로그',
  openGraph: {
    title: '블로그',
    description: 'AI 기반 암호화폐/주식 시장 분석 인사이트와 트레이딩 전략',
    type: 'website',
  },
};

export default async function BlogPage() {
  const [{ posts, total }, categories, tags] = await Promise.all([
    fetchPublishedPosts({ limit: 12 }),
    fetchCategories(),
    fetchTags(),
  ]);

  return (
    <BlogPageClient
      initialPosts={posts}
      initialTotal={total}
      categories={categories}
      tags={tags}
    />
  );
}
