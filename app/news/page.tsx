"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import NewsHeadlineCard from "@/components/community/NewsHeadlineCard";
import NewsRow from "@/components/community/NewsRow";
import SidebarWidget from "@/components/community/SidebarWidget";
import PriceTickerWidget from "@/components/community/widgets/PriceTickerWidget";
import HotIssueWidget from "@/components/community/widgets/HotIssueWidget";
import FngGaugeWidget from "@/components/community/widgets/FngGaugeWidget";
import OfficialPostsWidget from "@/components/community/widgets/OfficialPostsWidget";
import FooterSection from "@/components/footer-section";
import {
    MOCK_NEWS,
    NEWS_CATEGORIES,
    COIN_FILTERS,
    getHeadlines,
} from "@/lib/community/mock-news";
import { TICKER_LIST, HOT_ISSUES, OFFICIAL_POSTS } from "@/lib/community/mock-coins";
import type { NewsSentiment } from "@/components/community/NewsHeadlineCard";
import { cn } from "@/lib/utils";

const SENTIMENT_FILTERS: { key: NewsSentiment | "all"; label: string; dotClass: string }[] = [
    { key: "all", label: "전체", dotClass: "bg-on-surface-variant" },
    { key: "positive", label: "🔴 호재", dotClass: "bg-[var(--color-positive)]" },
    { key: "negative", label: "🔵 악재", dotClass: "bg-[var(--color-negative)]" },
    { key: "mixed", label: "🟣 혼조", dotClass: "bg-[var(--color-mixed)]" },
    { key: "neutral", label: "⚪ 중립", dotClass: "bg-outline-variant" },
];

const SORTS = [
    { key: "latest", label: "최신순" },
    { key: "importance", label: "중요도순" },
    { key: "popular", label: "토론많은순" },
];

