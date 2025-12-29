
import { generateHistoricalTrades, CandleData } from '../lib/backtest/engine';
import { calculateMetrics } from '../lib/backtest/metrics';
// import { CandleData } from '../components/Analysis/AnalysisPanel'; // Removed

// Mock Data Generator
function generateMockCandles(count: number, trend: 'UP' | 'DOWN' | 'FLAT' = 'UP'): CandleData[] {
    const candles: CandleData[] = [];
    let price = 10000;
    const now = Math.floor(Date.now() / 1000) - (count * 86400);

    for (let i = 0; i < count; i++) {
        const time = now + (i * 86400);
        const change = trend === 'UP' ? 1.001 : trend === 'DOWN' ? 0.999 : 1.0;
        const random = 1 + ((Math.random() - 0.5) * 0.02); // +/- 1% noise

        const close = price * change * random;
        const open = price;
        const high = Math.max(open, close) * 1.005;
        const low = Math.min(open, close) * 0.995;
        const volume = 1000 + Math.random() * 1000;

        candles.push({ time, open, high, low, close, volume });
        price = close;
    }
    return candles;
}

// Main Test Function
async function runTest() {
    console.log('--- Starting Backtest Debug ---');

    // 1. Generate Mock Data (Sufficient Data)
    const candles = generateMockCandles(200, 'UP'); // 200 days
    console.log(`Generated ${candles.length} candles.`);

    // 2. Run Engine
    console.log('Running generateHistoricalTrades...');
    const trades = generateHistoricalTrades(candles);
    console.log(`Trades generated: ${trades.length}`);

    if (trades.length > 0) {
        console.log('First Trade:', JSON.stringify(trades[0], null, 2));
    }

    // 3. Calculate Metrics
    console.log('Calculating Metrics...');
    const metrics = calculateMetrics(trades);
    console.log('Metrics Result:', JSON.stringify(metrics, null, 2));

    // 4. Test Insufficient Scenario
    console.log('\n--- Testing Insufficient Data ---');
    const smallCandles = generateMockCandles(40, 'UP');
    const smallTrades = generateHistoricalTrades(smallCandles);
    console.log(`Small Dataset (40 candles) Trades: ${smallTrades.length}`);
    const smallMetrics = calculateMetrics(smallTrades);
    console.log('Small Metrics Status:', smallMetrics.status);
}

runTest().catch(console.error);
