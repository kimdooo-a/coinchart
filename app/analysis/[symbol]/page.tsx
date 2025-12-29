'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DetailedChart } from '@/components/DetailedChart'
import { analyzeFractalPattern, FractalAnalysisResult } from '@/lib/fractal_engine'
import { performAnalysis, AnalysisResult } from '@/lib/analysis/orchestrator'
import { IndicatorSignal } from '@/types/probability'
import { Trade } from '@/types/backtest'

// monet-registry UI Components
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
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
import Link from 'next/link'

// Badge variant helper functions
function getProbabilityBadgeVariant(probability: number): 'default' | 'secondary' | 'destructive' {
    if (probability >= 60) return 'default'
    if (probability <= 40) return 'destructive'
    return 'secondary'
}

function getConfidenceBadgeVariant(grade: string): 'default' | 'secondary' | 'destructive' {
    if (grade === 'A' || grade === 'B') return 'default'
    if (grade === 'C') return 'secondary'
    return 'destructive'
}

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
                    const adx = calculateADX(highs, lows, closes)

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
        if (!currentPrice || !avgPrice) return 'text-white'
        return currentPrice >= avgPrice ? 'text-green-500' : 'text-red-500'
    }

    // ===========================================
    // RENDER: Blueprint 구조
    // Header → Chart → Analysis Grid
    // ===========================================

    return (
        <div className="min-h-screen bg-gray-950 text-white p-4 flex flex-col items-center">
            <div className="w-full max-w-6xl space-y-6">

                {/* ========== HEADER SECTION ========== */}
                <section className="space-y-4">
                    {/* Navigation Row */}
                    <div className="flex justify-between items-center">
                        <button
                            onClick={() => router.back()}
                            className="text-gray-400 hover:text-white flex items-center gap-2 text-sm"
                        >
                            &larr; {t.common.back}
                        </button>

                        {/* Language Toggle */}
                        <div className="flex gap-1">
                            <Badge
                                variant={lang === 'ko' ? 'default' : 'outline'}
                                className="cursor-pointer"
                                onClick={() => setLang('ko')}
                            >
                                KR
                            </Badge>
                            <Badge
                                variant={lang === 'en' ? 'default' : 'outline'}
                                className="cursor-pointer"
                                onClick={() => setLang('en')}
                            >
                                EN
                            </Badge>
                        </div>
                    </div>

                    {/* Symbol Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                                {symbol} {t.analysis.title}
                            </h1>
                            {avgPrice && (
                                <Badge variant="outline" className="text-blue-400 border-blue-500/30">
                                    {t.analysis.myAvg}: ${avgPrice.toLocaleString()}
                                </Badge>
                            )}
                            <Badge variant="outline">1D</Badge>
                        </div>
                        {currentPrice && (
                            <div className="text-right">
                                <Label className="text-gray-500 text-xs">{t.analysis.currentPrice}</Label>
                                <div className={`text-4xl font-black ${getPriceColor()}`}>
                                    ${currentPrice.toLocaleString()}
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* ========== CHART SECTION ========== */}
                <section>
                    {loading ? (
                        <Card className="bg-gray-900 border-gray-800">
                            <CardContent className="h-[500px] flex items-center justify-center">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                    <Badge variant="secondary">{t.common.loading}</Badge>
                                </div>
                            </CardContent>
                        </Card>
                    ) : historyData.length > 0 ? (
                        <div className="h-[500px] w-full">
                            <DetailedChart
                                data={historyData}
                                avgPrice={avgPrice}
                                symbol={symbol}
                            />
                        </div>
                    ) : (
                        <Card className="bg-gray-900 border-gray-800">
                            <CardContent className="p-10 text-center">
                                <p className="text-gray-400">{t.analysis.notSupported}</p>
                                <p className="text-xs text-gray-600 mt-2">{t.analysis.noHistoryDesc}</p>
                            </CardContent>
                        </Card>
                    )}
                </section>

                {/* ========== ANALYSIS GRID ========== */}
                {historyData.length > 0 && (
                    <section className="space-y-6">

                        {/* === uiState: loading === */}
                        {loading && !analysisResult && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[...Array(4)].map((_, i) => (
                                    <Card key={i} className="bg-gray-900 border-gray-800 opacity-50 relative">
                                        <CardHeader>
                                            <div className="h-6 bg-gray-800 rounded animate-pulse" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-2">
                                                <div className="h-12 bg-gray-800 rounded animate-pulse" />
                                                <div className="h-4 bg-gray-800 rounded animate-pulse w-2/3" />
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
                            <Card className="bg-gray-900 border-red-800">
                                <CardHeader>
                                    <Badge variant="destructive">{lang === 'ko' ? '오류 발생' : 'Error'}</Badge>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-400">{error}</p>
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
                            <Card className="bg-gray-900 border-orange-800">
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
                                            <Label className="text-orange-400">{lang === 'ko' ? '상세 사유' : 'Details'}</Label>
                                            <ul className="text-sm text-gray-400 space-y-1">
                                                {analysisResult.reasons.map((reason, idx) => (
                                                    <li key={idx} className="flex items-start gap-2">
                                                        <span className="text-orange-400">•</span>
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
                                {/* Probability & Confidence Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Probability Card */}
                                    <Card className="bg-gray-900 border-gray-800">
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                                                {lang === 'ko' ? '상승 확률' : 'Rise Probability'}
                                            </CardTitle>
                                            <Badge variant={getProbabilityBadgeVariant(analysisResult.probability.probability)}>
                                                {analysisResult.probability.direction === 'UP' ? '↑ UP' :
                                                 analysisResult.probability.direction === 'DOWN' ? '↓ DOWN' : '↔ SIDEWAYS'}
                                            </Badge>
                                        </CardHeader>
                                        <CardContent>
                                            <div className={`text-5xl font-black ${
                                                analysisResult.probability.probability >= 60 ? 'text-green-400' :
                                                analysisResult.probability.probability <= 40 ? 'text-red-400' : 'text-gray-400'
                                            }`}>
                                                {analysisResult.probability.probability}%
                                            </div>
                                            <CardDescription className="mt-2">
                                                Regime: {analysisResult.probability.regime}
                                            </CardDescription>
                                        </CardContent>
                                    </Card>

                                    {/* Confidence Card */}
                                    <Card className="bg-gray-900 border-gray-800">
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                                                {lang === 'ko' ? '신뢰도 등급' : 'Confidence Grade'}
                                            </CardTitle>
                                            <Badge variant={getConfidenceBadgeVariant(analysisResult.confidence.grade)}>
                                                Grade {analysisResult.confidence.grade}
                                            </Badge>
                                        </CardHeader>
                                        <CardContent>
                                            <div className={`text-5xl font-black ${
                                                analysisResult.confidence.grade === 'A' ? 'text-green-400' :
                                                analysisResult.confidence.grade === 'B' ? 'text-blue-400' :
                                                analysisResult.confidence.grade === 'C' ? 'text-yellow-400' :
                                                analysisResult.confidence.grade === 'D' ? 'text-orange-400' : 'text-red-400'
                                            }`}>
                                                {analysisResult.confidence.grade}
                                            </div>
                                            <CardDescription className="mt-2">
                                                Score: {analysisResult.confidence.score}/100 |
                                                {lang === 'ko' ? ' 샘플' : ' Sample'}: {analysisResult.confidence.sampleSize || 'N/A'}
                                            </CardDescription>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Explanation Card - 3 Column Grid */}
                                <Card className="bg-gray-900 border-gray-800">
                                    <CardHeader>
                                        <CardTitle className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                                            {analysisResult.explanation.title}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            {/* Evidence Column */}
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1 h-4 bg-blue-500 rounded" />
                                                    <Label className="text-blue-400 font-semibold">
                                                        {lang === 'ko' ? '근거' : 'Evidence'}
                                                    </Label>
                                                </div>
                                                <ul className="space-y-2 text-gray-300 text-sm">
                                                    {analysisResult.explanation.sections.evidence
                                                        .split(/[。.]/)
                                                        .filter((s: string) => s.trim().length > 0)
                                                        .map((sentence: string, idx: number) => (
                                                            <li key={idx} className="flex items-start gap-2">
                                                                <span className="text-blue-400 mt-0.5">•</span>
                                                                <span>{sentence.trim()}</span>
                                                            </li>
                                                        ))}
                                                </ul>
                                            </div>

                                            <Separator orientation="vertical" className="hidden md:block bg-gray-700 mx-auto" />

                                            {/* Risk Column */}
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1 h-4 bg-orange-500 rounded" />
                                                    <Label className="text-orange-400 font-semibold">
                                                        {lang === 'ko' ? '위험' : 'Risk'}
                                                    </Label>
                                                </div>
                                                <ul className="space-y-2 text-gray-300 text-sm">
                                                    {analysisResult.explanation.sections.risk
                                                        .split(/[。.]/)
                                                        .filter((s: string) => s.trim().length > 0)
                                                        .map((sentence: string, idx: number) => (
                                                            <li key={idx} className="flex items-start gap-2">
                                                                <span className="text-orange-400 mt-0.5">•</span>
                                                                <span>{sentence.trim()}</span>
                                                            </li>
                                                        ))}
                                                </ul>
                                            </div>

                                            <Separator orientation="vertical" className="hidden md:block bg-gray-700 mx-auto" />

                                            {/* Watch Column */}
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1 h-4 bg-purple-500 rounded" />
                                                    <Label className="text-purple-400 font-semibold">
                                                        {lang === 'ko' ? '관찰' : 'Watch'}
                                                    </Label>
                                                </div>
                                                <ul className="space-y-2 text-gray-300 text-sm">
                                                    {analysisResult.explanation.sections.watch
                                                        .split(/[。.]/)
                                                        .filter((s: string) => s.trim().length > 0)
                                                        .map((sentence: string, idx: number) => (
                                                            <li key={idx} className="flex items-start gap-2">
                                                                <span className="text-purple-400 mt-0.5">•</span>
                                                                <span>{sentence.trim()}</span>
                                                            </li>
                                                        ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Backtest Card (PRO Gate) */}
                                {analysisResult.backtest && (
                                    <Card className="bg-gray-900 border-gray-800 relative overflow-hidden">
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                            <CardTitle className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                                                {lang === 'ko' ? '백테스트 결과' : 'Backtest Results'}
                                            </CardTitle>
                                            {userTier === 'free' && (
                                                <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                                                    PRO
                                                </Badge>
                                            )}
                                        </CardHeader>

                                        {analysisResult.backtest.status === 'insufficient' ? (
                                            <CardContent>
                                                <div className="text-center py-4">
                                                    <Badge variant="destructive" className="mb-2">
                                                        {lang === 'ko' ? '데이터 부족' : 'Insufficient Data'}
                                                    </Badge>
                                                    <p className="text-gray-500 text-sm">
                                                        {lang === 'ko' ? '최소 30개 거래가 필요합니다.' : 'Minimum 30 trades required.'}
                                                    </p>
                                                </div>
                                            </CardContent>
                                        ) : userTier === 'free' ? (
                                            <>
                                                <CardContent className="blur-sm pointer-events-none">
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                        <div>
                                                            <Label className="text-gray-500">{lang === 'ko' ? '승률' : 'Win Rate'}</Label>
                                                            <div className="text-2xl font-bold text-white">--.--%</div>
                                                        </div>
                                                        <div>
                                                            <Label className="text-gray-500">{lang === 'ko' ? '손익비' : 'Profit Factor'}</Label>
                                                            <div className="text-2xl font-bold text-white">--.--</div>
                                                        </div>
                                                        <div>
                                                            <Label className="text-gray-500">{lang === 'ko' ? '최대 낙폭' : 'Max DD'}</Label>
                                                            <div className="text-2xl font-bold text-white">--.--%</div>
                                                        </div>
                                                        <div>
                                                            <Label className="text-gray-500">{lang === 'ko' ? 'Sharpe' : 'Sharpe Ratio'}</Label>
                                                            <div className="text-2xl font-bold text-white">--.--</div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                                {/* Pro Lock Overlay */}
                                                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-4">
                                                    <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                                                        PRO
                                                    </Badge>
                                                    <Link href="/pricing">
                                                        <Button variant="glow">
                                                            {lang === 'ko' ? '프리미엄으로 전체 보기' : 'Unlock with Premium'}
                                                        </Button>
                                                    </Link>
                                                    <Label className="text-gray-400 text-xs">
                                                        {lang === 'ko' ? '이 기능은 프리미엄 전용입니다' : 'This feature is Premium only'}
                                                    </Label>
                                                </div>
                                            </>
                                        ) : (
                                            <CardContent>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    <div>
                                                        <Label className="text-gray-500">{lang === 'ko' ? '승률' : 'Win Rate'}</Label>
                                                        <div className="text-2xl font-bold text-white">
                                                            {analysisResult.backtest.winRate >= 999 ? 'N/A' : `${analysisResult.backtest.winRate.toFixed(1)}%`}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <Label className="text-gray-500">{lang === 'ko' ? '손익비' : 'Profit Factor'}</Label>
                                                        <div className="text-2xl font-bold text-white">
                                                            {analysisResult.backtest.profitFactor >= 999 ? 'N/A' : analysisResult.backtest.profitFactor.toFixed(2)}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <Label className="text-gray-500">{lang === 'ko' ? '최대 낙폭' : 'Max DD'}</Label>
                                                        <div className="text-2xl font-bold text-white">
                                                            {analysisResult.backtest.maxDrawdownPercent.toFixed(1)}%
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <Label className="text-gray-500">{lang === 'ko' ? 'Sharpe' : 'Sharpe Ratio'}</Label>
                                                        <div className="text-2xl font-bold text-white">
                                                            {analysisResult.backtest.sharpeRatio.toFixed(2)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        )}
                                    </Card>
                                )}

                                {/* Position Status Card */}
                                <Card className="bg-gray-900 border-gray-800">
                                    <CardHeader>
                                        <CardTitle className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                                            {t.analysis.positionStatus}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {avgPrice ? (
                                            <div className="flex items-center gap-4">
                                                <div className={`text-3xl font-black ${
                                                    historyData[historyData.length - 1].close > avgPrice ? 'text-green-500' : 'text-red-500'
                                                }`}>
                                                    {((historyData[historyData.length - 1].close - avgPrice) / avgPrice * 100).toFixed(2)}%
                                                </div>
                                                <Badge variant={historyData[historyData.length - 1].close > avgPrice ? 'default' : 'destructive'}>
                                                    {historyData[historyData.length - 1].close > avgPrice ? 'PROFIT' : 'LOSS'}
                                                </Badge>
                                                <p className="text-gray-300 text-sm">
                                                    {historyData[historyData.length - 1].close > avgPrice
                                                        ? t.analysis.profitMsg
                                                        : t.analysis.lossMsg
                                                    }
                                                </p>
                                            </div>
                                        ) : (
                                            <p className="text-gray-500">{t.analysis.noTradeMsg}</p>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Fractal Engine Card (BETA) */}
                                <Card className="bg-gray-900 border-indigo-800">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                        <CardTitle className="text-sm font-medium text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                                            {t.analysis.fractalTitle}
                                        </CardTitle>
                                        <Badge variant="secondary" className="bg-indigo-500 text-white">
                                            BETA
                                        </Badge>
                                    </CardHeader>
                                    <CardContent>
                                        {fractalResult ? (
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <Label className="text-gray-400">{t.analysis.similarity}</Label>
                                                    <div className="text-white font-bold text-2xl">
                                                        {fractalResult.bestMatches.length > 0
                                                            ? `${fractalResult.bestMatches[0].similarity.toFixed(0)}%`
                                                            : 'None'}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <Label className="text-gray-400">{t.analysis.prediction}</Label>
                                                    <div className={`text-2xl font-black ${
                                                        fractalResult.recommendedPosition === 'BUY' ? 'text-green-400' :
                                                        fractalResult.recommendedPosition === 'SELL' ? 'text-red-400' : 'text-gray-400'
                                                    }`}>
                                                        {fractalResult.recommendedPosition}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-gray-500 text-sm">
                                                <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                                {t.analysis.analyzing}
                                            </div>
                                        )}
                                        <CardDescription className="mt-4 text-xs text-indigo-300 bg-indigo-900/30 p-2 rounded">
                                            {t.analysis.fractalDesc}
                                        </CardDescription>
                                    </CardContent>
                                </Card>
                            </>
                        )}
                    </section>
                )}
            </div>
        </div>
    )
}
