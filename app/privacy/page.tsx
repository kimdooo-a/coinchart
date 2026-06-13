'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

export default function PrivacyPage() {
    const { lang } = useLanguage();

    return (
        <main className="min-h-screen bg-background text-foreground relative overflow-hidden flex flex-col items-center pt-[120px] md:pt-[140px]">
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 w-full max-w-4xl px-4 py-8">
                <header className="mb-12 text-center border-b border-border pb-8">
                    <h1 className="text-3xl md:text-5xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                        {lang === 'ko' ? '개인정보처리방침' : 'Privacy Policy'}
                    </h1>
                    <p className="text-on-surface-variant text-lg">
                        {lang === 'ko' ? 'ChartMaster의 개인정보 수집 및 이용에 관한 정책입니다.' : 'Our policy on collecting and using personal information.'}
                    </p>
                </header>

                <div className="space-y-8">
                    <section className="bg-card border border-border p-8 rounded-3xl shadow-xl transition-all hover:bg-muted/50">
                        <h2 className="text-2xl font-bold text-foreground mb-4">
                            {lang === 'ko' ? '제 1 조 (개인정보의 수집 항목)' : 'Article 1 (Personal Information Collected)'}
                        </h2>
                        <p className="text-foreground leading-relaxed">
                            {lang === 'ko'
                                ? '회사는 서비스 제공을 위해 다음과 같은 최소한의 개인정보를 수집합니다: 이메일 주소, Google 계정 프로필 정보 (이름, 프로필 사진). 이러한 정보는 Google OAuth를 통한 소셜 로그인 시 자동으로 수집됩니다.'
                                : 'We collect minimal personal information for service provision: email address, Google account profile (name, profile picture). This information is automatically collected during Google OAuth sign-in.'}
                        </p>
                    </section>

                    <section className="bg-card border border-border p-8 rounded-3xl shadow-xl transition-all hover:bg-muted/50">
                        <h2 className="text-2xl font-bold text-foreground mb-4">
                            {lang === 'ko' ? '제 2 조 (개인정보의 이용 목적)' : 'Article 2 (Purpose of Use)'}
                        </h2>
                        <ul className="list-disc pl-5 space-y-3 text-foreground leading-relaxed">
                            <li>{lang === 'ko' ? '회원 식별 및 가입 의사 확인' : 'Member identification and registration verification'}</li>
                            <li>{lang === 'ko' ? '포트폴리오, 보안 메모 등 개인화 서비스 제공' : 'Personalized services including portfolio and secure memos'}</li>
                            <li>{lang === 'ko' ? '서비스 이용 통계 및 개선' : 'Service usage statistics and improvement'}</li>
                        </ul>
                    </section>

                    <section className="bg-card border border-border p-8 rounded-3xl shadow-xl transition-all hover:bg-muted/50">
                        <h2 className="text-2xl font-bold text-foreground mb-4">
                            {lang === 'ko' ? '제 3 조 (개인정보의 보유 기간)' : 'Article 3 (Retention Period)'}
                        </h2>
                        <p className="text-foreground leading-relaxed">
                            {lang === 'ko'
                                ? '수집된 개인정보는 회원 탈퇴 시 즉시 파기됩니다. 단, 관련 법령에 의해 보존할 필요가 있는 경우 해당 기간 동안 보관합니다.'
                                : 'Collected personal information is immediately destroyed upon withdrawal. However, if required by law, it will be retained for the applicable period.'}
                        </p>
                    </section>

                    <section className="bg-card border border-border p-8 rounded-3xl shadow-xl transition-all hover:bg-muted/50">
                        <h2 className="text-2xl font-bold text-foreground mb-4">
                            {lang === 'ko' ? '제 4 조 (개인정보의 제3자 제공)' : 'Article 4 (Third-Party Disclosure)'}
                        </h2>
                        <p className="text-foreground leading-relaxed">
                            {lang === 'ko'
                                ? '회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 이용자의 동의가 있거나 법률의 규정에 의한 경우는 예외로 합니다.'
                                : 'In principle, we do not provide personal information to third parties, except with user consent or as required by law.'}
                        </p>
                    </section>

                    <section className="bg-card border border-border p-8 rounded-3xl shadow-xl transition-all hover:bg-muted/50">
                        <h2 className="text-2xl font-bold text-foreground mb-4">
                            {lang === 'ko' ? '제 5 조 (문의처)' : 'Article 5 (Contact)'}
                        </h2>
                        <p className="text-foreground leading-relaxed">
                            {lang === 'ko'
                                ? '개인정보 관련 문의는 문의하기 페이지를 이용해 주세요.'
                                : 'For privacy-related inquiries, please use the contact page.'}
                        </p>
                        <Link href="/contact" className="inline-block mt-4 text-emerald-400 hover:text-emerald-300 underline underline-offset-4 transition-colors">
                            {lang === 'ko' ? '문의하기 →' : 'Contact Us →'}
                        </Link>
                    </section>
                </div>

                <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        href="/terms"
                        className="inline-block px-8 py-3 border border-border hover:bg-muted text-foreground font-bold rounded-full transition-all"
                    >
                        {lang === 'ko' ? '이용약관 보기' : 'View Terms of Service'}
                    </Link>
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
