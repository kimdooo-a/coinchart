'use client';

import { useState, useEffect, use } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { TRANSLATIONS } from '@/lib/translations';
import BlogPostList from '@/components/Blog/BlogPostList';
import type { BlogPost, BlogCategory } from '@/types/blog';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function BlogCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: categorySlug } = use(params);
  const { lang } = useLanguage();
  const t = TRANSLATIONS[lang];

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<BlogCategory | null>(null);

  const limit = 12;

  // 카테고리 정보 로딩
  useEffect(() => {
    fetch('/api/blog/categories')
      .then((r) => r.json())
      .then((data) => {
        const cat = (data.categories || []).find(
          (c: BlogCategory) => c.slug === categorySlug
        );
        setCategory(cat || null);
      });
  }, [categorySlug]);

  // 포스트 로딩
  useEffect(() => {
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
  }, [page, categorySlug]);

  const categoryName = category
    ? lang === 'ko'
      ? category.name_ko
      : category.name_en
    : categorySlug;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 pt-24 pb-12">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-8"
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
          <p className="text-gray-400">
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
