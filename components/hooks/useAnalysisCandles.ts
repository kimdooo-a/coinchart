'use client';

// CRYPTO ANALYSIS ONLY - DO NOT ADD STOCK IMPORTS
import { useEffect, useState } from 'react';
import { aggregateCandles } from '@/lib/analysis/aggregation';

// 분석 패널 공용 캔들 타입 (로컬 정의, 공유 타입 존재 시 import 대체)
export type CandleData = {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
};

interface UseAnalysisCandlesResult {
    candles: CandleData[];
    isLoading: boolean;
    error: string | null;
}

/**
 * 분석용 캔들 데이터를 fetch + 집계하는 훅.
 *
 * SSOT 제약: Supabase에는 일봉(1d) 데이터만 존재하므로 항상 '1d'를 요청하고,
 * 상위 타임프레임(1w/1M)은 클라이언트에서 aggregateCandles로 집계한다.
 *
 * @param symbol   심볼 (예: BTCUSDT)
 * @param interval 표시 인터벌 ('1d' | '1w' ...)
 */
export function useAnalysisCandles(symbol: string, interval: string): UseAnalysisCandlesResult {
    const [candles, setCandles] = useState<CandleData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Binance 데이터를 API 라우트(/api/klines)를 통해 fetch (/market 페이지와 동일)
    useEffect(() => {
        const fetchAnalysisData = async () => {
            setIsLoading(true);
            setError(null);
            setCandles([]);

            try {
                // API 라우트로 Binance(→Supabase 프록시) 데이터 요청.
                // SSOT: 항상 '1d' 데이터를 요청하고, '1w'/'1M' 선택 시 클라이언트에서 집계한다.
                const res = await fetch(`/api/klines?symbol=${symbol.toUpperCase()}&interval=1d&limit=990`);
                if (!res.ok) throw new Error('Failed to fetch klines');
                const data = await res.json();

                if (!data || data.length === 0) {
                    setIsLoading(false);
                    return;
                }

                // CandleData로 매핑 (API는 time을 초 단위로 반환)
                const formatted: CandleData[] = data.map((d: { time: number; open: number; high: number; low: number; close: number; volume: number }) => ({
                    time: d.time, // API에서 이미 초 단위
                    open: Number(d.open),
                    high: Number(d.high),
                    low: Number(d.low),
                    close: Number(d.close),
                    volume: Number(d.volume)
                }));

                // 집계를 위해 시간 오름차순 정렬
                formatted.sort((a, b) => a.time - b.time);

                // 필요 시 집계
                const finalData = aggregateCandles(formatted, interval);

                setCandles(finalData);
                setIsLoading(false);
            } catch (err) {
                console.error('Klines Fetch Error:', err);
                setError('Failed to fetch market data.');
                setIsLoading(false);
            }
        };
        fetchAnalysisData();
    }, [symbol, interval]);

    return { candles, isLoading, error };
}
