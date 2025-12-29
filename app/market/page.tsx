'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { POPULAR_SYMBOLS } from '@/lib/constants';
import { useLanguage } from '@/context/LanguageContext';
import { TRANSLATIONS } from '@/lib/translations';
import KimchiPremium from '@/components/Market/KimchiPremium';
import RSIHeatmap from '@/components/Market/RSIHeatmap';
import { calculateRSI } from '@/lib/indicators';
import { analyzeFractalPattern } from '@/lib/fractal_engine';
import { Disclaimer } from '@/components/Common/Disclaimer';

type FNGData = {
    value: string;
    value_classification: string;
    timestamp: string;
    time_until_update: string;
};

type CoinMood = {
    symbol: string;
    score: number;
    priceChange: number;
    status: string;
};

type GaugeProps = {
    score: number;
    label: string;
    description: string;
};

const getColor = (value: number) => {
    if (value < 25) return 'text-red-500';
    if (value < 45) return 'text-orange-500';
    if (value < 55) return 'text-yellow-500';
    if (value < 75) return 'text-green-500';
    return 'text-teal-400';
};

const getStatus = (score: number, lang: 'ko' | 'en') => {
    if (lang === 'ko') {
        if (score < 25) return '극단적 공포';
        if (score < 45) return '공포';
        if (score < 55) return '중립';
        if (score < 75) return '탐욕';
        return '극단적 탐욕';
    } else {
        if (score < 25) return 'Extreme Fear';
        if (score < 45) return 'Fear';
        if (score < 55) return 'Neutral';
        if (score < 75) return 'Greed';
        return 'Extreme Greed';
    }
};

const Gauge = ({ score, label, description }: GaugeProps) => {
    return (
        <div className="bg-card rounded-2xl p-6 border border-border shadow-2xl flex flex-col items-center relative overflow-hidden w-full">
            <div className="absolute top-0 w-full h-2 bg-gradient-to-r from-red-600 via-yellow-500 to-green-500 opacity-30"></div>
            <h3 className="text-gray-400 mb-6 text-xl font-bold">{label}</h3>

            <div className="relative w-64 h-32 overflow-hidden mb-4">
                <div className="absolute top-0 left-0 w-full h-64 rounded-full border-[20px] border-border box-border"></div>
                <motion.div
                    initial={{ rotate: -180 }}
                    animate={{ rotate: -180 + (score / 100) * 180 }}
                    transition={{ duration: 1.5, type: "spring" }}
                    className="absolute top-0 left-0 w-full h-64 rounded-full border-[20px] border-transparent box-border origin-bottom"
                    style={{
                        borderTopColor: score < 25 ? '#ef4444' : score < 45 ? '#f97316' : score < 55 ? '#eab308' : score < 75 ? '#22c55e' : '#2dd4bf',
                        borderRightColor: 'transparent',
                        borderBottomColor: 'transparent',
                        borderLeftColor: 'transparent'
                    }}
                ></motion.div>
            </div>

            <div className="text-center -mt-8 relative z-10">
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`text-6xl font-black ${getColor(score)}`}
                >
                    {score}
                </motion.div>
            </div>

            <p className="text-gray-500 mt-6 text-sm text-center">
                {description}
            </p>
        </div>
    );
};

