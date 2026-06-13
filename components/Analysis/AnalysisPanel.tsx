'use client';

// CRYPTO ANALYSIS ONLY - DO NOT ADD STOCK IMPORTS
import React, { useState } from 'react';
// import { TradingStrategyGuide } from './TradingStrategyGuide'; // Hiding legacy strategy guide
// import { PremiumLock } from '@/components/PremiumLock'; // Removed as Backtest is now free for all
import { useAnalysisCandles } from '@/components/hooks/useAnalysisCandles';
import { useAnalysisResult } from '@/components/hooks/useAnalysisResult';

// CandleData 타입은 useAnalysisCandles로 이전됨. 기존 외부 import 경로 호환을 위해 재노출.
export type { CandleData } from '@/components/hooks/useAnalysisCandles';

interface Props {
    symbol: string;
    lang: 'en' | 'ko';
}

// SSOT: Daily 데이터를 상위 타임프레임으로 집계
const ANALYSIS_INTERVALS = ['1d', '1w'];

export const AnalysisPanel: React.FC<Props> = ({ symbol, lang }) => {
    const [interval, setInterval] = useState('1d');
    const [showBacktestGuide, setShowBacktestGuide] = useState(false); // 토글용 상태

    // Free vs PRO Gate - 전체 해제됨
    const userTier = 'pro' as const;

    // 캔들 데이터 fetch + 집계 (커스텀 훅)
    const { candles, isLoading } = useAnalysisCandles(symbol, interval);

    // 시그널 + 과거 거래 + 종합 분석 결과 (커스텀 훅)
    const result = useAnalysisResult(candles, symbol, interval, userTier);

    // UI Translation (사용 중인 키만 유지 — 미사용 키는 정리)
    const t = {
        title: lang === 'ko' ? '⚡ 통계적 패턴 정밀 분석' : '⚡ Statistical Pattern Analysis',
        insufficient: lang === 'ko' ? '데이터 부족 (최근 50개 캔들 필요)' : 'Insufficient Data (>50 candles required)',
        evidence: lang === 'ko' ? '분석 근거' : 'Evidence',
        risk: lang === 'ko' ? '리스크 요인' : 'Risk Factors',
        watch: lang === 'ko' ? '주요 관전 포인트' : 'Key Watch Levels',
        grade: lang === 'ko' ? '신뢰도 등급' : 'Confidence Grade',
        prob: lang === 'ko' ? '상승 확률' : 'Rise Probability',
        na: 'N/A',
        // New Backtest Strings
        backtestTitle: lang === 'ko' ? '시스템 백테스트 (과거 시뮬레이션)' : 'System Backtest',
        bt_winRate: lang === 'ko' ? '승률' : 'Win Rate',
        bt_totalReturn: lang === 'ko' ? '총 수익률' : 'Total Return',
        bt_maxDD: lang === 'ko' ? '최대 낙폭' : 'Max Drawdown',
        bt_profitFactor: lang === 'ko' ? '손익비' : 'Profit Factor',
        bt_guideBtn: lang === 'ko' ? '지표 상세 가이드' : 'Metrics Guide'
    };

    // 1. Loading State
    if (isLoading) {
        return (
            <div className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant shadow-xl animate-pulse">
                <div className="h-8 bg-surface-container rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                    <div className="h-20 bg-surface-container rounded w-full"></div>
                    <div className="h-20 bg-surface-container rounded w-full"></div>
                </div>
            </div>
        );
    }

    // 2. Insufficient Data State
    if (!result || result.uiState === 'insufficient') {
        return (
            <div className="bg-surface-container-lowest rounded-xl p-10 border border-outline-variant text-center">
                <div className="text-on-surface-variant text-lg font-bold mb-2">⚠️ {t.insufficient}</div>
                <p className="text-sm text-on-surface-variant">Chart data is not available for this timeframe.</p>
            </div>
        );
    }

    // 3. OK / Pro-Locked State (마스킹은 userTier 기준으로 처리)
    const { probability, explanation } = result;
    const gradeColor = (g: string) => {
        if (g === 'A') return 'text-primary';
        if (g === 'B') return 'text-chart-2';
        if (g === 'C') return 'text-chart-3';
        return 'text-on-surface-variant';
    }

    return (
        <div className="bg-card rounded-xl p-4 md:p-6 border border-border shadow-xl space-y-6">
            {/* Header / Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="text-xl md:text-2xl font-bold flex items-center gap-2 mb-2">
                        {t.title}
                    </h3>
                    <div className="flex bg-surface-container rounded p-1 gap-1 self-start">
                        {ANALYSIS_INTERVALS.map(int => (
                            <button key={int} onClick={() => setInterval(int)}
                                className={`px-3 py-1 rounded text-xs font-bold transition-all ${interval === int ? 'bg-primary text-primary-foreground' : 'text-on-surface-variant hover:bg-muted'}`}>
                                {int.toUpperCase()}
                            </button>
                        ))}
                    </div>

                    {/* Data Source Disclaimer */}
                    <div className="mt-2 text-xs text-on-surface-variant flex items-center gap-1.5">
                        <span>ℹ️</span>
                        <span>
                            {lang === 'ko'
                                ? `본 분석은 최근 일봉(${interval.toUpperCase()}) 종가 데이터를 기준으로 산출된 추세 분석입니다. 실시간 시세가 아닌 데이터임을 유의해주세요. (기준일: ${candles.length > 0 ? new Date(candles[candles.length - 1].time * 1000).toLocaleDateString() : 'N/A'})`
                                : `Analysis based on latest Daily(${interval.toUpperCase()}) close data. Trends may lag real-time. (Date: ${candles.length > 0 ? new Date(candles[candles.length - 1].time * 1000).toLocaleDateString() : 'N/A'})`
                            }
                        </span>
                    </div>
                </div>

                {/* Probability Card (Summary) */}
                <div className="bg-muted/50 p-4 rounded-xl border border-border flex items-center gap-6">
                    <div className="text-center">
                        <div className="text-xs text-on-surface-variant uppercase tracking-wide mb-1">{t.grade}</div>
                        <div className={`text-3xl font-black ${gradeColor(result.confidence.grade)}`}>
                            {result.confidence.grade}
                        </div>
                    </div>
                    <div className="h-10 w-px bg-border"></div>
                    <div className="text-center">
                        <div className="text-xs text-on-surface-variant uppercase tracking-wide mb-1">{t.prob}</div>
                        <div className="text-2xl font-bold text-foreground">
                            {probability.probability}%
                        </div>
                    </div>
                </div>
            </div>

            {/* Explanation Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Evidence */}
                <div className="bg-background p-4 rounded-lg border border-border">
                    <h4 className="text-primary font-bold text-sm mb-2 flex items-center gap-2">
                        🔍 {t.evidence}
                    </h4>
                    <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">
                        {explanation.sections.evidence}
                    </p>
                </div>

                {/* Risk */}
                <div className="bg-background p-4 rounded-lg border border-border">
                    <h4 className="text-chart-3 font-bold text-sm mb-2 flex items-center gap-2">
                        ⚠️ {t.risk}
                    </h4>
                    <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">
                        {explanation.sections.risk}
                    </p>
                </div>

                {/* Watch */}
                <div className="bg-background p-4 rounded-lg border border-border">
                    <h4 className="text-chart-4 font-bold text-sm mb-2 flex items-center gap-2">
                        👀 {t.watch}
                    </h4>
                    <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">
                        {explanation.sections.watch}
                    </p>
                </div>
            </div>

            {/* Backtest Section (Free/Pro) */}
            <div className="pt-4 border-t border-outline-variant">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold text-on-surface flex items-center gap-2">
                        {t.backtestTitle}
                        <button
                            onClick={() => setShowBacktestGuide(!showBacktestGuide)}
                            className="text-xs font-normal text-on-surface-variant bg-muted hover:bg-surface-container-low px-2 py-0.5 rounded transition-colors flex items-center gap-1"
                        >
                            <span className="text-indigo-600">?</span> {t.bt_guideBtn}
                        </button>
                    </h4>
                </div>

                {/* Collapsible Guide */}
                {showBacktestGuide && (
                    <div className="mb-4 bg-surface-container-lowest/80 p-4 rounded-lg border border-outline-variant text-sm space-y-3 animate-in fade-in slide-in-from-top-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <span className="font-bold text-on-surface block mb-1">🎯 {t.bt_winRate} (Win Rate)</span>
                                <p className="text-on-surface-variant text-xs leading-relaxed">
                                    {lang === 'ko'
                                        ? '전체 매매 신호 중 수익으로 마감된 거래의 비율입니다. 50% 이상이면 긍정적입니다.'
                                        : 'Percentage of trades that ended in profit. >50% is generally positive.'}
                                </p>
                            </div>
                            <div>
                                <span className="font-bold text-on-surface block mb-1">💰 {t.bt_totalReturn} (Total Return)</span>
                                <p className="text-on-surface-variant text-xs leading-relaxed">
                                    {lang === 'ko'
                                        ? '시뮬레이션 기간 동안의 단순 누적 수익률입니다. (복리 미적용)'
                                        : 'Cumulative return over the simulation period (non-compounded).'}
                                </p>
                            </div>
                            <div>
                                <span className="font-bold text-on-surface block mb-1">📉 {t.bt_maxDD} (MDD)</span>
                                <p className="text-on-surface-variant text-xs leading-relaxed">
                                    {lang === 'ko'
                                        ? '자산 고점 대비 최대 하락폭입니다. 수치가 낮을수록(0에 가까울수록) 안정적인 전략입니다.'
                                        : 'Maximum loss from a peak to a trough. Lower (closer to 0) implies better stability.'}
                                </p>
                            </div>
                            <div>
                                <span className="font-bold text-on-surface block mb-1">⚖️ {t.bt_profitFactor} (Profit Factor)</span>
                                <p className="text-on-surface-variant text-xs leading-relaxed">
                                    {lang === 'ko'
                                        ? '총 이익 / 총 손실 비율입니다. 1.5 이상이면 훌륭한 전략, 1 미만이면 손실 전략입니다.'
                                        : 'Ratio of gross profit to gross loss. >1.5 is excellent, <1 implies a losing strategy.'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-muted p-3 rounded-lg">
                        <div className="text-xs text-on-surface-variant">{t.bt_winRate}</div>
                        <div className="text-lg font-bold text-foreground">
                            {result.backtest.status === 'insufficient' ? t.na : `${result.backtest.winRate.toFixed(1)}%`}
                        </div>
                    </div>
                    <div className="bg-muted p-3 rounded-lg">
                        <div className="text-xs text-on-surface-variant">{t.bt_totalReturn}</div>
                        <div className="text-lg font-bold text-foreground">
                            {result.backtest.status === 'insufficient' ? t.na : `${result.backtest.totalReturn.toFixed(1)}%`}
                        </div>
                    </div>
                    {/* Pro Locked Slots */}
                    {/* Max Drawdown - Unlocked */}
                    <div className="bg-surface-container p-3 rounded-lg relative overflow-hidden group">
                        <div className="text-xs text-on-surface-variant">{t.bt_maxDD}</div>
                        <div className="text-lg font-bold text-red-600">-{result.backtest.maxDrawdownPercent.toFixed(1)}%</div>
                    </div>

                    {/* Profit Factor - Unlocked */}
                    <div className="bg-surface-container p-3 rounded-lg relative overflow-hidden group">
                        <div className="text-xs text-on-surface-variant">{t.bt_profitFactor}</div>
                        <div className="text-lg font-bold text-blue-600">
                            {result.backtest.profitFactor >= 999 ? 'Inf' : result.backtest.profitFactor.toFixed(2)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
