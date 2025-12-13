
import { analyzeMarket } from '../lib/analysis';

console.log("Generating mock candles...");

const candles: any[] = [];
let price = 10000;

// 1. Generate 100 candles of uptrend
for (let i = 0; i < 100; i++) {
    const move = (Math.random() - 0.4) * 100; // Slight upward bias
    price += move;
    candles.push({
        time: Date.now() - (200 - i) * 3600000,
        open: price,
        high: price + Math.random() * 50,
        low: price - Math.random() * 50,
        close: price + (Math.random() - 0.5) * 20,
        volume: 1000
    });
}

// 2. Generate 50 candles of consolidation/downtrend
for (let i = 0; i < 50; i++) {
    const move = (Math.random() - 0.6) * 100; // Slight downward bias
    price += move;
    candles.push({
        time: Date.now() - (100 - i) * 3600000,
        open: price,
        high: price + Math.random() * 50,
        low: price - Math.random() * 50,
        close: price + (Math.random() - 0.5) * 20,
        volume: 1000
    });
}

console.log(`Generated ${candles.length} candles. Last Price: ${candles[candles.length - 1].close.toFixed(2)}`);

console.log("\n--- Running Analysis (EN) ---");
const resultEn = analyzeMarket(candles, { lang: 'en', horizonBars: 3 });
console.log("Recommendation:", resultEn.recommendation);
console.log("Score:", resultEn.score);
console.log("Win Rate:", resultEn.winRate);
console.log("Market State:", resultEn.marketState);
console.log("Volatility:", resultEn.volatility);
console.log("Price Levels:", JSON.stringify(resultEn.priceLevels, null, 2));

console.log("\n--- Indicator Details ---");
resultEn.indicators.forEach(ind => {
    console.log(`[${ind.name}] Signal: ${ind.signal} | WinRate: ${ind.winRate}% | Weight: ${ind.meta?.weight} | Conf: ${ind.meta?.confidence}`);
});

console.log("\nDone.");
