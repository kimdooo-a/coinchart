'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { TRANSLATIONS } from '@/lib/translations';
import WhaleAlert from '@/components/Signal/WhaleAlert';

type Signal = {
    symbol: string;
    type: 'BUY' | 'SELL';
    price: number;
    timestamp: string;
    reason: string;
    strength: 'HIGH' | 'MEDIUM' | 'LOW';
};

export default function SignalPage() {
    const { lang } = useLanguage();
    const t = TRANSLATIONS[lang];
    const [signals, setSignals] = useState<Signal[]>([]);
    const [isScanning, setIsScanning] = useState(true);

    useEffect(() => {
        // Mock scanning effect
        const timer = setTimeout(() => {
            setIsScanning(false);
            setSignals([]); // Currently no signals found demo
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <main className="min-h-screen bg-black text-white p-4 md:p-8 flex flex-col items-center">
            <header className="w-full max-w-4xl mb-8 flex items-center justify-between border-b border-gray-800 pb-6">
                <div className="flex items-center gap-4">
                    <Link href="/" className="hover:opacity-80 transition-opacity">
                        <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 bg-clip-text text-transparent">
                            &larr; {t.common.back}
                        </h1>
                    </Link>
                    <h2 className="text-2xl font-bold">📡 {t.signal.title}</h2>
                </div>
                <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    <span className="text-xs text-gray-400 font-mono">{t.signal.lastScan}: {new Date().toLocaleTimeString()}</span>
                </div>
            </header>

            <div className="w-full max-w-4xl flex flex-col items-center justify-center min-h-[50vh] space-y-8">
                {isScanning ? (
                    <div className="flex flex-col items-center">
                        <div className="relative w-32 h-32 mb-8">
                            <motion.div
                                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="absolute inset-0 rounded-full border-4 border-blue-500/30"
                            ></motion.div>
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                className="absolute inset-0 rounded-full border-t-4 border-blue-500"
                            ></motion.div>
                            <div className="absolute inset-0 flex items-center justify-center font-bold text-blue-500 text-xs">
                                AI SCAN
                            </div>
                        </div>
                        <p className="text-gray-400 animate-pulse text-lg">{t.signal.scanning}</p>
                    </div>
                ) : signals.length > 0 ? (
                    <div className="w-full grid gap-4">
                        {/* Signal Card List would go here */}
                    </div>
                ) : (
                    <div className="text-center p-12 bg-gray-900/50 rounded-3xl border border-gray-800 backdrop-blur-sm max-w-lg">
                        <div className="text-6xl mb-6">🔭</div>
                        <h3 className="text-2xl font-bold mb-4 text-gray-200">{t.signal.noSignalsTitle}</h3>
                        <p className="text-gray-400 leading-relaxed">
                            {t.signal.noSignalsDesc}
                        </p>
                    </div>
                )}
            </div>

            <div className="w-full max-w-4xl mt-12 mb-12">
                <WhaleAlert />
            </div>

            <footer className="mt-auto pt-12 text-center text-xs text-gray-600 max-w-2xl px-4">
                {t.signal.footer}
            </footer>
        </main>
    );
}
