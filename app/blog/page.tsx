'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { TRANSLATIONS } from '@/lib/translations';
import BlogPostList from '@/components/Blog/BlogPostList';
import BlogCategoryFilter from '@/components/Blog/BlogCategoryFilter';
import BlogSearchBar from '@/components/Blog/BlogSearchBar';
import BlogSidebar from '@/components/Blog/BlogSidebar';
import type { BlogPost, BlogCategory, BlogTag } from '@/types/blog';

export default function BlogPage() {
  const { lang } = useLanguage();
  const t = TRANSLATIONS[lang];

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const limit = 12;

  // 카테고리/태그 로딩
  useEffect(() => {
    Promise.all([
      fetch('/api/blog/categories').then((r) => r.json()),
      fetch('/api/blog/tags').then((r) => r.json()),
    ]).then(([catData, tagData]) => {
      setCategories(catData.categories || []);
      setTags(tagData.tags || []);
    });
  }, []);

  // 포스트 로딩
  useEffect(() => {
    let cancelled = false;
    const loadPosts = async () => {
      setLoading(true);
      try {
        let url: string;

        if (searchQuery.trim()) {
          url = `/api/blog/search?q=${encodeURIComponent(searchQuery)}&page=${page}&limit=${limit}`;
        } else {
          url = `/api/blog?page=${page}&limit=${limit}`;
          if (selectedCategory) url += `&category=${selectedCategory}`;
        }

        const res = await fetch(url);
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
  }, [page, selectedCategory, searchQuery]);

  const handleCategoryChange = (slug: string | null) => {
    setSelectedCategory(slug);
    setPage(1);
    setSearchQuery('');
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1);
    setSelectedCategory(null);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 pt-24 pb-12">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-3">{t.blog.title}</h1>
          <p className="text-gray-400 text-lg">{t.blog.subtitle}</p>
        </div>

        {/* 검색 + 필터 */}
        <div className="mb-8 space-y-4">
          <div className="max-w-md mx-auto">
            <BlogSearchBar onSearch={handleSearch} initialQuery={searchQuery} />
          </div>
          <BlogCategoryFilter
            categories={categories}
            selected={selectedCategory}
            onSelect={handleCategoryChange}
          />
        </div>

        {/* 컨텐츠 영역 */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
          <BlogPostList
            posts={posts}
            total={total}
            page={page}
            limit={limit}
            onPageChange={setPage}
            loading={loading}
          />
          <div className="hidden lg:block">
            <BlogSidebar
              categories={categories}
              tags={tags}
              recentPosts={posts.slice(0, 5)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
