import { ProbabilityResult, ConfidenceResult } from '@/types/probability';
import { BacktestMetrics } from '@/types/backtest';
import { ExplanationOutput } from '@/types/explanation';
import { renderTemplate } from './renderer';

interface GeneratorInput {
    probability: ProbabilityResult;
    confidence: ConfidenceResult;
    backtest?: BacktestMetrics;
    userTier: 'free' | 'pro';
}

export function generateExplanation(input: GeneratorInput): ExplanationOutput {
    const { probability, confidence, backtest, userTier } = input;

    // 1. Determine Action (Logic: Grade & Prob & Regime)
    let action: 'HOLD' | 'PARTIAL' | 'STOP_LOSS' = 'HOLD';

    const isStrongTrend = probability.regime === 'STRONG_TREND';
    const isHighProb = probability.probability >= 60;
    const isHighDrop = (100 - probability.probability) >= 65;
    const isHighVol = probability.regime === 'HIGH_VOLATILITY';
    const isHighGrade = ['A', 'B'].includes(confidence.grade);
    const isLowGrade = ['D', 'F'].includes(confidence.grade);

    if (isHighGrade && isHighProb && isStrongTrend) {
        action = 'PARTIAL';
    } else if (isHighDrop || isLowGrade || isHighVol) {
        // Conservative approach
        if (isHighDrop) action = 'STOP_LOSS';
        else action = 'HOLD';
    } else {
        // Default
        action = 'HOLD';
    }

    // Override: If probability is very high (>70) but Grade is mediocre, still maybe Partial?
    // Following SSOT "grade A/B & riseProb>=60 & strong_trend => PARTIAL" as strictly prioritised.
    // If dropProb >= 65 => STOP_LOSS logic.

    // 2. Prepare Variables for Template
    const topSignals = probability.confidence.factors.slice(0, 3).join(', ');
    const strongFactors = confidence.factors.length > 0 ? confidence.factors.join(', ') : '종합적 지표';

    // Backtest Summary for Pro
    // If 999 or invalid, show N/A
    let riskNotes = "특이 사항 없음";
    if (backtest) {
        if (backtest.profitFactor >= 999) riskNotes = "백테스트 데이터 부족으로 통계 계산 불가";
        else if (backtest.maxDrawdownPercent > 20) riskNotes = `과거 최대 하락폭 -${backtest.maxDrawdownPercent.toFixed(1)}% 주의 필요`;
    }

    const context = {
        action,
        riseProb: probability.probability,
        dropProb: 100 - probability.probability,
        regime: probability.regime,
        strongFactors, // logic needs refinement to map actual signal names not reliability issues
        topSignals: topSignals || "주요 지표",
        riskNotes,
        watchNext: probability.direction === 'UP' ? "저항선" : "지지선", // Simplified
        volatility: isHighVol ? "높음" : "보통",
        grade: confidence.grade
    };

    // 3. Render
    const rendered = renderTemplate(context);

    // 4. Tier based filtering
    // Free: Brief (Template default is already concise, but we can truncate if needed)
    // Pro: Full detail + Backtest

    let finalSections = rendered.sections;

    if (userTier === 'free') {
        // Free tier limitations? Template is already 3-line structure. 
        // We can keep it as is, or hide specific details. 
        // Requirement: "Free: evidence 2줄 + risk 1줄 + watch 1줄"
        // Current template is roughly that length.
    } else {
        // Pro: Add extra insight if available
        if (backtest) {
            const pf = backtest.profitFactor >= 999 ? "N/A" : backtest.profitFactor.toFixed(2);
            const wr = backtest.winRate >= 999 ? "N/A" : `${backtest.winRate.toFixed(1)}%`;
            finalSections.evidence += ` (과거 승률 ${wr}, 손익비 ${pf})`;
        }
    }

    return {
        title: `${action} Strategy`,
        summary: `Action: ${action} | Prob: ${probability.probability}%`,
        keyFactors: probability.confidence.factors,
        regimeAnalysis: probability.regime,

        action,
        sections: finalSections,
        flags: rendered.flags,

        grade: confidence.grade,
        score: confidence.score,
        isPro: userTier === 'pro'
    };
}
