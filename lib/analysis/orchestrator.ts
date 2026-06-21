import { calculateProbability } from '@/lib/probability/engine';
import { calculateConfidence } from '@/lib/probability/confidence';
import { calculateMetrics } from '@/lib/backtest/metrics';
import { analyzeRollingWindow } from '@/lib/backtest/engine';
import { generateExplanation } from '@/lib/explanation/generator';
import { IndicatorSignal } from '@/types/probability';
import { Trade } from '@/types/backtest';
import { detectRegime } from '@/lib/probability/regime';
import { analyzeMultiTimeframe, getMTFWeightMultiplier, MTFResult } from './mtf';
import { analyzeFractalPattern, FractalAnalysisResult } from '@/lib/fractal_engine';
import { CandleData } from '@/lib/api/binance';
import { ProbabilityResult, ConfidenceResult } from '@/types/probability';
import { BacktestMetrics } from '@/types/backtest';
import { ExplanationOutput } from '@/types/explanation';

export interface AnalysisInput {
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
    dataSource?: 'supabase' | 'binance' | 'unknown'; // SSOT: Must be 'supabase'
    candles?: CandleData[]; // MTF 분석용 원본 캔들 (optional)
    fractalResult?: FractalAnalysisResult; // 프랙탈 분석 결과 (외부에서 비동기 호출 후 전달)
}

export interface AnalysisResult {
    probability: ProbabilityResult & { regime?: string };
    confidence: ConfidenceResult;
    backtest: BacktestMetrics & { rollingWindow?: unknown };
    explanation: ExplanationOutput;
    mtf?: MTFResult;
    fractal?: FractalAnalysisResult;
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
            probability: { probability: 50, direction: 'SIDEWAYS', regime: 'RANGING' } as ProbabilityResult,
            confidence: { grade: 'F', score: 0, level: 'LOW', factors: [], breakdown: { agreement: 0, trend: 0, volume: 0, history: 0, volatility: 0 }, dataQuality: { multiplier: 0, issues: [] } } as ConfidenceResult,
            backtest: { status: 'insufficient', totalTrades: 0, winRate: 0, profitFactor: 0, sharpeRatio: 0, maxDrawdown: 0, maxDrawdownPercent: 0, avgTrade: 0, bestTrade: 0, worstTrade: 0, avgWin: 0, avgLoss: 0, expectancy: 0, totalReturn: 0, sortinoRatio: 0, calmarRatio: 0, riskRewardRatio: 0, maxConsecutiveWins: 0, maxConsecutiveLosses: 0, recoveryFactor: 0, drawdownDuration: 0 } as BacktestMetrics,
            explanation: {} as ExplanationOutput,
            uiState: 'insufficient',
            flags: ['SSOT_VIOLATION: Analysis must use Supabase data only'],
            reasons: [`Invalid data source: ${input.dataSource}. Only 'supabase' allowed.`]
        };
    }

    // 1. Regime Detection
    const regimeResult = detectRegime({
        adx: input.adxValue,
        atr: input.atrValue,
        bbWidth: input.bbWidth,
        plusDI: input.plusDI,
        minusDI: input.minusDI
    });

    // 1.5. MTF 분석 (캔들 데이터가 제공된 경우)
    let mtfResult: MTFResult | undefined;
    if (input.candles && input.candles.length >= 60) {
        const dailyTrend = regimeResult.regime.includes('UPTREND') ? 'UP' as const
            : regimeResult.regime.includes('DOWNTREND') ? 'DOWN' as const
            : 'NEUTRAL' as const;
        mtfResult = analyzeMultiTimeframe(input.candles, dailyTrend);
    }

    // 2. Probability Engine (MTF 멀티플라이어 포함)
    const mtfMultiplier = mtfResult ? getMTFWeightMultiplier(mtfResult) : undefined;
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
        bbWidth: input.bbWidth,
        mtfMultiplier
    });

    // 3. 프랙탈 엔진 결과 통합 (confidence > 70%일 때 보조 가중치 0.15로 합산)
    let fractalAdjusted = false;
    if (input.fractalResult && input.fractalResult.confidence > 70) {
        const fractalWeight = 0.15;
        const fractalScore = input.fractalResult.recommendedPosition === 'BUY' ? 100
            : input.fractalResult.recommendedPosition === 'SELL' ? -100 : 0;

        if (fractalScore !== 0) {
            // 확률 보조 조정: 현재 확률에 프랙탈 기여분 합산
            const fractalContribution = fractalScore * fractalWeight * (input.fractalResult.confidence / 100);
            probability.probability = Math.max(15, Math.min(85,
                probability.probability + fractalContribution * 0.1
            ));
            fractalAdjusted = true;
            flags.push(`Fractal: ${input.fractalResult.recommendedPosition} (${input.fractalResult.confidence.toFixed(0)}%)`);
        }
    }

    // 4. Backtest Metrics
    const backtest = calculateMetrics(input.trades || []);

    // 4.5. 롤링 윈도우 분석 (전략 유효성 변화 감지)
    if (input.trades && input.trades.length >= 10) {
        const rollingResult = analyzeRollingWindow(input.trades);
        if (rollingResult.strategyDrift) {
            flags.push(`전략 유효성 변화: 최근90일 ${rollingResult.recent90DayWinRate}% vs 전체 ${rollingResult.allTimeWinRate}% (${rollingResult.driftMagnitude}pp 차이)`);
        }
        // 백테스트 승률을 historicalAccuracy로 피드백 (이미 확률 엔진에 전달됨)
        // 다음 분석 시 실측값이 반영되도록 backtest 결과에 포함
        (backtest as BacktestMetrics & { rollingWindow?: unknown }).rollingWindow = rollingResult;
    }

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
        mtf: mtfResult,
        fractal: input.fractalResult || undefined,
        uiState,
        flags: explanation.flags,
        reasons
    };
}
