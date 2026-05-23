"use client";

import { use, useState, useEffect } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Activity } from "lucide-react";
import CoinHero from "@/components/community/CoinHero";
import CommunityTabs from "@/components/community/CommunityTabs";
import BoardRow, { BoardTableHeader } from "@/components/community/BoardRow";
import NewsRow from "@/components/community/NewsRow";
import SidebarWidget from "@/components/community/SidebarWidget";
import PriceTickerWidget from "@/components/community/widgets/PriceTickerWidget";
import HotIssueWidget from "@/components/community/widgets/HotIssueWidget";
import FngGaugeWidget from "@/components/community/widgets/FngGaugeWidget";
import OfficialPostsWidget from "@/components/community/widgets/OfficialPostsWidget";
import FooterSection from "@/components/footer-section";
import {
    getCoinRoomMeta,
    buildCoinView,
    fetchTickers,
    findTicker,
    toTickerItems,
    fetchCoinPosts,
    fetchCoinNews,
    fetchHotIssues,
    fetchFng,
    fetchOfficialPosts,
    type CoinBoardPost,
} from "@/lib/community/coin-queries";
import type { CoinTicker } from "@/types/coins";
import type { NewsHeadlineItem } from "@/components/community/NewsHeadlineCard";
import type { HotIssue } from "@/components/community/widgets/HotIssueWidget";
import type { OfficialPost } from "@/components/community/widgets/OfficialPostsWidget";
import type { FngView } from "@/lib/community/coin-queries";

const TABS = [
    { key: "all", label: "전체" },
    { key: "discussion", label: "💬 토론" },
    { key: "news", label: "📰 뉴스" },
    { key: "analysis", label: "📊 시세·분석" },
    { key: "notice", label: "📌 공지" },
];

type NewsItem = NewsHeadlineItem & { coinTag?: string };

interface CoinRoomData {
    symbol: string; // 데이터를 가져온 시점의 meta.slug
    tickers: CoinTicker[];
    posts: CoinBoardPost[];
    notices: CoinBoardPost[];
    news: NewsItem[];
    hotIssues: HotIssue[];
    fng: FngView | null;
    officialPosts: OfficialPost[];
}

