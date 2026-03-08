'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { TRANSLATIONS } from '@/lib/translations';
import type { BlogPost } from '@/types/blog';
import { Plus, Edit, Trash2, Eye, EyeOff, ArrowLeft } from 'lucide-react';

export default function AdminBlogPage() {
  const { lang } = useLanguage();
  const t = TRANSLATIONS[lang];
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email === 'smartkdy7@gmail.com') {
        setAuthorized(true);
        // 인증 확인 후 포스트 로딩
        setLoading(true);
        try {
          const res = await fetch('/api/blog?limit=100');
          if (res.ok) {
            const data = await res.json();
            setPosts(data.posts || []);
          }
        } catch (err) {
          console.error('포스트 로딩 실패:', err);
        }
        setLoading(false);
      }
      setChecking(false);
    };
    checkAuth();
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`"${title}" 포스트를 삭제하시겠습니까?`)) return;

    try {
      const res = await fetch(`/api/blog/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert('삭제 실패');
      }
    } catch {
      alert('삭제 중 오류 발생');
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-gray-400">{t.admin.checking}</p>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">{t.admin.accessDenied}</h1>
          <p className="text-gray-400">{t.admin.accessDeniedMsg}</p>
        </div>
      </div>
    );
  }

  const statusBadge = (status: string) => {
    const colors = {
      published: 'bg-green-500/20 text-green-400 border-green-500/30',
      draft: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      archived: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };
    const labels = {
      published: lang === 'ko' ? '발행' : 'Published',
      draft: lang === 'ko' ? '초안' : 'Draft',
      archived: lang === 'ko' ? '보관' : 'Archived',
    };
    return (
      <span className={`px-2 py-0.5 text-xs rounded-full border ${colors[status as keyof typeof colors] || colors.draft}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 pt-24 pb-12">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold">
              {lang === 'ko' ? '블로그 관리' : 'Blog Management'}
            </h1>
          </div>
          <Link
            href="/admin/blog/new"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {lang === 'ko' ? '새 글 작성' : 'New Post'}
          </Link>
        </div>

        {/* 테이블 */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">
            {t.common.loading}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">
              {lang === 'ko' ? '아직 작성된 포스트가 없습니다.' : 'No posts yet.'}
            </p>
            <Link
              href="/admin/blog/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {lang === 'ko' ? '첫 글 작성하기' : 'Write your first post'}
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">
                    {lang === 'ko' ? '제목' : 'Title'}
                  </th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">
                    {lang === 'ko' ? '상태' : 'Status'}
                  </th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">
                    {lang === 'ko' ? '카테고리' : 'Category'}
                  </th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">
                    {lang === 'ko' ? '조회수' : 'Views'}
                  </th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">
                    {lang === 'ko' ? '작성일' : 'Created'}
                  </th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">
                    {lang === 'ko' ? '작업' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr
                    key={post.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {post.status === 'published' ? (
                          <Eye className="w-4 h-4 text-green-400 shrink-0" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-gray-500 shrink-0" />
                        )}
                        <span className="font-medium truncate max-w-[300px]">
                          {post.title}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">{statusBadge(post.status)}</td>
                    <td className="py-3 px-4 text-gray-400">
                      {post.category
                        ? lang === 'ko'
                          ? post.category.name_ko
                          : post.category.name_en
                        : '-'}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-400">
                      {post.view_count.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-gray-400">
                      {new Date(post.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 justify-end">
                        <Link
                          href={`/admin/blog/edit/${post.id}`}
                          className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                          title={lang === 'ko' ? '수정' : 'Edit'}
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(post.id, post.title)}
                          className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title={lang === 'ko' ? '삭제' : 'Delete'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
