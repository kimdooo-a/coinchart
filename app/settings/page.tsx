'use client';

/**
 * 설정 페이지 (R12 / T-B / S1)
 * ------------------------------------------------------------------
 * v2.0 네이버 톤. 익명/회원 모두 동작하는 "표시 환경설정" 중심.
 * 솎아낸 항목(다크모드·언어·알림·2FA)은 넣지 않음 — 미구현 빈 카드 0.
 * 설정 변경은 저장 버튼 없이 즉시 반영(localStorage `cca:display`).
 *
 * DisplaySettingsProvider 는 현재 이 페이지에 로컬 마운트한다. S2(전역 적용)에서
 * Provider 를 app/layout.tsx 루트로 끌어올리면 여기 래퍼는 제거한다.
 * (Provider 가 'storage' + 커스텀 이벤트로 동기화하므로 일시적 중첩도 안전.)
 */

import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { DisplaySettingsProvider } from '@/lib/config/display-settings';
import { DisplaySettingsCard } from '@/components/Settings/DisplaySettingsCard';
import { WatchlistCard } from '@/components/Settings/WatchlistCard';
import { DataResetCard } from '@/components/Settings/DataResetCard';
import { AccountCard } from '@/components/Settings/AccountCard';

export default function SettingsPage() {
    const { lang } = useLanguage();
    const t = (ko: string, en: string) => (lang === 'ko' ? ko : en);

    return (
        <DisplaySettingsProvider>
            <main className="w-full bg-surface-container-lowest text-on-surface">
                <div className="mx-auto w-full max-w-3xl px-4 py-8">
                    <header className="mb-6 flex items-center gap-2">
                        <SettingsIcon className="w-6 h-6 text-on-surface-variant" />
                        <h1 className="text-h2 font-bold text-on-surface">
                            {t('설정', 'Settings')}
                        </h1>
                    </header>

                    <div className="space-y-4">
                        <DisplaySettingsCard />
                        <WatchlistCard />
                        <DataResetCard />
                        <AccountCard />
                    </div>
                </div>
            </main>
        </DisplaySettingsProvider>
    );
}
