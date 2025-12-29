import { generateExplanation } from '../lib/explanation/generator';
import { ProbabilityResult, ConfidenceResult } from '../types/probability';
import { BacktestMetrics } from '../types/backtest';

function mockProb(prob: number, regime: any): ProbabilityResult {
    return {
        direction: prob > 50 ? 'UP' : 'DOWN',
        probability: prob,
        confidence: {
            score: 90,
            grade: 'A' as any,
            level: 'HIGH',
            factors: ['MA', 'RSI'],
            breakdown: { agreement: 30, trend: 25, volume: 20, history: 15, volatility: 0 },
            dataQuality: { multiplier: 1, issues: [] }
        },
        regime: regime,
        signals: []
    };
}

function mockConf(grade: any): ConfidenceResult {
    return {
        score: 90,
        grade: grade,
        level: 'HIGH',
        factors: ['Volume Confirm', 'Trend Align'],
        breakdown: { agreement: 30, trend: 25, volume: 20, history: 15, volatility: 0 },
        dataQuality: { multiplier: 1, issues: [] }
    };
}

function runTest() {
    console.log('--- Explanation Verification ---');

    console.log('\n[Case A] Uptrend + High Confidence (Pro)');
    const probA = mockProb(75, 'STRONG_TREND');
    const confA = mockConf('A');
    const backtestA = { winRate: 60, profitFactor: 2.5, maxDrawdownPercent: 10 } as BacktestMetrics;

    const resA = generateExplanation({
        probability: probA, confidence: confA, backtest: backtestA, userTier: 'pro'
    });
    console.log(`Action: ${resA.action}`);
    console.log(`Evidence: ${resA.sections.evidence}`);
    console.log(`Risk: ${resA.sections.risk}`);

    console.log('\n[Case B] High Vol + Low Confidence (Free)');
    const probB = mockProb(50, 'HIGH_VOLATILITY');
    const confB = mockConf('D');
    // Using prohibited term to test validator
    probB.confidence.factors = ['AI 예측 확실'];

    const resB = generateExplanation({
        probability: probB, confidence: confB, userTier: 'free'
    });
    console.log(`Action: ${resB.action}`);
    console.log(`Evidence: ${resB.sections.evidence}`);
    console.log(`Flags: ${resB.flags.join(', ')}`);

    console.log('\n[Case C] High Drop Probability');
    const probC = mockProb(20, 'RANGING'); // 20% rise = 80% drop
    const confC = mockConf('B');

    const resC = generateExplanation({
        probability: probC, confidence: confC, userTier: 'free'
    });
    console.log(`Action: ${resC.action}`);
    console.log(`Risk: ${resC.sections.risk}`);

    // Verification
    const checks = [
        resA.action === 'PARTIAL',
        resA.sections.evidence.includes('손익비 2.50'),
        resB.action === 'HOLD', // High Vol + Low Grade
        resC.action === 'STOP_LOSS' // High Drop
    ];

    if (checks.every(c => c)) {
        console.log('\n✅ ALL CHECKS PASSED');
        process.exit(0);
    } else {
        console.error('\n❌ CHECKS FAILED');
        process.exit(1);
    }
}

runTest();
