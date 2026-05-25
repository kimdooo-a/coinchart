// 코인룸(/coin/[symbol]) 정적 메타 사전 + 순수 뷰 헬퍼 (R2/T03 → R3/T04 SSR 전환, 2026-05-24)
//
// R2/T03에서는 본 파일이 "클라이언트 fetch 래퍼 + 정적 메타"를 함께 보유했으나,
// R3/T04에서 /coin/[symbol]을 SSR(async 서버 컴포넌트)로 전환하면서 데이터 fetch 책임은
// lib/community/coin-server.ts(server-only, anon Supabase 직접 쿼리)로 이관했다.
// 본 파일은 이제 다음만 보유한다 — 서버/클라 양쪽에서 안전하게 import 가능한 순수 모듈:
//   - 코인 브랜드 메타(COIN_META) / 코인룸 6종 정적 메타(COIN_ROOMS) + 접근자
//   - 정적 메타 + 실시세 병합 뷰 빌더(buildCoinView)
//   - 시세 배열 순수 헬퍼(findTicker / toTickerItems) + 상대시간 포맷터(formatRelativeTime)
//   - 게시글/뉴스/FNG 뷰 타입(coin-server·CoinRoomTabs 공유)
//
// 더미(mock-*) 의존 0건: 정적 메타(이름·심볼·로고색·설명·태그·시총·도미넌스·7d/30d 등 실시간 단일
// 소스가 없는 표시값)는 본 파일이 자체 보유하고, 시세(price/changePct/24h고저/거래량)는
// coin-server가 /api/coins/ticker 실데이터(Binance)로 덮어쓴다. mock-coins/mock-posts/mock-news를
// import하지 않으므로 T05(mock-* 삭제)의 차단점이 되지 않는다.

import type { CoinHeroData } from "@/components/community/CoinHero";
import type { BoardPost } from "@/components/community/BoardRow";
import type { NewsHeadlineItem } from "@/components/community/NewsHeadlineCard";
import type { TickerItem } from "@/components/community/widgets/PriceTickerWidget";
import type { CoinTicker } from "@/types/coins";

// ─────────────────────────────────────────────────────────────
// 코인 브랜드 메타 (사이드바 시세/핫이슈 라벨·링크용 — 정적 디스플레이 사전)
//   queries.ts(COIN_META)와 동일 출처지만, 서버 전용 모듈 import를 피하려고 여기 재정의.
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
  ALT: { nameKo: "알트코인", logoColor: "#6B7280", logoEmoji: "🌐", href: "/coin/altcoin" },
  KIMP: { nameKo: "김치프리미엄", logoColor: "#BA1A1A", logoEmoji: "🇰🇷", href: "/coin/kimp" },
};

// ─────────────────────────────────────────────────────────────
// 코인룸 6종 정적 메타 (btc/eth/xrp/sol/altcoin/kimp)
//   staticPrice/staticChangePct/staticHigh24h/staticLow24h/volume24hUsd 는 ticker
//   실데이터가 없을 때(외부 API 실패 / 집계형 코인)만 쓰는 표시 폴백값.
//   marketCapUsd/marketCapRank/change7d/change30d/dominance/circulatingSupply 는
//   실시간 단일 소스가 없어 정적 표시값으로 유지한다(handover에 명시).
// ─────────────────────────────────────────────────────────────

const SPARK_UP = [10, 12, 11, 14, 13, 16, 18, 17, 19, 22, 24, 26, 28];
const SPARK_DOWN = [28, 26, 27, 24, 25, 22, 20, 21, 18, 16, 14, 12, 10];
const SPARK_SIDE = [18, 19, 17, 20, 18, 19, 21, 18, 20, 19, 21, 20, 19];

export interface CoinRoomMeta {
  slug: string;
  symbol: string;
  name: string;
  nameKo: string;
  logoEmoji: string;
  logoColor: string;
  description: string;
  tags: string[];
  sparkline: number[];
  coinTagFilter: string; // 게시글/뉴스 필터 태그 (BTC / ETH / ... / ALT / ALL)
  boardSlug: string; // 게시판 slug (coin-btc / ... / coin-kimp)
  binanceSymbol: string | null; // 실시세 심볼 (BTCUSDT) — 집계형은 null
  isAggregate: boolean; // altcoin / kimp = true (단일 코인 실시세 없음)
  // 정적 표시값
  marketCapUsd: number;
  marketCapRank: number;
  change7d: number;
  change30d: number;
  dominance?: number;
  circulatingSupply?: string;
  // 시세 폴백 표시값 (ticker 미가용 시)
  staticPrice: number;
  staticChangePct: number;
  staticHigh24h: number;
  staticLow24h: number;
  volume24hUsd: number;
}

