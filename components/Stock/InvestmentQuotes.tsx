'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { INVESTMENT_QUOTES } from '@/lib/quotes';

interface Props {
    size?: 'normal' | 'small';
}

export const InvestmentQuotes = ({ size = 'normal' }: Props) => {
    const { lang } = useLanguage();
    const [index, setIndex] = useState(0);

    useEffect(() => {
        // Initial random index
        setIndex(Math.floor(Math.random() * INVESTMENT_QUOTES.length));

        const timer = setInterval(() => {
            setIndex((prev) => {
                let next;
                do {
                    next = Math.floor(Math.random() * INVESTMENT_QUOTES.length);
                } while (next === prev && INVESTMENT_QUOTES.length > 1);
                return next;
            });
        }, 8000);

        return () => clearInterval(timer);
    }, []);

    const currentQuote = INVESTMENT_QUOTES[index];
    const isSmall = size === 'small';

    return (
        <div className={`bg-gradient-to-br from-card to-muted/30 border border-border rounded-xl shadow-xl flex flex-col justify-center items-center relative overflow-hidden group ${isSmall ? 'p-4 h-auto min-h-[140px] max-w-4xl mx-auto' : 'p-8 h-full'}`}>
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all duration-1000 group-hover:bg-primary/10"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary/5 rounded-full blur-2xl -ml-12 -mb-12 transition-all duration-1000 group-hover:bg-secondary/10"></div>

            <h3 className={`font-bold text-muted-foreground absolute top-6 left-6 flex items-center gap-2 ${isSmall ? 'text-sm top-3 left-4 mb-0' : 'text-xl mb-8'}`}>
                <span>💬</span> {lang === 'ko' ? '투자의 지혜' : 'Investment Wisdom'}
            </h3>

            <div className={`w-full text-center relative z-10 flex flex-col justify-center ${isSmall ? 'max-w-2xl mt-4' : 'max-w-lg h-40'}`}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col gap-2"
                    >
                        <p className={`font-medium text-foreground italic leading-relaxed ${isSmall ? 'text-base md:text-lg' : 'text-xl md:text-2xl'}`}>
                            "{lang === 'ko' ? currentQuote.textKo : currentQuote.text}"
                        </p>
                        {!isSmall && <div className="w-12 h-1 bg-primary mx-auto rounded-full opacity-50 my-2"></div>}
                        <p className={`text-muted-foreground font-bold tracking-wider uppercase ${isSmall ? 'text-xs md:text-sm mt-1' : 'text-sm md:text-base'}`}>
                            - {lang === 'ko' ? currentQuote.authorKo : currentQuote.author} -
                        </p>
                    </motion.div>
                </AnimatePresence>
            </div>



        </div>
    );
};
