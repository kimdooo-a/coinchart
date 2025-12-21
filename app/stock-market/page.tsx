'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { TRANSLATIONS } from '@/lib/translations';
import { calculateRSI } from '@/lib/indicators';

// Data Types
type StockMood = {
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

// Symbols to display in detail grid
const DISPLAY_SYMBOLS = ["SPY", "QQQ", "VIX"];

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
        <div className="bg-gray-900 rounded-3xl p-8 border border-gray-800 shadow-2xl flex flex-col items-center relative overflow-hidden w-full">
            <div className="absolute top-0 w-full h-2 bg-gradient-to-r from-red-600 via-yellow-500 to-green-500 opacity-30"></div>
            <h3 className="text-gray-400 mb-6 text-xl font-bold">{label}</h3>

            <div className="relative w-64 h-32 overflow-hidden mb-4">
                <div className="absolute top-0 left-0 w-full h-64 rounded-full border-[20px] border-gray-800 box-border"></div>
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

export default function StockMarketPage() {
    const { lang } = useLanguage();
    const t = TRANSLATIONS[lang];

    const marketTitle = t.menu?.stockMarketMood || (lang === 'ko' ? "미국 주식 시장 심리" : "US Stock Market Mood");

    const [basis, setBasis] = useState<'daily' | 'realtime'>('daily');
    const [marketScore, setMarketScore] = useState(50); // S&P 500 equivalent
    const [techScore, setTechScore] = useState(50); // Nasdaq/Tech equivalent
    const [stockMoods, setStockMoods] = useState<StockMood[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async (symbol: string) => {
            try {
                const res = await fetch(`/api/stock/history?symbol=${symbol}&interval=1d`);
                if (!res.ok) return [];
                const json = await res.json();
                return json.data || []; // Array of { close, ... }
            } catch (e) {
                console.error(e);
                return [];
            }
        };

        const fetchData = async () => {
            try {
                // Fetch SPY, QQQ, VIX
                const [spyData, qqqData, vixData] = await Promise.all([
                    fetchHistory('SPY'),
                    fetchHistory('QQQ'),
                    fetchHistory('VIX')
                ]);

                if (!spyData.length || !vixData.length) {
                    console.warn("No data for SPY/VIX");
                    setLoading(false);
                    // Fallback to simulated data if fetch fails (e.g. initial run)
                    if (stockMoods.length === 0) setStockMoods([
                        { symbol: 'SPY', score: 50, priceChange: 0, status: 'Neutral' },
                        { symbol: 'VIX', score: 50, priceChange: 0, status: 'Neutral' }
                    ]);
                    return;
                }

                // Prepare Data
                const spyCloses = spyData.map((d: any) => d.close).reverse(); // Latest last
                const qqqCloses = qqqData.map((d: any) => d.close).reverse();
                // VIX: Latest close is the current level
                const currentVix = vixData[0].close;
                const prevVix = vixData[1] ? vixData[1].close : currentVix;
                const vixChange = ((currentVix - prevVix) / prevVix) * 100;

                // --- CALCULATION ---

                // 1. VIX Score (Fear Indicator)
                // Normalize VIX: 10 (Complacency/Greed) to 40 (Fear). 
                // Inverted: Low VIX -> High Score (Greed), High VIX -> Low Score (Fear).
                // Formula: 100 - ( (Vix - 10) / 30 * 100 )
                // Clamp 0-100
                const vixScoreRaw = 100 - ((currentVix - 10) / (40 - 10) * 100);
                const vixScore = Math.max(0, Math.min(100, vixScoreRaw));

                // 2. SPY RSI (Momentum)
                const spyRSIArray = calculateRSI(spyCloses, 14);
                const currentSpyRSI = spyRSIArray[spyRSIArray.length - 1] || 50;
                // RSI is already 0-100. High RSI -> Greed.

                // 3. Market Score = Average
                const finalMarketScore = Math.round((vixScore + currentSpyRSI) / 2);

                // 4. Tech Score (QQQ RSI)
                const qqqRSIArray = calculateRSI(qqqCloses, 14);
                const currentQqqRSI = qqqRSIArray[qqqRSIArray.length - 1] || 50;
                // Maybe mix with VIX too? Tech is sensitive to rates/volatility.
                const finalTechScore = Math.round((vixScore + currentQqqRSI) / 2);

                // 5. Individual Mood List
                // Let's list SPY, QQQ, VIX
                const getPriceChange = (data: any[]) => {
                    if (data.length < 2) return 0;
                    const curr = data[0].close;
                    const prev = data[1].close;
                    return ((curr - prev) / prev) * 100;
                };

                const moods: StockMood[] = [
                    {
                        symbol: 'SPY',
                        score: Math.round(currentSpyRSI), // Show pure RSI as score for individual
                        priceChange: getPriceChange(spyData),
                        status: getStatus(Math.round(currentSpyRSI), lang)
                    },
                    {
                        symbol: 'QQQ',
                        score: Math.round(currentQqqRSI),
                        priceChange: getPriceChange(qqqData),
                        status: getStatus(Math.round(currentQqqRSI), lang)
                    },
                    {
                        symbol: 'VIX',
                        score: Math.round(vixScore), // Show Inverted Score? Or Raw?
                        // For VIX, "Greed" means Low VIX. "Fear" means High VIX.
                        // Let's show the 'Fear & Greed contribution' score (High = Greed/Safe, Low = Fear/Risk)
                        // Or maybe just raw VIX? The chart expects 0-100 score.
                        // Let's keep it consistent: Score 0-100 (Fear-Greed).
                        priceChange: vixChange,
                        status: getStatus(Math.round(vixScore), lang)
                    }
                ];

                setMarketScore(finalMarketScore);
                setTechScore(finalTechScore);
                setStockMoods(moods);

            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [basis, lang]);

    const todayScore = marketScore;

    const getMarketInsight = (score: number) => {
        if (lang === 'ko') {
            if (score < 25) return {
                title: "💎 '대바닥' (적극 매수)",
                strategy: "분할 매수 (DCA)",
                story: "시장은 극단적 공포에 빠져있습니다. 투매가 나오고 있지만, 우량주(Apple, MSFT 등)를 줍기에 가장 좋은 시기입니다."
            };
            if (score < 45) return {
                title: "📉 공포 구간 (매수 기회)",
                strategy: "저점 매수",
                story: "투자자들이 불안해하고 있습니다. VIX 지수가 상승했으나, 기업의 펀더멘털이 변하지 않았다면 저가 매수의 기회입니다."
            };
            if (score < 55) return {
                title: "⚖️ 눈치보기 장세 (중립)",
                strategy: "관망",
                story: "Fed의 금리 발표나 지표 발표를 앞두고 방향성을 탐색 중입니다. 현금을 보유하고 관망하는 것이 좋습니다."
            };
            if (score < 75) return {
                title: "📈 상승 랠리 (보유)",
                strategy: "추세 추종",
                story: "나스닥과 S&P500이 견조한 흐름을 보이고 있습니다. 포트폴리오 수익을 즐기되, 급격한 금리 인상 이슈 등을 체크하세요."
            };
            return {
                title: "🚨 버블 경보 (매도 고려)",
                strategy: "수익 실현",
                story: "시장이 너무 뜨겁습니다. 묻지마 투자가 성행하고 있습니다. 안전마진을 확보하기 위해 일부 주식을 현금화하는 것을 추천합니다."
            };
        } else {
            // English Insights
            if (score < 25) return {
                title: "💎 'Bottom Fishing' (Strong Buy)",
                strategy: "DCA (Dollar Cost Averaging)",
                story: "Extreme fear grips the market. Capitulation is happening, but it's the best time to accumulate blue-chip stocks."
            };
            if (score < 45) return {
                title: "📉 Fear Zone (Buy Opportunity)",
                strategy: "Buy the Dip",
                story: "Investors are anxious. VIX is up. If fundamentals are intact, this is a discount opportunity."
            };
            if (score < 55) return {
                title: "⚖️ Sitting on the Fence (Neutral)",
                strategy: "Wait and See",
                story: "Market is waiting for catalysts like Fed signals. Cash is king right now."
            };
            if (score < 75) return {
                title: "📈 Bull Run (Hold)",
                strategy: "Trend Following",
                story: "Nasdaq and S&P500 are strong. Enjoy the rally but keep an eye on macro risks."
            };
            return {
                title: "🚨 Bubble Alert (Take Profit)",
                strategy: "Scale Out",
                story: "The market is overheated. Euphoria is high. Consider answering to logic, not emotion, and take some chips off the table."
            };
        }
    };

    const insight = getMarketInsight(todayScore);

    return (
        <main className="min-h-screen bg-black text-white p-4 md:p-8 flex flex-col items-center">
            {/* Spacer for GlobalHeader (1.5x height) */}
            <div className="h-24 w-full" aria-hidden="true" />

            <div className="w-full max-w-6xl mb-8 flex items-center justify-between">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
                    {marketTitle}
                </h2>

                {/* Basis Toggle */}
                <div className="bg-gray-800 p-1 rounded-lg flex">
                    <button
                        onClick={() => setBasis('daily')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${basis === 'daily' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        {t.market?.dailyBasis || "Simple"}
                    </button>
                    <button
                        onClick={() => setBasis('realtime')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${basis === 'realtime' ? 'bg-rose-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        {t.market?.realtimeBasis || "Detailed"}
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="w-full max-w-4xl h-96 bg-gray-900 rounded-3xl animate-pulse"></div>
            ) : (
                <div className="w-full max-w-6xl space-y-8">
                    {/* Gauges Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Gauge
                            score={marketScore}
                            label={lang === 'ko' ? "S&P 500 심리" : "S&P 500 Sentiment"}
                            description={lang === 'ko' ? "미국 증시 전반의 투자 심리를 나타냅니다." : "Overall US Market Sentiment."}
                        />
                        <Gauge
                            score={techScore}
                            label={lang === 'ko' ? "나스닥/기술주 심리" : "Nasdaq/Tech Sentiment"}
                            description={lang === 'ko' ? "변동성이 큰 기술주 중심의 심리입니다." : "Sentiment for volatile tech stocks."}
                        />
                    </div>

                    {/* Individual Stock Analysis */}
                    <div className="bg-gray-900/50 rounded-3xl p-8 border border-gray-800">
                        <div className="flex items-center gap-3 mb-6">
                            <h3 className="text-xl font-bold text-gray-300">🏢 {t.market?.detailTitle || "Detail"}</h3>
                            <span className="text-xs px-2 py-1 rounded bg-gray-800 text-gray-400 border border-gray-700">
                                Real Data (1D)
                            </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {stockMoods.map((stock) => (
                                <div key={stock.symbol} className="bg-black/50 p-4 rounded-xl border border-gray-800 flex flex-col items-center hover:border-gray-600 transition-colors">
                                    <div className="text-lg font-bold mb-2">{stock.symbol}</div>
                                    <div className={`text-3xl font-black mb-1 ${getColor(stock.score)}`}>
                                        {stock.score}
                                    </div>
                                    <div className={`text-xs font-bold px-2 py-0.5 rounded-full mb-2 ${stock.score < 45 ? 'bg-red-900/50 text-red-500' :
                                        stock.score > 55 ? 'bg-green-900/50 text-green-500' :
                                            'bg-yellow-900/50 text-yellow-500'
                                        }`}>
                                        {stock.status}
                                    </div>
                                    <div className={`text-xs ${stock.priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {stock.priceChange >= 0 ? '+' : ''}{stock.priceChange.toFixed(2)}%
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* AI Insight Report */}
                    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl">
                        <div className="flex flex-col md:flex-row gap-6 items-start">
                            <div className="text-5xl md:text-7xl">
                                {todayScore < 45 ? '🐻' : todayScore > 55 ? '🐂' : '🦆'}
                            </div>
                            <div className="flex-1">
                                <h3 className={`text-2xl md:text-3xl font-bold mb-3 ${getColor(todayScore)}`}>{insight.title}</h3>

                                <div className="space-y-4">
                                    <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                                        <span className="text-blue-400 font-bold block mb-1">💡 {lang === 'ko' ? '추천 전략' : 'Strategy'}</span>
                                        <p className="text-gray-300 font-medium">{insight.strategy}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 font-bold block mb-2 text-sm uppercase tracking-wide">AI Commentary</span>
                                        <p className="text-gray-300 leading-relaxed text-lg">
                                            {insight.story}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
