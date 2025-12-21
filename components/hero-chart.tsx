"use client";

import { createChart, ColorType, CrosshairMode, IChartApi, AreaSeries, CandlestickSeries } from "lightweight-charts";
import React, { useEffect, useRef } from "react";
import { getKlines, subscribeToKlines, CandleData } from "@/lib/api/binance";

export const HeroChart = () => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);

    // State for active symbol
    const [symbol, setSymbol] = React.useState('BTCUSDT');

    const coins = [
        { label: 'BTC', value: 'BTCUSDT' },
        { label: 'ETH', value: 'ETHUSDT' },
        { label: 'XRP', value: 'XRPUSDT' },
        { label: 'SOL', value: 'SOLUSDT' },
        { label: 'BCH', value: 'BCHUSDT' },
        { label: 'DOGE', value: 'DOGEUSDT' },
    ];

    useEffect(() => {
        if (!chartContainerRef.current) return;

        const handleResize = () => {
            if (chartContainerRef.current && chartRef.current) {
                chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: "transparent" },
                textColor: "rgba(255, 255, 255, 0.5)",
            },
            grid: {
                vertLines: { color: "rgba(255, 255, 255, 0.05)" },
                horzLines: { color: "rgba(255, 255, 255, 0.05)" },
            },
            crosshair: {
                mode: CrosshairMode.Normal,
            },
            rightPriceScale: {
                borderColor: "rgba(255, 255, 255, 0.1)",
            },
            timeScale: {
                borderColor: "rgba(255, 255, 255, 0.1)",
                timeVisible: true,
                secondsVisible: false,
            },
            height: 400,
        });

        chartRef.current = chart;

        const candlestickSeries = chart.addSeries(CandlestickSeries, {
            upColor: "#26a69a",
            downColor: "#ef5350",
            borderVisible: false,
            wickUpColor: "#26a69a",
            wickDownColor: "#ef5350",
        });

        const areaSeries = chart.addSeries(AreaSeries, {
            topColor: "rgba(38, 166, 154, 0.56)",
            bottomColor: "rgba(38, 166, 154, 0.04)",
            lineColor: "rgba(38, 166, 154, 1)",
            lineWidth: 2,
        });

        let isMounted = true;
        let wsCleanup: (() => void) | undefined;

        const fetchData = async () => {
            try {
                const klines = await getKlines(symbol, '1d', 365);

                if (!isMounted) return;

                const candleData = klines.map((k) => ({
                    time: k.time as any,
                    open: k.open,
                    high: k.high,
                    low: k.low,
                    close: k.close,
                }));

                const areaData = klines.map((k) => ({
                    time: k.time as any,
                    value: k.close,
                }));

                candlestickSeries.setData(candleData);
                areaSeries.setData(areaData);

                chart.timeScale().fitContent();

                if (isMounted) {
                    wsCleanup = subscribeToKlines(symbol, '1m', (data) => {
                        if (!isMounted || !chartRef.current) return;

                        candlestickSeries.update({
                            time: data.time as any,
                            open: data.open,
                            high: data.high,
                            low: data.low,
                            close: data.close,
                        });
                        areaSeries.update({ time: data.time as any, value: data.close });
                    });
                }
            } catch (error) {
                console.error("Failed to fetch Binance data:", error);
            }
        };

        fetchData();

        window.addEventListener("resize", handleResize);

        return () => {
            isMounted = false;
            window.removeEventListener("resize", handleResize);
            if (wsCleanup) wsCleanup();
            chart.remove();
            chartRef.current = null;
        };
    }, [symbol]); // Re-run effect when symbol changes

    return (
        <div className="w-full h-full p-4 relative flex flex-col">
            {/* Coin Selector Panel */}
            <div className="absolute top-6 left-8 z-20 flex flex-col gap-4">
                {/* Live Status Badge */}
                <div className="flex items-center gap-2 pointer-events-none mb-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-xs font-mono text-green-400">LIVE BINANCE DATA</span>
                </div>

                {/* Coin Buttons */}
                <div className="flex flex-wrap gap-2 p-1 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 w-fit">
                    {coins.map((coin) => (
                        <button
                            key={coin.value}
                            onClick={() => setSymbol(coin.value)}
                            className={`
                                px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300
                                ${symbol === coin.value
                                    ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)] scale-105'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }
                            `}
                        >
                            {coin.label}
                        </button>
                    ))}
                </div>

                {/* Active Symbol Display */}
                <div className="pointer-events-none mt-2">
                    <div className="text-3xl font-bold text-white tracking-tighter drop-shadow-lg">
                        {symbol.replace('USDT', '')}/USDT
                    </div>
                </div>
            </div>

            <div ref={chartContainerRef} className="w-full h-full" />
        </div>
    );
};
