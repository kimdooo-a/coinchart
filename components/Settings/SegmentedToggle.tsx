'use client';

/**
 * 2~N지 세그먼트 토글 (R12 / T-B)
 * - 00-overview §9-4 탭 / §10 인터랙션 톤. 보더 1px·rounded-md·즉시 반영.
 * - 활성 세그먼트 = 브랜드 그린(taste #7). 포커스 링으로 키보드 접근성 확보(§11).
 */

import React from 'react';

export interface SegmentOption<T extends string> {
    value: T;
    label: React.ReactNode;
}

interface SegmentedToggleProps<T extends string> {
    value: T;
    options: SegmentOption<T>[];
    onChange: (value: T) => void;
    ariaLabel: string;
}

export function SegmentedToggle<T extends string>({
    value,
    options,
    onChange,
    ariaLabel,
}: SegmentedToggleProps<T>) {
    return (
        <div
            role="radiogroup"
            aria-label={ariaLabel}
            className="inline-flex rounded-md border border-outline-variant overflow-hidden bg-surface-container-lowest"
        >
            {options.map((opt) => {
                const active = opt.value === value;
                return (
                    <button
                        key={opt.value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => onChange(opt.value)}
                        className={[
                            'px-3 py-1.5 text-body-sm transition-colors whitespace-nowrap',
                            'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary',
                            active
                                ? 'bg-secondary text-on-secondary font-bold'
                                : 'text-on-surface-variant hover:bg-surface-container',
                        ].join(' ')}
                    >
                        {opt.label}
                    </button>
                );
            })}
        </div>
    );
}
