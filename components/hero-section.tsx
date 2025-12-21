"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Menu, X, BarChart2 } from "lucide-react";
import Link from 'next/link';
import { HeroChart } from "@/components/hero-chart";
import { useLanguage } from "@/context/LanguageContext";
import { TRANSLATIONS } from "@/lib/translations";

interface HeroSectionProps {
    mode?: "light" | "dark";
}

const COLORS = {
    light: {
        bg: "#FFFFFF",
        text: "#1F1F1F",
        textSec: "#6B7280",
        card: "#F5F5F5",
        cardHover: "#EBEBEB",
        border: "#E5E5E5",
        editorBg: "#FFFFFF",
        chromeBg: "#FAFAFA",
        ansiGreen: "#22C55E",
        ansiRed: "#EF4444",
    },
    dark: {
        bg: "#0A0A0A",
        text: "#E4E4E4",
        textSec: "#9CA3AF",
        card: "#1A1A1A",
        cardHover: "#262626",
        border: "#2A2A2A",
        editorBg: "#1E1E1E",
        chromeBg: "#171717",
        ansiGreen: "#4ADE80",
        ansiRed: "#F87171",
    },
} as const;

export default function HeroSection({ mode = "dark" }: HeroSectionProps) {
    const { lang } = useLanguage();
    const t = TRANSLATIONS[lang];
    const colors = COLORS[mode];
    const isDark = mode === "dark";

    return (
        <section style={{ backgroundColor: colors.bg, color: colors.text }} className="min-h-screen relative overflow-hidden">

            {/* Main Content */}
            <div className="container mx-auto px-4 py-32 md:px-8 text-center">
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
                            href="/market"
                            className="inline-flex items-center gap-2 rounded-full px-8 py-3 text-base font-medium transition-transform hover:scale-105"
                            style={{
                                backgroundColor: isDark ? colors.text : colors.bg,
                                color: isDark ? colors.bg : colors.text,
                            }}
                        >
                            {t.main.startAnalysis}
                            <span>→</span>
                        </Link>
                        <Link
                            href="/signal"
                            className="inline-flex items-center gap-2 rounded-full px-8 py-3 text-base font-medium border transition-transform hover:scale-105 hover:bg-muted/10"
                            style={{
                                borderColor: colors.border,
                                color: colors.text,
                            }}
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
                    className="relative overflow-hidden rounded-xl mx-auto max-w-6xl shadow-2xl"
                    style={{
                        height: "min(600px, 60vh)",
                        minHeight: "400px",
                        background: `linear-gradient(135deg, ${colors.card} 0%, ${colors.bg} 100%)`,
                        border: `1px solid ${colors.border}`,
                    }}
                >
                    {/* Abstract Chart Background - kept as subtle enhancement */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent"></div>
                    </div>

                    {/* Real Chart Component */}
                    <HeroChart />

                </motion.div>
            </div>
        </section>
    );
}
