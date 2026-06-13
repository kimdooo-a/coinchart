import { describe, it, expect } from 'vitest';
import { analyzeFractalPattern } from '@/lib/fractal_engine';
import type { CandleData } from '@/lib/api/binance';

/**
 * 종가 배열로부터 결정론적 CandleData 배열을 생성한다.
 * time 은 인덱스 i, open/high/low 는 close 기반으로 채운다 (네트워크 없음).
 */
function makeCandles(closes: number[]): CandleData[] {
    return closes.map((close, i) => ({
        time: i,
        open: close,
        high: close + 1,
        low: close - 1,
        close,
        volume: 100,
    }));
}

describe('analyzeFractalPattern (프랙탈 패턴 매칭 엔진)', () => {
    it('빈 배열 입력 시 데이터 부족으로 WAIT/confidence 0/bestMatches 0 을 반환한다', async () => {
        const result = await analyzeFractalPattern('BTCUSDT', []);

        expect(result.symbol).toBe('BTCUSDT');
        expect(result.recommendedPosition).toBe('WAIT');
        expect(result.confidence).toBe(0);
        expect(result.avgReturn).toBe(0);
        expect(result.bestMatches).toHaveLength(0);
    });

    it('임계치(117) 미만인 116개 입력은 데이터 부족 분기로 WAIT/confidence 0 을 반환한다', async () => {
        // patternLength(14) + forecastHorizon(3) + 100 = 117 → 116개는 미달
        const closes = Array.from({ length: 116 }, (_, i) => 100 + i);
        const result = await analyzeFractalPattern('BTCUSDT', makeCandles(closes));

        expect(result.recommendedPosition).toBe('WAIT');
        expect(result.confidence).toBe(0);
        expect(result.avgReturn).toBe(0);
        expect(result.bestMatches).toHaveLength(0);
    });

    it('전부 동일한 close 값(120개)은 분모 0 가드로 NaN/Infinity 없이 WAIT/빈 매칭을 반환한다', async () => {
        // 동일값 시퀀스 → normalizePattern 전부 0 → calculateCorrelation 분모 0 → 0 반환(가드)
        const closes = Array.from({ length: 120 }, () => 50000);
        const result = await analyzeFractalPattern('BTCUSDT', makeCandles(closes));

        expect(result.recommendedPosition).toBe('WAIT');
        expect(result.bestMatches).toHaveLength(0);
        // NaN/Infinity 부재 검증
        expect(Number.isNaN(result.confidence)).toBe(false);
        expect(Number.isFinite(result.confidence)).toBe(true);
        expect(Number.isNaN(result.avgReturn)).toBe(false);
        expect(Number.isFinite(result.avgReturn)).toBe(true);
        expect(result.confidence).toBe(0);
        expect(result.avgReturn).toBe(0);
    });

    it('반복 패턴(사인파 150개)에 대해 결과 구조 불변식을 만족한다', async () => {
        // 사인파로 반복적 구조를 만들어 매칭이 발생할 수 있는 입력 구성
        const closes = Array.from({ length: 150 }, (_, i) => 50000 + Math.sin(i / 5) * 500);
        const result = await analyzeFractalPattern('ETHUSDT', makeCandles(closes));

        // recommendedPosition 은 세 값 중 하나
        expect(['BUY', 'SELL', 'WAIT']).toContain(result.recommendedPosition);

        // confidence 는 0~100 범위, 유한수
        expect(Number.isFinite(result.confidence)).toBe(true);
        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeLessThanOrEqual(100);

        // avgReturn 은 유한수
        expect(Number.isFinite(result.avgReturn)).toBe(true);

        // bestMatches 길이는 최대 5
        expect(result.bestMatches.length).toBeLessThanOrEqual(5);

        // 각 매칭의 similarity 는 100 이하, nextMovePercent 는 유한수
        result.bestMatches.forEach(m => {
            expect(m.similarity).toBeLessThanOrEqual(100);
            expect(Number.isFinite(m.similarity)).toBe(true);
            expect(Number.isFinite(m.nextMovePercent)).toBe(true);
            expect(m.endIndex).toBeGreaterThan(m.startIndex);
        });
    });

    it('톱니파(200개) 입력에서도 confidence·avgReturn 이 유한하고 매칭 정렬(내림차순)을 유지한다', async () => {
        // 0~9 반복 톱니파 → 주기적 구조
        const closes = Array.from({ length: 200 }, (_, i) => 50000 + (i % 10) * 100);
        const result = await analyzeFractalPattern('XRPUSDT', makeCandles(closes));

        expect(['BUY', 'SELL', 'WAIT']).toContain(result.recommendedPosition);
        expect(Number.isFinite(result.confidence)).toBe(true);
        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeLessThanOrEqual(100);
        expect(Number.isFinite(result.avgReturn)).toBe(true);
        expect(result.bestMatches.length).toBeLessThanOrEqual(5);

        // 유사도 내림차순 정렬 검증
        for (let i = 1; i < result.bestMatches.length; i++) {
            expect(result.bestMatches[i - 1].similarity).toBeGreaterThanOrEqual(
                result.bestMatches[i].similarity
            );
        }
    });
});
