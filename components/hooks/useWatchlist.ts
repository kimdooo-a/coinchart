'use client';

// useWatchlist — 관심종목 localStorage 영속 훅 (R12 / T-A · W1)
// 익명(기본): localStorage 단일 소스. 회원: 상한만 100으로 상향(DB 동기화는 D3 후속).
// 항목 스키마는 user_watchlist DB 컬럼과 1:1 대응 → 회원 머지(D3) 단순화.
// 심볼 표기: CRYPTO=Binance pair 'BTCUSDT', STOCK=티커 'AAPL' (각 SSOT 입력과 일치).
// localStorage 구독은 useSyncExternalStore로 처리 (SSR 스냅샷 안전 + 탭 간 동기화).

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createClient } from '@/lib/supabase/client';

export type WatchlistAssetType = 'CRYPTO' | 'STOCK';

export interface WatchlistItem {
    assetType: WatchlistAssetType;
    symbol: string; // CRYPTO: 'BTCUSDT' / STOCK: 'AAPL'
    sortOrder: number;
    createdAt: number; // unix ms
}

const STORAGE_KEY = 'cca:watchlist';
export const WATCHLIST_LIMIT_ANON = 30;
export const WATCHLIST_LIMIT_MEMBER = 100;

interface StoredShape {
    version: 1;
    items: WatchlistItem[];
}

/** assetType+symbol 복합 키 (중복 판정·dedup 기준) */
export function watchlistItemKey(assetType: WatchlistAssetType, symbol: string): string {
    return `${assetType}:${symbol.trim().toUpperCase()}`;
}

function normalizeSymbol(symbol: string): string {
    return symbol.trim().toUpperCase();
}

function parse(raw: string | null): WatchlistItem[] {
    if (!raw) return [];
    try {
        const parsed: unknown = JSON.parse(raw);
        const rawItems = Array.isArray(parsed) ? parsed : (parsed as StoredShape | null)?.items;
        if (!Array.isArray(rawItems)) return [];
        return rawItems
            .filter(
                (it): it is WatchlistItem =>
                    !!it &&
                    (it.assetType === 'CRYPTO' || it.assetType === 'STOCK') &&
                    typeof it.symbol === 'string' &&
                    it.symbol.trim().length > 0,
            )
            .map((it, i) => ({
                assetType: it.assetType,
                symbol: normalizeSymbol(it.symbol),
                sortOrder: typeof it.sortOrder === 'number' ? it.sortOrder : i,
                createdAt: typeof it.createdAt === 'number' ? it.createdAt : Date.now(),
            }))
            .sort((a, b) => a.sortOrder - b.sortOrder);
    } catch {
        return [];
    }
}

// ---- 외부 스토어 (localStorage) ----
const EMPTY: WatchlistItem[] = [];
let cachedRaw: string | null = null;
let cachedSnapshot: WatchlistItem[] = EMPTY;
const listeners = new Set<() => void>();

function getSnapshot(): WatchlistItem[] {
    if (typeof window === 'undefined') return EMPTY;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cachedSnapshot; // 안정 참조 유지 (무한 렌더 방지)
    cachedRaw = raw;
    cachedSnapshot = parse(raw);
    return cachedSnapshot;
}

function getServerSnapshot(): WatchlistItem[] {
    return EMPTY;
}

function subscribe(onChange: () => void): () => void {
    listeners.add(onChange);
    const onStorage = (e: StorageEvent) => {
        if (e.key === STORAGE_KEY) onChange();
    };
    window.addEventListener('storage', onStorage);
    return () => {
        listeners.delete(onChange);
        window.removeEventListener('storage', onStorage);
    };
}

function writeAndEmit(items: WatchlistItem[]): void {
    if (typeof window === 'undefined') return;
    try {
        const payload: StoredShape = { version: 1, items };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
        /* localStorage 비활성/쿼터 초과 — 무시 */
    }
    cachedRaw = null; // 다음 getSnapshot에서 재파싱하도록 무효화
    listeners.forEach((l) => l());
}

