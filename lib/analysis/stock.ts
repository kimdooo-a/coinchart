// lib/analysis/stock.ts
// STOCK ANALYSIS ONLY - Orchestrator for Stock signals & probability
// Source: MUST be from @/lib/supabase/stock (stock_prices)

import { calculateProbability } from '@/lib/probability/engine';
import { calculateMetrics } from '@/lib/backtest/metrics';
import { generateExplanation } from '@/lib/explanation/generator';
import { IndicatorSignal } from '@/types/probability';
import { Trade } from '@/types/backtest';
import { detectRegime } from '@/lib/probability/regime';

export interface StockAnalysisInput {
    symbol: string;
    period: string;                     // e.g., '1d', '1w' (different from crypto 'timeframe')
    signals: IndicatorSignal[];
    adxValue?: number;
    atrValue?: number;
    bbWidth?: number;
    trades?: Trade[];
    userTier: 'free' | 'pro';
    dataAgeSeconds?: number;
    sampleSize?: number;
    volumeRatio?: number;
    historicalAccuracy?: number;
    dataSource: 'supabase'; // SSOT: Must ALWAYS be 'supabase' for stocks
}

export interface StockAnalysisResult {
    probability: any;
    confidence: any;
    backtest: any;
    explanation: any;
    uiState: 'loading' | 'insufficient' | 'ok' | 'pro-locked' | 'error';
    dataSource: 'supabase';
}

/**
 * Analyze stock market data (SSOT)
 * Input MUST come from @/lib/supabase/stock only (stock_prices table)
 * No direct TwelveData/Alpha Vantage API calls allowed
 */
export function analyzeStock(input: StockAnalysisInput): StockAnalysisResult {
    // Validate data source
    if (input.dataSource !== 'supabase') {
        console.error('[Stock Analysis] Invalid data source:', input.dataSource);
        return {
            probability: null,
            confidence: null,
            backtest: null,
            explanation: null,
            uiState: 'error',
            dataSource: 'supabase'
        };
    }

    try {
        // Detect Market Regime
        const regimeResult = detectRegime({
            adx: input.adxValue,
            atr: input.atrValue,
            bbWidth: input.bbWidth
        });

        // Probability (includes confidence calculation with actual values)
        const probability = calculateProbability({
            signals: input.signals,
            regime: regimeResult.regime,
            adxValue: input.adxValue,
            volumeRatio: input.volumeRatio,
            historicalAccuracy: input.historicalAccuracy,
            sampleSize: input.sampleSize,
            dataAgeSeconds: input.dataAgeSeconds
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
        console.error('[Stock Analysis] Exception:', err);
        return {
            probability: null,
            confidence: null,
            backtest: null,
            explanation: null,
            uiState: 'error',
            dataSource: 'supabase'
        };
    }
}