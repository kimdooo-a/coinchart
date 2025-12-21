'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { StockTicker } from '@/components/Chart/StockTicker';
import { StockChart } from '@/components/Chart/StockChart';
import { TOP_US_STOCKS } from '@/lib/constants';

export default function StockAnalysisPage() {
    const { lang } = useLanguage();
    // Default symbol
    const [symbol, setSymbol] = useState('AAPL');
    const [interval, setInterval] = useState('1d');

    // Indicator State
    const [showRSI, setShowRSI] = useState(false);
    const [showBB, setShowBB] = useState(false);
    const [showMACD, setShowMACD] = useState(false);
    const [showVolume, setShowVolume] = useState(false);
    const [showMA, setShowMA] = useState(false);

    // Twelve Data intervals: Limit to Daily and Weekly as per new request
    const intervals = ['1d', '1w'];

    const t = {
        subtitle: lang === 'ko' ? '월가 프리미엄 데이터 (Twelve Data)' : 'Premium Market Data (Twelve Data)',
        chartTitle: lang === 'ko' ? '주가 차트' : 'Stock Chart',
        title: lang === 'ko' ? '🇺🇸 미국 주식 분석실' : '🇺🇸 US Stock Analysis'
    };

    return (
        <main className="min-h-screen bg-black text-white p-4 md:p-8">
            {/* Spacer for GlobalHeader */}
            <div className="h-24 w-full" aria-hidden="true" />

            <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">

                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-800 pb-6 shadow-sm">
                    <div className="w-full">
                        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2 drop-shadow-sm">
                            {t.title}
                        </h1>
                        <div className="text-sm text-gray-500 mt-1 font-medium">{t.subtitle}</div>
                    </div>
                </header>

                {/* Stock Selection Bar */}
                <section className="bg-gray-900/40 backdrop-blur-md p-4 rounded-2xl border border-gray-800 space-y-4 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

                    <div className="flex flex-col gap-2 w-full">
                        {/* Split into rows if many, or single scrollable row */}
                        <div className="flex gap-2 w-full overflow-x-auto no-scrollbar pb-1 justify-start">
                            {TOP_US_STOCKS.map(item => (
                                <button
                                    key={item.symbol}
                                    onClick={() => setSymbol(item.symbol)}
                                    className={`flex-none min-w-[60px] text-xs md:text-sm px-3 py-2 rounded-lg border whitespace-nowrap transition-all duration-300 font-bold tracking-wide relative overflow-hidden group ${symbol === item.symbol
                                        ? 'bg-gradient-to-br from-indigo-600 to-purple-600 border-indigo-400/50 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)] scale-105'
                                        : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600 hover:bg-gray-800 hover:text-white'
                                        }`}
                                >
                                    <span className="relative z-10">{item.symbol}</span>
                                    {symbol === item.symbol && (
                                        <div className="absolute inset-0 bg-indigo-500/20 blur-sm rounded-lg"></div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Ticker Section */}
                <section>
                    <StockTicker symbol={symbol} lang={lang} />
                </section>

                {/* Chart Section */}
                <section className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-4 md:p-6 shadow-2xl border border-gray-800 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 opacity-60"></div>

                    <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">{symbol} {t.chartTitle}</h2>
                            <p className="text-xs text-gray-500 font-mono">Market Data by Twelve Data</p>
                        </div>

                        <div className="flex flex-wrap gap-2 md:gap-4 items-center w-full md:w-auto">
                            {/* Interval Selector */}
                            <div className="flex bg-gray-800 rounded-lg p-1 gap-1 overflow-x-auto flex-1 md:flex-none no-scrollbar">
                                {intervals.map((int) => (
                                    <button
                                        key={int}
                                        onClick={() => setInterval(int)}
                                        className={`px-3 py-1 rounded text-xs md:text-sm font-medium transition-all whitespace-nowrap ${interval === int
                                            ? 'bg-indigo-600 text-white shadow-lg'
                                            : 'text-gray-400 hover:text-white hover:bg-gray-700'
                                            }`}
                                    >
                                        {int}
                                    </button>
                                ))}
                            </div>

                            {/* Indicator Toggles */}
                            <div className="flex flex-wrap bg-gray-800 rounded-lg p-1 gap-1">
                                <button onClick={() => setShowVolume(!showVolume)} className={`px-2 md:px-3 py-1 rounded text-xs md:text-sm font-medium transition-all ${showVolume ? 'bg-teal-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>Vol</button>
                                <button onClick={() => setShowMA(!showMA)} className={`px-2 md:px-3 py-1 rounded text-xs md:text-sm font-medium transition-all ${showMA ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>MA</button>
                                <button onClick={() => setShowBB(!showBB)} className={`px-2 md:px-3 py-1 rounded text-xs md:text-sm font-medium transition-all ${showBB ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>BB</button>
                                <button onClick={() => setShowRSI(!showRSI)} className={`px-2 md:px-3 py-1 rounded text-xs md:text-sm font-medium transition-all ${showRSI ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>RSI</button>
                                <button onClick={() => setShowMACD(!showMACD)} className={`px-2 md:px-3 py-1 rounded text-xs md:text-sm font-medium transition-all ${showMACD ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>MACD</button>
                            </div>
                        </div>
                    </div>
                    <StockChart
                        symbol={symbol}
                        interval={interval}
                        showRSI={showRSI}
                        showBB={showBB}
                        showMACD={showMACD}
                        showVolume={showVolume}
                        showMA={showMA}
                        lang={lang}
                    />
                </section>
            </div>
        </main>
    );
}
