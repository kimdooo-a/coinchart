'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { TRANSLATIONS } from '@/lib/translations';

export default function TermsPage() {
    const { lang } = useLanguage();
    const t = TRANSLATIONS[lang];

    // Standard Terms content - Static for now, can be moved to translations if strictly needed,
    // but usually Terms are legal documents specific to the region.
    // Assuming mostly Korean users based on requests, but providing English basic structure if needed.

    return (
        <main className="min-h-screen bg-background text-foreground relative overflow-hidden flex flex-col items-center pt-[120px] md:pt-[140px]">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-500/10 rounded-full blur-[120px]" />
            </div>



            <div className="relative z-10 w-full max-w-4xl px-4 py-8">
                <header className="mb-12 text-center border-b border-white/10 pb-8">
                    <h1 className="text-3xl md:text-5xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-500">
                        {lang === 'ko' ? '이용약관' : 'Terms of Service'}
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        {lang === 'ko' ? 'ChartMaster 서비스 이용을 위한 약관입니다.' : 'Terms for using the service.'}
                    </p>
                </header>

                <div className="space-y-8">
                    <section className="bg-card/30 backdrop-blur-md border border-white/10 p-8 rounded-3xl shadow-xl transition-all hover:bg-card/40">
                        <h2 className="text-2xl font-bold text-foreground mb-4">제 1 조 (목적)</h2>
                        <p className="text-gray-300 leading-relaxed">
                            이 약관은 "ChartMaster" (이하 "회사"라 함)가 제공하는 가상자산 및 주식 분석 정보 제공 서비스(이하 "서비스")의 이용조건 및 절차, 회사와 회원 간의 권리, 의무 및 책임사항 등을 규정함을 목적으로 합니다.
                        </p>
                    </section>

                    <section className="bg-card/30 backdrop-blur-md border border-white/10 p-8 rounded-3xl shadow-xl transition-all hover:bg-card/40">
                        <h2 className="text-2xl font-bold text-foreground mb-4">제 2 조 (용어의 정의)</h2>
                        <ul className="list-disc pl-5 space-y-3 text-gray-300 leading-relaxed">
                            <li>"서비스"라 함은 회사가 제공하는 웹사이트 및 모바일 어플리케이션을 통해 제공되는 모든 주식, 코인 분석 및 관련 정보를 의미합니다.</li>
                            <li>"이용자"라 함은 회사의 사이트에 접속하여 이 약관에 따라 회사가 제공하는 서비스를 받는 회원 및 비회원을 말합니다.</li>
                        </ul>
                    </section>

                    <section className="bg-card/30 backdrop-blur-md border border-white/10 p-8 rounded-3xl shadow-xl transition-all hover:bg-card/40 border-l-4 border-l-red-500/50">
                        <h2 className="text-2xl font-bold text-foreground mb-4">제 3 조 (투자 책임의 면책)</h2>
                        <p className="font-bold text-red-400 mb-4 bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                            본 서비스가 제공하는 모든 정보(차트 분석, 시그널, 뉴스 등)는 투자 판단을 위한 참고 자료일 뿐이며, 투자의 최종 책임은 이용자 본인에게 있습니다.
                        </p>
                        <p className="text-gray-300 leading-relaxed">
                            회사는 제공된 정보의 오류, 지연, 또는 이를 바탕으로 한 투자의 결과에 대해 법적 책임을 지지 않습니다. 가상자산 및 주식 시장은 높은 변동성을 가지고 있으며 원금 손실의 위험이 있습니다.
                        </p>
                    </section>

                    <section className="bg-card/30 backdrop-blur-md border border-white/10 p-8 rounded-3xl shadow-xl transition-all hover:bg-card/40">
                        <h2 className="text-2xl font-bold text-foreground mb-4">제 4 조 (서비스의 변경 및 중단)</h2>
                        <p className="text-gray-300 leading-relaxed">
                            회사는 운영상, 기술상의 필요에 따라 제공하고 있는 전부 또는 일부 서비스를 변경하거나 중단할 수 있으며, 이에 대해 관련 법령에 특별한 규정이 없는 한 이용자에게 별도의 보상을 하지 않습니다.
                        </p>
                    </section>

                    <section className="bg-card/30 backdrop-blur-md border border-white/10 p-8 rounded-3xl shadow-xl transition-all hover:bg-card/40">
                        <h2 className="text-2xl font-bold text-foreground mb-4">제 5 조 (개인정보보호)</h2>
                        <p className="text-gray-300 leading-relaxed">
                            회사는 관련 법령이 정하는 바에 따라 이용자의 개인정보를 보호하기 위해 노력합니다. 개인정보의 보호 및 사용에 대해서는 관련 법령 및 회사의 개인정보처리방침이 적용됩니다.
                        </p>
                    </section>
                </div>

                <div className="mt-16 text-center">
                    <Link href="/" className="inline-block px-10 py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full transition-all shadow-lg hover:shadow-primary/20 hover:scale-105">
                        {t.common.back || '홈으로 돌아가기'}
                    </Link>
                </div>
            </div>
        </main>
    );
}
