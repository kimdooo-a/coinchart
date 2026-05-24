// 게시글 상세 — SSR (R3/T02, 2026-05-24)
//
// R2/T01의 "use client" + 클라 fetch 구조를 서버 컴포넌트로 전환.
// 서버에서 글 + 첫 페이지 댓글 + 이웃 글을 로드해 렌더(SEO). generateMetadata로 글 제목·요약 메타.
// 추천/비추(PostVoteButtons)·댓글(CommentSection)·수정/삭제/공유(PostActions)는 클라 하위 컴포넌트.
// view_count +1은 fetchBoardPostServer에서 기존 API 동작을 유지(요청당 1회).

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import BoardRow, { BoardTableHeader } from "@/components/community/BoardRow";
import CommunityBadge from "@/components/community/Badge";
import BoardSidebar from "@/components/community/BoardSidebar";
import PostActions from "@/components/community/PostActions";
import PostVoteButtons from "@/components/community/PostVoteButtons";
import CommentSection from "@/components/community/CommentSection";
import FooterSection from "@/components/footer-section";
import { BOARD_META, type BoardSlug } from "@/lib/community/board-meta";
import {
  fetchBoardPostServer,
  fetchBoardListServer,
  getPostRecord,
  summarizeHtml,
} from "@/lib/community/board-server";

const VALID_SLUGS: BoardSlug[] = ["free", "market", "info"];

function isValidSlug(slug: string): slug is BoardSlug {
  return (VALID_SLUGS as string[]).includes(slug);
}

// ─────────────────────────────────────────────────────────────
// SEO 메타 — 글 제목·요약 (getPostRecord는 React cache로 페이지와 dedupe, 조회수 미증가)
// ─────────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; postId: string }>;
}): Promise<Metadata> {
  const { slug, postId } = await params;
  if (!isValidSlug(slug)) return { title: "게시글" };
  const post = await getPostRecord(slug, postId);
  if (!post) return { title: "게시글을 찾을 수 없습니다" };

  const meta = BOARD_META[slug];
  const summary = summarizeHtml(post.content_html);
  const title = `${post.title} - ${meta.name}`;
  return {
    title,
    description: summary || meta.description,
    openGraph: { title: post.title, description: summary || meta.description, type: "article" },
  };
}