const COIN_ROOMS: Record<string, CoinRoomMeta> = {
  btc: {
    slug: "btc", symbol: "BTC", name: "Bitcoin", nameKo: "비트코인",
    logoEmoji: "₿", logoColor: "#F7931A",
    description: "글로벌 디지털 자산 시장의 기축통화. 사상 최고가 갱신 흐름 지속 중.",
    tags: ["PoW", "Layer1", "Store of Value"], sparkline: SPARK_UP,
    coinTagFilter: "BTC", boardSlug: "coin-btc", binanceSymbol: "BTCUSDT", isAggregate: false,
    marketCapUsd: 2_610_000_000_000, marketCapRank: 1, change7d: 5.2, change30d: 12.4,
    dominance: 53.2, circulatingSupply: "19.7M BTC",
    staticPrice: 132400, staticChangePct: 1.58, staticHigh24h: 133200, staticLow24h: 130500,
    volume24hUsd: 34_200_000_000,
  },
  eth: {
    slug: "eth", symbol: "ETH", name: "Ethereum", nameKo: "이더리움",
    logoEmoji: "Ξ", logoColor: "#627EEA",
    description: "스마트 컨트랙트 플랫폼의 표준. L2 생태계 확장 중.",
    tags: ["PoS", "Smart Contract", "L1"], sparkline: SPARK_SIDE,
    coinTagFilter: "ETH", boardSlug: "coin-eth", binanceSymbol: "ETHUSDT", isAggregate: false,
    marketCapUsd: 540_000_000_000, marketCapRank: 2, change7d: 3.1, change30d: 8.7,
    circulatingSupply: "120.3M ETH",
    staticPrice: 4520, staticChangePct: -0.5, staticHigh24h: 4580, staticLow24h: 4480,
    volume24hUsd: 14_500_000_000,
  },
  xrp: {
    slug: "xrp", symbol: "XRP", name: "XRP", nameKo: "리플",
    logoEmoji: "✕", logoColor: "#23292F",
    description: "국경 간 송금 최적화 자산. SEC 항소심 진행 중.",
    tags: ["Payment", "Cross-border"], sparkline: SPARK_UP,
    coinTagFilter: "XRP", boardSlug: "coin-xrp", binanceSymbol: "XRPUSDT", isAggregate: false,
    marketCapUsd: 158_000_000_000, marketCapRank: 4, change7d: 8.2, change30d: -2.1,
    circulatingSupply: "55.4B XRP",
    staticPrice: 2.85, staticChangePct: 3.4, staticHigh24h: 2.92, staticLow24h: 2.74,
    volume24hUsd: 4_200_000_000,
  },
  sol: {
    slug: "sol", symbol: "SOL", name: "Solana", nameKo: "솔라나",
    logoEmoji: "◎", logoColor: "#9945FF",
    description: "고성능 L1. 디파이·NFT 생태계 활발.",
    tags: ["High TPS", "DeFi", "L1"], sparkline: SPARK_UP,
    coinTagFilter: "SOL", boardSlug: "coin-sol", binanceSymbol: "SOLUSDT", isAggregate: false,
    marketCapUsd: 116_000_000_000, marketCapRank: 5, change7d: 2.5, change30d: 18.3,
    circulatingSupply: "473M SOL",
    staticPrice: 245.1, staticChangePct: 0.8, staticHigh24h: 248, staticLow24h: 240,
    volume24hUsd: 5_600_000_000,
  },
  altcoin: {
    slug: "altcoin", symbol: "ALT", name: "Altcoin", nameKo: "알트코인",
    logoEmoji: "🌐", logoColor: "#6B7280",
    description: "BTC·ETH 외 알트코인 통합 동향. 단일 코인 시세가 아닌 종합 지표입니다.",
    tags: ["Mixed"], sparkline: SPARK_SIDE,
    coinTagFilter: "ALT", boardSlug: "coin-altcoin", binanceSymbol: null, isAggregate: true,
    marketCapUsd: 480_000_000_000, marketCapRank: 0, change7d: 4.5, change30d: 9.0,
    staticPrice: 0, staticChangePct: 1.2, staticHigh24h: 0, staticLow24h: 0,
    volume24hUsd: 8_900_000_000,
  },
  kimp: {
    slug: "kimp", symbol: "KIMP", name: "Kimchi Premium", nameKo: "김치프리미엄",
    logoEmoji: "🇰🇷", logoColor: "#BA1A1A",
    description: "한국 거래소와 글로벌 거래소 간 가격 차이(%). 단일 코인 시세가 아닌 종합 지표입니다.",
    tags: ["KR vs Global"], sparkline: SPARK_DOWN,
    coinTagFilter: "ALL", boardSlug: "coin-kimp", binanceSymbol: null, isAggregate: true,
    marketCapUsd: 0, marketCapRank: 0, change7d: -1.2, change30d: 2.8,
    staticPrice: 5.2, staticChangePct: 0.7, staticHigh24h: 6.1, staticLow24h: 4.8,
    volume24hUsd: 0,
  },
};

