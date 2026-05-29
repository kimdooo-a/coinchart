'use client';

/**
 * 표시 환경설정 Context (R12 / T-B / S1)
 * ------------------------------------------------------------------
 * - 익명/회원 무관하게 동작하는 "클라이언트 표시 옵션" SSOT.
 * - 시세 표시 통화(USD/KRW)·등락 색상(한국식/글로벌)을 localStorage(`cca:display`)에 영속.
 * - 저장 버튼 없이 즉시 반영. set 시 같은 문서 내 모든 구독자 + 다른 탭까지 동기화.
 * - S2(전역 적용)에서 시세 표시 컴포넌트들이 `useDisplaySettings()`로 구독하기 위한 골격.
 *
 * 디자인 근거:
 *   docs/design-brief/06-watchlist-settings.md §3-2·§3-3
 *   docs/design-brief/00-overview.md §3-4 (한국식 빨↑파↓)
 *   taste #4 (등락 색상 기본=한국식 고정)
 */

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    useSyncExternalStore,
} from 'react';

/** 시세 표시 통화 */
export type Currency = 'USD' | 'KRW';

/** 등락 색상 체계 — KR: 빨↑/파↓ (한국식) · GLOBAL: 녹↑/빨↓ (미국식) */
export type ChangeColor = 'KR' | 'GLOBAL';

/** localStorage 영속 키 */
export const DISPLAY_SETTINGS_STORAGE_KEY = 'cca:display';

/** 같은 문서 내 구독자 동기화용 커스텀 이벤트명 (다른 탭은 'storage' 이벤트로 동기화) */
const DISPLAY_SETTINGS_EVENT = 'cca:display:changed';

/** 환율 기본값 (USD→KRW). /api/kimchi 응답 전·실패 시 폴백 */
const DEFAULT_EXCHANGE_RATE = 1450;

export interface DisplaySettingsState {
    currency: Currency;
    changeColor: ChangeColor;
}

export const DEFAULT_DISPLAY_SETTINGS: DisplaySettingsState = {
    currency: 'USD',
    changeColor: 'KR', // taste #4 — 한국식 고정 기본값
};

export interface DisplaySettingsContextValue extends DisplaySettingsState {
    /** localStorage 로드 완료 여부 (SSR/하이드레이션 불일치 방지) */
    isHydrated: boolean;
    /** USD→KRW 환율 (KRW 모드 시 /api/kimchi에서 갱신, 그 외 폴백값) */
    exchangeRate: number;
    setCurrency: (currency: Currency) => void;
    setChangeColor: (changeColor: ChangeColor) => void;
    /** USD 기준 숫자를 현재 통화로 포맷 (S2 구독용) */
    formatPrice: (usdValue: number) => string;
    /** 등락값(부호)에 맞는 Tailwind 텍스트 색 클래스 (S2 구독용) */
    changeColorClass: (changeValue: number) => string;
}

// ─────────────────────────────────────────────────────────────────
// 순수 헬퍼 (React 외부에서도 재사용 가능 — S2 비-컴포넌트 로직용)
// ─────────────────────────────────────────────────────────────────

/**
 * 등락값의 부호와 색상 체계에 맞는 Tailwind 텍스트 색 클래스.
 * - KR: 상승=빨강(kr-up) / 하락=파랑(kr-down)
 * - GLOBAL: 상승=녹색(new) / 하락=빨강(positive)
 * - flat(0)=중립
 */
export function getChangeColorClass(changeValue: number, mode: ChangeColor): string {
    if (changeValue > 0) return mode === 'KR' ? 'text-kr-up' : 'text-new';
    if (changeValue < 0) return mode === 'KR' ? 'text-kr-down' : 'text-positive';
    return 'text-on-surface-variant';
}

/** USD 기준 숫자를 선택된 통화로 포맷 */
export function formatDisplayPrice(
    usdValue: number,
    currency: Currency,
    exchangeRate: number,
): string {
    if (!Number.isFinite(usdValue)) return '-';

    if (currency === 'KRW') {
        const krw = usdValue * exchangeRate;
        return `₩${Math.round(krw).toLocaleString('ko-KR')}`;
    }

    // USD — 1달러 미만은 소수점 자릿수 확대(잔 코인 대응)
    const maximumFractionDigits = Math.abs(usdValue) < 1 ? 6 : 2;
    return `$${usdValue.toLocaleString('en-US', { maximumFractionDigits })}`;
}

// ─────────────────────────────────────────────────────────────────
// Context / Provider
// ─────────────────────────────────────────────────────────────────

const DisplaySettingsContext = createContext<DisplaySettingsContextValue | undefined>(undefined);

