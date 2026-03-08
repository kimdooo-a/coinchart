'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/context/LanguageContext';
import { TRANSLATIONS } from '@/lib/translations';
import BlogEditor from '@/components/Blog/editor/BlogEditor';
import { useAutoSave } from '@/components/Blog/editor/hooks/useAutoSave';
import type { BlogCategory, BlogPost } from '@/types/blog';
import { ArrowLeft, Save, Send, Archive } from 'lucide-react';
import Link from 'next/link';

export default function AdminBlogEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { lang } = useLanguage();
  const t = TRANSLATIONS[lang];
  const router = useRouter();

  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [categories, setCategories] = useState<BlogCategory[]>([]);

  // 폼 상태
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [tagsInput, setTagsInput] = useState('');
  const [language, setLanguage] = useState<'ko' | 'en'>('ko');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');

  // 자동저장
  const { lastSaved, clearAutoSave } = useAutoSave({
    postId: id,
    title,
    content,
    excerpt,
    onRestore: useCallback((data: { title: string; content: string; excerpt: string }) => {
      setTitle(data.title);
      setContent(data.content);
      setExcerpt(data.excerpt);
    }, []),
  });

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email === 'smartkdy7@gmail.com') {
        setAuthorized(true);
        // 포스트 로딩
        try {
          const res = await fetch(`/api/blog/${id}`);
          if (res.ok) {
            const data = await res.json();
            const p: BlogPost = data.post;
            setPost(p);
            setTitle(p.title);
            setSlug(p.slug);
            setContent(typeof p.content === 'string' ? p.content : '');
            setExcerpt(p.excerpt || '');
            setCategoryId(p.category_id || '');
            setTagsInput(p.tags?.map((tag) => tag.name).join(', ') || '');
            setLanguage(p.language);
            setMetaTitle(p.meta_title || '');
            setMetaDescription(p.meta_description || '');
          } else {
            alert('포스트를 찾을 수 없습니다.');
            router.push('/admin/blog');
          }
        } catch {
          alert('포스트 로딩 실패');
        }
      }
      setChecking(false);
    };
    const loadCategories = async () => {
      try {
        const res = await fetch('/api/blog/categories');
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || []);
        }
      } catch (err) {
        console.error('카테고리 로딩 실패:', err);
      }
    };
    checkAuth();
    loadCategories();
  }, [id, router]);

  const handleSave = async (status?: 'draft' | 'published' | 'archived') => {
    if (!title.trim()) {
      alert(lang === 'ko' ? '제목을 입력해주세요.' : 'Please enter a title.');
      return;
    }

    setSaving(true);
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const body: Record<string, unknown> = {
        title,
        slug,
        content,
        excerpt: excerpt || undefined,
        category_id: categoryId || null,
        tags,
        language,
        meta_title: metaTitle || undefined,
        meta_description: metaDescription || undefined,
      };

      if (status) {
        body.status = status;
      }

      const res = await fetch(`/api/blog/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        clearAutoSave();
        router.push('/admin/blog');
      } else {
        const err = await res.json();
        alert(err.error || '저장 실패');
      }
    } catch {
      alert('저장 중 오류 발생');
    }
    setSaving(false);
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

  if (!post) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-gray-400">{t.common.loading}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 pt-24 pb-12">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin/blog" className="text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold">
              {lang === 'ko' ? '글 수정' : 'Edit Post'}
            </h1>
            {lastSaved && (
              <span className="text-xs text-gray-500">
                자동저장됨 {lastSaved.toLocaleTimeString('ko-KR')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {post.status === 'published' && (
              <button
                onClick={() => handleSave('archived')}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 border border-orange-500/30 text-orange-400 rounded-lg hover:bg-orange-500/10 transition-colors disabled:opacity-50"
              >
                <Archive className="w-4 h-4" />
                {lang === 'ko' ? '보관' : 'Archive'}
              </button>
            )}
            <button
              onClick={() => handleSave('draft')}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 border border-white/20 text-gray-300 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {lang === 'ko' ? '초안 저장' : 'Save Draft'}
            </button>
            <button
              onClick={() => handleSave('published')}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {lang === 'ko' ? '발행' : 'Publish'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          {/* 메인 영역 */}
          <div className="space-y-6">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={lang === 'ko' ? '제목을 입력하세요' : 'Enter title'}
              className="w-full text-3xl font-bold bg-transparent border-none outline-none placeholder:text-gray-600"
            />
            <BlogEditor content={content} onChange={setContent} />
          </div>

          {/* 사이드바 */}
          <div className="space-y-6">
            <div className="p-4 border border-white/10 rounded-xl bg-white/5">
              <label className="block text-sm font-medium text-gray-400 mb-2">Slug</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-primary"
              />
            </div>

            <div className="p-4 border border-white/10 rounded-xl bg-white/5">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                {lang === 'ko' ? '카테고리' : 'Category'}
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-primary"
              >
                <option value="">{lang === 'ko' ? '선택 안 함' : 'None'}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {lang === 'ko' ? cat.name_ko : cat.name_en}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-4 border border-white/10 rounded-xl bg-white/5">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                {lang === 'ko' ? '태그 (쉼표 구분)' : 'Tags (comma separated)'}
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-primary"
              />
            </div>

            <div className="p-4 border border-white/10 rounded-xl bg-white/5">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                {lang === 'ko' ? '요약 (Excerpt)' : 'Excerpt'}
              </label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-primary resize-none"
              />
            </div>

            <div className="p-4 border border-white/10 rounded-xl bg-white/5">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                {lang === 'ko' ? '언어' : 'Language'}
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'ko' | 'en')}
                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-primary"
              >
                <option value="ko">한국어</option>
                <option value="en">English</option>
              </select>
            </div>

            <div className="p-4 border border-white/10 rounded-xl bg-white/5">
              <label className="block text-sm font-medium text-gray-400 mb-2">SEO</label>
              <input
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder="Meta Title"
                className="w-full px-3 py-2 mb-3 bg-black/40 border border-white/10 rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-primary"
              />
              <textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="Meta Description"
                rows={2}
                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-primary resize-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
