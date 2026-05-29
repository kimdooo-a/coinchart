'use client';

/**
 * 관심종목 카드 (R12 / T-B) — 개수 + 회원 동기화 상태 + 바로가기
 * - 라우트 /watchlist 는 T-A 생성. 여기서는 링크만 건다.
 * - 동기화 상태: 회원=켜짐(예정) / 익명=꺼짐(로그인 유도). 실제 DB 동기화는 D3 후속.
 */

import React, { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { getWatchlistCount, WATCHLIST_STORAGE_KEY } from '@/lib/config/local-data';
import { SettingsCard, SettingRow } from './SettingsCard';
import { useAuthUser } from './useAuthUser';

// watchlist localStorage 키 구독 (다른 탭 변경 시에도 카운트 반영). 숫자 스냅샷이라 캐싱 불필요.
function subscribeWatchlist(callback: () => void): () => void {
    const onStorage = (e: StorageEvent) => {
        if (e.key === WATCHLIST_STORAGE_KEY) callback();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
}

export function WatchlistCard() {
    const { lang } = useLanguage();
    const { user, loading } = useAuthUser();
    const count = useSyncExternalStore(subscribeWatchlist, getWatchlistCount, () => 0);

    const t = (ko: string, en: string) => (lang === 'ko' ? ko : en);

    const syncText = loading
        ? ''
        : user
          ? t('회원 동기화: 켜짐', 'Sync: on')
          : t('회원 동기화: 꺼짐 (로그인 시 기기 간 동기화)', 'Sync: off (sign in to sync across devices)');

    return (
        <SettingsCard title={t('관심종목', 'Watchlist')}>
            <SettingRow
                label={t(`관심종목 ${count}개`, `${count} item${count === 1 ? '' : 's'}`)}
                description={syncText}
                control={
                    <Link
                        href="/watchlist"
                        className="inline-flex items-center gap-1.5 rounded-md border border-outline-variant px-3 py-1.5 text-body-sm text-on-surface hover:bg-surface-container transition-colors focus-visible:outline-2 focus-visible:outline-primary"
                    >
                        {t('관심종목 열기', 'Open watchlist')}
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                }
            />
        </SettingsCard>
    );
}
