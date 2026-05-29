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

/** 로컬 항목을 키로 제거(API 미호출 — 낙관적 업데이트 롤백/내부용) */
function removeLocalByKey(key: string): void {
    const cur = getSnapshot();
    const next = cur.filter((it) => watchlistItemKey(it.assetType, it.symbol) !== key);
    if (next.length !== cur.length) writeAndEmit(next);
}

/** 로컬에 항목 1건 복원(remove 롤백용 — 키 중복 시 무시) */
function addLocalItem(item: WatchlistItem): void {
    const cur = getSnapshot();
    const k = watchlistItemKey(item.assetType, item.symbol);
    if (cur.some((it) => watchlistItemKey(it.assetType, it.symbol) === k)) return;
    writeAndEmit([...cur, item]);
}

// ---- 회원 DB 동기화 (D3 — T-C /api/watchlist* 합류) ----
// 서버 응답 항목: createdAt이 ISO 문자열(로컬은 unix ms). 심볼 정규화는 서버·클라 동일(대문자·trim).
interface ServerWatchlistItem {
    assetType: WatchlistAssetType;
    symbol: string;
    sortOrder: number;
    createdAt: string; // ISO
}

interface SyncResponse {
    items: ServerWatchlistItem[];
    added: number;
    skipped: number;
    limit: number;
}

/** 서버 항목(ISO createdAt) → 로컬 항목(unix ms) 매핑 */
function serverToLocal(it: ServerWatchlistItem): WatchlistItem {
    const t = Date.parse(it.createdAt);
    return {
        assetType: it.assetType,
        symbol: normalizeSymbol(it.symbol),
        sortOrder: it.sortOrder,
        createdAt: Number.isFinite(t) ? t : Date.now(),
    };
}

type AddApiResult = 'ok' | 'limit' | 'error';

/** POST /api/watchlist — 추가(멱등). 409=상한, 그 외 실패=error. */
async function apiAddItem(
    assetType: WatchlistAssetType,
    symbol: string,
    sortOrder: number,
): Promise<AddApiResult> {
    try {
        const res = await fetch('/api/watchlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assetType, symbol, sortOrder }),
        });
        if (res.status === 409) return 'limit';
        return res.ok ? 'ok' : 'error';
    } catch {
        return 'error';
    }
}

/** DELETE /api/watchlist — 삭제(멱등). 성공 여부 반환. */
async function apiRemoveItem(assetType: WatchlistAssetType, symbol: string): Promise<boolean> {
    try {
        const res = await fetch(
            `/api/watchlist?assetType=${encodeURIComponent(assetType)}&symbol=${encodeURIComponent(symbol)}`,
            { method: 'DELETE' },
        );
        return res.ok;
    } catch {
        return false;
    }
}

/** POST /api/watchlist/sync — 로컬 우선 병합 업로드(로그인 직후 1회). 실패 시 null. */
async function apiSync(local: WatchlistItem[]): Promise<SyncResponse | null> {
    try {
        const res = await fetch('/api/watchlist/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: local.map((i) => ({
                    assetType: i.assetType,
                    symbol: i.symbol,
                    sortOrder: i.sortOrder,
                })),
            }),
        });
        if (!res.ok) return null;
        return (await res.json()) as SyncResponse;
    } catch {
        return null;
    }
}

// 로그인 세션당 sync 1회 가드(모듈 전역 — 훅 인스턴스가 여럿이어도 중복 sync 방지).
// 로그아웃 시 false로 리셋 → 다음 로그인에 재동기화.
let moduleSynced = false;

/** 상한 초과·동기화 누락 등 사용자 안내용 신호(호출부가 선택 구독 — 미구독 시 무해) */
export type WatchlistNotice =
    | { type: 'limit'; limit: number }
    | { type: 'sync-skipped'; count: number; limit: number };

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
    /** 회원 sync 시 상한 초과 누락·POST 409 등 안내 신호(없으면 null). 호출부 선택 구독. */
    notice: WatchlistNotice | null;
    /** 안내 신호 해제 */
    dismissNotice: () => void;
}

