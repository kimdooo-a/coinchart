'use client';

import Link from 'next/link';
import type { BlogCategory, BlogTag, BlogPost } from '@/types/blog';
import { useLanguage } from '@/context/LanguageContext';

interface BlogSidebarProps {
  categories: BlogCategory[];
  tags: BlogTag[];
  recentPosts?: BlogPost[];
}

export default function BlogSidebar({ categories, tags, recentPosts }: BlogSidebarProps) {
  const { lang } = useLanguage();

  return (
    <aside className="space-y-8">
      {/* 카테고리 */}
      <div className="p-5 border border-white/10 rounded-xl bg-white/5">
        <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
          {lang === 'ko' ? '카테고리' : 'Categories'}
        </h3>
        <ul className="space-y-2">
          {categories.map((cat) => (
            <li key={cat.id}>
              <Link
                href={`/blog/category/${cat.slug}`}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors py-1"
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                {lang === 'ko' ? cat.name_ko : cat.name_en}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* 태그 */}
      {tags.length > 0 && (
        <div className="p-5 border border-white/10 rounded-xl bg-white/5">
          <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
            {lang === 'ko' ? '태그' : 'Tags'}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {tags.slice(0, 20).map((tag) => (
              <Link
                key={tag.id}
                href={`/blog/tag/${tag.slug}`}
                className="px-2.5 py-0.5 text-xs text-gray-400 bg-white/5 border border-white/10 rounded-full hover:text-white hover:border-white/20 transition-colors"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 최근 글 */}
      {recentPosts && recentPosts.length > 0 && (
        <div className="p-5 border border-white/10 rounded-xl bg-white/5">
          <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
            {lang === 'ko' ? '최근 글' : 'Recent Posts'}
          </h3>
          <ul className="space-y-3">
            {recentPosts.slice(0, 5).map((post) => (
              <li key={post.id}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="block text-sm text-gray-400 hover:text-white transition-colors line-clamp-2"
                >
                  {post.title}
                </Link>
                <span className="text-xs text-gray-600 mt-0.5 block">
                  {post.published_at
                    ? new Date(post.published_at).toLocaleDateString()
                    : new Date(post.created_at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
