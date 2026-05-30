'use client';

// WatchlistNotice — 관심종목 안내 배너 (R13 / T-B · B-1)
// useWatchlist().notice 신호를 사용자에게 표시. 상단 인라인 배너(네이버 톤).
//  - type:'limit'        → 상한 도달로 추가 거부됨
//  - type:'sync-skipped' → 로그인 sync 시 상한 초과분이 동기화에서 제외됨
// 접근성: role="status" + aria-live="polite"(비방해 안내). 닫기 버튼 → dismissNotice().

import { AlertCircle, X } from 'lucide-react';
import type { WatchlistNotice as Notice } from '@/components/hooks/useWatchlist';

const T = {
    ko: {
        limit: (limit: number) => `관심종목은 최대 ${limit}개까지 등록할 수 있어요.`,
        syncSkipped: (count: number, limit: number) =>
            `${count}개 항목이 상한(${limit})을 넘어 동기화에서 제외됐어요.`,
        dismiss: '닫기',
    },
    en: {
        limit: (limit: number) => `You can register up to ${limit} watchlist items.`,
        syncSkipped: (count: number, limit: number) =>
            `${count} item(s) exceeded the limit (${limit}) and were skipped during sync.`,
        dismiss: 'Dismiss',
    },
} as const;

export default function WatchlistNotice({
    notice,
    onDismiss,
    lang,
}: {
    notice: Notice | null;
    onDismiss: () => void;
    lang: 'ko' | 'en';
}) {
    if (!notice) return null;
    const t = T[lang];
    const message =
        notice.type === 'limit'
            ? t.limit(notice.limit)
            : t.syncSkipped(notice.count, notice.limit);

    return (
        <div
            role="status"
            aria-live="polite"
            className="flex items-start gap-2 rounded-md border border-outline-variant bg-surface-container px-3 py-2.5 text-meta text-on-surface"
        >
            <AlertCircle
                className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-new)]"
                aria-hidden="true"
            />
            <p className="flex-1 leading-relaxed">{message}</p>
            <button
                type="button"
                onClick={onDismiss}
                aria-label={t.dismiss}
                className="shrink-0 rounded-sm p-0.5 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
            >
                <X className="h-4 w-4" aria-hidden="true" />
            </button>
        </div>
    );
}
