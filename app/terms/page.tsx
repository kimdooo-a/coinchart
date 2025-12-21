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
        <main className="min-h-screen bg-black text-white p-4 md:p-8 flex flex-col items-center">
            {/* Spacer for GlobalHeader */}
            <div className="h-24 w-full" aria-hidden="true" />

            <div className="w-full max-w-4xl">
                <header className="mb-12 text-center border-b border-gray-800 pb-8">
                    <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        {lang === 'ko' ? '이용약관' : 'Terms of Service'}
                    </h1>
                    <p className="text-gray-500">
                        {lang === 'ko' ? '사랑하는 마누라 서비스 이용을 위한 약관입니다.' : 'Terms for using the service.'}
                    </p>
                </header>

                <div className="prose prose-invert max-w-none text-gray-300 space-y-8">
                    <section className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
                        <h2 className="text-xl font-bold text-white mb-4">제 1 조 (목적)</h2>
                        <p>
                            이 약관은 "사랑하는 마누라" (이하 "회사"라 함)가 제공하는 가상자산 및 주식 분석 정보 제공 서비스(이하 "서비스")의 이용조건 및 절차, 회사와 회원 간의 권리, 의무 및 책임사항 등을 규정함을 목적으로 합니다.
                        </p>
                    </section>

                    <section className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
                        <h2 className="text-xl font-bold text-white mb-4">제 2 조 (용어의 정의)</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>"서비스"라 함은 회사가 제공하는 웹사이트 및 모바일 어플리케이션을 통해 제공되는 모든 주식, 코인 분석 및 관련 정보를 의미합니다.</li>
                            <li>"이용자"라 함은 회사의 사이트에 접속하여 이 약관에 따라 회사가 제공하는 서비스를 받는 회원 및 비회원을 말합니다.</li>
                        </ul>
                    </section>

                    <section className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
                        <h2 className="text-xl font-bold text-white mb-4">제 3 조 (투자 책임의 면책)</h2>
                        <p className="font-bold text-red-400 mb-2">
                            본 서비스가 제공하는 모든 정보(차트 분석, AI 시그널, 뉴스 등)는 투자 판단을 위한 참고 자료일 뿐이며, 투자의 최종 책임은 이용자 본인에게 있습니다.
                        </p>
                        <p>
                            회사는 제공된 정보의 오류, 지연, 또는 이를 바탕으로 한 투자의 결과에 대해 법적 책임을 지지 않습니다. 가상자산 및 주식 시장은 높은 변동성을 가지고 있으며 원금 손실의 위험이 있습니다.
                        </p>
                    </section>

                    <section className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
                        <h2 className="text-xl font-bold text-white mb-4">제 4 조 (서비스의 변경 및 중단)</h2>
                        <p>
                            회사는 운영상, 기술상의 필요에 따라 제공하고 있는 전부 또는 일부 서비스를 변경하거나 중단할 수 있으며, 이에 대해 관련 법령에 특별한 규정이 없는 한 이용자에게 별도의 보상을 하지 않습니다.
                        </p>
                    </section>

                    <section className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
                        <h2 className="text-xl font-bold text-white mb-4">제 5 조 (개인정보보호)</h2>
                        <p>
                            회사는 관련 법령이 정하는 바에 따라 이용자의 개인정보를 보호하기 위해 노력합니다. 개인정보의 보호 및 사용에 대해서는 관련 법령 및 회사의 개인정보처리방침이 적용됩니다.
                        </p>
                    </section>
                </div>

                <div className="mt-12 text-center">
                    <Link href="/" className="inline-block px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors">
                        {t.common.back || '홈으로 돌아가기'}
                    </Link>
                </div>
            </div>
        </main>
    );
}
