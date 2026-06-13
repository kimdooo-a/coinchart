'use client';

import React from 'react';
import Link from 'next/link';
import { Crown, Zap, BarChart2, Check } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function PricingPage() {
    const { lang } = useLanguage();

    const plans = [
        {
            name: lang === 'ko' ? '무료' : 'Free',
            price: lang === 'ko' ? '₩0' : '$0',
            period: lang === 'ko' ? '영구 무료' : 'Forever free',
            icon: BarChart2,
            color: 'from-gray-500 to-gray-400',
            borderColor: 'border-gray-500/20',
            features: lang === 'ko'
                ? ['기본 차트 분석', '시장 심리 지수', '뉴스 브리핑', '경제 캘린더']
                : ['Basic chart analysis', 'Market sentiment index', 'News briefing', 'Economic calendar'],
        },
        {
            name: lang === 'ko' ? '프로' : 'Pro',
            price: lang === 'ko' ? '준비 중' : 'Coming Soon',
            period: lang === 'ko' ? '출시 예정' : 'TBD',
            icon: Zap,
            color: 'from-primary to-secondary',
            borderColor: 'border-primary/30',
            features: lang === 'ko'
                ? ['프랙탈 패턴 고급 분석', '실시간 알림', '무제한 관심종목', 'AI 포지션 진단']
                : ['Advanced fractal analysis', 'Real-time alerts', 'Unlimited watchlist', 'AI position diagnosis'],
        },
        {
            name: lang === 'ko' ? '프리미엄' : 'Premium',
            price: lang === 'ko' ? '준비 중' : 'Coming Soon',
            period: lang === 'ko' ? '출시 예정' : 'TBD',
            icon: Crown,
            color: 'from-yellow-500 to-amber-500',
            borderColor: 'border-yellow-500/30',
            features: lang === 'ko'
                ? ['모든 프로 기능 포함', 'API 접근', '우선 고객 지원', '맞춤형 알림 전략']
                : ['All Pro features', 'API access', 'Priority support', 'Custom alert strategies'],
        },
    ];

    return (
        <main className="min-h-screen bg-background text-foreground relative overflow-hidden flex flex-col items-center pt-[120px] md:pt-[140px]">
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 w-full max-w-5xl px-4 py-8">
                <header className="mb-12 text-center border-b border-border pb-8">
                    <h1 className="text-3xl md:text-5xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                        {lang === 'ko' ? '요금제' : 'Pricing'}
                    </h1>
                    <p className="text-on-surface-variant text-lg">
                        {lang === 'ko'
                            ? '더 강력한 분석 도구를 위한 프리미엄 플랜을 준비 중입니다.'
                            : 'Premium plans for more powerful analysis tools are coming soon.'}
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                    {plans.map((plan) => (
                        <div
                            key={plan.name}
                            className={`bg-card border ${plan.borderColor} p-8 rounded-3xl shadow-xl transition-all hover:bg-muted/50 hover:scale-[1.02]`}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-2 rounded-xl bg-gradient-to-br ${plan.color}`}>
                                    <plan.icon className="w-5 h-5 text-on-primary" />
                                </div>
                                <h2 className="text-xl font-bold text-foreground">{plan.name}</h2>
                            </div>
                            <div className="mb-6">
                                <span className="text-3xl font-black text-foreground">{plan.price}</span>
                                <span className="text-sm text-on-surface-variant ml-2">/ {plan.period}</span>
                            </div>
                            <ul className="space-y-3">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-center gap-2 text-foreground">
                                        <Check className="w-4 h-4 text-secondary shrink-0" />
                                        <span className="text-sm">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="mt-8 text-center">
                    <Link
                        href="/"
                        className="inline-block px-10 py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full transition-all shadow-lg hover:shadow-primary/20 hover:scale-105"
                    >
                        {lang === 'ko' ? '홈으로 돌아가기' : 'Back to Home'}
                    </Link>
                </div>
            </div>
        </main>
    );
}
