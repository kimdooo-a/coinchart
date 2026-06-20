// lib/analysis/crypto.ts
// CRYPTO ANALYSIS ONLY - Orchestrator for Crypto signals & probability
// Source: MUST be from @/lib/supabase/crypto (market_prices)

// analyzeMarket 재수출 — 코인룸 등 crypto SSOT 컨텍스트에서 @/lib/analysis/crypto 경유 사용
export { analyzeMarket } from '../analysis';

import { calculateProbability } from '@/lib/probability/engine';
import { calculateMetrics } from '@/lib/backtest/metrics';
import { generateExplanation } from '@/lib/explanation/generator';
import { IndicatorSignal } from '@/types/probability';
import { Trade } from '@/types/backtest';
import { detectRegime } from '@/lib/probability/regime';
import { ProbabilityResult, ConfidenceResult } from '@/types/probability';
import { BacktestMetrics } from '@/types/backtest';
import { ExplanationOutput } from '@/types/explanation';

export interface CryptoAnalysisInput {
    symbol: string;
    timeframe: string;
    signals: IndicatorSignal[];
    adxValue?: number;
    atrValue?: number;
    avgAtrValue?: number;
    bbWidth?: number;
    plusDI?: number;
    minusDI?: number;
    trades?: Trade[];
    userTier: 'free' | 'pro';
    dataAgeSeconds?: number;
    sampleSize?: number;
    volumeRatio?: number;
    historicalAccuracy?: number;
    dataSource: 'supabase'; // SSOT: Must ALWAYS be 'supabase' for crypto
}

export interface CryptoAnalysisResult {
    probability: ProbabilityResult & { regime?: string };
    confidence: ConfidenceResult;
    backtest: BacktestMetrics;
    explanation: ExplanationOutput;
    uiState: 'loading' | 'insufficient' | 'ok' | 'pro-locked' | 'error';
    dataSource: 'supabase';
}

/**
 * Analyze crypto market data (SSOT)
 * Input MUST come from @/lib/supabase/crypto only (market_prices table)
 * No direct Binance API calls allowed
 */
export function analyzeCrypto(input: CryptoAnalysisInput): CryptoAnalysisResult {
    // Validate data source
    if (input.dataSource !== 'supabase') {
        console.error('[Crypto Analysis] Invalid data source:', input.dataSource);
        return {
            probability: {} as ProbabilityResult,
            confidence: {} as ConfidenceResult,
            backtest: {} as BacktestMetrics,
            explanation: {} as ExplanationOutput,
            uiState: 'error',
            dataSource: 'supabase'
        };
    }

    try {
        // Detect Market Regime
        const regimeResult = detectRegime({
            adx: input.adxValue,
            atr: input.atrValue,
            bbWidth: input.bbWidth,
            plusDI: input.plusDI,
            minusDI: input.minusDI
        });

        // Probability (includes confidence calculation with actual values)
        const probability = calculateProbability({
            signals: input.signals,
            regime: regimeResult.regime,
            adxValue: input.adxValue,
            volumeRatio: input.volumeRatio,
            historicalAccuracy: input.historicalAccuracy,
            sampleSize: input.sampleSize,
            dataAgeSeconds: input.dataAgeSeconds,
            atrValue: input.atrValue,
            avgAtrValue: input.avgAtrValue,
            bbWidth: input.bbWidth
        });

        // Backtest Metrics
        const backtest = calculateMetrics(input.trades || []);

        // Explanation
        const explanation = generateExplanation({
            probability,
            confidence: probability.confidence,
            backtest,
            userTier: input.userTier
        });

        return {
            probability: { ...probability, regime: regimeResult.regime },
            confidence: probability.confidence,
            backtest,
            explanation,
            uiState: probability.confidence.grade ? 'ok' : 'insufficient',
            dataSource: 'supabase'
        };
    } catch (err) {
        console.error('[Crypto Analysis] Exception:', err);
        return {
            probability: {} as ProbabilityResult,
            confidence: {} as ConfidenceResult,
            backtest: {} as BacktestMetrics,
            explanation: {} as ExplanationOutput,
            uiState: 'error',
            dataSource: 'supabase'
        };
    }
}