'use client';

import React, { useState, useEffect } from 'react';

interface Props {
    currentPrice: number;
    lang: 'en' | 'ko';
    analysis: any; // Using 'any' for now to avoid circular dependency complex types, or better, define a subset type
}

type TradingStyle = 'trend' | 'reversal' | 'breakout';
type EntryStyle = 'conservative' | 'aggressive';

export const TradingStrategyGuide: React.FC<Props> = ({ currentPrice, lang, analysis }) => {
    // User selections
    const [tradingStyle, setTradingStyle] = useState<TradingStyle>('trend');
    const [entryStyle, setEntryStyle] = useState<EntryStyle>('conservative');
    const [stopLossPercent, setStopLossPercent] = useState<number>(3.0);

    // AI Advice Logic
    const getAIAdvice = () => {
        if (!analysis) return null;

        // Use the robust pre-calculated win rate from AnalysisResult
        // Fallback to 50 if undefined or 0 (though analyzeMarket handles this)
        const avgWinRate = analysis.winRate ?? 50;

        const isStrongBuy = analysis.recommendation.includes('STRONG BUY') || analysis.recommendation.includes('강력 매수');
        const isBuy = analysis.recommendation.includes('BUY') || analysis.recommendation.includes('매수');
        const isSell = analysis.recommendation.includes('SELL') || analysis.recommendation.includes('매도');

        let title = '';
        let desc = '';
        let recStyle: EntryStyle = 'conservative';
        let recTradingStyle: TradingStyle = 'trend';
        let recStopLoss = 3.0;
        let color = '';

        if (lang === 'ko') {
            if (isStrongBuy) {
                title = `🚀 강력 매수 기회 (상승 확률 ${avgWinRate}%)`;
                desc = `상승 모멘텀이 폭발적입니다. '추세 추종' 스타일로 공격적 진입이 유리할 수 있으며, 손절은 짧게 -3.5%로 잡으세요.`;
                recStyle = 'aggressive';
                recTradingStyle = 'trend';
                recStopLoss = 3.5;
                color = 'text-green-400 border-green-500 bg-green-900/20';
            } else if (isBuy) {
                title = `📈 매수 우위 (상승 확률 ${avgWinRate}%)`;
                desc = `일반적인 상승 흐름입니다. '추세 추종' 스타일로 안전하게 눌림목을 노리세요. 손절 기준: -5.0%.`;
                recStyle = 'conservative';
                recTradingStyle = 'trend';
                recStopLoss = 5.0;
                color = 'text-green-300 border-green-500/50 bg-green-900/10';
            } else if (isSell) {
                title = `📉 하락세 우세 (상승 확률 ${avgWinRate}%)`;
                desc = `하락압력이 셉니다. '역추세' 관점으로 지지선 반등을 노리거나 관망하세요. 손절은 -4.0% 필수.`;
                recStyle = 'conservative';
                recTradingStyle = 'reversal';
                recStopLoss = 4.0;
                color = 'text-red-400 border-red-500 bg-red-900/20';
            } else {
                title = `👀 변동성 축소/관망 (상승 확률 ${avgWinRate}%)`;
                desc = `방향성이 없습니다. '돌파 매매'를 준비하거나 확실한 움직임을 기다리세요. 손절 -3.0%.`;
                recStyle = 'conservative';
                recTradingStyle = 'breakout';
                recStopLoss = 3.0;
                color = 'text-gray-400 border-gray-600 bg-gray-800';
            }
        } else {
            if (isStrongBuy) {
                title = `🚀 Strong Buy Opportunity (Win Rate ${avgWinRate}%)`;
                desc = "Explosive momentum. Recommend 'Trend Following' (Aggressive). Stop Loss -3.5%.";
                recStyle = 'aggressive';
                recTradingStyle = 'trend';
                recStopLoss = 3.5;
                color = 'text-green-400 border-green-500 bg-green-900/20';
            } else if (isBuy) {
                title = `📈 Buy Signal (Win Rate ${avgWinRate}%)`;
                desc = "Stable uptrend. Recommend 'Trend Following' (Conservative). Stop Loss -5.0%.";
                recStyle = 'conservative';
                recTradingStyle = 'trend';
                recStopLoss = 5.0;
                color = 'text-green-300 border-green-500/50 bg-green-900/10';
            } else if (isSell) {
                title = `📉 Downside Risk (Win Rate ${avgWinRate}%)`;
                desc = "Bearish pressure. Wait for 'Reversal' or stay out. Stop Loss -4.0%.";
                recStyle = 'conservative';
                recTradingStyle = 'reversal';
                recStopLoss = 4.0;
                color = 'text-red-400 border-red-500 bg-red-900/20';
            } else {
                title = `👀 Wait & See (Win Rate ${avgWinRate}%)`;
                desc = "No clear direction. Prepare for 'Breakout'. Stop Loss -3.0%.";
                recStyle = 'conservative';
                recTradingStyle = 'breakout';
                recStopLoss = 3.0;
                color = 'text-gray-400 border-gray-600 bg-gray-800';
            }
        }

        return { title, desc, recStyle, recTradingStyle, recStopLoss, color };
    };

    const aiAdvice = getAIAdvice();

    // Auto-select recommended style on load if changed
    useEffect(() => {
        if (aiAdvice) {
            setEntryStyle(aiAdvice.recStyle);
            setTradingStyle(aiAdvice.recTradingStyle);
            setStopLossPercent(aiAdvice.recStopLoss);
        }
    }, [analysis]);


    const t = {
        title: lang === 'ko' ? '🎓 AI 매매 전략 가이드' : '🎓 AI Trading Strategy',
        styles: {
            trend: lang === 'ko' ? '🌊 추세 추종 (Trend)' : '🌊 Trend Following',
            reversal: lang === 'ko' ? '↩️ 역추세 (Reversal)' : '↩️ Reversal',
            breakout: lang === 'ko' ? '🚀 돌파 매매 (Breakout)' : '🚀 Breakout',
        },
        entryStyles: {
            conservative: lang === 'ko' ? '🛡️ 안전형 (Conservative)' : '🛡️ Conservative',
            aggressive: lang === 'ko' ? '⚔️ 공격형 (Aggressive)' : '⚔️ Aggressive',
        },
        labels: {
            tradingStyle: lang === 'ko' ? '매매 스타일 선택' : 'Select Trading Style',
            entryStyle: lang === 'ko' ? '진입 및 비중 스타일' : 'Entry & Allocation Style',
            stopLoss: lang === 'ko' ? '손절 감수 (Risk Tolerance)' : 'Stop Loss Tolerance',
            entryPlan: lang === 'ko' ? '📋 진입 계획표' : '📋 Entry Plan',
            stopLossPrice: lang === 'ko' ? '📉 손절 가격 (Stop Loss)' : '📉 Stop Loss Price',
        },
        descriptions: {
            trend: lang === 'ko'
                ? '상승 흐름에 올라타는 전략입니다. 눌림목(조정) 마다 분할 매수합니다.'
                : 'Ride the wave. Buy on dips during an uptrend.',
            reversal: lang === 'ko'
                ? '가격이 바닥을 찍고 턴할 때 잡는 전략입니다. 지지선 근처에서 촘촘히 잡습니다.'
                : 'Catch the bottom. Buy near support levels.',
            breakout: lang === 'ko'
                ? '주요 저항선을 뚫을 때 진입합니다. 리테스트 구간을 노립니다.'
                : 'Buy when price breaks resistance or retests it.',
            safe_split: lang === 'ko' ? '비중: 20% → 30% → 50% (피라미딩)' : 'Split: 20% → 30% → 50%',
            agg_split: lang === 'ko' ? '비중: 40% → 30% → 30% (선진입 중시)' : 'Split: 40% → 30% → 30%',
        }
    };

    // Calculate Entry Levels based on Trading Style
    const getEntryLevels = () => {
        let entryPrice = currentPrice;
        let drops = [0, 0, 0]; // Percent drops/gaps for 1st, 2nd, 3rd entry

        if (analysis?.priceLevels) {
            const support = Array.isArray(analysis.priceLevels.support) ? analysis.priceLevels.support[0] : analysis.priceLevels.support;
            const resistance = Array.isArray(analysis.priceLevels.resistance) ? analysis.priceLevels.resistance[0] : analysis.priceLevels.resistance;

            switch (tradingStyle) {
                case 'trend':
                    // Trend: Market Entry
                    entryPrice = currentPrice;
                    drops = [0, 0.02, 0.05]; // 0%, -2%, -5%
                    break;
                case 'reversal':
                    // Reversal: Limit Entry at Support (or near it)
                    // If Support is far below, we set 1st entry at Support.
                    // If Support is very close, we use it directly.
                    entryPrice = support && support > currentPrice ? currentPrice : (support || currentPrice);
                    // Entries: Support, Support-2%, Support-5%
                    drops = [0, 0.02, 0.05];
                    break;
                case 'breakout':
                    // Breakout: Stop Entry at Resistance
                    // If Resistance is above current, we set entry there.
                    entryPrice = resistance && resistance < currentPrice ? currentPrice : (resistance || currentPrice);
                    // Entries: Breakout Level, Retest (-1% of breakout), Retest fail (-3%)
                    drops = [0, 0.01, 0.03];
                    break;
            }
        } else {
            // Fallback if no analysis data
            switch (tradingStyle) {
                case 'trend': drops = [0, 0.02, 0.05]; break;
                case 'reversal': drops = [0.03, 0.05, 0.08]; break; // Naive fallback
                case 'breakout': drops = [0, 0.01, 0.025]; break;
            }
        }

        return drops.map(d => entryPrice * (1 - d));
    };

    const entryLevels = getEntryLevels();
    // Stop Loss should be relative to the 1st Entry Price (the primary entry), not current price.
    // If we enter at Support (lower), Stop Loss is lower. If at Resistance (higher), Stop Loss is higher.
    const stopLossPrice = entryLevels[0] * (1 - stopLossPercent / 100);

    const getSplitRatios = () => {
        return entryStyle === 'conservative' ? [20, 30, 50] : [40, 30, 30];
    };
    const splits = getSplitRatios();

    // Recommend entry comments logic
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
        <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden mt-6 shadow-lg">

            {/* AI Summary Section */}
            {aiAdvice && (
                <div className={`p-5 border-b border-gray-800 ${aiAdvice.color}`}>
                    <h3 className="text-lg md:text-xl font-bold mb-1 flex items-center gap-2">
                        {aiAdvice.title}
                    </h3>
                    <p className="text-sm md:text-base opacity-90 leading-relaxed">
                        {aiAdvice.desc}
                    </p>
                </div>
            )}

            <div className="bg-gray-800 p-4 border-b border-gray-700">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    {t.title}
                </h3>
            </div>

            <div className="p-5 space-y-6">
                {/* 1. Configuration Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Trading Style Selector */}
                    <div className="space-y-2">
                        <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">{t.labels.tradingStyle}</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['trend', 'reversal', 'breakout'] as const).map(style => (
                                <button
                                    key={style}
                                    onClick={() => setTradingStyle(style)}
                                    className={`p-2 rounded-lg text-xs md:text-sm font-bold border transition-all ${tradingStyle === style
                                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/50'
                                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                                        }`}
                                >
                                    {t.styles[style].split(' (')[0]}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-1 pl-1">
                            {t.descriptions[tradingStyle]}
                        </p>
                    </div>

                    {/* Entry Style & Risk */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">{t.labels.entryStyle}</label>
                            <div className="flex bg-gray-800 rounded-lg p-1">
                                {(['conservative', 'aggressive'] as const).map(style => (
                                    <button
                                        key={style}
                                        onClick={() => setEntryStyle(style)}
                                        className={`flex-1 py-1.5 rounded text-xs font-bold transition-all ${entryStyle === style
                                            ? 'bg-gray-600 text-white shadow'
                                            : 'text-gray-400 hover:text-gray-200'
                                            }`}
                                    >
                                        {t.entryStyles[style].split(' (')[0]}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-gray-500 pl-1">
                                {entryStyle === 'conservative' ? t.descriptions.safe_split : t.descriptions.agg_split}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-end">
                                <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">{t.labels.stopLoss}</label>
                                <span className="text-red-400 font-bold font-mono text-sm">-{stopLossPercent}%</span>
                            </div>
                            <input
                                type="range" min="1" max="15" step="0.5"
                                value={stopLossPercent}
                                onChange={(e) => setStopLossPercent(Number(e.target.value))}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                            />
                        </div>
                    </div>
                </div>

                <div className="h-px bg-gray-800 w-full" />

                {/* 2. Results Section (Entry Plan) */}
                <div>
                    <h4 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
                        {t.labels.entryPlan}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        {/* Entry 1, 2, 3 */}
                        {[0, 1, 2].map((idx) => (
                            <div key={idx} className={`relative p-3 rounded-xl border flex flex-col justify-between ${idx === 0 ? 'bg-blue-900/20 border-blue-500/50' : 'bg-gray-800/50 border-gray-700 border-dashed'
                                }`}>
                                <div className="mb-2">
                                    <span className="text-xs font-bold text-gray-400 block mb-1">
                                        {idx + 1}차 진입 ({splits[idx]}%)
                                    </span>
                                    <span className="text-xs text-gray-500 whitespace-pre-line leading-relaxed">
                                        {getEntryComment(idx)}
                                    </span>
                                </div>
                                <div className="text-lg md:text-xl font-black text-white font-mono tracking-tight">
                                    ${entryLevels[idx].toLocaleString(undefined, { maximumFractionDigits: 4 })}
                                </div>
                                {idx > 0 && (
                                    <span className="absolute top-2 right-2 text-[10px] bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded">
                                        -{((1 - entryLevels[idx] / currentPrice) * 100).toFixed(1)}%
                                    </span>
                                )}
                            </div>
                        ))}

                        {/* Stop Loss Card */}
                        <div className="p-3 rounded-xl border bg-red-900/10 border-red-500/50 flex flex-col justify-between relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-8 h-8 bg-red-500/10 rounded-bl-xl"></div>
                            <div className="mb-2">
                                <span className="text-xs font-bold text-red-400 block mb-1">
                                    STOP LOSS
                                </span>
                                <span className="text-xs text-red-300/70">
                                    자동 매도 (손절)
                                </span>
                            </div>
                            <div className="text-lg md:text-xl font-black text-red-400 font-mono tracking-tight">
                                ${stopLossPrice.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
