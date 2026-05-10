"use client";

import { use, useState, useMemo } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PenSquare, Search, Filter, ChevronDown } from "lucide-react";
import BoardRow, { BoardTableHeader } from "@/components/community/BoardRow";
import CommunityTabs from "@/components/community/CommunityTabs";
import Pagination from "@/components/community/Pagination";
import PriceTickerWidget from "@/components/community/widgets/PriceTickerWidget";
import HotIssueWidget from "@/components/community/widgets/HotIssueWidget";
import FngGaugeWidget from "@/components/community/widgets/FngGaugeWidget";
import OfficialPostsWidget from "@/components/community/widgets/OfficialPostsWidget";
import ToolsShortcutWidget from "@/components/community/widgets/ToolsShortcutWidget";
import FooterSection from "@/components/footer-section";
import {
    BOARD_META,
    MOCK_POSTS,
    type BoardSlug,
} from "@/lib/community/mock-posts";
import { TICKER_LIST, HOT_ISSUES, OFFICIAL_POSTS } from "@/lib/community/mock-coins";

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
    const [sortKey, setSortKey] = useState<"latest" | "popular" | "comments" | "views">("latest");
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");

    const filtered = useMemo(() => {
        const all = MOCK_POSTS[boardSlug];
        const notices = all.filter((p) => p.isNotice);
        let regular = all.filter((p) => !p.isNotice);
        if (activeCategory !== "전체") {
            regular = regular.filter((p) => p.category === activeCategory);
        }
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            regular = regular.filter((p) => p.title.toLowerCase().includes(q));
        }
        if (sortKey === "popular") regular = [...regular].sort((a, b) => b.likes - a.likes);
        else if (sortKey === "comments")
            regular = [...regular].sort((a, b) => (b.commentCount ?? 0) - (a.commentCount ?? 0));
        else if (sortKey === "views") regular = [...regular].sort((a, b) => b.views - a.views);
        return { notices, regular };
    }, [boardSlug, activeCategory, sortKey, search]);

    const totalPages = Math.max(1, Math.ceil(filtered.regular.length / PER_PAGE));
    const pageItems = filtered.regular.slice((page - 1) * PER_PAGE, page * PER_PAGE);

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
                            글 <strong className="text-on-surface">{MOCK_POSTS[boardSlug].length.toLocaleString()}</strong>개 ·
                            오늘 <strong className="text-on-surface">{Math.floor(Math.random() * 100 + 30)}</strong>개
                        </div>
                    </header>

                    {/* 카테고리 탭 */}
                    <div className="overflow-x-auto no-scrollbar mb-4">
                        <CommunityTabs items={tabs} activeKey={activeCategory} onChange={setActiveCategory} />
                    </div>

                    {/* 정렬·검색·글쓰기 바 */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                        <div className="relative">
                            <select
                                value={sortKey}
                                onChange={(e) => setSortKey(e.target.value as typeof sortKey)}
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
                                onChange={(e) => setSearch(e.target.value)}
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

                        {/* 공지글 */}
                        <div className="divide-y divide-outline-variant">
                            {filtered.notices.map((p) => (
                                <BoardRow
                                    key={`notice-${p.id}`}
                                    post={p}
                                    href={`/board/${boardSlug}/${p.id}`}
                                />
                            ))}
                        </div>

                        {filtered.notices.length > 0 && (
                            <div className="border-t border-dashed border-outline-variant" />
                        )}

                        {/* 일반글 */}
                        <div className="divide-y divide-outline-variant">
                            {pageItems.length === 0 ? (
                                <div className="py-16 text-center text-on-surface-variant text-body-sm">
                                    이 카테고리에 아직 글이 없습니다.{" "}
                                    <Link href={`/board/${boardSlug}/write`} className="text-primary font-bold hover:underline">
                                        첫 글을 작성해보세요 →
                                    </Link>
                                </div>
                            ) : (
                                pageItems.map((p) => (
                                    <BoardRow key={p.id} post={p} href={`/board/${boardSlug}/${p.id}`} />
                                ))
                            )}
                        </div>
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
                <aside className="w-full lg:w-[300px] flex-shrink-0 space-y-4">
                    <PriceTickerWidget items={TICKER_LIST.slice(0, 6)} />
                    <HotIssueWidget items={HOT_ISSUES} />
                    <FngGaugeWidget value={72} prevValue={68} />
                    <OfficialPostsWidget posts={OFFICIAL_POSTS} />
                    <ToolsShortcutWidget />
                </aside>
            </div>
            <FooterSection />
        </main>
    );
}
