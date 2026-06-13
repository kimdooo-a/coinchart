'use client';

import React, { useState, useEffect } from 'react';
import type { TradingStyle, EntryStyle, TStrings } from './TradingStrategyGuide/types';
import { AIAdviceSection } from './TradingStrategyGuide/AIAdviceSection';
import { ConfigSection } from './TradingStrategyGuide/ConfigSection';
import { EntryPlanSection } from './TradingStrategyGuide/EntryPlanSection';

interface Props {
    currentPrice: number;
    lang: 'en' | 'ko';
    analysis: {
        winRate?: number;
        recommendation: string;
        priceLevels: {
            support: number | number[];
            resistance: number | number[];
        };
    };
}

export const TradingStrategyGuide: React.FC<Props> = ({ currentPrice, lang, analysis }) => {
    // 사용자 선택 상태 (부모 보유)
    const [tradingStyle, setTradingStyle] = useState<TradingStyle>('trend');
    const [entryStyle, setEntryStyle] = useState<EntryStyle>('conservative');
    const [stopLossPercent, setStopLossPercent] = useState<number>(3.0);

    // AI 조언 로직
    const getAIAdvice = () => {
        if (!analysis) return null;

        // AnalysisResult에서 미리 계산된 승률 사용. undefined/0이면 50으로 폴백.
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
                color = 'bg-green-50 text-green-700 border-green-300';
            } else if (isBuy) {
                title = `📈 매수 우위 (상승 확률 ${avgWinRate}%)`;
                desc = `일반적인 상승 흐름입니다. '추세 추종' 스타일로 안전하게 눌림목을 노리세요. 손절 기준: -5.0%.`;
                recStyle = 'conservative';
                recTradingStyle = 'trend';
                recStopLoss = 5.0;
                color = 'bg-green-50 text-green-700 border-green-200';
            } else if (isSell) {
                title = `📉 하락세 우세 (상승 확률 ${avgWinRate}%)`;
                desc = `하락압력이 셉니다. '역추세' 관점으로 지지선 반등을 노리거나 관망하세요. 손절은 -4.0% 필수.`;
                recStyle = 'conservative';
                recTradingStyle = 'reversal';
                recStopLoss = 4.0;
                color = 'bg-red-50 text-red-700 border-red-300';
            } else {
                title = `👀 변동성 축소/관망 (상승 확률 ${avgWinRate}%)`;
                desc = `방향성이 없습니다. '돌파 매매'를 준비하거나 확실한 움직임을 기다리세요. 손절 -3.0%.`;
                recStyle = 'conservative';
                recTradingStyle = 'breakout';
                recStopLoss = 3.0;
                color = 'text-on-surface-variant border-outline bg-surface-container';
            }
        } else {
            if (isStrongBuy) {
                title = `🚀 Strong Buy Opportunity (Win Rate ${avgWinRate}%)`;
                desc = "Explosive momentum. Recommend 'Trend Following' (Aggressive). Stop Loss -3.5%.";
                recStyle = 'aggressive';
                recTradingStyle = 'trend';
                recStopLoss = 3.5;
                color = 'bg-green-50 text-green-700 border-green-300';
            } else if (isBuy) {
                title = `📈 Buy Signal (Win Rate ${avgWinRate}%)`;
                desc = "Stable uptrend. Recommend 'Trend Following' (Conservative). Stop Loss -5.0%.";
                recStyle = 'conservative';
                recTradingStyle = 'trend';
                recStopLoss = 5.0;
                color = 'bg-green-50 text-green-700 border-green-200';
            } else if (isSell) {
                title = `📉 Downside Risk (Win Rate ${avgWinRate}%)`;
                desc = "Bearish pressure. Wait for 'Reversal' or stay out. Stop Loss -4.0%.";
                recStyle = 'conservative';
                recTradingStyle = 'reversal';
                recStopLoss = 4.0;
                color = 'bg-red-50 text-red-700 border-red-300';
            } else {
                title = `👀 Wait & See (Win Rate ${avgWinRate}%)`;
                desc = "No clear direction. Prepare for 'Breakout'. Stop Loss -3.0%.";
                recStyle = 'conservative';
                recTradingStyle = 'breakout';
                recStopLoss = 3.0;
                color = 'text-on-surface-variant border-outline bg-surface-container';
            }
        }

        return { title, desc, recStyle, recTradingStyle, recStopLoss, color };
    };

    const aiAdvice = getAIAdvice();

    // 로드 시 추천 스타일 자동 선택
    useEffect(() => {
        if (aiAdvice) {
            setEntryStyle(aiAdvice.recStyle);
            setTradingStyle(aiAdvice.recTradingStyle);
            setStopLossPercent(aiAdvice.recStopLoss);
        }
    }, [analysis]);


    const t: TStrings = {
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

    // 매매 스타일 기반 진입 가격 계산
    const getEntryLevels = () => {
        let entryPrice = currentPrice;
        let drops = [0, 0, 0]; // 1·2·3차 진입의 하락 갭(%)

        if (analysis?.priceLevels) {
            const support = Array.isArray(analysis.priceLevels.support) ? analysis.priceLevels.support[0] : analysis.priceLevels.support;
            const resistance = Array.isArray(analysis.priceLevels.resistance) ? analysis.priceLevels.resistance[0] : analysis.priceLevels.resistance;

            switch (tradingStyle) {
                case 'trend':
                    // 추세: 시장가 진입
                    entryPrice = currentPrice;
                    drops = [0, 0.02, 0.05]; // 0%, -2%, -5%
                    break;
                case 'reversal':
                    // 역추세: 지지선 근처 지정가 진입
                    entryPrice = support && support > currentPrice ? currentPrice : (support || currentPrice);
                    drops = [0, 0.02, 0.05];
                    break;
                case 'breakout':
                    // 돌파: 저항선 돌파 시 진입
                    entryPrice = resistance && resistance < currentPrice ? currentPrice : (resistance || currentPrice);
                    drops = [0, 0.01, 0.03];
                    break;
            }
        } else {
            // 분석 데이터 없을 때 폴백
            switch (tradingStyle) {
                case 'trend': drops = [0, 0.02, 0.05]; break;
                case 'reversal': drops = [0.03, 0.05, 0.08]; break;
                case 'breakout': drops = [0, 0.01, 0.025]; break;
            }
        }

        return drops.map(d => entryPrice * (1 - d));
    };

    const entryLevels = getEntryLevels();
    // 손절은 현재가가 아닌 1차 진입가 기준으로 계산.
    const stopLossPrice = entryLevels[0] * (1 - stopLossPercent / 100);

    const getSplitRatios = () => {
        return entryStyle === 'conservative' ? [20, 30, 50] : [40, 30, 30];
    };
    const splits = getSplitRatios();

    return (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden mt-6 shadow-lg">

            {/* AI 요약 섹션 */}
            {aiAdvice && <AIAdviceSection aiAdvice={aiAdvice} />}

            <div className="bg-surface-container p-4 border-b border-outline-variant">
                <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                    {t.title}
                </h3>
            </div>

            <div className="p-5 space-y-6">
                {/* 1. 설정 섹션 */}
                <ConfigSection
                    t={t}
                    tradingStyle={tradingStyle}
                    setTradingStyle={setTradingStyle}
                    entryStyle={entryStyle}
                    setEntryStyle={setEntryStyle}
                    stopLossPercent={stopLossPercent}
                    setStopLossPercent={setStopLossPercent}
                />

                <div className="h-px bg-outline-variant w-full" />

                {/* 2. 결과 섹션 (진입 계획표) */}
                <EntryPlanSection
                    t={t}
                    entryLevels={entryLevels}
                    splits={splits}
                    stopLossPrice={stopLossPrice}
                    currentPrice={currentPrice}
                    tradingStyle={tradingStyle}
                    lang={lang}
                />
            </div>
        </div>
    );
};
