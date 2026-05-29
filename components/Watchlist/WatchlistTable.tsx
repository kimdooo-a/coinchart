'use client';

// WatchlistTable — 관심종목 표 (R12 / T-A · W1)
// 1줄 = 1종목. 네이버 증권 톤(보더 1px·rounded-md·zebra). 한국식 색상: 상승=빨강/하락=파랑.
// 모바일: 거래량 생략·등락률 강조 1줄 축약.

import Link from 'next/link';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WatchlistItem } from '@/components/hooks/useWatchlist';
import type { WatchlistQuote } from '@/components/hooks/useWatchlistQuotes';
import {
    baseSymbol,
    formatPrice,
    formatPct,
    formatVolume,
    symbolSlug,
} from './format';

export interface WatchlistRow {
    item: WatchlistItem;
    quote?: WatchlistQuote;
}

interface WatchlistTableProps {
    rows: WatchlistRow[];
    lang: 'ko' | 'en';
    onRemove: (item: WatchlistItem) => void;
}

const T = {
    ko: { symbol: '종목', price: '현재가', change: '등락률', volume: '거래량', actions: '관리', chart: '차트분석', room: '코인룸', remove: '관심해제' },
    en: { symbol: 'Symbol', price: 'Price', change: '24h', volume: 'Volume', actions: '', chart: 'Analysis', room: 'Room', remove: 'Remove' },
} as const;

export default function WatchlistTable({ rows, lang, onRemove }: WatchlistTableProps) {
    const t = T[lang];

    return (
        <div className="border border-outline-variant rounded-md overflow-hidden">
            {/* 헤더행 (데스크톱) */}
            <div className="hidden md:flex items-center px-3 py-2.5 border-b border-outline-variant bg-surface-container-low text-meta font-label-bold uppercase tracking-wider text-on-surface-variant">
                <div className="flex-1 min-w-0">{t.symbol}</div>
                <div className="w-32 text-right">{t.price}</div>
                <div className="w-24 text-right">{t.change}</div>
                <div className="w-32 text-right">{t.volume}</div>
                <div className="w-[120px] text-right">{t.actions}</div>
            </div>

            {/* 행 */}
            <ul>
                {rows.map(({ item, quote }, idx) => {
                    const base = baseSymbol(item.assetType, item.symbol);
                    const slug = symbolSlug(item.assetType, item.symbol);
                    const pct = quote?.changePct ?? null;
                    const isUp = pct != null && pct >= 0;
                    const trendColor =
                        pct == null
                            ? 'text-on-surface-variant'
                            : isUp
                                ? 'text-[var(--color-kr-up)]'
                                : 'text-[var(--color-kr-down)]';
                    const chartHref =
                        item.assetType === 'CRYPTO'
                            ? `/analysis/${slug}`
                            : `/analysis/stock/${base}`;

                    return (
                        <li
                            key={`${item.assetType}:${item.symbol}`}
                            className={cn(
                                'flex items-center gap-2 px-3 py-2.5 transition-colors hover:bg-surface-container',
                                idx % 2 === 1 && 'bg-surface-container-low/40',
                            )}
                        >
                            {/* 심볼 */}
                            <div className="flex-1 min-w-0 flex items-center gap-2">
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-surface-container-high text-meta font-bold text-on-surface-variant flex-shrink-0">
                                    {base.charAt(0)}
                                </span>
                                <div className="min-w-0">
                                    <div className="text-body-base font-bold truncate">{base}</div>
                                    <div className="text-meta text-on-surface-variant">
                                        {item.assetType === 'CRYPTO' ? 'Crypto' : 'Stock'}
                                    </div>
                                </div>
                            </div>

                            {/* 현재가 */}
                            <div className="w-24 md:w-32 text-right tabular-nums text-body-base font-bold">
                                {formatPrice(quote?.price ?? null)}
                            </div>

                            {/* 등락률 */}
                            <div className={cn('w-20 md:w-24 text-right tabular-nums text-body-base font-bold', trendColor)}>
                                {pct != null && (isUp ? '▲ ' : '▼ ')}
                                {formatPct(pct)}
                            </div>

                            {/* 거래량 (모바일 생략) */}
                            <div className="hidden md:block w-32 text-right tabular-nums text-meta text-on-surface-variant">
                                {formatVolume(quote?.volume ?? null, quote?.volumeIsUsd ?? true)}
                            </div>

                            {/* 액션 */}
                            <div className="w-auto md:w-[120px] flex items-center justify-end gap-1">
                                <Link
                                    href={chartHref}
                                    className="p-1.5 rounded-md hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors"
                                    title={t.chart}
                                    aria-label={`${base} ${t.chart}`}
                                >
                                    📊
                                </Link>
                                {item.assetType === 'CRYPTO' && (
                                    <Link
                                        href={`/coin/${slug}`}
                                        className="p-1.5 rounded-md hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors"
                                        title={t.room}
                                        aria-label={`${base} ${t.room}`}
                                    >
                                        💬
                                    </Link>
                                )}
                                <button
                                    type="button"
                                    onClick={() => onRemove(item)}
                                    className="p-1.5 rounded-md hover:bg-surface-container-high text-[var(--color-new)] transition-colors"
                                    title={t.remove}
                                    aria-label={`${base} ${t.remove}`}
                                >
                                    <Star className="w-4 h-4 fill-current" />
                                </button>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
