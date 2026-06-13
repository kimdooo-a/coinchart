'use client';

// CRYPTO ANALYSIS ONLY - DO NOT ADD STOCK IMPORTS
import { useMemo } from 'react';
import { performAnalysis } from '@/lib/analysis/orchestrator';
import { generateSignals } from '@/lib/analysis/signals';
import { generateHistoricalTrades } from '@/lib/backtest/engine';
import type { CandleData } from './useAnalysisCandles';

type AnalysisResult = ReturnType<typeof performAnalysis>;

/**
 * 캔들 데이터로부터 시그널·과거 거래·종합 분석 결과를 산출하는 훅.
 *
 * @param candles  집계된 캔들 배열
 * @param symbol   심볼
 * @param interval 타임프레임
 * @param userTier 사용자 등급
 * @returns 분석 결과 (캔들 없으면 null)
 */
export function useAnalysisResult(
    candles: CandleData[],
    symbol: string,
    interval: string,
    userTier: 'free' | 'pro'
): AnalysisResult | null {
    return useMemo(() => {
        if (!candles || candles.length === 0) return null;

        // 1. 시그널 생성
        const { signals, adxValue, plusDI, minusDI, atrValue, avgAtrValue, bbWidth, volumeRatio } = generateSignals(candles);

        // 2. 과거 거래 시뮬레이션 생성
        const trades = generateHistoricalTrades(candles);

        // 3. 종합 분석 (Orchestrator)
        // 마지막 캔들 기준 데이터 경과 시간 계산
        // (의도적으로 memo 계산 시점의 현재 시각을 읽어 신선도를 판정 — 원본 동작 보존)
        const lastCandle = candles[candles.length - 1];
        // eslint-disable-next-line react-hooks/purity
        let dataAgeSeconds = lastCandle ? Math.floor(Date.now() / 1000) - lastCandle.time : 0;

        // 일봉/주봉 프레임은 "초 단위" 신선도 검사를 무시한다 (표준은 >60초 패널티)
        if (interval === '1d' || interval === '1w' || interval === '1M') {
            dataAgeSeconds = 0;
        }

        return performAnalysis({
            symbol,
            timeframe: interval,
            signals,
            adxValue,
            plusDI,
            minusDI,
            atrValue,
            avgAtrValue,
            bbWidth,
            volumeRatio,
            userTier,
            trades: trades,
            sampleSize: candles.length,
            dataAgeSeconds,
            dataSource: 'supabase'
        });
    }, [candles, symbol, interval, userTier]);
}
