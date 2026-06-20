// /news — 뉴스 대시보드 (R3/T03, 2026-05-24): 클라이언트 fetch → SSR 전환
//
// R2/T02에서 클라 fetch로 실데이터화됐던 페이지를 SEO 강화를 위해 async Server Component로 전환.
// 초기 목록·헤드라인·사이드바를 서버 렌더하고, 4차원 필터(코인/분류/감정/정렬)는 searchParams로
// 해석한다. 필터 UI만 클라이언트 하위 컴포넌트(NewsFilters)로 분리해 searchParams를 갱신한다.
// 데이터는 lib/community/news-server.ts(anon Supabase 직접 쿼리, 정적 ISR)가 담당한다.

import type { Metadata } from "next";
import Link from "next/link";
import NewsHeadlineCard from "@/components/community/NewsHeadlineCard";
import NewsRow from "@/components/community/NewsRow";
import SidebarWidget from "@/components/community/SidebarWidget";
import PriceTickerWidget from "@/components/community/widgets/PriceTickerWidget";
import HotIssueWidget from "@/components/community/widgets/HotIssueWidget";
import FngGaugeWidget from "@/components/community/widgets/FngGaugeWidget";
import OfficialPostsWidget from "@/components/community/widgets/OfficialPostsWidget";
import FooterSection from "@/components/footer-section";
import NewsFilters from "@/components/community/NewsFilters";
import { NEWS_CATEGORIES, COIN_FILTERS } from "@/lib/community/news-meta";
import {
    fetchNewsPageData,
    type NewsFilters as NewsFilterValues,
    type NewsSort,
} from "@/lib/community/news-server";
import type { NewsSentiment } from "@/components/community/NewsHeadlineCard";
import { cn } from "@/lib/utils";

// 5분 ISR (뉴스·핫이슈 RPC 캐시 정책과 정렬 — 메인페이지와 동일)
export const revalidate = 300;

// 허용 키 화이트리스트 — 잘못된 searchParams는 기본값으로 폴백
const COIN_KEYS = new Set(COIN_FILTERS.map((c) => c.key));
const CATEGORY_KEYS = new Set(NEWS_CATEGORIES.map((c) => c.key));
const SENTIMENT_KEYS = new Set<NewsSentiment | "all">([
    "all",
    "positive",
    "negative",
    "mixed",
    "neutral",
]);
const SORT_KEYS = new Set<NewsSort>(["latest", "importance", "popular"]);

type RawSearchParams = Record<string, string | string[] | undefined>;

function pick(sp: RawSearchParams, key: string): string | undefined {
    const v = sp[key];
    return Array.isArray(v) ? v[0] : v;
}

// searchParams → 검증된 NewsFilters
function parseFilters(sp: RawSearchParams): NewsFilterValues {
    const coin = pick(sp, "coin") ?? "ALL";
    const category = pick(sp, "category") ?? "all";
    const sentiment = (pick(sp, "sentiment") ?? "all") as NewsSentiment | "all";
    const sort = (pick(sp, "sort") ?? "latest") as NewsSort;
    const pageNum = parseInt(pick(sp, "page") ?? "1", 10);

    return {
        coin: COIN_KEYS.has(coin) ? coin : "ALL",
        category: CATEGORY_KEYS.has(category) ? category : "all",
        sentiment: SENTIMENT_KEYS.has(sentiment) ? sentiment : "all",
        sort: SORT_KEYS.has(sort) ? sort : "latest",
        page: Number.isFinite(pageNum) && pageNum >= 1 ? pageNum : 1,
    };
}

// 필터 보존 href 생성 ("더 보기"·"필터 초기화"용)
function buildHref(f: NewsFilterValues, page: number): string {
    const qs = new URLSearchParams();
    if (f.coin !== "ALL") qs.set("coin", f.coin);
    if (f.category !== "all") qs.set("category", f.category);
    if (f.sentiment !== "all") qs.set("sentiment", f.sentiment);
    if (f.sort !== "latest") qs.set("sort", f.sort);
    if (page > 1) qs.set("page", String(page));
    const s = qs.toString();
    return s ? `/news?${s}` : "/news";
}

interface PageProps {
    searchParams: Promise<RawSearchParams>;
}

