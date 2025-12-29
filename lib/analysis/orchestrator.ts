import { calculateProbability } from '@/lib/probability/engine';
import { calculateConfidence } from '@/lib/probability/confidence';
import { calculateMetrics } from '@/lib/backtest/metrics';
import { generateExplanation } from '@/lib/explanation/generator';
import { IndicatorSignal } from '@/types/probability';
import { Trade } from '@/types/backtest';
import { detectRegime } from '@/lib/probability/regime';

export interface AnalysisInput {
    symbol: string;
    timeframe: string;
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
    dataSource?: 'supabase' | 'binance' | 'unknown'; // SSOT: Must be 'supabase'
}

export interface AnalysisResult {
    probability: any; // Using explicit types would be better but keeping it flexible for now
    confidence: any;
    backtest: any;
    explanation: any;
    uiState: 'loading' | 'insufficient' | 'ok' | 'pro-locked';
    flags: string[];
    reasons: string[];
}

export function performAnalysis(input: AnalysisInput): AnalysisResult {
    const flags: string[] = [];
    const reasons: string[] = [];

    // SSOT Guard: Only Supabase data allowed for analysis
    if (input.dataSource && input.dataSource !== 'supabase') {
        return {
            probability: { probability: 50, direction: 'NEUTRAL', regime: 'UNKNOWN' },
            confidence: { grade: 'F', score: 0, sampleSize: 0, factors: [] },
            backtest: { status: 'insufficient', totalTrades: 0, winRate: 0, profitFactor: 0, sharpeRatio: 0, maxDrawdown: 0, maxDrawdownPercent: 0, avgTrade: 0, bestTrade: 0, worstTrade: 0, avgWin: 0, avgLoss: 0, expectancy: 0, totalReturn: 0, sortinoRatio: 0, calmarRatio: 0, riskRewardRatio: 0, maxConsecutiveWins: 0, maxConsecutiveLosses: 0, recoveryFactor: 0, drawdownDuration: 0 },
            explanation: { title: 'SSOT Violation', sections: { evidence: '분석은 Supabase 데이터만 사용 가능합니다.', risk: 'Binance 직접 호출은 허용되지 않습니다.', watch: '데이터 소스를 확인하세요.' }, flags: [] },
            uiState: 'insufficient',
            flags: ['SSOT_VIOLATION: Analysis must use Supabase data only'],
            reasons: [`Invalid data source: ${input.dataSource}. Only 'supabase' allowed.`]
        };
    }

    // 1. Regime Detection
    const regimeResult = detectRegime({
        adx: input.adxValue,
        atr: input.atrValue,
        bbWidth: input.bbWidth
    });

    // 2. Probability Engine (now includes confidence calculation with actual values)
    const probability = calculateProbability({
        signals: input.signals,
        regime: regimeResult.regime,
        adxValue: input.adxValue,
        volumeRatio: input.volumeRatio,
        historicalAccuracy: input.historicalAccuracy,
        sampleSize: input.sampleSize,
        dataAgeSeconds: input.dataAgeSeconds
    });

    // 3. Confidence is now included in probability.confidence (no separate call needed)

    // 4. Backtest Metrics
    let backtest = calculateMetrics(input.trades || []);

    // Backtest 999 Protection for UI
    // We don't mutate calculations, but we might want a UI-friendly version.
    // However, generator handles 999 for text.
    // The UI card should handle 999 for display ("N/A").

    // 5. Generate Explanation
    const explanation = generateExplanation({
        probability,
        confidence: probability.confidence, // Use the one from engine or separate? Engine uses a simplified call inside if we didn't patch it fully.
        // Wait, in previous step we patched engine.ts to call calculateConfidence.
        // So probability.confidence is the source of truth.
        backtest,
        userTier: input.userTier
    });

    // 6. UI State Determination
    let uiState: 'loading' | 'insufficient' | 'ok' | 'pro-locked' = 'ok';

    // Insufficient Data Check
    if (!input.signals || input.signals.length === 0) {
        uiState = 'insufficient';
        reasons.push('No signals provided');
    }

    // Backtest Insufficient?
    if (backtest.status === 'insufficient') {
        reasons.push('Backtest data insufficient (<30 trades)');
        // This doesn't necessarily block the whole analysis, just the backtest card.
        // But if core signals are missing, globally insufficient.
    }

    // Pro Locked? (Only if strictly required to Block everything, but usually we show Free version)
    // Requirement says: "Free -> pro-locked (actions restricted?)"
    // Actually, explanation generator handles free/pro text.
    // "pro-locked" UI state might be for specific cards.
    // Orchestrator returns a global state? Or per module?
    // The interface has one uiState. Let's strictly follow "Goal: UI Wiring... loading/insufficient/pro-locked/ok".
    // If user is free, can they see analysis? Yes, standard version.
    // So 'pro-locked' might typically apply if they try to access a specific PRO-only feature.
    // Here, if analysis is generated, state is OK.
    // But if the user is Free, and we want to show "Pro-Locked" on the Backtest Card specifically,
    // we might need separate states.
    // But strictly for the "Analysis" as a whole:

    if (input.userTier === 'free') {
        // We deliver 'ok' state generally, but UI components checks userTier to mask slots.
    }

    return {
        probability,
        confidence: probability.confidence,
        backtest,
        explanation,
        uiState,
        flags: explanation.flags,
        reasons
    };
}
