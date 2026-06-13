'use client';

import React from 'react';
import type { TradingStyle, EntryStyle, TStrings } from './types';

// 매매스타일/진입스타일/손절 슬라이더 설정 UI.
// 현재값과 setter들을 props로 받아 부모 상태를 직접 갱신한다(동작 보존).
interface Props {
    t: TStrings;
    tradingStyle: TradingStyle;
    setTradingStyle: (s: TradingStyle) => void;
    entryStyle: EntryStyle;
    setEntryStyle: (s: EntryStyle) => void;
    stopLossPercent: number;
    setStopLossPercent: (n: number) => void;
}

export const ConfigSection: React.FC<Props> = ({
    t,
    tradingStyle,
    setTradingStyle,
    entryStyle,
    setEntryStyle,
    stopLossPercent,
    setStopLossPercent,
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 매매 스타일 선택 */}
            <div className="space-y-2">
                <label className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">{t.labels.tradingStyle}</label>
                <div className="grid grid-cols-3 gap-2">
                    {(['trend', 'reversal', 'breakout'] as const).map(style => (
                        <button
                            key={style}
                            onClick={() => setTradingStyle(style)}
                            className={`p-2 rounded-lg text-xs md:text-sm font-bold border transition-all ${tradingStyle === style
                                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-200'
                                : 'bg-surface-container border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
                                }`}
                        >
                            {t.styles[style].split(' (')[0]}
                        </button>
                    ))}
                </div>
                <p className="text-xs text-on-surface-variant mt-1 pl-1">
                    {t.descriptions[tradingStyle]}
                </p>
            </div>

            {/* 진입 스타일 & 리스크 */}
            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">{t.labels.entryStyle}</label>
                    <div className="flex bg-surface-container rounded-lg p-1">
                        {(['conservative', 'aggressive'] as const).map(style => (
                            <button
                                key={style}
                                onClick={() => setEntryStyle(style)}
                                className={`flex-1 py-1.5 rounded text-xs font-bold transition-all ${entryStyle === style
                                    ? 'bg-surface-container-highest text-on-surface shadow'
                                    : 'text-on-surface-variant hover:text-on-surface'
                                    }`}
                            >
                                {t.entryStyles[style].split(' (')[0]}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-on-surface-variant pl-1">
                        {entryStyle === 'conservative' ? t.descriptions.safe_split : t.descriptions.agg_split}
                    </p>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-end">
                        <label className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">{t.labels.stopLoss}</label>
                        <span className="text-red-600 font-bold font-mono text-sm">-{stopLossPercent}%</span>
                    </div>
                    <input
                        type="range" min="1" max="15" step="0.5"
                        value={stopLossPercent}
                        onChange={(e) => setStopLossPercent(Number(e.target.value))}
                        className="w-full h-2 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-red-500"
                    />
                </div>
            </div>
        </div>
    );
};
