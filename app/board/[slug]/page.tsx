"use client";

import { use, useState, useEffect } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PenSquare, Search, ChevronDown } from "lucide-react";
import BoardRow, { BoardTableHeader } from "@/components/community/BoardRow";
import CommunityTabs from "@/components/community/CommunityTabs";
import Pagination from "@/components/community/Pagination";
import BoardSidebar from "@/components/community/BoardSidebar";
import FooterSection from "@/components/footer-section";
import { BOARD_META, type BoardSlug } from "@/lib/community/mock-posts";
import {
    fetchBoardList,
    type BoardListItem,
    type BoardSortKey,
} from "@/lib/community/board-queries";

const VALID_SLUGS: BoardSlug[] = ["free", "market", "info"];
const PER_PAGE = 30;

export default function BoardListPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = use(params);
    if (!VALID_SLUGS.includes(slug as BoardSlug)) notFound();

    const boardSlug = slug as BoardSlug;
    const meta = BOARD_META[boardSlug];

    const [activeCategory, setActiveCategory] = useState("전체");
    const [sortKey, setSortKey] = useState<BoardSortKey>("latest");
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const [notices, setNotices] = useState<BoardListItem[]>([]);
    const [posts, setPosts] = useState<BoardListItem[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 검색어 디바운스 (서버 검색 위임) — 페이지 리셋은 입력 핸들러에서 처리
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(t);
    }, [search]);

    // 목록 로드 — 서버에 정렬/검색/페이지/카테고리 위임
    useEffect(() => {
        let alive = true;
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetchBoardList(boardSlug, {
                    page,
                    limit: PER_PAGE,
                    sort: sortKey,
                    search: debouncedSearch,
                    category: activeCategory,
                });
                if (!alive) return;
                setNotices(res.notices);
                setPosts(res.posts);
                setTotal(res.total);
            } catch (e: unknown) {
                if (!alive) return;
                setError(e instanceof Error ? e.message : "목록을 불러오지 못했습니다.");
                setNotices([]);
                setPosts([]);
                setTotal(0);
            } finally {
                if (alive) setLoading(false);
            }
        };
        void load();
        return () => {
            alive = false;
        };
    }, [boardSlug, page, sortKey, debouncedSearch, activeCategory]);

    // 필터/정렬/검색 변경 시 1페이지로 리셋 (이벤트 핸들러에서 직접 호출)
    const changeCategory = (c: string) => {
        setActiveCategory(c);
        setPage(1);
    };
    const changeSort = (s: BoardSortKey) => {
        setSortKey(s);
        setPage(1);
    };
    const changeSearch = (v: string) => {
        setSearch(v);
        setPage(1);
    };

    const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
    const tabs = meta.categories.map((c) => ({ key: c, label: c }));

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

                    {/* 카테고리 탭 */}
                    <div className="overflow-x-auto no-scrollbar mb-4">
                        <CommunityTabs items={tabs} activeKey={activeCategory} onChange={changeCategory} />
                    </div>

                    {/* 정렬·검색·글쓰기 바 */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                        <div className="relative">
                            <select
                                value={sortKey}
                                onChange={(e) => changeSort(e.target.value as BoardSortKey)}
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
                                value={search}
                                onChange={(e) => changeSearch(e.target.value)}
                                className="w-full bg-surface-container-lowest border border-outline-variant rounded-md text-body-sm pl-7 pr-3 py-1.5 focus:outline-none focus:border-primary"
                            />
                        </div>

                        <Link
                            href={`/board/${boardSlug}/write`}
                            className="ml-auto inline-flex items-center gap-1 bg-primary text-on-primary text-label-bold px-3 py-1.5 rounded-md hover:bg-primary-container transition-colors"
                        >
                            <PenSquare className="w-3.5 h-3.5" />
                            글쓰기
                        </Link>
                    </div>

                    {/* 표 */}
                    <div className="bg-surface-container-lowest border border-outline-variant rounded-md overflow-hidden">
                        <BoardTableHeader />

                        {loading ? (
                            <div className="py-16 text-center text-on-surface-variant text-body-sm">
                                불러오는 중...
                            </div>
                        ) : error ? (
                            <div className="py-16 text-center text-error text-body-sm">
                                {error}
                            </div>
                        ) : (
                            <>
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
                            </>
                        )}
                    </div>

                    {/* 페이지네이션 + 글쓰기 */}
                    <div className="flex items-center justify-between mt-6">
                        <div className="flex-1">
                            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
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
