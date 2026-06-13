'use client';

import React from 'react';
import type { TradingStyle, TStrings } from './types';

// 진입 계획표(1·2·3차 + StopLoss 카드).
// 계산된 값들을 props로 받아 렌더만 담당한다.
interface Props {
    t: TStrings;
    entryLevels: number[];
    splits: number[];
    stopLossPrice: number;
    currentPrice: number;
    tradingStyle: TradingStyle;
    lang: 'en' | 'ko';
}

export const EntryPlanSection: React.FC<Props> = ({
    t,
    entryLevels,
    splits,
    stopLossPrice,
    currentPrice,
    tradingStyle,
    lang,
}) => {
    // 진입 차수별 코멘트 — 입력(tradingStyle, lang, index)에 대한 출력 동일 보장.
    const getEntryComment = (index: number) => {
        const isTrend = tradingStyle === 'trend';
        const isReversal = tradingStyle === 'reversal';
        const isBreakout = tradingStyle === 'breakout';

        if (lang === 'en') {
            if (index === 0) {
                if (isTrend) return 'Market Buy\n(Current)';
                if (isReversal) return 'Limit Buy\n(Support Lv)';
                if (isBreakout) return 'Stop Buy\n(Resistance Lv)';
            }
            if (index === 1) return isBreakout ? 'Retest Level' : 'DCA Level 1';
            if (index === 2) return isBreakout ? 'Last Defense' : 'Major Support';
        } else {
            if (index === 0) {
                if (isTrend) return '시장가 진입\n(현재 추세)';
                if (isReversal) return '지정가 매수\n(지지선 공략)';
                if (isBreakout) return '돌파 매수(Stop)\n(저항선 돌파)';
            }
            if (index === 1) return isBreakout ? '리테스트 구간' : '1차 물타기/조정';
            if (index === 2) return isBreakout ? '마지노선' : '2차 강력 지지';
        }
        return '';
    };

    return (
        <div>
            <h4 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
                {t.labels.entryPlan}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {/* 1·2·3차 진입 */}
                {[0, 1, 2].map((idx) => (
                    <div key={idx} className={`relative p-3 rounded-xl border flex flex-col justify-between ${idx === 0 ? 'bg-blue-50 border-blue-300' : 'bg-surface-container/80 border-outline-variant border-dashed'
                        }`}>
                        <div className="mb-2">
                            <span className="text-xs font-bold text-on-surface-variant block mb-1">
                                {idx + 1}차 진입 ({splits[idx]}%)
                            </span>
                            <span className="text-xs text-on-surface-variant whitespace-pre-line leading-relaxed">
                                {getEntryComment(idx)}
                            </span>
                        </div>
                        <div className="text-lg md:text-xl font-black text-on-surface font-mono tracking-tight">
                            ${entryLevels[idx].toLocaleString(undefined, { maximumFractionDigits: 4 })}
                        </div>
                        {idx > 0 && (
                            <span className="absolute top-2 right-2 text-[10px] bg-surface-container-high text-on-surface px-1.5 py-0.5 rounded">
                                -{((1 - entryLevels[idx] / currentPrice) * 100).toFixed(1)}%
                            </span>
                        )}
                    </div>
                ))}

                {/* 손절 카드 */}
                <div className="p-3 rounded-xl border bg-red-50 border-red-300 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-8 h-8 bg-red-100 rounded-bl-xl"></div>
                    <div className="mb-2">
                        <span className="text-xs font-bold text-red-700 block mb-1">
                            STOP LOSS
                        </span>
                        <span className="text-xs text-red-600">
                            자동 매도 (손절)
                        </span>
                    </div>
                    <div className="text-lg md:text-xl font-black text-red-700 font-mono tracking-tight">
                        ${stopLossPrice.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                    </div>
                </div>
            </div>
        </div>
    );
};
