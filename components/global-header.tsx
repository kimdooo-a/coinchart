"use client";

import { useState, useEffect } from "react";
import { Menu, X, BarChart2, ChevronDown, Search, PenSquare } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { TRANSLATIONS } from "@/lib/translations";
import { AuthButton } from "@/components/AuthButton";

interface MenuPrimary {
    label: string;
    href: string;
}

interface MenuDropdownItem {
    label: string;
    href: string;
}

interface MenuDropdown {
    label: string;
    items: MenuDropdownItem[];
}

export default function GlobalHeader() {
    const { lang, toggleLang } = useLanguage();
    const t = TRANSLATIONS[lang];
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isMobileMenuOpen]);

    // 1차 메뉴 5개
    const primary: MenuPrimary[] = [
        { label: t.menu.best, href: "/" },
        { label: t.menu.boardFree, href: "/board/free" },
        { label: t.menu.boardMarket, href: "/board/market" },
        { label: t.menu.boardInfo, href: "/board/info" },
        { label: t.menu.news, href: "/news" },
    ];

    // 코인룸 드롭다운
    const coinRoom: MenuDropdown = {
        label: t.menu.coinRoom,
        items: [
            { label: "BTC", href: "/coin/btc" },
            { label: "ETH", href: "/coin/eth" },
            { label: "XRP", href: "/coin/xrp" },
            { label: "SOL", href: "/coin/sol" },
            { label: lang === "ko" ? "알트코인" : "Altcoin", href: "/coin/altcoin" },
            { label: lang === "ko" ? "김치프리미엄" : "Kimchi Premium", href: "/coin/kimp" },
        ],
    };

    // 도구 드롭다운
    const tools: MenuDropdown = {
        label: t.menu.tools,
        items: [
            { label: t.menu.coinAnalysis, href: "/analysis" },
            { label: t.menu.stockAnalysis, href: "/stock" },
            { label: t.menu.aiSignal, href: "/signal" },
            { label: t.menu.marketMood, href: "/market" },
            { label: t.menu.calendar, href: "/calendar" },
            { label: t.menu.watchlist, href: "/watchlist" },
            { label: t.menu.secureMemo, href: "/secure-memo" },
        ],
    };

    return (
        <header className="sticky top-0 z-50 w-full bg-surface-container-lowest border-b border-outline-variant">
            <div className="max-w-[1200px] mx-auto h-14 px-4 lg:px-6 flex items-center justify-between gap-4">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 flex-shrink-0">
                    <div className="size-8 rounded-md bg-primary flex items-center justify-center text-on-primary">
                        <BarChart2 className="size-5" />
                    </div>
                    <span className="text-h2 text-primary tracking-tight">ChartMaster</span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden lg:flex items-center gap-5 flex-1 justify-center">
                    {primary.map((m) => (
                        <Link
                            key={m.href}
                            href={m.href}
                            className="text-body-base text-on-surface-variant hover:text-primary transition-colors"
                        >
                            {m.label}
                        </Link>
                    ))}

                    <span className="h-4 w-px bg-outline-variant" />

                    {[coinRoom, tools].map((group) => (
                        <div key={group.label} className="relative group">
                            <button
                                type="button"
                                className="flex items-center gap-1 text-body-base text-on-surface-variant hover:text-primary transition-colors"
                            >
                                {group.label}
                                <ChevronDown className="w-3 h-3 opacity-60 transition-transform group-hover:rotate-180" />
                            </button>
                            <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2 w-48 hidden group-hover:block">
                                <div className="bg-surface-container-lowest border border-outline-variant rounded-md p-1.5 shadow-md">
                                    {group.items.map((it) => (
                                        <Link
                                            key={it.href}
                                            href={it.href}
                                            className="block px-3 py-1.5 text-body-sm text-on-surface hover:bg-surface-container-low hover:text-primary rounded transition-colors"
                                        >
                                            {it.label}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Right Side */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                        type="button"
                        aria-label="검색"
                        className="hidden md:inline-flex items-center justify-center w-9 h-9 rounded-md text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors"
                    >
                        <Search className="w-4 h-4" />
                    </button>

                    <button
                        onClick={toggleLang}
                        className="hidden md:inline-flex items-center px-2 h-9 rounded-md text-meta font-bold text-on-surface-variant hover:bg-surface-container transition-colors"
                        aria-label="Toggle Language"
                    >
                        {lang === "ko" ? "EN" : "KR"}
                    </button>

                    <AuthButton />

                    <Link
                        href="/board/free/write"
                        className="hidden sm:inline-flex items-center gap-1 bg-primary text-on-primary px-3 h-9 rounded-md text-label-bold hover:bg-primary-container transition-colors"
                    >
                        <PenSquare className="w-3.5 h-3.5" />
                        {t.menu.write}
                    </Link>

                    <button
                        type="button"
                        className="lg:hidden w-9 h-9 inline-flex items-center justify-center text-on-surface"
                        onClick={() => setIsMobileMenuOpen((v) => !v)}
                        aria-label="메뉴"
                    >
                        {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="lg:hidden absolute top-14 left-0 w-full bg-surface-container-lowest border-b border-outline-variant max-h-[calc(100vh-3.5rem)] overflow-y-auto">
                    <div className="px-4 py-4 flex flex-col gap-1">
                        {primary.map((m) => (
                            <Link
                                key={m.href}
                                href={m.href}
                                className="px-3 py-2.5 text-body-base text-on-surface hover:bg-surface-container-low rounded-md"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                {m.label}
                            </Link>
                        ))}

                        {[coinRoom, tools].map((group) => (
                            <div key={group.label} className="mt-2">
                                <div className="px-3 py-1.5 text-meta font-bold text-on-surface-variant uppercase">
                                    {group.label}
                                </div>
                                {group.items.map((it) => (
                                    <Link
                                        key={it.href}
                                        href={it.href}
                                        className="block px-5 py-2 text-body-sm text-on-surface hover:bg-surface-container-low rounded-md"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        {it.label}
                                    </Link>
                                ))}
                            </div>
                        ))}

                        <div className="mt-4 flex gap-2">
                            <Link
                                href="/board/free/write"
                                className="flex-1 inline-flex items-center justify-center gap-1 bg-primary text-on-primary px-3 h-10 rounded-md text-label-bold"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <PenSquare className="w-3.5 h-3.5" />
                                {t.menu.write}
                            </Link>
                            <button
                                onClick={toggleLang}
                                className="px-4 h-10 rounded-md border border-outline-variant text-body-sm"
                            >
                                {lang === "ko" ? "EN" : "KR"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
