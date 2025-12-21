'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import Link from 'next/link';
import { CryptoChart } from '@/components/Chart/CryptoChart';
import { Ticker } from '@/components/Chart/Ticker';
import { AnalysisPanel } from '@/components/Analysis/AnalysisPanel';
import { SUPPORTED_COINS } from '@/lib/constants';

export default function AnalysisPage() {
    const { lang } = useLanguage();

    // Default symbol based on type
    const [symbol, setSymbol] = useState('BTCUSDT');
    const [interval, setInterval] = useState('1d');

    // Indicator State
    const [showRSI, setShowRSI] = useState(false);
    const [showBB, setShowBB] = useState(false);
    const [showMACD, setShowMACD] = useState(false);
    const [showVolume, setShowVolume] = useState(false);
    const [showMA, setShowMA] = useState(false);

    const intervals = ['1m', '5m', '15m', '1h', '4h', '1d'];

    // Toggle Handler


    const t = {
        subtitle: lang === 'ko' ? '바이낸스 실시간 데이터' : 'Market Data by Binance',
        chartTitle: lang === 'ko' ? '차트' : 'Chart',
    };



    return (
        <main className="min-h-screen bg-black text-white p-4 md:p-8">
            {/* Spacer for GlobalHeader */}
            <div className="h-24 w-full" aria-hidden="true" />

            <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">

                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-800 pb-6 shadow-sm">
                    <div className="w-full">
                        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 bg-clip-text text-transparent flex items-center gap-2 drop-shadow-sm">
                            ❤️ 사랑하는 나의 마누라를 위해 ❤️
                        </h1>
                        <div className="text-sm text-gray-500 mt-1 font-medium">{t.subtitle}</div>
                    </div>
                </header>

                {/* Coin Selection Bar */}
                <section className="bg-gray-900/40 backdrop-blur-md p-4 rounded-2xl border border-gray-800 space-y-4 shadow-xl relative overflow-hidden">
                    {/* Glass Reflection Effect */}
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

                    <div className="flex flex-col items-start gap-3">
                        <div className="w-full">
                            <div className="flex gap-2 w-full overflow-x-auto no-scrollbar pb-1 justify-start">
                                {SUPPORTED_COINS.map(item => (
                                    <button
                                        key={item.symbol}
                                        onClick={() => setSymbol(item.symbol + 'USDT')}
                                        className={`flex-none min-w-[60px] text-xs md:text-sm px-3 py-2 rounded-lg border whitespace-nowrap transition-all duration-300 font-bold tracking-wide relative overflow-hidden group ${symbol === (item.symbol + 'USDT')
                                            ? 'bg-gradient-to-br from-blue-600 to-indigo-600 border-blue-400/50 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] scale-105'
                                            : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600 hover:bg-gray-800 hover:text-white'
                                            }`}
                                    >
                                        <span className="relative z-10">{item.symbol}</span>
                                        {/* Neon Glow Effect */}
                                        {symbol === (item.symbol + 'USDT') && (
                                            <div className="absolute inset-0 bg-blue-500/20 blur-sm rounded-lg"></div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Ticker Section */}
                <section>
                    <Ticker symbol={symbol} lang={lang} />
                </section>

                {/* Chart Section */}
                <section className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-4 md:p-6 shadow-2xl border border-gray-800 relative overflow-hidden">
                    {/* Decorative Gradient Background */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-50"></div>

                    <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">{symbol} {t.chartTitle}</h2>
                            <p className="text-xs text-gray-500 font-mono">Powered by Binance & Advanced AI</p>
                        </div>

                        <div className="flex flex-wrap gap-2 md:gap-4 items-center w-full md:w-auto">
                            {/* Interval Selector */}
                            <div className="flex bg-gray-800 rounded-lg p-1 gap-1 overflow-x-auto flex-1 md:flex-none no-scrollbar">
                                {intervals.map((int) => (
                                    <button
                                        key={int}
                                        onClick={() => setInterval(int)}
                                        className={`px-3 py-1 rounded text-xs md:text-sm font-medium transition-all whitespace-nowrap ${interval === int
                                            ? 'bg-blue-600 text-white shadow-lg'
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
                    <CryptoChart
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

                {/* Analysis Section */}
                <section>
                    <AnalysisPanel symbol={symbol} lang={lang} />
                </section>
            </div >
        </main >
    );
}
