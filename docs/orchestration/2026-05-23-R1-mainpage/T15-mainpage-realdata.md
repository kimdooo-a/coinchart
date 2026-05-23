# T15 — mainpage-realdata

> **본 터미널은 R1 일꾼(T15)**. 4차 발사 — T01·T02·T03·T04·T06·T12·T13 완료 후.

## 정체성

- 역할: `worker` (T15), R1, mainpage
- 담당: 메인페이지 더미 제거 + 실데이터 연결 + mock-* 정리
- 의존: T01, T02, T03, T04, T06, T12, T13

## 컨텍스트

R1의 핵심 산출물. 다른 일꾼이 인프라·데이터·API를 모두 준비한 후 본 일꾼이 메인페이지를 실데이터로 통합한다. mock-* 파일은 신규 페이지(`/board/*`, `/coin/*`)들도 사용하므로 **메인페이지 영역만 정리**하고, 다른 페이지가 의존하는 부분은 그대로 두거나 별도 SSOT로 이전.

## 공통 SOT

```
CLAUDE.md
app/page.tsx                                 ← 수정 대상 (메인페이지)
lib/community/mock-coins.ts                  ← TICKER_LIST/HOT_ISSUES/OFFICIAL_POSTS/COINS 더미
lib/community/mock-posts.ts                  ← getBestPosts/MOCK_POSTS/BOARD_META 더미
lib/community/mock-news.ts                   ← MOCK_NEWS 더미
docs/handover/2026-05-23-R1-T01-community-migrations.md
docs/handover/2026-05-23-R1-T02-community-seed.md
docs/handover/2026-05-23-R1-T03-ticker-ssot.md
docs/handover/2026-05-23-R1-T04-fng-proxy.md
docs/handover/2026-05-23-R1-T06-news-classify-integration.md
docs/handover/2026-05-23-R1-T12-board-api.md
docs/handover/2026-05-23-R1-T13-hot-issues-rpc.md
lib/supabase/server.ts                       ← SSR 클라이언트
```

## 작업 목표

1. `lib/community/queries.ts` 신규 — 메인 SSR 쿼리 모음
2. `app/page.tsx` 수정 — `"use client"` 제거(SSR), mock import 제거, queries 호출
3. `mock-coins.ts` / `mock-posts.ts` / `mock-news.ts` 부분 정리 (메인이 사용하던 export만 삭제, 나머지는 보존)

## 산출물

#### 1. `lib/community/queries.ts` (신규)

