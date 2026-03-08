import { describe, it, expect } from 'vitest';
import {
  calculateSMA,
  calculateEMA,
  calculateRSI,
  analyzeRSI,
} from '@/lib/indicators';

describe('calculateSMA', () => {
  it('기본 SMA 계산', () => {
    const prices = [10, 20, 30, 40, 50];
    const result = calculateSMA(prices, 3);
    // period=3이면 앞 2개는 NaN, 이후 이동평균
    expect(result).toHaveLength(5);
    expect(result[0]).toBeNaN();
    expect(result[1]).toBeNaN();
    expect(result[2]).toBeCloseTo(20); // (10+20+30)/3
    expect(result[3]).toBeCloseTo(30); // (20+30+40)/3
    expect(result[4]).toBeCloseTo(40); // (30+40+50)/3
  });

  it('period가 배열 길이와 같으면 결과 1개', () => {
    const prices = [10, 20, 30];
    const result = calculateSMA(prices, 3);
    expect(result.filter((v: number) => !isNaN(v))).toHaveLength(1);
    expect(result[2]).toBeCloseTo(20);
  });

  it('빈 배열 처리 (패딩만 반환)', () => {
    const result = calculateSMA([], 3);
    // period-1개의 NaN 패딩이 생성됨
    expect(result).toHaveLength(2);
    expect(result.every((v: number) => isNaN(v))).toBe(true);
  });
});

describe('calculateEMA', () => {
  it('기본 EMA 계산', () => {
    const prices = [22, 24, 23, 25, 26, 28, 27, 29, 30, 28];
    const result = calculateEMA(prices, 5);
    expect(result).toHaveLength(10);
    // 앞 4개는 NaN
    for (let i = 0; i < 4; i++) {
      expect(result[i]).toBeNaN();
    }
    // index 4는 첫 5개의 SMA
    expect(result[4]).toBeCloseTo(24); // (22+24+23+25+26)/5
    // 이후 EMA 계산 확인
    expect(result[5]).not.toBeNaN();
  });

  it('데이터가 period보다 짧으면 전체 NaN', () => {
    const result = calculateEMA([10, 20], 5);
    expect(result.every((v: number) => isNaN(v))).toBe(true);
  });
});

describe('calculateRSI', () => {
  it('상승만 있는 경우 RSI ≈ 100', () => {
    // 꾸준히 상승하는 데이터 (15개 이상 필요, period=14)
    const prices = Array.from({ length: 20 }, (_, i) => 100 + i);
    const result = calculateRSI(prices, 14);
    const lastRSI = result[result.length - 1];
    expect(lastRSI).toBeCloseTo(100, 0);
  });

  it('하락만 있는 경우 RSI ≈ 0', () => {
    const prices = Array.from({ length: 20 }, (_, i) => 100 - i);
    const result = calculateRSI(prices, 14);
    const lastRSI = result[result.length - 1];
    expect(lastRSI).toBeCloseTo(0, 0);
  });

  it('데이터가 부족하면 전체 NaN', () => {
    const result = calculateRSI([10, 20, 30], 14);
    expect(result.every((v: number) => isNaN(v))).toBe(true);
  });
});

describe('analyzeRSI', () => {
  it('70 이상이면 SELL', () => {
    const result = analyzeRSI(75);
    expect(result.signal).toBe('SELL');
  });

  it('30 이하이면 BUY', () => {
    const result = analyzeRSI(25);
    expect(result.signal).toBe('BUY');
  });

  it('31~69이면 NEUTRAL', () => {
    expect(analyzeRSI(50).signal).toBe('NEUTRAL');
    expect(analyzeRSI(31).signal).toBe('NEUTRAL');
    expect(analyzeRSI(69).signal).toBe('NEUTRAL');
  });

  it('경계값 테스트', () => {
    expect(analyzeRSI(70).signal).toBe('SELL');
    expect(analyzeRSI(30).signal).toBe('BUY');
  });
});
