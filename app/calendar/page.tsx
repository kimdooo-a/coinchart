'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { TRANSLATIONS } from '@/lib/translations';

// Comprehensive 2025 Economic & Crypto Events
const EVENTS = [
    // January
    { date: '2025-01-15', titleEn: 'US CPI Release (Dec Data)', titleKo: '미국 CPI 발표 (12월 데이터)', impact: 'high', country: 'USA' },
    { date: '2025-01-20', titleEn: 'US Inauguration Day', titleKo: '미국 대통령 취임식', impact: 'medium', country: 'USA' },
    { date: '2025-01-28', titleEn: 'FOMC Meeting Starts', titleKo: 'FOMC 회의 시작', impact: 'medium', country: 'USA' },
    { date: '2025-01-29', titleEn: 'FOMC Rate Decision', titleKo: 'FOMC 금리 결정', impact: 'high', country: 'USA' },

    // February
    { date: '2025-02-12', titleEn: 'US CPI Release', titleKo: '미국 CPI 발표', impact: 'high', country: 'USA' },
    { date: '2025-02-23', titleEn: 'ETHDenver 2025 Starts', titleKo: 'ETHDenver 2025 시작', impact: 'medium', country: 'Global' },

    // March
    { date: '2025-03-12', titleEn: 'US CPI Release', titleKo: '미국 CPI 발표', impact: 'high', country: 'USA' },
    { date: '2025-03-18', titleEn: 'FOMC Meeting Starts', titleKo: 'FOMC 회의 시작', impact: 'medium', country: 'USA' },
    { date: '2025-03-19', titleEn: 'FOMC Rate Decision + SEP', titleKo: 'FOMC 금리 결정 + 경제 전망', impact: 'high', country: 'USA' },

    // April
    { date: '2025-04-10', titleEn: 'US CPI Release', titleKo: '미국 CPI 발표', impact: 'high', country: 'USA' },

    // May
    { date: '2025-05-06', titleEn: 'FOMC Meeting Starts', titleKo: 'FOMC 회의 시작', impact: 'medium', country: 'USA' },
    { date: '2025-05-07', titleEn: 'FOMC Rate Decision', titleKo: 'FOMC 금리 결정', impact: 'high', country: 'USA' },
    { date: '2025-05-13', titleEn: 'US CPI Release', titleKo: '미국 CPI 발표', impact: 'high', country: 'USA' },
    { date: '2025-05-20', titleEn: 'Projected: BTC New ATH?', titleKo: '예상: 비트코인 신고가 갱신?', impact: 'low', country: 'Global' },

    // June
    { date: '2025-06-11', titleEn: 'US CPI Release', titleKo: '미국 CPI 발표', impact: 'high', country: 'USA' },
    { date: '2025-06-17', titleEn: 'FOMC Meeting Starts', titleKo: 'FOMC 회의 시작', impact: 'medium', country: 'USA' },
    { date: '2025-06-18', titleEn: 'FOMC Rate Decision + SEP', titleKo: 'FOMC 금리 결정 + 경제 전망', impact: 'high', country: 'USA' },

    // July
    { date: '2025-07-15', titleEn: 'US CPI Release', titleKo: '미국 CPI 발표', impact: 'high', country: 'USA' },
    { date: '2025-07-29', titleEn: 'FOMC Meeting Starts', titleKo: 'FOMC 회의 시작', impact: 'medium', country: 'USA' },
    { date: '2025-07-30', titleEn: 'FOMC Rate Decision', titleKo: 'FOMC 금리 결정', impact: 'high', country: 'USA' },
    { date: '2025-07-30', titleEn: 'Ethereum 10th Birthday', titleKo: '이더리움 10주년', impact: 'medium', country: 'Global' },

    // August
    { date: '2025-08-12', titleEn: 'US CPI Release', titleKo: '미국 CPI 발표', impact: 'high', country: 'USA' },

    // September
    { date: '2025-09-11', titleEn: 'US CPI Release', titleKo: '미국 CPI 발표', impact: 'high', country: 'USA' },
    { date: '2025-09-16', titleEn: 'FOMC Meeting Starts', titleKo: 'FOMC 회의 시작', impact: 'medium', country: 'USA' },
    { date: '2025-09-17', titleEn: 'FOMC Rate Decision + SEP', titleKo: 'FOMC 금리 결정 + 경제 전망', impact: 'high', country: 'USA' },
    { date: '2025-09-20', titleEn: 'Solana @ All-In Summit', titleKo: '솔라나 @ All-In Summit', impact: 'low', country: 'Global' },

    // October
    { date: '2025-10-24', titleEn: 'US CPI Release', titleKo: '미국 CPI 발표', impact: 'high', country: 'USA' },
    { date: '2025-10-28', titleEn: 'FOMC Meeting Starts', titleKo: 'FOMC 회의 시작', impact: 'medium', country: 'USA' },
    { date: '2025-10-29', titleEn: 'FOMC Rate Decision', titleKo: 'FOMC 금리 결정', impact: 'high', country: 'USA' },

    // November
    { date: '2025-11-05', titleEn: 'US Election Day (Anniversary)', titleKo: '미국 선거일 (1주년)', impact: 'medium', country: 'USA' },

    // December
    { date: '2025-12-03', titleEn: 'ETH Fusaka Upgrade', titleKo: '이더리움 Fusaka 업그레이드', impact: 'high', country: 'Global' },
    { date: '2025-12-09', titleEn: 'FOMC Meeting Starts', titleKo: 'FOMC 회의 시작', impact: 'medium', country: 'USA' },
    { date: '2025-12-10', titleEn: 'FOMC Rate Decision + SEP', titleKo: 'FOMC 금리 결정 + 경제 전망', impact: 'high', country: 'USA' },
    { date: '2025-12-18', titleEn: 'US CPI Release', titleKo: '미국 CPI 발표', impact: 'high', country: 'USA' },
    { date: '2025-12-25', titleEn: 'Christmas', titleKo: '크리스마스', impact: 'low', country: 'Global' },

    // --- 2026 Events ---
    // Q1 2026
    { date: '2026-01-27', titleEn: 'FOMC Meeting Starts', titleKo: '2026 첫 FOMC 회의 시작', impact: 'medium', country: 'USA' },
    { date: '2026-01-28', titleEn: 'FOMC Rate Decision', titleKo: 'FOMC 금리 결정', impact: 'high', country: 'USA' },
    { date: '2026-03-17', titleEn: 'FOMC Meeting Starts', titleKo: 'FOMC 회의 시작', impact: 'medium', country: 'USA' },
    { date: '2026-03-18', titleEn: 'FOMC Rate Decision + SEP', titleKo: 'FOMC 금리 결정 + 경제 전망', impact: 'high', country: 'USA' },
    { date: '2026-03-31', titleEn: 'Projected: US Market Structure Bill', titleKo: '예상: 미국 가상자산 시장 구조 법안 통과', impact: 'high', country: 'USA' },

    // Q2 2026
    { date: '2026-04-28', titleEn: 'FOMC Meeting Starts', titleKo: 'FOMC 회의 시작', impact: 'medium', country: 'USA' },
    { date: '2026-04-29', titleEn: 'FOMC Rate Decision', titleKo: 'FOMC 금리 결정', impact: 'high', country: 'USA' },
    { date: '2026-06-16', titleEn: 'FOMC Meeting Starts', titleKo: 'FOMC 회의 시작', impact: 'medium', country: 'USA' },
    { date: '2026-06-17', titleEn: 'FOMC Rate Decision + SEP', titleKo: 'FOMC 금리 결정 + 경제 전망', impact: 'high', country: 'USA' },
    { date: '2026-06-30', titleEn: 'Solana Firedancer Mainnet (Projected)', titleKo: '솔라나 파이어댄서 메인넷 (예상)', impact: 'high', country: 'Global' },

    // Q3 2026
    { date: '2026-07-28', titleEn: 'FOMC Meeting Starts', titleKo: 'FOMC 회의 시작', impact: 'medium', country: 'USA' },
    { date: '2026-07-29', titleEn: 'FOMC Rate Decision', titleKo: 'FOMC 금리 결정', impact: 'high', country: 'USA' },
    { date: '2026-08-31', titleEn: 'ETH Glamsterdam Upgrade (Projected)', titleKo: '이더리움 Glamsterdam 업그레이드 (예상)', impact: 'high', country: 'Global' },
    { date: '2026-09-15', titleEn: 'FOMC Meeting Starts', titleKo: 'FOMC 회의 시작', impact: 'medium', country: 'USA' },
    { date: '2026-09-16', titleEn: 'FOMC Rate Decision + SEP', titleKo: 'FOMC 금리 결정 + 경제 전망', impact: 'high', country: 'USA' },

    // Q4 2026
    { date: '2026-10-27', titleEn: 'FOMC Meeting Starts', titleKo: 'FOMC 회의 시작', impact: 'medium', country: 'USA' },
    { date: '2026-10-28', titleEn: 'FOMC Rate Decision', titleKo: 'FOMC 금리 결정', impact: 'high', country: 'USA' },
    { date: '2026-12-08', titleEn: 'FOMC Meeting Starts', titleKo: 'FOMC 회의 시작', impact: 'medium', country: 'USA' },
    { date: '2026-12-09', titleEn: 'FOMC Rate Decision + SEP', titleKo: 'FOMC 금리 결정 + 경제 전망', impact: 'high', country: 'USA' },
    { date: '2026-12-15', titleEn: 'G20 Summit in Miami', titleKo: '마이애미 G20 정상회의 (가상자산 규제 논의)', impact: 'medium', country: 'Global' },
];

