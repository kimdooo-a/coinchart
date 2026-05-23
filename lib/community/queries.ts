// 메인페이지(app/page.tsx) SSR 데이터 쿼리 모음 (R1/T15, 2026-05-23)
// 더미(mock-*) 대체 — community_posts / news / blog_posts + Binance ticker + FNG + 핫이슈 RPC
//
// 주의: Supabase 서버 클라이언트는 lib/supabase/server.ts의 실제 export인
//       createClient()(async)를 사용한다. (명세서 표기 createServerClient 아님)

import { createClient } from "@/lib/supabase/server";
import { fetchCommunityTickers } from "@/lib/supabase/crypto";
import { fetchFng } from "@/lib/community/fng";
import type { CoinTicker } from "@/types/coins";

// ─────────────────────────────────────────────────────────────
// 타입
// ─────────────────────────────────────────────────────────────

export interface MainBestPost {
  id: string;
  boardSlug: string;
  title: string;
  authorName: string; // guest_nickname 또는 회원 표시
  authorMasked?: string; // 익명 글 IP 마스킹 ("211.34.*.*")
  category: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  isNotice: boolean;
  isHot: boolean;
}

export interface MainNewsItem {
  id: string;
  title: string;
  link: string;
  source: string | null;
  pubDate: string;
  sentiment: "positive" | "negative" | "mixed" | "neutral";
  category: string;
  importance: number;
  coinTag: string | null;
}

export interface MainBoardPreview {
  slug: string;
  posts: { id: string; title: string; createdAt: string; commentCount: number }[];
}

export interface MainCoinCard {
  slug: string;
  symbol: string;
  nameKo: string;
  price: number;
  changePct: number;
  description?: string;
  logoColor: string;
  logoEmoji: string;
}

export interface MainHotIssue {
  rank: number;
  symbol: string;
  count: number;
  trend: "UP" | "DOWN" | "FLAT" | "NEW";
}

export interface MainFng {
  value: number;
  prevValue?: number;
  classification: string;
}

export interface MainOfficialPost {
  id: string;
  title: string;
  slug: string;
  createdAt: string;
}

export interface MainPageData {
  tickers: CoinTicker[];
  bestPosts: MainBestPost[];
  latestNews: MainNewsItem[];
  boardPreviews: MainBoardPreview[];
  coinCards: MainCoinCard[];
  hotIssues: MainHotIssue[];
  fng: MainFng;
  officialPosts: MainOfficialPost[];
}

// ─────────────────────────────────────────────────────────────
// 코인 브랜드 메타 (정적 디스플레이 사전 — mock 데이터 아님)
//   ticker 실데이터(symbol/price/changePct)에 로고색·이모지·한국어명·링크를 덧입힌다.
// ─────────────────────────────────────────────────────────────

export interface CoinMeta {
  nameKo: string;
  logoColor: string;
  logoEmoji: string;
  href: string;
}

export const COIN_META: Record<string, CoinMeta> = {
  BTC: { nameKo: "비트코인", logoColor: "#F7931A", logoEmoji: "₿", href: "/coin/btc" },
  ETH: { nameKo: "이더리움", logoColor: "#627EEA", logoEmoji: "Ξ", href: "/coin/eth" },
  XRP: { nameKo: "리플", logoColor: "#23292F", logoEmoji: "✕", href: "/coin/xrp" },
  SOL: { nameKo: "솔라나", logoColor: "#9945FF", logoEmoji: "◎", href: "/coin/sol" },
  DOGE: { nameKo: "도지코인", logoColor: "#C2A633", logoEmoji: "Ð", href: "/coin/altcoin" },
  ADA: { nameKo: "카르다노", logoColor: "#0033AD", logoEmoji: "₳", href: "/coin/altcoin" },
  BNB: { nameKo: "바이낸스코인", logoColor: "#F3BA2F", logoEmoji: "B", href: "/coin/altcoin" },
  TRX: { nameKo: "트론", logoColor: "#EF0027", logoEmoji: "T", href: "/coin/altcoin" },
  LINK: { nameKo: "체인링크", logoColor: "#2A5ADA", logoEmoji: "L", href: "/coin/altcoin" },
  AVAX: { nameKo: "아발란체", logoColor: "#E84142", logoEmoji: "A", href: "/coin/altcoin" },
};

// ─────────────────────────────────────────────────────────────
// 메인페이지 데이터 — 단일 진입점
// ─────────────────────────────────────────────────────────────