export default function MarketPage() {
    const { lang } = useLanguage();
    const t = TRANSLATIONS[lang];
    const [data, setData] = useState<FNGData[]>([]);
    const [basis, setBasis] = useState<'daily' | 'realtime'>('daily');
    const [btcScore, setBtcScore] = useState(50);
    const [altScore, setAltScore] = useState(50);
    const [coinMoods, setCoinMoods] = useState<CoinMood[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Standard FNG
                const fngRes = await fetch('https://api.alternative.me/fng/?limit=5');
                const fngJson = await fngRes.json();
                const officialScore = fngJson.data ? parseInt(fngJson.data[0].value) : 50;
                if (fngJson.data) setData(fngJson.data);

                // 2. Fetch Ticker for POPULAR_SYMBOLS
                const symbolsParam = JSON.stringify(POPULAR_SYMBOLS);
                const tickerRes = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=${symbolsParam}`);
                const tickers = await tickerRes.json();

                // 3. Fetch Klines (4h) for RSI & Trend Check & Fractal Analysis
                // STEP 4-4B: API Route 프록시 + TTL 캐시 사용 (Binance 직접 호출 제거)
                // Fetching 1000 candles for Pattern Matching
                const klinePromises = POPULAR_SYMBOLS.map(async (symbol) => {
                    try {
                        // Use internal API Route with TTL cache
                        const res = await fetch(`/api/klines?symbol=${symbol}&interval=4h&limit=1000`);
                        if (!res.ok) {
                            throw new Error(`API Route error: ${res.statusText}`);
                        }
                        const data = await res.json();
                        // API Route returns formatted data: { time, open, high, low, close, volume }
                        // Map to simplified object for engine (time is in seconds, convert to ms)
                        const candles = data.map((d: any) => ({
                            time: d.time * 1000, // Convert seconds to ms for compatibility
                            open: d.open,
                            high: d.high,
                            low: d.low,
                            close: d.close,
                            volume: d.volume
                        }));

                        const closes = candles.map((c: any) => c.close);

                        // 1. RSI & Trend (Using last 30 data points)
                        const recentCloses = closes.slice(-30);
                        const rsiArr = calculateRSI(recentCloses, 14);
                        const rsi = rsiArr[rsiArr.length - 1] || 50;

                        const sma20 = recentCloses.slice(-20).reduce((a: number, b: number) => a + b, 0) / 20;
                        const lastClose = recentCloses[recentCloses.length - 1];
                        const isUptrend = lastClose > sma20;

                        // 2. Fractal Analysis (Pattern Matching)
                        // Analyze last 14 candles pattern against 1000 history
                        const fractalRes = await analyzeFractalPattern(symbol, candles, 14, 3);

                        return { symbol, rsi, isUptrend, fractalRes };
                    } catch (e) {
                        console.error(`Error fetching/analyzing ${symbol}:`, e);
                        return { symbol, rsi: 50, isUptrend: false, fractalRes: null };
                    }
                });

                const techData = await Promise.all(klinePromises);
                const techMap = new Map(techData.map(item => [item.symbol, item]));

                const btc = tickers.find((t: any) => t.symbol === 'BTCUSDT');
                const btcChange = btc ? parseFloat(btc.priceChangePercent) : 0;
                const alts = tickers.filter((t: any) => t.symbol !== 'BTCUSDT');

                // --- CALCULATION LOGIC ---
                let newBtcScore = 50;
                let newAltScore = 50;
                let newCoinMoods: CoinMood[] = [];

                if (basis === 'daily') {
                    // [Daily Mode] - Mixed Logic

                    const calculateSmartScore = (ticker: any, baseScore: number) => {
                        const symbol = ticker.symbol;
                        const change = parseFloat(ticker.priceChangePercent);
                        const tech = techMap.get(symbol);
                        const rsi = tech ? tech.rsi : 50;
                        const isUptrend = tech ? tech.isUptrend : false;
                        const fractal = tech ? tech.fractalRes : null;

                        // 1. Relative Strength to BTC
                        const diff = change - btcChange;

                        // 2. Base Calculation
                        let score = baseScore + (diff * 2);

                        // 3. Technical Adjustments
                        // RSI
                        if (rsi > 60) score += 5;
                        if (rsi > 70) score += 5;
                        if (rsi < 30) score -= 5;

                        // Trend Protection
                        if (isUptrend && score < 40) score = 40 + (rsi - 40) * 0.5;

                        // 4. Fractal Analysis Impact (AI Boost)
                        if (fractal && fractal.confidence > 60) {
                            if (fractal.recommendedPosition === 'BUY') {
                                score += 10;
                                if (fractal.confidence > 80) score += 5;
                            } else if (fractal.recommendedPosition === 'SELL') {
                                score -= 10;
                                if (fractal.confidence > 80) score -= 5;
                            }
                        }

                        if (score > 100) score = 100;
                        if (score < 0) score = 0;

                        return Math.round(score);
                    };

                    newBtcScore = calculateSmartScore(btc, officialScore);

                    // Alt Score Aggregate
                    if (alts.length > 0) {
                        const avgAltChange = alts.reduce((acc: number, t: any) => acc + parseFloat(t.priceChangePercent), 0) / alts.length;
                        const deviation = (avgAltChange - btcChange) * 2;
                        let rawAltScore = officialScore + deviation;

                        let techBonus = 0;
                        Array.from(techMap.values()).forEach(t => {
                            if (t.rsi > 60) techBonus += 1;
                            if (t.fractalRes?.recommendedPosition === 'BUY') techBonus += 2;
                        });
                        rawAltScore += techBonus;

                        newAltScore = Math.max(0, Math.min(100, Math.round(rawAltScore)));
                    }

                    // Individual Coins
                    if (Array.isArray(tickers)) {
                        newCoinMoods = tickers.map((t: any) => {
                            const score = calculateSmartScore(t, officialScore);
                            const tech = techMap.get(t.symbol);
                            const fractal = tech ? tech.fractalRes : null;

                            let statusText = getStatus(score, lang);
                            if (fractal && fractal.confidence > 70) {
                                if (fractal.recommendedPosition === 'BUY') {
                                    statusText = lang === 'ko' ? `${statusText} 🚀` : `${statusText} 🚀`; // AI Buy Signal
                                }
                                else if (fractal.recommendedPosition === 'SELL') {
                                    statusText = lang === 'ko' ? `${statusText} 📉` : `${statusText} 📉`; // AI Sell Signal
                                }
                            }

                            return {
                                symbol: t.symbol.replace('USDT', ''),
                                score: score,
                                priceChange: parseFloat(t.priceChangePercent),
                                status: statusText
                            };
                        });
                    }

                } else {
                    // [Realtime Mode] - Pure Price Action
                    const calculateRealtimeScore = (change: number) => {
                        return Math.max(0, Math.min(100, Math.round(50 + (change * 3))));
                    };

                    newBtcScore = calculateRealtimeScore(btcChange);
                    if (alts.length > 0) {
                        const avgAltChange = alts.reduce((acc: number, t: any) => acc + parseFloat(t.priceChangePercent), 0) / alts.length;
                        newAltScore = calculateRealtimeScore(avgAltChange);
                    }

                    if (Array.isArray(tickers)) {
                        newCoinMoods = tickers.map((t: any) => {
                            const change = parseFloat(t.priceChangePercent);
                            const score = calculateRealtimeScore(change);
                            return {
                                symbol: t.symbol.replace('USDT', ''),
                                score: score,
                                priceChange: change,
                                status: getStatus(score, lang)
                            };
                        });
                    }
                }

                setBtcScore(newBtcScore);
                setAltScore(newAltScore);
                setCoinMoods(newCoinMoods.sort((a, b) => b.score - a.score));

            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [basis, lang]);

    const todayScore = btcScore;

    const getMarketInsight = (score: number) => {
        if (lang === 'ko') {
            if (score < 25) return {
                title: "💎 '공포에 사서 뉴스에 팔아라' (매수 적기)",
                strategy: "분할 매수 (Dollar Cost Averaging)",
                story: "현재 시장은 '극단적 공포' 상태입니다. 투자자들은 패닉에 빠져 투매를 하고 있습니다. 하지만 워렌 버핏은 '남들이 공포에 질려 있을 때가 가장 좋은 기회'라고 했습니다. 역사적으로 이 구간은 항상 저점이었습니다. 지금은 두려움을 이겨내고 조금씩 우량 코인을 모아가야 할 때입니다."
            };
            if (score < 45) return {
                title: "📉 저가 매수의 기회 (관심 집중)",
                strategy: "적극적 관망 및 저점 매수",
                story: "시장의 거품이 빠지고 사람들이 의심을 품는 시기입니다. 하지만 하락세가 진정되고 바닥을 다지는 구간일 수 있습니다. 급하게 들어가지 말고, 지지선을 지키는지 확인하면서 천천히 진입 시점을 노려보세요."
            };
            if (score < 55) return {
                title: "⚖️ 방향성을 탐색하는 시기 (중립)",
                strategy: "현금 비중 유지 및 관망",
                story: "시장이 위로 갈지 아래로 갈지 고민하고 있습니다. 뚜렷한 호재도, 악재도 반영되지 않은 상태입니다. 이럴 때는 추측해서 베팅하기보다, 확실한 추세가 나올 때까지 기다리는 것이 돈을 잃지 않는 지름길입니다."
            };
            if (score < 75) return {
                title: "📈 상승장의 즐거움 (보유)",
                strategy: "추세 추종 (Holding) 및 불타기 금지",
                story: "시장에 활기가 돌고 투자 심리가 회복되었습니다. 계좌가 붉게 물들기 시작하는 즐거운 시기입니다. 상승 추세를 즐기시되, 너무 무리하게 추가 입금을 하거나 대출을 쓰지는 마세요. 흐름을 타는 것이 중요합니다."
            };
            return {
                title: "🚨 축제는 끝날 때가 가장 화려합니다 (매도 검토)",
                strategy: "분할 매도 및 수익 실현",
                story: "현재 시장은 '극단적 탐욕' 상태입니다. 너도나도 돈을 벌었다고 자랑하는 시기죠. 이때가 가장 위험합니다. 세력들은 개미들에게 물량을 넘기고 떠날 준비를 합니다. 아쉬워하지 말고 수익을 챙겨서 현금화하세요. 현금도 종목입니다."
            };
        } else {
            // English Insights
            if (score < 25) return {
                title: "💎 'Buy the Fear' (Best Buy Zone)",
                strategy: "DCA (Dollar Cost Averaging)",
                story: "Market is in 'Extreme Fear'. Investors are panic selling. Warren Buffett said 'Be greedy when others are fearful'. Historically this has been the bottom. Overcome the fear and accumulate blue clips."
            };
            if (score < 45) return {
                title: "📉 Specific Accumulation Zone",
                strategy: "Watch & Buy Dips",
                story: "The foam is settling. Skepticism remains. It might be consolidating at the bottom. Do not rush, confirm support levels and look for entry points."
            };
            if (score < 55) return {
                title: "⚖️ Searching for Direction (Neutral)",
                strategy: "Hold Cash & Wait",
                story: "Market is deciding direction. No clear catalyst. It is better to wait for a clear trend than to bet on uncertainty."
            };
            if (score < 75) return {
                title: "📈 Enjoy the Ride (Hold)",
                strategy: "Trend Following",
                story: "Market sentiment is recovering. Portfolios are turning green. Enjoy the uptrend but avoid FOMO buying or excessive leverage."
            };
            return {
                title: "🚨 The Peak of the Party (Take Profit)",
                strategy: "Scale Out & Realize Gains",
                story: "Market is in 'Extreme Greed'. Everyone is bragging about gains. This is dangerous. Smart money is preparing to exit. Take some profits off the table. Cash is also a position."
            };
        }
    };

    const insight = getMarketInsight(todayScore);

    return (
        <main className="flex-1 w-full pt-20 pb-12 px-4 md:px-6 flex flex-col items-center">

            {/* Header Removed - Managed by GlobalHeader */}
            <div className="w-full max-w-7xl flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-primary">
                    {t.market.title}
                </h2>

                {/* Basis Toggle */}
                <div className="bg-gray-800 p-1 rounded-lg flex">
                    <button
                        onClick={() => setBasis('daily')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${basis === 'daily' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        {t.market.dailyBasis}
                    </button>
                    <button
                        onClick={() => setBasis('realtime')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${basis === 'realtime' ? 'bg-rose-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        {t.market.realtimeBasis}
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="w-full max-w-7xl h-96 bg-gray-900 rounded-2xl animate-pulse"></div>
            ) : (
                <div className="w-full max-w-7xl space-y-6">
                    {/* Gauges Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Gauge
                            score={todayScore}
                            label={basis === 'daily' ? t.market.btcLabel_daily : t.market.btcLabel_realtime}
                            description={basis === 'daily' ? t.market.btcDesc_daily : t.market.btcDesc_realtime}
                        />
                        <Gauge
                            score={altScore}
                            label={basis === 'daily' ? t.market.altLabel_daily : t.market.altLabel_realtime}
                            description={basis === 'daily' ? t.market.altDesc_daily : t.market.altDesc_realtime}
                        />
                    </div>

                    {/* Individual Coin Analysis */}
                    <div className="bg-card/50 rounded-2xl p-6 border border-border">
                        <div className="flex items-center gap-3 mb-6">
                            <h3 className="text-xl font-bold text-gray-300">💎 {t.market.detailTitle}</h3>
                            <span className="text-xs px-2 py-1 rounded bg-gray-800 text-gray-400 border border-gray-700">
                                {basis === 'daily' ? t.market.dailyBasis : t.market.realtimeBasis}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {coinMoods.map((coin) => (
                                <div key={coin.symbol} className="bg-background/50 p-4 rounded-xl border border-border flex flex-col items-center hover:border-primary/50 transition-colors">
                                    <div className="text-base font-bold text-gray-200 mb-2">{coin.symbol}</div>
                                    <div className={`text-2xl md:text-3xl font-black mb-1 ${getColor(coin.score)}`}>
                                        {coin.score}
                                    </div>
                                    <div className={`text-xs font-bold px-2 py-0.5 rounded-full mb-2 ${coin.score < 45 ? 'bg-red-900/50 text-red-500' :
                                        coin.score > 55 ? 'bg-green-900/50 text-green-500' :
                                            'bg-yellow-900/50 text-yellow-500'
                                        }`}>
                                        {coin.status}
                                    </div>
                                    <div className={`text-xs ${coin.priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {coin.priceChange >= 0 ? '+' : ''}{coin.priceChange.toFixed(2)}%
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Disclaimer />

                    {/* AI Insight Report */}
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-2xl">
                        <div className="flex flex-col md:flex-row gap-6 items-start">
                            <div className="text-4xl md:text-6xl">
                                {todayScore < 45 ? '🐻' : todayScore > 55 ? '🐂' : '🦆'}
                            </div>
                            <div className="flex-1">
                                <h3 className={`text-2xl md:text-3xl font-bold mb-3 ${getColor(todayScore)}`}>{insight.title}</h3>

                                <div className="space-y-4">
                                    <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                                        <span className="text-blue-400 text-sm font-bold uppercase tracking-wide block mb-1">💡 {lang === 'ko' ? '추천 전략' : 'Strategy'}</span>
                                        <p className="text-gray-300 font-medium">{insight.strategy}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 font-bold block mb-2 text-sm uppercase tracking-wide">AI Commentary</span>
                                        <p className="text-gray-300 leading-relaxed font-light md:font-normal text-lg">
                                            {insight.story}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* History Section */}
                    {basis === 'daily' && (
                        <div className="bg-card/30 p-6 rounded-2xl border border-border">
                            <h3 className="text-gray-400 mb-4 font-bold text-center">📅 BTC {lang === 'ko' ? '심리 변화' : 'History'}</h3>
                            <div className="flex justify-center gap-4 md:gap-8 overflow-x-auto pb-2">
                                {data.slice(1, 5).map((item, i) => (
                                    <div key={i} className="flex flex-col items-center min-w-[80px]">
                                        <span className="text-gray-500 text-xs mb-1">
                                            {lang === 'ko' ?
                                                (i === 0 ? '어제' : i === 1 ? '2일 전' : `${i + 1}일 전`) :
                                                (i === 0 ? 'Yesterday' : `${i + 1} days ago`)
                                            }
                                        </span>
                                        <span className={`text-xl font-bold ${parseInt(item.value) > 50 ? 'text-green-500' : 'text-red-500'}`}>
                                            {item.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* NEW: Kimchi Premium & RSI Heatmap */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <KimchiPremium />
                        <RSIHeatmap />
                    </div>

                </div>
            )}
        </main>
    );
}
