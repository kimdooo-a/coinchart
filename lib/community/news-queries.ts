// /news 순수 헬퍼 + 매퍼 + category 라벨 사전 + API 응답 타입 (R2/T02, 2026-05-23)
//
// R4/T03(2026-05-25): R3에서 /news가 SSR(news-server.ts)로 전환되며 호출처가 0이 된
//   클라 fetch 래퍼 5종(fetchNews·fetchTickerItems·fetchHotIssueItems·fetchFngData·
//   fetchOfficialPosts)과 그 전용 내부 상수/타입(COIN_DISPLAY·ApiTicker·ApiHotIssue·
//   HOT_TREND_MAP·ApiBlogPost·NewsQueryParams)을 제거. 순수 헬퍼·타입·매퍼만 보존.
//
// 주의: 본 모듈은 server 모듈(news-server.ts·coin-server.ts)이 순수 헬퍼/타입을
//       재사용한다(클라 컴포넌트도 import 가능). 따라서 server-only 의존
//       (@/lib/supabase/server 등)은 여전히 금지 — 순수 모듈로 유지한다.
//
// 소비처:
//   - lib/community/news-server.ts : categoryLabel, formatRelativeTime, NewsListItem
//   - lib/community/coin-server.ts : categoryLabel
//   - ApiNewsItem / mapApiNews / FngData : /api/news·/api/fng 응답 계약 타입·매퍼
//     (현재 직접 호출처는 없으나 응답 계약·재사용 대비 보존)

import type { NewsHeadlineItem, NewsSentiment } from "@/components/community/NewsHeadlineCard";

// ─────────────────────────────────────────────────────────────
// 1. category 영문 enum → 한글 라벨 사전
//    /api/news 응답의 category는 영문 enum(R1/T06). NewsRow/HeadlineCard는
//    category 문자열을 그대로 표시하므로 한글로 매핑한다.
//    8값: regulation/tech/exchange/onchain/etf/altcoin_news/macro/market
//    (NEWS_CATEGORIES 필터 탭에 없는 altcoin_news도 표시 라벨은 커버)
// ─────────────────────────────────────────────────────────────

export const NEWS_CATEGORY_LABEL: Record<string, string> = {
  regulation: "규제",
  tech: "기술",
  exchange: "거래소",
  onchain: "온체인",
  etf: "ETF",
  altcoin_news: "알트코인",
  macro: "매크로",
  market: "시장동향",
};

export function categoryLabel(cat?: string | null): string | undefined {
  if (!cat) return undefined;
  return NEWS_CATEGORY_LABEL[cat] ?? cat;
}

// ─────────────────────────────────────────────────────────────
// 2. 상대 시간 ("방금 전" / "N분 전" / "N시간 전" / "N일 전")
// ─────────────────────────────────────────────────────────────

export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diffMin = Math.round((Date.now() - t) / 60000);
  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}일 전`;
  return `${Math.floor(diffDay / 7)}주 전`;
}

// ─────────────────────────────────────────────────────────────
// 3. /api/news 응답 타입 (R1/T06 계약)
// ─────────────────────────────────────────────────────────────

export interface ApiNewsItem {
  title: string;
  link: string;
  pubDate: string; // ISO 8601
  publisher: string | null; // == DB.source
  sentiment: NewsSentiment | null;
  snippet: string | null;
  symbol: string | null; // 'BTC' | ... | 'ALL'
  category: string | null; // 영문 enum
  importance: number | null; // 1~10
  sentimentScore: number | null;
}

/** NewsRow/HeadlineCard가 소비하는 형태 (coinTag·정렬 보조 sentimentScore 포함) */
export type NewsListItem = NewsHeadlineItem & {
  coinTag?: string;
  sentimentScore?: number;
};

// ─────────────────────────────────────────────────────────────
// 4. 매퍼: ApiNewsItem → NewsListItem
//    - category 영문 → 한글 라벨
//    - symbol === "ALL" → coinTag 없음
//    - pubDate ISO → timeLabel
//    - 토론 연결(discussionHref/commentCount)은 뉴스별 실데이터가 없어 생략
//      → NewsRow가 "—"로 표시 (거짓 0 표기 회피)
// ─────────────────────────────────────────────────────────────

export function mapApiNews(item: ApiNewsItem, i: number): NewsListItem {
  const linkKey = item.link ? item.link.slice(-16) : String(i);
  return {
    id: `news-${i}-${linkKey}`,
    title: item.title,
    summary: item.snippet ?? "",
    sentiment: (item.sentiment ?? "neutral") as NewsSentiment,
    category: categoryLabel(item.category),
    source: item.publisher ?? "출처 미상",
    timeLabel: formatRelativeTime(item.pubDate),
    importance: item.importance ?? undefined,
    link: item.link,
    coinTag: item.symbol && item.symbol !== "ALL" ? item.symbol : undefined,
    sentimentScore: item.sentimentScore ?? undefined,
  };
}

// ─────────────────────────────────────────────────────────────
// 5. /api/fng 응답 타입 (공포·탐욕 지수)
// ─────────────────────────────────────────────────────────────

export interface FngData {
  value: number;
  prevValue?: number;
}
