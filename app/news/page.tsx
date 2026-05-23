"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import NewsHeadlineCard from "@/components/community/NewsHeadlineCard";
import NewsRow from "@/components/community/NewsRow";
import SidebarWidget from "@/components/community/SidebarWidget";
import PriceTickerWidget, { type TickerItem } from "@/components/community/widgets/PriceTickerWidget";
import HotIssueWidget, { type HotIssue } from "@/components/community/widgets/HotIssueWidget";
import FngGaugeWidget from "@/components/community/widgets/FngGaugeWidget";
import OfficialPostsWidget, { type OfficialPost } from "@/components/community/widgets/OfficialPostsWidget";
import FooterSection from "@/components/footer-section";
// 라벨 사전만 유지 (데이터는 /api/news 실데이터로 전환 — R2/T02)
import { NEWS_CATEGORIES, COIN_FILTERS } from "@/lib/community/mock-news";
import {
    fetchNews,
    fetchTickerItems,
    fetchHotIssueItems,
    fetchFngData,
    fetchOfficialPosts,
    type NewsListItem,
    type FngData,
} from "@/lib/community/news-queries";
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

    // /api/news 실데이터 (코인·분류는 서버 위임, 감정·정렬은 아래 클라 처리)
    const [news, setNews] = useState<NewsListItem[]>([]);
    const [headlines, setHeadlines] = useState<NewsListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);

    // 사이드바 위젯 실데이터
    const [tickers, setTickers] = useState<TickerItem[]>([]);
    const [hotIssues, setHotIssues] = useState<HotIssue[]>([]);
    const [fng, setFng] = useState<FngData | null>(null);
    const [officialPosts, setOfficialPosts] = useState<OfficialPost[]>([]);

    // 뉴스 목록 — 코인/분류 변경 시 서버 재조회
    useEffect(() => {
        let alive = true;
        setLoading(true);
        setError(false);
        setPage(1);
        fetchNews({ coin: coinFilter, category: categoryFilter })
            .then((items) => {
                if (alive) setNews(items);
            })
            .catch(() => {
                if (alive) {
                    setError(true);
                    setNews([]);
                }
            })
            .finally(() => {
                if (alive) setLoading(false);
            });
        return () => {
            alive = false;
        };
    }, [coinFilter, categoryFilter, reloadKey]);

    // 헤드라인 3개 — 마운트 1회, 필터와 독립 (전체 중 중요도 상위)
    useEffect(() => {
        let alive = true;
        fetchNews({})
            .then((items) => {
                if (!alive) return;
                const top3 = [...items]
                    .sort((a, b) => (b.importance ?? 0) - (a.importance ?? 0))
                    .slice(0, 3);
                setHeadlines(top3);
            })
            .catch(() => {});
        return () => {
            alive = false;
        };
    }, []);

    // 사이드바 위젯 — 마운트 1회 병렬 fetch (각 fetch는 실패 시 빈 배열/null)
    useEffect(() => {
        let alive = true;
        Promise.all([
            fetchTickerItems(),
            fetchHotIssueItems(),
            fetchFngData(),
            fetchOfficialPosts(),
        ]).then(([t, h, f, o]) => {
            if (!alive) return;
            setTickers(t);
            setHotIssues(h);
            setFng(f);
            setOfficialPosts(o);
        });
        return () => {
            alive = false;
        };
    }, []);

    // 감정 필터 + 정렬 (클라 — /api/news 미지원 차원)
    const filtered = useMemo(() => {
        let items = news.slice();
        if (sentimentFilter !== "all") {
            items = items.filter((n) => n.sentiment === sentimentFilter);
        }
        if (sort === "importance" || sort === "popular") {
            // popular(토론많은순)는 뉴스별 토론 실데이터가 없어 중요도순으로 대체
            items.sort((a, b) => (b.importance ?? 0) - (a.importance ?? 0));
        }
        // latest는 /api/news가 pub_date desc로 반환한 순서를 그대로 유지
        return items;
    }, [news, sentimentFilter, sort]);

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
                                {loading ? (
                                    <div className="py-12 text-center text-on-surface-variant text-body-sm">
                                        뉴스를 불러오는 중…
                                    </div>
                                ) : error ? (
                                    <div className="py-12 text-center text-on-surface-variant text-body-sm">
                                        뉴스를 불러오지 못했습니다.{" "}
                                        <button
                                            onClick={() => setReloadKey((k) => k + 1)}
                                            className="text-primary font-bold hover:underline"
                                        >
                                            다시 시도
                                        </button>
                                    </div>
                                ) : pageItems.length === 0 ? (
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
                        <PriceTickerWidget items={tickers.slice(0, 6)} />
                        <HotIssueWidget items={hotIssues} />
                        {fng && <FngGaugeWidget value={fng.value} prevValue={fng.prevValue} />}

                        {/* 코인별 뉴스 랭킹 — 정적 데모 (집계 소스 없음, R2 후속 과제) */}
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

                        <OfficialPostsWidget posts={officialPosts} />
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
