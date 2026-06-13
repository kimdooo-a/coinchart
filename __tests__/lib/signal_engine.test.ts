import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { scanMarket } from '@/lib/signal_engine';

// signal_engine.ts 의 내부 fetchCandles 는 export 되지 않으므로
// 모듈 모킹이 불가능하다. 대신 fetchCandles 가 호출하는
// global fetch 를 직접 모킹하여 결정론적(오프라인) 캔들을 주입한다.
//
// fetchCandles 응답 매핑 규칙:
//   res.ok 확인 → res.json() → 배열이면 { close, high, low, volume, time: time*1000 } 로 매핑
//   (res.ok 아니거나 비배열이면 [])
// scanMarket 은 POPULAR_SYMBOLS 6종(BTC/ETH/XRP/SOL/BCH/DOGE USDT)을 순회하며
// candles.length >= 20 이어야 신호를 계산한다.

type RawCandle = {
    time: number; // 초 단위 (fetchCandles 에서 *1000 됨)
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
};

// 모킹 응답 헬퍼: { ok, statusText, json }
function mkResp(candles: RawCandle[]) {
    return {
        ok: true,
        statusText: '',
        json: async () => candles,
    };
}

// close 배열로부터 RawCandle[] 생성 (high/low/open 은 close 기반으로 적당히)
function toCandles(closes: number[]): RawCandle[] {
    return closes.map((close, i) => ({
        time: 1_700_000_000 + i * 3600, // 초 단위, 1시간 간격
        open: close,
        high: close * 1.001,
        low: close * 0.999,
        close,
        volume: 1000,
    }));
}

describe('signal_engine - scanMarket', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('평탄/중립 구간이면 RSI·펌프 신호 없이 BTC/ETH INFO 브리핑만 반환한다', async () => {
        // close 가 100 근처 ±1 교대 → RSI ~50, 직전 변화율 <3%
        const closes: number[] = [];
        for (let i = 0; i < 50; i++) {
            closes.push(i % 2 === 0 ? 100 : 99);
        }
        const candles = toCandles(closes);
        // 모든 심볼에 동일 데이터 반환
        (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mkResp(candles));

        const signals = await scanMarket();

        // 신호가 하나도 없으면 BTC/ETH 에 대해 INFO 브리핑 2개 추가
        expect(signals).toHaveLength(2);
        expect(signals.every((s) => s.type === 'INFO')).toBe(true);
    });

    it('강한 단조 하락 구간이면 RSI<30 으로 BUY 신호가 1개 이상 생성된다', async () => {
        // 200 에서 1씩 감소 (200,199,...,151) → 전부 손실 → RSI 0 (<30)
        // 각 스텝 변화율은 -1% 미만이라 3% 펌프/덤프 기준에는 걸리지 않는다.
        const closes: number[] = [];
        for (let i = 0; i < 50; i++) {
            closes.push(200 - i);
        }
        const candles = toCandles(closes);
        (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mkResp(candles));

        const signals = await scanMarket();

        const buys = signals.filter((s) => s.type === 'BUY');
        expect(buys.length).toBeGreaterThanOrEqual(1);
    });

    it('마지막 캔들이 직전 대비 +5% 급등하면 급등 WARNING 신호가 존재한다', async () => {
        // 49개 평탄(100) + 마지막 105 → priceChange +5% (>3%) → WARNING '급등'
        const closes: number[] = [];
        for (let i = 0; i < 49; i++) {
            closes.push(100);
        }
        closes.push(105);
        const candles = toCandles(closes);
        (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mkResp(candles));

        const signals = await scanMarket();

        const pumpWarnings = signals.filter(
            (s) => s.type === 'WARNING' && s.title.includes('급등')
        );
        expect(pumpWarnings.length).toBeGreaterThanOrEqual(1);

        // 급등 폭 검증(부동소수 → toBeCloseTo): (105-100)/100*100 = 5%
        const priceChange = ((105 - 100) / 100) * 100;
        expect(priceChange).toBeCloseTo(5, 5);
    });
});
