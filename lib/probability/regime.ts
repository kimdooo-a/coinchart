import { MarketRegime } from '@/types/probability';

interface RegimeInput {
    adx?: number;        // 추세 강도
    atr?: number;        // 변동성
    price?: number;      // 정규화용
    bbWidth?: number;    // 대체 변동성
    plusDI?: number;     // +DI (상승 방향)
    minusDI?: number;    // -DI (하락 방향)
}

// 임계값
const ADX_TREND_THRESHOLD = 25;
const ADX_STRONG_THRESHOLD = 35;
const BB_WIDTH_VOLATILITY_THRESHOLD = 0.10; // 10%
const BB_WIDTH_LOW_THRESHOLD = 0.04; // 4% (축소 = Accumulation)

export function detectRegime(input: RegimeInput): { regime: MarketRegime; reason: string } {
    const { adx, bbWidth, plusDI, minusDI } = input;

    // 1. 극단적 변동성 체크 (BB Width)
    if (bbWidth !== undefined && bbWidth > BB_WIDTH_VOLATILITY_THRESHOLD) {
        return {
            regime: 'HIGH_VOLATILITY',
            reason: `높은 BB Width (${(bbWidth * 100).toFixed(2)}%) - 극단적 변동성`
        };
    }

    // 2. 추세 강도 체크 (ADX)
    if (adx !== undefined) {
        if (adx >= ADX_TREND_THRESHOLD) {
            // ADX > 25: 추세 존재 → +DI/-DI로 방향 구분
            if (plusDI !== undefined && minusDI !== undefined) {
                if (plusDI > minusDI) {
                    return {
                        regime: adx >= ADX_STRONG_THRESHOLD ? 'STRONG_UPTREND' : 'STRONG_UPTREND',
                        reason: `ADX ${adx.toFixed(1)} + +DI(${plusDI.toFixed(1)}) > -DI(${minusDI.toFixed(1)}) → 상승 추세`
                    };
                } else {
                    return {
                        regime: adx >= ADX_STRONG_THRESHOLD ? 'STRONG_DOWNTREND' : 'STRONG_DOWNTREND',
                        reason: `ADX ${adx.toFixed(1)} + -DI(${minusDI.toFixed(1)}) > +DI(${plusDI.toFixed(1)}) → 하락 추세`
                    };
                }
            }
            // DI 데이터 없으면 방향 미구분 추세
            return {
                regime: 'STRONG_TREND',
                reason: `ADX (${adx.toFixed(2)}) - 강한 추세 (방향 미구분)`
            };
        }

        // ADX < 25: 비추세
        // BB Width가 매우 좁으면 Accumulation (횡보 수렴)
        if (bbWidth !== undefined && bbWidth < BB_WIDTH_LOW_THRESHOLD) {
            return {
                regime: 'ACCUMULATION',
                reason: `ADX ${adx.toFixed(1)} + BB Width ${(bbWidth * 100).toFixed(2)}% → 축소 구간 (돌파 대기)`
            };
        }

        return {
            regime: 'RANGING',
            reason: `ADX (${adx.toFixed(2)}) - 약한 추세 (횡보)`
        };
    }

    // 3. Fallback
    return {
        regime: 'RANGING',
        reason: '데이터 부족으로 기본 횡보 분류'
    };
}
