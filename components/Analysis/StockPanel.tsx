'use client';

import React, { useMemo, useEffect, useState } from 'react';
// STOCK ANALYSIS ONLY - NO CRYPTO IMPORTS
import { fetchStockPrices } from '@/lib/supabase/stock';
import { generateStockSignals } from '@/lib/analysis/stock-signals';
import { analyzeStock } from '@/lib/analysis/stock';
import { PremiumLock } from '@/components/PremiumLock';

interface Props {
    symbol: string;
    lang: 'en' | 'ko';
}

export const StockPanel: React.FC<Props> = ({ symbol, lang }) => {
    const [candles, setCandles] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [period, setPeriod] = useState('1d');
    const [error, setError] = useState<string | null>(null);

    // Free vs PRO Gate
    const isPro = false;
    const userTier = isPro ? 'pro' : 'free';

    // STOCK SSOT: Fetch from Supabase stock_prices ONLY
    useEffect(() => {
        const fetchStockData = async () => {
            setIsLoading(true);
            setError(null);
            setCandles([]);

            try {
                const data = await fetchStockPrices(symbol, 365);

                if (!data || data.length === 0) {
                    setError(lang === 'ko' ? '데이터를 찾을 수 없습니다' : 'No data available');
                    setIsLoading(false);
                    return;
                }

                setCandles(data);
            } catch (err) {
                console.error('[Stock Panel] Error:', err);
                setError(lang === 'ko' ? '데이터 로드 실패' : 'Failed to load data');
            } finally {
                setIsLoading(false);
            }
        };

        fetchStockData();
    }, [symbol, lang]);

    const result = useMemo(() => {
        if (!candles || candles.length === 0) return null;

        // STOCK SIGNALS ONLY - NO CRYPTO SIGNALS
        const { signals, adxValue, bbWidth } = generateStockSignals(candles);

        // STOCK ANALYSIS ONLY
        return analyzeStock({
            symbol,
            period,
            signals,
            adxValue,
            bbWidth,
            userTier,
            dataSource: 'supabase',
            sampleSize: candles.length
        });
    }, [candles, symbol, period, userTier]);

    // UI Translation
    const t = {
        title: lang === 'ko' ? '📊 통계적 주식 분석' : '📊 Statistical Stock Analysis',
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
        error: lang === 'ko' ? '데이터 로드 오류' : 'Data Load Error'
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

    // 2. Error State
    if (error) {
        return (
            <div className="bg-gray-900 rounded-xl p-10 border border-red-800 text-center">
                <div className="text-red-500 text-lg font-bold mb-2">⚠️ {t.error}</div>
                <p className="text-sm text-gray-600">{error}</p>
            </div>
        );
    }

    // 3. Insufficient Data
    if (!result || result.uiState === 'insufficient') {
        return (
            <div className="bg-gray-900 rounded-xl p-10 border border-gray-800 text-center">
                <div className="text-gray-500 text-lg font-bold mb-2">⚠️ {t.insufficient}</div>
                <p className="text-sm text-gray-600">Stock data is not available for this symbol.</p>
            </div>
        );
    }

    // 4. OK / Pro-Locked State
    const { probability, explanation, uiState } = result;
    const isLocked = uiState === 'pro-locked';

    return (
        <div className="bg-gray-900 rounded-xl p-6 md:p-8 border border-gray-800 shadow-lg space-y-6">
            {/* Title */}
            <h2 className="text-xl md:text-2xl font-bold text-green-400">{t.title}</h2>

            {/* Analysis Basis */}
            <div className="bg-gray-800 rounded-lg p-4 text-sm text-gray-300 border-l-4 border-green-500">
                <span className="font-semibold">{t.basis}</span> {candles.length} days of {period} data
            </div>

            {/* Main Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Rise Probability */}
                <div className="bg-gray-800 rounded-lg p-4 text-center">
                    <p className="text-gray-400 text-sm mb-2">{t.prob}</p>
                    <p className="text-2xl font-bold text-green-400">
                        {probability?.probability || t.na}%
                    </p>
                </div>

                {/* Grade */}
                <div className="bg-gray-800 rounded-lg p-4 text-center">
                    <p className="text-gray-400 text-sm mb-2">{t.grade}</p>
                    <p className={`text-2xl font-bold ${['A', 'B'].includes(result.confidence?.grade) ? 'text-green-400' :
                            ['C'].includes(result.confidence?.grade) ? 'text-yellow-400' :
                                'text-red-400'
                        }`}>
                        {result.confidence?.grade || t.na}
                    </p>
                </div>

                {/* Regime */}
                <div className="bg-gray-800 rounded-lg p-4 text-center">
                    <p className="text-gray-400 text-sm mb-2">Regime</p>
                    <p className="text-sm font-semibold text-blue-400">
                        {probability?.regime || t.na}
                    </p>
                </div>

                {/* Data Points */}
                <div className="bg-gray-800 rounded-lg p-4 text-center">
                    <p className="text-gray-400 text-sm mb-2">Data Points</p>
                    <p className="text-2xl font-bold text-blue-400">{candles.length}</p>
                </div>
            </div>

            {/* Explanation Sections */}
            <div className="relative">
                {isLocked && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center backdrop-blur-sm bg-gray-900/50 rounded-lg border border-gray-800">
                        <PremiumLock feature={t.proLock} lang={lang} className="scale-90" />
                    </div>
                )}

                <div className={`space-y-4 ${isLocked ? 'blur-sm opacity-50 pointer-events-none select-none grayscale' : ''}`}>
                    {/* Evidence */}
                    <div className="bg-gray-800 rounded-lg p-4">
                        <h3 className="font-bold text-green-400 mb-2">📋 {t.evidence}</h3>
                        <p className="text-gray-300 text-sm leading-relaxed">
                            {explanation?.sections?.evidence || t.na}
                        </p>
                    </div>

                    {/* Risk */}
                    <div className="bg-gray-800 rounded-lg p-4">
                        <h3 className="font-bold text-red-400 mb-2">⚠️ {t.risk}</h3>
                        <p className="text-gray-300 text-sm leading-relaxed">
                            {explanation?.sections?.risk || t.na}
                        </p>
                    </div>

                    {/* Watch Points */}
                    <div className="bg-gray-800 rounded-lg p-4">
                        <h3 className="font-bold text-blue-400 mb-2">👀 {t.watch}</h3>
                        <p className="text-gray-300 text-sm leading-relaxed">
                            {explanation?.sections?.watch || t.na}
                        </p>
                    </div>
                </div>
            </div>

            {/* Disclaimer */}
            <div className="text-xs text-gray-500 border-t border-gray-700 pt-4">
                * {lang === 'ko'
                    ? '본 분석은 과거 데이터 기반의 참고용이며, 투자 권유가 아닙니다. 미래 성과를 보장하지 않습니다.'
                    : 'This analysis is for reference only based on historical data and does not guarantee future performance.'}
            </div>
        </div>
    );
}