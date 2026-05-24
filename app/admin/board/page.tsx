'use client';

// R3 2026-05-24 / T06 — 관리자 공지 게시판 관리 UI
// 보드별 공지 목록 + 공지 작성 폼 + is_notice 토글(승격/해제).
// 디자인: v2.0 라이트 톤(네이버 스타일) — bg-surface-*/text-on-surface 토큰 사용.
// 권한: 클라 게이트는 표시용일 뿐, 실제 권한은 /api/admin/board 서버가 검증한다.
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';

// 클라 표시 게이트용 관리자 이메일(서버는 isAdminEmail로 별도 검증) — 기존 admin 페이지 관례 따름
const ADMIN_EMAIL = 'smartkdy7@gmail.com';

// board API VALID_SLUGS(9종)와 동일 순서 + 표시 라벨
const BOARD_OPTIONS: { slug: string; label: string }[] = [
  { slug: 'free', label: '💬 자유게시판' },
  { slug: 'market', label: '📈 시세토론' },
  { slug: 'info', label: '📚 정보공유' },
  { slug: 'coin-btc', label: '₿ 비트코인방' },
  { slug: 'coin-eth', label: 'Ξ 이더리움방' },
  { slug: 'coin-xrp', label: '✕ 리플방' },
  { slug: 'coin-sol', label: '◎ 솔라나방' },
  { slug: 'coin-altcoin', label: '🪙 알트코인방' },
  { slug: 'coin-kimp', label: '🇰🇷 김프방' },
];

const BlogEditor = dynamic(() => import('@/components/Blog/editor/BlogEditor'), {
  ssr: false,
  loading: () => (
    <div className="min-h-[300px] border border-outline-variant rounded-md p-4 text-on-surface-variant text-body-sm">
      에디터 로딩 중...
    </div>
  ),
});

interface PostRow {
  id: string;
  board_slug: string;
  title: string;
  category: string;
  is_notice: boolean;
  view_count: number;
  comment_count: number;
  created_at: string;
}

