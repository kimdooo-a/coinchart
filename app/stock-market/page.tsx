'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { TRANSLATIONS } from '@/lib/translations';
import { calculateRSI } from '@/lib/indicators';
import { InvestmentQuotes } from '@/components/Stock/InvestmentQuotes';
import { StockRSIHeatmap } from '@/components/Stock/StockRSIHeatmap';
import { TOP_US_STOCKS } from '@/lib/constants';

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
        <div className="bg-card rounded-3xl p-8 border border-border shadow-md flex flex-col items-center relative overflow-hidden w-full">
            <div className="absolute top-0 w-full h-2 bg-gradient-to-r from-destructive via-yellow-500 to-green-500 opacity-60"></div>
            <h3 className="text-muted-foreground mb-6 text-xl font-bold">{label}</h3>

            <div className="relative w-64 h-32 overflow-hidden mb-4">
                <div className="absolute top-0 left-0 w-full h-64 rounded-full border-[20px] border-muted box-border"></div>
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

            <p className="text-muted-foreground mt-6 text-sm text-center">
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
                const res = await fetch(`/api/stock/history?symbol=${symbol}&interval=1d&limit=30`);
                if (!res.ok) return [];
                const json = await res.json();
                return json || []; // Array of { close, ... }
            } catch (e) {
                console.error(`Failed to fetch ${symbol}`, e);
                return [];
            }
        };

        const fetchData = async () => {
            try {
                // 1. Fetch SPY, QQQ, VIX for Summary Gauges
                const [spyData, qqqData, vixData] = await Promise.all([
                    fetchHistory('SPY'),
                    fetchHistory('QQQ'),
                    fetchHistory('VIX')
                ]);

                // 2. Fetch Individual Top Stocks
                const stockPromises = TOP_US_STOCKS.map(async (stock) => {
                    const data = await fetchHistory(stock.symbol);
                    if (!data || data.length < 15) return null;

                    const closes = data.map((d: any) => d.close);
                    const rsiArr = calculateRSI(closes, 14);
                    const currentRSI = rsiArr[rsiArr.length - 1] || 50;

                    // Calc price change
                    const last = data[data.length - 1].close;
                    const prev = data[data.length - 2].close;
                    const change = ((last - prev) / prev) * 100;

                    return {
                        symbol: stock.symbol,
                        score: Math.round(currentRSI),
                        priceChange: change,
                        status: getStatus(Math.round(currentRSI), lang)
                    };
                });

                const stockResults = await Promise.all(stockPromises);
                const validStocks = stockResults.filter(s => s !== null) as StockMood[];


                if (!spyData.length || !vixData.length) {
                    console.warn("No data for SPY/VIX");
                    setLoading(false);
                    // Fallback 
                    if (stockMoods.length === 0 && validStocks.length > 0) {
                        setStockMoods(validStocks);
                    }
                    return;
                }

                // Prepare Gauges Data
                const spyCloses = spyData.map((d: any) => d.close);
                const qqqCloses = qqqData.map((d: any) => d.close);

                const currentVix = vixData[vixData.length - 1].close; // VIX is non-cumulative, just get latest

                // --- CALCULATION ---

                // 1. VIX Score (Fear Indicator)
                // Normalize VIX: 10 (Greed) to 40 (Fear). Inverted scale. 
                const vixScoreRaw = 100 - ((currentVix - 10) / (40 - 10) * 100);
                const vixScore = Math.max(0, Math.min(100, vixScoreRaw));

                // 2. SPY RSI
                const spyRSIArray = calculateRSI(spyCloses, 14);
                const currentSpyRSI = spyRSIArray[spyRSIArray.length - 1] || 50;

                // 3. Market Score
                const finalMarketScore = Math.round((vixScore + currentSpyRSI) / 2);

                // 4. Tech Score
                const qqqRSIArray = calculateRSI(qqqCloses, 14);
                const currentQqqRSI = qqqRSIArray[qqqRSIArray.length - 1] || 50;
                const finalTechScore = Math.round((vixScore + currentQqqRSI) / 2);

                setMarketScore(finalMarketScore);
                setTechScore(finalTechScore);

                // Combined list: Indices + Top Stocks

                const spyMood = {
                    symbol: 'SPY',
                    score: Math.round(currentSpyRSI),
                    priceChange: ((spyCloses[spyCloses.length - 1] - spyCloses[spyCloses.length - 2]) / spyCloses[spyCloses.length - 2]) * 100,
                    status: getStatus(Math.round(currentSpyRSI), lang)
                };
                const qqqMood = {
                    symbol: 'QQQ',
                    score: Math.round(currentQqqRSI),
                    priceChange: ((qqqCloses[qqqCloses.length - 1] - qqqCloses[qqqCloses.length - 2]) / qqqCloses[qqqCloses.length - 2]) * 100,
                    status: getStatus(Math.round(currentQqqRSI), lang)
                };

                setStockMoods([spyMood, qqqMood, ...validStocks]);

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
        <main className="min-h-screen bg-background text-foreground p-4 md:p-8 flex flex-col items-center">
            {/* Spacer for GlobalHeader (1.5x height) */}
            <div className="h-24 w-full" aria-hidden="true" />

            <div className="w-full max-w-6xl mb-8 flex items-center justify-between">
                <h2 className="text-3xl font-bold text-foreground">
                    {marketTitle}
                </h2>

                {/* Basis Toggle */}
                <div className="bg-muted p-1 rounded-lg flex">
                    <button
                        onClick={() => setBasis('daily')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${basis === 'daily' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        {t.market?.dailyBasis || "Simple"}
                    </button>
                    <button
                        onClick={() => setBasis('realtime')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${basis === 'realtime' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        {t.market?.realtimeBasis || "Detailed"}
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="w-full max-w-4xl h-96 bg-muted rounded-3xl animate-pulse"></div>
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
                    <div className="bg-card rounded-3xl p-8 border border-border">
                        <div className="flex items-center gap-3 mb-6">
                            <h3 className="text-xl font-bold text-foreground">🏢 {t.market?.detailStockTitle || t.market?.detailTitle || "Stock Details"}</h3>
                            <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground border border-border">
                                Real Data (1D)
                            </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {stockMoods.map((stock) => (
                                <div key={stock.symbol} className="bg-muted/50 p-4 rounded-xl border border-border flex flex-col items-center hover:border-primary/50 transition-colors">
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
                    <div className="bg-card border border-border rounded-3xl p-8 shadow-2xl">
                        <div className="flex flex-col md:flex-row gap-6 items-start">
                            <div className="text-5xl md:text-7xl">
                                {todayScore < 45 ? '🐻' : todayScore > 55 ? '🐂' : '🦆'}
                            </div>
                            <div className="flex-1">
                                <h3 className={`text-2xl md:text-3xl font-bold mb-3 ${getColor(todayScore)}`}>{insight.title}</h3>

                                <div className="space-y-4">
                                    <div className="bg-muted/50 p-4 rounded-xl border border-border">
                                        <span className="text-primary font-bold block mb-1">💡 {lang === 'ko' ? '추천 전략' : 'Strategy'}</span>
                                        <p className="text-foreground font-medium">{insight.strategy}</p>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground font-bold block mb-2 text-sm uppercase tracking-wide">Market Commentary</span>
                                        <p className="text-muted-foreground leading-relaxed text-lg">
                                            {insight.story}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* NEW: Investment Quotes & RSI Heatmap */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <InvestmentQuotes />
                        <StockRSIHeatmap />
                    </div>
                </div>
            )}
        </main>
    );
}
