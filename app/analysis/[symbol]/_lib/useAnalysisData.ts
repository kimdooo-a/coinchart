// analysis/[symbol] 데이터 훅
// page.tsx의 데이터 페칭·상태 관리·지표 계산·프랙탈 분석 로직을 route-local로 분리.
// 로직·useEffect 의존성·ref 가드 전부 원본 그대로 보존 (동작 불변).

import { useEffect, useRef, useState } from 'react'
import type { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { analyzeFractalPattern, FractalAnalysisResult } from '@/lib/fractal_engine'
import { performAnalysis, AnalysisResult } from '@/lib/analysis/orchestrator'
import { IndicatorSignal } from '@/types/probability'
import { Trade } from '@/types/backtest'
import type { Candle } from './types'
import {
    calculateRSI, analyzeRSI,
    calculateSMA, analyzeTrend,
    calculateBollingerBands,
    calculateMACD,
    calculateStochastic,
    calculateCCI,
    calculateWilliamsR,
    calculateATR,
    calculateADX
} from '@/lib/indicators'

type Router = ReturnType<typeof useRouter>

export interface UseAnalysisData {
    historyData: Candle[]
    avgPrice: number | undefined
    loading: boolean
    fractalResult: FractalAnalysisResult | null
    currentPrice: number | null
    analysisResult: AnalysisResult | null
    userTier: 'free' | 'pro'
    error: string | null
    getPriceColor: () => string
}

export function useAnalysisData(symbol: string, router: Router): UseAnalysisData {
    const [historyData, setHistoryData] = useState<Candle[]>([])
    const [avgPrice, setAvgPrice] = useState<number | undefined>(undefined)
    const [loading, setLoading] = useState(true)
    const [fractalResult, setFractalResult] = useState<FractalAnalysisResult | null>(null)
    const [currentPrice, setCurrentPrice] = useState<number | null>(null)

    // performAnalysis 결과
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
    // TODO(R15+): 실등급 연동 보류 — gates.ts isDisabledProGate + Supabase 세션 기반 tier 해석 필요. 현재 free 고정(pro-gate 제품결정 대기).
    const userTier: 'free' | 'pro' = 'free'
    const [error, setError] = useState<string | null>(null)

    const supabase = createClient()

    // STEP 4-4A: 중복 호출 방지 - useRef로 fetch 실행 상태 추적
    const fetchInProgressRef = useRef<boolean>(false)
    const analysisExecutedRef = useRef<boolean>(false)
    const lastSymbolRef = useRef<string>('')

    useEffect(() => {
        if (!symbol) return

        // Guard: 이미 다른 symbol로 fetch가 진행 중이면 중단
        if (fetchInProgressRef.current && lastSymbolRef.current === symbol) {
            return
        }

        // Guard: React StrictMode로 인한 2번 실행 방지
        if (lastSymbolRef.current === symbol && analysisExecutedRef.current) {
            return
        }

        // 마커 설정
        fetchInProgressRef.current = true
        lastSymbolRef.current = symbol
        analysisExecutedRef.current = false

        // 1. Fetch Realtime Price
        const fetchRealtimePrice = async () => {
            try {
                const res = await fetch(`/api/price?symbol=${symbol}`)
                const data = await res.json()
                if (data.price) {
                    setCurrentPrice(parseFloat(data.price))
                }
            } catch (e) {
                console.error("Failed to fetch realtime price", e)
            }
        }

        fetchRealtimePrice()
        const interval = setInterval(fetchRealtimePrice, 5000)

        const fetchData = async () => {
            try {
                setError(null)
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    router.replace('/portfolio')
                    fetchInProgressRef.current = false
                    return
                }

                const { data: prices, error: priceError } = await supabase
                    .from('market_prices')
                    .select('date, open, high, low, close, volume')
                    .eq('symbol', symbol.toUpperCase())
                    .order('date', { ascending: false })
                    .limit(990)

                if (priceError) console.error(priceError)

                const formattedData = (prices || []).map(p => ({
                    time: p.date,
                    open: p.open,
                    high: p.high,
                    low: p.low,
                    close: p.close,
                    volume: p.volume
                })).reverse()

                setHistoryData(formattedData)

                if (formattedData.length > 50 && !analysisExecutedRef.current) {
                    const closes = formattedData.map(d => d.close)
                    const highs = formattedData.map(d => d.high)
                    const lows = formattedData.map(d => d.low)
                    const lastClose = closes[closes.length - 1]
                    const now = Date.now()

                    const rsiValues = calculateRSI(closes, 14)
                    const sma20Values = calculateSMA(closes, 20)
                    const bands = calculateBollingerBands(closes, 20, 2)
                    const macd = calculateMACD(closes)
                    const stoch = calculateStochastic(highs, lows, closes)
                    const cci = calculateCCI(highs, lows, closes)
                    const williams = calculateWilliamsR(highs, lows, closes)
                    const atr = calculateATR(highs, lows, closes)
                    const { adx } = calculateADX(highs, lows, closes)

                    const signals: IndicatorSignal[] = []

                    if (rsiValues.length > 0) {
                        const lastRsi = rsiValues[rsiValues.length - 1]
                        const rsiAnalysis = analyzeRSI(lastRsi)
                        let signal: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL'
                        if (rsiAnalysis.signal === 'BUY') signal = 'BUY'
                        else if (rsiAnalysis.signal === 'SELL') signal = 'SELL'
                        signals.push({
                            name: 'RSI',
                            signal,
                            strength: Math.abs(lastRsi - 50) / 50,
                            timestamp: now
                        })
                    }

                    if (sma20Values.length > 0) {
                        const lastSma = sma20Values[sma20Values.length - 1]
                        const trendAnalysis = analyzeTrend(lastClose, lastSma)
                        signals.push({
                            name: 'MA',
                            signal: trendAnalysis.signal === 'BUY' ? 'BUY' : 'SELL',
                            strength: Math.abs(lastClose - lastSma) / lastClose,
                            timestamp: now
                        })
                    }

                    if (macd.macd.length > 0) {
                        const histogram = macd.histogram[macd.histogram.length - 1]
                        signals.push({
                            name: 'MACD',
                            signal: histogram > 0 ? 'BUY' : histogram < 0 ? 'SELL' : 'NEUTRAL',
                            strength: Math.abs(histogram) / (Math.abs(histogram) + 1),
                            timestamp: now
                        })
                    }

                    if (stoch.k.length > 0) {
                        const k = stoch.k[stoch.k.length - 1]
                        let signal: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL'
                        if (k < 20) signal = 'BUY'
                        else if (k > 80) signal = 'SELL'
                        signals.push({
                            name: 'Stochastic',
                            signal,
                            strength: k < 20 || k > 80 ? 0.8 : 0.3,
                            timestamp: now
                        })
                    }

                    if (cci.length > 0) {
                        const lastCci = cci[cci.length - 1]
                        let signal: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL'
                        if (lastCci < -100) signal = 'BUY'
                        else if (lastCci > 100) signal = 'SELL'
                        signals.push({
                            name: 'CCI',
                            signal,
                            strength: Math.abs(lastCci) / 200,
                            timestamp: now
                        })
                    }

                    if (williams.length > 0) {
                        const lastWilliams = williams[williams.length - 1]
                        let signal: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL'
                        if (lastWilliams < -80) signal = 'BUY'
                        else if (lastWilliams > -20) signal = 'SELL'
                        signals.push({
                            name: 'Williams',
                            signal,
                            strength: lastWilliams < -80 || lastWilliams > -20 ? 0.8 : 0.3,
                            timestamp: now
                        })
                    }

                    const atrValue = atr.length > 0 ? atr[atr.length - 1] : undefined
                    const adxValue = adx.length > 0 ? adx[adx.length - 1] : undefined
                    const bbWidth = bands.length > 0 ? (bands[bands.length - 1].upper - bands[bands.length - 1].lower) / bands[bands.length - 1].middle : undefined

                    const { data: trades } = await supabase
                        .from('trades')
                        .select('*')
                        .eq('user_id', user.id)
                        .eq('symbol', symbol.toUpperCase())

                    const backtestTrades: Trade[] = (trades || []).map((t, idx) => ({
                        id: t.id || idx.toString(),
                        entryPrice: t.price,
                        exitPrice: t.price,
                        pnl: t.side === 'BUY' ? 0 : 0,
                        pnlPercent: 0,
                        entryTime: new Date(t.executed_at).getTime(),
                        exitTime: new Date(t.executed_at).getTime(),
                        direction: t.side === 'BUY' ? 'LONG' : 'SHORT'
                    }))

                    if (!analysisExecutedRef.current) {
                        analysisExecutedRef.current = true
                        const result = performAnalysis({
                            symbol,
                            timeframe: '1d',
                            signals,
                            adxValue,
                            atrValue,
                            bbWidth,
                            trades: backtestTrades.length >= 30 ? backtestTrades : undefined,
                            userTier,
                            dataAgeSeconds: 0,
                            sampleSize: signals.length,
                            volumeRatio: 1.0,
                            historicalAccuracy: 0.8,
                            dataSource: 'supabase'
                        })
                        setAnalysisResult(result)
                    }

                    if (trades && trades.length > 0) {
                        let totalQty = 0
                        let totalCost = 0
                        trades.sort((a, b) => new Date(a.executed_at).getTime() - new Date(b.executed_at).getTime())
                        trades.forEach(t => {
                            if (t.side === 'BUY') {
                                totalQty += t.qty
                                totalCost += (t.qty * t.price)
                            } else {
                                if (totalQty > 0) {
                                    const avg = totalCost / totalQty
                                    totalQty -= t.qty
                                    totalCost -= (avg * t.qty)
                                }
                            }
                        })
                        if (totalQty > 0) {
                            setAvgPrice(totalCost / totalQty)
                        }
                    }

                    const engineData = formattedData.map(d => ({
                        time: new Date(d.time).getTime(),
                        open: d.open,
                        high: d.high,
                        low: d.low,
                        close: d.close,
                        volume: d.volume
                    }))
                    const analysis = await analyzeFractalPattern(symbol, engineData, 14, 3)
                    setFractalResult(analysis)
                }
            } catch (err) {
                console.error("Analysis error:", err)
                setError(err instanceof Error ? err.message : 'Unknown error occurred')
            } finally {
                setLoading(false)
                fetchInProgressRef.current = false
            }
        }

        fetchData()
        return () => {
            clearInterval(interval)
            if (lastSymbolRef.current !== symbol) {
                fetchInProgressRef.current = false
                analysisExecutedRef.current = false
            }
        }
    }, [symbol, router])

    const getPriceColor = () => {
        if (!currentPrice || !avgPrice) return 'text-on-surface'
        return currentPrice >= avgPrice ? 'text-green-500' : 'text-red-500'
    }

    return {
        historyData,
        avgPrice,
        loading,
        fractalResult,
        currentPrice,
        analysisResult,
        userTier,
        error,
        getPriceColor,
    }
}
