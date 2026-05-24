// /news SSR 서버 데이터 로더 (R3/T03, 2026-05-24)
//
// 배경: R2/T02에서 /news는 "use client" + news-queries.ts 클라 fetch로 실데이터화됐다.
//       R3는 SEO 강화를 위해 SSR로 전환한다. 본 모듈은 그 서버측 단일 진입점이다.
//
// 설계 결정 (왜 news-queries.ts에 추가하지 않고 별도 모듈인가):
//   - news-queries.ts는 헤더 주석에서 "클라이언트 전용(server-only 의존 금지)"으로 선언됐다.
//     거기에 Supabase 서버/anon 클라이언트를 넣으면 클라 번들에서 깨진다.
//   - 따라서 메인페이지의 queries.ts(server) ↔ 클라 분리 패턴을 그대로 따른다.
//   - news-queries.ts의 순수 헬퍼(categoryLabel·formatRelativeTime·타입)만 재사용한다.
//
// 데이터 소스: /api/news 절대 URL fetch 대신 메인페이지(T15·R2/T05)와 동일하게
//   anon Supabase 클라이언트로 news 테이블을 직접 쿼리한다. 이유:
//   (1) /api/news는 sentiment·sort 파라미터를 지원하지 않아 4차원 서버 필터에 부족
//   (2) 쿠키 비의존 anon 클라이언트 + next.revalidate로 정적 ISR 유지(T15 §4 / R2-T05)
//   (3) 서버 self-fetch의 origin 해석 문제 회피
//
// 4차원 필터(coin/category/sentiment/sort)는 모두 서버에서 해석한다.

import { createClient as createAnonClient } from "@supabase/supabase-js";
import { fetchCommunityTickers } from "@/lib/supabase/crypto";
import { fetchFng } from "@/lib/community/fng";
import { COIN_META } from "@/lib/community/queries";
import {
  categoryLabel,
  formatRelativeTime,
  type NewsListItem,
} from "@/lib/community/news-queries";
import type { CoinTicker } from "@/types/coins";
import type { NewsSentiment } from "@/components/community/NewsHeadlineCard";
import type { TickerItem } from "@/components/community/widgets/PriceTickerWidget";
import type { HotIssue, HotIssueTrend } from "@/components/community/widgets/HotIssueWidget";
import type { OfficialPost } from "@/components/community/widgets/OfficialPostsWidget";

// ─────────────────────────────────────────────────────────────
// 필터 / 반환 타입
// ─────────────────────────────────────────────────────────────

export type NewsSort = "latest" | "importance" | "popular";

export interface NewsFilters {
  /** COIN_FILTERS key: ALL/BTC/ETH/XRP/SOL/ALT/STOCK */
  coin: string;
  /** NEWS_CATEGORIES key(영문 enum): all/market/regulation/... */
  category: string;
  /** SENTIMENT_FILTERS key */
  sentiment: NewsSentiment | "all";
  sort: NewsSort;
  /** 1-based, 누적("더 보기"는 0..page*PER_PAGE-1을 다시 렌더) */
  page: number;
}

export interface NewsFngData {
  value: number;
  prevValue?: number;
}

export interface NewsPageData {
  /** 필터 적용 목록 (누적 page*PER_PAGE개) */
  news: NewsListItem[];
  /** 필터 조건에 맞는 전체 건수 (헤더 표시·hasMore 판정) */
  total: number;
  /** 오늘의 헤드라인 3개 — 필터 독립(중요도 상위) */
  headlines: NewsListItem[];
  // 사이드바 위젯 실데이터
  tickers: TickerItem[];
  hotIssues: HotIssue[];
  fng: NewsFngData | null;
  officialPosts: OfficialPost[];
}

export const NEWS_PER_PAGE = 20;

// news 테이블 SELECT 컬럼 (NewsRow/HeadlineCard 소비분)
const NEWS_COLUMNS =
  "id, title, link, pub_date, source, sentiment, snippet, symbol, category, importance_score, sentiment_score";

const HOT_TREND_MAP: Record<string, HotIssueTrend> = {
  UP: "up",
  DOWN: "down",
  FLAT: "same",
  NEW: "new",
};

interface NewsRow {
  id: string;
  title: string;
  link: string;
  pub_date: string;
  source: string | null;
  sentiment: string | null;
  snippet: string | null;
  symbol: string | null;
  category: string | null;
  importance_score: number | null;
  sentiment_score: number | null;
}

// snake_case DB 행 → NewsListItem (NewsRow/HeadlineCard 계약)
function mapNewsRow(n: NewsRow, i: number): NewsListItem {
  const linkKey = n.link ? n.link.slice(-16) : String(i);
  return {
    id: `news-${i}-${linkKey}`,
    title: n.title,
    summary: n.snippet ?? "",
    sentiment: (n.sentiment ?? "neutral") as NewsSentiment,
    category: categoryLabel(n.category),
    source: n.source ?? "출처 미상",
    timeLabel: formatRelativeTime(n.pub_date),
    importance: n.importance_score ?? undefined,
    link: n.link,
    coinTag: n.symbol && n.symbol !== "ALL" ? n.symbol : undefined,
    sentimentScore: n.sentiment_score ?? undefined,
  };
}

