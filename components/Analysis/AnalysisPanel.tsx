'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { CandleData, getKlines } from '@/lib/api/binance';
import { analyzeMarket } from '@/lib/analysis';
import { TradingStrategyGuide } from './TradingStrategyGuide';

interface Props {
    symbol: string;
    lang: 'en' | 'ko';
}

const ANALYSIS_INTERVALS = ['1h', '4h', '1d', '1w', '1M'];

export const AnalysisPanel: React.FC<Props> = ({ symbol, lang }) => {
    const [candles, setCandles] = useState<CandleData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [interval, setInterval] = useState('1d');
    const [isGuideOpen, setIsGuideOpen] = useState(false);

    useEffect(() => {
        const fetchAnalysisData = async () => {
            setIsLoading(true);
            setCandles([]);
            try {
                const data = await getKlines(symbol, interval, 500);
                setCandles(data);
            } catch (e) { console.error(e); } finally { setIsLoading(false); }
        };
        fetchAnalysisData();
    }, [symbol, interval]);

    const analysis = useMemo(() => {
        if (!candles || candles.length === 0) return null;
        return analyzeMarket(candles, { lang });
    }, [candles, lang]);

    const t = {
        title: lang === 'ko' ? '⚡ 인공지능 정밀 분석' : '⚡ Advanced AI Analytics',
        basis: lang === 'ko' ? '분석 기준:' : 'Analysis Basis:',
        winRate: lang === 'ko' ? '상승 확률' : 'Rise Prob.',
        loading: lang === 'ko' ? '데이터 분석 중...' : 'Analyzing Data...',
        noData: lang === 'ko' ? '데이터가 없습니다.' : 'No data available.',
        footer: lang === 'ko'
            ? `* 상승 확률은 최근 500개의 ${interval} 데이터 중 현재와 같은 신호가 떴을 때, 3${interval} 뒤 실제로 가격이 올랐던 비율입니다.`
            : `* Rise Prob. = % of time price rose after this signal (based on last 500 candles).`,
        guideTitle: lang === 'ko' ? '📊 지표 설명서 (클릭하여 열기/닫기)' : '📊 Indicator Guide (Click to toggle)',
        descriptions: lang === 'ko' ? {
            RSI: '상대강도지수. 30 이하(과매도)면 매수 기회, 70 이상(과매수)이면 매도 신호로 봅니다.',
            Stochastic: '스토캐스틱. 현재 주가가 가격 범위 중 어디에 있는지 봅니다. K선이 D선을 상향 돌파하면 매수입니다.',
            CCI: '가격이 평균과 얼마나 떨어져 있는지 봅니다. -100 이하면 저평가(매수), +100 이상이면 고평가(매도)입니다.',
            Williams: '윌리엄스 %R. 과매수/과매도를 판단합니다. -80 이하는 강력한 매수 구간입니다.',
            MACD: '이동평균 수렴확산. 막대(히스토그램)가 0 위로 올라오면 상승 추세 시작으로 봅니다.',
            Bollinger: '볼린저 밴드. 가격은 밴드 안에서 움직이는 경향이 있습니다. 하단 밴드 터치는 지지(매수)로 봅니다.'
        } : {
            RSI: 'Relative Strength Index. Below 30 is Oversold (Buy), Above 70 is Overbought (Sell).',
            Stochastic: 'Momentum indicator comparing closing price to a range of prices. Golden cross is Buy.',
            CCI: 'Measures deviation from statistical average. Below -100 implies undervalued (Buy).',
            Williams: 'Williams %R. Momentum indicator. Below -80 is considered strong Oversold zone.',
            MACD: 'Trend-following momentum. Histogram crossing above 0 indicates bullish trend start.',
            Bollinger: 'Volatility bands. Price tends to return to middle. Lower band touch acts as support (Buy).'
        }
    };

    const getRecColor = (rec: string) => {
        if (rec.includes('STRONG BUY') || rec.includes('강력 매수')) return 'text-green-400 border-green-500 bg-green-900/20';
        if (rec.includes('BUY') || rec.includes('매수')) return 'text-green-300 border-green-500/50 bg-green-900/10';
        if (rec.includes('STRONG SELL') || rec.includes('강력 매도')) return 'text-red-400 border-red-500 bg-red-900/20';
        if (rec.includes('SELL') || rec.includes('매도')) return 'text-red-300 border-red-500/50 bg-red-900/10';
        return 'text-gray-400 border-gray-600 bg-gray-800';
    };

    const getSignalColor = (sig: string) => {
        if (sig === 'BUY' || sig === '매수') return 'text-green-400';
        if (sig === 'SELL' || sig === '매도') return 'text-red-400';
        return 'text-gray-500';
    };

    return (
        <div className="bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-800 shadow-xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div className="w-full md:w-auto">
                    <h3 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                        {t.title}
                    </h3>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2">
                        <span className="text-sm text-gray-400">{t.basis}</span>
                        <div className="flex bg-gray-800 rounded p-1 gap-1 self-start">
                            {ANALYSIS_INTERVALS.map(int => (
                                <button
                                    key={int}
                                    onClick={() => setInterval(int)}
                                    className={`px-3 py-1 rounded text-xs font-bold transition-all ${interval === int
                                        ? 'bg-blue-600 text-white shadow'
                                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                                        }`}
                                >
                                    {int.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {analysis && (
                    <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                        <div className={`px-6 py-3 md:px-8 md:py-4 rounded-xl text-xl md:text-2xl font-black tracking-widest border-2 ${getRecColor(analysis.recommendation)} shadow-2xl w-full md:w-auto text-center`}>
                            {analysis.recommendation}
                        </div>
                        {/* Win/Loss Rate Display */}
                        {analysis.winRate !== undefined && (
                            <div className="flex items-center gap-3 bg-gray-800/50 px-4 py-2 rounded-xl border border-gray-700">
                                <div className="flex flex-col items-center">
                                    <span className="text-[10px] text-gray-400 uppercase tracking-wider">상승 확률 (RISE)</span>
                                    <span className="text-lg font-bold text-green-400">{analysis.winRate}%</span>
                                </div>
                                <div className="h-8 w-px bg-gray-600"></div>
                                <div className="flex flex-col items-center">
                                    <span className="text-[10px] text-gray-400 uppercase tracking-wider">하락 확률 (DROP)</span>
                                    <span className="text-lg font-bold text-red-400">{analysis.lossRate}%</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Expandable Guide */}
            <div className="mb-6">
                <button
                    onClick={() => setIsGuideOpen(!isGuideOpen)}
                    className="text-sm text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                    <span className={`transform transition-transform ${isGuideOpen ? 'rotate-90' : ''}`}>▶</span>
                    {t.guideTitle}
                </button>

                {isGuideOpen && (
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-950 p-4 rounded-lg border border-gray-800 text-xs text-gray-400">
                        <div><span className="text-blue-400 font-bold">RSI (14)</span>: {t.descriptions.RSI}</div>
                        <div><span className="text-blue-400 font-bold">Stoch (14,3)</span>: {t.descriptions.Stochastic}</div>
                        <div><span className="text-blue-400 font-bold">CCI (20)</span>: {t.descriptions.CCI}</div>
                        <div><span className="text-blue-400 font-bold">Will %R</span>: {t.descriptions.Williams}</div>
                        <div><span className="text-blue-400 font-bold">MACD</span>: {t.descriptions.MACD}</div>
                        <div><span className="text-blue-400 font-bold">Bollinger</span>: {t.descriptions.Bollinger}</div>
                    </div>
                )}
            </div>

            {isLoading ? (
                <div className="animate-pulse">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-32 bg-gray-800 rounded mx-auto w-full"></div>
                        ))}
                    </div>
                </div>
            ) : analysis ? (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {analysis.indicators.map((ind, idx) => (
                            <div key={idx} className="bg-gray-950 rounded-lg p-4 border border-gray-800 hover:border-blue-500/30 transition-colors">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-gray-300">{ind.name}</span>
                                    <span className={`font-black ${getSignalColor(ind.signal)}`}>{ind.signal}</span>
                                </div>

                                <div className="flex justify-between items-end mb-3">
                                    <div className="text-sm text-gray-500">
                                        Val: <span className="text-gray-300 font-mono">{ind.value}</span>
                                    </div>
                                    <div className="text-xs text-gray-500">{ind.message}</div>
                                </div>

                                <div className="bg-gray-900 rounded p-2 flex justify-between items-center">
                                    <span className="text-xs text-gray-500">{t.winRate}</span>
                                    <span className={`text-sm font-bold ${ind.winRate > 60 ? 'text-yellow-400' : 'text-gray-400'}`}>
                                        {ind.winRate}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 text-xs text-gray-600 text-center">
                        {t.footer}
                    </div>
                </>
            ) : (
                <div className="text-center text-gray-500 py-10">
                    {t.noData}
                </div>
            )}


            <TradingStrategyGuide
                currentPrice={candles.length > 0 ? candles[candles.length - 1].close : 0}
                lang={lang}
                analysis={analysis}
            />
        </div>
    );
};