export function useWatchlist(): UseWatchlist {
    const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    const [isMember, setIsMember] = useState(false);
    const isMemberRef = useRef(false);
    useEffect(() => {
        isMemberRef.current = isMember;
    }, [isMember]);

    const [notice, setNotice] = useState<WatchlistNotice | null>(null);
    const dismissNotice = useCallback(() => setNotice(null), []);

    // 회원 판별 + 로그인 직후 1회 sync(D3). 익명은 localStorage 그대로.
    // setState는 async 콜백 내부. sync는 모듈 전역 가드(moduleSynced)로 인스턴스 다수여도 1회.
    useEffect(() => {
        const supabase = createClient();
        let active = true;

        // 로그인 직후 1회: 로컬 목록을 sync로 업로드(로컬 우선 병합) → 응답 병합본으로 로컬 갱신.
        const runSync = async () => {
            if (moduleSynced) return;
            moduleSynced = true; // await 전에 선점 — 인스턴스 경합 시 중복 sync 차단
            const result = await apiSync(getSnapshot());
            if (!result) {
                moduleSynced = false; // 실패 → 다음 auth 이벤트에 재시도
                return;
            }
            // 병합본(DB 진실)을 localStorage에 반영 → 회원 소스 전환(새 기기 로그인 시 목록 복원).
            writeAndEmit(result.items.map(serverToLocal));
            if (active && result.skipped > 0) {
                setNotice({ type: 'sync-skipped', count: result.skipped, limit: result.limit });
            }
        };

        supabase.auth
            .getUser()
            .then(({ data }) => {
                if (!active) return;
                const member = !!data.user;
                setIsMember(member);
                if (member) void runSync();
            })
            .catch(() => {
                /* 비로그인/네트워크 오류 → 익명 취급 */
            });
        const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
            const member = !!session?.user;
            setIsMember(member);
            if (member) {
                void runSync();
            } else {
                moduleSynced = false; // 로그아웃 → 다음 로그인에 재동기화
            }
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
        const member = isMemberRef.current;
        const curLimit = member ? WATCHLIST_LIMIT_MEMBER : WATCHLIST_LIMIT_ANON;
        if (cur.length >= curLimit) return false; // 상한 초과
        const maxOrder = cur.reduce((m, it) => Math.max(m, it.sortOrder), -1);
        const sortOrder = maxOrder + 1;
        // 낙관적 로컬 추가(즉시 UI 반영) — 동기 boolean 계약 유지.
        writeAndEmit([...cur, { assetType, symbol, sortOrder, createdAt: Date.now() }]);
        // 회원이면 DB 반영. 409(서버 상한 100)·오류 시 로컬 롤백 + 안내.
        if (member) {
            void apiAddItem(assetType, symbol, sortOrder).then((res) => {
                if (res === 'limit') {
                    removeLocalByKey(k);
                    setNotice({ type: 'limit', limit: WATCHLIST_LIMIT_MEMBER });
                } else if (res === 'error') {
                    removeLocalByKey(k);
                }
            });
        }
        return true;
    }, []);

    const remove = useCallback((assetType: WatchlistAssetType, symbolRaw: string) => {
        const symbol = normalizeSymbol(symbolRaw);
        const k = watchlistItemKey(assetType, symbol);
        const cur = getSnapshot();
        const removed = cur.find((it) => watchlistItemKey(it.assetType, it.symbol) === k);
        const next = cur.filter((it) => watchlistItemKey(it.assetType, it.symbol) !== k);
        if (next.length === cur.length) return; // 변화 없음
        writeAndEmit(next); // 낙관적 제거
        if (isMemberRef.current && removed) {
            void apiRemoveItem(assetType, symbol).then((ok) => {
                if (!ok) addLocalItem(removed); // DB 실패 → 로컬 복원
            });
        }
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

    const clear = useCallback(() => {
        const cur = getSnapshot();
        writeAndEmit([]); // 낙관적 비우기
        // 회원이면 DB도 비움(벌크 삭제 엔드포인트 없음 → 항목별 best-effort DELETE).
        // 누락 시 다음 로그인 sync가 잔여 DB 행을 복원할 수 있으므로 전건 삭제 시도.
        if (isMemberRef.current) {
            for (const it of cur) void apiRemoveItem(it.assetType, it.symbol);
        }
    }, []);

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
        notice,
        dismissNotice,
    };
}
