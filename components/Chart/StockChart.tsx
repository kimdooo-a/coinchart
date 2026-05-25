'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, Time, CandlestickSeries, LineSeries, HistogramSeries } from 'lightweight-charts';
import { calculateRSI, calculateBollingerBands, calculateMACD, calculateSMA } from '@/lib/indicators';
import { getChartTheme, getCandleColors, getDirectionColors, getVolumeColors, getIndicatorColors } from '@/lib/chart/theme';

// 라이트 테마 + 한국식(빨↑/파↓) 캔들 — lib/chart/theme.ts SSOT (R1/T08).
// 주식도 한국 투자자 관례(빨↑/파↓)에 맞춰 'kr' 적용.
const CHART_THEME = getChartTheme('light');
const CANDLE_COLORS = getCandleColors('kr');
// 히스토그램 방향색(한국식 빨↑/파↓): MACD 불투명, 볼륨 반투명
const DIRECTION_COLORS = getDirectionColors('kr');
const VOLUME_COLORS = getVolumeColors('kr');
// 보조지표 라인 식별색(SSOT) — RSI/MACD/MA/BB. 방향색 아님(R7-3)
const IND = getIndicatorColors();

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

export const StockChart: React.FC<Props> = ({
    symbol,
    interval = '1d',
    showRSI = false,
    showBB = false,
    showMACD = false,
    showVolume = false,
    showMA = false,
    lang = 'ko',
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
    }, [showRSI, showMACD]);

    // Initialize Main Chart
    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            ...CHART_THEME,
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
            timeScale: { ...CHART_THEME.timeScale, timeVisible: true, secondsVisible: false },
        });

        const candlestickSeries = chart.addSeries(CandlestickSeries, {
            ...CANDLE_COLORS, borderVisible: false,
        });

        chartRef.current = chart;
        seriesRef.current = candlestickSeries;

        return () => {
            chartRef.current = null; seriesRef.current = null; chart.remove();
        };
    }, []);

    // Initialize RSI Chart
    useEffect(() => {
        if (showRSI && rsiContainerRef.current) {
            const rsiChart = createChart(rsiContainerRef.current, {
                ...CHART_THEME,
                width: rsiContainerRef.current.clientWidth,
                height: rsiContainerRef.current.clientHeight,
                timeScale: { ...CHART_THEME.timeScale, timeVisible: true, secondsVisible: false },
            });
            const rsiSeries = rsiChart.addSeries(LineSeries, { color: IND.rsi, lineWidth: 2 });
            rsiChartRef.current = rsiChart; rsiSeriesRef.current = rsiSeries;
            syncCharts();
            return () => { rsiChartRef.current = null; rsiSeriesRef.current = null; rsiChart.remove(); };
        }
    }, [showRSI]);

    // Initialize MACD Chart
    useEffect(() => {
        if (showMACD && macdContainerRef.current) {
            const macdChart = createChart(macdContainerRef.current, {
                ...CHART_THEME,
                width: macdContainerRef.current.clientWidth,
                height: macdContainerRef.current.clientHeight,
                timeScale: { ...CHART_THEME.timeScale, timeVisible: true, secondsVisible: false },
            });
            const histogramSeries = macdChart.addSeries(HistogramSeries, { color: DIRECTION_COLORS.up });
            const macdSeries = macdChart.addSeries(LineSeries, { color: IND.macd, lineWidth: 2 });
            const signalSeries = macdChart.addSeries(LineSeries, { color: IND.signal, lineWidth: 2 });

            macdChartRef.current = macdChart; macdHistogramRef.current = histogramSeries;
            macdLineRef.current = macdSeries; signalLineRef.current = signalSeries;
            syncCharts();
            return () => {
                macdChartRef.current = null; macdHistogramRef.current = null; macdLineRef.current = null; signalLineRef.current = null; macdChart.remove();
            };
        }
    }, [showMACD]);

    // Manage Volume
    useEffect(() => {
        if (!chartRef.current) return;
        try {
            if (showVolume) {
                if (!volumeSeriesRef.current) {
                    volumeSeriesRef.current = chartRef.current.addSeries(HistogramSeries, {
                        color: VOLUME_COLORS.up, priceFormat: { type: 'volume' }, priceScaleId: 'volume',
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
                if (!ma7Ref.current) ma7Ref.current = chartRef.current.addSeries(LineSeries, { color: IND.ma7, lineWidth: 1, title: 'MA7' });
                if (!ma25Ref.current) ma25Ref.current = chartRef.current.addSeries(LineSeries, { color: IND.ma25, lineWidth: 1, title: 'MA25' });
                if (!ma99Ref.current) ma99Ref.current = chartRef.current.addSeries(LineSeries, { color: IND.ma99, lineWidth: 2, title: 'MA99' });
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
                if (!bbUpperRef.current) bbUpperRef.current = chartRef.current.addSeries(LineSeries, { color: IND.bbBand, lineWidth: 1 });
                if (!bbLowerRef.current) bbLowerRef.current = chartRef.current.addSeries(LineSeries, { color: IND.bbBand, lineWidth: 1 });
                if (!bbMiddleRef.current) bbMiddleRef.current = chartRef.current.addSeries(LineSeries, { color: IND.bbBasis, lineWidth: 1 });
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
        if (rsiSeriesRef.current) rsiSeriesRef.current.setData([]);
        if (bbUpperRef.current) bbUpperRef.current.setData([]);
        if (macdHistogramRef.current) macdHistogramRef.current.setData([]);
        if (volumeSeriesRef.current) volumeSeriesRef.current.setData([]);
        if (ma7Ref.current) ma7Ref.current.setData([]);
        if (ma25Ref.current) ma25Ref.current.setData([]);
        if (ma99Ref.current) ma99Ref.current.setData([]);

        setIsLoading(true); setError(null);
        let isCancelled = false;

        const fetchData = async () => {
            try {
                // Fetch generic or mocked data for stocks
                const res = await fetch(`/api/stock/history?symbol=${symbol}&limit=365`);
                if (!res.ok) throw new Error('Failed to fetch stock history');

                const data: { time: number; open: number; high: number; low: number; close: number; volume: number }[] = await res.json();

                if (isCancelled) return;
                if (!data || data.length === 0) {
                    // Check if it's likely an API Key issue
                    setError(lang === 'ko' ? '데이터가 없거나 API 키가 필요합니다. (Supabase)' : 'No data or API Key missing. (Supabase)');
                    setIsLoading(false);
                    return;
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
                            color: d.close >= d.open ? VOLUME_COLORS.up : VOLUME_COLORS.down,
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
                            if (histogram[i] !== null) h.push({ time: t, value: histogram[i]!, color: histogram[i]! >= 0 ? DIRECTION_COLORS.up : DIRECTION_COLORS.down });
                        });
                        macdLineRef.current?.setData(m); signalLineRef.current?.setData(s); macdHistogramRef.current?.setData(h);
                    }

                    setIsLoading(false);
                }
            } catch (err) {
                if (!isCancelled) { console.error(err); setError(lang === 'ko' ? '데이터 로드 실패' : 'Failed to load chart data'); setIsLoading(false); }
            }
        };
        fetchData();
        return () => { isCancelled = true; };
    }, [symbol, interval, showRSI, showBB, showMACD, showVolume, showMA]);

    return (
        <div className="w-full flex flex-col gap-2 relative">
            {(isLoading || error) && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface/70 rounded-lg backdrop-blur-sm">
                    {error ? <div className="bg-error-container p-4 rounded text-on-error-container">{error}</div> : <div className="text-primary">{lang === 'ko' ? '데이터 로딩중...' : 'Loading Data...'}</div>}
                </div>
            )}
            <div ref={chartContainerRef} className="w-full h-[300px] md:h-[450px]" />
            {showRSI && <div ref={rsiContainerRef} className="w-full h-[120px] md:h-[150px]" />}
            {showMACD && <div ref={macdContainerRef} className="w-full h-[120px] md:h-[150px]" />}
        </div>
    );
};
