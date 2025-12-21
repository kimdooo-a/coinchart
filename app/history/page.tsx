'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { TRANSLATIONS } from '@/lib/translations';
import { COIN_INFO, COIN_HISTORY, HistoryEvent } from '@/lib/history-data';

export default function HistoryPage() {
    const { lang } = useLanguage();
    const t = TRANSLATIONS[lang];
    const [selectedCoin, setSelectedCoin] = useState('BTC');
    const [selectedEvent, setSelectedEvent] = useState<HistoryEvent | null>(null);

    const historyData = COIN_HISTORY[selectedCoin] || [];
    const coinInfo = COIN_INFO[selectedCoin];

    const getBadgeLabel = (type: HistoryEvent['type']) => {
        if (lang === 'en') {
            switch (type) {
                case 'milestone': return 'Milestone';
                case 'tech': return 'Technology';
                case 'market': return 'Market';
                case 'drama': return 'Drama';
                default: return 'Other';
            }
        }
        switch (type) {
            case 'milestone': return '역사적 사건';
            case 'tech': return '기술 혁신';
            case 'market': return '시장 이슈';
            case 'drama': return '사건/사고';
            default: return '기타';
        }
    };

    const getBadgeColor = (type: HistoryEvent['type']) => {
        switch (type) {
            case 'milestone': return 'bg-yellow-900/40 text-yellow-500 border-yellow-700';
            case 'tech': return 'bg-blue-900/40 text-blue-500 border-blue-700';
            case 'market': return 'bg-green-900/40 text-green-500 border-green-700';
            case 'drama': return 'bg-red-900/40 text-red-500 border-red-700';
        }
    };

    return (
        <main className="min-h-screen bg-black text-white p-4 md:p-8 flex flex-col items-center">
            {/* Spacer for GlobalHeader */}
            <div className="h-24 w-full" aria-hidden="true" />

            <header className="w-full max-w-4xl mb-8 flex flex-col items-center text-center gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h2 className="text-4xl md:text-5xl font-black mb-2">{t.history.title}</h2>
                    <p className="text-gray-500">{t.history.subtitle}</p>
                </motion.div>
            </header>

            {/* Coin Selector */}
            <div className="w-full max-w-4xl flex justify-center gap-4 mb-4 overflow-x-auto pb-4">
                {['BTC', 'ETH', 'SOL', 'XRP', 'BCH', 'DOGE'].map((sym) => (
                    <button
                        key={sym}
                        onClick={() => setSelectedCoin(sym)}
                        className={`px-6 py-3 rounded-2xl font-black text-xl transition-all border-2 ${selectedCoin === sym
                            ? 'bg-white text-black border-white scale-110 shadow-xl'
                            : 'bg-gray-900 text-gray-500 border-gray-800 hover:border-gray-600'
                            }`}
                    >
                        {sym}
                    </button>
                ))}
            </div>

            {/* Coin Introduction (New) */}
            {coinInfo && (
                <motion.div
                    key={selectedCoin} // Re-animate on coin change
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-4xl bg-gray-900/50 border border-gray-800 rounded-3xl p-6 md:p-8 mb-16 text-center shadow-lg"
                >
                    <h3 className="text-2xl md:text-3xl font-black text-white mb-4">
                        {lang === 'ko' ? coinInfo.titleKo : coinInfo.titleEn}
                    </h3>
                    <p className="text-gray-300 leading-relaxed md:text-lg whitespace-pre-line">
                        {lang === 'ko' ? coinInfo.descKo : coinInfo.descEn}
                    </p>
                </motion.div>
            )}

            <div className="w-full max-w-3xl relative">
                {/* Timeline Line */}
                <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-1 bg-gray-800 -translate-x-1/2"></div>

                {historyData.length > 0 ? (
                    historyData.map((event, index) => (
                        <motion.div
                            key={`${selectedCoin}-${index}`}
                            initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className={`flex flex-col md:flex-row items-center gap-8 mb-12 relative ${index % 2 === 0 ? 'md:flex-row-reverse' : ''
                                }`}
                        >
                            {/* Dot */}
                            <div className="absolute left-4 md:left-1/2 w-4 h-4 bg-blue-500 rounded-full border-4 border-black -translate-x-1/2 z-10"></div>

                            {/* Content */}
                            <div className="w-full md:w-[calc(50%-2rem)] pl-12 md:pl-0">
                                <div
                                    onClick={() => setSelectedEvent(event)}
                                    className={`bg-gray-900 p-6 rounded-3xl border border-gray-800 hover:border-gray-500 hover:bg-gray-800 transition-all cursor-pointer group ${index % 2 === 0 ? 'md:text-right' : 'md:text-left'
                                        }`}>
                                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold border mb-3 ${getBadgeColor(event.type)}`}>
                                        {getBadgeLabel(event.type)}
                                    </div>
                                    <div className="text-3xl font-black text-gray-200 mb-2 group-hover:text-white transition-colors">
                                        {event.year} <span className="text-lg text-gray-500 font-medium">.{event.month}</span>
                                    </div>
                                    <p className="text-gray-400 font-medium leading-relaxed group-hover:text-gray-300">
                                        {lang === 'ko' ? event.descKo : event.descEn}
                                    </p>
                                    <div className="mt-4 text-xs text-blue-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                        {lang === 'ko' ? '클릭하여 자세히 보기 →' : 'Click for details →'}
                                    </div>
                                </div>
                            </div>

                            {/* Empty space for alignment */}
                            <div className="hidden md:block w-[calc(50%-2rem)]"></div>
                        </motion.div>
                    ))
                ) : (
                    <div className="text-center py-20 bg-gray-900/30 rounded-3xl border-dashed border-2 border-gray-800">
                        <p className="text-gray-500">{t.history.noHistory}</p>
                    </div>
                )}

                {/* Ongoing Node */}
                <div className="flex flex-col md:flex-row items-center gap-8 mb-12 relative">
                    <div className="absolute left-4 md:left-1/2 w-4 h-4 bg-green-500 rounded-full border-4 border-black -translate-x-1/2 z-10 animate-pulse"></div>
                    <div className="w-full text-center pl-12 md:pl-0 pt-4">
                        <span className="text-green-500 font-bold tracking-widest text-xs uppercase">{t.history.ongoing}</span>
                    </div>
                </div>
            </div>

            {/* Detail Modal */}
            {selectedEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedEvent(null)}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-gray-900 border border-gray-700 rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setSelectedEvent(null)}
                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                        >
                            ✕
                        </button>

                        <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold border mb-4 ${getBadgeColor(selectedEvent.type)}`}>
                            {getBadgeLabel(selectedEvent.type)}
                        </div>

                        <h3 className="text-4xl font-black mb-1">
                            {selectedEvent.year}.{selectedEvent.month}
                        </h3>

                        <div className="prose prose-invert max-w-none mt-6">
                            <p className="text-lg text-gray-300 leading-relaxed whitespace-pre-line">
                                {lang === 'ko' ? selectedEvent.detailsKo : selectedEvent.detailsEn}
                            </p>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-800 flex justify-end">
                            <button
                                onClick={() => setSelectedEvent(null)}
                                className="px-6 py-2 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors"
                            >
                                {lang === 'ko' ? '닫기' : 'Close'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </main>
    );
}