export default function CoinRoomPage({
    params,
}: {
    params: Promise<{ symbol: string }>;
}) {
    const { symbol } = use(params);
    const meta = getCoinRoomMeta(symbol);
    if (!meta) notFound();

    const [activeTab, setActiveTab] = useState("all");

    // 실데이터 — 단일 상태 객체(symbol 포함)로 보관해 effect 내 동기 setState 회피.
    const [data, setData] = useState<CoinRoomData | null>(null);

    useEffect(() => {
        let alive = true;
        Promise.all([
            fetchTickers(),
            fetchCoinPosts(meta.boardSlug),
            fetchCoinNews(meta.coinTagFilter),
            fetchHotIssues(),
            fetchFng(),
            fetchOfficialPosts(),
        ]).then(([tk, pr, nw, hi, f, op]) => {
            if (!alive) return;
            setData({
                symbol: meta.slug,
                tickers: tk,
                posts: pr.posts,
                notices: pr.notices,
                news: nw,
                hotIssues: hi,
                fng: f,
                officialPosts: op,
            });
        });
        return () => {
            alive = false;
        };
    }, [meta.slug, meta.boardSlug, meta.coinTagFilter]);

    // 현재 symbol 데이터가 준비됐을 때만 사용(심볼 전환 시 이전 데이터 노출 방지)
    const ready = data && data.symbol === meta.slug ? data : null;
    const loading = ready === null;
    const tickers = ready?.tickers ?? [];
    const posts = ready?.posts ?? [];
    const notices = ready?.notices ?? [];
    const news = ready?.news ?? [];
    const hotIssues = ready?.hotIssues ?? [];
    const fng = ready?.fng ?? null;
    const officialPosts = ready?.officialPosts ?? [];

    // 정적 메타 + 실시세 병합 (집계형 altcoin/kimp는 ticker 미존재 → 정적 폴백)
    const coin = buildCoinView(meta, findTicker(tickers, meta.symbol));
    // 인기글: 추천수 상위 10 (실데이터 클라 정렬)
    const trending = [...posts].sort((a, b) => b.likes - a.likes).slice(0, 10);
    const tickerItems = toTickerItems(tickers).slice(0, 6);

    return (
        <main className="flex-1 bg-surface-container-low">
            <div className="max-w-[1200px] mx-auto px-4 lg:px-6 py-6">
                {/* 브레드크럼 */}
                <nav className="text-meta text-on-surface-variant mb-3">
                    <Link href="/" className="hover:text-primary">홈</Link>
                    <span className="mx-1">›</span>
                    <span>코인룸</span>
                    <span className="mx-1">›</span>
                    <span>{coin.symbol}</span>
                </nav>

                {/* 코인 히어로 */}
                <CoinHero
                    data={coin}
                    analysisHref={`/analysis/${coin.symbol.toLowerCase()}`}
                    writeHref={`/board/free/write?coin=${coin.symbol}`}
                    className="mb-4"
                />

                <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1 min-w-0">
                        {/* 탭 */}
                        <CommunityTabs
                            items={TABS}
                            activeKey={activeTab}
                            onChange={setActiveTab}
                            className="mb-5"
                        />

                        {activeTab === "all" && (
                            <>
                                {/* Trending 섹션 */}
                                <section className="bg-surface-container-lowest border border-outline-variant rounded-md mb-4 overflow-hidden">
                                    <header className="px-4 py-2.5 border-b border-outline-variant flex items-center justify-between">
                                        <h2 className="text-body-base font-bold">🔥 인기글 (오늘)</h2>
                                        <Link href={`/board/${meta.boardSlug}`} className="text-meta text-on-surface-variant hover:text-primary">
                                            더보기 ›
                                        </Link>
                                    </header>
                                    <BoardTableHeader />
                                    <div className="divide-y divide-outline-variant">
                                        {loading ? (
                                            <div className="py-12 text-center text-on-surface-variant text-body-sm">
                                                불러오는 중…
                                            </div>
                                        ) : trending.length === 0 ? (
                                            <div className="py-12 text-center text-on-surface-variant text-body-sm">
                                                아직 {coin.symbol} 관련 글이 없습니다.{" "}
                                                <Link href={`/board/free/write?coin=${coin.symbol}`} className="text-primary font-bold hover:underline">
                                                    첫 글을 작성해보세요 →
                                                </Link>
                                            </div>
                                        ) : (
                                            trending.map((p, i) => (
                                                <BoardRow
                                                    key={p.uuid}
                                                    post={{ ...p, number: i + 1 }}
                                                    href={`/board/${p.boardSlug}/${p.uuid}`}
                                                    compact
                                                />
                                            ))
                                        )}
                                    </div>
                                </section>

                                {/* 뉴스 섹션 */}
                                <section className="bg-surface-container-lowest border border-outline-variant rounded-md mb-4 overflow-hidden">
                                    <header className="px-4 py-2.5 border-b border-outline-variant flex items-center justify-between">
                                        <h2 className="text-body-base font-bold">📰 {coin.symbol} 뉴스</h2>
                                        <Link href={`/news?coin=${coin.symbol}`} className="text-meta text-on-surface-variant hover:text-primary">
                                            더보기 ›
                                        </Link>
                                    </header>
                                    <div className="divide-y divide-outline-variant">
                                        {loading ? (
                                            <div className="py-8 text-center text-on-surface-variant text-body-sm">
                                                불러오는 중…
                                            </div>
                                        ) : news.length === 0 ? (
                                            <div className="py-8 text-center text-on-surface-variant text-body-sm">
                                                관련 뉴스가 없습니다.
                                            </div>
                                        ) : (
                                            news.slice(0, 10).map((n) => <NewsRow key={n.id} item={n} />)
                                        )}
                                    </div>
                                </section>

                                {/* 토론 (최신) 섹션 */}
                                <section className="bg-surface-container-lowest border border-outline-variant rounded-md overflow-hidden">
                                    <header className="px-4 py-2.5 border-b border-outline-variant flex items-center justify-between">
                                        <h2 className="text-body-base font-bold">💬 최신 토론</h2>
                                        <Link href={`/board/${meta.boardSlug}`} className="text-meta text-on-surface-variant hover:text-primary">
                                            더보기 ›
                                        </Link>
                                    </header>
                                    <BoardTableHeader />
                                    <div className="divide-y divide-outline-variant">
                                        {loading ? (
                                            <div className="py-8 text-center text-on-surface-variant text-body-sm">
                                                불러오는 중…
                                            </div>
                                        ) : posts.length === 0 ? (
                                            <div className="py-8 text-center text-on-surface-variant text-body-sm">
                                                아직 글이 없습니다.
                                            </div>
                                        ) : (
                                            posts.slice(0, 20).map((p) => (
                                                <BoardRow
                                                    key={p.uuid}
                                                    post={p}
                                                    href={`/board/${p.boardSlug}/${p.uuid}`}
                                                    compact
                                                />
                                            ))
                                        )}
                                    </div>
                                </section>
                            </>
                        )}

                        {activeTab === "discussion" && (
                            <section className="bg-surface-container-lowest border border-outline-variant rounded-md overflow-hidden">
                                <BoardTableHeader />
                                <div className="divide-y divide-outline-variant">
                                    {loading ? (
                                        <div className="py-8 text-center text-on-surface-variant text-body-sm">불러오는 중…</div>
                                    ) : posts.length === 0 ? (
                                        <div className="py-8 text-center text-on-surface-variant text-body-sm">아직 글이 없습니다.</div>
                                    ) : (
                                        posts.map((p) => (
                                            <BoardRow key={p.uuid} post={p} href={`/board/${p.boardSlug}/${p.uuid}`} />
                                        ))
                                    )}
                                </div>
                            </section>
                        )}

                        {activeTab === "news" && (
                            <section className="bg-surface-container-lowest border border-outline-variant rounded-md overflow-hidden">
                                <div className="divide-y divide-outline-variant">
                                    {loading ? (
                                        <div className="py-8 text-center text-on-surface-variant text-body-sm">불러오는 중…</div>
                                    ) : news.length === 0 ? (
                                        <div className="py-8 text-center text-on-surface-variant text-body-sm">관련 뉴스가 없습니다.</div>
                                    ) : (
                                        news.map((n) => <NewsRow key={n.id} item={n} />)
                                    )}
                                </div>
                            </section>
                        )}

                        {activeTab === "analysis" && (
                            <section className="bg-surface-container-lowest border border-outline-variant rounded-md p-6 text-center">
                                <p className="text-body-base mb-3">전체 차트 분석은 도구 페이지에서 확인하세요.</p>
                                <Link
                                    href={`/analysis/${coin.symbol.toLowerCase()}`}
                                    className="inline-flex items-center gap-1 bg-primary text-on-primary text-label-bold px-4 py-2 rounded-md hover:bg-primary-container"
                                >
                                    📊 {coin.symbol} 차트 분석 보기
                                </Link>
                            </section>
                        )}

                        {activeTab === "notice" && (
                            <section className="bg-surface-container-lowest border border-outline-variant rounded-md overflow-hidden">
                                {loading ? (
                                    <div className="p-6 text-center text-on-surface-variant text-body-sm">불러오는 중…</div>
                                ) : notices.length === 0 ? (
                                    <div className="p-6 text-center text-on-surface-variant">현재 공지가 없습니다.</div>
                                ) : (
                                    <>
                                        <BoardTableHeader />
                                        <div className="divide-y divide-outline-variant">
                                            {notices.map((p) => (
                                                <BoardRow key={p.uuid} post={p} href={`/board/${p.boardSlug}/${p.uuid}`} />
                                            ))}
                                        </div>
                                    </>
                                )}
                            </section>
                        )}
                    </div>

                    {/* Sidebar */}
                    <aside className="w-full lg:w-[300px] flex-shrink-0 space-y-4">
                        {/* 코인 핵심 지표 */}
                        <SidebarWidget title={`${coin.symbol} 핵심 지표`}>
                            <table className="w-full text-body-sm">
                                <tbody className="divide-y divide-outline-variant">
                                    <tr>
                                        <td className="text-on-surface-variant py-1.5">현재가</td>
                                        <td className="text-right font-bold tabular-nums">
                                            ${coin.price.toLocaleString()}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-on-surface-variant py-1.5">24h</td>
                                        <td className={`text-right font-bold tabular-nums ${coin.changePct >= 0 ? "text-[var(--color-kr-up)]" : "text-[var(--color-kr-down)]"}`}>
                                            {coin.changePct >= 0 ? "+" : ""}
                                            {coin.changePct.toFixed(2)}%
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-on-surface-variant py-1.5">7d</td>
                                        <td className={`text-right font-bold tabular-nums ${coin.change7d >= 0 ? "text-[var(--color-kr-up)]" : "text-[var(--color-kr-down)]"}`}>
                                            {coin.change7d >= 0 ? "+" : ""}
                                            {coin.change7d.toFixed(2)}%
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-on-surface-variant py-1.5">30d</td>
                                        <td className={`text-right font-bold tabular-nums ${coin.change30d >= 0 ? "text-[var(--color-kr-up)]" : "text-[var(--color-kr-down)]"}`}>
                                            {coin.change30d >= 0 ? "+" : ""}
                                            {coin.change30d.toFixed(2)}%
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-on-surface-variant py-1.5">24h 고/저</td>
                                        <td className="text-right text-meta tabular-nums">
                                            ${coin.high24h.toLocaleString()} / ${coin.low24h.toLocaleString()}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-on-surface-variant py-1.5">시총</td>
                                        <td className="text-right font-bold tabular-nums">
                                            ${(coin.marketCapUsd / 1e9).toFixed(0)}B
                                        </td>
                                    </tr>
                                    {coin.dominance && (
                                        <tr>
                                            <td className="text-on-surface-variant py-1.5">도미넌스</td>
                                            <td className="text-right font-bold tabular-nums">{coin.dominance}%</td>
                                        </tr>
                                    )}
                                    {coin.circulatingSupply && (
                                        <tr>
                                            <td className="text-on-surface-variant py-1.5">유통량</td>
                                            <td className="text-right text-meta">{coin.circulatingSupply}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </SidebarWidget>

                        {/* AI 시그널 — 시그널 API 미연동(후속 트랙). 정적 placeholder */}
                        <SidebarWidget title="🤖 AI 차트 시그널">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-body-sm">
                                    <span className="text-on-surface-variant">시그널</span>
                                    <span className="text-[var(--color-positive)] font-bold">매수 권장</span>
                                </div>
                                <div className="flex items-center justify-between text-body-sm">
                                    <span className="text-on-surface-variant">신뢰도</span>
                                    <span className="font-bold">75%</span>
                                </div>
                                <div className="flex items-center justify-between text-body-sm">
                                    <span className="text-on-surface-variant">시장 상태</span>
                                    <span className="font-bold">강한 상승추세</span>
                                </div>
                                <Link
                                    href={`/analysis/${coin.symbol.toLowerCase()}`}
                                    className="mt-2 w-full inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-md bg-primary-fixed text-primary text-label-bold hover:bg-primary hover:text-on-primary transition-colors"
                                >
                                    <Activity className="w-3.5 h-3.5" />
                                    상세 분석 보기
                                </Link>
                            </div>
                        </SidebarWidget>

                        {tickerItems.length > 0 && <PriceTickerWidget items={tickerItems} />}
                        {fng && <FngGaugeWidget value={fng.value} label={fng.label} prevValue={fng.prevValue} />}
                        {hotIssues.length > 0 && <HotIssueWidget items={hotIssues.slice(0, 5)} />}
                        {officialPosts.length > 0 && <OfficialPostsWidget posts={officialPosts} />}
                    </aside>
                </div>
            </div>
            <FooterSection />
        </main>
    );
}
