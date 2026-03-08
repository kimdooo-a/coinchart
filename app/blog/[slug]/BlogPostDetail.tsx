'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Calendar, Eye } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import BlogPostContent from '@/components/Blog/BlogPostContent';
import BlogTagBadge from '@/components/Blog/BlogTagBadge';
import BlogShareButtons from '@/components/Blog/BlogShareButtons';
import BlogRelatedPosts from '@/components/Blog/BlogRelatedPosts';
import BlogTableOfContents from '@/components/Blog/BlogTableOfContents';
import type { BlogPost } from '@/types/blog';

interface BlogPostDetailProps {
  post: BlogPost;
  relatedPosts: BlogPost[];
}

export default function BlogPostDetail({ post, relatedPosts }: BlogPostDetailProps) {
  const { lang } = useLanguage();

  // 조회수 증가
  useEffect(() => {
    fetch(`/api/blog/view/${post.id}`, { method: 'POST' });
  }, [post.id]);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 pt-24 pb-12">
        {/* 뒤로 가기 */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {lang === 'ko' ? '블로그로 돌아가기' : 'Back to Blog'}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-12">
          {/* 메인 */}
          <article className="max-w-3xl">
            {/* 카테고리 */}
            {post.category && (
              <Link
                href={`/blog/category/${post.category.slug}`}
                className="inline-block px-3 py-1 text-xs font-medium rounded-full mb-4"
                style={{
                  backgroundColor: `${post.category.color}20`,
                  color: post.category.color,
                  border: `1px solid ${post.category.color}30`,
                }}
              >
                {lang === 'ko' ? post.category.name_ko : post.category.name_en}
              </Link>
            )}

            {/* 제목 */}
            <h1 className="text-3xl sm:text-4xl font-bold mb-4 leading-tight">
              {post.title}
            </h1>

            {/* 메타 */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-8">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {post.published_at
                  ? new Date(post.published_at).toLocaleDateString()
                  : new Date(post.created_at).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                {post.view_count.toLocaleString()} {lang === 'ko' ? '조회' : 'views'}
              </span>
            </div>

            {/* 대표 이미지 */}
            {post.featured_image && (
              <div className="relative aspect-[16/9] rounded-xl overflow-hidden border border-white/10 mb-8">
                <Image
                  src={post.featured_image}
                  alt={post.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 800px"
                />
              </div>
            )}

            {/* 본문 */}
            <BlogPostContent content={post.content} />

            {/* 태그 */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-8 pt-8 border-t border-white/10">
                {post.tags.map((tag) => (
                  <BlogTagBadge key={tag.id} tag={tag} />
                ))}
              </div>
            )}

            {/* 공유 */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <BlogShareButtons title={post.title} slug={post.slug} />
            </div>

            {/* 관련 글 */}
            <BlogRelatedPosts posts={relatedPosts} />
          </article>

          {/* 사이드바: 목차 */}
          <div className="hidden lg:block">
            <BlogTableOfContents content={post.content} />
          </div>
        </div>
      </div>
    </div>
  );
}
