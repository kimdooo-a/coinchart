import { notFound } from 'next/navigation';
import { fetchPostBySlug, fetchPublishedPosts } from '@/lib/supabase/blog';
import type { BlogPost } from '@/types/blog';
import type { Metadata } from 'next';
import BlogPostDetail from './BlogPostDetail';

interface Props {
  params: Promise<{ slug: string }>;
}

// 동적 메타데이터 (SEO)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchPostBySlug(slug);

  if (!post) {
    return { title: 'Post Not Found' };
  }

  const title = post.meta_title || post.title;
  const description = post.meta_description || post.excerpt || '';

  return {
    title: `${title} | ChartMaster Blog`,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: post.published_at || post.created_at,
      images: post.featured_image ? [{ url: post.featured_image }] : [],
    },
    twitter: {
      card: post.featured_image ? 'summary_large_image' : 'summary',
      title,
      description,
      images: post.featured_image ? [post.featured_image] : [],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await fetchPostBySlug(slug);

  if (!post) {
    notFound();
  }

  // 관련 글 (같은 카테고리)
  let relatedPosts: BlogPost[] = [];
  if (post.category_id) {
    const { posts } = await fetchPublishedPosts({
      category: post.category?.slug,
      limit: 4,
    });
    relatedPosts = posts.filter((p) => p.id !== post.id).slice(0, 3);
  }

  return <BlogPostDetail post={post} relatedPosts={relatedPosts} />;
}
