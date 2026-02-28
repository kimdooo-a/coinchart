// lib/analysis/candlestick.ts
// 캔들스틱 패턴 인식 모듈 - 핵심 8패턴

export interface CandlestickPattern {
    pattern: string;
    signal: 'BUY' | 'SELL' | 'NEUTRAL';
    strength: number; // 단일: 0.6, 2캔들: 0.8, 3캔들: 1.0
    description: string;
}

interface Candle {
    open: number;
    high: number;
    low: number;
    close: number;
}

function bodySize(c: Candle): number {
    return Math.abs(c.close - c.open);
}

function range(c: Candle): number {
    return c.high - c.low;
}

function isBullish(c: Candle): boolean {
    return c.close > c.open;
}

function isBearish(c: Candle): boolean {
    return c.close < c.open;
}

function upperShadow(c: Candle): number {
    return c.high - Math.max(c.open, c.close);
}

function lowerShadow(c: Candle): number {
    return Math.min(c.open, c.close) - c.low;
}

/**
 * 캔들스틱 패턴 감지
 * @param candles 최근 캔들 배열 (최소 5개 필요)
 * @returns 감지된 패턴 배열
 */
export function detectCandlestickPatterns(candles: Candle[]): CandlestickPattern[] {
    if (candles.length < 5) return [];

    const patterns: CandlestickPattern[] = [];
    const last = candles[candles.length - 1];
    const prev = candles[candles.length - 2];
    const prev2 = candles[candles.length - 3];

    const lastRange = range(last);
    const lastBody = bodySize(last);

    // 평균 범위 (변동성 기준용)
    const avgRange = candles.slice(-10).reduce((sum, c) => sum + range(c), 0) / 10;

    // --- 단일 캔들 패턴 (strength: 0.6) ---

    // 1. Doji: body < 전체 range의 10%
    if (lastRange > 0 && lastBody / lastRange < 0.10) {
        patterns.push({
            pattern: 'Doji',
            signal: 'NEUTRAL', // Doji는 방향성 없음, 반전 가능성 시사
            strength: 0.6,
            description: '도지: 시가/종가 거의 동일 - 추세 전환 가능성'
        });
    }

    // 2. Hammer (바닥에서): 긴 아래꼬리 + 작은 몸통 + 짧은 윗꼬리
    if (lastRange > avgRange * 0.5) {
        const ls = lowerShadow(last);
        const us = upperShadow(last);
        if (ls > lastBody * 2 && us < lastBody * 0.5 && lastBody > 0) {
            patterns.push({
                pattern: 'Hammer',
                signal: 'BUY',
                strength: 0.6,
                description: '해머: 하락 후 반전 가능성 (긴 아래꼬리)'
            });
        }
    }

    // 3. Shooting Star (꼭대기에서): 긴 윗꼬리 + 작은 몸통 + 짧은 아래꼬리
    if (lastRange > avgRange * 0.5) {
        const ls = lowerShadow(last);
        const us = upperShadow(last);
        if (us > lastBody * 2 && ls < lastBody * 0.5 && lastBody > 0) {
            patterns.push({
                pattern: 'Shooting Star',
                signal: 'SELL',
                strength: 0.6,
                description: '슈팅스타: 상승 후 반전 가능성 (긴 윗꼬리)'
            });
        }
    }

    // --- 2캔들 패턴 (strength: 0.8) ---

    // 4. Bullish Engulfing: 이전 음봉을 현재 양봉이 완전히 감싸는 패턴
    if (isBearish(prev) && isBullish(last)) {
        if (last.open <= prev.close && last.close >= prev.open) {
            patterns.push({
                pattern: 'Bullish Engulfing',
                signal: 'BUY',
                strength: 0.8,
                description: '상승 장악형: 강한 매수 반전 신호'
            });
        }
    }

    // 5. Bearish Engulfing: 이전 양봉을 현재 음봉이 완전히 감싸는 패턴
    if (isBullish(prev) && isBearish(last)) {
        if (last.open >= prev.close && last.close <= prev.open) {
            patterns.push({
                pattern: 'Bearish Engulfing',
                signal: 'SELL',
                strength: 0.8,
                description: '하락 장악형: 강한 매도 반전 신호'
            });
        }
    }

    // --- 3캔들 패턴 (strength: 1.0) ---

    // 6. Morning Star: 음봉 + 짧은 몸통(갭) + 양봉
    if (isBearish(prev2) && isBullish(last)) {
        const prevBody = bodySize(prev);
        const prev2Body = bodySize(prev2);
        if (prevBody < prev2Body * 0.3 && lastBody > prev2Body * 0.5) {
            // 중간 캔들이 작고, 마지막 양봉이 첫 음봉의 50% 이상 회복
            if (last.close > (prev2.open + prev2.close) / 2) {
                patterns.push({
                    pattern: 'Morning Star',
                    signal: 'BUY',
                    strength: 1.0,
                    description: '모닝스타: 강력한 바닥 반전 3캔들 패턴'
                });
            }
        }
    }

    // 7. Evening Star: 양봉 + 짧은 몸통(갭) + 음봉
    if (isBullish(prev2) && isBearish(last)) {
        const prevBody = bodySize(prev);
        const prev2Body = bodySize(prev2);
        if (prevBody < prev2Body * 0.3 && lastBody > prev2Body * 0.5) {
            if (last.close < (prev2.open + prev2.close) / 2) {
                patterns.push({
                    pattern: 'Evening Star',
                    signal: 'SELL',
                    strength: 1.0,
                    description: '이브닝스타: 강력한 고점 반전 3캔들 패턴'
                });
            }
        }
    }

    // 8a. Three White Soldiers: 연속 3 양봉 (각각 이전 캔들보다 높은 종가)
    if (isBullish(prev2) && isBullish(prev) && isBullish(last)) {
        if (prev.close > prev2.close && last.close > prev.close) {
            // 각 캔들의 몸통이 적절한 크기
            if (bodySize(prev2) > avgRange * 0.3 && bodySize(prev) > avgRange * 0.3 && lastBody > avgRange * 0.3) {
                patterns.push({
                    pattern: 'Three White Soldiers',
                    signal: 'BUY',
                    strength: 1.0,
                    description: '적삼병: 연속 상승 3캔들 - 강한 상승 모멘텀'
                });
            }
        }
    }

    // 8b. Three Black Crows: 연속 3 음봉 (각각 이전 캔들보다 낮은 종가)
    if (isBearish(prev2) && isBearish(prev) && isBearish(last)) {
        if (prev.close < prev2.close && last.close < prev.close) {
            if (bodySize(prev2) > avgRange * 0.3 && bodySize(prev) > avgRange * 0.3 && lastBody > avgRange * 0.3) {
                patterns.push({
                    pattern: 'Three Black Crows',
                    signal: 'SELL',
                    strength: 1.0,
                    description: '흑삼병: 연속 하락 3캔들 - 강한 하락 모멘텀'
                });
            }
        }
    }

    return patterns;
}