export interface UseWatchlist {
    /** sortOrder 오름차순 정렬된 목록 */
    items: WatchlistItem[];
    /** 회원 여부 (상한 결정용) */
    isMember: boolean;
    /** 현재 상한 (익명 30 / 회원 100) */
    limit: number;
    count: number;
    isFull: boolean;
    has: (assetType: WatchlistAssetType, symbol: string) => boolean;
    /** 추가. 중복·상한 초과 시 false 반환 */
    add: (assetType: WatchlistAssetType, symbol: string) => boolean;
    remove: (assetType: WatchlistAssetType, symbol: string) => void;
    /** 토글. 추가됐으면 true, 제거됐으면 false */
    toggle: (assetType: WatchlistAssetType, symbol: string) => boolean;
    /** 표시 순서 변경 (sortOrder 재할당) */
    reorder: (from: number, to: number) => void;
    clear: () => void;
}

export function useWatchlist(): UseWatchlist {
    const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    const [isMember, setIsMember] = useState(false);
    const isMemberRef = useRef(false);
    useEffect(() => {
        isMemberRef.current = isMember;
    }, [isMember]);

    // 회원 판별 (상한만 결정 — 동기화는 D3 후속). setState는 async 콜백 내부.
    useEffect(() => {
        const supabase = createClient();
        let active = true;
        supabase.auth
            .getUser()
            .then(({ data }) => {
                if (active) setIsMember(!!data.user);
            })
            .catch(() => {
                /* 비로그인/네트워크 오류 → 익명 취급 */
            });
        const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
            setIsMember(!!session?.user);
        });
        return () => {
            active = false;
            sub.subscription.unsubscribe();
        };
    }, []);

    const limit = isMember ? WATCHLIST_LIMIT_MEMBER : WATCHLIST_LIMIT_ANON;

    const has = useCallback((assetType: WatchlistAssetType, symbol: string) => {
        const k = watchlistItemKey(assetType, symbol);
        return getSnapshot().some((it) => watchlistItemKey(it.assetType, it.symbol) === k);
    }, []);

    const add = useCallback((assetType: WatchlistAssetType, symbolRaw: string): boolean => {
        const symbol = normalizeSymbol(symbolRaw);
        if (!symbol) return false;
        const cur = getSnapshot();
        const k = watchlistItemKey(assetType, symbol);
        if (cur.some((it) => watchlistItemKey(it.assetType, it.symbol) === k)) return false; // 중복 무시
        const curLimit = isMemberRef.current ? WATCHLIST_LIMIT_MEMBER : WATCHLIST_LIMIT_ANON;
        if (cur.length >= curLimit) return false; // 상한 초과
        const maxOrder = cur.reduce((m, it) => Math.max(m, it.sortOrder), -1);
        writeAndEmit([
            ...cur,
            { assetType, symbol, sortOrder: maxOrder + 1, createdAt: Date.now() },
        ]);
        return true;
    }, []);

    const remove = useCallback((assetType: WatchlistAssetType, symbolRaw: string) => {
        const k = watchlistItemKey(assetType, normalizeSymbol(symbolRaw));
        const cur = getSnapshot();
        const next = cur.filter((it) => watchlistItemKey(it.assetType, it.symbol) !== k);
        if (next.length !== cur.length) writeAndEmit(next);
    }, []);

    const toggle = useCallback(
        (assetType: WatchlistAssetType, symbol: string): boolean => {
            const k = watchlistItemKey(assetType, symbol);
            if (getSnapshot().some((it) => watchlistItemKey(it.assetType, it.symbol) === k)) {
                remove(assetType, symbol);
                return false;
            }
            return add(assetType, symbol);
        },
        [add, remove],
    );

    const reorder = useCallback((from: number, to: number) => {
        const cur = [...getSnapshot()].sort((a, b) => a.sortOrder - b.sortOrder);
        if (from < 0 || from >= cur.length || to < 0 || to >= cur.length || from === to) return;
        const [moved] = cur.splice(from, 1);
        cur.splice(to, 0, moved);
        writeAndEmit(cur.map((it, i) => ({ ...it, sortOrder: i })));
    }, []);

    const clear = useCallback(() => writeAndEmit([]), []);

    return {
        items,
        isMember,
        limit,
        count: items.length,
        isFull: items.length >= limit,
        has,
        add,
        remove,
        toggle,
        reorder,
        clear,
    };
}
