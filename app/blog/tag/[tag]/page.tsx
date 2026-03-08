import type { Metadata } from 'next';
import { fetchTagBySlug, fetchPublishedPosts } from '@/lib/supabase/blog';
import TagPageClient from './TagPageClient';

interface Props {
  params: Promise<{ tag: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag: slug } = await params;
  const tag = await fetchTagBySlug(slug);

  const name = tag ? tag.name : decodeURIComponent(slug);

  return {
    title: `#${name} 태그`,
    description: `#${name} 태그가 붙은 블로그 포스트 모음`,
    openGraph: {
      title: `#${name} 태그`,
      description: `#${name} 태그가 붙은 블로그 포스트 모음`,
      type: 'website',
    },
    alternates: {
      canonical: `/blog/tag/${slug}`,
    },
  };
}

export default async function BlogTagPage({ params }: Props) {
  const { tag: tagSlug } = await params;
  const [tag, { posts, total }] = await Promise.all([
    fetchTagBySlug(tagSlug),
    fetchPublishedPosts({ tag: tagSlug, limit: 12 }),
  ]);

  const tagName = tag ? tag.name : decodeURIComponent(tagSlug);

  return (
    <TagPageClient
      tagSlug={tagSlug}
      tagName={tagName}
      initialPosts={posts}
      initialTotal={total}
    />
  );
}
