"use client";

import { createChart, ColorType, CrosshairMode, IChartApi, CandlestickSeries } from "lightweight-charts";
import React, { useEffect, useRef } from "react";
import { subscribeToKlines, CandleData } from "@/lib/api/binance";

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
        { label: 'BCH', value: 'BCH' },
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

        let isMounted = true;
        let wsCleanup: (() => void) | undefined;

        const fetchData = async () => {
            try {
                // STEP 4-4B: API Route 프록시 + TTL 캐시 사용 (Binance 직접 호출 제거)
                const res = await fetch(`/api/klines?symbol=${symbol}&interval=1d&limit=365`);
                if (!res.ok) {
                    throw new Error(`API Route error: ${res.statusText}`);
                }
                const klines = await res.json() as CandleData[];

                if (!isMounted) return;

                const candleData = klines.map((k) => ({
                    time: k.time as any,
                    open: k.open,
                    high: k.high,
                    low: k.low,
                    close: k.close,
                }));

                candlestickSeries.setData(candleData);

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
                                    ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(255,87,51,0.5)] scale-105'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
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
