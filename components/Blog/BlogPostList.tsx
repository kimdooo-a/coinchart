'use client';

import BlogPostCard from './BlogPostCard';
import type { BlogPost } from '@/types/blog';
import { useLanguage } from '@/context/LanguageContext';

interface BlogPostListProps {
  posts: BlogPost[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

export default function BlogPostList({
  posts,
  total,
  page,
  limit,
  onPageChange,
  loading = false,
}: BlogPostListProps) {
  const { lang } = useLanguage();
  const totalPages = Math.ceil(total / limit);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="border border-outline-variant rounded-xl overflow-hidden bg-surface-container animate-pulse"
          >
            <div className="aspect-[16/9] bg-surface-container-high" />
            <div className="p-5 space-y-3">
              <div className="h-4 w-20 bg-surface-container-high rounded" />
              <div className="h-5 w-3/4 bg-surface-container-high rounded" />
              <div className="h-4 w-full bg-surface-container-high rounded" />
              <div className="h-3 w-1/3 bg-surface-container-high rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-on-surface-variant text-lg">
          {lang === 'ko' ? '게시된 글이 없습니다.' : 'No posts found.'}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post, index) => (
          <BlogPostCard key={post.id} post={post} index={index} />
        ))}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-12">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="px-4 py-2 text-sm border border-outline-variant rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {lang === 'ko' ? '이전' : 'Prev'}
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
            .map((p, i, arr) => {
              const showDots = i > 0 && arr[i - 1] !== p - 1;
              return (
                <span key={p} className="flex items-center gap-2">
                  {showDots && <span className="text-on-surface-variant">...</span>}
                  <button
                    onClick={() => onPageChange(p)}
                    className={`w-10 h-10 text-sm rounded-lg transition-colors ${
                      p === page
                        ? 'bg-primary text-on-primary'
                        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                    }`}
                  >
                    {p}
                  </button>
                </span>
              );
            })}

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="px-4 py-2 text-sm border border-outline-variant rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {lang === 'ko' ? '다음' : 'Next'}
          </button>
        </div>
      )}
    </div>
  );
}
