'use client'

import React, { useEffect, useRef } from 'react'
import { createChart, IChartApi, CandlestickSeries, LineSeries } from 'lightweight-charts'
import { getChartTheme, getCandleColors } from '@/lib/chart/theme'

// 라이트 테마 + 한국식(빨↑/파↓) 캔들 — lib/chart/theme.ts SSOT (R1/T08)
const CHART_THEME = getChartTheme('light')
const CANDLE_COLORS = getCandleColors('kr')

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
            if (chartContainerRef.current && chartRef.current) {
                chartRef.current.applyOptions({
                    width: chartContainerRef.current.clientWidth,
                    height: chartContainerRef.current.clientHeight
                })
            }
        }

        const chart = createChart(chartContainerRef.current, {
            ...CHART_THEME,
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight, // Use container height
        })

        chartRef.current = chart

        // Candlestick Series (v5 Syntax)
        const candlestickSeries = chart.addSeries(CandlestickSeries, {
            ...CANDLE_COLORS,
            borderVisible: false,
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
        <div className="w-full h-full relative">
            <div className="absolute top-4 left-4 z-10 bg-black/50 p-2 rounded backdrop-blur-sm border border-gray-700">
                <h3 className="text-white font-bold">{symbol} Analysis</h3>
                <p className="text-xs text-gray-400">Daily Candles (3 Years)</p>
            </div>
            <div ref={chartContainerRef} className="w-full h-full rounded-xl overflow-hidden border border-gray-800 shadow-2xl" />
        </div>
    )
}
