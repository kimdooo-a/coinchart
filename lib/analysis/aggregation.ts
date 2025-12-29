import { CandleData } from '@/components/Analysis/AnalysisPanel';

/**
 * Aggregates daily candles into Weekly or Monthly candles.
 * @param dailyCandles Array of daily candles (sorted ASC or DESC, handled)
 * @param timeframe '1w' or '1M'
 * @returns Aggregated candles sorted ASCENDING by time
 */
export function aggregateCandles(dailyCandles: CandleData[], timeframe: string): CandleData[] {
    if (!dailyCandles || dailyCandles.length === 0) return [];
    if (timeframe === '1d') return dailyCandles; // No op

    // Ensure sorted by time ASC for aggregation
    const sorted = [...dailyCandles].sort((a, b) => a.time - b.time);
    const aggregated: CandleData[] = [];

    let currentCandle: CandleData | null = null;
    let currentBucketKey = "";

    for (const candle of sorted) {
        const date = new Date(candle.time * 1000);
        let key = "";

        if (timeframe === '1w') {
            // ISO Week (starts Monday)
            // Simpler approach: Key by "Year-WeekNumber"
            // Or get Monday of the week
            const day = date.getDay(); // 0 (Sun) to 6 (Sat)
            const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
            const monday = new Date(date.setDate(diff));
            monday.setHours(0, 0, 0, 0);
            key = monday.getTime().toString();
        } else if (timeframe === '1M') {
            // Key by Year-Month
            key = `${date.getFullYear()}-${date.getMonth()}`;
        } else {
            return sorted; // Unsupported
        }

        if (currentBucketKey !== key) {
            // Push previous
            if (currentCandle) {
                aggregated.push(currentCandle);
            }
            // Start new
            currentBucketKey = key;
            currentCandle = {
                time: timeframe === '1w' ? Number(key) / 1000 : candle.time, // Use bucket start time or first candle time? 
                // Better use candle.time (first of bucket) if key is abstract, 
                // but for 1w key is Monday timestamp.
                open: candle.open,
                high: candle.high,
                low: candle.low,
                close: candle.close,
                volume: candle.volume
            };
        } else {
            // Merge
            if (currentCandle) {
                currentCandle.high = Math.max(currentCandle.high, candle.high);
                currentCandle.low = Math.min(currentCandle.low, candle.low);
                currentCandle.close = candle.close;
                currentCandle.volume += candle.volume;
            }
        }
    }

    if (currentCandle) {
        aggregated.push(currentCandle);
    }

    return aggregated;
}
