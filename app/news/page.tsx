'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { SUPPORTED_COINS, TOP_US_STOCKS } from '@/lib/constants';
import { useLanguage } from '@/context/LanguageContext';
import { TRANSLATIONS } from '@/lib/translations';

// ... (Types remain same) ...
type NewsItem = {
    title: string;
    link: string;
    pubDate: string;
    publisher: string;
    sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
    snippet: string;
};

export default function NewsPage() {
    const { lang } = useLanguage();
    const t = TRANSLATIONS[lang];
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCoin, setSelectedCoin] = useState('ALL');

    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const observerTarget = React.useRef(null);

    // Initial Load & Filter Change
    useEffect(() => {
        setNews([]);
        setPage(0);
        setHasMore(true);
        fetchNews(0, true);
    }, [selectedCoin, lang]);

    // Fetch Function
    const fetchNews = async (pageNum: number, isNewFilter: boolean) => {
        if (!isNewFilter && (loading || !hasMore)) return;

        setLoading(true);
        try {
            const query = selectedCoin === 'ALL' ? 'ALL' : selectedCoin;
            const res = await fetch(`/api/news?query=${query}&lang=${lang}&page=${pageNum}`);
            const data = await res.json();

            const newItems = data.items || [];

            if (newItems.length === 0) {
                setHasMore(false);
            } else {
                setNews(prev => isNewFilter ? newItems : [...prev, ...newItems]);
                // If we got fewer items than page size (20), it's the end
                if (newItems.length < 20) setHasMore(false);
            }
        } catch (error) {
            console.error('Failed to fetch news:', error);
        } finally {
            setLoading(false);
        }
    };

    // Infinite Scroll Observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore && !loading) {
                    setPage(prev => {
                        const nextPage = prev + 1;
                        fetchNews(nextPage, false);
                        return nextPage;
                    });
                }
            },
            { threshold: 1.0 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current);
            }
        };
    }, [hasMore, loading]);

    const getSentimentColor = (sentiment: string) => {
        switch (sentiment) {
            case 'positive': return 'bg-red-900/40 text-red-200 border-red-700';
            case 'negative': return 'bg-blue-900/40 text-blue-200 border-blue-700';
            case 'mixed': return 'bg-purple-900/40 text-purple-200 border-purple-700';
            default: return 'bg-gray-800 text-gray-400 border-gray-700';
        }
    };

    const getSentimentLabel = (sentiment: string) => {
        if (lang === 'en') {
            switch (sentiment) {
                case 'positive': return '🔥 Bullish';
                case 'negative': return '❄️ Bearish';
                case 'mixed': return '⚠️ Mixed';
                default: return '😐 Neutral';
            }
        }
        switch (sentiment) {
            case 'positive': return '🔥 호재 (Bullish)';
            case 'negative': return '❄️ 악재 (Bearish)';
            case 'mixed': return '⚠️ 혼조세 (Mixed)';
            default: return '😐 중립 (Neutral)';
        }
    };

    return (
        <main className="flex-1 w-full pt-20 pb-12 px-4 md:px-6 flex flex-col items-center">

            <header className="w-full max-w-4xl mb-8 flex flex-col gap-4 border-b border-gray-800 pb-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">📰 {t.news.title}</h2>
                </div>

                {/* Filter Chips */}
                <div className="flex flex-col gap-3">
                    {/* Top Row: All + Coins */}
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        <button
                            onClick={() => setSelectedCoin('ALL')}
                            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${selectedCoin === 'ALL'
                                ? 'bg-white text-black border-white'
                                : 'bg-gray-900 text-gray-400 border-gray-700 hover:border-gray-500'
                                }`}
                        >
                            {t.news.all}
                        </button>
                        {SUPPORTED_COINS.map((coin) => (
                            <button
                                key={coin.symbol}
                                onClick={() => setSelectedCoin(coin.symbol)}
                                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${selectedCoin === coin.symbol
                                    ? 'bg-blue-600 text-white border-blue-500'
                                    : 'bg-gray-900 text-gray-400 border-gray-700 hover:border-gray-500'
                                    }`}
                            >
                                {coin.name}
                            </button>
                        ))}
                    </div>

                    {/* Bottom Row: Stocks */}
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        <span className="text-xs text-gray-500 flex items-center px-2 font-bold">STOCKS:</span>
                        {TOP_US_STOCKS.map((stock) => (
                            <button
                                key={stock.symbol}
                                onClick={() => setSelectedCoin(stock.symbol)}
                                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${selectedCoin === stock.symbol
                                    ? 'bg-green-600 text-white border-green-500'
                                    : 'bg-gray-900 text-gray-400 border-gray-700 hover:border-gray-500'
                                    }`}
                            >
                                {stock.symbol}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <div className="w-full max-w-4xl space-y-4">
                {loading ? (
                    // Skeleton Loading
                    [...Array(3)].map((_, i) => (
                        <div key={i} className="bg-gray-900 border border-gray-800 p-6 rounded-2xl animate-pulse h-32"></div>
                    ))
                ) : news.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <p>{t.news.noNews}</p>
                    </div>
                ) : (
                    news.map((item, index) => (
                        <a
                            key={index}
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block bg-gray-900 border border-gray-800 p-6 rounded-2xl hover:border-gray-600 transition-all hover:bg-gray-800 group"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs text-gray-500 font-mono">{new Date(item.pubDate).toLocaleString()} • {item.publisher}</span>
                                <span className={`text-xs px-2 py-1 rounded-full border ${getSentimentColor(item.sentiment)}`}>
                                    {getSentimentLabel(item.sentiment)}
                                </span>
                            </div>
                            <h3 className="text-lg md:text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors">
                                {item.title}
                            </h3>
                            <p className="text-gray-400 text-sm line-clamp-2">
                                {item.snippet}
                            </p>
                        </a>
                    ))
                )}


                {/* Scroll Target & End Message */}
                {!loading && hasMore && <div ref={observerTarget} className="h-10 w-full" />}

                {/* Loading Spinner for Infinite Scroll */}
                {loading && news.length > 0 && (
                    <div className="flex justify-center p-4">
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}

                {/* End of List Message */}
                {!hasMore && news.length > 0 && (
                    <div className="text-center py-8 text-gray-500 text-sm font-medium border-t border-gray-800 mt-8">
                        {t.news.noMoreNews || "No more news to load / 더 이상 불러올 뉴스가 없습니다."}
                    </div>
                )}
            </div>

            <div className="mt-8 text-center text-xs text-gray-600">
                {t.news.footer}
            </div>
        </main>
    );
}
