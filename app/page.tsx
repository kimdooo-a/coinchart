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
import { createClient as createAnonClient } from "@supabase/supabase-js";
import { fetchCommunityTickers } from "@/lib/supabase/crypto";
import { fetchFng } from "@/lib/community/fng";
import {
    COIN_META,
    type MainPageData,
    type MainBestPost,
    type MainNewsItem,
    type MainCoinCard,
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

// ─── 메인 데이터 로더 (R2/T05): cookies 비의존 anon 클라이언트로 정적 ISR화 ───
// queries.ts의 fetchMainPageData()는 lib/supabase/server.ts의 createClient()(쿠키 의존)를
// 사용 → Next가 `/`를 동적(ƒ) 렌더로 처리(정적 ISR 비활성)한다. 메인페이지는 인증 불필요한
// 공개 읽기뿐이므로, 쿠키 없는 anon 클라이언트로 동일 쿼리를 수행하면 `/`가 정적 ISR(○)로
// prerender된다. (queries.ts는 R1 read-only이라 미수정 — 본 서버 컴포넌트 내에서 처리)
//   → 후속 정리: 지휘자가 queries.ts.fetchMainPageData()의 클라이언트만 anon으로 교체하면
//     본 로더를 제거하고 다시 단일 SSOT로 합칠 수 있다(handover §ISR 참조).
async function loadMainPageData(): Promise<MainPageData> {
    const supabase = createAnonClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: { persistSession: false, autoRefreshToken: false },
            // Supabase fetch를 Next ISR 캐시(5분)에 편입 → 페이지 정적 prerender 유지
            global: {
                fetch: (input: RequestInfo | URL, init?: RequestInit) =>
                    fetch(input, { ...init, next: { revalidate: 300 } } as RequestInit),
            },
        }
    );

    // 1. tickers (Binance) — 외부 API 실패 시 빈 배열 폴백
    const tickersP = fetchCommunityTickers().catch((e) => {
        console.error("[main] fetchCommunityTickers 실패:", e);
        return [] as CoinTicker[];
    });

    // 2. FNG — 외부 API 실패 시 null 폴백
    const fngP = fetchFng().catch((e) => {
        console.error("[main] fetchFng 실패:", e);
        return null;
    });

    // 3. 베스트 30 (공지 제외, 추천·조회 상위)
    const bestP = supabase
        .from("community_posts")
        .select(
            "id, board_slug, title, guest_nickname, guest_ip_masked, category, view_count, like_count, comment_count, is_notice, is_hot, created_at, author_id"
        )
        .eq("is_deleted", false)
        .eq("is_notice", false)
        .order("like_count", { ascending: false })
        .order("view_count", { ascending: false })
        .limit(30);

    // 4. 최신 뉴스 10
    const newsP = supabase
        .from("news")
        .select("id, title, link, source, pub_date, sentiment, category, importance_score, symbol")
        .order("pub_date", { ascending: false })
        .limit(10);

    // 5. 게시판 3컬럼 (free/market/info 각 5개, 공지 제외)
    const boardPreviewQuery = (slug: string) =>
        supabase
            .from("community_posts")
            .select("id, title, created_at, comment_count")
            .eq("board_slug", slug)
            .eq("is_deleted", false)
            .eq("is_notice", false)
            .order("created_at", { ascending: false })
            .limit(5);
    const freeP = boardPreviewQuery("free");
    const marketP = boardPreviewQuery("market");
    const infoP = boardPreviewQuery("info");

    // 6. 핫이슈 RPC (5분 캐시 STABLE 함수)
    const hotP = supabase.rpc("community_hot_issues", { hours_window: 24, result_limit: 10 });

    // 7. 공식글 (블로그 published 최근 3)
    const officialP = supabase
        .from("blog_posts")
        .select("id, title, slug, created_at")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(3);

    // 병렬 fetch — Supabase 쿼리는 throw하지 않고 { data, error } 반환,
    // 외부 API(tickers/fng)는 위에서 .catch로 격리했으므로 전체 페이지 500 방지.
    const [tickers, fng, bestRes, newsRes, freeRes, marketRes, infoRes, hotRes, officialRes] =
        await Promise.all([tickersP, fngP, bestP, newsP, freeP, marketP, infoP, hotP, officialP]);

    // 코인 카드 6장 — ticker 실데이터 + 브랜드 메타
    const wantedSymbols = ["BTCUSDT", "ETHUSDT", "XRPUSDT", "SOLUSDT"];
    const coinCards: MainCoinCard[] = wantedSymbols.map((sym) => {
        const base = sym.replace(/USDT$/, "");
        const meta = COIN_META[base];
        const t = tickers.find((x) => x.symbol === sym);
        return {
            slug: base.toLowerCase(),
            symbol: base,
            nameKo: meta?.nameKo ?? base,
            price: t?.price ?? 0,
            changePct: t?.changePct ?? 0,
            logoColor: meta?.logoColor ?? "#6B7280",
            logoEmoji: meta?.logoEmoji ?? base.charAt(0),
        };
    });
    // altcoin / kimp는 시세가 아닌 종합 지표 — price 0 + description으로 표현
    coinCards.push({
        slug: "altcoin",
        symbol: "ALT",
        nameKo: "알트코인",
        price: 0,
        changePct: 0,
        description: "주요 알트코인 종합",
        logoColor: "#6B7280",
        logoEmoji: "🌐",
    });
    coinCards.push({
        slug: "kimp",
        symbol: "KIMP",
        nameKo: "김치프리미엄",
        price: 0,
        changePct: 0,
        description: "김치프리미엄 지표",
        logoColor: "#BA1A1A",
        logoEmoji: "🇰🇷",
    });

    return {
        tickers,
        bestPosts: (bestRes.data ?? []).map(mapBestPost),
        latestNews: (newsRes.data ?? []).map(mapNews),
        boardPreviews: [
            { slug: "free", posts: (freeRes.data ?? []).map(mapBoardPreview) },
            { slug: "market", posts: (marketRes.data ?? []).map(mapBoardPreview) },
            { slug: "info", posts: (infoRes.data ?? []).map(mapBoardPreview) },
        ],
        coinCards,
        hotIssues: (hotRes.data ?? []).map(
            (h: { symbol: string; recent_count: number; trend: string }, i: number) => ({
                rank: i + 1,
                symbol: h.symbol,
                count: Number(h.recent_count),
                trend: h.trend as MainHotIssue["trend"],
            })
        ),
        fng: fng
            ? { value: fng.value, prevValue: fng.prevValue, classification: fng.classification }
            : { value: 50, classification: "Neutral" },
        officialPosts: (officialRes.data ?? []).map(mapOfficialPost),
    };
}