export default function AdminBoardPage() {
  // 권한 게이트(표시용)
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  // 보드 선택 + 목록
  const [slug, setSlug] = useState<string>('free');
  const [notices, setNotices] = useState<PostRow[]>([]);
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  // 공지 작성 폼
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editorKey, setEditorKey] = useState(0); // 등록 성공 후 에디터 리셋용
  const [submitting, setSubmitting] = useState(false);

  // 토글 진행 표시(중복 클릭 방지)
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // 보드별 공지/일반글 로드
  const loadBoard = useCallback(async (boardSlug: string) => {
    setLoading(true);
    setListError(null);
    try {
      const res = await fetch(`/api/admin/board?slug=${encodeURIComponent(boardSlug)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? '목록 로드 실패');
      setNotices(data.notices ?? []);
      setPosts(data.posts ?? []);
    } catch (e: unknown) {
      setListError(e instanceof Error ? e.message : '목록 로드 실패');
      setNotices([]);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 마운트 시 관리자 검증
  useEffect(() => {
    const verifyAdmin = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const ok = !!user && user.email === ADMIN_EMAIL;
      setAuthorized(ok);
      setChecking(false);
      if (ok) void loadBoard('free');
    };
    void verifyAdmin();
  }, [loadBoard]);

  // 보드 변경 시 재로드
  const handleSlugChange = (next: string) => {
    setSlug(next);
    void loadBoard(next);
  };

  // 공지 작성
  const handleCreate = async () => {
    if (!title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }
    if (!content.trim()) {
      alert('본문을 입력해주세요.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, title: title.trim(), contentHtml: content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? '공지 생성 실패');
      // 폼 리셋 + 목록 갱신
      setTitle('');
      setContent('');
      setEditorKey((k) => k + 1);
      await loadBoard(slug);
      alert('공지가 등록되었습니다.');
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : '공지 생성에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // is_notice 토글(승격/해제)
  const handleToggle = async (postId: string, nextIsNotice: boolean) => {
    setTogglingId(postId);
    try {
      const res = await fetch('/api/admin/board', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, isNotice: nextIsNotice }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? '토글 실패');
      await loadBoard(slug);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : '공지 토글에 실패했습니다.');
    } finally {
      setTogglingId(null);
    }
  };

  // 검증 중
  if (checking) {
    return (
      <main className="flex-1 bg-surface-container-low min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-on-surface-variant text-body-sm">권한 확인 중...</p>
        </div>
      </main>
    );
  }

  // 접근 거부
  if (!authorized) {
    return (
      <main className="flex-1 bg-surface-container-low min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-md p-8 text-center max-w-md w-full">
          <h1 className="text-h2 text-error mb-3">접근 권한 없음</h1>
          <p className="text-on-surface-variant text-body-sm mb-6">
            관리자만 접근할 수 있는 페이지입니다.
          </p>
          <Link
            href="/"
            className="inline-block bg-primary text-on-primary text-label-bold px-6 py-2 rounded-md hover:bg-primary-container"
          >
            홈으로
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-surface-container-low min-h-screen">
      <div className="max-w-[900px] mx-auto px-4 lg:px-6 py-6">
        {/* 브레드크럼 */}
        <nav className="text-meta text-on-surface-variant mb-3">
          <Link href="/" className="hover:text-primary">홈</Link>
          <span className="mx-1">›</span>
          <Link href="/admin" className="hover:text-primary">관리자</Link>
          <span className="mx-1">›</span>
          <span>공지 관리</span>
        </nav>

        <div className="flex items-center gap-2 mb-4">
          <h1 className="text-h2">📌 공지 게시판 관리</h1>
          <div className="ml-auto">
            <select
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              className="bg-surface-container-lowest border border-outline-variant rounded-md text-body-sm px-3 py-2 focus:outline-none focus:border-primary"
            >
              {BOARD_OPTIONS.map((b) => (
                <option key={b.slug} value={b.slug}>{b.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 공지 작성 폼 */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded-md p-5 lg:p-6 mb-6">
          <h2 className="text-h3 mb-4">새 공지 작성</h2>
          <label className="text-label-bold text-on-surface-variant block mb-1">제목</label>
          <input
            type="text"
            placeholder="공지 제목을 입력하세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-md text-body-base px-3 py-2.5 focus:outline-none focus:border-primary mb-4"
          />
          <label className="text-label-bold text-on-surface-variant block mb-1">본문</label>
          <div className="mb-4">
            <BlogEditor key={editorKey} content="" onChange={setContent} tone="light" />
          </div>
          <div className="flex justify-end gap-2 border-t border-outline-variant pt-4">
            <button
              type="button"
              disabled={submitting}
              onClick={handleCreate}
              className="bg-primary text-on-primary text-label-bold px-6 py-2 rounded-md hover:bg-primary-container disabled:opacity-60"
            >
              {submitting ? '등록 중...' : '공지 등록'}
            </button>
          </div>
        </section>

        {listError && (
          <div className="bg-error-container text-error text-body-sm rounded-md px-4 py-3 mb-4">
            {listError}
          </div>
        )}

        {/* 현재 공지 목록 */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded-md p-5 lg:p-6 mb-6">
          <h2 className="text-h3 mb-4">
            현재 공지 ({notices.length})
            {loading && <span className="text-meta text-on-surface-variant ml-2">불러오는 중...</span>}
          </h2>
          {notices.length === 0 ? (
            <p className="text-on-surface-variant text-body-sm py-4">등록된 공지가 없습니다.</p>
          ) : (
            <ul className="divide-y divide-outline-variant">
              {notices.map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-3">
                  <span className="text-meta bg-primary-fixed text-primary px-2 py-0.5 rounded shrink-0">공지</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-body-sm text-on-surface truncate">{p.title}</div>
                    <div className="text-meta text-on-surface-variant">
                      {p.category} · 조회 {p.view_count} · 댓글 {p.comment_count} · {new Date(p.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={togglingId === p.id}
                    onClick={() => handleToggle(p.id, false)}
                    className="shrink-0 text-meta border border-outline-variant text-on-surface hover:bg-surface-container-low px-3 py-1.5 rounded-md disabled:opacity-60"
                  >
                    {togglingId === p.id ? '...' : '공지 해제'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 최근 일반글(공지 승격 후보) */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded-md p-5 lg:p-6">
          <h2 className="text-h3 mb-4">최근 글 (공지 승격)</h2>
          {posts.length === 0 ? (
            <p className="text-on-surface-variant text-body-sm py-4">최근 글이 없습니다.</p>
          ) : (
            <ul className="divide-y divide-outline-variant">
              {posts.map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-body-sm text-on-surface truncate">{p.title}</div>
                    <div className="text-meta text-on-surface-variant">
                      {p.category} · 조회 {p.view_count} · 댓글 {p.comment_count} · {new Date(p.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={togglingId === p.id}
                    onClick={() => handleToggle(p.id, true)}
                    className="shrink-0 text-meta bg-primary text-on-primary hover:bg-primary-container px-3 py-1.5 rounded-md disabled:opacity-60"
                  >
                    {togglingId === p.id ? '...' : '공지 등록'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
