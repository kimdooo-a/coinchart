'use client';

/**
 * 로그인 사용자 상태 훅 (R12 / T-B)
 * - AuthButton.tsx와 동일한 supabase 클라이언트 패턴. 계정 카드·동기화 상태 표시용.
 */

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

export interface AuthUserState {
    user: User | null;
    loading: boolean;
}

export function useAuthUser(): AuthUserState {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const supabase = createClient();
        let alive = true;

        supabase.auth.getUser().then(({ data }) => {
            if (!alive) return;
            setUser(data.user ?? null);
            setLoading(false);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => {
            alive = false;
            subscription.unsubscribe();
        };
    }, []);

    return { user, loading };
}

/** Supabase OAuth provider 식별자를 한국어 표시명으로 */
export function providerLabel(provider: string | undefined, lang: 'ko' | 'en'): string {
    const map: Record<string, { ko: string; en: string }> = {
        google: { ko: '구글', en: 'Google' },
        kakao: { ko: '카카오', en: 'Kakao' },
        github: { ko: 'GitHub', en: 'GitHub' },
        email: { ko: '이메일', en: 'Email' },
    };
    const entry = provider ? map[provider] : undefined;
    if (entry) return entry[lang];
    return provider ?? (lang === 'ko' ? '알 수 없음' : 'Unknown');
}
