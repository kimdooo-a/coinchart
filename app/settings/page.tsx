'use client';

import React from 'react';
import Link from 'next/link';
import { Settings, Bell, Shield, Palette } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function SettingsPage() {
    const { lang } = useLanguage();

    const settingsGroups = [
        {
            icon: Bell,
            title: lang === 'ko' ? '알림 설정' : 'Notification Settings',
            description: lang === 'ko' ? '이메일 및 푸시 알림을 관리합니다.' : 'Manage email and push notifications.',
        },
        {
            icon: Shield,
            title: lang === 'ko' ? '보안 설정' : 'Security Settings',
            description: lang === 'ko' ? '비밀번호 및 2단계 인증을 관리합니다.' : 'Manage password and 2FA.',
        },
        {
            icon: Palette,
            title: lang === 'ko' ? '테마 설정' : 'Theme Settings',
            description: lang === 'ko' ? '화면 테마 및 언어를 설정합니다.' : 'Configure display theme and language.',
        },
    ];

    return (
        <main className="min-h-screen bg-background text-foreground relative overflow-hidden flex flex-col items-center pt-[120px] md:pt-[140px]">
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 w-full max-w-4xl px-4 py-8">
                <header className="mb-12 text-center border-b border-white/10 pb-8">
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <Settings className="w-10 h-10 text-blue-400" />
                        <h1 className="text-3xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-cyan-500">
                            {lang === 'ko' ? '설정' : 'Settings'}
                        </h1>
                    </div>
                    <p className="text-muted-foreground text-lg">
                        {lang === 'ko' ? '계정 및 서비스 설정을 관리합니다.' : 'Manage your account and service settings.'}
                    </p>
                </header>

                <div className="space-y-6">
                    {settingsGroups.map((group) => (
                        <section
                            key={group.title}
                            className="bg-card/30 backdrop-blur-md border border-white/10 p-8 rounded-3xl shadow-xl transition-all hover:bg-card/40"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <group.icon className="w-6 h-6 text-blue-400" />
                                <h2 className="text-2xl font-bold text-foreground">{group.title}</h2>
                            </div>
                            <p className="text-gray-300 leading-relaxed">{group.description}</p>
                            <p className="mt-4 text-sm text-muted-foreground italic">
                                {lang === 'ko' ? '구현 예정입니다.' : 'Coming soon.'}
                            </p>
                        </section>
                    ))}
                </div>

                <div className="mt-16 text-center">
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
