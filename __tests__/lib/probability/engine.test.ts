import { describe, it, expect } from 'vitest';
import { calculateProbability } from '@/lib/probability/engine';
import type { IndicatorSignal, MarketRegime } from '@/types/probability';

// 헬퍼: IndicatorSignal 생성 (timestamp는 결정론을 위해 0 고정)
function sig(
    name: string,
    signal: 'BUY' | 'SELL' | 'NEUTRAL',
    strength = 1
): IndicatorSignal {
    return { name, signal, strength, timestamp: 0 };
}

const REGIME: MarketRegime = 'RANGING';

describe('calculateProbability — 확률 엔진', () => {
    it('신호가 0개이면 probability 50, direction은 SIDEWAYS', () => {
        // totalWeight=0 → finalScore=0 → riseProbability=(0+100)/2=50
        const result = calculateProbability({ signals: [], regime: REGIME });
        expect(result.probability).toBe(50);
        expect(result.direction).toBe('SIDEWAYS');
    });

    it('전부 BUY 신호면 상한(85)으로 clamp되고 direction은 UP', () => {
        // 모든 신호 BUY → finalScore=+100 → riseProbability=100 → 85로 clamp
        const result = calculateProbability({
            signals: [
                sig('MA', 'BUY'),
                sig('EMA', 'BUY'),
                sig('MACD', 'BUY'),
                sig('RSI', 'BUY'),
            ],
            regime: REGIME,
        });
        expect(result.probability).toBe(85);
        expect(result.direction).toBe('UP');
    });

    it('전부 SELL 신호면 하한(15)으로 clamp되고 direction은 DOWN', () => {
        // 모든 신호 SELL → finalScore=-100 → riseProbability=0 → 15로 clamp
        const result = calculateProbability({
            signals: [
                sig('MA', 'SELL'),
                sig('EMA', 'SELL'),
                sig('MACD', 'SELL'),
                sig('RSI', 'SELL'),
            ],
            regime: REGIME,
        });
        expect(result.probability).toBe(15);
        expect(result.direction).toBe('DOWN');
    });

    it('상충 신호(동일 지표명 BUY/SELL 동수)면 probability가 45~55 근방이고 direction은 SIDEWAYS', () => {
        // 동일 가중치 지표가 BUY/SELL 동수 → weightedSum=0 → finalScore=0 → 50
        const result = calculateProbability({
            signals: [
                sig('RSI', 'BUY'),
                sig('RSI', 'SELL'),
                sig('MACD', 'BUY'),
                sig('MACD', 'SELL'),
            ],
            regime: REGIME,
        });
        // 단정 가능한 케이스: 정확히 50, SIDEWAYS
        expect(result.probability).toBeGreaterThanOrEqual(45);
        expect(result.probability).toBeLessThanOrEqual(55);
        expect(['UP', 'DOWN', 'SIDEWAYS']).toContain(result.direction);
        expect(result.direction).toBe('SIDEWAYS');
    });

    it('mtfMultiplier=1.0이면 미적용되어 생략과 동일한 결과를 낸다', () => {
        const signals = [
            sig('MA', 'BUY'),
            sig('EMA', 'BUY'),
            sig('MACD', 'BUY'),
        ];
        const withMulti = calculateProbability({
            signals,
            regime: REGIME,
            mtfMultiplier: 1.0,
        });
        const without = calculateProbability({ signals, regime: REGIME });
        expect(withMulti.probability).toBe(without.probability);
        expect(withMulti.direction).toBe(without.direction);
    });

    it('mtfMultiplier=0.5이면 전부 BUY일 때 probability가 상한(85)보다 작아진다', () => {
        const signals = [
            sig('MA', 'BUY'),
            sig('EMA', 'BUY'),
            sig('MACD', 'BUY'),
        ];
        const damped = calculateProbability({
            signals,
            regime: REGIME,
            mtfMultiplier: 0.5,
        });
        // finalScore가 절반으로 줄어 riseProbability가 85보다 작아지고 50쪽으로 수렴
        expect(damped.probability).toBeLessThan(85);
        expect(damped.probability).toBeGreaterThanOrEqual(15);
    });

    it('불변식: 모든 케이스에서 probability는 15~85 정수 범위를 만족한다', () => {
        const cases = [
            calculateProbability({ signals: [], regime: REGIME }),
            calculateProbability({
                signals: [sig('MA', 'BUY'), sig('EMA', 'BUY')],
                regime: REGIME,
            }),
            calculateProbability({
                signals: [sig('MA', 'SELL'), sig('EMA', 'SELL')],
                regime: REGIME,
            }),
            calculateProbability({
                signals: [sig('RSI', 'BUY'), sig('RSI', 'SELL')],
                regime: REGIME,
            }),
            calculateProbability({
                signals: [sig('MA', 'BUY'), sig('EMA', 'BUY')],
                regime: REGIME,
                mtfMultiplier: 0.5,
            }),
        ];
        for (const r of cases) {
            expect(r.probability).toBeGreaterThanOrEqual(15);
            expect(r.probability).toBeLessThanOrEqual(85);
            expect(Number.isInteger(r.probability)).toBe(true);
            expect(['UP', 'DOWN', 'SIDEWAYS']).toContain(r.direction);
        }
    });
});
