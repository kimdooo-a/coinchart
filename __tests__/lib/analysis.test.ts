import { describe, it, expect } from 'vitest';
import { analyzeMarket } from '@/lib/analysis';
import type { CandleData } from '@/lib/api/binance';

// 유효한 시장 상태 union 멤버 (견고성 검증용)
const VALID_MARKET_STATES = ['TRENDING_UP', 'TRENDING_DOWN', 'RANGING', 'VOLATILE', 'UNCERTAIN'];
const VALID_VOL_LEVELS = ['LOW', 'NORMAL', 'HIGH'];
// 한국어 추천 후보
const KO_RECS = ['강력 매수', '매수', '관망', '매도', '강력 매도'];

/**
 * 종가 배열로부터 결정론적 CandleData[] 생성 헬퍼.
 * time은 i초, high >= close >= low 를 보장한다.
 */
function makeCandles(closes: number[]): CandleData[] {
    return closes.map((close, i) => {
        const prevClose = i > 0 ? closes[i - 1] : close;
        const open = prevClose;
        // high/low는 open·close를 모두 포함하도록 여유를 둔다.
        const high = Math.max(open, close) * 1.005;
        const low = Math.min(open, close) * 0.995;
        return {
            time: i, // 초 단위
            open,
            high,
            low,
            close,
            volume: 1000 + i * 10,
        };
    });
}

/**
 * AnalysisResult 구조 불변식 공통 검증.
 * 정확한 marketState 분류는 단정하지 않고 union 멤버십만 본다.
 */
function expectStructuralInvariants(result: ReturnType<typeof analyzeMarket>) {
    expect(result.indicators.length).toBeGreaterThan(0);
    expect(Number.isFinite(result.score)).toBe(true);
    // winRate clamp 10~90
    expect(result.winRate).toBeGreaterThanOrEqual(10);
    expect(result.winRate).toBeLessThanOrEqual(90);
    // lossRate = 100 - winRate (부동소수이므로 toBeCloseTo)
    expect(result.lossRate).toBeCloseTo(100 - result.winRate);
    // marketState 유효 union
    expect(VALID_MARKET_STATES).toContain(result.marketState);
    // priceLevels는 충분한 캔들 수에서 정의되어야 함
    expect(result.priceLevels).toBeDefined();
    // volatility.level 유효 union
    expect(VALID_VOL_LEVELS).toContain(result.volatility.level);
}

describe('analyzeMarket', () => {
    it('데이터 부족(30개 < 60) 시 중립 결과를 반환한다', () => {
        const closes = Array.from({ length: 30 }, (_, i) => 100 + i);
        const result = analyzeMarket(makeCandles(closes));

        expect(result.indicators.length).toBe(0);
        expect(result.winRate).toBe(50);
        expect(result.lossRate).toBe(50);
        expect(result.marketState).toBe('UNCERTAIN');
        expect(result.priceLevels).toBeUndefined();
        expect(result.meta?.recCode).toBe('NEUTRAL');
        expect(result.meta?.totalWeight).toBe(0);
    });

    it('상승추세 픽스처(80개 단조 증가)에서 구조 불변식을 만족한다', () => {
        const closes = Array.from({ length: 80 }, (_, i) => 100 + i * 1.5);
        const result = analyzeMarket(makeCandles(closes));
        expectStructuralInvariants(result);
    });

    it('하락추세 픽스처(80개 단조 감소)에서 구조 불변식을 만족한다', () => {
        const closes = Array.from({ length: 80 }, (_, i) => 300 - i * 1.5);
        const result = analyzeMarket(makeCandles(closes));
        expectStructuralInvariants(result);
    });

    it('횡보 픽스처(80개 좁은 박스권 진동)에서 구조 불변식을 만족한다', () => {
        const closes = Array.from({ length: 80 }, (_, i) => 200 + Math.sin(i / 2) * 2);
        const result = analyzeMarket(makeCandles(closes));
        expectStructuralInvariants(result);
    });

    it("lang:'ko' 옵션 시 recommendation이 한국어 후보 중 하나다", () => {
        const closes = Array.from({ length: 80 }, (_, i) => 100 + i * 1.5);
        const result = analyzeMarket(makeCandles(closes), { lang: 'ko' });
        expect(KO_RECS).toContain(result.recommendation);
    });
});
