'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import Link from 'next/link';
// CRYPTO ANALYSIS ONLY - DO NOT ADD STOCK IMPORTS
// import { CryptoChart } from '@/components/Chart/CryptoChart'; // REMOVED for SSOT
import { DetailedChart } from '@/components/DetailedChart'; // SSOT Compliant
import { Ticker } from '@/components/Chart/Ticker';
import { AnalysisPanel } from '@/components/Analysis/AnalysisPanel';
import { ChartAnalysisPanel } from '@/components/Analysis/ChartAnalysisPanel';
import { InvestmentQuotes } from '@/components/Stock/InvestmentQuotes';
import { SUPPORTED_COINS } from '@/lib/constants';
import { Disclaimer } from '@/components/Common/Disclaimer';

/**
 * CRYPTO ANALYSIS DASHBOARD
 * Source: Supabase market_prices (SSOT)
 * For Stock Analysis, see /analysis/stock
 */
export default function AnalysisPage() {
    const { lang } = useLanguage();

    // Default symbol based on type
    const [symbol, setSymbol] = useState('BTCUSDT');
    const [interval, setInterval] = useState('1d');
    const [historyData, setHistoryData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Indicator State (Visual only for DetailedChart if supported, currently DetailedChart is simple)
    // DetailedChart is simple candle chart. Indicators are not fully supported props yet but that's fine for SSOT goal.
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

    // Fetch Binance Data for Chart via API Route
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Use API Route to fetch from Binance (same as /market page)
                const res = await fetch(`/api/klines?symbol=${symbol}&interval=1d&limit=990`);
                if (!res.ok) throw new Error('Failed to fetch klines');
                const data = await res.json();

                // Format for DetailedChart (time as YYYY-MM-DD string)
                const formatted = data.map((d: any) => ({
                    time: new Date(d.time * 1000).toISOString().split('T')[0],
                    open: d.open,
                    high: d.high,
                    low: d.low,
                    close: d.close,
                    volume: d.volume
                }));

                setHistoryData(formatted);
            } catch (error) {
                console.error('Failed to fetch chart data:', error);
                setHistoryData([]);
            }
            setIsLoading(false);
        };

        fetchData();
    }, [symbol]);

    return (
        <main className="flex-1 w-full pt-20 pb-12 px-4 md:px-6">
            <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">

                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border pb-6 shadow-sm">
                    <div className="w-full">
                        <h1 className="text-2xl md:text-3xl font-bold text-primary flex items-center gap-2 drop-shadow-sm">
                            ❤️ 사랑하는 나의 마누라를 위해 ❤️
                        </h1>
                        <div className="text-sm text-muted-foreground mt-1 font-medium">{t.subtitle}</div>
                    </div>
                </header>

                {/* Coin Selection Bar */}
                <section className="bg-card/40 backdrop-blur-md p-4 rounded-2xl border border-border space-y-4 shadow-xl relative overflow-hidden">
                    {/* Glass Reflection Effect */}
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

                    <div className="flex flex-col items-start gap-3">
                        <div className="w-full">
                            <div className="flex flex-wrap gap-2 w-full justify-start">
                                {SUPPORTED_COINS.map(item => (
                                    <button
                                        key={item.symbol}
                                        onClick={() => setSymbol(item.symbol + 'USDT')}
                                        className={`flex-none text-xs md:text-sm px-4 py-2 rounded-lg border whitespace-nowrap transition-all duration-300 font-bold tracking-wide relative overflow-hidden group ${symbol === (item.symbol + 'USDT')
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
                <section className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-4 md:p-6 shadow-2xl border border-gray-800 relative overflow-hidden w-full h-[60vh] min-h-[400px] max-h-[700px] flex flex-col">
                    {/* Decorative Gradient Background */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-50"></div>

                    <div className="mb-4 flex-none flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">{symbol} {t.chartTitle} (Snapshot)</h2>
                            <p className="text-xs text-gray-500 font-mono">Powered by Supabase DB (SSOT) & Advanced Algorithm</p>
                        </div>
                    </div>

                    <div className="flex-1 w-full min-h-0 relative">
                        {isLoading ? (
                            <div className="w-full h-full flex items-center justify-center text-gray-500 animate-pulse bg-gray-900 rounded-xl">
                                Loading Chart...
                            </div>
                        ) : historyData.length === 0 ? (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 bg-gray-900 rounded-xl space-y-2">
                                <span className="text-4xl">📉</span>
                                <span className="font-bold">No Chart Data Available</span>
                                <span className="text-xs">Database has no records for {symbol}</span>
                            </div>
                        ) : (
                            <DetailedChart
                                data={historyData}
                                symbol={symbol}
                            // DetailedChart currently doesn't support extensive indicators props like showRSI yet
                            // but matches the SSOT requirement.
                            />
                        )}
                    </div>
                </section>

                {/* Quotes Section */}
                <section>
                    <InvestmentQuotes />
                </section>

                {/* Analysis Section */}
                <section>
                    <Disclaimer />
                    <AnalysisPanel symbol={symbol} lang={lang} />
                </section>

                {/* Detailed Text Analysis Section */}
                <section>
                    <ChartAnalysisPanel symbol={symbol} lang={lang} />
                </section>
            </div >
        </main >
    );
}
