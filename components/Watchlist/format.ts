// 관심종목 표시 포맷 헬퍼 (R12 / T-A)

import type { WatchlistAssetType } from '@/components/hooks/useWatchlist';

/** CRYPTO 'BTCUSDT' → 'BTC' / STOCK 'AAPL' → 'AAPL' */
export function baseSymbol(assetType: WatchlistAssetType, symbol: string): string {
    if (assetType === 'CRYPTO') return symbol.toUpperCase().replace(/USDT$/, '');
    return symbol.toUpperCase();
}

/** 코인룸·차트분석 URL용 슬러그 (소문자 베이스) */
export function symbolSlug(assetType: WatchlistAssetType, symbol: string): string {
    return baseSymbol(assetType, symbol).toLowerCase();
}

// formatPrice 는 R12 Wave2 S2에서 표시설정 Context(useDisplaySettings)로 이관됨 — 로컬 dead export 제거.

/** 등락률 (부호 + 화살표 없이 숫자만) */
export function formatPct(pct: number | null): string {
    if (pct == null) return '—';
    return `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
}

/** USD 거래대금 축약 ($34.2B) */
export function formatUsdCompact(n: number | null): string {
    if (n == null) return '—';
    if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
    if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
    if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
    return `$${n.toLocaleString()}`;
}

/** 주식 거래량(주수) 축약 (12.3M) */
export function formatCountCompact(n: number | null): string {
    if (n == null) return '—';
    if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
    return n.toLocaleString();
}

/** 거래량 통합 포맷 (코인=USD대금 / 주식=주수) */
export function formatVolume(n: number | null, isUsd: boolean): string {
    return isUsd ? formatUsdCompact(n) : formatCountCompact(n);
}
