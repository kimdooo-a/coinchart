'use client';

// /scraps — 내 스크랩 목록 (회원전용)
// author 필드는 GET /api/community/scrap 미반환 → 전용 ScrapCard 직접 렌더(방법 a)
// 미로그인(401) → 로그인 유도 UI. 빈 상태 → 게시판 링크 제공.

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bookmark, Eye, MessageSquare, ThumbsUp, LogIn } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import CommunityBadge from '@/components/community/Badge';
import { BOARD_META, type BoardSlug } from '@/lib/community/board-meta';

// ─── 타입 ─────────────────────────────────────────────────────

interface ScrapPost {
  id: string;
  board_slug: string;
  title: string;
  category: string;
  like_count: number;
  comment_count: number;
  view_count: number;
  created_at: string;
}

// ─── 날짜 포맷 ────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}시간 전`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}일 전`;
  return d.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
}

function formatCount(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}만`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString();
}

// ─── 스크랩 카드 ──────────────────────────────────────────────

function ScrapCard({ post }: { post: ScrapPost }) {
  const slug = post.board_slug as BoardSlug;
  const boardName = BOARD_META[slug]?.name ?? post.board_slug;
  const href = `/board/${post.board_slug}/${post.id}`;

  return (
    <Link
      href={href}
      className="flex items-start gap-3 py-3 px-3 rounded-md transition-colors hover:bg-surface-container group"
    >
      {/* 게시판 배지 */}
      <div className="flex-shrink-0 pt-0.5">
        <CommunityBadge variant="outline">{boardName}</CommunityBadge>
      </div>

      {/* 본문 */}
      <div className="flex-1 min-w-0">
        <p className="text-body-base text-on-surface truncate group-hover:text-primary">
          {post.category && (
            <span className="text-meta text-on-surface-variant mr-1.5">#{post.category}</span>
          )}
          {post.title}
          {post.comment_count > 0 && (
            <span className="ml-1.5 text-meta text-primary font-bold">
              [{post.comment_count}]
            </span>
          )}
        </p>
        {/* 메타 */}
        <div className="flex items-center gap-3 mt-1 text-meta text-on-surface-variant">
          <span>{formatDate(post.created_at)}</span>
          <span className="flex items-center gap-0.5">
            <Eye className="w-3 h-3" />
            {formatCount(post.view_count)}
          </span>
          <span className="flex items-center gap-0.5">
            <ThumbsUp className="w-3 h-3" />
            {formatCount(post.like_count)}
          </span>
          {post.comment_count > 0 && (
            <span className="flex items-center gap-0.5">
              <MessageSquare className="w-3 h-3" />
              {formatCount(post.comment_count)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── 페이지 ───────────────────────────────────────────────────

type ViewState = 'loading' | 'unauthenticated' | 'loaded' | 'error';

export default function ScrapsPage() {
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [posts, setPosts] = useState<ScrapPost[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function init() {
      // 세션 확인
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;

      if (!user) {
        setViewState('unauthenticated');
        return;
      }

      // 스크랩 목록 fetch
      try {
        const res = await fetch('/api/community/scrap', { cache: 'no-store' });
        if (cancelled) return;

        if (res.status === 401) {
          setViewState('unauthenticated');
          return;
        }
        if (!res.ok) {
          const body = await res.json().catch(() => ({})) as { error?: string };
          setErrorMsg(body.error ?? '스크랩 목록을 불러오지 못했습니다.');
          setViewState('error');
          return;
        }
        const body = await res.json() as { posts: ScrapPost[] };
        if (!cancelled) {
          setPosts(body.posts ?? []);
          setViewState('loaded');
        }
      } catch {
        if (!cancelled) {
          setErrorMsg('네트워크 오류가 발생했습니다.');
          setViewState('error');
        }
      }
    }

    void init();
    return () => { cancelled = true; };
  }, []);

  return (
    <main className="flex-1 bg-surface-container-low">
      <div className="max-w-[900px] mx-auto px-4 lg:px-6 py-6">

        {/* 헤더 */}
        <header className="bg-surface-container-lowest border border-outline-variant rounded-md p-4 mb-4 flex items-center gap-3">
          <Bookmark className="w-5 h-5 text-primary flex-shrink-0" />
          <div>
            <h1 className="text-h2">내 스크랩</h1>
            <p className="text-body-sm text-on-surface-variant mt-0.5">
              스크랩한 게시글을 모아볼 수 있습니다.
            </p>
          </div>
        </header>

        {/* 상태별 렌더 */}
        {viewState === 'loading' && (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-md py-16 text-center">
            <p className="text-body-sm text-on-surface-variant animate-pulse">불러오는 중…</p>
          </div>
        )}

        {viewState === 'unauthenticated' && (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-md py-16 text-center flex flex-col items-center gap-4">
            <LogIn className="w-10 h-10 text-on-surface-variant" />
            <p className="text-body-base text-on-surface-variant">
              스크랩 목록은 로그인 후 이용할 수 있습니다.
            </p>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-1.5 bg-primary text-on-primary text-label-bold px-5 py-2 rounded-md hover:bg-primary-container transition-colors"
            >
              <LogIn className="w-4 h-4" />
              로그인하기
            </Link>
          </div>
        )}

        {viewState === 'error' && (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-md py-12 text-center">
            <p className="text-body-sm text-on-surface-variant">{errorMsg}</p>
          </div>
        )}

        {viewState === 'loaded' && (
          <>
            {posts.length === 0 ? (
              <div className="bg-surface-container-lowest border border-outline-variant rounded-md py-16 text-center flex flex-col items-center gap-3">
                <Bookmark className="w-10 h-10 text-on-surface-variant" />
                <p className="text-body-base text-on-surface-variant">스크랩한 글이 없습니다.</p>
                <p className="text-body-sm text-on-surface-variant">
                  게시판을 둘러보고 마음에 드는 글을 스크랩해보세요.
                </p>
                <div className="flex gap-2 mt-1">
                  <Link
                    href="/board/free"
                    className="text-primary text-body-sm hover:underline"
                  >
                    자유게시판
                  </Link>
                  <span className="text-outline">·</span>
                  <Link
                    href="/board/market"
                    className="text-primary text-body-sm hover:underline"
                  >
                    시세토론
                  </Link>
                  <span className="text-outline">·</span>
                  <Link
                    href="/board/info"
                    className="text-primary text-body-sm hover:underline"
                  >
                    정보공유
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-surface-container-lowest border border-outline-variant rounded-md overflow-hidden">
                <div className="px-3 py-2.5 border-b border-outline-variant bg-surface-container-low flex items-center justify-between">
                  <span className="text-meta text-on-surface-variant font-label-bold uppercase tracking-wider">
                    스크랩 목록
                  </span>
                  <span className="text-meta text-on-surface-variant">
                    총 <strong className="text-on-surface">{posts.length}</strong>개
                  </span>
                </div>
                <div className="divide-y divide-outline-variant">
                  {posts.map((post) => (
                    <ScrapCard key={post.id} post={post} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
