'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { BlogPost } from '@/types/blog';
import { useLanguage } from '@/context/LanguageContext';

interface BlogRelatedPostsProps {
  posts: BlogPost[];
}

export default function BlogRelatedPosts({ posts }: BlogRelatedPostsProps) {
  const { lang } = useLanguage();

  if (posts.length === 0) return null;

  return (
    <div className="mt-16 pt-8 border-t border-outline-variant">
      <h3 className="text-xl font-bold text-on-surface mb-6">
        {lang === 'ko' ? '관련 글' : 'Related Posts'}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {posts.slice(0, 3).map((post) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className="group border border-outline-variant rounded-xl overflow-hidden bg-surface-container shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:bg-surface-container-high hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)] transition-all duration-300"
          >
            {post.featured_image && (
              <div className="relative aspect-[16/9] overflow-hidden">
                <Image
                  src={post.featured_image}
                  alt={post.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
            )}
            <div className="p-4">
              <h4 className="text-sm font-medium text-on-surface line-clamp-2 group-hover:text-primary transition-colors">
                {post.title}
              </h4>
              <span className="text-xs text-on-surface-variant mt-2 block">
                {post.published_at
                  ? new Date(post.published_at).toLocaleDateString()
                  : new Date(post.created_at).toLocaleDateString()}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
