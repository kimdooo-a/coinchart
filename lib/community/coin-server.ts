// 코인룸(/coin/[symbol]) SSR 서버 데이터 로더 (R3/T04, 2026-05-24)
//
// 배경: R2/T03에서 /coin/[symbol]은 "use client" + coin-queries.ts 클라 fetch로 실데이터화됐다.
//       R3/T04는 SEO 강화를 위해 SSR(async 서버 컴포넌트)로 전환한다. 본 모듈이 그 서버측 단일 진입점이다.
//
// 설계 결정 (왜 coin-queries.ts에 추가하지 않고 별도 모듈인가):
//   - coin-queries.ts는 서버/클라 양쪽에서 import하는 순수 모듈(정적 메타·뷰 헬퍼)로 유지한다.
//     거기에 Supabase 클라이언트를 넣으면 클라 번들 경계가 모호해진다.
//   - 따라서 메인페이지 queries.ts(server) / news-server.ts와 동일한 server-only 로더 분리 패턴을 따른다.
//   - coin-queries.ts의 순수 부분(정적 메타·buildCoinView·findTicker·toTickerItems·formatRelativeTime)만 재사용한다.
//
// 데이터 소스: /api 자기 fetch 대신 anon Supabase 클라이언트로 직접 쿼리한다(news-server.ts·R2/T05 패턴).
//   이유: (1) 쿠키 비의존 anon 클라이언트 + next.revalidate(5분)로 페이지 정적 ISR 유지,
//        (2) 서버 self-fetch의 origin 해석 문제 회피, (3) 메인/뉴스 SSR과 일관.
//   시세(Binance)·FNG는 외부 API 모듈을 직접 호출하고 .catch로 격리한다(전체 페이지 500 방지).

import { createClient as createAnonClient } from "@supabase/supabase-js";
import { fetchCommunityTickers } from "@/lib/supabase/crypto";
import { fetchFng } from "@/lib/community/fng";
import { categoryLabel } from "@/lib/community/news-queries";
import {
  buildCoinView,
  findTicker,
  toTickerItems,
  formatRelativeTime,
  COIN_META,
  type CoinRoomMeta,
  type CoinRoomView,
  type CoinBoardPost,
  type CoinNewsItem,
  type FngView,
} from "@/lib/community/coin-queries";
import type { CoinTicker } from "@/types/coins";
import type { NewsSentiment } from "@/components/community/NewsHeadlineCard";
import type { TickerItem } from "@/components/community/widgets/PriceTickerWidget";
import type { HotIssue, HotIssueTrend } from "@/components/community/widgets/HotIssueWidget";
import type { OfficialPost } from "@/components/community/widgets/OfficialPostsWidget";

// ─────────────────────────────────────────────────────────────
// 반환 타입 — 코인룸 1페이지 전체 데이터
// ─────────────────────────────────────────────────────────────

export interface CoinRoomData {
  /** 정적 메타 + 실시세 병합 뷰 (히어로·사이드바 핵심지표) */
  coin: CoinRoomView;
  /** 게시판 일반글 (최신순 최대 30) */
  posts: CoinBoardPost[];
  /** 게시판 공지글 */
  notices: CoinBoardPost[];
  /** 인기글 (추천수 상위 10) */
  trending: CoinBoardPost[];
  /** 코인 관련 뉴스 (최신순 최대 30) */
  news: CoinNewsItem[];
  /** 사이드바 시세 위젯 (상위 6) */
  tickerItems: TickerItem[];
  /** 사이드바 핫이슈 (상위 5) */
  hotIssues: HotIssue[];
  /** 사이드바 공포·탐욕 지수 */
  fng: FngView | null;
  /** 사이드바 공식글 (블로그 published 3) */
  officialPosts: OfficialPost[];
}

// 게시글 SELECT 컬럼 (CoinBoardPost 소비분 — community_posts 실컬럼명)
const POST_COLUMNS =
  "id, board_slug, title, author_id, guest_nickname, guest_ip_masked, category, view_count, like_count, comment_count, is_notice, is_hot, created_at";

// 뉴스 SELECT 컬럼 (NewsRow 소비분 — news 실컬럼명)
const NEWS_COLUMNS =
  "id, title, link, pub_date, source, sentiment, snippet, symbol, category, importance_score";

const HOT_TREND_MAP: Record<string, HotIssueTrend> = {
  UP: "up",
  DOWN: "down",
  FLAT: "same",
  NEW: "new",
};

// ─────────────────────────────────────────────────────────────
// DB row 형태 + 매퍼 (snake_case DB → 컴포넌트 뷰 타입)
// ─────────────────────────────────────────────────────────────

interface PostRow {
  id: string;
  board_slug: string;
  title: string;
  author_id: string | null;
  guest_nickname: string | null;
  guest_ip_masked: string | null;
  category: string | null;
  view_count: number | null;
  like_count: number | null;
  comment_count: number | null;
  is_notice: boolean | null;
  is_hot: boolean | null;
  created_at: string;
}

