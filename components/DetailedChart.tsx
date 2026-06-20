'use client'

import React, { useEffect, useRef } from 'react'
import { createChart, IChartApi, CandlestickSeries, LineSeries } from 'lightweight-charts'
import { getChartTheme, getCandleColors, getIndicatorColors } from '@/lib/chart/theme'
import { calculateSMA, calculateBollingerBands } from '@/lib/indicators'

// 라이트 테마 + 한국식(빨↑/파↓) 캔들 — lib/chart/theme.ts SSOT (R1/T08)
const CHART_THEME = getChartTheme('light')
const CANDLE_COLORS = getCandleColors('kr')
// 평단가 참조선 색(SSOT) — brand primary 정렬(R7-3)
const IND = getIndicatorColors()

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
    /** 이동평균선(MA7/25/99) 오버레이 — 가격 페인 공유 */
    showMA?: boolean
    /** 볼린저밴드(상·중·하) 오버레이 — 가격 페인 공유 */
    showBB?: boolean
}

export const DetailedChart = ({ data, avgPrice, symbol, showMA = false, showBB = false }: DetailedChartProps) => {
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

        // 지표 오버레이 — 가격 페인 공유(MA·BB). 색은 lib/chart/theme.ts SSOT(IND) 식별색.
        const closes = data.map(d => d.close)

        if (showMA) {
            const maDefs = [
                { period: 7, color: IND.ma7, width: 1, title: 'MA7' },
                { period: 25, color: IND.ma25, width: 1, title: 'MA25' },
                { period: 99, color: IND.ma99, width: 2, title: 'MA99' },
            ] as const
            for (const def of maDefs) {
                const sma = calculateSMA(closes, def.period)
                const line = chart.addSeries(LineSeries, {
                    color: def.color, lineWidth: def.width, title: def.title,
                    priceLineVisible: false, lastValueVisible: false,
                })
                const pts: { time: string; value: number }[] = []
                data.forEach((d, i) => { if (sma[i] !== null) pts.push({ time: d.time, value: sma[i]! }) })
                line.setData(pts)
            }
        }

        if (showBB) {
            const bb = calculateBollingerBands(closes)
            const upper: { time: string; value: number }[] = []
            const lower: { time: string; value: number }[] = []
            const middle: { time: string; value: number }[] = []
            data.forEach((d, i) => {
                const band = bb[i]
                if (band && !isNaN(band.upper) && !isNaN(band.lower) && !isNaN(band.middle)) {
                    upper.push({ time: d.time, value: band.upper })
                    lower.push({ time: d.time, value: band.lower })
                    middle.push({ time: d.time, value: band.middle })
                }
            })
            const mkBand = (color: string, width: 1 | 2) => chart.addSeries(LineSeries, {
                color, lineWidth: width, priceLineVisible: false, lastValueVisible: false,
            })
            mkBand(IND.bbBand, 1).setData(upper)
            mkBand(IND.bbBand, 1).setData(lower)
            mkBand(IND.bbBasis, 1).setData(middle)
        }

        // Avg Price Line (v5 Syntax)
        if (avgPrice) {
            const avgLine = chart.addSeries(LineSeries, {
                color: IND.avgPrice,
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
    }, [data, avgPrice, showMA, showBB])

    return (
        <div className="w-full h-full relative">
            <div className="absolute top-4 left-4 z-10 bg-surface/80 p-2 rounded backdrop-blur-sm border border-outline-variant">
                <h3 className="text-on-surface font-bold">{symbol} Analysis</h3>
                <p className="text-xs text-on-surface-variant">Daily Candles (3 Years)</p>
            </div>
            <div ref={chartContainerRef} className="w-full h-full rounded-xl overflow-hidden border border-outline-variant shadow-2xl" />
        </div>
    )
}