/** 코인룸 슬러그 6종 (btc/eth/xrp/sol/altcoin/kimp) — 라우트 검증·생성용 */
export const COIN_ROOM_SLUGS = Object.keys(COIN_ROOMS);

export function getCoinRoomMeta(slug: string): CoinRoomMeta | null {
  return COIN_ROOMS[slug.toLowerCase()] ?? null;
}

// ─────────────────────────────────────────────────────────────
// 코인룸 표시 뷰 (정적 메타 + 실시세 병합)
// ─────────────────────────────────────────────────────────────

export interface CoinRoomView extends CoinHeroData {
  slug: string;
  description: string;
  coinTagFilter: string;
  high24h: number;
  low24h: number;
  change7d: number;
  change30d: number;
  dominance?: number;
  circulatingSupply?: string;
}

/** 정적 메타에 ticker 실데이터(price/changePct/24h고저/거래량)를 덮어쓴다. ticker=null이면 정적 폴백. */
export function buildCoinView(meta: CoinRoomMeta, ticker: CoinTicker | null): CoinRoomView {
  return {
    symbol: meta.symbol,
    name: meta.name,
    nameKo: meta.nameKo,
    logoEmoji: meta.logoEmoji,
    logoColor: meta.logoColor,
    price: ticker?.price ?? meta.staticPrice,
    changePct: ticker?.changePct ?? meta.staticChangePct,
    volume24hUsd: ticker?.volume24hUsd ?? meta.volume24hUsd,
    marketCapUsd: meta.marketCapUsd,
    marketCapRank: meta.marketCapRank,
    tags: meta.tags,
    sparkline: meta.sparkline,
    slug: meta.slug,
    description: meta.description,
    coinTagFilter: meta.coinTagFilter,
    high24h: ticker?.high24h ?? meta.staticHigh24h,
    low24h: ticker?.low24h ?? meta.staticLow24h,
    change7d: meta.change7d,
    change30d: meta.change30d,
    dominance: meta.dominance,
    circulatingSupply: meta.circulatingSupply,
  };
}

// ─────────────────────────────────────────────────────────────
// 게시글 / 뉴스 / FNG 뷰 타입 (coin-server 산출 · CoinRoomTabs 소비 공유 계약)
// ─────────────────────────────────────────────────────────────

/** 게시글 행: BoardRow에 넘길 BoardPost + 라우팅/key용 uuid·boardSlug */
export interface CoinBoardPost extends BoardPost {
  uuid: string; // community_posts.id (href용)
  boardSlug: string; // coin-btc 등
}

/** NewsRow가 소비하는 형태 (coinTag 포함) */
export type CoinNewsItem = NewsHeadlineItem & { coinTag?: string };

export interface FngView {
  value: number;
  label: string;
  prevValue?: number;
}

// ─────────────────────────────────────────────────────────────
// 순수 헬퍼 (서버/클라 공용 — fetch 없음)
// ─────────────────────────────────────────────────────────────

/** tickers 배열에서 특정 base 심볼(BTC 등)의 ticker. 없으면 null. */
export function findTicker(tickers: CoinTicker[], baseSymbol: string): CoinTicker | null {
  return tickers.find((t) => t.baseSymbol === baseSymbol) ?? null;
}

/** 사이드바 실시간 시세 위젯용 매핑. */
export function toTickerItems(tickers: CoinTicker[]): TickerItem[] {
  return tickers.map((t) => ({
    symbol: t.baseSymbol,
    name: COIN_META[t.baseSymbol]?.nameKo ?? t.baseSymbol,
    price: t.price,
    changePct: t.changePct,
    href: COIN_META[t.baseSymbol]?.href ?? `/coin/${t.baseSymbol.toLowerCase()}`,
  }));
}

/** ISO → "방금 전 / N분 전 / N시간 전 / N일 전 / N주 전" (렌더 시점 기준 시각) */
export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diffMin = Math.floor((Date.now() - t) / 60000);
  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  const h = Math.floor(diffMin / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}일 전`;
  return `${Math.floor(d / 7)}주 전`;
}
