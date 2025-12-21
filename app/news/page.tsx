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

    useEffect(() => {
        const fetchNews = async () => {
            setLoading(true);
            try {
                // Pass selectedCoin as query param. 
                const query = selectedCoin === 'ALL' ? 'ALL' : selectedCoin;

                // User Request: Strict separation. 
                // ko -> ko only
                // en -> en only
                const targetLang = lang;

                const res = await fetch(`/api/news?query=${query}&lang=${targetLang}`);
                const data = await res.json();
                setNews(data.items || []);
            } catch (error) {
                console.error('Failed to fetch news:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
    }, [selectedCoin, lang]); // Refetch when lang changes

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
        <main className="min-h-screen bg-black text-white p-4 md:p-8 flex flex-col items-center">
            {/* Spacer for GlobalHeader */}
            <div className="h-24 w-full" aria-hidden="true" />

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
            </div>

            <div className="mt-8 text-center text-xs text-gray-600">
                {t.news.footer}
            </div>
        </main>
    );
}
