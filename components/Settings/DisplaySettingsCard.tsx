'use client';

/**
 * 표시 설정 카드 (R12 / T-B) — 시세 통화 · 등락 색상
 * - 저장 버튼 없이 즉시 반영. 등락 색상은 변경 즉시 미리보기에 적용되어 효과를 보여줌.
 */

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useDisplaySettings, getChangeColorClass } from '@/lib/config/display-settings';
import { SettingsCard, SettingRow } from './SettingsCard';
import { SegmentedToggle } from './SegmentedToggle';

export function DisplaySettingsCard() {
    const { lang } = useLanguage();
    const { currency, changeColor, setCurrency, setChangeColor, isHydrated } = useDisplaySettings();

    const t = (ko: string, en: string) => (lang === 'ko' ? ko : en);

    return (
        <SettingsCard title={t('표시 설정', 'Display')}>
            <SettingRow
                label={t('시세 통화', 'Price currency')}
                description={t('KRW는 김치프리미엄 환율로 환산합니다.', 'KRW is converted via the kimchi-premium rate.')}
                control={
                    <SegmentedToggle
                        ariaLabel={t('시세 통화', 'Price currency')}
                        value={currency}
                        onChange={setCurrency}
                        options={[
                            { value: 'USD', label: 'USD' },
                            { value: 'KRW', label: 'KRW' },
                        ]}
                    />
                }
            />

            <SettingRow
                label={t('등락 색상', 'Change colors')}
                description={t('상승/하락 표시 색을 선택합니다.', 'Pick how rises and falls are colored.')}
                control={
                    <div className="flex flex-col items-end gap-2">
                        <SegmentedToggle
                            ariaLabel={t('등락 색상', 'Change colors')}
                            value={changeColor}
                            onChange={setChangeColor}
                            options={[
                                { value: 'KR', label: t('한국식', 'Korea') },
                                { value: 'GLOBAL', label: t('글로벌', 'Global') },
                            ]}
                        />
                        {/* 즉시 반영 미리보기 */}
                        <div
                            className="flex items-center gap-3 text-body-sm font-mono"
                            aria-hidden={!isHydrated}
                        >
                            <span className={getChangeColorClass(1, changeColor)}>▲ +1.58%</span>
                            <span className={getChangeColorClass(-1, changeColor)}>▼ -0.74%</span>
                        </div>
                    </div>
                }
            />
        </SettingsCard>
    );
}