// ─── 행 매퍼 (snake_case DB → camelCase 도메인) — queries.ts와 동일 형상 ───

function mapBestPost(p: {
    id: string;
    board_slug: string;
    title: string;
    guest_nickname: string | null;
    guest_ip_masked: string | null;
    category: string;
    view_count: number;
    like_count: number;
    comment_count: number;
    is_notice: boolean;
    is_hot: boolean;
    created_at: string;
    author_id: string | null;
}): MainBestPost {
    return {
        id: p.id,
        boardSlug: p.board_slug,
        title: p.title,
        authorName: p.guest_nickname ?? "회원",
        authorMasked: p.guest_ip_masked ?? undefined,
        category: p.category,
        viewCount: p.view_count,
        likeCount: p.like_count,
        commentCount: p.comment_count,
        createdAt: p.created_at,
        isNotice: p.is_notice,
        isHot: p.is_hot,
    };
}

function mapNews(n: {
    id: string;
    title: string;
    link: string;
    source: string | null;
    pub_date: string;
    sentiment: string | null;
    category: string | null;
    importance_score: number | null;
    symbol: string | null;
}): MainNewsItem {
    return {
        id: n.id,
        title: n.title,
        link: n.link,
        source: n.source,
        pubDate: n.pub_date,
        sentiment: (n.sentiment ?? "neutral") as MainNewsItem["sentiment"],
        category: n.category ?? "market",
        importance: n.importance_score ?? 5,
        coinTag: n.symbol === "ALL" ? null : n.symbol,
    };
}

function mapBoardPreview(p: {
    id: string;
    title: string;
    created_at: string;
    comment_count: number;
}) {
    return { id: p.id, title: p.title, createdAt: p.created_at, commentCount: p.comment_count };
}

function mapOfficialPost(o: {
    id: string;
    title: string;
    slug: string;
    created_at: string;
}): MainOfficialPost {
    return { id: o.id, title: o.title, slug: o.slug, createdAt: o.created_at };
}

export default async function HomePage() {
    const data = await loadMainPageData();

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
