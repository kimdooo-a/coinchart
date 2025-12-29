"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Menu, X, BarChart2 } from "lucide-react";
import Link from 'next/link';
import { HeroChart } from "@/components/hero-chart";
import { useLanguage } from "@/context/LanguageContext";
import { TRANSLATIONS } from "@/lib/translations";
import { NewsRotator } from "@/components/news-rotator";

interface HeroSectionProps {
    mode?: "light" | "dark";
}

export default function HeroSection({ mode = "dark" }: HeroSectionProps) {
    const { lang } = useLanguage();
    const t = TRANSLATIONS[lang];

    return (
        <section className="min-h-screen relative overflow-hidden bg-background text-foreground">
            {/* Ambient Background with Brand Colors */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-background via-background to-background/50" />
                <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px]" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]" />
            </div>

            {/* Main Content */}
            <div className="container relative z-10 mx-auto px-4 py-32 md:px-8 text-center">
                {/* Hero Text */}
                <div className="mb-12 max-w-4xl mx-auto">
                    <h1
                        className="mb-6 text-balance text-4xl font-bold leading-tight md:text-6xl lg:text-7xl tracking-tight bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent drop-shadow-sm"
                        dangerouslySetInnerHTML={{ __html: t.main.heroTitle || "" }}
                    >
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
                        {t.main.heroSubtitle}
                    </p>

                    <div className="flex items-center justify-center gap-4">
                        <Link
                            href="/analysis"
                            className="inline-flex items-center gap-2 rounded-full px-8 py-3 text-base font-medium transition-transform hover:scale-105 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
                        >
                            {t.main.startAnalysis}
                            <span>→</span>
                        </Link>
                        <Link
                            href="/stock"
                            className="inline-flex items-center gap-2 rounded-full px-8 py-3 text-base font-medium border border-input text-foreground transition-transform hover:scale-105 hover:bg-accent hover:text-accent-foreground"
                        >
                            {t.main.viewSignals}
                        </Link>
                    </div>
                </div>

                {/* Chart Window / Demo Container */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="relative overflow-hidden mx-auto max-w-6xl shadow-2xl bg-card border border-border h-[min(600px,60vh)] min-h-[400px] rounded-2xl"
                >
                    {/* Abstract Chart Background - kept as subtle enhancement */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent"></div>
                    </div>

                    {/* Real Chart Component */}
                    <HeroChart />

                </motion.div>

                {/* Investment Quotes (Small) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="mt-8"
                >
                    <NewsRotator />
                </motion.div>
            </div>
        </section>
    );
}
