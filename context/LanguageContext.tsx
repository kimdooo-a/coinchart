'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'ko' | 'en';

interface LanguageContextType {
    lang: Language;
    toggleLang: () => void;
    setLang: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [lang, setLangState] = useState<Language>('ko');

    useEffect(() => {
        // Load from localStorage if available
        const savedLang = localStorage.getItem('app-lang') as Language;
        if (savedLang && (savedLang === 'ko' || savedLang === 'en')) {
            setLangState(savedLang);
        }
    }, []);

    const toggleLang = () => {
        const newLang = lang === 'ko' ? 'en' : 'ko';
        setLangState(newLang);
        localStorage.setItem('app-lang', newLang);
    };

    const setLang = (newLang: Language) => {
        setLangState(newLang);
        localStorage.setItem('app-lang', newLang);
    };

    return (
        <LanguageContext.Provider value={{ lang, toggleLang, setLang }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