```ts
import { createServerClient } from "@/lib/supabase/server";
import { fetchCommunityTickers } from "@/lib/supabase/crypto";
import { fetchFng } from "@/lib/community/fng";
import type { CoinTicker } from "@/types/coins";

export interface MainBestPost {
  id: string;
  boardSlug: string;
  title: string;
  authorName: string;          // guest_nickname 또는 회원 닉네임 표시 결정
  authorMasked?: string;
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
  posts: Pick<MainBestPost, "id" | "title" | "createdAt" | "commentCount">[];
}

export interface MainCoinCard {
  slug: string;
  symbol: string;
  price: number;
  changePct: number;
  description?: string;
  logoColor?: string;
  logoEmoji?: string;
}

export interface MainHotIssue {
  rank: number;
  symbol: string;
  count: number;
  trend: "UP" | "DOWN" | "FLAT" | "NEW";
}

export interface MainPageData {
  tickers: CoinTicker[];
  bestPosts: MainBestPost[];
  latestNews: MainNewsItem[];
  boardPreviews: MainBoardPreview[];
  coinCards: MainCoinCard[];
  hotIssues: MainHotIssue[];
  fng: { value: number; prevValue?: number; classification: string };
  officialPosts: { id: string; title: string; createdAt: string; href: string }[];
}

export async function fetchMainPageData(): Promise<MainPageData> {
  const supabase = createServerClient();

  // 1. tickers (Binance)
  const tickersP = fetchCommunityTickers();

  // 2. FNG
  const fngP = fetchFng();

  // 3. 베스트 30 (is_hot OR 추천 상위)
  const bestP = supabase
    .from("community_posts")
    .select("id, board_slug, title, guest_nickname, guest_ip_masked, category, view_count, like_count, comment_count, is_notice, is_hot, created_at, author_id")
    .eq("is_deleted", false)
    .order("like_count", { ascending: false })
    .order("view_count", { ascending: false })
    .limit(30);

  // 4. 최신 뉴스 10
  const newsP = supabase
    .from("news")
    .select("id, title, link, source, pub_date, sentiment, category, importance_score, symbol")
    .order("pub_date", { ascending: false })
    .limit(10);

  // 5. 게시판 3컬럼 (free/market/info 각 5개)
  const freeP   = supabase.from("community_posts").select("id, title, created_at, comment_count").eq("board_slug", "free").eq("is_deleted", false).eq("is_notice", false).order("created_at", { ascending: false }).limit(5);
  const marketP = supabase.from("community_posts").select("id, title, created_at, comment_count").eq("board_slug", "market").eq("is_deleted", false).eq("is_notice", false).order("created_at", { ascending: false }).limit(5);
  const infoP   = supabase.from("community_posts").select("id, title, created_at, comment_count").eq("board_slug", "info").eq("is_deleted", false).eq("is_notice", false).order("created_at", { ascending: false }).limit(5);

  // 6. 핫이슈 RPC
  const hotP = supabase.rpc("community_hot_issues", { hours_window: 24, result_limit: 10 });

  // 7. 공식글 (블로그 published 최근 3)
  const officialP = supabase.from("blog_posts").select("id, title, slug, created_at").eq("status", "published").order("created_at", { ascending: false }).limit(3);

  // 병렬 fetch
  const [tickers, fng, bestRes, newsRes, freeRes, marketRes, infoRes, hotRes, officialRes] = await Promise.all([
    tickersP, fngP, bestP, newsP, freeP, marketP, infoP, hotP, officialP,
  ]);

  // 코인 카드 6장 — ticker에서 추출
  const wantedSymbols = ["BTCUSDT", "ETHUSDT", "XRPUSDT", "SOLUSDT"];
  const coinCards: MainCoinCard[] = wantedSymbols.map((sym) => {
    const t = tickers.find((x) => x.symbol === sym);
    return {
      slug: sym.replace(/USDT$/, "").toLowerCase(),
      symbol: sym.replace(/USDT$/, ""),
      price: t?.price ?? 0,
      changePct: t?.changePct ?? 0,
    };
  });
  // altcoin / kimp는 별도 표현 (price 0 + description)
  coinCards.push({ slug: "altcoin", symbol: "ALT", price: 0, changePct: 0, description: "주요 알트코인 종합" });
  coinCards.push({ slug: "kimp", symbol: "KIMP", price: 0, changePct: 0, description: "김치프리미엄 지표" });

  return {
    tickers,
    bestPosts: (bestRes.data ?? []).map((p) => mapBestPost(p)),
    latestNews: (newsRes.data ?? []).map((n) => mapNews(n)),
    boardPreviews: [
      { slug: "free",   posts: (freeRes.data ?? []).map(mapBoardPreview) },
      { slug: "market", posts: (marketRes.data ?? []).map(mapBoardPreview) },
      { slug: "info",   posts: (infoRes.data ?? []).map(mapBoardPreview) },
    ],
    coinCards,
    hotIssues: (hotRes.data ?? []).map((h: { symbol: string; recent_count: number; trend: string }, i: number) => ({
      rank: i + 1,
      symbol: h.symbol,
      count: Number(h.recent_count),
      trend: h.trend as "UP" | "DOWN" | "FLAT" | "NEW",
    })),
    fng: { value: fng.value, prevValue: fng.prevValue, classification: fng.classification },
    officialPosts: (officialRes.data ?? []).map((o) => ({
      id: o.id,
      title: o.title,
      createdAt: o.created_at,
      href: `/blog/${o.slug}`,
    })),
  };
}

function mapBestPost(p: { id: string; board_slug: string; title: string; guest_nickname: string | null; guest_ip_masked: string | null; category: string; view_count: number; like_count: number; comment_count: number; is_notice: boolean; is_hot: boolean; created_at: string; author_id: string | null }): MainBestPost {
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

function mapNews(n: { id: string; title: string; link: string; source: string | null; pub_date: string; sentiment: string; category: string; importance_score: number; symbol: string }): MainNewsItem {
  return {
    id: n.id,
    title: n.title,
    link: n.link,
    source: n.source,
    pubDate: n.pub_date,
    sentiment: n.sentiment as "positive" | "negative" | "mixed" | "neutral",
    category: n.category,
    importance: n.importance_score,
    coinTag: n.symbol === "ALL" ? null : n.symbol,
  };
}

function mapBoardPreview(p: { id: string; title: string; created_at: string; comment_count: number }) {
  return { id: p.id, title: p.title, createdAt: p.created_at, commentCount: p.comment_count };
}
```

#### 2. `app/page.tsx` (수정 — 전체 재작성)

