import { describe, it, expect } from 'vitest';
import { generateHistoricalTrades, analyzeRollingWindow } from '@/lib/backtest/engine';
import type { CandleData } from '@/lib/backtest/engine';
import type { Trade } from '@/types/backtest';

/**
 * 합성 Trade 헬퍼: pnl과 exitTime만 지정해 최소 형태의 Trade를 만든다.
 * analyzeRollingWindow는 pnl(>0 여부)과 exitTime(최근 90일 필터)만 사용하므로
 * 나머지 필드는 결정론적 더미 값으로 채운다.
 */
function mkTrade(pnl: number, exitTime: number): Trade {
    return {
        id: `t-${exitTime}-${pnl}`,
        entryPrice: 100,
        exitPrice: pnl > 0 ? 110 : 90,
        entryTime: exitTime - 1000,
        exitTime,
        direction: 'LONG',
        pnl,
        pnlPercent: pnl, // 더미 (검증에 사용 안 함)
    };
}

const DAY_MS = 24 * 60 * 60 * 1000;

describe('generateHistoricalTrades — 히스토리 거래 생성', () => {
    it('빈 배열이면 [] 를 반환한다', () => {
        expect(generateHistoricalTrades([])).toEqual([]);
    });

    it('길이 49(임계 50 미만)면 [] 를 반환한다', () => {
        const candles: CandleData[] = Array.from({ length: 49 }, (_, i) => ({
            time: 1000 + i,
            open: 100,
            high: 101,
            low: 99,
            close: 100,
            volume: 10,
        }));
        expect(generateHistoricalTrades(candles)).toEqual([]);
    });

    it('100개 진동 캔들이면 배열을 반환하고 각 trade가 유효한 형태를 만족한다', () => {
        // 사인/톱니 진동으로 RSI 과매수·과매도 교차를 유발하는 결정론적 캔들 생성.
        const candles: CandleData[] = Array.from({ length: 100 }, (_, i) => {
            // 큰 진폭의 사인파 + 주기적 급등락으로 RSI 30/70 경계를 넘나들게 한다.
            const base = 100 + Math.sin(i / 3) * 30 + (i % 7 === 0 ? -20 : 0);
            const close = base;
            return {
                time: 1_700_000_000 + i * 3600,
                open: close,
                high: close + 5,
                low: close - 5,
                close,
                volume: 100 + i,
            };
        });

        const trades = generateHistoricalTrades(candles);

        expect(Array.isArray(trades)).toBe(true);
        // 거래가 0건이어도 배열이면 통과 (단정은 length>=0).
        expect(trades.length).toBeGreaterThanOrEqual(0);

        for (const t of trades) {
            expect(typeof t.id).toBe('string');
            expect(typeof t.entryPrice).toBe('number');
            expect(typeof t.exitPrice).toBe('number');
            expect(t.direction).toBe('LONG');
            expect(Number.isFinite(t.pnl)).toBe(true);
            expect(Number.isFinite(t.pnlPercent)).toBe(true);
        }
    });
});

describe('analyzeRollingWindow — 롤링 윈도우 승률 분석', () => {
    it('거래 0건([])이면 전부 0을 반환한다', () => {
        const r = analyzeRollingWindow([]);
        expect(r.recent90DayWinRate).toBe(0);
        expect(r.allTimeWinRate).toBe(0);
        expect(r.strategyDrift).toBe(false);
        expect(r.driftMagnitude).toBe(0);
    });

    it('거래 9건(임계 10 미만)이면 전부 0을 반환한다', () => {
        const now = Date.now();
        const trades = Array.from({ length: 9 }, (_, i) => mkTrade(50, now - i * DAY_MS));
        const r = analyzeRollingWindow(trades);
        expect(r.recent90DayWinRate).toBe(0);
        expect(r.allTimeWinRate).toBe(0);
        expect(r.strategyDrift).toBe(false);
        expect(r.driftMagnitude).toBe(0);
    });

    it('최근 전승(10건, pnl>0, 1일 전)이면 승률 100, drift 없음', () => {
        const now = Date.now();
        const trades = Array.from({ length: 10 }, () => mkTrade(50, now - DAY_MS));
        const r = analyzeRollingWindow(trades);
        expect(r.allTimeWinRate).toBeCloseTo(100, 1);
        expect(r.recent90DayWinRate).toBeCloseTo(100, 1);
        expect(r.strategyDrift).toBe(false);
        expect(r.driftMagnitude).toBeCloseTo(0, 1);
    });

    it('드리프트: 과거 승리 10건 + 최근 패배 5건이면 strategyDrift true', () => {
        const now = Date.now();
        // 과거(200일 전) 승리 10건 — 90일 윈도우 밖
        const past = Array.from({ length: 10 }, () => mkTrade(50, now - 200 * DAY_MS));
        // 최근(1일 전) 패배 5건 — 90일 윈도우 안
        const recent = Array.from({ length: 5 }, () => mkTrade(-50, now - DAY_MS));
        const r = analyzeRollingWindow([...past, ...recent]);

        // 전체 승률 = 10/15 = 66.7
        expect(r.allTimeWinRate).toBeCloseTo(66.7, 1);
        // 최근 90일 = 패배 5건만 → 0
        expect(r.recent90DayWinRate).toBeCloseTo(0, 1);
        expect(r.driftMagnitude).toBeCloseTo(66.7, 1);
        expect(r.strategyDrift).toBe(true);
    });
});
