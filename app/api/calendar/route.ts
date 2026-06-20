import { NextResponse } from 'next/server';

// 경제 일정 크롤링 소스: faireconomy(ForexFactory 호환) 공개 JSON 피드.
// MT4/5 EA들이 표준으로 사용하는 무료 피드 — API 키·안티봇 없음. this/next week 2주 horizon.
const FEED_URLS = [
    'https://nfs.faireconomy.media/ff_calendar_thisweek.json',
    'https://nfs.faireconomy.media/ff_calendar_nextweek.json',
];

// 캘린더 페이지가 소비하는 이벤트 형태 (기존 정적 EVENTS와 동일 계약)
export interface CalendarEvent {
    date: string;        // YYYY-MM-DD
    titleEn: string;
    titleKo: string;     // 크롤 소스에 한글 번역 없음 → 영문 제목 재사용
    impact: 'high' | 'medium' | 'low';
    country: string;     // 통화/국가 코드 (USD, EUR, ...)
}

interface FeedItem {
    title?: string;
    country?: string;
    date?: string;       // ISO with tz, 예: 2026-06-22T18:00:00-04:00
    impact?: string;     // High | Medium | Low | Holiday | ''
}

function mapImpact(raw: string | undefined): CalendarEvent['impact'] | null {
    switch ((raw ?? '').toLowerCase()) {
        case 'high': return 'high';
        case 'medium': return 'medium';
        case 'low': return 'low';
        case 'holiday': return 'low';
        default: return null; // 영향도 없는 항목(빈 값)은 제외
    }
}

async function fetchFeed(url: string): Promise<FeedItem[]> {
    const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; coinchart/1.0)', Accept: 'application/json' },
        next: { revalidate: 3600 }, // 1시간 ISR 캐시
    });
    if (!res.ok) throw new Error(`feed ${res.status}`);
    return (await res.json()) as FeedItem[];
}

export async function GET() {
    try {
        const settled = await Promise.allSettled(FEED_URLS.map(fetchFeed));
        const items: FeedItem[] = settled
            .filter((s): s is PromiseFulfilledResult<FeedItem[]> => s.status === 'fulfilled')
            .flatMap((s) => s.value);

        // 두 피드 모두 실패하면 502(페이지는 빈 상태로 graceful degrade)
        if (items.length === 0 && settled.every((s) => s.status === 'rejected')) {
            return NextResponse.json({ events: [], error: 'Feed unavailable' }, { status: 502 });
        }

        const events: CalendarEvent[] = [];
        for (const it of items) {
            const impact = mapImpact(it.impact);
            if (!impact || !it.date || !it.title) continue;
            const date = it.date.slice(0, 10); // YYYY-MM-DD
            if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
            events.push({
                date,
                titleEn: it.title,
                titleKo: it.title,
                impact,
                country: it.country ?? '',
            });
        }

        // 날짜 오름차순 정렬
        events.sort((a, b) => a.date.localeCompare(b.date));

        return NextResponse.json({ events });
    } catch (error) {
        console.error('Calendar feed error:', error);
        return NextResponse.json({ events: [], error: 'Failed to fetch calendar' }, { status: 500 });
    }
}
