"use client";

// 게시판 목록 인터랙션 컨트롤 (R3/T02, 2026-05-24)
//
// SSR 전환된 목록 페이지(app/board/[slug]/page.tsx)의 인터랙션부.
// 카테고리 탭·정렬 select·제목 검색을 URL searchParams 갱신으로 위임 → 서버가 재렌더한다.
// (페이지네이션은 Pagination baseHref로 서버 렌더 — 본 컴포넌트 범위 밖)

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { PenSquare, Search, ChevronDown } from "lucide-react";
import CommunityTabs from "@/components/community/CommunityTabs";
import type { BoardSlug } from "@/lib/community/board-meta";
import type { BoardSortKey } from "@/lib/community/board-queries";

interface BoardListControlsProps {
  slug: BoardSlug;
  categories: string[];
  category: string;
  sort: BoardSortKey;
  search: string;
}

export default function BoardListControls({
  slug,
  categories,
  category,
  sort,
  search,
}: BoardListControlsProps) {
  const router = useRouter();
  // 검색 입력은 로컬 상태(디바운스 후 URL 반영). URL의 확정 search와 동기화.
  const [searchInput, setSearchInput] = useState(search);
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // 현재 필터에 partial을 병합해 URL 생성. 페이지는 1로 리셋(page 파라미터 생략).
  const buildUrl = (partial: { category?: string; sort?: BoardSortKey; search?: string }) => {
    const nextCategory = partial.category ?? category;
    const nextSort = partial.sort ?? sort;
    const nextSearch = (partial.search ?? search).trim();

    const params = new URLSearchParams();
    if (nextCategory && nextCategory !== "전체") params.set("category", nextCategory);
    if (nextSort && nextSort !== "latest") params.set("sort", nextSort);
    if (nextSearch) params.set("search", nextSearch);

    const qs = params.toString();
    return `/board/${slug}${qs ? `?${qs}` : ""}`;
  };

  // 검색 디바운스 — 입력이 확정 search와 다를 때만 350ms 후 URL 반영
  useEffect(() => {
    if (searchInput === search) return;
    const t = setTimeout(() => {
      router.push(buildUrl({ search: searchInput }));
    }, 350);
    return () => clearTimeout(t);
    // buildUrl은 매 렌더 새 함수지만 의존 값(slug/category/sort/search)을 명시
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput, search, slug, category, sort]);

  const tabs = categories.map((c) => ({ key: c, label: c }));

  return (
    <>
      {/* 카테고리 탭 */}
      <div className="overflow-x-auto no-scrollbar mb-4">
        <CommunityTabs
          items={tabs}
          activeKey={category}
          onChange={(c) => router.push(buildUrl({ category: c }))}
        />
      </div>

      {/* 정렬·검색·글쓰기 바 */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="relative">
          <select
            value={sort}
            onChange={(e) => router.push(buildUrl({ sort: e.target.value as BoardSortKey }))}
            aria-label="정렬 기준"
            className="appearance-none bg-surface-container-lowest border border-outline-variant rounded-md text-body-sm px-3 py-1.5 pr-8 cursor-pointer"
          >
            <option value="latest">최신순</option>
            <option value="popular">인기순(추천)</option>
            <option value="comments">댓글많은순</option>
            <option value="views">조회순</option>
          </select>
          <ChevronDown className="w-3 h-3 text-on-surface-variant absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="w-3.5 h-3.5 text-outline absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="제목 검색"
            aria-label="제목 검색"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") router.push(buildUrl({ search: searchInput }));
            }}
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-md text-body-sm pl-7 pr-3 py-1.5 focus:outline-none focus:border-primary"
          />
        </div>

        <Link
          href={`/board/${slug}/write`}
          className="ml-auto inline-flex items-center gap-1 bg-primary text-on-primary text-label-bold px-3 py-1.5 rounded-md hover:bg-primary-container transition-colors"
        >
          <PenSquare className="w-3.5 h-3.5" />
          글쓰기
        </Link>
      </div>
    </>
  );
}
