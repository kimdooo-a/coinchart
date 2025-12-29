'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';

interface NewsItem {
    title: string;
    link: string;
    pubDate: string;
    publisher: string;
    sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
    snippet: string;
}

export const NewsRotator = () => {
    const { lang } = useLanguage();
    const [news, setNews] = useState<NewsItem[]>([]);
    const [index, setIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    // Fetch News
    useEffect(() => {
        const fetchNews = async () => {
            try {
                // Fetch up to 20 items as requested
                const res = await fetch(`/api/news?query=ALL&lang=${lang}`);
                const data = await res.json();

                // Take top 20
                if (data.items && data.items.length > 0) {
                    setNews(data.items.slice(0, 20));
                    // Initial random index
                    setIndex(Math.floor(Math.random() * Math.min(data.items.length, 20)));
                }
            } catch (error) {
                console.error('Failed to fetch news for rotator:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
    }, [lang]);

    // Rotation Logic
    useEffect(() => {
        if (news.length === 0) return;

        const timer = setInterval(() => {
            setIndex((prev) => {
                let next;
                // Avoid picking the same news twice in a row if we have enough items
                const max = news.length;
                if (max <= 1) return 0;

                do {
                    next = Math.floor(Math.random() * max);
                } while (next === prev);

                return next;
            });
        }, 8000); // 8 seconds

        return () => clearInterval(timer);
    }, [news]);

    if (loading || news.length === 0) {
        return null; // Don't show anything if loading or no news (or show a skeleton if preferred, but null is safer for "optional" section)
    }

    const currentNews = news[index];

    return (
        <div className="bg-gradient-to-br from-card to-muted/30 border border-border rounded-xl shadow-xl flex flex-col justify-center items-center relative overflow-hidden group p-4 h-auto min-h-[140px] max-w-4xl mx-auto cursor-pointer transition-all hover:border-primary/50"
            onClick={() => window.open(currentNews.link, '_blank')}
        >
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all duration-1000 group-hover:bg-primary/10"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary/5 rounded-full blur-2xl -ml-12 -mb-12 transition-all duration-1000 group-hover:bg-secondary/10"></div>

            <h3 className="font-bold text-muted-foreground absolute top-3 left-4 mb-0 flex items-center gap-2 text-sm">
                <span>📰</span> {lang === 'ko' ? '최신 뉴스' : 'Latest News'}
            </h3>

            <div className="w-full text-center relative z-10 flex flex-col justify-center max-w-2xl mt-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={index} // Key change triggers animation
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col gap-2"
                    >
                        <p className="font-medium text-foreground leading-relaxed text-base md:text-lg group-hover:text-primary transition-colors">
                            "{currentNews.title}"
                        </p>
                        <p className="text-muted-foreground font-bold tracking-wider uppercase text-xs md:text-sm mt-1">
                            - {currentNews.publisher} -
                        </p>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};