export default function CalendarPage() {
    const { lang } = useLanguage();
    const t = TRANSLATIONS[lang];
    const [currentDate, setCurrentDate] = useState(new Date());

    const getMonthEvents = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return EVENTS.filter(e => {
            const d = new Date(e.date);
            return d.getFullYear() === year && d.getMonth() === month;
        });
    };

    const monthEvents = getMonthEvents(currentDate);

    const generateCalendar = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay(); // 0 = Sun

        const days = [];
        // Empty slots for previous month
        for (let i = 0; i < startingDay; i++) {
            days.push(null);
        }
        // Days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }

        const weekDays = lang === 'ko'
            ? ['일', '월', '화', '수', '목', '금', '토']
            : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        return (
            <div className="w-full">
                <div className="flex justify-between items-center mb-6">
                    <button
                        onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                        className="p-2 hover:bg-muted rounded-full text-foreground"
                    >
                        &larr;
                    </button>
                    <h3 className="text-2xl font-bold text-foreground">
                        {lang === 'ko'
                            ? `${year}년 ${month + 1}월`
                            : new Date(year, month).toLocaleString('en-US', { month: 'long', year: 'numeric' })
                        }
                    </h3>
                    <button
                        onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                        className="p-2 hover:bg-muted rounded-full text-foreground"
                    >
                        &rarr;
                    </button>
                </div>

                <div className="grid grid-cols-7 gap-2 text-center mb-2">
                    {weekDays.map(d => <div key={d} className="text-on-surface-variant font-bold text-sm">{d}</div>)}
                </div>

                <div className="grid grid-cols-7 gap-2">
                    {days.map((d, i) => {
                        if (!d) return <div key={i} className="aspect-square"></div>;
                        const dateStr = d.toISOString().split('T')[0];
                        const dayEvents = EVENTS.filter(e => e.date === dateStr);
                        const isToday = new Date().toDateString() === d.toDateString();

                        return (
                            <div key={i} className={`aspect-square border border-border rounded-xl p-1 flex flex-col justify-between hover:bg-muted/50 transition-colors relative ${isToday ? 'bg-muted border-primary' : ''}`}>
                                <span className={`text-sm font-bold ${d.getDay() === 0 ? 'text-destructive' : 'text-foreground'}`}>
                                    {d.getDate()}
                                </span>
                                {dayEvents.length > 0 && (
                                    <div className="flex gap-1 justify-center">
                                        {dayEvents.map((e, idx) => (
                                            <div key={idx} className={`w-2 h-2 rounded-full ${e.impact === 'high' ? 'bg-destructive' : 'bg-yellow-500'}`}></div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <main className="min-h-screen bg-background text-foreground p-4 md:p-8 flex flex-col items-center">
            {/* Spacer for GlobalHeader */}
            <div className="h-24 w-full" aria-hidden="true" />

            <header className="w-full max-w-4xl mb-8 flex flex-col gap-4 border-b border-border pb-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-foreground">📅 {t.calendar.title}</h2>
                </div>
            </header>

            <div className="w-full max-w-4xl grid md:grid-cols-2 gap-12">
                {/* Calendar View */}
                <div className="bg-card p-6 rounded-3xl border border-border">
                    {generateCalendar(currentDate)}
                </div>

                {/* Event List */}
                <div className="space-y-6">
                    <h3 className="text-2xl font-bold text-on-surface-variant">
                        {lang === 'ko'
                            ? `${currentDate.getMonth() + 1}월 주요 일정`
                            : `${new Date(currentDate).toLocaleString('en-US', { month: 'long' })}'s Major Events`
                        }
                    </h3>
                    {monthEvents.length === 0 ? (
                        <p className="text-on-surface-variant">{t.calendar.noEvents}</p>
                    ) : (
                        monthEvents.map((event, idx) => (
                            <div key={idx} className="flex items-center gap-4 bg-card p-4 rounded-xl border border-border">
                                <div className={`w-1 h-12 rounded-full ${event.impact === 'high' ? 'bg-destructive' : 'bg-yellow-500'}`}></div>
                                <div>
                                    <div className="text-xs text-on-surface-variant mb-1">{event.date} • {event.country}</div>
                                    <div className="text-lg font-bold text-foreground">
                                        {lang === 'ko' ? event.titleKo : event.titleEn}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="mt-8 text-center text-xs text-on-surface-variant">
                {t.calendar.footer}
            </div>
        </main>
    );
}
