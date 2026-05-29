'use client';

/**
 * 계정 카드 (R12 / T-B) — 회원만 렌더
 * - 로그인 이메일 + 연결 OAuth 표시 + 로그아웃. (스텁의 "보안/2FA" 그룹의 현실적 대체)
 * - 익명이면 null (미구현 빈 카드 0 — 안티패턴 회피).
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { createClient } from '@/lib/supabase/client';
import { SettingsCard, SettingRow } from './SettingsCard';
import { useAuthUser, providerLabel } from './useAuthUser';

export function AccountCard() {
    const { lang } = useLanguage();
    const { user, loading } = useAuthUser();
    const router = useRouter();

    const t = (ko: string, en: string) => (lang === 'ko' ? ko : en);

    // 익명/로딩 중에는 카드 자체를 렌더하지 않음
    if (loading || !user) return null;

    const provider = providerLabel(user.app_metadata?.provider, lang);

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.refresh();
    };

    return (
        <SettingsCard title={t('계정', 'Account')}>
            <SettingRow
                label={user.email ?? t('로그인됨', 'Signed in')}
                description={t(`${provider} 연결`, `Connected via ${provider}`)}
                control={
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="inline-flex items-center gap-1.5 rounded-md border border-outline-variant px-3 py-1.5 text-body-sm text-on-surface hover:bg-surface-container transition-colors focus-visible:outline-2 focus-visible:outline-primary"
                    >
                        <LogOut className="w-4 h-4" />
                        {t('로그아웃', 'Sign out')}
                    </button>
                }
            />
        </SettingsCard>
    );
}
