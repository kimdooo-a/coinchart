'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, Time, CandlestickSeries, LineSeries, HistogramSeries } from 'lightweight-charts';
import { getKlines, subscribeToKlines } from '@/lib/api/binance';
import { calculateRSI, calculateBollingerBands, calculateMACD, calculateSMA } from '@/lib/indicators';

interface Props {
    symbol: string;
    interval?: string;
    showRSI?: boolean;
    showBB?: boolean;
    showMACD?: boolean;
    showVolume?: boolean;
    showMA?: boolean;
    lang: 'en' | 'ko';
    colors?: {
        backgroundColor?: string;
        lineColor?: string;
        textColor?: string;
    };
}

export const CryptoChart: React.FC<Props> = ({
    symbol,
    interval = '1m',
    showRSI = false,
    showBB = false,
    showMACD = false,
    showVolume = false,
    showMA = false,
    lang = 'ko',
    colors = {
        backgroundColor: '#1E1E1E',
        lineColor: '#2962FF',
        textColor: '#D9D9D9',
    },
}) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const rsiContainerRef = useRef<HTMLDivElement>(null);
    const macdContainerRef = useRef<HTMLDivElement>(null);

    const chartRef = useRef<IChartApi | null>(null);
    const rsiChartRef = useRef<IChartApi | null>(null);
    const macdChartRef = useRef<IChartApi | null>(null);

    const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
    const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);

    // Indicators Refs
    const bbUpperRef = useRef<ISeriesApi<'Line'> | null>(null);
    const bbLowerRef = useRef<ISeriesApi<'Line'> | null>(null);
    const bbMiddleRef = useRef<ISeriesApi<'Line'> | null>(null);
    const rsiSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
    const macdHistogramRef = useRef<ISeriesApi<'Histogram'> | null>(null);
    const macdLineRef = useRef<ISeriesApi<'Line'> | null>(null);
    const signalLineRef = useRef<ISeriesApi<'Line'> | null>(null);

    // MA Refs
    const ma7Ref = useRef<ISeriesApi<'Line'> | null>(null);
    const ma25Ref = useRef<ISeriesApi<'Line'> | null>(null);
    const ma99Ref = useRef<ISeriesApi<'Line'> | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const syncCharts = () => {
        const charts = [chartRef.current, rsiChartRef.current, macdChartRef.current].filter(Boolean) as IChartApi[];
        charts.forEach(c1 => {
            c1.timeScale().subscribeVisibleLogicalRangeChange(range => {
                if (!range) return;
                charts.forEach(c2 => {
                    if (c1 !== c2 && c2) c2.timeScale().setVisibleLogicalRange(range);
                });
            });
        });
    };

    // Resize Observer using generic resize logic
    useEffect(() => {
        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                if (entry.target === chartContainerRef.current && chartRef.current) {
                    chartRef.current.applyOptions({ width, height });
                }
                if (entry.target === rsiContainerRef.current && rsiChartRef.current) {
                    rsiChartRef.current.applyOptions({ width, height });
                }
                if (entry.target === macdContainerRef.current && macdChartRef.current) {
                    macdChartRef.current.applyOptions({ width, height });
                }
            }
        });

        if (chartContainerRef.current) resizeObserver.observe(chartContainerRef.current);
        if (rsiContainerRef.current) resizeObserver.observe(rsiContainerRef.current);
        if (macdContainerRef.current) resizeObserver.observe(macdContainerRef.current);

        return () => resizeObserver.disconnect();
    }, [showRSI, showMACD]); // Re-bind if containers appear/disappear

    // Initialize Main Chart
    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            layout: { background: { type: ColorType.Solid, color: colors.backgroundColor }, textColor: colors.textColor },
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
            grid: { vertLines: { color: '#2B2B43' }, horzLines: { color: '#2B2B43' } },
            timeScale: { timeVisible: true, secondsVisible: false },
        });

        const candlestickSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#26a69a', downColor: '#ef5350', borderVisible: false, wickUpColor: '#26a69a', wickDownColor: '#ef5350',
        });

        chartRef.current = chart;
        seriesRef.current = candlestickSeries;

        return () => {
            chartRef.current = null; seriesRef.current = null; chart.remove();
        };
    }, [colors.backgroundColor, colors.textColor]);

    // Initialize RSI Chart
    useEffect(() => {
        if (showRSI && rsiContainerRef.current) {
            const rsiChart = createChart(rsiContainerRef.current, {
                layout: { background: { type: ColorType.Solid, color: colors.backgroundColor }, textColor: colors.textColor },
                width: rsiContainerRef.current.clientWidth,
                height: rsiContainerRef.current.clientHeight,
                grid: { vertLines: { color: '#2B2B43' }, horzLines: { color: '#2B2B43' } },
                timeScale: { timeVisible: true, secondsVisible: false },
            });
            const rsiSeries = rsiChart.addSeries(LineSeries, { color: '#9c27b0', lineWidth: 2 });
            rsiChartRef.current = rsiChart; rsiSeriesRef.current = rsiSeries;
            syncCharts();
            return () => { rsiChartRef.current = null; rsiSeriesRef.current = null; rsiChart.remove(); };
        }
    }, [showRSI, colors]);

    // Initialize MACD Chart
    useEffect(() => {
        if (showMACD && macdContainerRef.current) {
            const macdChart = createChart(macdContainerRef.current, {
                layout: { background: { type: ColorType.Solid, color: colors.backgroundColor }, textColor: colors.textColor },
                width: macdContainerRef.current.clientWidth,
                height: macdContainerRef.current.clientHeight,
                grid: { vertLines: { color: '#2B2B43' }, horzLines: { color: '#2B2B43' } },
                timeScale: { timeVisible: true, secondsVisible: false },
            });
            const histogramSeries = macdChart.addSeries(HistogramSeries, { color: '#26a69a' });
            const macdSeries = macdChart.addSeries(LineSeries, { color: '#2962FF', lineWidth: 2 });
            const signalSeries = macdChart.addSeries(LineSeries, { color: '#FF6D00', lineWidth: 2 });

            macdChartRef.current = macdChart; macdHistogramRef.current = histogramSeries;
            macdLineRef.current = macdSeries; signalLineRef.current = signalSeries;
            syncCharts();
            return () => {
                macdChartRef.current = null; macdHistogramRef.current = null; macdLineRef.current = null; signalLineRef.current = null; macdChart.remove();
            };
        }
    }, [showMACD, colors]);

    // Manage Volume
    useEffect(() => {
        if (!chartRef.current) return;
        try {
            if (showVolume) {
                if (!volumeSeriesRef.current) {
                    volumeSeriesRef.current = chartRef.current.addSeries(HistogramSeries, {
                        color: '#26a69a', priceFormat: { type: 'volume' }, priceScaleId: 'volume',
                    });
                    chartRef.current.priceScale('volume').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 }, visible: false });
                }
            } else {
                if (volumeSeriesRef.current) {
                    chartRef.current.removeSeries(volumeSeriesRef.current); volumeSeriesRef.current = null;
                }
            }
        } catch (e) { console.warn('Volume update failed', e); }
    }, [showVolume]);

    // Manage MA
    useEffect(() => {
        if (!chartRef.current) return;
        try {
            if (showMA) {
                if (!ma7Ref.current) ma7Ref.current = chartRef.current.addSeries(LineSeries, { color: '#E91E63', lineWidth: 1, title: 'MA7' });
                if (!ma25Ref.current) ma25Ref.current = chartRef.current.addSeries(LineSeries, { color: '#2196F3', lineWidth: 1, title: 'MA25' });
                if (!ma99Ref.current) ma99Ref.current = chartRef.current.addSeries(LineSeries, { color: '#FFEA00', lineWidth: 2, title: 'MA99' });
            } else {
                if (ma7Ref.current) { chartRef.current.removeSeries(ma7Ref.current); ma7Ref.current = null; }
                if (ma25Ref.current) { chartRef.current.removeSeries(ma25Ref.current); ma25Ref.current = null; }
                if (ma99Ref.current) { chartRef.current.removeSeries(ma99Ref.current); ma99Ref.current = null; }
            }
        } catch (e) { }
    }, [showMA]);

    // Manage BB
    useEffect(() => {
        if (!chartRef.current) return;
        try {
            if (showBB) {
                if (!bbUpperRef.current) bbUpperRef.current = chartRef.current.addSeries(LineSeries, { color: 'rgba(0, 150, 136, 0.5)', lineWidth: 1 });
                if (!bbLowerRef.current) bbLowerRef.current = chartRef.current.addSeries(LineSeries, { color: 'rgba(0, 150, 136, 0.5)', lineWidth: 1 });
                if (!bbMiddleRef.current) bbMiddleRef.current = chartRef.current.addSeries(LineSeries, { color: 'rgba(255, 179, 0, 1)', lineWidth: 1 });
            } else {
                if (bbUpperRef.current) { chartRef.current.removeSeries(bbUpperRef.current); bbUpperRef.current = null; }
                if (bbLowerRef.current) { chartRef.current.removeSeries(bbLowerRef.current); bbLowerRef.current = null; }
                if (bbMiddleRef.current) { chartRef.current.removeSeries(bbMiddleRef.current); bbMiddleRef.current = null; }
            }
        } catch (e) { }
    }, [showBB]);

    // Data Fetching
    useEffect(() => {
        if (seriesRef.current) seriesRef.current.setData([]);
        // ... (clear all refs logic) ...
        if (rsiSeriesRef.current) rsiSeriesRef.current.setData([]);
        if (bbUpperRef.current) bbUpperRef.current.setData([]);
        if (macdHistogramRef.current) macdHistogramRef.current.setData([]);
        if (volumeSeriesRef.current) volumeSeriesRef.current.setData([]);
        if (ma7Ref.current) ma7Ref.current.setData([]);
        if (ma25Ref.current) ma25Ref.current.setData([]);
        if (ma99Ref.current) ma99Ref.current.setData([]);

        setIsLoading(true); setError(null);
        let unsubscribe: (() => void) | undefined;
        let isCancelled = false;

        const fetchData = async () => {
            try {
                const data = await getKlines(symbol, interval);
                if (isCancelled) return;
                if (!data || data.length === 0) {
                    setError(lang === 'ko' ? `${symbol} 데이터가 없습니다` : `No data found for ${symbol}`); setIsLoading(false); return;
                }

                const closes = data.map(d => d.close);
                const chartData = data.map(d => ({ ...d, time: d.time as Time }));

                if (seriesRef.current) {
                    seriesRef.current.setData(chartData);

                    // Volume
                    if (showVolume && volumeSeriesRef.current) {
                        const volData = data.map(d => ({
                            time: d.time as Time,
                            value: d.volume,
                            color: d.close >= d.open ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)',
                        }));
                        volumeSeriesRef.current.setData(volData);
                    }
                    // MA
                    if (showMA && ma7Ref.current) {
                        const m7: { time: Time, value: number }[] = [];
                        const m25: { time: Time, value: number }[] = [];
                        const m99: { time: Time, value: number }[] = [];
                        const ma7 = calculateSMA(closes, 7); const ma25 = calculateSMA(closes, 25); const ma99 = calculateSMA(closes, 99);
                        data.forEach((d, i) => {
                            const t = d.time as Time;
                            if (ma7[i] !== null) m7.push({ time: t, value: ma7[i]! });
                            if (ma25[i] !== null) m25.push({ time: t, value: ma25[i]! });
                            if (ma99[i] !== null) m99.push({ time: t, value: ma99[i]! });
                        });
                        ma7Ref.current?.setData(m7); ma25Ref.current?.setData(m25); ma99Ref.current?.setData(m99);
                    }
                    // BB
                    if (showBB && bbUpperRef.current) {
                        const bbData = calculateBollingerBands(closes);
                        const u: { time: Time, value: number }[] = [];
                        const l: { time: Time, value: number }[] = [];
                        const m: { time: Time, value: number }[] = [];
                        data.forEach((d, i) => {
                            const band = bbData[i];
                            if (band && !isNaN(band.upper) && !isNaN(band.lower) && !isNaN(band.middle)) {
                                const t = d.time as Time;
                                u.push({ time: t, value: band.upper });
                                l.push({ time: t, value: band.lower });
                                m.push({ time: t, value: band.middle });
                            }
                        });
                        bbUpperRef.current?.setData(u); bbLowerRef.current?.setData(l); bbMiddleRef.current?.setData(m);
                    }
                    // RSI
                    if (showRSI && rsiSeriesRef.current) {
                        const rsi = calculateRSI(closes);
                        const r: { time: Time, value: number }[] = [];
                        data.forEach((d, i) => { if (rsi[i] !== null) r.push({ time: d.time as Time, value: rsi[i]! }); });
                        rsiSeriesRef.current?.setData(r);
                    }
                    // MACD
                    if (showMACD && macdHistogramRef.current) {
                        const { macd: macdLine, signal: signalLine, histogram } = calculateMACD(closes);
                        const m: { time: Time, value: number }[] = [];
                        const s: { time: Time, value: number }[] = [];
                        const h: { time: Time, value: number, color: string }[] = [];
                        data.forEach((d, i) => {
                            const t = d.time as Time;
                            if (macdLine[i] !== null) m.push({ time: t, value: macdLine[i]! });
                            if (signalLine[i] !== null) s.push({ time: t, value: signalLine[i]! });
                            if (histogram[i] !== null) h.push({ time: t, value: histogram[i]!, color: histogram[i]! >= 0 ? '#26a69a' : '#ef5350' });
                        });
                        macdLineRef.current?.setData(m); signalLineRef.current?.setData(s); macdHistogramRef.current?.setData(h);
                    }

                    unsubscribe = subscribeToKlines(symbol, interval, (candle) => {
                        if (seriesRef.current) seriesRef.current.update({ ...candle, time: candle.time as Time });
                    });
                    setIsLoading(false);
                }
            } catch (err) {
                if (!isCancelled) { console.error(err); setError(lang === 'ko' ? '데이터 로드 실패' : 'Failed to load chart data'); setIsLoading(false); }
            }
        };
        fetchData();
        return () => { isCancelled = true; if (unsubscribe) unsubscribe(); };
    }, [symbol, interval, showRSI, showBB, showMACD, showVolume, showMA]);

    return (
        <div className="w-full flex flex-col gap-2 relative">
            {(isLoading || error) && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-900 bg-opacity-80 rounded-lg backdrop-blur-sm">
                    {error ? <div className="bg-red-900/50 p-4 rounded text-red-200">{error}</div> : <div className="text-blue-400">{lang === 'ko' ? '데이터 로딩중...' : 'Loading Data...'}</div>}
                </div>
            )}
            {/* Responsive Heights via CSS classes */}
            <div ref={chartContainerRef} className="w-full h-[300px] md:h-[450px]" />
            {showRSI && <div ref={rsiContainerRef} className="w-full h-[120px] md:h-[150px]" />}
            {showMACD && <div ref={macdContainerRef} className="w-full h-[120px] md:h-[150px]" />}
        </div>
    );
};
