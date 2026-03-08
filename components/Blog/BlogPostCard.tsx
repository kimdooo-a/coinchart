'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Calendar, Eye, Clock } from 'lucide-react';
import { calculateReadingTime } from '@/lib/blog-utils';
import type { BlogPost } from '@/types/blog';
import { useLanguage } from '@/context/LanguageContext';

interface BlogPostCardProps {
  post: BlogPost;
  index?: number;
}

export default function BlogPostCard({ post, index = 0 }: BlogPostCardProps) {
  const { lang } = useLanguage();

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link
        href={`/blog/${post.slug}`}
        className="group flex flex-col h-full border border-white/10 rounded-xl overflow-hidden bg-white/5 shadow-[0_2px_8px_rgba(0,0,0,0.3)] hover:bg-white/10 hover:border-white/20 hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)] transition-all duration-300"
      >
        {/* 대표 이미지 */}
        {post.featured_image && (
          <div className="relative aspect-[16/9] overflow-hidden">
            <Image
              src={post.featured_image}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}

        <div className="p-5 flex flex-col flex-1">
          {/* 카테고리 뱃지 */}
          {post.category && (
            <span
              className="inline-block px-2.5 py-0.5 text-xs font-medium rounded-full mb-3"
              style={{
                backgroundColor: `${post.category.color}20`,
                color: post.category.color,
                border: `1px solid ${post.category.color}30`,
              }}
            >
              {lang === 'ko' ? post.category.name_ko : post.category.name_en}
            </span>
          )}

          {/* 제목 */}
          <h2 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {post.title}
          </h2>

          {/* 요약 */}
          {post.excerpt && (
            <p className="text-sm text-gray-400 mb-4 line-clamp-2">
              {post.excerpt}
            </p>
          )}

          {/* 메타 정보 */}
          <div className="flex items-center gap-4 text-xs text-gray-500 mt-auto">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {post.published_at
                ? new Date(post.published_at).toLocaleDateString()
                : new Date(post.created_at).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {calculateReadingTime(post.content, lang as 'ko' | 'en')}{lang === 'ko' ? '분' : ' min'}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {post.view_count.toLocaleString()}
            </span>
          </div>

          {/* 태그 */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {post.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag.id}
                  className="px-2 py-0.5 text-xs text-gray-400 bg-white/5 border border-white/10 rounded-full"
                >
                  #{tag.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </motion.article>
  );
}
