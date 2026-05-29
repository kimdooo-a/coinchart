'use client';

// WatchlistAddBar — 관심종목 추가 입력 바 (R12 / T-A · W1)
// 현장 추가 ⭐ 토글(W2) 전까지의 MVP 추가 동선. 코인/주식 세그먼트 + 심볼 입력 + 빠른 선택 칩.
// 브랜드 그린(--color-new)으로 추가 CTA·⭐ 강조 (taste #7).

import { useState } from 'react';
import { Plus, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WatchlistAssetType } from '@/components/hooks/useWatchlist';

interface WatchlistAddBarProps {
    lang: 'ko' | 'en';
    isFull: boolean;
    limit: number;
    /** 추가 시도. 성공 true / 중복·상한 false */
    onAdd: (assetType: WatchlistAssetType, symbol: string) => boolean;
    has: (assetType: WatchlistAssetType, symbol: string) => boolean;
}

const QUICK_CRYPTO = ['BTC', 'ETH', 'XRP', 'SOL', 'DOGE', 'ADA', 'BNB', 'LINK'];
const QUICK_STOCK = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'GOOGL', 'META', 'AMD'];

const T = {
    ko: {
        crypto: '코인',
        stock: '주식',
        placeholderCrypto: '심볼 입력 (예: BTC)',
        placeholderStock: '티커 입력 (예: AAPL)',
        add: '추가',
        full: (n: number) => `상한 ${n}개에 도달했습니다`,
        dup: '이미 담은 종목입니다',
        quick: '빠른 추가',
    },
    en: {
        crypto: 'Crypto',
        stock: 'Stock',
        placeholderCrypto: 'Symbol (e.g. BTC)',
        placeholderStock: 'Ticker (e.g. AAPL)',
        add: 'Add',
        full: (n: number) => `Limit of ${n} reached`,
        dup: 'Already in watchlist',
        quick: 'Quick add',
    },
} as const;

/** 입력값을 SSOT 심볼 형식으로 정규화 (CRYPTO=Binance pair BTCUSDT) */
function toStoredSymbol(assetType: WatchlistAssetType, raw: string): string {
    const s = raw.trim().toUpperCase();
    if (!s) return '';
    if (assetType === 'STOCK') return s;
    // 이미 USDT/USDC/BUSD 등 quote가 붙어 있으면 그대로, 아니면 USDT 부착
    if (/(USDT|USDC|BUSD|FDUSD)$/.test(s)) return s;
    return `${s}USDT`;
}

export default function WatchlistAddBar({
    lang,
    isFull,
    limit,
    onAdd,
    has,
}: WatchlistAddBarProps) {
    const t = T[lang];
    const [assetType, setAssetType] = useState<WatchlistAssetType>('CRYPTO');
    const [input, setInput] = useState('');
    const [msg, setMsg] = useState<string | null>(null);

    const quick = assetType === 'CRYPTO' ? QUICK_CRYPTO : QUICK_STOCK;

    function tryAdd(raw: string) {
        const symbol = toStoredSymbol(assetType, raw);
        if (!symbol) return;
        if (has(assetType, symbol)) {
            setMsg(t.dup);
            return;
        }
        const ok = onAdd(assetType, symbol);
        if (ok) {
            setInput('');
            setMsg(null);
        } else {
            setMsg(isFull ? t.full(limit) : t.dup);
        }
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        tryAdd(input);
    }

    return (
        <div className="border border-outline-variant rounded-md p-3 bg-surface-container-lowest">
            <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
                {/* 자산 유형 세그먼트 */}
                <div className="flex rounded-md border border-outline-variant overflow-hidden text-meta font-bold">
                    {(['CRYPTO', 'STOCK'] as const).map((tp) => (
                        <button
                            key={tp}
                            type="button"
                            onClick={() => {
                                setAssetType(tp);
                                setMsg(null);
                            }}
                            className={cn(
                                'px-3 py-1.5 transition-colors',
                                assetType === tp
                                    ? 'bg-primary text-on-primary'
                                    : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container',
                            )}
                        >
                            {tp === 'CRYPTO' ? t.crypto : t.stock}
                        </button>
                    ))}
                </div>

                {/* 심볼 입력 */}
                <input
                    value={input}
                    onChange={(e) => {
                        setInput(e.target.value);
                        setMsg(null);
                    }}
                    placeholder={
                        assetType === 'CRYPTO' ? t.placeholderCrypto : t.placeholderStock
                    }
                    className="flex-1 min-w-[140px] px-3 py-1.5 rounded-md border border-outline-variant bg-surface-container-lowest text-body-base outline-none focus:border-[var(--color-new)]"
                />

                {/* 추가 버튼 (브랜드 그린) */}
                <button
                    type="submit"
                    disabled={isFull || input.trim().length === 0}
                    className="flex items-center gap-1 px-4 py-1.5 rounded-md font-bold text-meta text-white bg-[var(--color-new)] hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <Plus className="w-4 h-4" />
                    {t.add}
                </button>
            </form>

            {/* 빠른 추가 칩 */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-meta text-on-surface-variant mr-1">{t.quick}</span>
                {quick.map((sym) => {
                    const stored = toStoredSymbol(assetType, sym);
                    const added = has(assetType, stored);
                    return (
                        <button
                            key={sym}
                            type="button"
                            onClick={() => tryAdd(sym)}
                            disabled={added || isFull}
                            className={cn(
                                'flex items-center gap-1 px-2 py-0.5 rounded-md border text-meta font-bold transition-colors',
                                added
                                    ? 'border-[var(--color-new)] text-[var(--color-new)] opacity-60 cursor-default'
                                    : 'border-outline-variant text-on-surface-variant hover:border-[var(--color-new)] hover:text-[var(--color-new)] disabled:opacity-40',
                            )}
                        >
                            {added && <Star className="w-3 h-3 fill-current" />}
                            {sym}
                        </button>
                    );
                })}
            </div>

            {msg && <p className="text-meta text-[var(--color-kr-up)] mt-2">{msg}</p>}
            {isFull && !msg && (
                <p className="text-meta text-[var(--color-kr-up)] mt-2">{t.full(limit)}</p>
            )}
        </div>
    );
}
