'use client';

// CRYPTO ANALYSIS ONLY - DO NOT ADD STOCK IMPORTS
import React, { useMemo, useEffect, useState } from 'react';
// import { CandleData, getKlines } from '@/lib/api/binance'; // REMOVED for SSOT
// import { analyzeMarket } from '@/lib/analysis'; // Legacy
import { performAnalysis } from '@/lib/analysis/orchestrator';
import { generateSignals } from '@/lib/analysis/signals';
// import { TradingStrategyGuide } from './TradingStrategyGuide'; // Hiding legacy strategy guide 
// import { PremiumLock } from '@/components/PremiumLock'; // Removed as Backtest is now free for all

// Type definition for local use (or import if shared type exists)
export type CandleData = {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
};

interface Props {
    symbol: string;
    lang: 'en' | 'ko';
}

// SSOT Limitation: Only Daily data exists in Supabase.
// restricting to '1d' to ensure analysis validity.
import { aggregateCandles } from '@/lib/analysis/aggregation';
import { generateHistoricalTrades } from '@/lib/backtest/engine';

// SSOT: Daily data aggregated for higher timeframes
const ANALYSIS_INTERVALS = ['1d', '1w'];

export const AnalysisPanel: React.FC<Props> = ({ symbol, lang }) => {
    const [candles, setCandles] = useState<CandleData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [interval, setInterval] = useState('1d');
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [showBacktestGuide, setShowBacktestGuide] = useState(false); // Valid state for toggle

    // Free vs PRO Gate - UNLOCKED FOR ALL
    const isPro = true; // Always true now
    const userTier = 'pro';

    // Fetch Binance Data via API Route (same as /market page)
    useEffect(() => {
        const fetchAnalysisData = async () => {
            setIsLoading(true);
            setError(null);
            setCandles([]);

            try {
                // Use API Route to fetch from Binance (Proxied to Supabase)
                // SSOT: Always fetch '1d' data. If user selected '1w'/'1M', we aggregate client-side.
                // We ask for '1d' explicitly to API.
                const res = await fetch(`/api/klines?symbol=${symbol.toUpperCase()}&interval=1d&limit=990`);
                if (!res.ok) throw new Error('Failed to fetch klines');
                const data = await res.json();

                if (!data || data.length === 0) {
                    setIsLoading(false);
                    return;
                }

                // Map to CandleData (API returns time in seconds)
                const formatted: CandleData[] = data.map((d: any) => ({
                    time: d.time, // Already in seconds from API
                    open: Number(d.open),
                    high: Number(d.high),
                    low: Number(d.low),
                    close: Number(d.close),
                    volume: Number(d.volume)
                }));

                // Sort ASC by time for aggregation
                formatted.sort((a, b) => a.time - b.time);

                // Aggregate if needed
                const finalData = aggregateCandles(formatted, interval);

                setCandles(finalData);
                setIsLoading(false);
            } catch (err) {
                console.error('Klines Fetch Error:', err);
                setError('Failed to fetch market data.');
                setIsLoading(false);
            }
        };
        fetchAnalysisData();
    }, [symbol, interval]);

    const result = useMemo(() => {
        if (!candles || candles.length === 0) return null;

        // 1. Generate Signals
        const { signals, adxValue, bbWidth, rawIndicators } = generateSignals(candles);

        // 2. Generate Historical Trades (Simulated)
        const trades = generateHistoricalTrades(candles);

        // 3. Perform Analysis (Orchestrator)
        // Calculate data age from last candle
        const lastCandle = candles[candles.length - 1];
        let dataAgeSeconds = lastCandle ? Math.floor(Date.now() / 1000) - lastCandle.time : 0;

        // For Daily/Weekly frames, ignore "seconds" staleness check (standard is >60s penalty)
        if (interval === '1d' || interval === '1w' || interval === '1M') {
            dataAgeSeconds = 0;
        }

        return performAnalysis({
            symbol,
            timeframe: interval,
            signals,
            adxValue,
            bbWidth,
            userTier,
            trades: trades,
            sampleSize: candles.length,
            dataAgeSeconds,
            dataSource: 'supabase'
        });
    }, [candles, symbol, interval, userTier]);

    // UI Translation
    const t = {
        title: lang === 'ko' ? '⚡ 통계적 패턴 정밀 분석' : '⚡ Statistical Pattern Analysis',
        basis: lang === 'ko' ? '분석 기준:' : 'Analysis Basis:',
        loading: lang === 'ko' ? '데이터 분석 중...' : 'Analyzing Data...',
        insufficient: lang === 'ko' ? '데이터 부족 (최근 50개 캔들 필요)' : 'Insufficient Data (>50 candles required)',
        proLock: lang === 'ko' ? 'PRO 버전에서 상세 분석 제공' : 'Detailed Analysis in PRO Version',
        evidence: lang === 'ko' ? '분석 근거' : 'Evidence',
        risk: lang === 'ko' ? '리스크 요인' : 'Risk Factors',
        watch: lang === 'ko' ? '주요 관전 포인트' : 'Key Watch Levels',
        grade: lang === 'ko' ? '신뢰도 등급' : 'Confidence Grade',
        prob: lang === 'ko' ? '상승 확률' : 'Rise Probability',
        na: 'N/A',
        guideTitle: lang === 'ko' ? '📊 지표 설명서' : '📊 Indicator Guide',
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
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 shadow-xl animate-pulse">
                <div className="h-8 bg-gray-800 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                    <div className="h-20 bg-gray-800 rounded w-full"></div>
                    <div className="h-20 bg-gray-800 rounded w-full"></div>
                </div>
            </div>
        );
    }

    // 2. Insufficient Data State
    if (!result || result.uiState === 'insufficient') {
        return (
            <div className="bg-gray-900 rounded-xl p-10 border border-gray-800 text-center">
                <div className="text-gray-500 text-lg font-bold mb-2">⚠️ {t.insufficient}</div>
                <p className="text-sm text-gray-600">Chart data is not available for this timeframe.</p>
            </div>
        );
    }

    // 3. OK / Pro-Locked State
    const { probability, explanation, uiState } = result;
    const isLocked = uiState === 'pro-locked'; // Orchestrator might return this if strict
    // But we handle masking here based on userTier too.

    const gradeColor = (g: string) => {
        if (g === 'A') return 'text-primary';
        if (g === 'B') return 'text-chart-2';
        if (g === 'C') return 'text-chart-3';
        return 'text-muted-foreground';
    }

    return (
        <div className="bg-card rounded-xl p-4 md:p-6 border border-border shadow-xl space-y-6">

            {/* Header / Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="text-xl md:text-2xl font-bold flex items-center gap-2 mb-2">
                        {t.title}
                    </h3>
                    <div className="flex bg-gray-800 rounded p-1 gap-1 self-start">
                        {ANALYSIS_INTERVALS.map(int => (
                            <button key={int} onClick={() => setInterval(int)}
                                className={`px-3 py-1 rounded text-xs font-bold transition-all ${interval === int ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>
                                {int.toUpperCase()}
                            </button>
                        ))}
                    </div>

                    {/* Data Source Disclaimer */}
                    <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1.5">
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
                        <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">{t.grade}</div>
                        <div className={`text-3xl font-black ${gradeColor(result.confidence.grade)}`}>
                            {result.confidence.grade}
                        </div>
                    </div>
                    <div className="h-10 w-px bg-border"></div>
                    <div className="text-center">
                        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{t.prob}</div>
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
                    <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {explanation.sections.evidence}
                    </p>
                </div>

                {/* Risk */}
                <div className="bg-background p-4 rounded-lg border border-border">
                    <h4 className="text-chart-3 font-bold text-sm mb-2 flex items-center gap-2">
                        ⚠️ {t.risk}
                    </h4>
                    <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {explanation.sections.risk}
                    </p>
                </div>

                {/* Watch */}
                <div className="bg-background p-4 rounded-lg border border-border">
                    <h4 className="text-chart-4 font-bold text-sm mb-2 flex items-center gap-2">
                        👀 {t.watch}
                    </h4>
                    <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {explanation.sections.watch}
                    </p>
                </div>
            </div>

            {/* Backtest Section (Free/Pro) */}
            <div className="pt-4 border-t border-gray-800">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold text-gray-200 flex items-center gap-2">
                        {t.backtestTitle}
                        <button
                            onClick={() => setShowBacktestGuide(!showBacktestGuide)}
                            className="text-xs font-normal text-muted-foreground bg-muted hover:bg-gray-700 px-2 py-0.5 rounded transition-colors flex items-center gap-1"
                        >
                            <span className="text-indigo-400">?</span> {t.bt_guideBtn}
                        </button>
                    </h4>
                </div>

                {/* Collapsible Guide */}
                {showBacktestGuide && (
                    <div className="mb-4 bg-gray-900/50 p-4 rounded-lg border border-gray-700 text-sm space-y-3 animate-in fade-in slide-in-from-top-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <span className="font-bold text-gray-200 block mb-1">🎯 {t.bt_winRate} (Win Rate)</span>
                                <p className="text-gray-400 text-xs leading-relaxed">
                                    {lang === 'ko'
                                        ? '전체 매매 신호 중 수익으로 마감된 거래의 비율입니다. 50% 이상이면 긍정적입니다.'
                                        : 'Percentage of trades that ended in profit. >50% is generally positive.'}
                                </p>
                            </div>
                            <div>
                                <span className="font-bold text-gray-200 block mb-1">💰 {t.bt_totalReturn} (Total Return)</span>
                                <p className="text-gray-400 text-xs leading-relaxed">
                                    {lang === 'ko'
                                        ? '시뮬레이션 기간 동안의 단순 누적 수익률입니다. (복리 미적용)'
                                        : 'Cumulative return over the simulation period (non-compounded).'}
                                </p>
                            </div>
                            <div>
                                <span className="font-bold text-gray-200 block mb-1">📉 {t.bt_maxDD} (MDD)</span>
                                <p className="text-gray-400 text-xs leading-relaxed">
                                    {lang === 'ko'
                                        ? '자산 고점 대비 최대 하락폭입니다. 수치가 낮을수록(0에 가까울수록) 안정적인 전략입니다.'
                                        : 'Maximum loss from a peak to a trough. Lower (closer to 0) implies better stability.'}
                                </p>
                            </div>
                            <div>
                                <span className="font-bold text-gray-200 block mb-1">⚖️ {t.bt_profitFactor} (Profit Factor)</span>
                                <p className="text-gray-400 text-xs leading-relaxed">
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
                        <div className="text-xs text-muted-foreground">{t.bt_winRate}</div>
                        <div className="text-lg font-bold text-foreground">
                            {result.backtest.status === 'insufficient' ? t.na : `${result.backtest.winRate.toFixed(1)}%`}
                        </div>
                    </div>
                    <div className="bg-muted p-3 rounded-lg">
                        <div className="text-xs text-muted-foreground">{t.bt_totalReturn}</div>
                        <div className="text-lg font-bold text-foreground">
                            {result.backtest.status === 'insufficient' ? t.na : `${result.backtest.totalReturn.toFixed(1)}%`}
                        </div>
                    </div>
                    {/* Pro Locked Slots */}
                    {/* Max Drawdown - Unlocked */}
                    <div className="bg-gray-800 p-3 rounded-lg relative overflow-hidden group">
                        <div className="text-xs text-gray-500">{t.bt_maxDD}</div>
                        <div className="text-lg font-bold text-red-400">-{result.backtest.maxDrawdownPercent.toFixed(1)}%</div>
                    </div>

                    {/* Profit Factor - Unlocked */}
                    <div className="bg-gray-800 p-3 rounded-lg relative overflow-hidden group">
                        <div className="text-xs text-gray-500">{t.bt_profitFactor}</div>
                        <div className="text-lg font-bold text-blue-400">
                            {result.backtest.profitFactor >= 999 ? 'Inf' : result.backtest.profitFactor.toFixed(2)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Premium Modal Overlay - Removed */}
        </div>
    );
};
