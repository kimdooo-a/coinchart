'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { TRANSLATIONS } from '@/lib/translations';

// 경제 일정 — /api/calendar(faireconomy 크롤링 피드)에서 실데이터 fetch
interface CalendarEvent {
    date: string;        // YYYY-MM-DD
    titleEn: string;
    titleKo: string;
    impact: 'high' | 'medium' | 'low';
    country: string;
}

export default function CalendarPage() {
    const { lang } = useLanguage();
    const t = TRANSLATIONS[lang];
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);

    // 경제 일정 실데이터 fetch (faireconomy 크롤링 피드 경유)
    useEffect(() => {
        let cancelled = false;
        fetch('/api/calendar')
            .then(res => res.json())
            .then((data: { events?: CalendarEvent[] }) => {
                if (!cancelled && Array.isArray(data.events)) setEvents(data.events);
            })
            .catch(err => console.error('일정 로딩 실패:', err));
        return () => { cancelled = true; };
    }, []);

    const getMonthEvents = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return events.filter(e => {
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
                        const dayEvents = events.filter(e => e.date === dateStr);
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
