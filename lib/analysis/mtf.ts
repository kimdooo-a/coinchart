// lib/analysis/mtf.ts
// 멀티 타임프레임 분석 (Multi-Timeframe Analysis)

import { CandleData } from '@/lib/api/binance';
import { aggregateCandles } from './aggregation';
import { calculateEMA, calculateRSI, calculateMACD } from '@/lib/indicators';

export interface MTFResult {
    higherTfTrend: 'UP' | 'DOWN' | 'NEUTRAL';
    alignment: boolean; // 일봉 방향과 주봉 방향 일치 여부
    confidence: number; // 0-100 (MTF 합의 신뢰도)
    weeklySignals: {
        emaTrend: 'UP' | 'DOWN' | 'NEUTRAL';
        rsiZone: 'OVERBOUGHT' | 'OVERSOLD' | 'NEUTRAL';
        macdMomentum: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    };
}

/**
 * 멀티 타임프레임 분석
 * @param dailyCandles 일봉 캔들 데이터
 * @param dailyTrend 일봉 기준 현재 추세 방향
 */
export function analyzeMultiTimeframe(
    dailyCandles: CandleData[],
    dailyTrend: 'UP' | 'DOWN' | 'NEUTRAL' = 'NEUTRAL'
): MTFResult {
    // 기본 결과
    const defaultResult: MTFResult = {
        higherTfTrend: 'NEUTRAL',
        alignment: true,
        confidence: 50,
        weeklySignals: {
            emaTrend: 'NEUTRAL',
            rsiZone: 'NEUTRAL',
            macdMomentum: 'NEUTRAL',
        }
    };

    // 최소 데이터 체크 (주봉 생성에 최소 35일 = 5주 필요)
    if (!dailyCandles || dailyCandles.length < 60) {
        return defaultResult;
    }

    // 1. 주봉 생성
    const weeklyCandles = aggregateCandles(dailyCandles, '1w');
    if (weeklyCandles.length < 14) {
        return defaultResult; // 주봉 최소 14개 필요
    }

    const closes = weeklyCandles.map(c => c.close);
    const idx = closes.length - 1;

    // 2. EMA 교차 분석 (9/21 EMA)
    const ema9 = calculateEMA(closes, 9);
    const ema21 = calculateEMA(closes, 21);
    let emaTrend: 'UP' | 'DOWN' | 'NEUTRAL' = 'NEUTRAL';
    if (Number.isFinite(ema9[idx]) && Number.isFinite(ema21[idx])) {
        if (ema9[idx] > ema21[idx]) emaTrend = 'UP';
        else if (ema9[idx] < ema21[idx]) emaTrend = 'DOWN';
    }

    // 3. RSI 분석
    const rsi = calculateRSI(closes, 14);
    const curRSI = rsi[idx];
    let rsiZone: 'OVERBOUGHT' | 'OVERSOLD' | 'NEUTRAL' = 'NEUTRAL';
    if (Number.isFinite(curRSI)) {
        if (curRSI > 70) rsiZone = 'OVERBOUGHT';
        else if (curRSI < 30) rsiZone = 'OVERSOLD';
    }

    // 4. MACD 모멘텀
    const { histogram } = calculateMACD(closes);
    const curHist = histogram[idx];
    const prevHist = histogram[idx - 1];
    let macdMomentum: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
    if (Number.isFinite(curHist)) {
        if (curHist > 0) macdMomentum = 'BULLISH';
        else if (curHist < 0) macdMomentum = 'BEARISH';
    }

    // 5. 종합 추세 결정 (다수결)
    let upVotes = 0;
    let downVotes = 0;

    if (emaTrend === 'UP') upVotes++;
    else if (emaTrend === 'DOWN') downVotes++;

    if (rsiZone === 'OVERSOLD') upVotes++; // 과매도 = 반등 기대
    else if (rsiZone === 'OVERBOUGHT') downVotes++;

    if (macdMomentum === 'BULLISH') upVotes++;
    else if (macdMomentum === 'BEARISH') downVotes++;

    let higherTfTrend: 'UP' | 'DOWN' | 'NEUTRAL' = 'NEUTRAL';
    if (upVotes > downVotes) higherTfTrend = 'UP';
    else if (downVotes > upVotes) higherTfTrend = 'DOWN';

    // 6. 일봉-주봉 정합성 판단
    const alignment = dailyTrend === 'NEUTRAL' || dailyTrend === higherTfTrend;

    // 7. MTF 합의 신뢰도
    const maxVotes = Math.max(upVotes, downVotes);
    const confidence = maxVotes === 3 ? 90 : maxVotes === 2 ? 70 : 50;

    return {
        higherTfTrend,
        alignment,
        confidence,
        weeklySignals: {
            emaTrend,
            rsiZone,
            macdMomentum,
        }
    };
}

/**
 * MTF 가중치 조정 계수 반환
 * 상위 TF와 일치: +30% / 불일치: -30%
 */
export function getMTFWeightMultiplier(mtf: MTFResult): number {
    if (mtf.alignment) {
        return 1.0 + (mtf.confidence / 100) * 0.3; // 최대 1.3
    } else {
        return 1.0 - (mtf.confidence / 100) * 0.3; // 최소 0.7
    }
}
