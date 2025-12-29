'use client';

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { calculateRSI } from '@/lib/indicators';

// Representative Sector ETFs
const SECTOR_ETFS = [
    { symbol: 'XLK', name: 'Technology', nameKo: '기술주' },
    { symbol: 'XLF', name: 'Financial', nameKo: '금융주' },
    { symbol: 'XLV', name: 'Healthcare', nameKo: '헬스케어' },
    { symbol: 'XLE', name: 'Energy', nameKo: '에너지' },
    { symbol: 'XLY', name: 'Cons. Disc.', nameKo: '경기소비재' },
    { symbol: 'XLP', name: 'Cons. Stap.', nameKo: '필수소비재' },
    { symbol: 'XLI', name: 'Industrial', nameKo: '산업재' },
    { symbol: 'XLB', name: 'Materials', nameKo: '소재' },
    { symbol: 'XLC', name: 'Comm.', nameKo: '커뮤니케이션' },
    { symbol: 'XLRE', name: 'Real Estate', nameKo: '부동산' },
];

type SectorData = {
    symbol: string;
    price: number;
    change: number;
    rsi: number;
    status: string;
};

export const StockSectorPerformance: React.FC = () => {
    const { lang } = useLanguage();
    const [data, setData] = useState<SectorData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSectors = async () => {
            const promises = SECTOR_ETFS.map(async (sector) => {
                try {
                    const res = await fetch(`/api/stock/history?symbol=${sector.symbol}&interval=1d&limit=20`);
                    if (!res.ok) return null;
                    const json = await res.json();
                    if (!json || json.length < 2) return null;

                    const closes = json.map((d: any) => d.close);
                    const currentPrice = closes[closes.length - 1];
                    const prevPrice = closes[closes.length - 2];
                    const change = ((currentPrice - prevPrice) / prevPrice) * 100;

                    const rsiArr = calculateRSI(closes, 14);
                    const rsi = rsiArr[rsiArr.length - 1] || 50;

                    return {
                        symbol: sector.symbol,
                        price: currentPrice,
                        change,
                        rsi,
                        status: rsi > 70 ? 'HOT' : rsi < 30 ? 'COLD' : 'NEUTRAL'
                    };
                } catch (e) {
                    console.error(e);
                    return null;
                }
            });

            const results = await Promise.all(promises);
            const validData = results.filter(r => r !== null) as SectorData[];

            // Sort by Performance (Change %)
            validData.sort((a, b) => b.change - a.change);
            setData(validData);
            setLoading(false);
        };

        fetchSectors();
    }, []);

    const getStatusColor = (rsi: number) => {
        if (rsi >= 70) return 'text-red-500';
        if (rsi <= 30) return 'text-green-500';
        return 'text-muted-foreground';
    };

    const getRowColor = (change: number) => {
        if (change > 0) return 'bg-green-500/10 hover:bg-green-500/20';
        if (change < 0) return 'bg-red-500/10 hover:bg-red-500/20';
        return 'bg-card hover:bg-muted';
    };

    return (
        <div className="bg-card border border-border rounded-xl p-6 shadow-xl h-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-foreground">
                    📊 {lang === 'ko' ? '섹터별 퍼포먼스' : 'Sector Performance'}
                </h3>
            </div>

            {loading ? (
                <div className="space-y-2 animate-pulse">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-10 bg-muted rounded"></div>
                    ))}
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                            <tr>
                                <th className="px-3 py-2 rounded-l-lg">Sector</th>
                                <th className="px-3 py-2">Price</th>
                                <th className="px-3 py-2">Chg %</th>
                                <th className="px-3 py-2 rounded-r-lg">RSI</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {data.map((item) => {
                                const sectorInfo = SECTOR_ETFS.find(s => s.symbol === item.symbol);
                                return (
                                    <tr key={item.symbol} className={`${getRowColor(item.change)} transition-colors`}>
                                        <td className="px-3 py-3 font-medium text-foreground">
                                            <div className="flex flex-col">
                                                <span>{lang === 'ko' ? sectorInfo?.nameKo : sectorInfo?.name}</span>
                                                <span className="text-xs text-muted-foreground">{item.symbol}</span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 text-foreground">${item.price.toFixed(2)}</td>
                                        <td className={`px-3 py-3 font-bold ${item.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {item.change > 0 ? '+' : ''}{item.change.toFixed(2)}%
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="flex items-center gap-2">
                                                <span className={`font-bold ${getStatusColor(item.rsi)}`}>
                                                    {item.rsi.toFixed(0)}
                                                </span>
                                                <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${item.rsi > 70 ? 'bg-red-500' : item.rsi < 30 ? 'bg-green-500' : 'bg-blue-500'}`}
                                                        style={{ width: `${item.rsi}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
