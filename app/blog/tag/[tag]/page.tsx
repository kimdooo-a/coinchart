'use client';

import { useState, useEffect, use } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { TRANSLATIONS } from '@/lib/translations';
import BlogPostList from '@/components/Blog/BlogPostList';
import type { BlogPost } from '@/types/blog';
import { ArrowLeft, Hash } from 'lucide-react';
import Link from 'next/link';

export default function BlogTagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag: tagSlug } = use(params);
  const { lang } = useLanguage();
  const t = TRANSLATIONS[lang];

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const limit = 12;

  useEffect(() => {
    let cancelled = false;
    const loadPosts = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/blog?page=${page}&limit=${limit}&tag=${tagSlug}`
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
  }, [page, tagSlug]);

  const tagName = decodeURIComponent(tagSlug);

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
          <div className="flex items-center gap-2 mb-2">
            <Hash className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-bold">{tagName}</h1>
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