function mapPostRow(row: PostRow, index: number): CoinBoardPost {
  const created = new Date(row.created_at).getTime();
  return {
    id: index + 1,
    number: index + 1,
    uuid: row.id,
    boardSlug: row.board_slug,
    title: row.title,
    author: row.guest_nickname ?? "회원",
    authorIp: row.guest_ip_masked
      ? row.guest_ip_masked.split(".").slice(0, 2).join(".")
      : undefined,
    isAdmin: false,
    createdAt: formatRelativeTime(row.created_at),
    views: row.view_count ?? 0,
    likes: row.like_count ?? 0,
    commentCount: row.comment_count ?? 0,
    isNotice: row.is_notice ?? false,
    isHot: row.is_hot ?? false,
    isNew: !Number.isNaN(created) && Date.now() - created < 24 * 3600 * 1000,
    category: row.category ?? undefined,
  };
}

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
}

function mapNewsRow(n: NewsRow, index: number): CoinNewsItem {
  return {
    id: n.link || `news-${index}`,
    title: n.title,
    summary: n.snippet ?? "",
    sentiment: (n.sentiment ?? "neutral") as NewsSentiment,
    category: categoryLabel(n.category),
    source: n.source ?? "출처 미상",
    timeLabel: formatRelativeTime(n.pub_date),
    importance: n.importance_score ?? undefined,
    link: n.link,
    coinTag: n.symbol && n.symbol !== "ALL" ? n.symbol : undefined,
  };
}

// 쿠키 비의존 anon 클라이언트 + Next ISR(5분) 편입 fetch → 페이지 정적 prerender 유지
// (news-server.ts·메인페이지 R2/T05와 동일 패턴)
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
// 단일 진입점 — 시세·게시글·뉴스·핫이슈·FNG·공식글 병렬 fetch
// ─────────────────────────────────────────────────────────────

export async function fetchCoinRoomData(meta: CoinRoomMeta): Promise<CoinRoomData> {
  const supabase = makeAnonClient();

  // 1. 시세 (Binance) — 외부 API 실패 시 빈 배열 폴백
  const tickersP = fetchCommunityTickers().catch((e) => {
    console.error("[coin] fetchCommunityTickers 실패:", e);
    return [] as CoinTicker[];
  });

  // 2. FNG — 외부 API 실패 시 null 폴백
  const fngP = fetchFng().catch((e) => {
    console.error("[coin] fetchFng 실패:", e);
    return null;
  });

  // 3. 게시판 공지글 (board_slug 일치, 항상 상단)
  const noticeP = supabase
    .from("community_posts")
    .select(POST_COLUMNS)
    .eq("board_slug", meta.boardSlug)
    .eq("is_deleted", false)
    .eq("is_notice", true)
    .order("created_at", { ascending: false });

  // 4. 게시판 일반글 (최신순 최대 30 — /api/board?limit=30&sort=recent와 동일)
  const postsP = supabase
    .from("community_posts")
    .select(POST_COLUMNS)
    .eq("board_slug", meta.boardSlug)
    .eq("is_deleted", false)
    .eq("is_notice", false)
    .order("created_at", { ascending: false })
    .limit(30);

  // 5. 코인 관련 뉴스 — coinTagFilter="ALL"(kimp)이면 필터 없이 최신,
  //    그 외는 symbol 정확일치 OR 제목·요약 부분일치(/api/news·news-server와 동일 규칙).
  let newsQuery = supabase
    .from("news")
    .select(NEWS_COLUMNS)
    .order("pub_date", { ascending: false })
    .limit(30);
  if (meta.coinTagFilter !== "ALL") {
    const tag = meta.coinTagFilter;
    newsQuery = newsQuery.or(
      `symbol.eq.${tag},title.ilike.%${tag}%,snippet.ilike.%${tag}%`
    );
  }

  // 6. 핫이슈 RPC (5분 캐시 STABLE 함수)
  const hotP = supabase.rpc("community_hot_issues", { hours_window: 24, result_limit: 10 });

  // 7. 공식글 (블로그 published 최근 3)
  const officialP = supabase
    .from("blog_posts")
    .select("id, title, slug, created_at")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(3);

  const [tickers, fng, noticeRes, postsRes, newsRes, hotRes, officialRes] = await Promise.all([
    tickersP,
    fngP,
    noticeP,
    postsP,
    newsQuery,
    hotP,
    officialP,
  ]);

  // 정적 메타 + 실시세 병합 (집계형 altcoin/kimp는 ticker 미존재 → 정적 폴백 유지)
  const coin = buildCoinView(meta, findTicker(tickers, meta.symbol));

  const posts = ((postsRes.data ?? []) as PostRow[]).map(mapPostRow);
  const notices = ((noticeRes.data ?? []) as PostRow[]).map(mapPostRow);
  // 인기글: 추천수 상위 10 (서버 정렬)
  const trending = [...posts].sort((a, b) => b.likes - a.likes).slice(0, 10);

  const tickerItems = toTickerItems(tickers).slice(0, 6);

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
    coin,
    posts,
    notices,
    trending,
    news: ((newsRes.data ?? []) as NewsRow[]).map(mapNewsRow),
    tickerItems,
    hotIssues: hotIssues.slice(0, 5),
    fng: fng ? { value: fng.value, label: fng.classification, prevValue: fng.prevValue } : null,
    officialPosts,
  };
}
