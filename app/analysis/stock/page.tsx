'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import Link from 'next/link';

const SUPPORTED_STOCKS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'JPM'];

export default function StockAnalysisPage() {
    const { lang } = useLanguage();
    const [selectedStock, setSelectedStock] = useState('AAPL');

    const t = {
        title: lang === 'ko' ? '📈 미국 주식 분석' : '📈 US Stock Analysis',
        subtitle: lang === 'ko' ? 'TwelveData 기반 실시간 데이터' : 'Real-time Data by TwelveData',
        selectStock: lang === 'ko' ? '주식 선택:' : 'Select Stock:',
        analyze: lang === 'ko' ? '분석 보기' : 'View Analysis',
        noData: lang === 'ko' ? '데이터 준비 중...' : 'Preparing data...'
    };

    return (
        <main className="min-h-screen bg-black text-white p-4 md:p-8">
            {/* Spacer for GlobalHeader */}
            <div className="h-24 w-full" aria-hidden="true" />

            <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
                {/* Header */}
                <header className="border-b border-gray-800 pb-6">
                    <h1 className="text-3xl font-bold text-green-400">{t.title}</h1>
                    <p className="text-gray-500 mt-2">{t.subtitle}</p>
                </header>

                {/* Stock Selector */}
                <section className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                    <label className="block text-lg font-semibold mb-4">{t.selectStock}</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {SUPPORTED_STOCKS.map(stock => (
                            <button
                                key={stock}
                                onClick={() => setSelectedStock(stock)}
                                className={`p-3 rounded-lg font-bold transition ${
                                    selectedStock === stock
                                        ? 'bg-green-500 text-black'
                                        : 'bg-gray-800 text-white hover:bg-gray-700'
                                }`}
                            >
                                {stock}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Analysis Link */}
                <section className="flex justify-center">
                    <Link
                        href={`/analysis/stock/${selectedStock}`}
                        className="px-8 py-3 bg-green-500 text-black font-bold rounded-lg hover:bg-green-400 transition"
                    >
                        {t.analyze}
                    </Link>
                </section>

                {/* Info */}
                <section className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                    <p className="text-gray-400 text-sm">{t.noData}</p>
                </section>
            </div>
        </main>
    );
}