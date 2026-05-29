'use client';

/**
 * 설정 그룹 카드 + 행 프리미티브 (R12 / T-B)
 * - 00-overview §2 회피사항 준수: 보더 1px·rounded-md·그라디언트/블러/큰 라운드 금지.
 */

import React from 'react';

interface SettingsCardProps {
    title: string;
    children: React.ReactNode;
}

export function SettingsCard({ title, children }: SettingsCardProps) {
    return (
        <section className="rounded-md border border-outline-variant bg-surface-container-lowest">
            <h2 className="px-4 py-3 text-body-base font-bold text-on-surface border-b border-outline-variant">
                {title}
            </h2>
            <div className="divide-y divide-outline-variant">{children}</div>
        </section>
    );
}

interface SettingRowProps {
    label: string;
    description?: string;
    /** 우측 컨트롤 */
    control: React.ReactNode;
}

export function SettingRow({ label, description, control }: SettingRowProps) {
    return (
        <div className="flex items-center justify-between gap-4 px-4 py-3">
            <div className="min-w-0">
                <p className="text-body-base text-on-surface">{label}</p>
                {description && (
                    <p className="mt-0.5 text-body-sm text-on-surface-variant">{description}</p>
                )}
            </div>
            <div className="shrink-0">{control}</div>
        </div>
    );
}
