import type { Metadata } from 'next';
import { fetchCategoryBySlug, fetchPublishedPosts } from '@/lib/supabase/blog';
import CategoryPageClient from './CategoryPageClient';

interface Props {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: slug } = await params;
  const category = await fetchCategoryBySlug(slug);

  const name = category ? category.name_ko : slug;

  return {
    title: `${name} 카테고리`,
    description: `${name} 관련 블로그 포스트 모음`,
    openGraph: {
      title: `${name} 카테고리`,
      description: `${name} 관련 블로그 포스트 모음`,
      type: 'website',
    },
    alternates: {
      canonical: `/blog/category/${slug}`,
    },
  };
}

export default async function BlogCategoryPage({ params }: Props) {
  const { category: categorySlug } = await params;
  const [category, { posts, total }] = await Promise.all([
    fetchCategoryBySlug(categorySlug),
    fetchPublishedPosts({ category: categorySlug, limit: 12 }),
  ]);

  return (
    <CategoryPageClient
      categorySlug={categorySlug}
      category={category}
      initialPosts={posts}
      initialTotal={total}
    />
  );
}