// ─────────────────────────────────────────────────────────────
// 페이지
// ─────────────────────────────────────────────────────────────
export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ slug: string; postId: string }>;
}) {
  const { slug, postId } = await params;
  if (!isValidSlug(slug)) notFound();
  const boardSlug = slug;
  const meta = BOARD_META[boardSlug];

  const data = await fetchBoardPostServer(boardSlug, postId);

  // 글 없음/잘못된 id — 소프트 안내(목록 링크). 하드 404 대신 UX 유지.
  if (!data) {
    return (
      <main className="flex-1 bg-surface-container-low">
        <div className="max-w-[1200px] mx-auto px-4 lg:px-6 py-16 text-center">
          <p className="text-body-base text-on-surface mb-3">게시글을 찾을 수 없습니다.</p>
          <Link href={`/board/${boardSlug}`} className="text-primary font-bold hover:underline">
            {meta.name} 목록으로 →
          </Link>
        </div>
        <FooterSection />
      </main>
    );
  }

  const { post, comments } = data;

  // 같은 게시판 글(최신 30) — 이전/다음 + 다른 글 미니표 도출
  const siblingsRes = await fetchBoardListServer(boardSlug, { limit: 30, sort: "latest" }).catch(
    () => null
  );
  const siblings = siblingsRes?.posts ?? [];
  const idx = siblings.findIndex((p) => p.uuid === post.id);
  const prev = idx >= 0 ? siblings[idx + 1] : undefined;
  const next = idx > 0 ? siblings[idx - 1] : undefined;
  const sameBoardPosts = siblings.filter((p) => p.uuid !== post.id).slice(0, 10);

  return (
    <main className="flex-1 bg-surface-container-low">
      <div className="max-w-[1200px] mx-auto px-4 lg:px-6 py-6 flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          {/* 브레드크럼 */}
          <nav className="text-meta text-on-surface-variant mb-3">
            <Link href="/" className="hover:text-primary">홈</Link>
            <span className="mx-1">›</span>
            <Link href={`/board/${boardSlug}`} className="hover:text-primary">{meta.name}</Link>
            <span className="mx-1">›</span>
            <span className="truncate max-w-[200px] inline-block align-bottom">{post.title}</span>
          </nav>

          {/* 게시글 헤더 */}
          <header className="bg-surface-container-lowest border border-outline-variant rounded-md p-5 mb-3">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {post.isHot && <CommunityBadge variant="hot">HOT</CommunityBadge>}
              {post.isNotice && <CommunityBadge variant="primary">공지</CommunityBadge>}
              {post.category && <CommunityBadge variant="outline">{post.category}</CommunityBadge>}
            </div>
            <h1 className="text-h2 leading-tight mb-3">{post.title}</h1>
            <div className="flex items-center justify-between flex-wrap gap-2 text-meta text-on-surface-variant border-t border-outline-variant pt-3">
              <div>
                {post.isAdmin ? (
                  <span className="text-primary font-bold">{post.author} 🛡</span>
                ) : (
                  <>
                    <strong className="text-on-surface">{post.author}</strong>
                    {post.authorIp && <span className="ml-1 text-outline">({post.authorIp}.*.*)</span>}
                  </>
                )}
                <span className="mx-2">·</span>
                <span>{post.createdAt}</span>
                <span className="mx-2">·</span>
                <span>조회 {post.views.toLocaleString()}</span>
              </div>
              <PostActions slug={boardSlug} postId={post.id} requiresPassword={!!post.authorIp} />
            </div>
          </header>

          {/* 본문 */}
          <article className="bg-surface-container-lowest border border-outline-variant rounded-md px-5 py-8 mb-4">
            <div
              className="prose prose-sm max-w-none prose-headings:text-on-surface prose-p:text-on-surface prose-a:text-primary"
              dangerouslySetInnerHTML={{ __html: post.contentHtml ?? "" }}
            />

            {/* 태그 */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-6">
                {post.tags.map((t) => (
                  <span
                    key={t}
                    className="text-meta px-2 py-0.5 rounded bg-surface-container text-primary hover:bg-primary-fixed cursor-pointer"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </article>

          {/* 추천·공유 바 (클라 인터랙션) */}
          <PostVoteButtons postId={post.id} initialLikes={post.likes} />

          {/* 댓글 영역 (클라 인터랙션, 초기 댓글은 SSR) */}
          <CommentSection postId={post.id} initialComments={comments} />

          {/* 이전/다음 */}
          <nav className="bg-surface-container-lowest border border-outline-variant rounded-md divide-y divide-outline-variant mb-4">
            {prev && (
              <Link
                href={`/board/${boardSlug}/${prev.uuid}`}
                className="grid grid-cols-[60px_1fr] gap-3 px-4 py-2.5 text-body-sm hover:bg-surface-container-low transition-colors"
              >
                <span className="text-meta text-on-surface-variant">◀ 이전</span>
                <span className="truncate">{prev.title}</span>
              </Link>
            )}
            {next && (
              <Link
                href={`/board/${boardSlug}/${next.uuid}`}
                className="grid grid-cols-[60px_1fr] gap-3 px-4 py-2.5 text-body-sm hover:bg-surface-container-low transition-colors"
              >
                <span className="text-meta text-on-surface-variant">▶ 다음</span>
                <span className="truncate">{next.title}</span>
              </Link>
            )}
          </nav>

          {/* 같은 게시판 미니 표 */}
          <section className="bg-surface-container-lowest border border-outline-variant rounded-md overflow-hidden">
            <div className="px-4 py-2.5 border-b border-outline-variant flex items-center justify-between">
              <h3 className="text-body-sm font-bold">{meta.name} 다른 글</h3>
              <Link href={`/board/${boardSlug}`} className="text-meta text-on-surface-variant hover:text-primary">
                목록 ›
              </Link>
            </div>
            <BoardTableHeader />
            <div className="divide-y divide-outline-variant">
              {sameBoardPosts.map((p) => (
                <BoardRow
                  key={p.uuid}
                  post={p}
                  href={`/board/${boardSlug}/${p.uuid}`}
                  compact
                />
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <BoardSidebar showTools={false} />
      </div>
      <FooterSection />
    </main>
  );
}
