'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { StockPanel } from '@/components/Analysis/StockPanel';

interface StockAnalysisPageProps {
    params: {
        symbol: string;
    };
}

export default function StockAnalysisDetailPage({ params }: StockAnalysisPageProps) {
    const { lang } = useLanguage();
    const symbol = params.symbol.toUpperCase();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return <div className="min-h-screen bg-black" />;
    }

    return (
        <main className="min-h-screen bg-black text-white p-4 md:p-8">
            {/* Spacer for GlobalHeader */}
            <div className="h-24 w-full" aria-hidden="true" />

            <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
                {/* Header */}
                <header className="border-b border-gray-800 pb-6">
                    <h1 className="text-3xl font-bold text-green-400">
                        📈 {symbol} - Stock Analysis
                    </h1>
                    <p className="text-gray-500 mt-2">
                        {lang === 'ko' ? 'Supabase SSOT 기반 분석' : 'Analysis based on Supabase SSOT'}
                    </p>
                </header>

                {/* Stock Analysis Panel */}
                <StockPanel symbol={symbol} lang={lang as 'ko' | 'en'} />
            </div>
        </main>
    );
}