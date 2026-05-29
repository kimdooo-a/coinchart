'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { TRANSLATIONS } from '@/lib/translations';
import WhaleAlert from '@/components/Signal/WhaleAlert';
import SignalCard, { Signal } from '@/components/Signal/SignalCard';

export default function SignalPage() {
    const { lang } = useLanguage();
    const t = TRANSLATIONS[lang];
    const [signals, setSignals] = useState<Signal[]>([]);
    const [isScanning, setIsScanning] = useState(true);

    useEffect(() => {
        // /api/signals 엔드포인트에서 실제 시그널 데이터를 가져온다
        let cancelled = false;

        async function fetchSignals() {
            setIsScanning(true);
            try {
                const res = await fetch('/api/signals');
                if (!res.ok) {
                    // HTTP 에러 응답 — 빈 상태로 유지
                    console.error('[SignalPage] /api/signals 응답 오류:', res.status, res.statusText);
                    if (!cancelled) {
                        setSignals([]);
                        setIsScanning(false);
                    }
                    return;
                }
                // API 응답 형식: { signals: Signal[] }
                const data: { signals: Signal[] } = await res.json();
                if (!cancelled) {
                    setSignals(Array.isArray(data.signals) ? data.signals : []);
                    setIsScanning(false);
                }
            } catch (err) {
                // 네트워크 오류 등 — UI가 깨지지 않도록 빈 상태로 처리
                console.error('[SignalPage] 시그널 fetch 실패:', err);
                if (!cancelled) {
                    setSignals([]);
                    setIsScanning(false);
                }
            }
        }

        fetchSignals();

        // 언마운트 시 상태 업데이트 방지
        return () => { cancelled = true; };
    }, []);

    return (
        <main className="flex-1 w-full pt-20 pb-12 px-4 md:px-6 flex flex-col items-center">

            <header className="w-full max-w-4xl mb-8 flex items-center justify-between border-b border-border pb-6">
                <div>
                    <h2 className="text-2xl font-bold">📡 {t.signal.title}</h2>
                </div>
                <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    <span className="text-xs text-on-surface-variant font-mono">{t.signal.lastScan}: {new Date().toLocaleTimeString()}</span>
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
                                className="absolute inset-0 rounded-full border-t-4 border-primary"
                            ></motion.div>
                            <div className="absolute inset-0 flex items-center justify-center font-bold text-primary text-xs">
                                SIGNAL SCAN
                            </div>
                        </div>
                        <p className="text-on-surface-variant animate-pulse text-lg">{t.signal.scanning}</p>
                    </div>
                ) : signals.length > 0 ? (
                    <div className="w-full grid gap-4">
                        {/* 신호 카드 리스트 — score 내림차순으로 정렬된 API 응답을 그대로 표시 */}
                        {signals.map((signal, idx) => (
                            <SignalCard
                                key={`${signal.symbol}-${signal.type}-${signal.timestamp}-${idx}`}
                                signal={signal}
                                index={idx}
                                lang={lang}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center p-12 bg-card/50 rounded-3xl border border-border backdrop-blur-sm max-w-lg">
                        <div className="text-6xl mb-6">🔭</div>
                        <h3 className="text-2xl font-bold mb-4 text-on-surface">{t.signal.noSignalsTitle}</h3>
                        <p className="text-on-surface-variant leading-relaxed">
                            {t.signal.noSignalsDesc}
                        </p>
                    </div>
                )}
            </div>

            <div className="w-full max-w-4xl mt-12 mb-12">
                <WhaleAlert />
            </div>

            <footer className="mt-auto pt-12 text-center text-xs text-on-surface-variant max-w-2xl px-4">
                {t.signal.footer}
            </footer>
        </main>
    );
}
