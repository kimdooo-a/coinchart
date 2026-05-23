import Link from "next/link";
import { ChevronRight } from "lucide-react";
import BoardRow, { BoardTableHeader, type BoardPost } from "@/components/community/BoardRow";
import NewsRow from "@/components/community/NewsRow";
import type { NewsHeadlineItem } from "@/components/community/NewsHeadlineCard";
import PriceTickerWidget, {
    type TickerItem,
} from "@/components/community/widgets/PriceTickerWidget";
import HotIssueWidget, {
    type HotIssue,
    type HotIssueTrend,
} from "@/components/community/widgets/HotIssueWidget";
import FngGaugeWidget from "@/components/community/widgets/FngGaugeWidget";
import OfficialPostsWidget, {
    type OfficialPost,
} from "@/components/community/widgets/OfficialPostsWidget";
import ToolsShortcutWidget from "@/components/community/widgets/ToolsShortcutWidget";
import FooterSection from "@/components/footer-section";
import {
    fetchMainPageData,
    COIN_META,
    type MainBestPost,
    type MainNewsItem,
    type MainHotIssue,
    type MainOfficialPost,
} from "@/lib/community/queries";
import type { CoinTicker } from "@/types/coins";
import { cn } from "@/lib/utils";

// 5분 ISR (핫이슈 RPC·뉴스·게시글 캐시 정책과 정렬)
export const revalidate = 300;

const BOARD_PREVIEW_META: Record<string, { name: string; emoji: string }> = {
    free: { name: "자유게시판", emoji: "💬" },
    market: { name: "시세토론", emoji: "📈" },
    info: { name: "정보공유", emoji: "📚" },
};

const HOT_TREND_MAP: Record<MainHotIssue["trend"], HotIssueTrend> = {
    UP: "up",
    DOWN: "down",
    NEW: "new",
    FLAT: "same",
};

// ─── Main* → 컴포넌트 props 변환 헬퍼 (디자인 회귀 방지: 기존 JSX 계약 유지) ───

function toTickerItem(t: CoinTicker): TickerItem {
    const meta = COIN_META[t.baseSymbol];
    return {
        symbol: t.baseSymbol,
        name: meta?.nameKo ?? t.baseSymbol,
        price: t.price,
        changePct: t.changePct,
        href: meta?.href ?? `/coin/${t.baseSymbol.toLowerCase()}`,
    };
}

function toBoardPost(p: MainBestPost, index: number): BoardPost {
    return {
        id: index + 1,
        number: index + 1,
        title: p.title,
        author: p.authorName,
        // "211.34.*.*" → "211.34" (BoardRow가 (앞2옥텟.*.*)로 표시)
        authorIp: p.authorMasked ? p.authorMasked.replace(/\.\*\.\*$/, "") : undefined,
        createdAt: formatRelativeTime(p.createdAt),
        views: p.viewCount,
        likes: p.likeCount,
        commentCount: p.commentCount,
        isNotice: p.isNotice,
        isHot: p.isHot,
        category: p.category && p.category !== "전체" ? p.category : undefined,
    };
}

function toNewsItem(n: MainNewsItem): NewsHeadlineItem & { coinTag?: string } {
    return {
        id: n.id,
        title: n.title,
        summary: "",
        sentiment: n.sentiment,
        category: n.category,
        source: n.source ?? "출처 미상",
        timeLabel: formatRelativeTime(n.pubDate),
        importance: n.importance,
        link: n.link,
        discussionHref: "/board/info",
        coinTag: n.coinTag ?? undefined,
    };
}

function toHotIssue(h: MainHotIssue): HotIssue {
    return {
        rank: h.rank,
        keyword: COIN_META[h.symbol]?.nameKo ?? h.symbol,
        trend: HOT_TREND_MAP[h.trend],
        href: COIN_META[h.symbol]?.href,
    };
}

function toOfficialPost(o: MainOfficialPost): OfficialPost {
    return { slug: o.slug, title: o.title, date: o.createdAt.slice(0, 10) };
}