export async function fetchMainPageData(): Promise<MainPageData> {
  const supabase = await createClient();

  // 1. tickers (Binance) — 외부 API 실패 시 빈 배열 폴백
  const tickersP = fetchCommunityTickers().catch((e) => {
    console.error("[main] fetchCommunityTickers 실패:", e);
    return [] as CoinTicker[];
  });

  // 2. FNG — 외부 API 실패 시 null 폴백
  const fngP = fetchFng().catch((e) => {
    console.error("[main] fetchFng 실패:", e);
    return null;
  });

  // 3. 베스트 30 (공지 제외, 추천·조회 상위)
  const bestP = supabase
    .from("community_posts")
    .select(
      "id, board_slug, title, guest_nickname, guest_ip_masked, category, view_count, like_count, comment_count, is_notice, is_hot, created_at, author_id"
    )
    .eq("is_deleted", false)
    .eq("is_notice", false)
    .order("like_count", { ascending: false })
    .order("view_count", { ascending: false })
    .limit(30);

  // 4. 최신 뉴스 10
  const newsP = supabase
    .from("news")
    .select("id, title, link, source, pub_date, sentiment, category, importance_score, symbol")
    .order("pub_date", { ascending: false })
    .limit(10);

  // 5. 게시판 3컬럼 (free/market/info 각 5개, 공지 제외)
  const boardPreviewQuery = (slug: string) =>
    supabase
      .from("community_posts")
      .select("id, title, created_at, comment_count")
      .eq("board_slug", slug)
      .eq("is_deleted", false)
      .eq("is_notice", false)
      .order("created_at", { ascending: false })
      .limit(5);
  const freeP = boardPreviewQuery("free");
  const marketP = boardPreviewQuery("market");
  const infoP = boardPreviewQuery("info");

  // 6. 핫이슈 RPC (5분 캐시 STABLE 함수)
  const hotP = supabase.rpc("community_hot_issues", { hours_window: 24, result_limit: 10 });

  // 7. 공식글 (블로그 published 최근 3)
  const officialP = supabase
    .from("blog_posts")
    .select("id, title, slug, created_at")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(3);

  // 병렬 fetch — Supabase 쿼리는 throw하지 않고 { data, error } 반환,
  // 외부 API(tickers/fng)는 위에서 .catch로 격리했으므로 전체 페이지 500 방지.
  const [tickers, fng, bestRes, newsRes, freeRes, marketRes, infoRes, hotRes, officialRes] =
    await Promise.all([tickersP, fngP, bestP, newsP, freeP, marketP, infoP, hotP, officialP]);

  // 코인 카드 6장 — ticker 실데이터 + 브랜드 메타
  const wantedSymbols = ["BTCUSDT", "ETHUSDT", "XRPUSDT", "SOLUSDT"];
  const coinCards: MainCoinCard[] = wantedSymbols.map((sym) => {
    const base = sym.replace(/USDT$/, "");
    const meta = COIN_META[base];
    const t = tickers.find((x) => x.symbol === sym);
    return {
      slug: base.toLowerCase(),
      symbol: base,
      nameKo: meta?.nameKo ?? base,
      price: t?.price ?? 0,
      changePct: t?.changePct ?? 0,
      logoColor: meta?.logoColor ?? "#6B7280",
      logoEmoji: meta?.logoEmoji ?? base.charAt(0),
    };
  });
  // altcoin / kimp는 시세가 아닌 종합 지표 — price 0 + description으로 표현
  coinCards.push({
    slug: "altcoin",
    symbol: "ALT",
    nameKo: "알트코인",
    price: 0,
    changePct: 0,
    description: "주요 알트코인 종합",
    logoColor: "#6B7280",
    logoEmoji: "🌐",
  });
  coinCards.push({
    slug: "kimp",
    symbol: "KIMP",
    nameKo: "김치프리미엄",
    price: 0,
    changePct: 0,
    description: "김치프리미엄 지표",
    logoColor: "#BA1A1A",
    logoEmoji: "🇰🇷",
  });

  return {
    tickers,
    bestPosts: (bestRes.data ?? []).map(mapBestPost),
    latestNews: (newsRes.data ?? []).map(mapNews),
    boardPreviews: [
      { slug: "free", posts: (freeRes.data ?? []).map(mapBoardPreview) },
      { slug: "market", posts: (marketRes.data ?? []).map(mapBoardPreview) },
      { slug: "info", posts: (infoRes.data ?? []).map(mapBoardPreview) },
    ],
    coinCards,
    hotIssues: (hotRes.data ?? []).map(
      (h: { symbol: string; recent_count: number; trend: string }, i: number) => ({
        rank: i + 1,
        symbol: h.symbol,
        count: Number(h.recent_count),
        trend: h.trend as MainHotIssue["trend"],
      })
    ),
    fng: fng
      ? { value: fng.value, prevValue: fng.prevValue, classification: fng.classification }
      : { value: 50, classification: "Neutral" },
    officialPosts: (officialRes.data ?? []).map(mapOfficialPost),
  };
}

// ─────────────────────────────────────────────────────────────
// 행 매퍼 (snake_case DB → camelCase 도메인)
// ─────────────────────────────────────────────────────────────

function mapBestPost(p: {
  id: string;
  board_slug: string;
  title: string;
  guest_nickname: string | null;
  guest_ip_masked: string | null;
  category: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  is_notice: boolean;
  is_hot: boolean;
  created_at: string;
  author_id: string | null;
}): MainBestPost {
  return {
    id: p.id,
    boardSlug: p.board_slug,
    title: p.title,
    authorName: p.guest_nickname ?? "회원",
    authorMasked: p.guest_ip_masked ?? undefined,
    category: p.category,
    viewCount: p.view_count,
    likeCount: p.like_count,
    commentCount: p.comment_count,
    createdAt: p.created_at,
    isNotice: p.is_notice,
    isHot: p.is_hot,
  };
}

function mapNews(n: {
  id: string;
  title: string;
  link: string;
  source: string | null;
  pub_date: string;
  sentiment: string | null;
  category: string | null;
  importance_score: number | null;
  symbol: string | null;
}): MainNewsItem {
  return {
    id: n.id,
    title: n.title,
    link: n.link,
    source: n.source,
    pubDate: n.pub_date,
    sentiment: (n.sentiment ?? "neutral") as MainNewsItem["sentiment"],
    category: n.category ?? "market",
    importance: n.importance_score ?? 5,
    coinTag: n.symbol === "ALL" ? null : n.symbol,
  };
}

function mapBoardPreview(p: {
  id: string;
  title: string;
  created_at: string;
  comment_count: number;
}) {
  return { id: p.id, title: p.title, createdAt: p.created_at, commentCount: p.comment_count };
}

function mapOfficialPost(o: {
  id: string;
  title: string;
  slug: string;
  created_at: string;
}): MainOfficialPost {
  return { id: o.id, title: o.title, slug: o.slug, createdAt: o.created_at };
}
