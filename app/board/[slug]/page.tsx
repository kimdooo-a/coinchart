// 게시판 목록 — SSR (R3/T02, 2026-05-24)
//
// R2/T01의 "use client" + 클라 fetch 구조를 서버 컴포넌트로 전환.
// searchParams(page/sort/search/category)를 읽어 서버에서 초기 목록을 렌더(SEO).
// 정렬/검색/카테고리 인터랙션은 <BoardListControls/>(클라)가 URL을 갱신 → 서버 재렌더.
// 페이지네이션은 Pagination baseHref(쿼리스트링 Link)로 서버 렌더.
// (참고 패턴: R1/T15 app/page.tsx — async 서버 컴포넌트 + supabase 서버 fetch)

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PenSquare } from "lucide-react";
import BoardRow, { BoardTableHeader } from "@/components/community/BoardRow";
import Pagination from "@/components/community/Pagination";
import BoardSidebar from "@/components/community/BoardSidebar";
import BoardListControls from "@/components/community/BoardListControls";
import FooterSection from "@/components/footer-section";
import { BOARD_META, type BoardSlug } from "@/lib/community/board-meta";
import { fetchBoardListServer } from "@/lib/community/board-server";
import type { BoardSortKey } from "@/lib/community/board-queries";

const VALID_SLUGS: BoardSlug[] = ["free", "market", "info"];
const VALID_SORTS: BoardSortKey[] = ["latest", "popular", "comments", "views"];
const PER_PAGE = 30;

function isValidSlug(slug: string): slug is BoardSlug {
  return (VALID_SLUGS as string[]).includes(slug);
}

// ─────────────────────────────────────────────────────────────
// SEO 메타
// ─────────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!isValidSlug(slug)) return { title: "게시판" };
  const meta = BOARD_META[slug];
  const title = `${meta.name} - 코인 커뮤니티`;
  return {
    title,
    description: meta.description,
    openGraph: { title, description: meta.description },
  };
}

// ─────────────────────────────────────────────────────────────
// 페이지
// ─────────────────────────────────────────────────────────────
export default async function BoardListPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  if (!isValidSlug(slug)) notFound();
  const boardSlug = slug;
  const meta = BOARD_META[boardSlug];

  const sp = await searchParams;
  const first = (v: string | string[] | undefined): string =>
    Array.isArray(v) ? v[0] ?? "" : v ?? "";

  const page = Math.max(1, Number.parseInt(first(sp.page), 10) || 1);
  const sortParam = first(sp.sort) as BoardSortKey;
  const sort: BoardSortKey = VALID_SORTS.includes(sortParam) ? sortParam : "latest";
  const search = first(sp.search);
  const category = first(sp.category) || "전체";

  const { notices, posts, total } = await fetchBoardListServer(boardSlug, {
    page,
    limit: PER_PAGE,
    sort,
    search,
    category,
  });

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  // 페이지네이션 baseHref — 현재 필터를 보존하고 page만 교체 (...page= 로 끝나야 함)
  const pageParts: string[] = [];
  if (category !== "전체") pageParts.push(`category=${encodeURIComponent(category)}`);
  if (sort !== "latest") pageParts.push(`sort=${sort}`);
  if (search.trim()) pageParts.push(`search=${encodeURIComponent(search.trim())}`);
  pageParts.push("page=");
  const baseHref = `/board/${boardSlug}?${pageParts.join("&")}`;

  return (
    <main className="flex-1 bg-surface-container-low">
      <div className="max-w-[1200px] mx-auto px-4 lg:px-6 py-6 flex flex-col lg:flex-row gap-6">
        {/* Main */}
        <div className="flex-1 min-w-0">
          {/* 브레드크럼 */}
          <nav className="text-meta text-on-surface-variant mb-3">
            <Link href="/" className="hover:text-primary">홈</Link>
            <span className="mx-1">›</span>
            <span>{meta.name}</span>
          </nav>

          {/* 게시판 헤더 */}
          <header className="bg-surface-container-lowest border border-outline-variant rounded-md p-4 mb-4">
            <h1 className="text-h2 mb-1">
              {meta.emoji} {meta.name}
            </h1>
            <p className="text-body-sm text-on-surface-variant">{meta.description}</p>
            <div className="text-meta text-on-surface-variant mt-2">
              글 <strong className="text-on-surface">{total.toLocaleString()}</strong>개
            </div>
          </header>

          {/* 카테고리 탭 + 정렬·검색·글쓰기 바 (클라 인터랙션) */}
          <BoardListControls
            slug={boardSlug}
            categories={meta.categories}
            category={category}
            sort={sort}
            search={search}
          />

          {/* 표 */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-md overflow-hidden">
            <BoardTableHeader />

            {/* 공지글 */}
            <div className="divide-y divide-outline-variant">
              {notices.map((p) => (
                <BoardRow
                  key={`notice-${p.uuid}`}
                  post={p}
                  href={`/board/${boardSlug}/${p.uuid}`}
                />
              ))}
            </div>

            {notices.length > 0 && (
              <div className="border-t border-dashed border-outline-variant" />
            )}

            {/* 일반글 */}
            <div className="divide-y divide-outline-variant">
              {posts.length === 0 ? (
                <div className="py-16 text-center text-on-surface-variant text-body-sm">
                  이 카테고리에 아직 글이 없습니다.{" "}
                  <Link href={`/board/${boardSlug}/write`} className="text-primary font-bold hover:underline">
                    첫 글을 작성해보세요 →
                  </Link>
                </div>
              ) : (
                posts.map((p) => (
                  <BoardRow key={p.uuid} post={p} href={`/board/${boardSlug}/${p.uuid}`} />
                ))
              )}
            </div>
          </div>

          {/* 페이지네이션 + 글쓰기 */}
          <div className="flex items-center justify-between mt-6">
            <div className="flex-1">
              <Pagination currentPage={page} totalPages={totalPages} baseHref={baseHref} />
            </div>
            <Link
              href={`/board/${boardSlug}/write`}
              className="hidden sm:inline-flex items-center gap-1 bg-primary text-on-primary text-label-bold px-4 py-2 rounded-md hover:bg-primary-container transition-colors flex-shrink-0"
            >
              <PenSquare className="w-3.5 h-3.5" />
              글쓰기
            </Link>
          </div>
        </div>

        {/* Sidebar */}
        <BoardSidebar />
      </div>
      <FooterSection />
    </main>
  );
}
