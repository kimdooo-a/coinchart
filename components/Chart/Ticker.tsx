'use client';

import React, { useEffect, useState } from 'react';
import { subscribeToTicker, TickerData } from '@/lib/api/binance';

interface Props {
    symbol: string;
    lang: 'en' | 'ko';
}

export const Ticker: React.FC<Props> = ({ symbol, lang }) => {
    const [data, setData] = useState<TickerData | null>(null);

    useEffect(() => {
        const unsubscribe = subscribeToTicker(symbol, (ticker) => {
            setData(ticker);
        });

        return () => unsubscribe();
    }, [symbol]);

    if (!data) {
        return <div className="text-on-surface-variant">{lang === 'ko' ? '로딩중...' : 'Loading...'}</div>;
    }

    const isPositive = data.changePercent >= 0;
    const colorClass = isPositive ? 'text-green-500' : 'text-red-500';

    return (
        <div className="flex flex-col md:flex-row items-baseline md:items-center gap-2 md:gap-4 p-6 bg-surface-container/60 backdrop-blur-sm rounded-2xl border border-outline-variant shadow-xl min-w-[300px]">
            <h2 className="text-sm md:text-base font-medium text-on-surface-variant">{data.symbol}</h2>
            <div className="flex items-center gap-3">
                <span className={`text-3xl md:text-4xl font-bold tracking-tight ${colorClass} drop-shadow-lg`}>
                    ${Number(data.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className={`px-2 py-0.5 rounded text-sm font-semibold ${isPositive ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                    {isPositive ? '+' : ''}{data.changePercent.toFixed(2)}%
                </span>
            </div>
        </div>
    );
};