export default function NewsPage() {
    const [coinFilter, setCoinFilter] = useState("ALL");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [sentimentFilter, setSentimentFilter] = useState<NewsSentiment | "all">("all");
    const [sort, setSort] = useState<"latest" | "importance" | "popular">("latest");
    const [page, setPage] = useState(1);

    const headlines = useMemo(() => getHeadlines(), []);

    const filtered = useMemo(() => {
        let items = MOCK_NEWS.slice();
        if (coinFilter !== "ALL") {
            items = items.filter((n) => n.coinTag === coinFilter || (coinFilter === "ALL" && n.coinTag === "ALL"));
        }
        if (categoryFilter !== "all") {
            const labelMap = NEWS_CATEGORIES.reduce<Record<string, string>>((acc, c) => {
                acc[c.key] = c.label;
                return acc;
            }, {});
            items = items.filter((n) => n.category === labelMap[categoryFilter]);
        }
        if (sentimentFilter !== "all") {
            items = items.filter((n) => n.sentiment === sentimentFilter);
        }
        if (sort === "importance") items.sort((a, b) => (b.importance ?? 0) - (a.importance ?? 0));
        else if (sort === "popular") items.sort((a, b) => (b.commentCount ?? 0) - (a.commentCount ?? 0));
        return items;
    }, [coinFilter, categoryFilter, sentimentFilter, sort]);

    const PER_PAGE = 20;
    const pageItems = filtered.slice(0, page * PER_PAGE);
    const hasMore = pageItems.length < filtered.length;

    return (
        <main className="flex-1 bg-surface-container-low">
            <div className="max-w-[1200px] mx-auto px-4 lg:px-6 py-6">
                <nav className="text-meta text-on-surface-variant mb-3">
                    <Link href="/" className="hover:text-primary">홈</Link>
                    <span className="mx-1">›</span>
                    <span>뉴스</span>
                </nav>

                {/* 헤더 */}
                <header className="bg-surface-container-lowest border border-outline-variant rounded-md p-4 mb-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <h1 className="text-h2 mb-1">📰 뉴스 대시보드</h1>
                            <p className="text-body-sm text-on-surface-variant">
                                자동 분류 · 호재/악재 · 카테고리별 큐레이션 · 매 시간 갱신
                            </p>
                        </div>
                    </div>
                </header>

                <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1 min-w-0">
                        {/* 필터 바 */}
                        <div className="bg-surface-container-lowest border border-outline-variant rounded-md p-3 mb-4 space-y-2">
                            <FilterRow
                                label="코인"
                                items={COIN_FILTERS.map((c) => ({ key: c.key, label: c.label }))}
                                value={coinFilter}
                                onChange={setCoinFilter}
                            />
                            <FilterRow
                                label="분류"
                                items={NEWS_CATEGORIES.map((c) => ({ key: c.key, label: c.label }))}
                                value={categoryFilter}
                                onChange={setCategoryFilter}
                            />
                            <FilterRow
                                label="감정"
                                items={SENTIMENT_FILTERS.map((s) => ({ key: s.key, label: s.label }))}
                                value={sentimentFilter}
                                onChange={(k) => setSentimentFilter(k as typeof sentimentFilter)}
                            />
                            <div className="flex items-center gap-3 pt-2 border-t border-outline-variant">
                                <span className="text-meta font-bold text-on-surface-variant w-12 flex-shrink-0">정렬</span>
                                <div className="flex gap-2">
                                    {SORTS.map((s) => (
                                        <button
                                            key={s.key}
                                            onClick={() => setSort(s.key as typeof sort)}
                                            className={cn(
                                                "text-meta px-2 py-1 rounded transition-colors",
                                                sort === s.key
                                                    ? "bg-primary text-on-primary font-bold"
                                                    : "text-on-surface-variant hover:bg-surface-container"
                                            )}
                                        >
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 헤드라인 3개 */}
                        {headlines.length > 0 && (
                            <section className="mb-4">
                                <h2 className="text-body-base font-bold mb-3">오늘의 헤드라인</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {headlines.map((h) => (
                                        <NewsHeadlineCard key={h.id} item={h} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* 뉴스 표 */}
                        <section className="bg-surface-container-lowest border border-outline-variant rounded-md overflow-hidden">
                            <header className="px-4 py-2.5 border-b border-outline-variant flex items-center justify-between">
                                <h2 className="text-body-base font-bold">
                                    뉴스 ({filtered.length.toLocaleString()})
                                </h2>
                            </header>
                            <div className="divide-y divide-outline-variant">
                                {pageItems.length === 0 ? (
                                    <div className="py-12 text-center text-on-surface-variant text-body-sm">
                                        조건에 맞는 뉴스가 없습니다.{" "}
                                        <button
                                            onClick={() => {
                                                setCoinFilter("ALL");
                                                setCategoryFilter("all");
                                                setSentimentFilter("all");
                                            }}
                                            className="text-primary font-bold hover:underline"
                                        >
                                            필터 초기화
                                        </button>
                                    </div>
                                ) : (
                                    pageItems.map((n) => <NewsRow key={n.id} item={n} />)
                                )}
                            </div>
                            {hasMore && (
                                <div className="p-3 text-center border-t border-outline-variant">
                                    <button
                                        onClick={() => setPage((p) => p + 1)}
                                        className="text-body-sm text-primary font-bold hover:underline"
                                    >
                                        더 보기 ↓
                                    </button>
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Sidebar */}
                    <aside className="w-full lg:w-[300px] flex-shrink-0 space-y-4">
                        <PriceTickerWidget items={TICKER_LIST.slice(0, 6)} />
                        <HotIssueWidget items={HOT_ISSUES} />
                        <FngGaugeWidget value={72} prevValue={68} />

                        {/* 코인별 뉴스 랭킹 */}
                        <SidebarWidget title="📊 코인별 뉴스 (오늘)">
                            <ol className="space-y-1.5">
                                {[
                                    { coin: "BTC", count: 124 },
                                    { coin: "ETH", count: 87 },
                                    { coin: "SOL", count: 42 },
                                    { coin: "XRP", count: 31 },
                                    { coin: "ALT", count: 56 },
                                ].map((it, i) => (
                                    <li
                                        key={it.coin}
                                        className="flex items-center justify-between text-body-sm"
                                    >
                                        <span>
                                            <span className={cn("font-bold mr-2", i < 3 ? "text-primary" : "text-on-surface-variant")}>
                                                {i + 1}
                                            </span>
                                            {it.coin}
                                        </span>
                                        <span className="text-on-surface-variant tabular-nums">{it.count}건</span>
                                    </li>
                                ))}
                            </ol>
                        </SidebarWidget>

                        <OfficialPostsWidget posts={OFFICIAL_POSTS} />
                    </aside>
                </div>
            </div>
            <FooterSection />
        </main>
    );
}

interface FilterRowProps {
    label: string;
    items: { key: string; label: string }[];
    value: string;
    onChange: (v: string) => void;
}

function FilterRow({ label, items, value, onChange }: FilterRowProps) {
    return (
        <div className="flex items-center gap-3">
            <span className="text-meta font-bold text-on-surface-variant w-12 flex-shrink-0">{label}</span>
            <div className="flex flex-wrap gap-1.5">
                {items.map((it) => (
                    <button
                        key={it.key}
                        onClick={() => onChange(it.key)}
                        className={cn(
                            "text-meta px-2 py-1 rounded border transition-colors",
                            value === it.key
                                ? "bg-primary text-on-primary border-primary font-bold"
                                : "bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:border-primary"
                        )}
                    >
                        {it.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
