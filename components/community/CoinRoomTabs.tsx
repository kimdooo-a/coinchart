"use client";

// 코인룸 메인 컬럼 탭 인터랙션 (R3/T04, 2026-05-24)
//
// /coin/[symbol] SSR 전환 시, 서버에서 fetch한 데이터를 props로 받아 탭 전환만 클라에서 처리한다.
// (탭 전환은 이미 로드된 데이터 위 즉시 토글 — 재fetch 없음. 디자인·JSX는 R2/T03 그대로 보존.)
// 데이터 로딩은 서버(lib/community/coin-server.ts)가 담당하므로 "불러오는 중…" 상태는 없다.

import { useState } from "react";
import Link from "next/link";
import CommunityTabs from "@/components/community/CommunityTabs";
import BoardRow, { BoardTableHeader } from "@/components/community/BoardRow";
import NewsRow from "@/components/community/NewsRow";
import type { CoinBoardPost, CoinNewsItem } from "@/lib/community/coin-queries";

const TABS = [
    { key: "all", label: "전체" },
    { key: "discussion", label: "💬 토론" },
    { key: "news", label: "📰 뉴스" },
    { key: "analysis", label: "📊 시세·분석" },
    { key: "notice", label: "📌 공지" },
];

interface CoinRoomTabsProps {
    symbol: string; // BTC 등 (라벨·링크용)
    boardSlug: string; // coin-btc 등
    posts: CoinBoardPost[];
    notices: CoinBoardPost[];
    trending: CoinBoardPost[];
    news: CoinNewsItem[];
}

export default function CoinRoomTabs({
    symbol,
    boardSlug,
    posts,
    notices,
    trending,
    news,
}: CoinRoomTabsProps) {
    const [activeTab, setActiveTab] = useState("all");

    return (
        <>
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
                            <Link href={`/board/${boardSlug}`} className="text-meta text-on-surface-variant hover:text-primary">
                                더보기 ›
                            </Link>
                        </header>
                        <BoardTableHeader />
                        <div className="divide-y divide-outline-variant">
                            {trending.length === 0 ? (
                                <div className="py-12 text-center text-on-surface-variant text-body-sm">
                                    아직 {symbol} 관련 글이 없습니다.{" "}
                                    <Link href={`/board/free/write?coin=${symbol}`} className="text-primary font-bold hover:underline">
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
                            <h2 className="text-body-base font-bold">📰 {symbol} 뉴스</h2>
                            <Link href={`/news?coin=${symbol}`} className="text-meta text-on-surface-variant hover:text-primary">
                                더보기 ›
                            </Link>
                        </header>
                        <div className="divide-y divide-outline-variant">
                            {news.length === 0 ? (
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
                            <Link href={`/board/${boardSlug}`} className="text-meta text-on-surface-variant hover:text-primary">
                                더보기 ›
                            </Link>
                        </header>
                        <BoardTableHeader />
                        <div className="divide-y divide-outline-variant">
                            {posts.length === 0 ? (
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
                        {posts.length === 0 ? (
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
                        {news.length === 0 ? (
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
                        href={`/analysis/${symbol.toLowerCase()}`}
                        className="inline-flex items-center gap-1 bg-primary text-on-primary text-label-bold px-4 py-2 rounded-md hover:bg-primary-container"
                    >
                        📊 {symbol} 차트 분석 보기
                    </Link>
                </section>
            )}

            {activeTab === "notice" && (
                <section className="bg-surface-container-lowest border border-outline-variant rounded-md overflow-hidden">
                    {notices.length === 0 ? (
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
        </>
    );
}
