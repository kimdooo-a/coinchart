import { calculateProbability } from '../lib/probability/engine';
import { detectRegime } from '../lib/probability/regime';
import { IndicatorSignal } from '../types/probability';

function runTest() {
    console.log('--- Probability Engine Verification ---');

    // Case 1: Strong Uptrend (Expected > 50%, capped at 85%?)
    console.log('\n[Case 1] Strong Uptrend Inputs');
    const signalsUp: IndicatorSignal[] = [
        { name: 'MA', signal: 'BUY', strength: 1.0, timestamp: 0 },
        { name: 'MACD', signal: 'BUY', strength: 0.9, timestamp: 0 },
        { name: 'RSI', signal: 'BUY', strength: 0.8, timestamp: 0 }, // Not overbought yet
        { name: 'ADX', signal: 'BUY', strength: 1.0, timestamp: 0 }
    ];

    const regimeTrend = detectRegime({ adx: 40 }); // Strong Trend
    console.log(`Regime Detected: ${regimeTrend.regime} (${regimeTrend.reason})`);

    const resUp = calculateProbability({ signals: signalsUp, regime: regimeTrend.regime });
    console.log(`Result UP: ${resUp.direction} ${resUp.probability}% (Regime: ${resUp.regime})`);
    console.log(`Top Factors: ${resUp.confidence.factors.join(', ')}`);

    // Case 2: Mixed / Ranging (Expected ~50%)
    console.log('\n[Case 2] Mixed Inputs');
    const signalsMixed: IndicatorSignal[] = [
        { name: 'MA', signal: 'SELL', strength: 0.5, timestamp: 0 },
        { name: 'MACD', signal: 'BUY', strength: 0.2, timestamp: 0 },
        { name: 'RSI', signal: 'NEUTRAL', strength: 0, timestamp: 0 }
    ];
    const regimeRanging = detectRegime({ adx: 15 });
    console.log(`Regime Detected: ${regimeRanging.regime} (${regimeRanging.reason})`);

    const resMixed = calculateProbability({ signals: signalsMixed, regime: regimeRanging.regime });
    console.log(`Result Mixed: ${resMixed.direction} ${resMixed.probability}%`);

    // Case 3: Extreme Sell (Check Clamp 15%)
    console.log('\n[Case 3] Extreme Sell');
    const signalsSell: IndicatorSignal[] = [
        { name: 'MA', signal: 'SELL', strength: 1.0, timestamp: 0 },
        { name: 'EMA', signal: 'SELL', strength: 1.0, timestamp: 0 },
        { name: 'MACD', signal: 'SELL', strength: 1.0, timestamp: 0 },
        { name: 'RSI', signal: 'SELL', strength: 1.0, timestamp: 0 },
        { name: 'BollingerBands', signal: 'SELL', strength: 1.0, timestamp: 0 }
    ];
    const regimeVol = detectRegime({ bbWidth: 0.5 }); // High Vol?
    console.log(`Regime Detected: ${regimeVol.regime} (${regimeVol.reason})`);

    const resSell = calculateProbability({ signals: signalsSell, regime: regimeVol.regime });
    console.log(`Result Sell: ${resSell.direction} ${resSell.probability}% (Should be clamped to ~15%)`);

    // Verification Logic
    const checks = [
        resUp.probability <= 85,
        resSell.probability >= 15,
        regimeTrend.regime === 'STRONG_TREND',
        regimeVol.regime === 'HIGH_VOLATILITY'
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
