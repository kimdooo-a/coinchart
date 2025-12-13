'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { TRANSLATIONS } from '@/lib/translations';

export default function LandingPage() {
  const { lang } = useLanguage();
  const t = TRANSLATIONS[lang];

  return (
    <main className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">

      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-900 rounded-full mix-blend-screen filter blur-[128px] opacity-30 animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-900 rounded-full mix-blend-screen filter blur-[128px] opacity-30 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-900/10 rounded-full blur-[100px] opacity-20"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 text-center">

        <header className="mb-12 space-y-4">
          <h2 className="text-xl md:text-2xl text-blue-400 font-medium tracking-widest uppercase">
            {t.main.headerTitle}
          </h2>
          <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 bg-clip-text text-transparent leading-tight p-2">
            {t.main.titlePrefix}<br className="md:hidden" /> {t.main.titleSuffix}
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mt-6 whitespace-pre-line">
            {t.main.subtitle}
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-7xl mt-8 px-4">
          {/* 1. Analysis Card */}
          <Link href="/analysis" className="group">
            <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 hover:border-pink-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-pink-900/20 transform hover:-translate-y-2 h-full flex flex-col items-center justify-center gap-6">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <span className="text-4xl">📊</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">{t.cards.analysis.title}</h3>
                <p className="text-gray-400 text-sm whitespace-pre-line">
                  {t.cards.analysis.desc}
                </p>
              </div>
            </div>
          </Link>

          {/* 1.5. US Stock Analysis Card (NEW) */}
          <Link href="/stock" className="group">
            <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 hover:border-indigo-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-900/20 transform hover:-translate-y-2 h-full flex flex-col items-center justify-center gap-6">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <span className="text-4xl">🏛️</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">{t.cards.stock.title}</h3>
                <p className="text-gray-400 text-sm whitespace-pre-line">
                  {t.cards.stock.desc}
                </p>
              </div>
            </div>
          </Link>

          {/* 2. Market Mood Card */}
          <Link href="/market" className="group">
            <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 hover:border-green-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-green-900/20 transform hover:-translate-y-2 h-full flex flex-col items-center justify-center gap-6">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <span className="text-4xl">😨</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">{t.cards.market.title}</h3>
                <p className="text-gray-400 text-sm whitespace-pre-line">
                  {t.cards.market.desc}
                </p>
              </div>
            </div>
          </Link>

          {/* 3. News Card */}
          <Link href="/news" className="group">
            <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/20 transform hover:-translate-y-2 h-full flex flex-col items-center justify-center gap-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <span className="text-4xl">📰</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">{t.cards.news.title}</h3>
                <p className="text-gray-400 text-sm whitespace-pre-line">
                  {t.cards.news.desc}
                </p>
              </div>
            </div>
          </Link>

          {/* 4. AI Signal Card (NEW) */}
          <Link href="/signal" className="group">
            <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 hover:border-red-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-red-900/20 transform hover:-translate-y-2 h-full flex flex-col items-center justify-center gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">📡</div>
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <span className="text-4xl">🚨</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">{t.cards.signal.title}</h3>
                <p className="text-gray-400 text-sm whitespace-pre-line">
                  {t.cards.signal.desc}
                </p>
              </div>
            </div>
          </Link>

          {/* 5. Calendar Card (NEW) */}
          <Link href="/calendar" className="group">
            <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-900/20 transform hover:-translate-y-2 h-full flex flex-col items-center justify-center gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">🗓️</div>
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <span className="text-4xl">📅</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">{t.cards.calendar.title}</h3>
                <p className="text-gray-400 text-sm whitespace-pre-line">
                  {t.cards.calendar.desc}
                </p>
              </div>
            </div>
          </Link>

          {/* 6. History Card (NEW) */}
          <Link href="/history" className="group">
            <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 hover:border-orange-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-900/20 transform hover:-translate-y-2 h-full flex flex-col items-center justify-center gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">📜</div>
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <span className="text-4xl">📜</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">{t.cards.history.title}</h3>
                <p className="text-gray-400 text-sm whitespace-pre-line">
                  {t.cards.history.desc}
                </p>
              </div>
            </div>
          </Link>

          {/* 7. Portfolio Card (NEW - Phase 1) */}
          <Link href="/portfolio" className="group md:col-span-2 lg:col-span-3">
            <div className="bg-gradient-to-r from-gray-900/80 to-blue-900/20 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 hover:border-blue-400/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/20 transform hover:-translate-y-2 h-full flex flex-row items-center justify-center gap-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors"></div>
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform flex-shrink-0">
                <span className="text-5xl">💼</span>
              </div>
              <div className="text-left">
                <h3 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                  {t.cards.portfolio?.title || "My Portfolio"}
                  <span className="px-2 py-1 bg-blue-500 text-xs rounded-md font-bold">NEW</span>
                </h3>
                <p className="text-gray-400 text-lg whitespace-pre-line max-w-2xl">
                  {t.cards.portfolio?.desc || "Manage your assets."}
                </p>
              </div>
              <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
                <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </Link>

        </div>
      </div >

      <footer className="relative z-10 p-6 text-center text-gray-600 text-sm">
        {t.main.footer}
      </footer>
    </main >
  );
}
