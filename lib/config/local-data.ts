/**
 * 로컬 사용자 데이터 SSOT (R12 / T-B / S1)
 * ------------------------------------------------------------------
 * settings "데이터 초기화"가 지우는 대상 = 사용자가 이 브라우저에 쌓은 개인 데이터.
 * 표시 환경설정(`cca:display`)·언어(`app-lang`) 같은 "설정"은 초기화 대상이 아니다.
 *
 * 새 로컬 데이터 기능(최근 본 종목·검색 기록 등)을 추가하면 키를 여기에 등록한다.
 *   - watchlist 키 = `cca:watchlist` (T-A `useWatchlist` 훅의 실제 저장소와 일치).
 *     R12 통합 시 design-brief §2-3의 구 관례 `cm.watchlist.v1` → `cca:watchlist`로 통일(cca: 네임스페이스).
 */

export interface LocalDataKey {
    /** localStorage 키 */
    key: string;
    /** 사용자에게 보여줄 한국어 이름 */
    labelKo: string;
    /** 사용자에게 보여줄 영어 이름 */
    labelEn: string;
}

export const LOCAL_DATA_KEYS: LocalDataKey[] = [
    { key: 'cca:watchlist', labelKo: '관심종목', labelEn: 'Watchlist' },
    { key: 'cca:recent-symbols', labelKo: '최근 본 종목', labelEn: 'Recently viewed' },
    { key: 'cca:search-history', labelKo: '검색 기록', labelEn: 'Search history' },
];

/** watchlist localStorage 키 (카운트 표시·초기화 공용) — T-A useWatchlist와 동일 */
export const WATCHLIST_STORAGE_KEY = 'cca:watchlist';

/** 등록된 로컬 데이터 키를 모두 제거 */
export function clearLocalData(): void {
    if (typeof window === 'undefined') return;
    for (const { key } of LOCAL_DATA_KEYS) {
        try {
            localStorage.removeItem(key);
        } catch {
            /* 무시 */
        }
    }
}

/** 현재 관심종목 개수 (localStorage `cca:watchlist` 의 items 길이) */
export function getWatchlistCount(): number {
    if (typeof window === 'undefined') return 0;
    try {
        const raw = localStorage.getItem(WATCHLIST_STORAGE_KEY);
        if (!raw) return 0;
        const parsed = JSON.parse(raw) as { items?: unknown[] };
        return Array.isArray(parsed.items) ? parsed.items.length : 0;
    } catch {
        return 0;
    }
}
