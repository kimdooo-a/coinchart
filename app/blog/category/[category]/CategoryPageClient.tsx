'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { TRANSLATIONS } from '@/lib/translations';
import BlogPostList from '@/components/Blog/BlogPostList';
import type { BlogPost, BlogCategory } from '@/types/blog';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface CategoryPageClientProps {
  categorySlug: string;
  category: BlogCategory | null;
  initialPosts: BlogPost[];
  initialTotal: number;
}

export default function CategoryPageClient({
  categorySlug,
  category,
  initialPosts,
  initialTotal,
}: CategoryPageClientProps) {
  const { lang } = useLanguage();
  const t = TRANSLATIONS[lang];

  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const limit = 12;

  // 페이지 변경 시 클라이언트 fetch
  useEffect(() => {
    if (page === 1) {
      setPosts(initialPosts);
      setTotal(initialTotal);
      return;
    }

    let cancelled = false;
    const loadPosts = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/blog?page=${page}&limit=${limit}&category=${categorySlug}`
        );
        if (res.ok && !cancelled) {
          const data = await res.json();
          setPosts(data.posts || []);
          setTotal(data.total || 0);
        }
      } catch (err) {
        console.error('포스트 로딩 실패:', err);
      }
      if (!cancelled) setLoading(false);
    };
    loadPosts();
    return () => { cancelled = true; };
  }, [page, categorySlug, initialPosts, initialTotal]);

  const categoryName = category
    ? lang === 'ko'
      ? category.name_ko
      : category.name_en
    : categorySlug;

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface">
      <div className="container mx-auto px-4 pt-24 pb-12">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.blog.backToBlog}
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            {category && (
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: category.color }}
              />
            )}
            <h1 className="text-3xl font-bold">{categoryName}</h1>
          </div>
          <p className="text-on-surface-variant">
            {total} {lang === 'ko' ? '개의 글' : 'posts'}
          </p>
        </div>

        <BlogPostList
          posts={posts}
          total={total}
          page={page}
          limit={limit}
          onPageChange={setPage}
          loading={loading}
        />
      </div>
    </div>
  );
}
