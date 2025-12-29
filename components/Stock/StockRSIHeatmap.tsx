'use client';

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { calculateRSI } from '@/lib/indicators';
import { TOP_US_STOCKS } from '@/lib/constants';

type RSIItem = {
    symbol: string;
    rsi: number;
    price: number;
    change: number;
};

export const StockRSIHeatmap: React.FC = () => {
    const { lang } = useLanguage();
    const [data, setData] = useState<RSIItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAndCalc = async () => {
            const promises = TOP_US_STOCKS.map(async (stock) => {
                try {
                    const res = await fetch(`/api/stock/history?symbol=${stock.symbol}&interval=1d&limit=20`);
                    if (!res.ok) return null;
                    const json = await res.json();
                    if (!json || json.length < 2) return null;

                    const closes = json.map((d: any) => d.close);
                    const currentPrice = closes[closes.length - 1];
                    const prevPrice = closes[closes.length - 2];
                    const change = ((currentPrice - prevPrice) / prevPrice) * 100;

                    const rsiArr = calculateRSI(closes, 14);
                    const currentRSI = rsiArr[rsiArr.length - 1] || 50;

                    return { symbol: stock.symbol, rsi: currentRSI, price: currentPrice, change };
                } catch (e) {
                    console.error(e);
                    return null;
                }
            });

            const results = await Promise.all(promises);
            const validData = results.filter(r => r !== null) as RSIItem[];
            // Sort by RSI desc
            setData(validData.sort((a, b) => b.rsi - a.rsi));
            setLoading(false);
        };

        fetchAndCalc();
    }, []);

    const getRSIColor = (val: number) => {
        if (val >= 70) return 'bg-destructive';     // Overbought
        if (val >= 60) return 'bg-orange-500';
        if (val >= 40) return 'bg-card border border-border hover:bg-accent'; // Neutral
        if (val >= 30) return 'bg-teal-600';
        return 'bg-green-600';                  // Oversold
    };

    const getRSIText = (val: number) => {
        if (val >= 70) return lang === 'ko' ? '과매수' : 'Overbought';
        if (val <= 30) return lang === 'ko' ? '과매도' : 'Oversold';
        return lang === 'ko' ? '중립' : 'Neutral';
    };

    return (
        <div className="bg-card border border-border rounded-xl p-6 shadow-xl h-full">
            <div className="flex items-center gap-3 mb-6">
                <h3 className="text-xl font-bold text-foreground">🔥 {lang === 'ko' ? '주요 주식 RSI 히트맵' : 'Top Stocks RSI Heatmap'}</h3>
                <div className="flex gap-2 ml-auto">
                    <span className="px-2 py-1 bg-destructive rounded text-[10px] uppercase font-bold tracking-wider text-white">{lang === 'ko' ? '과열' : 'Hot'}</span>
                    <span className="px-2 py-1 bg-green-600 rounded text-[10px] uppercase font-bold tracking-wider text-white">{lang === 'ko' ? '침체' : 'Cold'}</span>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 animate-pulse">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="h-24 bg-muted rounded-xl"></div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {data.map((item) => (
                        <div
                            key={item.symbol}
                            className={`${getRSIColor(item.rsi)} p-3 rounded-lg flex flex-col items-center justify-center transition-transform hover:scale-105 shadow-sm min-h-[100px]`}
                        >
                            <span className="text-foreground font-bold text-sm">{item.symbol}</span>
                            <span className="text-foreground/90 text-xl font-black">{item.rsi.toFixed(0)}</span>
                            <div className="flex items-center gap-1 mt-1">
                                <span className="text-[10px] font-medium opacity-80 text-foreground">
                                    {getRSIText(item.rsi)}
                                </span>
                            </div>
                            <span className={`text-[10px] ${item.change >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                                {item.change > 0 ? '+' : ''}{item.change.toFixed(2)}%
                            </span>
                        </div>
                    ))}
                </div>
            )}
            <p className="text-muted-foreground text-xs mt-4 text-center">
                {lang === 'ko' ? 'RSI > 70: 과매수(매도 검토), RSI < 30: 과매도(매수 검토)' : 'RSI > 70: Overbought, RSI < 30: Oversold'}
            </p>
        </div>
    );
};