- `"use client"` 제거 → SSR 페이지
- mock-* import 모두 제거
- `fetchMainPageData()` 호출 (async server component)
- 기존 JSX 구조는 보존하되, 데이터 소스만 교체
- 시세 마퀴: `tickers.map(...)` (ticker 더미 자리에)
- 베스트 30: `bestPosts.map((p, i) => <BoardRow ...>)` — `BoardPost` 인터페이스 호환 위해 변환 가능
- 최신 뉴스: `latestNews.map(n => <NewsRow .../>)`
- 게시판 3컬럼: `boardPreviews` 사용
- 코인룸 6카드: `coinCards` 사용
- 사이드바: `tickers.slice(0,8)`, `hotIssues`, `fng.value`, `officialPosts`
- 5분 ISR: `export const revalidate = 300;`

데이터 누락 시 fallback 처리:
- `bestPosts.length === 0`이면 "아직 게시글이 없습니다" 안내
- 뉴스 0이면 "" 안내
- 외부 API 실패 시 try/catch로 부분 fallback (전체 페이지 500 방지)

#### 3. `lib/community/mock-coins.ts` / `mock-posts.ts` / `mock-news.ts` (부분 삭제)

메인 외 다른 페이지(`/board/*`, `/coin/*`, `/news`)가 의존하는 export는 보존:
- `mock-posts.ts`: `BOARD_META`, `MockPost` 타입, `MOCK_POSTS` (다른 페이지가 사용 중) → **보존**
- `mock-coins.ts`: `COINS`, `CoinDetail` (코인룸 페이지가 사용 중) → **보존**, `TICKER_LIST`/`HOT_ISSUES`/`OFFICIAL_POSTS`만 deprecated 주석 추가
- `mock-news.ts`: `MOCK_NEWS`는 `/news` 페이지가 아직 사용 중이므로 보존

→ 결국 mock-* 파일은 **삭제하지 않고** 메인페이지가 import하지 않도록만 변경. R2에서 `/board/*`, `/news`, `/coin/*`까지 실데이터 전환 시 본격 정리.

#### 4. `docs/status/current.md` (수정 — append)

R1 완료 시점에 본 일꾼이 메인 실데이터 전환 상태를 status에 반영. (CEO 검증 후 갱신할 수도 있으나 본 일꾼이 초안 작성)

```markdown
### R1 메인페이지 실데이터 전환 완료 (2026-05-23)
- `app/page.tsx`: mock-* import 0건, SSR + 5분 ISR
- 데이터 소스: community_posts(베스트·게시판·핫이슈), news, Binance ticker, FNG, blog_posts(공식글)
- 더미 데이터 파일: 보존 (R2 정리 대상)
```

## 작업 단계

1. SOT 읽기 (다른 일꾼 handover 전부)
2. `lib/community/queries.ts` 작성
3. `app/page.tsx` 재작성 (기존 JSX 구조 보존)
4. mock-* 일부 deprecated 주석
5. status 업데이트
6. 검증

## 검증

```bash
npx tsc --noEmit

# mock import 0건 검증
grep -c "from \"@/lib/community/mock-\|from '@/lib/community/mock-" app/page.tsx
# 기대: 0

# "use client" 제거 검증
grep -c "use client" app/page.tsx
# 기대: 0

# fetchMainPageData 호출 검증
grep -c "fetchMainPageData" app/page.tsx
# 기대: 1 이상

# revalidate 설정 검증
grep -c "export const revalidate" app/page.tsx
# 기대: 1

# 빌드
npm run build 2>&1 | tail -30

# (실데이터 빌드 검증은 다음 단계)
# 사용자가 DB에 시드 적용 후 npm run dev 로 메인 진입 → 모든 섹션이 비어있지 않아야 함
```

## 완료 신호

`docs/handover/2026-05-23-R1-T15-mainpage-realdata.md` 작성.

명시:
- mock import 0건 증거
- 5분 ISR 적용 확인
- 의존성 8개 (T01·T02·T03·T04·T06·T12·T13) 산출물 사용 위치 표
- fallback 처리 패턴
- 시각 검증 권장 명령 (`npm run dev` + 시안 PNG 비교)
- R2 후보: `/board/*`, `/news`, `/coin/*`도 실데이터 전환

## 안티패턴

- 다른 일꾼 산출물 수정 금지 (자기 영역 외)
- mock-* 파일 완전 삭제 금지 (다른 페이지가 의존)
- JSX 구조 대폭 변경 금지 (디자인 회귀 위험)
- `lib/community/mock-*`이 아니라 `lib/community/seed-data`로 이름 변경하지 말 것 (다음 라운드)
- 새 패키지 설치 금지
