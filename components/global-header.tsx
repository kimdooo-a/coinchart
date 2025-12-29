"use client";

import { useState, useEffect } from "react";
import { Menu, X, BarChart2, ChevronDown } from "lucide-react";
import Link from 'next/link';
import { useLanguage } from "@/context/LanguageContext";
import { TRANSLATIONS } from "@/lib/translations";
import { AuthButton } from "@/components/AuthButton";

export default function GlobalHeader() {
    const { lang, toggleLang } = useLanguage();
    const t = TRANSLATIONS[lang];
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        // Check initial scroll position
        handleScroll();
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Colors can be dynamic or fixed based on theme. 
    // Assuming dark mode default for premium feel, but responding to potential light mode if needed.
    // For now, hardcoding dark/premium feel as per current HeroSection design.
    const isDark = true;
    const colors = {
        text: "#E4E4E4",
    };
    // Navigation Items
    const menuItems = [
        {
            key: 'coin', // Translations: menu.coin
            label: t.menu.coin,
            items: [
                { label: t.menu.coinAnalysis, href: '/analysis' },
                { label: t.menu.marketMood, href: '/market' },
                { label: t.menu.aiSignal, href: '/signal' },
            ]
        },
        {
            key: 'stock', // Translations: menu.stock
            label: t.menu.stock,
            items: [
                { label: t.menu.stockAnalysis, href: '/stock' },
                { label: t.menu.stockMarketMood, href: '/stock-market' },
            ]
        },
        {
            key: 'info', // Translations: menu.info
            label: t.menu.info,
            items: [
                { label: t.menu.news, href: '/news' },
                { label: t.menu.calendar, href: '/calendar' },
                { label: t.menu.history, href: '/history' },
            ]
        },
        {
            key: 'service', // Translations: menu.service
            label: t.menu.service,
            items: [
                { label: t.menu.portfolio, href: '/portfolio' },
                { label: t.menu.contact, href: '/contact' },
                { label: t.menu.terms, href: '/terms' },
            ]
        }
    ];

    // Use mounted && scrolled to prevent hydration mismatch
    const isScrolled = mounted && scrolled;

    return (
        <header
            className={`fixed left-0 top-0 z-50 w-full h-16 border-b transition-all duration-300 ${isScrolled
                ? "bg-black/80 backdrop-blur-md border-white/10"
                : "bg-black/20 border-transparent bg-gradient-to-b from-black/50 to-transparent"
                }`}
        >
            <div className="container relative grid h-16 grid-cols-[1fr_auto_auto] items-center lg:grid-cols-[auto_1fr_auto] mx-auto">
                {/* Logo */}
                <div className="col-start-1 col-end-2 row-start-1 row-end-2 font-bold text-xl tracking-tighter">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="size-8 rounded bg-primary flex items-center justify-center text-primary-foreground">
                            <BarChart2 className="size-5" />
                        </div>
                        <span className="text-white">ChartMaster</span>
                    </Link>
                </div>

                {/* Desktop Navigation */}
                <div className="hidden lg:block">
                    <nav className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                        <ul className="flex items-center justify-center gap-6">
                            {menuItems.map((group) => (
                                <li key={group.label} className="group relative">
                                    <div
                                        className="flex items-center gap-1 px-3 py-2 text-sm font-medium transition-all hover:text-primary hover:bg-white/5 rounded-full cursor-default"
                                        style={{ color: colors.text }}
                                    >
                                        {group.label}
                                        <ChevronDown className="h-3 w-3 opacity-50 transition-transform group-hover:rotate-180" />
                                    </div>

                                    {/* Dropdown */}
                                    <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2 w-48 hidden group-hover:block transition-all animate-in fade-in slide-in-from-top-2">
                                        <div className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl p-2 shadow-xl shadow-black/50">
                                            <div className="flex flex-col gap-1">
                                                {group.items.map((item) => (
                                                    <Link
                                                        key={item.href}
                                                        href={item.href}
                                                        className="px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-left"
                                                    >
                                                        {item.label}
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>

                {/* Mobile Menu Button */}
                <div className="block lg:hidden">
                    <button
                        type="button"
                        className="flex h-10 w-10 items-center justify-center"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? (
                            <X className="h-6 w-6" style={{ color: colors.text }} />
                        ) : (
                            <Menu className="h-6 w-6" style={{ color: colors.text }} />
                        )}
                    </button>
                </div>

                {/* Right Side Buttons (Language Switcher) */}
                <div className="col-start-2 col-end-3 row-start-1 row-end-2 flex items-center gap-3 justify-self-end lg:col-start-3">
                    <button
                        onClick={toggleLang}
                        className="
                            group relative overflow-hidden rounded-full px-4 py-1.5 text-xs font-semibold
                            bg-gradient-to-tr from-gray-800 to-gray-700
                            border border-white/10 shadow-lg
                            transition-all duration-300 ease-out
                            hover:scale-105 hover:border-white/20 hover:shadow-cyan-500/20
                        "
                        aria-label="Toggle Language"
                    >
                        <span className="relative z-10 flex items-center gap-2 text-gray-200 group-hover:text-white">
                            <span>{lang === 'ko' ? '🇺🇸 EN' : '🇰🇷 KR'}</span>
                        </span>
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent z-0" />
                    </button>

                    {/* Auth Button */}
                    <AuthButton />
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="absolute top-16 left-0 w-full h-[calc(100vh-4rem)] bg-black/95 backdrop-blur-xl border-b border-white/10 p-6 lg:hidden flex flex-col gap-8 overflow-y-auto animate-in slide-in-from-top-2">
                    {menuItems.map((group) => (
                        <div key={group.label} className="flex flex-col gap-3">
                            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider pl-2 border-l-2 border-primary">
                                {group.label}
                            </span>
                            <div className="flex flex-col pl-4 gap-1">
                                {group.items.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="text-lg font-medium p-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                    >
                                        {item.label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </header>
    );
}
