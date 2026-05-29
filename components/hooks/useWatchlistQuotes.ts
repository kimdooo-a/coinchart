'use client';

// useWatchlistQuotes — 관심종목 실시간 시세 폴링 (R12 / T-A · W1)
// CRYPTO: /api/coins/ticker?symbols=... 다건 1콜 (재사용).
// STOCK : /api/stock/quote?symbol=... 단건 N개를 Promise.all 병렬 호출 (taste #1 — 신규 배치 API 금지).
// 폴링 12초, 언마운트 시 인터벌 정리 + 인플라이트 abort. 신규 시세 API 생성 0.

import { useCallback, useEffect, useRef, useState } from 'react';
import type { WatchlistAssetType, WatchlistItem } from './useWatchlist';

export interface WatchlistQuote {
    price: number | null;
    changePct: number | null;
    volume: number | null;
    /** true=USD 거래대금(코인), false=거래량 주수(주식) */
    volumeIsUsd: boolean;
}

/** key = `${assetType}:${SYMBOL}` (watchlistItemKey와 동일 규칙) */
export type QuoteMap = Record<string, WatchlistQuote>;

const POLL_INTERVAL_MS = 12_000;

function qkey(assetType: WatchlistAssetType, symbol: string): string {
    return `${assetType}:${symbol.trim().toUpperCase()}`;
}

function num(v: unknown): number | null {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
}

export interface UseWatchlistQuotes {
    quotes: QuoteMap;
    loading: boolean;
    lastUpdated: number | null;
    refresh: () => void;
}

export function useWatchlistQuotes(items: WatchlistItem[]): UseWatchlistQuotes {
    const [quotes, setQuotes] = useState<QuoteMap>({});
    const [loading, setLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<number | null>(null);

    // 심볼 집합이 바뀔 때만 폴링 재시작하도록 안정 키 생성
    const cryptoSymbols = items
        .filter((i) => i.assetType === 'CRYPTO')
        .map((i) => i.symbol.toUpperCase());
    const stockSymbols = items
        .filter((i) => i.assetType === 'STOCK')
        .map((i) => i.symbol.toUpperCase());
    const depKey = JSON.stringify([
        cryptoSymbols.slice().sort(),
        stockSymbols.slice().sort(),
    ]);

    // 수동 새로고침을 위해 최신 fetch 함수를 ref에 보관
    const fetchRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        const [cSyms, sSyms] = JSON.parse(depKey) as [string[], string[]];

        if (cSyms.length === 0 && sSyms.length === 0) {
            setQuotes({});
            setLastUpdated(null);
            setLoading(false);
            fetchRef.current = null;
            return;
        }

        let cancelled = false;
        const controller = new AbortController();

        async function fetchAll() {
            setLoading(true);
            const next: QuoteMap = {};
            try {
                const tasks: Promise<void>[] = [];

                // 코인: 다건 1콜
                if (cSyms.length > 0) {
                    tasks.push(
                        (async () => {
                            try {
                                const res = await fetch(
                                    `/api/coins/ticker?symbols=${cSyms.join(',')}`,
                                    { signal: controller.signal },
                                );
                                if (!res.ok) return;
                                const json = await res.json();
                                const tickers: Array<Record<string, unknown>> =
                                    json?.tickers ?? [];
                                for (const t of tickers) {
                                    const sym = String(t.symbol ?? '');
                                    if (!sym) continue;
                                    next[qkey('CRYPTO', sym)] = {
                                        price: num(t.price),
                                        changePct: num(t.changePct),
                                        volume: num(t.volume24hUsd),
                                        volumeIsUsd: true,
                                    };
                                }
                            } catch {
                                /* abort/네트워크 — 직전 시세 유지 */
                            }
                        })(),
                    );
                }

                // 주식: 단건 N개 병렬 (taste #1)
                for (const sym of sSyms) {
                    tasks.push(
                        (async () => {
                            try {
                                const res = await fetch(
                                    `/api/stock/quote?symbol=${encodeURIComponent(sym)}`,
                                    { signal: controller.signal },
                                );
                                if (!res.ok) return;
                                const d = await res.json();
                                if (!d || d.status === 'error') return;
                                next[qkey('STOCK', sym)] = {
                                    price: num(d.close),
                                    changePct: num(d.percent_change),
                                    volume: num(d.volume),
                                    volumeIsUsd: false,
                                };
                            } catch {
                                /* abort/네트워크 — 직전 시세 유지 */
                            }
                        })(),
                    );
                }

                await Promise.all(tasks);
                if (!cancelled) {
                    // 머지: 일부 소스 실패 시에도 직전 시세 유지 (UX 안정)
                    setQuotes((prev) => ({ ...prev, ...next }));
                    setLastUpdated(Date.now());
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        fetchRef.current = fetchAll;
        fetchAll();
        const id = setInterval(fetchAll, POLL_INTERVAL_MS);

        return () => {
            cancelled = true;
            controller.abort();
            clearInterval(id);
            fetchRef.current = null;
        };
    }, [depKey]);

    const refresh = useCallback(() => {
        fetchRef.current?.();
    }, []);

    return { quotes, loading, lastUpdated, refresh };
}
