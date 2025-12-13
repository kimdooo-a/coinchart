'use client'

import React, { useEffect, useRef } from 'react'
import { createChart, ColorType, IChartApi, CandlestickSeries, LineSeries } from 'lightweight-charts'

interface ChartData {
    time: string
    open: number
    high: number
    low: number
    close: number
}

interface DetailedChartProps {
    data: ChartData[]
    avgPrice?: number
    symbol: string
}

export const DetailedChart = ({ data, avgPrice, symbol }: DetailedChartProps) => {
    const chartContainerRef = useRef<HTMLDivElement>(null)
    const chartRef = useRef<IChartApi | null>(null)

    useEffect(() => {
        if (!chartContainerRef.current) return

        const handleResize = () => {
            chartRef.current?.applyOptions({ width: chartContainerRef.current!.clientWidth })
        }

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: '#111' },
                textColor: '#DDD',
            },
            width: chartContainerRef.current.clientWidth,
            height: 500,
            grid: {
                vertLines: { color: '#333' },
                horzLines: { color: '#333' },
            },
            rightPriceScale: {
                borderColor: '#444',
            },
            timeScale: {
                borderColor: '#444',
            },
        })

        chartRef.current = chart

        // Candlestick Series (v5 Syntax)
        const candlestickSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#26a69a',
            downColor: '#ef5350',
            borderVisible: false,
            wickUpColor: '#26a69a',
            wickDownColor: '#ef5350',
        })

        candlestickSeries.setData(data)

        // Avg Price Line (v5 Syntax)
        if (avgPrice) {
            const avgLine = chart.addSeries(LineSeries, {
                color: '#2962FF',
                lineWidth: 2,
                lineStyle: 1, // Dotted
                title: 'Avg Buy Price',
            })
            // Create a flat line across the data range
            const lineData = data.map(d => ({ time: d.time, value: avgPrice }))
            avgLine.setData(lineData)
        }

        // Fit Content
        chart.timeScale().fitContent()

        window.addEventListener('resize', handleResize)

        return () => {
            window.removeEventListener('resize', handleResize)
            chart.remove()
        }
    }, [data, avgPrice])

    return (
        <div className="w-full relative">
            <div className="absolute top-4 left-4 z-10 bg-black/50 p-2 rounded backdrop-blur-sm border border-gray-700">
                <h3 className="text-white font-bold">{symbol} Analysis</h3>
                <p className="text-xs text-gray-400">Daily Candles (3 Years)</p>
            </div>
            <div ref={chartContainerRef} className="w-full rounded-xl overflow-hidden border border-gray-800 shadow-2xl" />
        </div>
    )
}
