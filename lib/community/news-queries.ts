// /news 클라이언트 fetch 래퍼 + 매퍼 + category 라벨 사전 (R2/T02, 2026-05-23)
//
// 주의: 본 모듈은 클라이언트 컴포넌트(app/news/page.tsx, "use client")에서 import한다.
//       따라서 server-only 의존(@/lib/supabase/server 등) 금지.
//       메인페이지용 lib/community/queries.ts(SSR, server-only)와 의도적으로 분리한다.
//
// 데이터 소스:
//   - GET /api/news?query=&category=&page=   (R1/T06: 4차원 컬럼 포함)
//   - GET /api/coins/ticker                   (R1/T03)
//   - GET /api/coins/hot-issues               (R1/T13)
//   - GET /api/fng                            (R1/T04)
//   - GET /api/blog?limit=3                   (공식글)

import type { NewsHeadlineItem, NewsSentiment } from "@/components/community/NewsHeadlineCard";
import type { TickerItem } from "@/components/community/widgets/PriceTickerWidget";
import type { HotIssue, HotIssueTrend } from "@/components/community/widgets/HotIssueWidget";
import type { OfficialPost } from "@/components/community/widgets/OfficialPostsWidget";

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
// 2. 코인 심볼 → 한국어명·코인룸 링크 (사이드바 시세/핫이슈용 정적 사전)
//    queries.ts의 COIN_META는 server-only 모듈이라 재사용 불가 → 클라용 별도 보유.
// ─────────────────────────────────────────────────────────────

const COIN_DISPLAY: Record<string, { nameKo: string; href: string }> = {
  BTC: { nameKo: "비트코인", href: "/coin/btc" },
  ETH: { nameKo: "이더리움", href: "/coin/eth" },
  XRP: { nameKo: "리플", href: "/coin/xrp" },
  SOL: { nameKo: "솔라나", href: "/coin/sol" },
  DOGE: { nameKo: "도지코인", href: "/coin/altcoin" },
  ADA: { nameKo: "카르다노", href: "/coin/altcoin" },
  BNB: { nameKo: "바이낸스코인", href: "/coin/altcoin" },
  TRX: { nameKo: "트론", href: "/coin/altcoin" },
  LINK: { nameKo: "체인링크", href: "/coin/altcoin" },
  AVAX: { nameKo: "아발란체", href: "/coin/altcoin" },
};

// ─────────────────────────────────────────────────────────────
// 3. 상대 시간 ("방금 전" / "N분 전" / "N시간 전" / "N일 전")
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
// 4. /api/news 응답 타입 (R1/T06 계약)
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
// 5. 매퍼: ApiNewsItem → NewsListItem
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
// 6. 뉴스 목록 fetch (코인·분류는 서버 위임, 감정·정렬은 호출측 클라 처리)
// ─────────────────────────────────────────────────────────────

export interface NewsQueryParams {
  /** COIN_FILTERS key: ALL/BTC/ETH/XRP/SOL/ALT/STOCK */
  coin?: string;
  /** NEWS_CATEGORIES key(영문 enum): all/market/regulation/... */
  category?: string;
  page?: number;
}

export async function fetchNews(params: NewsQueryParams = {}): Promise<NewsListItem[]> {
  const qs = new URLSearchParams();
  if (params.coin && params.coin !== "ALL") qs.set("query", params.coin);
  if (params.category && params.category !== "all") qs.set("category", params.category);
  qs.set("page", String(params.page ?? 0));

  const res = await fetch(`/api/news?${qs.toString()}`);
  if (!res.ok) throw new Error(`[news] ${res.status}`);
  const json = (await res.json()) as { items?: ApiNewsItem[] };
  return (json.items ?? []).map(mapApiNews);
}

// ─────────────────────────────────────────────────────────────
// 7. 사이드바 위젯 fetch (모두 실패 시 graceful: 빈 배열/null)
// ─────────────────────────────────────────────────────────────

interface ApiTicker {
  symbol: string; // "BTCUSDT"
  baseSymbol: string; // "BTC"
  price: number;
  changePct: number;
}

export async function fetchTickerItems(): Promise<TickerItem[]> {
  try {
    const res = await fetch("/api/coins/ticker");
    if (!res.ok) return [];
    const json = (await res.json()) as { tickers?: ApiTicker[] };
    return (json.tickers ?? []).map((t) => ({
      symbol: t.baseSymbol,
      name: COIN_DISPLAY[t.baseSymbol]?.nameKo ?? t.baseSymbol,
      price: t.price,
      changePct: t.changePct,
      href: COIN_DISPLAY[t.baseSymbol]?.href,
    }));
  } catch {
    return [];
  }
}

interface ApiHotIssue {
  rank: number;
  symbol: string;
  count: number;
  trend: string; // 'UP' | 'DOWN' | 'FLAT' | 'NEW'
  score: number;
}

const HOT_TREND_MAP: Record<string, HotIssueTrend> = {
  UP: "up",
  DOWN: "down",
  FLAT: "same",
  NEW: "new",
};

export async function fetchHotIssueItems(): Promise<HotIssue[]> {
  try {
    const res = await fetch("/api/coins/hot-issues");
    if (!res.ok) return [];
    const json = (await res.json()) as { items?: ApiHotIssue[] };
    return (json.items ?? []).map((h) => ({
      rank: h.rank,
      keyword: COIN_DISPLAY[h.symbol]?.nameKo ?? (h.symbol === "ALL" ? "전체" : h.symbol),
      trend: HOT_TREND_MAP[h.trend] ?? "same",
      href: COIN_DISPLAY[h.symbol]?.href,
    }));
  } catch {
    return [];
  }
}

export interface FngData {
  value: number;
  prevValue?: number;
}

export async function fetchFngData(): Promise<FngData | null> {
  try {
    const res = await fetch("/api/fng");
    if (!res.ok) return null;
    const fng = (await res.json()) as { value?: number; prevValue?: number };
    if (typeof fng.value !== "number") return null;
    return { value: fng.value, prevValue: fng.prevValue };
  } catch {
    return null;
  }
}

interface ApiBlogPost {
  slug: string;
  title: string;
  published_at: string | null;
  created_at: string | null;
}

export async function fetchOfficialPosts(limit = 3): Promise<OfficialPost[]> {
  try {
    const res = await fetch(`/api/blog?limit=${limit}`);
    if (!res.ok) return [];
    const json = (await res.json()) as { posts?: ApiBlogPost[] };
    return (json.posts ?? []).slice(0, limit).map((p) => ({
      slug: p.slug,
      title: p.title,
      date: (p.published_at ?? p.created_at ?? "").slice(0, 10),
    }));
  } catch {
    return [];
  }
}
