'use client';

// WatchlistView — 관심종목 페이지 본문 (R12 / T-A · W1)
// useWatchlist(localStorage) + useWatchlistQuotes(폴링) 결합. 탭 필터 + 정렬 + 표 + 빈 상태.

import { useMemo, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Star, RefreshCw, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';
import {
    useWatchlist,
    watchlistItemKey,
    type WatchlistAssetType,
    type WatchlistItem,
} from '@/components/hooks/useWatchlist';
import { useWatchlistQuotes } from '@/components/hooks/useWatchlistQuotes';
import WatchlistTable, { type WatchlistRow } from './WatchlistTable';
import WatchlistAddBar from './WatchlistAddBar';
import WatchlistNotice from './WatchlistNotice';
import { baseSymbol } from './format';

type TabFilter = 'ALL' | 'CRYPTO' | 'STOCK';
type SortKey = 'added' | 'name' | 'change';

const T = {
    ko: {
        title: '관심종목',
        subtitle: '관심 있는 코인·주식을 모아 실시간 시세를 확인하세요.',
        all: '전체',
        crypto: '코인',
        stock: '주식',
        sortAdded: '추가순',
        sortName: '이름순',
        sortChange: '등락률순',
        autoRefresh: '12초마다 자동 갱신',
        clear: '전체 비우기',
        clearConfirm: '관심종목을 모두 비울까요?',
        emptyTitle: '아직 관심종목이 없습니다',
        emptyDesc: '⭐로 종목을 담아보세요. 위 입력창이나 코인룸·차트분석에서 추가할 수 있어요.',
        goRoom: '코인룸 둘러보기',
        goAnalysis: '차트분석 가기',
        count: (n: number, limit: number) => `${n} / ${limit}`,
    },
    en: {
        title: 'Watchlist',
        subtitle: 'Track real-time prices of your favorite coins and stocks.',
        all: 'All',
        crypto: 'Crypto',
        stock: 'Stock',
        sortAdded: 'Added',
        sortName: 'Name',
        sortChange: 'Change',
        autoRefresh: 'Auto-refresh every 12s',
        clear: 'Clear all',
        clearConfirm: 'Clear all watchlist items?',
        emptyTitle: 'No watchlist items yet',
        emptyDesc: 'Add symbols with ⭐ — use the input above, or coin rooms / chart analysis.',
        goRoom: 'Browse coin rooms',
        goAnalysis: 'Go to analysis',
        count: (n: number, limit: number) => `${n} / ${limit}`,
    },
} as const;

export default function WatchlistView() {
    const { lang } = useLanguage();
    const t = T[lang === 'en' ? 'en' : 'ko'];

    const { items, limit, count, isFull, has, add, remove, reorder, clear, notice, dismissNotice } =
        useWatchlist();
    const { quotes, loading, refresh } = useWatchlistQuotes(items);

    // 하이드레이션 완료 여부 (SSR 스냅샷=false → 빈 상태 깜빡임 방지). setState 없이 안전.
    const ready = useSyncExternalStore(
        () => () => {},
        () => true,
        () => false,
    );

    const [tab, setTab] = useState<TabFilter>('ALL');
    const [sort, setSort] = useState<SortKey>('added');

    const rows: WatchlistRow[] = useMemo(() => {
        const filtered = items.filter((it) =>
            tab === 'ALL' ? true : it.assetType === tab,
        );
        const withQuote = filtered.map((item) => ({
            item,
            quote: quotes[watchlistItemKey(item.assetType, item.symbol)],
        }));
        const sorted = [...withQuote];
        if (sort === 'name') {
            sorted.sort((a, b) =>
                baseSymbol(a.item.assetType, a.item.symbol).localeCompare(
                    baseSymbol(b.item.assetType, b.item.symbol),
                ),
            );
        } else if (sort === 'change') {
            sorted.sort((a, b) => {
                const pa = a.quote?.changePct;
                const pb = b.quote?.changePct;
                if (pa == null && pb == null) return 0;
                if (pa == null) return 1; // 값 없으면 뒤로
                if (pb == null) return -1;
                return pb - pa; // 내림차순
            });
        } else {
            sorted.sort((a, b) => a.item.sortOrder - b.item.sortOrder);
        }
        return sorted;
    }, [items, quotes, tab, sort]);

    const cryptoCount = items.filter((i) => i.assetType === 'CRYPTO').length;
    const stockCount = items.filter((i) => i.assetType === 'STOCK').length;

    const handleRemove = (item: WatchlistItem) => remove(item.assetType, item.symbol);
    const handleClear = () => {
        if (typeof window !== 'undefined' && window.confirm(t.clearConfirm)) clear();
    };

    return (
        <main className="min-h-screen bg-surface text-on-surface">
            <div className="w-full max-w-5xl mx-auto px-4 py-6 space-y-4">
                {/* 타이틀 */}
                <header className="flex items-end justify-between gap-3 flex-wrap">
                    <div>
                        <h1 className="text-h1 flex items-center gap-2">
                            <Star className="w-6 h-6 text-[var(--color-new)] fill-current" />
                            {t.title}
                        </h1>
                        <p className="text-meta text-on-surface-variant mt-1">{t.subtitle}</p>
                    </div>
                    <div className="flex items-center gap-2 text-meta text-on-surface-variant">
                        <span className="tabular-nums">{t.count(count, limit)}</span>
                        <button
                            type="button"
                            onClick={refresh}
                            className="flex items-center gap-1 px-2 py-1 rounded-md border border-outline-variant hover:bg-surface-container transition-colors"
                            title={t.autoRefresh}
                        >
                            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
                            <span className="hidden sm:inline">{t.autoRefresh}</span>
                        </button>
                    </div>
                </header>

                {/* 안내 배너 (상한·sync 누락) */}
                <WatchlistNotice
                    notice={notice}
                    onDismiss={dismissNotice}
                    lang={lang === 'en' ? 'en' : 'ko'}
                />

                {/* 추가 바 */}
                <WatchlistAddBar
                    lang={lang === 'en' ? 'en' : 'ko'}
                    isFull={isFull}
                    limit={limit}
                    onAdd={(at: WatchlistAssetType, s: string) => add(at, s)}
                    has={has}
                />

                {/* 컨트롤: 탭 + 정렬 */}
                {ready && items.length > 0 && (
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex rounded-md border border-outline-variant overflow-hidden text-meta font-bold">
                            {([
                                ['ALL', `${t.all} ${items.length}`],
                                ['CRYPTO', `${t.crypto} ${cryptoCount}`],
                                ['STOCK', `${t.stock} ${stockCount}`],
                            ] as const).map(([key, label]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setTab(key as TabFilter)}
                                    className={cn(
                                        'px-3 py-1.5 transition-colors',
                                        tab === key
                                            ? 'bg-primary text-on-primary'
                                            : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container',
                                    )}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <select
                                value={sort}
                                onChange={(e) => setSort(e.target.value as SortKey)}
                                className="px-2 py-1.5 rounded-md border border-outline-variant bg-surface-container-lowest text-meta font-bold outline-none"
                            >
                                <option value="added">{t.sortAdded}</option>
                                <option value="name">{t.sortName}</option>
                                <option value="change">{t.sortChange}</option>
                            </select>
                            <button
                                type="button"
                                onClick={handleClear}
                                className="flex items-center gap-1 px-2 py-1.5 rounded-md border border-outline-variant text-meta text-on-surface-variant hover:bg-surface-container transition-colors"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">{t.clear}</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* 표 또는 빈 상태 */}
                {!ready ? (
                    <div className="border border-outline-variant rounded-md p-10 text-center text-meta text-on-surface-variant">
                        …
                    </div>
                ) : items.length === 0 ? (
                    <EmptyState lang={lang === 'en' ? 'en' : 'ko'} />
                ) : rows.length === 0 ? (
                    <div className="border border-outline-variant rounded-md p-10 text-center text-meta text-on-surface-variant">
                        {tab === 'CRYPTO' ? t.crypto : t.stock} —
                    </div>
                ) : (
                    <WatchlistTable
                        rows={rows}
                        lang={lang === 'en' ? 'en' : 'ko'}
                        onRemove={handleRemove}
                        // 순서 이동은 '추가순' 정렬 + '전체' 탭에서만 — 이때 row 인덱스가 sortOrder와 1:1.
                        reorderable={tab === 'ALL' && sort === 'added'}
                        onMoveUp={(i) => reorder(i, i - 1)}
                        onMoveDown={(i) => reorder(i, i + 1)}
                    />
                )}
            </div>
        </main>
    );
}

function EmptyState({ lang }: { lang: 'ko' | 'en' }) {
    const t = T[lang];
    return (
        <div className="border border-outline-variant rounded-md p-10 md:p-16 text-center bg-surface-container-lowest">
            <Star className="w-10 h-10 text-[var(--color-new)] mx-auto mb-4" />
            <h2 className="text-h2 mb-2">{t.emptyTitle}</h2>
            <p className="text-body-base text-on-surface-variant max-w-md mx-auto mb-6">
                {t.emptyDesc}
            </p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
                <Link
                    href="/"
                    className="px-4 py-2 rounded-md bg-primary text-on-primary text-label-bold hover:bg-primary-container transition-colors"
                >
                    {t.goRoom}
                </Link>
                <Link
                    href="/analysis"
                    className="px-4 py-2 rounded-md border border-outline text-on-surface text-label-bold hover:bg-surface-container transition-colors"
                >
                    {t.goAnalysis}
                </Link>
            </div>
        </div>
    );
}
