// /coin/[symbol] — 코인룸 (R3/T04, 2026-05-24): 클라이언트 fetch → SSR 전환
//
// R2/T03의 "use client" + coin-queries.ts 클라 fetch 구조를 async 서버 컴포넌트로 전환.
// 시세·게시글·뉴스·핫이슈·FNG·공식글을 서버에서 초기 fetch(lib/community/coin-server.ts,
// anon Supabase 직접 쿼리 + 5분 ISR)하여 렌더한다. 히어로·사이드바는 서버 렌더,
// 탭 전환 인터랙션만 클라 하위 컴포넌트(CoinRoomTabs)로 분리한다. JSX·디자인은 그대로 보존하고
// altcoin/kimp 집계형은 ticker 미존재 → 정적 폴백을 유지한다(buildCoinView). generateMetadata로 SEO.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Activity } from "lucide-react";
import CoinHero from "@/components/community/CoinHero";
import CoinRoomTabs from "@/components/community/CoinRoomTabs";
import SidebarWidget from "@/components/community/SidebarWidget";
import PriceTickerWidget from "@/components/community/widgets/PriceTickerWidget";
import HotIssueWidget from "@/components/community/widgets/HotIssueWidget";
import FngGaugeWidget from "@/components/community/widgets/FngGaugeWidget";
import OfficialPostsWidget from "@/components/community/widgets/OfficialPostsWidget";
import FooterSection from "@/components/footer-section";
import { getCoinRoomMeta, COIN_ROOM_SLUGS } from "@/lib/community/coin-queries";
import { fetchCoinRoomData } from "@/lib/community/coin-server";

// 5분 ISR (시세/핫이슈 캐시 정책과 정렬 — 메인페이지·/news와 동일)
export const revalidate = 300;

// 코인룸 6종(btc/eth/xrp/sol/altcoin/kimp)은 슬러그가 고정 → 빌드 시 프리렌더(SSG+ISR)로 SEO 강화.
// 목록 밖 슬러그는 notFound() 처리되므로 fallback은 허용하지 않는다(dynamicParams=false).
export const dynamicParams = false;
export function generateStaticParams() {
    return COIN_ROOM_SLUGS.map((symbol) => ({ symbol }));
}

// ─────────────────────────────────────────────────────────────
// SEO 메타 — 코인별 (집계형 altcoin/kimp 포함)
// ─────────────────────────────────────────────────────────────
export async function generateMetadata({
    params,
}: {
    params: Promise<{ symbol: string }>;
}): Promise<Metadata> {
    const { symbol } = await params;
    const meta = getCoinRoomMeta(symbol);
    if (!meta) return { title: "코인룸" };

    const title = `${meta.nameKo}(${meta.symbol}) 시세·뉴스·토론 - 코인 커뮤니티`;
    const description = meta.description;
    return {
        title,
        description,
        openGraph: { title, description, type: "website" },
        alternates: { canonical: `/coin/${meta.slug}` },
    };
}

// ─────────────────────────────────────────────────────────────
// 페이지
// ─────────────────────────────────────────────────────────────
export default async function CoinRoomPage({
    params,
}: {
    params: Promise<{ symbol: string }>;
}) {
    const { symbol } = await params;
    const meta = getCoinRoomMeta(symbol);
    if (!meta) notFound();

    const data = await fetchCoinRoomData(meta);
    const { coin, tickerItems, hotIssues, fng, officialPosts, analysisSignal } = data;

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
                        {/* 탭 + 탭 패널 (클라 인터랙션 — 이미 로드된 데이터 위 즉시 토글) */}
                        <CoinRoomTabs
                            symbol={coin.symbol}
                            boardSlug={meta.boardSlug}
                            posts={data.posts}
                            notices={data.notices}
                            trending={data.trending}
                            news={data.news}
                        />
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

                        {/* AI 시그널 — analyzeMarket 실데이터 (단일 코인만, altcoin/kimp는 숨김) */}
                        {analysisSignal ? (
                            <SidebarWidget title="🤖 AI 차트 시그널">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-body-sm">
                                        <span className="text-on-surface-variant">시그널</span>
                                        <span className={`font-bold ${
                                            analysisSignal.signal === '매수'
                                                ? 'text-[var(--color-positive)]'
                                                : analysisSignal.signal === '매도'
                                                ? 'text-[var(--color-negative)]'
                                                : 'text-on-surface'
                                        }`}>
                                            {analysisSignal.signal}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-body-sm">
                                        <span className="text-on-surface-variant">신뢰도</span>
                                        <span className="font-bold">{analysisSignal.confidence.toFixed(1)}%</span>
                                    </div>
                                    <div className="flex items-center justify-between text-body-sm">
                                        <span className="text-on-surface-variant">시장 상태</span>
                                        <span className="font-bold">{analysisSignal.marketState}</span>
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
                        ) : null}

                        {tickerItems.length > 0 && <PriceTickerWidget items={tickerItems} />}
                        {fng && <FngGaugeWidget value={fng.value} label={fng.label} prevValue={fng.prevValue} />}
                        {hotIssues.length > 0 && <HotIssueWidget items={hotIssues} />}
                        {officialPosts.length > 0 && <OfficialPostsWidget posts={officialPosts} />}
                    </aside>
                </div>
            </div>
            <FooterSection />
        </main>
    );
}
