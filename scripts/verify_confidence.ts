import { calculateConfidence } from '../lib/probability/confidence';
import { IndicatorSignal } from '../types/probability';

function runTest() {
    console.log('--- Confidence Logic Verification ---');

    // Case 1: High Confidence (Best Conditions)
    // Consensus, Strong Trend, High Volume, Good History
    console.log('\n[Case 1] High Confidence');
    const signalsHigh: IndicatorSignal[] = [
        { name: 'MA', signal: 'BUY', strength: 1, timestamp: 0 },
        { name: 'MACD', signal: 'BUY', strength: 1, timestamp: 0 },
        { name: 'RSI', signal: 'BUY', strength: 1, timestamp: 0 }
    ];
    // Agreement: 100% (30pts)
    // Trend: ADX=50 (25pts)
    // Volume: Ratio=1.5 (20pts)
    // History: 1.0 (15pts)
    // Volatility: 0 (-0pts)
    // Total: 90 => Grade A
    const resHigh = calculateConfidence({
        signals: signalsHigh,
        adxValue: 50,
        volumeRatio: 1.5,
        historicalAccuracy: 1.0
    });
    console.log(`Score: ${resHigh.score} | Grade: ${resHigh.grade} | Level: ${resHigh.level}`);
    console.log(`Breakdown: Ag=${resHigh.breakdown.agreement}, Tr=${resHigh.breakdown.trend}, Vol=${resHigh.breakdown.volume}, Hi=${resHigh.breakdown.history}`);

    // Case 2: Low Data Quality (Stale, Low Vol)
    console.log('\n[Case 2] Data Quality Penalty');
    // Base Score: ~90 reduced by modifiers
    // Stale (>60s) * 0.8
    // Low Vol (<0.3) * 0.85
    // Multiplier = 0.8 * 0.85 = 0.68
    // Final ~ 61 (D)
    const resQuality = calculateConfidence({
        signals: signalsHigh,
        adxValue: 50,
        volumeRatio: 0.2,
        historicalAccuracy: 1.0,
        dataAgeSeconds: 120
    });
    console.log(`Score: ${resQuality.score} | Grade: ${resQuality.grade} | Level: ${resQuality.level}`);
    console.log(`Multiplier: ${resQuality.dataQuality.multiplier.toFixed(2)}`);
    console.log(`Issues: ${resQuality.dataQuality.issues.join(', ')}`);

    // Case 3: Mixed Signals (Low Consensus)
    console.log('\n[Case 3] Low Consensus');
    // Buy, Sell, Neutral
    const signalsMixed: IndicatorSignal[] = [
        { name: 'MA', signal: 'BUY', strength: 1, timestamp: 0 },
        { name: 'MACD', signal: 'SELL', strength: 1, timestamp: 0 },
        { name: 'RSI', signal: 'NEUTRAL', strength: 1, timestamp: 0 }
    ];
    // Agreement: 1/3 = 0.33 * 30 = 10pts
    // Trend: ADX=10 (10/50 * 25) = 5pts
    // Volume: 1.0 (20pts)
    // History: 0.5 (7.5pts)
    // Total ~ 42.5 => Grade F or D?
    const resMixed = calculateConfidence({
        signals: signalsMixed,
        adxValue: 10,
        volumeRatio: 1.0,
        historicalAccuracy: 0.5
    });
    console.log(`Score: ${resMixed.score} | Grade: ${resMixed.grade} | Level: ${resMixed.level}`);

    // Verification
    const success =
        resHigh.grade === 'A' &&
        resQuality.dataQuality.multiplier < 1.0 &&
        resQuality.factors.includes('Stale data (>60s)') &&
        resMixed.score < 50;

    if (success) {
        console.log('\n✅ ALL CHECKS PASSED');
        process.exit(0);
    } else {
        console.error('\n❌ CHECKS FAILED');
        process.exit(1);
    }
}

runTest();
