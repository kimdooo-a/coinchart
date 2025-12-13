'use client';

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { calculateRSI } from '@/lib/indicators';

const TARGET_COINS = [
    'BTC', 'ETH', 'SOL', 'XRP', 'BCH', 'DOGE',
    'ADA', 'AVAX', 'TRX', 'SHIB', 'DOT', 'LINK',
    'MATIC', 'LTC', 'ETC', 'NEAR'
];

type RSIItem = {
    symbol: string;
    rsi: number;
};

export default function RSIHeatmap() {
    const { lang } = useLanguage();
    const [data, setData] = useState<RSIItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAndCalc = async () => {
            try {
                const promises = TARGET_COINS.map(async (coin) => {
                    const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${coin}USDT&interval=4h&limit=20`);
                    const json = await res.json();
                    // Binance kline: [time, open, high, low, close, vol, ...]
                    // Index 4 is close
                    const closes = json.map((k: any) => parseFloat(k[4]));
                    const rsiArr = calculateRSI(closes, 14);
                    // Get last valid RSI
                    const currentRSI = rsiArr[rsiArr.length - 1] || 50;
                    return { symbol: coin, rsi: currentRSI };
                });

                const results = await Promise.all(promises);
                // Sort by RSI desc
                setData(results.sort((a, b) => b.rsi - a.rsi));
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchAndCalc();
    }, []);

    const getRSIColor = (val: number) => {
        if (val >= 70) return 'bg-red-600';     // Overbought
        if (val >= 60) return 'bg-orange-500';
        if (val >= 40) return 'bg-gray-600';    // Neutral
        if (val >= 30) return 'bg-teal-600';
        return 'bg-green-600';                  // Oversold
    };

    const getRSIText = (val: number) => {
        if (val >= 70) return lang === 'ko' ? '과매수' : 'Overbought';
        if (val <= 30) return lang === 'ko' ? '과매도' : 'Oversold';
        return lang === 'ko' ? '중립' : 'Neutral';
    };

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 md:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
                <h3 className="text-xl md:text-2xl font-bold text-white">🔥 RSI Heatmap (4H)</h3>
                <div className="flex gap-2 text-xs">
                    <span className="px-2 py-1 bg-red-600 rounded text-white">{lang === 'ko' ? '과열' : 'Hot'}</span>
                    <span className="px-2 py-1 bg-green-600 rounded text-white">{lang === 'ko' ? '침체' : 'Cold'}</span>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="h-24 bg-gray-800 rounded-xl"></div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {data.map((item) => (
                        <div
                            key={item.symbol}
                            className={`${getRSIColor(item.rsi)} p-4 rounded-xl flex flex-col items-center justify-center transition-transform hover:scale-105 shadow-lg border border-white/10`}
                        >
                            <span className="text-white font-bold text-lg drop-shadow-md">{item.symbol}</span>
                            <span className="text-white/90 text-2xl font-black drop-shadow-md">{item.rsi.toFixed(0)}</span>
                            <span className="text-white/70 text-xs mt-1 font-medium bg-black/20 px-2 py-0.5 rounded">
                                {getRSIText(item.rsi)}
                            </span>
                        </div>
                    ))}
                </div>
            )}
            <p className="text-gray-500 text-xs mt-4 text-center">
                {lang === 'ko' ? 'RSI가 70 이상이면 매도 고려, 30 이하이면 매수 고려 구간입니다.' : 'RSI > 70: Potentially Overbought. RSI < 30: Potentially Oversold.'}
            </p>
        </div>
    );
}
