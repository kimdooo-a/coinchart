'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { analyzeFractalPattern, FractalAnalysisResult } from '@/lib/fractal_engine'
import { performAnalysis, AnalysisResult } from '@/lib/analysis/orchestrator'
import { IndicatorSignal } from '@/types/probability'
import { Trade } from '@/types/backtest'

// monet-registry UI Components
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

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
import { useLanguage } from '@/context/LanguageContext'
import { TRANSLATIONS } from '@/lib/translations'

// 라우트 colocated 컴포넌트
import { AnalysisHeader } from './_components/AnalysisHeader'
import { ChartSection } from './_components/ChartSection'
import { ProbabilityConfidenceCards } from './_components/ProbabilityConfidenceCards'
import { ExplanationCard } from './_components/ExplanationCard'
import { BacktestCard } from './_components/BacktestCard'
import { PositionFractalCards } from './_components/PositionFractalCards'

export default function AnalysisPage() {
    const { lang, setLang } = useLanguage()
    const t = TRANSLATIONS[lang]

    const params = useParams()
    const router = useRouter()
    const symbol = typeof params.symbol === 'string' ? decodeURIComponent(params.symbol) : ''

    const [historyData, setHistoryData] = useState<any[]>([])
    const [avgPrice, setAvgPrice] = useState<number | undefined>(undefined)
    const [loading, setLoading] = useState(true)
    const [fractalResult, setFractalResult] = useState<FractalAnalysisResult | null>(null)
    const [currentPrice, setCurrentPrice] = useState<number | null>(null)

    // performAnalysis 결과
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
    const [userTier, setUserTier] = useState<'free' | 'pro'>('free')
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
                    const { adx, plusDI: adxPlusDI, minusDI: adxMinusDI } = calculateADX(highs, lows, closes)

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

    // ===========================================
    // RENDER: Blueprint 구조
    // Header → Chart → Analysis Grid
    // ===========================================

    return (
        <div className="min-h-screen bg-surface text-on-surface p-4 flex flex-col items-center">
            <div className="w-full max-w-6xl space-y-6">

                {/* ========== HEADER SECTION ========== */}
                <AnalysisHeader
                    symbol={symbol}
                    lang={lang}
                    setLang={setLang}
                    avgPrice={avgPrice}
                    currentPrice={currentPrice}
                    t={t}
                    onBack={() => router.back()}
                />

                {/* ========== CHART SECTION ========== */}
                <ChartSection
                    loading={loading}
                    historyData={historyData}
                    avgPrice={avgPrice}
                    symbol={symbol}
                    t={t}
                />

                {/* ========== ANALYSIS GRID ========== */}
                {historyData.length > 0 && (
                    <section className="space-y-6">

                        {/* === uiState: loading === */}
                        {loading && !analysisResult && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[...Array(4)].map((_, i) => (
                                    <Card key={i} className="bg-surface-container-lowest border-outline-variant opacity-50 relative">
                                        <CardHeader>
                                            <div className="h-6 bg-surface-container rounded animate-pulse" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-2">
                                                <div className="h-12 bg-surface-container rounded animate-pulse" />
                                                <div className="h-4 bg-surface-container rounded animate-pulse w-2/3" />
                                            </div>
                                        </CardContent>
                                        <Badge variant="secondary" className="absolute top-4 right-4">
                                            {lang === 'ko' ? '분석 중...' : 'Analyzing...'}
                                        </Badge>
                                    </Card>
                                ))}
                            </div>
                        )}

                        {/* === uiState: error === */}
                        {error && (
                            <Card className="bg-surface-container-lowest border-red-300">
                                <CardHeader>
                                    <Badge variant="destructive">{lang === 'ko' ? '오류 발생' : 'Error'}</Badge>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-on-surface-variant">{error}</p>
                                </CardContent>
                                <CardFooter>
                                    <Button variant="outline" onClick={() => window.location.reload()}>
                                        {lang === 'ko' ? '다시 시도' : 'Retry'}
                                    </Button>
                                </CardFooter>
                            </Card>
                        )}

                        {/* === uiState: insufficient === */}
                        {!error && analysisResult && analysisResult.uiState === 'insufficient' && (
                            <Card className="bg-surface-container-lowest border-orange-300">
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle className="text-lg">{lang === 'ko' ? '데이터 부족' : 'Insufficient Data'}</CardTitle>
                                    <Badge variant="destructive">{lang === 'ko' ? '분석 불가' : 'Cannot Analyze'}</Badge>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription className="mb-4">
                                        {lang === 'ko'
                                            ? '분석을 수행하려면 최소 3개 이상의 지표 신호가 필요합니다.'
                                            : 'At least 3 indicator signals are required for analysis.'}
                                    </CardDescription>
                                    {analysisResult.reasons && analysisResult.reasons.length > 0 && (
                                        <div className="space-y-2">
                                            <Label className="text-orange-600">{lang === 'ko' ? '상세 사유' : 'Details'}</Label>
                                            <ul className="text-sm text-on-surface-variant space-y-1">
                                                {analysisResult.reasons.map((reason, idx) => (
                                                    <li key={idx} className="flex items-start gap-2">
                                                        <span className="text-orange-600">•</span>
                                                        <span>{reason}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter>
                                    <Button variant="outline" onClick={() => router.push('/analysis')}>
                                        {lang === 'ko' ? '다른 심볼 선택' : 'Choose Another Symbol'}
                                    </Button>
                                </CardFooter>
                            </Card>
                        )}

                        {/* === uiState: ok or pro-locked === */}
                        {!error && analysisResult && (analysisResult.uiState === 'ok' || analysisResult.uiState === 'pro-locked') && (
                            <>
                                <ProbabilityConfidenceCards analysisResult={analysisResult} lang={lang} />
                                <ExplanationCard analysisResult={analysisResult} lang={lang} />
                                <BacktestCard analysisResult={analysisResult} userTier={userTier} lang={lang} />
                                <PositionFractalCards
                                    avgPrice={avgPrice}
                                    historyData={historyData}
                                    fractalResult={fractalResult}
                                    t={t}
                                    lang={lang}
                                />
                            </>
                        )}
                    </section>
                )}
            </div>
        </div>
    )
}
