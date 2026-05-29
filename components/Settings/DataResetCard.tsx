'use client';

/**
 * 데이터 초기화 카드 (R12 / T-B)
 * - 이 브라우저의 로컬 사용자 데이터(관심종목·최근 본 종목·검색 기록)를 즉시 삭제.
 * - 표시 환경설정(`cca:display`)·언어는 보존(설정은 데이터가 아님).
 * - 되돌릴 수 없으므로 confirm 1회. 완료 시 인라인 안내.
 */

import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { clearLocalData } from '@/lib/config/local-data';
import { SettingsCard, SettingRow } from './SettingsCard';

export function DataResetCard() {
    const { lang } = useLanguage();
    const [done, setDone] = useState(false);

    const t = (ko: string, en: string) => (lang === 'ko' ? ko : en);

    const handleReset = () => {
        const ok = window.confirm(
            t(
                '이 브라우저에 저장된 관심종목·최근 본 종목·검색 기록을 모두 삭제합니다. 되돌릴 수 없습니다. 계속할까요?',
                'This deletes your watchlist, recently viewed, and search history stored in this browser. This cannot be undone. Continue?',
            ),
        );
        if (!ok) return;
        clearLocalData();
        setDone(true);
    };

    return (
        <SettingsCard title={t('데이터', 'Data')}>
            <SettingRow
                label={t('로컬 데이터 초기화', 'Reset local data')}
                description={t(
                    '이 브라우저의 관심종목·최근 본 종목·검색 기록을 삭제합니다.',
                    'Delete watchlist, recently viewed, and search history in this browser.',
                )}
                control={
                    <div className="flex flex-col items-end gap-1.5">
                        <button
                            type="button"
                            onClick={handleReset}
                            className="inline-flex items-center gap-1.5 rounded-md border border-error/40 px-3 py-1.5 text-body-sm text-error hover:bg-error/10 transition-colors focus-visible:outline-2 focus-visible:outline-error"
                        >
                            <Trash2 className="w-4 h-4" />
                            {t('초기화', 'Reset')}
                        </button>
                        {done && (
                            <span className="text-meta text-on-surface-variant" role="status">
                                {t('초기화되었습니다.', 'Reset complete.')}
                            </span>
                        )}
                    </div>
                }
            />
        </SettingsCard>
    );
}