// 쿠키 비의존 anon 클라이언트 + Next ISR(5분) 편입 fetch → 페이지 정적 prerender 유지
// (메인페이지 R2/T05 loadMainPageData와 동일 패턴)
function makeAnonClient() {
  return createAnonClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input: RequestInfo | URL, init?: RequestInit) =>
          fetch(input, { ...init, next: { revalidate: 300 } } as RequestInit),
      },
    }
  );
}

// ─────────────────────────────────────────────────────────────
// 단일 진입점 — 목록(4차원 서버 필터) + 헤드라인 + 사이드바 위젯 병렬 fetch
// ─────────────────────────────────────────────────────────────

export async function fetchNewsPageData(filters: NewsFilters): Promise<NewsPageData> {
  const supabase = makeAnonClient();
  const page = Math.max(1, filters.page);

  // 1. 뉴스 목록 — coin/category/sentiment/sort 4차원 서버 필터 + 누적 페이지네이션
  let listQuery = supabase.from("news").select(NEWS_COLUMNS, { count: "exact" });

  // 정렬: latest=pub_date desc / importance·popular=중요도 desc(보조 pub_date desc)
  //   popular(토론많은순)는 뉴스별 토론 실데이터가 없어 중요도순으로 대체(R2/T02 정책 유지)
  if (filters.sort === "latest") {
    listQuery = listQuery.order("pub_date", { ascending: false });
  } else {
    listQuery = listQuery
      .order("importance_score", { ascending: false, nullsFirst: false })
      .order("pub_date", { ascending: false });
  }

  if (filters.category !== "all") {
    listQuery = listQuery.eq("category", filters.category);
  }
  if (filters.sentiment !== "all") {
    listQuery = listQuery.eq("sentiment", filters.sentiment);
  }
  if (filters.coin !== "ALL") {
    // /api/news와 동일한 매칭(symbol 정확일치 OR 제목·요약 부분일치)으로 회귀 방지
    listQuery = listQuery.or(
      `symbol.eq.${filters.coin},title.ilike.%${filters.coin}%,snippet.ilike.%${filters.coin}%`
    );
  }
  listQuery = listQuery.range(0, page * NEWS_PER_PAGE - 1);

  // 2. 헤드라인 3개 — 필터 독립(전체 중 중요도 상위)
  const headlinesQuery = supabase
    .from("news")
    .select(NEWS_COLUMNS)
    .order("importance_score", { ascending: false, nullsFirst: false })
    .limit(3);

  // 3. 사이드바 — tickers/FNG는 외부 API라 .catch 격리, RPC·blog는 Supabase {data,error}
  const tickersP = fetchCommunityTickers().catch((e) => {
    console.error("[news] fetchCommunityTickers 실패:", e);
    return [] as CoinTicker[];
  });
  const fngP = fetchFng().catch((e) => {
    console.error("[news] fetchFng 실패:", e);
    return null;
  });
  const hotP = supabase.rpc("community_hot_issues", { hours_window: 24, result_limit: 10 });
  const officialP = supabase
    .from("blog_posts")
    .select("id, title, slug, created_at")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(3);

  const [listRes, headlineRes, tickers, fng, hotRes, officialRes] = await Promise.all([
    listQuery,
    headlinesQuery,
    tickersP,
    fngP,
    hotP,
    officialP,
  ]);

  // 사이드바 시세 — ticker 실데이터 + COIN_META 브랜드 메타
  const tickerItems: TickerItem[] = tickers.map((t) => {
    const meta = COIN_META[t.baseSymbol];
    return {
      symbol: t.baseSymbol,
      name: meta?.nameKo ?? t.baseSymbol,
      price: t.price,
      changePct: t.changePct,
      href: meta?.href ?? `/coin/${t.baseSymbol.toLowerCase()}`,
    };
  });

  const hotIssues: HotIssue[] = (
    (hotRes.data ?? []) as { symbol: string; recent_count: number; trend: string }[]
  ).map((h, i) => ({
    rank: i + 1,
    keyword: COIN_META[h.symbol]?.nameKo ?? (h.symbol === "ALL" ? "전체" : h.symbol),
    trend: HOT_TREND_MAP[h.trend] ?? "same",
    href: COIN_META[h.symbol]?.href,
  }));

  const officialPosts: OfficialPost[] = (
    (officialRes.data ?? []) as { title: string; slug: string; created_at: string | null }[]
  ).map((p) => ({
    slug: p.slug,
    title: p.title,
    date: (p.created_at ?? "").slice(0, 10),
  }));

  return {
    news: ((listRes.data ?? []) as NewsRow[]).map(mapNewsRow),
    total: listRes.count ?? (listRes.data?.length ?? 0),
    headlines: ((headlineRes.data ?? []) as NewsRow[]).map(mapNewsRow),
    tickers: tickerItems,
    hotIssues,
    fng: fng ? { value: fng.value, prevValue: fng.prevValue } : null,
    officialPosts,
  };
}
