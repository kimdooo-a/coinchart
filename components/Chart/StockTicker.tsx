'use client';

import React, { useEffect, useState } from 'react';
import { getTwelveDataQuote, TwelveDataTicker } from '@/lib/api/twelvedata';
import { useDisplaySettings } from '@/lib/config/display-settings';

interface Props {
    symbol: string;
    lang: 'en' | 'ko';
}

export const StockTicker: React.FC<Props> = ({ symbol, lang }) => {
    const [data, setData] = useState<TwelveDataTicker | null>(null);
    const [loading, setLoading] = useState(true);
    // 표시 환경설정 구독 (R13 / T-A2). 사용처는 app/stock(미국 주식 분석실)·TOP_US_STOCKS 전용 →
    // TwelveData quote 가격은 USD 네이티브이므로 formatPrice 적용 정당(KRW 네이티브 아님).
    const { formatPrice, changeColorClass } = useDisplaySettings();

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
        return <div className="text-on-surface-variant">{lang === 'ko' ? '로딩중...' : 'Loading...'}</div>;
    }

    if (!data) {
        return <div className="text-error">{lang === 'ko' ? '데이터 없음' : 'No Data'}</div>;
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
            <span className="text-xs text-on-surface-variant ml-auto md:ml-0 self-end md:self-center">
                (Delayed 15m)
            </span>
        </div>
    );
};
