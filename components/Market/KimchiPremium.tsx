'use client';

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';

type KimchiData = {
    symbol: string;
    krwPrice: number;
    usdPrice: number;
    premium: number;
    exchangeRate: number;
};

export default function KimchiPremium() {
    const { lang } = useLanguage();
    const [data, setData] = useState<KimchiData[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchKimchi = async () => {
        try {
            const res = await fetch('/api/kimchi');
            const json = await res.json();
            if (json.data) {
                setData(json.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKimchi();
        const interval = setInterval(fetchKimchi, 10000); // Update every 10s
        return () => clearInterval(interval);
    }, []);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat(lang === 'ko' ? 'ko-KR' : 'en-US').format(price);
    };

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            {/* Decor */}
            <div className="absolute top-0 right-0 p-8 opacity-5 font-black text-8xl pointer-events-none select-none">
                K-PREMIUM
            </div>

            <div className="flex items-center justify-between mb-6 relative z-10">
                <div>
                    <h3 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                        🇰🇷 {lang === 'ko' ? '김치 프리미엄' : 'Kimchi Premium'}
                    </h3>
                    <p className="text-gray-500 text-sm mt-1">
                        {lang === 'ko' ? '업비트 vs 바이낸스 가격 차이 (실시간)' : 'Upbit (KR) vs Binance (Global) Price Gap'}
                    </p>
                </div>
                {data.length > 0 && (
                    <div className="text-right hidden md:block">
                        <div className="text-xs text-gray-500">USD/KRW</div>
                        <div className="font-mono font-bold text-blue-400">₩{formatPrice(data[0].exchangeRate)}</div>
                    </div>
                )}
            </div>

            <div className="overflow-x-auto relative z-10">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-gray-400 text-xs font-semibold uppercase tracking-wider border-b border-gray-800">
                            <th className="py-3 pl-2">Coin</th>
                            <th className="py-3 text-right">Premium</th>
                            <th className="py-3 text-right hidden md:table-cell">Upbit (KRW)</th>
                            <th className="py-3 text-right hidden md:table-cell">Global ($)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            [1, 2, 3, 4, 5].map((i) => (
                                <tr key={i} className="animate-pulse">
                                    <td className="py-4"><div className="h-4 w-12 bg-gray-800 rounded"></div></td>
                                    <td className="py-4"><div className="h-4 w-16 bg-gray-800 rounded ml-auto"></div></td>
                                    <td className="py-4 hidden md:table-cell"><div className="h-4 w-24 bg-gray-800 rounded ml-auto"></div></td>
                                    <td className="py-4 hidden md:table-cell"><div className="h-4 w-24 bg-gray-800 rounded ml-auto"></div></td>
                                </tr>
                            ))
                        ) : (
                            data.map((item) => (
                                <tr key={item.symbol} className="border-b border-gray-800/50 hover:bg-white/5 transition-colors">
                                    <td className="py-3 pl-2 font-bold text-base">{item.symbol}</td>
                                    <td className="py-3 text-right">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${item.premium > 5 ? 'bg-red-900/50 text-red-500' :
                                            item.premium > 2 ? 'bg-orange-900/50 text-orange-500' :
                                                item.premium < 0 ? 'bg-blue-900/50 text-blue-400' :
                                                    'bg-green-900/50 text-green-500'
                                            }`}>
                                            {item.premium > 0 ? '+' : ''}{item.premium.toFixed(2)}%
                                        </span>
                                    </td>
                                    <td className="py-3 text-right font-mono text-gray-300 hidden md:table-cell">
                                        ₩{formatPrice(item.krwPrice)}
                                    </td>
                                    <td className="py-3 text-right font-mono text-gray-500 hidden md:table-cell">
                                        ${item.usdPrice.toFixed(2)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 text-xs text-gray-600 text-center">
                * {lang === 'ko' ? '환율 및 거래소 가격 변동에 따라 오차가 있을 수 있습니다.' : 'Prices may vary due to exchange rate volatility.'}
            </div>
        </div>
    );
}
