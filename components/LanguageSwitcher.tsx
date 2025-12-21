'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';

import { usePathname } from 'next/navigation';

export const LanguageSwitcher = () => {
    const { lang, toggleLang } = useLanguage();
    const pathname = usePathname();

    // Hide global switcher on home page (/)
    if (pathname === '/') return null;

    return (
        <button
            onClick={toggleLang}
            className="fixed top-4 right-4 z-50 px-4 py-2 bg-gray-900/80 backdrop-blur-md border border-gray-700 rounded-full text-white font-bold hover:bg-gray-800 transition-all shadow-lg hover:shadow-cyan-500/20"
        >
            {lang === 'ko' ? '🇺🇸 ENG' : '🇰🇷 KH (한글)'}
        </button>
    );
};