function formatRelativeTime(iso: string): string {
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return "";
    const diffMin = Math.floor((Date.now() - then) / 60000);
    if (diffMin < 1) return "방금 전";
    if (diffMin < 60) return `${diffMin}분전`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}시간전`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `${diffD}일전`;
    return `${Math.floor(diffD / 7)}주전`;
}

export default async function HomePage() {
    const data = await fetchMainPageData();

    const tickerItems = data.tickers.map(toTickerItem);
    const bestPosts = data.bestPosts;
    const latestNews = data.latestNews;

    return (
        <main className="flex-1 bg-surface-container-low">
            {/* 시세 스트립 */}
            <div className="bg-surface-container border-b border-outline-variant overflow-hidden">
                <div className="max-w-[1200px] mx-auto flex items-center h-9">
                    <div className="flex items-center overflow-x-auto no-scrollbar w-full">
                        <div className="flex items-center gap-6 px-4 ticker-scroll whitespace-nowrap">
                            {[...tickerItems, ...tickerItems].map((t, i) => {
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
                            {bestPosts.length > 0 ? (
                                <div className="divide-y divide-outline-variant">
                                    {bestPosts.map((p, i) => (
                                        <BoardRow
                                            key={p.id}
                                            post={toBoardPost(p, i)}
                                            href={`/board/${p.boardSlug}/${p.id}`}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="px-4 py-10 text-center text-body-sm text-on-surface-variant">
                                    아직 게시글이 없습니다. 첫 글을 작성해보세요!
                                </div>
                            )}
                        </section>

                        {/* 최신 뉴스 */}
                        <section className="bg-surface-container-lowest border border-outline-variant rounded-md overflow-hidden">
                            <header className="px-4 py-2.5 border-b border-outline-variant flex items-center justify-between">
                                <h2 className="text-body-base font-bold">📰 최신 뉴스</h2>
                                <Link href="/news" className="text-meta text-on-surface-variant hover:text-primary">
                                    더보기 ›
                                </Link>
                            </header>
                            {latestNews.length > 0 ? (
                                <div className="divide-y divide-outline-variant">
                                    {latestNews.map((n) => (
                                        <NewsRow key={n.id} item={toNewsItem(n)} />
                                    ))}
                                </div>
                            ) : (
                                <div className="px-4 py-10 text-center text-body-sm text-on-surface-variant">
                                    표시할 뉴스가 없습니다.
                                </div>
                            )}
                        </section>

                        {/* 게시판 미리보기 (3컬럼) */}
                        <section>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {data.boardPreviews.map(({ slug, posts }) => {
                                    const meta = BOARD_PREVIEW_META[slug];
                                    return (
                                        <div
                                            key={slug}
                                            className="bg-surface-container-lowest border border-outline-variant rounded-md overflow-hidden"
                                        >
                                            <header className="px-3 py-2.5 border-b border-outline-variant flex items-center justify-between">
                                                <h3 className="text-body-sm font-bold">
                                                    {meta?.emoji} {meta?.name}
                                                </h3>
                                                <Link
                                                    href={`/board/${slug}`}
                                                    className="text-meta text-on-surface-variant hover:text-primary inline-flex items-center"
                                                >
                                                    더보기 <ChevronRight className="w-3 h-3" />
                                                </Link>
                                            </header>
                                            {posts.length > 0 ? (
                                                <ul className="divide-y divide-outline-variant">
                                                    {posts.map((p) => (
                                                        <li key={p.id}>
                                                            <Link
                                                                href={`/board/${slug}/${p.id}`}
                                                                className="block px-3 py-2 hover:bg-surface-container-low transition-colors"
                                                            >
                                                                <div className="text-body-sm truncate">{p.title}</div>
                                                                <div className="text-meta text-on-surface-variant mt-0.5">
                                                                    {formatRelativeTime(p.createdAt)}
                                                                    {p.commentCount > 0 && (
                                                                        <span className="ml-2 text-primary">[{p.commentCount}]</span>
                                                                    )}
                                                                </div>
                                                            </Link>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <div className="px-3 py-6 text-center text-meta text-on-surface-variant">
                                                    아직 글이 없습니다
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        {/* 코인룸 카드 */}
                        <section>
                            <h2 className="text-body-base font-bold mb-3">🪙 코인룸</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                                {data.coinCards.map((c) => {
                                    const isUp = c.changePct >= 0;
                                    return (
                                        <Link
                                            key={c.slug}
                                            href={`/coin/${c.slug}`}
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
                        <PriceTickerWidget items={tickerItems.slice(0, 8)} />
                        <HotIssueWidget items={data.hotIssues.map(toHotIssue)} />
                        <FngGaugeWidget value={data.fng.value} prevValue={data.fng.prevValue} />
                        <OfficialPostsWidget posts={data.officialPosts.map(toOfficialPost)} />
                        <ToolsShortcutWidget />
                    </aside>
                </div>
            </div>
            <FooterSection />
        </main>
    );
}
