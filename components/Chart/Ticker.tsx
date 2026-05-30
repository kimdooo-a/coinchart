'use client';

import React, { useEffect, useState } from 'react';
import { subscribeToTicker, TickerData } from '@/lib/api/binance';
import { useDisplaySettings } from '@/lib/config/display-settings';

interface Props {
    symbol: string;
    lang: 'en' | 'ko';
}

export const Ticker: React.FC<Props> = ({ symbol, lang }) => {
    const [data, setData] = useState<TickerData | null>(null);
    // 표시 환경설정 구독 (R13 / T-A2) — 통화(USD↔KRW)·등락 색(한국식↔글로벌) 전역 전환.
    // crypto는 USDT 페어이므로 price는 USD 기준 → formatPrice 적용 정당.
    const { formatPrice, changeColorClass } = useDisplaySettings();

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
    // 등락 색: 표시 환경설정 구독(KR=빨↑파↓ / GLOBAL=녹↑빨↓). 배지 배경은 중립 컨테이너로 통일.
    const colorClass = changeColorClass(data.changePercent);

    return (
        <div className="flex flex-col md:flex-row items-baseline md:items-center gap-2 md:gap-4 p-6 bg-surface-container/60 backdrop-blur-sm rounded-2xl border border-outline-variant shadow-xl min-w-[300px]">
            <h2 className="text-sm md:text-base font-medium text-on-surface-variant">{data.symbol}</h2>
            <div className="flex items-center gap-3">
                <span className={`text-3xl md:text-4xl font-bold tracking-tight ${colorClass} drop-shadow-lg`}>
                    {formatPrice(Number(data.price))}
                </span>
                <span className={`px-2 py-0.5 rounded text-sm font-semibold bg-surface-container-high ${colorClass}`}>
                    {isPositive ? '+' : ''}{data.changePercent.toFixed(2)}%
                </span>
            </div>
        </div>
    );
};
