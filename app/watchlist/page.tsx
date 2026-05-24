'use client';

import React from 'react';
import Link from 'next/link';
import { Star, TrendingUp, Bell } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function WatchlistPage() {
    const { lang } = useLanguage();

    return (
        <main className="min-h-screen bg-background text-foreground relative overflow-hidden flex flex-col items-center pt-[120px] md:pt-[140px]">
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-yellow-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/10 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 w-full max-w-4xl px-4 py-8">
                <header className="mb-12 text-center border-b border-border pb-8">
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <Star className="w-10 h-10 text-yellow-400" />
                        <h1 className="text-3xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-yellow-500 to-amber-500">
                            {lang === 'ko' ? '관심종목' : 'Watchlist'}
                        </h1>
                    </div>
                    <p className="text-muted-foreground text-lg">
                        {lang === 'ko' ? '관심 있는 코인과 주식을 모아서 관리합니다.' : 'Track your favorite coins and stocks.'}
                    </p>
                </header>

                <div className="space-y-6">
                    <section className="bg-card/30 backdrop-blur-md border border-border p-8 rounded-3xl shadow-xl text-center">
                        <div className="flex justify-center gap-6 mb-8">
                            <div className="p-4 bg-yellow-500/10 rounded-2xl border border-yellow-500/20">
                                <Star className="w-8 h-8 text-yellow-400" />
                            </div>
                            <div className="p-4 bg-green-500/10 rounded-2xl border border-green-500/20">
                                <TrendingUp className="w-8 h-8 text-green-400" />
                            </div>
                            <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                                <Bell className="w-8 h-8 text-blue-400" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-foreground mb-4">
                            {lang === 'ko' ? '관심종목 기능 준비 중' : 'Watchlist Coming Soon'}
                        </h2>
                        <p className="text-foreground leading-relaxed max-w-lg mx-auto">
                            {lang === 'ko'
                                ? '코인과 주식을 즐겨찾기하고, 실시간 가격 변동 알림을 받을 수 있는 기능을 준비하고 있습니다.'
                                : 'We are preparing a feature to bookmark coins and stocks and receive real-time price alerts.'}
                        </p>
                    </section>
                </div>

                <div className="mt-16 text-center">
                    <Link
                        href="/analysis"
                        className="inline-block px-10 py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full transition-all shadow-lg hover:shadow-primary/20 hover:scale-105"
                    >
                        {lang === 'ko' ? '분석 페이지로 이동' : 'Go to Analysis'}
                    </Link>
                </div>
            </div>
        </main>
    );
}