// 필터(코인)를 반영한 SEO 메타 — canonical은 /news로 통합(중복 콘텐츠 방지)
export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
    const f = parseFilters(await searchParams);
    const coinLabel = COIN_FILTERS.find((c) => c.key === f.coin)?.label;
    const scoped = f.coin !== "ALL" && coinLabel;

    const title = scoped ? `${coinLabel} 뉴스` : "뉴스 대시보드";
    const description = scoped
        ? `${coinLabel} 관련 코인·시장 뉴스 큐레이션. 자동 분류·호재/악재 감정 분석·중요도순 정렬.`
        : "코인·주식 시장 뉴스 큐레이션. 자동 분류·호재/악재 감정 분석·카테고리별 큐레이션, 매 시간 갱신.";

    return {
        title,
        description,
        openGraph: { title, description, type: "website" },
        alternates: { canonical: "/news" },
    };
}

export default async function NewsPage({ searchParams }: PageProps) {
    const filters = parseFilters(await searchParams);
    const data = await fetchNewsPageData(filters);

    const hasMore = data.news.length < data.total;

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
                        {/* 필터 바 (클라이언트 하위 컴포넌트 — searchParams 갱신) */}
                        <NewsFilters
                            coin={filters.coin}
                            category={filters.category}
                            sentiment={filters.sentiment}
                            sort={filters.sort}
                        />

                        {/* 헤드라인 3개 */}
                        {data.headlines.length > 0 && (
                            <section className="mb-4">
                                <h2 className="text-body-base font-bold mb-3">오늘의 헤드라인</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {data.headlines.map((h) => (
                                        <NewsHeadlineCard key={h.id} item={h} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* 뉴스 표 */}
                        <section className="bg-surface-container-lowest border border-outline-variant rounded-md overflow-hidden">
                            <header className="px-4 py-2.5 border-b border-outline-variant flex items-center justify-between">
                                <h2 className="text-body-base font-bold">
                                    뉴스 ({data.total.toLocaleString()})
                                </h2>
                            </header>
                            <div className="divide-y divide-outline-variant">
                                {data.news.length === 0 ? (
                                    <div className="py-12 text-center text-on-surface-variant text-body-sm">
                                        조건에 맞는 뉴스가 없습니다.{" "}
                                        <Link
                                            href="/news"
                                            className="text-primary font-bold hover:underline"
                                        >
                                            필터 초기화
                                        </Link>
                                    </div>
                                ) : (
                                    data.news.map((n) => <NewsRow key={n.id} item={n} />)
                                )}
                            </div>
                            {hasMore && (
                                <div className="p-3 text-center border-t border-outline-variant">
                                    <Link
                                        href={buildHref(filters, filters.page + 1)}
                                        scroll={false}
                                        className="text-body-sm text-primary font-bold hover:underline"
                                    >
                                        더 보기 ↓
                                    </Link>
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Sidebar */}
                    <aside className="w-full lg:w-[300px] flex-shrink-0 space-y-4">
                        <PriceTickerWidget items={data.tickers.slice(0, 6)} />
                        <HotIssueWidget items={data.hotIssues} />
                        {data.fng && <FngGaugeWidget value={data.fng.value} prevValue={data.fng.prevValue} />}

                        {/* 코인별 뉴스 랭킹 — 오늘(KST) symbol 집계 실데이터 (R-C) */}
                        <SidebarWidget title="📊 코인별 뉴스 (오늘)">
                            {data.coinCounts.length === 0 ? (
                                <p className="text-body-sm text-on-surface-variant py-1">
                                    오늘 집계된 코인별 뉴스가 없습니다.
                                </p>
                            ) : (
                                <ol className="space-y-1.5">
                                    {data.coinCounts.map((it, i) => (
                                        <li
                                            key={it.symbol}
                                            className="flex items-center justify-between text-body-sm"
                                        >
                                            <span>
                                                <span className={cn("font-bold mr-2", i < 3 ? "text-primary" : "text-on-surface-variant")}>
                                                    {i + 1}
                                                </span>
                                                {it.symbol}
                                            </span>
                                            <span className="text-on-surface-variant tabular-nums">{it.count}건</span>
                                        </li>
                                    ))}
                                </ol>
                            )}
                        </SidebarWidget>

                        <OfficialPostsWidget posts={data.officialPosts} />
                    </aside>
                </div>
            </div>
            <FooterSection />
        </main>
    );
}
