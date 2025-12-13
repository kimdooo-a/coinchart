'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DetailedChart } from '@/components/DetailedChart'
import { analyzeFractalPattern, FractalAnalysisResult } from '@/lib/fractal_engine'

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

    // Indicators State
    const [rsiResult, setRsiResult] = useState<any>(null)
    const [trendResult, setTrendResult] = useState<any>(null)
    const [bbResult, setBbResult] = useState<any>(null)
    const [macdResult, setMacdResult] = useState<any>(null)
    const [stochResult, setStochResult] = useState<any>(null)
    const [cciResult, setCciResult] = useState<any>(null)
    const [williamsResult, setWilliamsResult] = useState<any>(null)
    const [atrResult, setAtrResult] = useState<any>(null)
    const [adxResult, setAdxResult] = useState<any>(null)

    const supabase = createClient()

    useEffect(() => {
        if (!symbol) return

        // 1. Fetch Realtime Price
        const fetchRealtimePrice = async () => {
            try {
                // Use local API proxy to avoid CORS/Network issues
                const res = await fetch(`/api/price?symbol=${symbol}`)
                const data = await res.json()
                if (data.price) {
                    setCurrentPrice(parseFloat(data.price))
                }
            } catch (e) {
                console.error("Failed to fetch realtime price", e)
            }
        }

        // Initial fetch
        fetchRealtimePrice()

        // Optional: Poll every 5s
        const interval = setInterval(fetchRealtimePrice, 5000)

        const fetchData = async () => {
            // 2. Get User Session
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.replace('/portfolio') // Protect route
                return
            }

            // 3. Fetch Market History (3 Years)
            // Strategy: Fetch newest 990 items (descending) to guarantee we get Today's data
            const { data: prices, error: priceError } = await supabase
                .from('market_prices')
                .select('date, open, high, low, close, volume')
                .eq('symbol', symbol)
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

            // Analysis
            if (formattedData.length > 50) {
                const closes = formattedData.map(d => d.close)

                // Indicators
                const rsiValues = calculateRSI(closes, 14)
                if (rsiValues.length > 0) {
                    const lastRsi = rsiValues[rsiValues.length - 1]
                    setRsiResult(analyzeRSI(lastRsi))
                }

                const sma20Values = calculateSMA(closes, 20)
                if (sma20Values.length > 0) {
                    const lastSma = sma20Values[sma20Values.length - 1]
                    const lastClose = closes[closes.length - 1]
                    setTrendResult(analyzeTrend(lastClose, lastSma))
                }

                const bands = calculateBollingerBands(closes, 20, 2)
                if (bands.length > 0) {
                    setBbResult(bands[bands.length - 1])
                }

                const highs = formattedData.map(d => d.high)
                const lows = formattedData.map(d => d.low)

                // MACD
                const macd = calculateMACD(closes)
                if (macd.macd.length > 0) {
                    setMacdResult({
                        macd: macd.macd[macd.macd.length - 1],
                        signal: macd.signal[macd.signal.length - 1],
                        histogram: macd.histogram[macd.histogram.length - 1]
                    })
                }

                // Stochastic
                const stoch = calculateStochastic(highs, lows, closes)
                if (stoch.k.length > 0) {
                    setStochResult({
                        k: stoch.k[stoch.k.length - 1],
                        d: stoch.d[stoch.d.length - 1]
                    })
                }

                // CCI
                const cci = calculateCCI(highs, lows, closes)
                if (cci.length > 0) {
                    setCciResult(cci[cci.length - 1])
                }

                // Williams
                const williams = calculateWilliamsR(highs, lows, closes)
                if (williams.length > 0) {
                    setWilliamsResult(williams[williams.length - 1])
                }

                // ATR
                const atr = calculateATR(highs, lows, closes)
                if (atr.length > 0) {
                    setAtrResult(atr[atr.length - 1])
                }

                // ADX
                const adx = calculateADX(highs, lows, closes)
                if (adx.length > 0) {
                    setAdxResult(adx[adx.length - 1])
                }

                // Fractal Engine
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

            // 4. Fetch User Trades
            const { data: trades, error: tradeError } = await supabase
                .from('trades')
                .select('*')
                .eq('user_id', user.id)
                .eq('symbol', symbol)

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

            setLoading(false)
        }

        fetchData()
        return () => clearInterval(interval)
    }, [symbol, router])

    const getPriceColor = () => {
        if (!currentPrice || !avgPrice) return 'text-white'
        return currentPrice >= avgPrice ? 'text-green-500' : 'text-red-500'
    }

    // Dynamic Labels based on state & Lang
    const getRsiLabel = (sig: string) => {
        if (!sig) return ''
        if (sig === 'SELL') return t.analysis.overbought
        if (sig === 'BUY') return t.analysis.oversold
        return t.analysis.neutral
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-4 flex flex-col items-center">
            <div className="w-full max-w-6xl">
                {/* Header Row */}
                <div className="flex justify-between items-start mb-4">
                    <button
                        onClick={() => router.back()}
                        className="text-gray-400 hover:text-white flex items-center gap-2"
                    >
                        &larr; {t.common.back}
                    </button>

                    {/* Language Toggle */}
                    <div className="bg-gray-800 p-1 rounded-lg flex items-center">
                        <button
                            onClick={() => setLang('ko')}
                            className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${lang === 'ko' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                        >
                            KR (한글)
                        </button>
                        <button
                            onClick={() => setLang('en')}
                            className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${lang === 'en' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                        >
                            us ENG
                        </button>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                    <div className="flex items-center gap-4">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                            {symbol} {t.analysis.title}
                        </h1>
                        {avgPrice && (
                            <span className="px-3 py-1 bg-blue-900/30 border border-blue-500/30 rounded-full text-blue-400 text-sm font-bold">
                                {t.analysis.myAvg}: ${avgPrice.toLocaleString()}
                            </span>
                        )}
                    </div>
                    {currentPrice && (
                        <div className="text-right">
                            <div className="text-sm text-gray-500">{t.analysis.currentPrice}</div>
                            <div className={`text-4xl font-black ${getPriceColor()}`}>
                                ${currentPrice.toLocaleString()}
                            </div>
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="w-full h-[500px] bg-gray-900 rounded-xl animate-pulse flex items-center justify-center text-gray-500">
                        {t.common.loading}
                    </div>
                ) : historyData.length > 0 ? (
                    <DetailedChart
                        data={historyData}
                        avgPrice={avgPrice}
                        symbol={symbol}
                    />
                ) : (
                    <div className="p-10 text-center bg-gray-900 rounded-xl border border-gray-800">
                        <p className="text-gray-400">{t.analysis.notSupported}</p>
                        <p className="text-xs text-gray-600 mt-2">{t.analysis.noHistoryDesc}</p>
                    </div>
                )}

                {historyData.length > 0 && (
                    <>
                        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Basic Strategy Card */}
                            <div className="bg-[#111] p-6 rounded-xl border border-gray-800">
                                <h3 className="text-gray-400 text-sm font-bold mb-4 uppercase tracking-wider">{t.analysis.positionStatus}</h3>
                                {avgPrice ? (
                                    <div className="flex items-center gap-4">
                                        <div className={`text-3xl font-black ${historyData[historyData.length - 1].close > avgPrice ? 'text-green-500' : 'text-red-500'}`}>
                                            {((historyData[historyData.length - 1].close - avgPrice) / avgPrice * 100).toFixed(2)}%
                                        </div>
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
                            </div>

                            {/* Fractal Engine Result (Level 1) */}
                            <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 p-6 rounded-xl border border-indigo-500/30 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10 font-black text-6xl text-white">AI</div>
                                <h3 className="text-indigo-400 text-sm font-bold mb-4 uppercase tracking-wider flex items-center gap-2">
                                    <span>🧠 {t.analysis.fractalTitle}</span>
                                    <span className="bg-indigo-500 text-white text-[10px] px-1.5 py-0.5 rounded">BETA</span>
                                </h3>

                                {fractalResult ? (
                                    <div>
                                        <div className="flex justify-between items-end mb-4">
                                            <div>
                                                <div className="text-gray-400 text-xs mb-1">{t.analysis.similarity}</div>
                                                <div className="text-white font-bold text-2xl">
                                                    {fractalResult.bestMatches.length > 0
                                                        ? `${fractalResult.bestMatches[0].similarity.toFixed(0)}%`
                                                        : 'None'}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-gray-400 text-xs mb-1">{t.analysis.prediction}</div>
                                                <div className={`text-2xl font-black ${fractalResult.recommendedPosition === 'BUY' ? 'text-green-400' :
                                                    fractalResult.recommendedPosition === 'SELL' ? 'text-red-400' : 'text-gray-400'
                                                    }`}>
                                                    {fractalResult.recommendedPosition}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-xs text-indigo-300 bg-indigo-900/30 p-2 rounded">
                                            {t.analysis.fractalDesc}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-gray-500 text-sm animate-pulse">{t.analysis.analyzing}</div>
                                )}
                            </div>
                        </div>

                        <h2 className="text-xl font-bold mt-10 mb-4 text-gray-200">{t.analysis.techTitle}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                            {/* RSI Card */}
                            <div className="bg-[#151515] p-6 rounded-xl border border-gray-800 hover:border-blue-500/50 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-gray-400 text-sm font-bold uppercase">{t.analysis.rsiTitle}</h3>
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${rsiResult?.signal === 'SELL' ? 'bg-red-500/20 text-red-500' : rsiResult?.signal === 'BUY' ? 'bg-green-500/20 text-green-500' : 'bg-gray-700 text-gray-300'}`}>
                                        {getRsiLabel(rsiResult?.signal)}
                                    </span>
                                </div>
                                <div className="text-4xl font-bold text-white mb-2">
                                    {rsiResult ? rsiResult.value.toFixed(1) : '--'}
                                </div>
                                <div className="text-xs text-gray-500 pt-3 border-t border-gray-800">
                                    {t.analysis.rsiDesc}
                                </div>
                            </div>

                            {/* Trend Card */}
                            <div className="bg-[#151515] p-6 rounded-xl border border-gray-800 hover:border-blue-500/50 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-gray-400 text-sm font-bold uppercase">{t.analysis.trendTitle}</h3>
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${trendResult?.signal === 'BUY' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                                        {trendResult?.signal === 'BUY' ? t.analysis.upward : t.analysis.downward}
                                    </span>
                                </div>
                                <div className="text-4xl font-bold text-white mb-2">
                                    ${trendResult ? trendResult.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '--'}
                                </div>
                                <div className="text-xs text-gray-500 pt-3 border-t border-gray-800">
                                    {t.analysis.trendDesc}
                                </div>
                            </div>

                            {/* Bollinger Card */}
                            <div className="bg-[#151515] p-6 rounded-xl border border-gray-800 hover:border-blue-500/50 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-gray-400 text-sm font-bold uppercase">{t.analysis.volatilityTitle}</h3>
                                    <span className="bg-gray-700 text-gray-300 px-2 py-0.5 rounded text-xs font-bold">
                                        {t.analysis.band}
                                    </span>
                                </div>
                                {bbResult ? (
                                    <div className="space-y-1 mb-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">{t.analysis.upper}</span>
                                            <span className="text-gray-300">${bbResult.upper.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">{t.analysis.middle}</span>
                                            <span className="text-blue-400">${bbResult.middle.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">{t.analysis.lower}</span>
                                            <span className="text-gray-300">${bbResult.lower.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
                                        </div>
                                    </div>
                                ) : <div className="h-20 animate-pulse bg-gray-900 rounded" />}
                                <div className="text-xs text-gray-500 pt-3 border-t border-gray-800">
                                    {t.analysis.bbDesc}
                                </div>
                            </div>

                            {/* MACD Card */}
                            <div className="bg-[#151515] p-6 rounded-xl border border-gray-800 hover:border-blue-500/50 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-gray-400 text-sm font-bold uppercase">{t.analysis.macdTitle}</h3>
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${macdResult?.histogram > 0 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                                        {macdResult?.histogram > 0 ? 'BULLISH' : 'BEARISH'}
                                    </span>
                                </div>
                                {macdResult ? (
                                    <div className="space-y-1 mb-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">MACD</span>
                                            <span className={macdResult.macd > macdResult.signal ? "text-green-400" : "text-red-400"}>{macdResult.macd.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Signal</span>
                                            <span className="text-gray-300">{macdResult.signal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Hist</span>
                                            <span className={macdResult.histogram > 0 ? "text-green-500" : "text-red-500"}>{macdResult.histogram.toFixed(4)}</span>
                                        </div>
                                    </div>
                                ) : <div className="h-20 animate-pulse bg-gray-900 rounded" />}
                                <div className="text-xs text-gray-500 pt-3 border-t border-gray-800">
                                    {t.analysis.macdDesc}
                                </div>
                            </div>

                            {/* Stochastic Card */}
                            <div className="bg-[#151515] p-6 rounded-xl border border-gray-800 hover:border-blue-500/50 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-gray-400 text-sm font-bold uppercase">{t.analysis.stochTitle}</h3>
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${stochResult?.k > 80 ? 'bg-red-500/20 text-red-500' : stochResult?.k < 20 ? 'bg-green-500/20 text-green-500' : 'bg-gray-700 text-gray-300'}`}>
                                        {stochResult?.k > 80 ? t.analysis.overbought : stochResult?.k < 20 ? t.analysis.oversold : t.analysis.neutral}
                                    </span>
                                </div>
                                {stochResult ? (
                                    <div className="flex gap-4 items-end mb-3">
                                        <div>
                                            <div className="text-xs text-gray-500">%K</div>
                                            <div className={`text-2xl font-bold ${stochResult.k > stochResult.d ? 'text-blue-400' : 'text-gray-300'}`}>{stochResult.k.toFixed(1)}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500">%D</div>
                                            <div className="text-xl font-bold text-gray-500">{stochResult.d.toFixed(1)}</div>
                                        </div>
                                    </div>
                                ) : <div className="h-16 animate-pulse bg-gray-900 rounded" />}
                                <div className="text-xs text-gray-500 pt-3 border-t border-gray-800">
                                    {t.analysis.stochDesc}
                                </div>
                            </div>

                            {/* CCI Card */}
                            <div className="bg-[#151515] p-6 rounded-xl border border-gray-800 hover:border-blue-500/50 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-gray-400 text-sm font-bold uppercase">{t.analysis.cciTitle}</h3>
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${cciResult > 100 ? 'bg-red-500/20 text-red-500' : cciResult < -100 ? 'bg-green-500/20 text-green-500' : 'bg-gray-700 text-gray-300'}`}>
                                        {cciResult > 100 ? t.analysis.overbought : cciResult < -100 ? t.analysis.oversold : t.analysis.neutral}
                                    </span>
                                </div>
                                <div className="text-4xl font-bold text-white mb-2">
                                    {cciResult ? cciResult.toFixed(1) : '--'}
                                </div>
                                <div className="text-xs text-gray-500 pt-3 border-t border-gray-800">
                                    {t.analysis.cciDesc}
                                </div>
                            </div>

                            {/* Williams %R Card */}
                            <div className="bg-[#151515] p-6 rounded-xl border border-gray-800 hover:border-blue-500/50 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-gray-400 text-sm font-bold uppercase">{t.analysis.williamsTitle}</h3>
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${williamsResult > -20 ? 'bg-red-500/20 text-red-500' : williamsResult < -80 ? 'bg-green-500/20 text-green-500' : 'bg-gray-700 text-gray-300'}`}>
                                        {williamsResult > -20 ? t.analysis.overbought : williamsResult < -80 ? t.analysis.oversold : t.analysis.neutral}
                                    </span>
                                </div>
                                <div className="text-4xl font-bold text-white mb-2">
                                    {williamsResult ? williamsResult.toFixed(1) : '--'}
                                </div>
                                <div className="text-xs text-gray-500 pt-3 border-t border-gray-800">
                                    {t.analysis.williamsDesc}
                                </div>
                            </div>

                            {/* ATR Card */}
                            <div className="bg-[#151515] p-6 rounded-xl border border-gray-800 hover:border-blue-500/50 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-gray-400 text-sm font-bold uppercase">{t.analysis.atrTitle}</h3>
                                    <span className="bg-gray-700 text-gray-300 px-2 py-0.5 rounded text-xs font-bold">
                                        VOLATILITY
                                    </span>
                                </div>
                                <div className="text-4xl font-bold text-white mb-2">
                                    {atrResult ? atrResult.toFixed(2) : '--'}
                                </div>
                                <div className="text-xs text-gray-500 pt-3 border-t border-gray-800">
                                    {t.analysis.atrDesc}
                                </div>
                            </div>

                            {/* ADX Card */}
                            <div className="bg-[#151515] p-6 rounded-xl border border-gray-800 hover:border-blue-500/50 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-gray-400 text-sm font-bold uppercase">{t.analysis.adxTitle}</h3>
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${adxResult > 25 ? 'bg-indigo-500/20 text-indigo-400' : 'bg-gray-700 text-gray-300'}`}>
                                        {adxResult > 25 ? 'STRONG TREND' : 'WEAK TREND'}
                                    </span>
                                </div>
                                <div className="text-4xl font-bold text-white mb-2">
                                    {adxResult ? adxResult.toFixed(1) : '--'}
                                </div>
                                <div className="text-xs text-gray-500 pt-3 border-t border-gray-800">
                                    {t.analysis.adxDesc}
                                </div>
                            </div>

                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
