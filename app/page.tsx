"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import BoardRow, { BoardTableHeader } from "@/components/community/BoardRow";
import NewsRow from "@/components/community/NewsRow";
import PriceTickerWidget from "@/components/community/widgets/PriceTickerWidget";
import HotIssueWidget from "@/components/community/widgets/HotIssueWidget";
import FngGaugeWidget from "@/components/community/widgets/FngGaugeWidget";
import OfficialPostsWidget from "@/components/community/widgets/OfficialPostsWidget";
import ToolsShortcutWidget from "@/components/community/widgets/ToolsShortcutWidget";
import FooterSection from "@/components/footer-section";
import { TICKER_LIST, HOT_ISSUES, OFFICIAL_POSTS, COINS } from "@/lib/community/mock-coins";
import {
    BOARD_META,
    MOCK_POSTS,
    getBestPosts,
    type BoardSlug,
} from "@/lib/community/mock-posts";
import { MOCK_NEWS } from "@/lib/community/mock-news";
import { cn } from "@/lib/utils";

const COIN_ROOM_CARDS = ["btc", "eth", "xrp", "sol", "altcoin", "kimp"] as const;

export default function HomePage() {
    const bestPosts = getBestPosts(30);
    const latestNews = MOCK_NEWS.slice(0, 10);

    return (
        <main className="flex-1 bg-surface-container-low">
            {/* 시세 스트립 */}
            <div className="bg-surface-container border-b border-outline-variant overflow-hidden">
                <div className="max-w-[1200px] mx-auto flex items-center h-9">
                    <div className="flex items-center overflow-x-auto no-scrollbar w-full">
                        <div className="flex items-center gap-6 px-4 ticker-scroll whitespace-nowrap">
                            {[...TICKER_LIST, ...TICKER_LIST].map((t, i) => {
                                const isUp = t.changePct >= 0;
                                return (
                                    <Link
                                        key={`${t.symbol}-${i}`}
                                        href={t.href ?? "#"}
                                        className="inline-flex items-center gap-2 text-meta"
                                    >
                                        <span className="font-bold text-on-surface">{t.symbol}</span>
                                        <span className="text-on-surface-variant tabular-nums">
                                            ${t.price.toLocaleString()}
                                        </span>
                                        <span
                                            className={cn(
                                                "tabular-nums",
                                                isUp ? "text-[var(--color-kr-up)]" : "text-[var(--color-kr-down)]"
                                            )}
                                        >
                                            {isUp ? "▲" : "▼"} {Math.abs(t.changePct).toFixed(2)}%
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1200px] mx-auto px-4 lg:px-6 py-6">
                <nav className="text-meta text-on-surface-variant mb-3">
                    <span>홈</span>
                </nav>

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Main */}
                    <div className="flex-1 min-w-0 space-y-6">
                        {/* 베스트 */}
                        <section className="bg-surface-container-lowest border border-outline-variant rounded-md overflow-hidden">
                            <header className="px-4 py-2.5 border-b border-outline-variant flex items-center justify-between">
                                <h2 className="text-body-base font-bold">🔥 베스트 (오늘)</h2>
                                <div className="flex items-center gap-2">
                                    <button className="text-meta text-primary font-bold">오늘</button>
                                    <span className="text-outline-variant">·</span>
                                    <button className="text-meta text-on-surface-variant hover:text-primary">이번주</button>
                                    <span className="text-outline-variant">·</span>
                                    <button className="text-meta text-on-surface-variant hover:text-primary">이번달</button>
                                </div>
                            </header>
                            <BoardTableHeader />
                            <div className="divide-y divide-outline-variant">
                                {bestPosts.map((p, i) => (
                                    <BoardRow
                                        key={p.id}
                                        post={{ ...p, number: i + 1 }}
                                        href={`/board/${p.boardSlug}/${p.id}`}
                                    />
                                ))}
                            </div>
                        </section>

                        {/* 최신 뉴스 */}
                        <section className="bg-surface-container-lowest border border-outline-variant rounded-md overflow-hidden">
                            <header className="px-4 py-2.5 border-b border-outline-variant flex items-center justify-between">
                                <h2 className="text-body-base font-bold">📰 최신 뉴스</h2>
                                <Link href="/news" className="text-meta text-on-surface-variant hover:text-primary">
                                    더보기 ›
                                </Link>
                            </header>
                            <div className="divide-y divide-outline-variant">
                                {latestNews.map((n) => <NewsRow key={n.id} item={n} />)}
                            </div>
                        </section>

                        {/* 게시판 미리보기 (3컬럼) */}
                        <section>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {(["free", "market", "info"] as BoardSlug[]).map((slug) => {
                                    const meta = BOARD_META[slug];
                                    const previewPosts = MOCK_POSTS[slug].filter((p) => !p.isNotice).slice(0, 5);
                                    return (
                                        <div
                                            key={slug}
                                            className="bg-surface-container-lowest border border-outline-variant rounded-md overflow-hidden"
                                        >
                                            <header className="px-3 py-2.5 border-b border-outline-variant flex items-center justify-between">
                                                <h3 className="text-body-sm font-bold">
                                                    {meta.emoji} {meta.name}
                                                </h3>
                                                <Link
                                                    href={`/board/${slug}`}
                                                    className="text-meta text-on-surface-variant hover:text-primary inline-flex items-center"
                                                >
                                                    더보기 <ChevronRight className="w-3 h-3" />
                                                </Link>
                                            </header>
                                            <ul className="divide-y divide-outline-variant">
                                                {previewPosts.map((p) => (
                                                    <li key={p.id}>
                                                        <Link
                                                            href={`/board/${slug}/${p.id}`}
                                                            className="block px-3 py-2 hover:bg-surface-container-low transition-colors"
                                                        >
                                                            <div className="text-body-sm truncate">{p.title}</div>
                                                            <div className="text-meta text-on-surface-variant mt-0.5">
                                                                {p.createdAt}
                                                                {p.commentCount && p.commentCount > 0 && (
                                                                    <span className="ml-2 text-primary">[{p.commentCount}]</span>
                                                                )}
                                                            </div>
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        {/* 코인룸 카드 */}
                        <section>
                            <h2 className="text-body-base font-bold mb-3">🪙 코인룸</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                                {COIN_ROOM_CARDS.map((slug) => {
                                    const c = COINS[slug];
                                    if (!c) return null;
                                    const isUp = c.changePct >= 0;
                                    return (
                                        <Link
                                            key={slug}
                                            href={`/coin/${slug}`}
                                            className="bg-surface-container-lowest border border-outline-variant rounded-md p-3 hover:border-primary hover:bg-surface-container-low transition-colors"
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <div
                                                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-meta font-bold"
                                                    style={{ backgroundColor: c.logoColor }}
                                                >
                                                    {c.logoEmoji ?? c.symbol.charAt(0)}
                                                </div>
                                                <span className="text-body-sm font-bold">{c.symbol}</span>
                                            </div>
                                            {c.price > 0 ? (
                                                <>
                                                    <div className="text-body-sm tabular-nums">${c.price.toLocaleString()}</div>
                                                    <div
                                                        className={cn(
                                                            "text-meta tabular-nums font-bold",
                                                            isUp ? "text-[var(--color-kr-up)]" : "text-[var(--color-kr-down)]"
                                                        )}
                                                    >
                                                        {isUp ? "▲" : "▼"} {Math.abs(c.changePct).toFixed(2)}%
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-meta text-on-surface-variant">{c.description}</div>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </section>
                    </div>

                    {/* Sidebar */}
                    <aside className="w-full lg:w-[300px] flex-shrink-0 space-y-4">
                        <PriceTickerWidget items={TICKER_LIST.slice(0, 8)} />
                        <HotIssueWidget items={HOT_ISSUES} />
                        <FngGaugeWidget value={72} prevValue={68} />
                        <OfficialPostsWidget posts={OFFICIAL_POSTS} />
                        <ToolsShortcutWidget />
                    </aside>
                </div>
            </div>
            <FooterSection />
        </main>
    );
}
