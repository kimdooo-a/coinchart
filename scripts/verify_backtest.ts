import { calculateMetrics } from '../lib/backtest/metrics';
import { Trade } from '../types/backtest';

function createTrade(pnl: number, exitTime: number, duration: number = 3600000): Trade {
    return {
        id: Math.random().toString(),
        entryPrice: 100,
        exitPrice: 100 + pnl,
        entryTime: exitTime - duration,
        exitTime: exitTime,
        direction: 'LONG',
        pnl: pnl,
        pnlPercent: pnl, // Simplified
    };
}

function runTest() {
    console.log('--- Backtest Metrics Verification ---');

    const dayMs = 24 * 3600 * 1000;

    // Case 1: Standard Mixed Results (>30 trades)
    console.log('\n[Case 1] Standard Mixed Results (50 trades)');
    const tradesMixed: Trade[] = [];
    for (let i = 0; i < 50; i++) {
        // Alternating win/loss
        const pnl = i % 2 === 0 ? 100 : -50;
        tradesMixed.push(createTrade(pnl, i * dayMs));
    }
    const resMixed = calculateMetrics(tradesMixed);
    console.log(`Status: ${resMixed.status}`);
    console.log(`WinRate: ${resMixed.winRate}% (Exp: 50%)`);
    console.log(`ProfitFactor: ${resMixed.profitFactor.toFixed(2)} (Exp: 2.0)`);
    console.log(`Sharpe: ${resMixed.sharpeRatio.toFixed(2)} (Exp: > 0)`);
    console.log(`MDD: ${resMixed.maxDrawdown} (Exp: 50)`);

    // Case 2: Zero Loss (Profit Factor Edge Case)
    console.log('\n[Case 2] Zero Loss (Profit Factor Edge Case)');
    const tradesWin: Trade[] = [];
    for (let i = 0; i < 35; i++) {
        tradesWin.push(createTrade(100, i * dayMs));
    }
    const resWin = calculateMetrics(tradesWin);
    console.log(`Status: ${resWin.status}`);
    console.log(`ProfitFactor: ${resWin.profitFactor} (Exp: 999 or capped)`);
    console.log(`RecoveryFactor: ${resWin.recoveryFactor} (Exp: 999 or capped)`);
    console.log(`Consecutive Wins: ${resWin.maxConsecutiveWins} (Exp: 35)`);

    // Case 3: Zero Variance (Sharpe Edge Case)
    console.log('\n[Case 3] Zero Variance (Sharpe div/0 check)');
    const tradesFlat: Trade[] = [];
    for (let i = 0; i < 35; i++) {
        tradesFlat.push(createTrade(10, i * dayMs)); // Constant small profit
    }
    const resFlat = calculateMetrics(tradesFlat);
    console.log(`Status: ${resFlat.status}`);
    console.log(`Sharpe: ${resFlat.sharpeRatio} (Exp: 0 or handled)`);
    console.log(`RiskReward: ${resFlat.riskRewardRatio} (Exp: 999 or handled)`);

    // Verification Logic
    const checks = [
        resMixed.status === 'ok',
        Math.abs(resMixed.winRate - 50) < 0.1,
        resWin.profitFactor >= 999,
        resWin.maxConsecutiveWins === 35,
        resFlat.sharpeRatio === 0 || resFlat.sharpeRatio > 100 // Depends on implementation of div/0 for StdDev=0.
        // My implementation returns 0 if stdDev is 0.
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
