import { performAnalysis } from '../lib/analysis/orchestrator';
import { IndicatorSignal } from '../types/probability';
import { Trade } from '../types/backtest';

function runTest() {
    console.log('--- Integration Verification ---');

    // Case 1: Insufficient Data
    console.log('\n[Case 1] No Signals (Insufficient)');
    const resInsufficient = performAnalysis({
        symbol: 'BTC', timeframe: '1h',
        signals: [],
        userTier: 'free'
    });
    console.log(`UI State: ${resInsufficient.uiState}`);
    console.log(`Reasons: ${resInsufficient.reasons.join(', ')}`);

    // Case 2: Free Tier (Standard)
    console.log('\n[Case 2] Free Tier Analysis');
    const signals: IndicatorSignal[] = [
        { name: 'MA', signal: 'BUY', strength: 1, timestamp: 0 },
        { name: 'RSI', signal: 'BUY', strength: 0.8, timestamp: 0 }
    ];
    const resFree = performAnalysis({
        symbol: 'BTC', timeframe: '1h',
        signals: signals,
        adxValue: 30,
        userTier: 'free'
    });
    console.log(`UI State: ${resFree.uiState}`);
    console.log(`Action: ${resFree.explanation.action}`);
    console.log(`Backtest Status: ${resFree.backtest.status}`);
    console.log(`Explanation Evidence: ${resFree.explanation.sections.evidence}`);

    // Case 3: Pro Tier (Full + Backtest)
    console.log('\n[Case 3] Pro Tier Analysis + Backtest');
    const trades: Trade[] = Array(50).fill(null).map((_, i) => ({
        id: i.toString(),
        entryPrice: 100, exitPrice: 110, pnl: 10, pnlPercent: 10,
        entryTime: 0, exitTime: 0, direction: 'LONG'
    }));

    const resPro = performAnalysis({
        symbol: 'BTC', timeframe: '1h',
        signals: signals,
        adxValue: 50,
        trades: trades,
        userTier: 'pro'
    });
    console.log(`UI State: ${resPro.uiState}`);
    console.log(`Backtest WinRate: ${resPro.backtest.winRate}%`);
    console.log(`Explanation Evidence: ${resPro.explanation.sections.evidence}`);

    const checks = [
        resInsufficient.uiState === 'insufficient',
        resFree.uiState === 'ok',
        !resFree.explanation.sections.evidence.includes('과거 승률'), // Free shouldn't see backtest details in evidence
        resPro.backtest.status === 'ok',
        resPro.explanation.sections.evidence.includes('과거 승률') // Pro matches
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