function parseStoredSettings(raw: string | null): DisplaySettingsState {
    if (!raw) return DEFAULT_DISPLAY_SETTINGS;
    try {
        const parsed = JSON.parse(raw) as Partial<DisplaySettingsState>;
        return {
            currency: parsed.currency === 'KRW' ? 'KRW' : 'USD',
            changeColor: parsed.changeColor === 'GLOBAL' ? 'GLOBAL' : 'KR',
        };
    } catch {
        return DEFAULT_DISPLAY_SETTINGS;
    }
}

// useSyncExternalStore 용 스냅샷 캐시 — raw 문자열이 같으면 동일 객체 참조 반환(무한 렌더 방지)
let cachedRaw: string | null = null;
let cachedSnapshot: DisplaySettingsState = DEFAULT_DISPLAY_SETTINGS;

function getSettingsSnapshot(): DisplaySettingsState {
    const raw = localStorage.getItem(DISPLAY_SETTINGS_STORAGE_KEY);
    if (raw !== cachedRaw) {
        cachedRaw = raw;
        cachedSnapshot = parseStoredSettings(raw);
    }
    return cachedSnapshot;
}

function getServerSettingsSnapshot(): DisplaySettingsState {
    return DEFAULT_DISPLAY_SETTINGS; // 안정 참조 (SSR/하이드레이션 일치)
}

function subscribeSettings(callback: () => void): () => void {
    // 다른 탭: storage 이벤트 / 같은 탭의 다른 구독자: 커스텀 이벤트
    const onStorage = (e: StorageEvent) => {
        if (e.key === DISPLAY_SETTINGS_STORAGE_KEY) callback();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener(DISPLAY_SETTINGS_EVENT, callback);
    return () => {
        window.removeEventListener('storage', onStorage);
        window.removeEventListener(DISPLAY_SETTINGS_EVENT, callback);
    };
}

const noopSubscribe = () => () => {};

export function DisplaySettingsProvider({ children }: { children: React.ReactNode }) {
    // localStorage = 외부 스토어. useSyncExternalStore 로 구독 → effect 내 setState 불필요.
    const settings = useSyncExternalStore(
        subscribeSettings,
        getSettingsSnapshot,
        getServerSettingsSnapshot,
    );
    // 서버=false, 클라이언트 하이드레이션 후=true (effect·setState 없이)
    const isHydrated = useSyncExternalStore(
        noopSubscribe,
        () => true,
        () => false,
    );
    const [exchangeRate, setExchangeRate] = useState(DEFAULT_EXCHANGE_RATE);
    const rateFetched = useRef(false);

    // KRW 통화 선택 시 환율 1회 갱신 (/api/kimchi 재사용 — 신규 API 0)
    useEffect(() => {
        if (settings.currency !== 'KRW' || rateFetched.current) return;
        rateFetched.current = true;
        let alive = true;
        fetch('/api/kimchi')
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                const rate = data?.exchangeRate;
                if (alive && typeof rate === 'number' && rate > 0) setExchangeRate(rate);
            })
            .catch(() => {
                /* 폴백값 유지 */
            });
        return () => {
            alive = false;
        };
    }, [settings.currency]);

    const persist = useCallback((next: DisplaySettingsState) => {
        try {
            localStorage.setItem(DISPLAY_SETTINGS_STORAGE_KEY, JSON.stringify(next));
        } catch {
            /* localStorage 불가 환경 — 무시 */
        }
        // 같은 문서 내 다른 구독자 즉시 동기화 (storage 이벤트는 같은 탭에서 안 뜸).
        // useSyncExternalStore 구독자가 이 이벤트로 새 스냅샷을 읽어 즉시 리렌더.
        window.dispatchEvent(new Event(DISPLAY_SETTINGS_EVENT));
    }, []);

    const setCurrency = useCallback(
        (currency: Currency) => persist({ ...settings, currency }),
        [persist, settings],
    );
    const setChangeColor = useCallback(
        (changeColor: ChangeColor) => persist({ ...settings, changeColor }),
        [persist, settings],
    );

    const formatPrice = useCallback(
        (usdValue: number) => formatDisplayPrice(usdValue, settings.currency, exchangeRate),
        [settings.currency, exchangeRate],
    );
    const changeColorClass = useCallback(
        (changeValue: number) => getChangeColorClass(changeValue, settings.changeColor),
        [settings.changeColor],
    );

    const value: DisplaySettingsContextValue = {
        ...settings,
        isHydrated,
        exchangeRate,
        setCurrency,
        setChangeColor,
        formatPrice,
        changeColorClass,
    };

    return (
        <DisplaySettingsContext.Provider value={value}>
            {children}
        </DisplaySettingsContext.Provider>
    );
}

export function useDisplaySettings(): DisplaySettingsContextValue {
    const ctx = useContext(DisplaySettingsContext);
    if (ctx === undefined) {
        throw new Error('useDisplaySettings must be used within a DisplaySettingsProvider');
    }
    return ctx;
}
