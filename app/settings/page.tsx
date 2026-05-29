'use client';

/**
 * 설정 페이지 (R12 / T-B / S1)
 * ------------------------------------------------------------------
 * v2.0 네이버 톤. 익명/회원 모두 동작하는 "표시 환경설정" 중심.
 * 솎아낸 항목(다크모드·언어·알림·2FA)은 넣지 않음 — 미구현 빈 카드 0.
 * 설정 변경은 저장 버튼 없이 즉시 반영(localStorage `cca:display`).
 *
 * DisplaySettingsProvider 는 S2(R12 Wave2)에서 app/layout.tsx 루트로 단일 마운트했다.
 * 따라서 이 페이지의 로컬 래퍼는 제거 — 루트 Provider 를 그대로 구독한다.
 */

import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { DisplaySettingsCard } from '@/components/Settings/DisplaySettingsCard';
import { WatchlistCard } from '@/components/Settings/WatchlistCard';
import { DataResetCard } from '@/components/Settings/DataResetCard';
import { AccountCard } from '@/components/Settings/AccountCard';

export default function SettingsPage() {
    const { lang } = useLanguage();
    const t = (ko: string, en: string) => (lang === 'ko' ? ko : en);

    return (
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
    );
}
