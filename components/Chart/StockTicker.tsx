'use client';

import React, { useEffect, useState } from 'react';
import { getTwelveDataQuote, TwelveDataTicker } from '@/lib/api/twelvedata';

interface Props {
    symbol: string;
    lang: 'en' | 'ko';
}

export const StockTicker: React.FC<Props> = ({ symbol, lang }) => {
    const [data, setData] = useState<TwelveDataTicker | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isCancelled = false;

        const fetchTicker = async () => {
            const ticker = await getTwelveDataQuote(symbol);
            if (!isCancelled && ticker) {
                setData(ticker);
            }
            if (!isCancelled) setLoading(false);
        };

        fetchTicker();
        // Poll every 60 seconds (conservative for API limits)
        const intervalId = setInterval(fetchTicker, 60000);

        return () => {
            isCancelled = true;
            clearInterval(intervalId);
        };
    }, [symbol]);

    if (loading && !data) {
        return <div className="text-gray-400">{lang === 'ko' ? '로딩중...' : 'Loading...'}</div>;
    }

    if (!data) {
        return <div className="text-red-400">{lang === 'ko' ? '데이터 없음' : 'No Data'}</div>;
    }

    const isPositive = data.changePercent >= 0;
    const colorClass = isPositive ? 'text-green-500' : 'text-red-500';

    return (
        <div className="flex flex-col md:flex-row items-baseline md:items-center gap-2 md:gap-4 p-6 bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 shadow-xl min-w-[300px]">
            <h2 className="text-sm md:text-base font-medium text-gray-400">{data.symbol}</h2>
            <div className="flex items-center gap-3">
                <span className={`text-3xl md:text-4xl font-bold tracking-tight ${colorClass} drop-shadow-lg`}>
                    ${Number(data.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className={`px-2 py-0.5 rounded text-sm font-semibold ${isPositive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {isPositive ? '+' : ''}{data.changePercent.toFixed(2)}%
                </span>
            </div>
            <span className="text-xs text-gray-600 ml-auto md:ml-0 self-end md:self-center">
                (Delayed 15m)
            </span>
        </div>
    );
};
