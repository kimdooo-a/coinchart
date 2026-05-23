import type { CoinHeroData } from "@/components/community/CoinHero";
import type { TickerItem } from "@/components/community/widgets/PriceTickerWidget";

export interface CoinDetail extends CoinHeroData {
  slug: string;
  description: string;
  coinTagFilter: string; // 게시글/뉴스 필터에 쓰는 태그 (BTC, ETH, ...)
  /** 24h 고/저 */
  high24h: number;
  low24h: number;
  /** 7d / 30d 변동률 */
  change7d: number;
  change30d: number;
  /** 도미넌스 (BTC만 의미 있음) */
  dominance?: number;
  /** 유통량 */
  circulatingSupply?: string;
}

const sparkUp = [10, 12, 11, 14, 13, 16, 18, 17, 19, 22, 24, 26, 28];
const sparkDown = [28, 26, 27, 24, 25, 22, 20, 21, 18, 16, 14, 12, 10];
const sparkSide = [18, 19, 17, 20, 18, 19, 21, 18, 20, 19, 21, 20, 19];

export const COINS: Record<string, CoinDetail> = {
  btc: {
    slug: "btc",
    symbol: "BTC",
    name: "Bitcoin",
    nameKo: "비트코인",
    coinTagFilter: "BTC",
    logoEmoji: "₿",
    logoColor: "#F7931A",
    price: 132400,
    changePct: 1.58,
    change7d: 5.2,
    change30d: 12.4,
    high24h: 133200,
    low24h: 130500,
    volume24hUsd: 34_200_000_000,
    marketCapUsd: 2_610_000_000_000,
    marketCapRank: 1,
    dominance: 53.2,
    circulatingSupply: "19.7M BTC",
    tags: ["PoW", "Layer1", "Store of Value"],
    sparkline: sparkUp,
    description: "글로벌 디지털 자산 시장의 기축통화. 사상 최고가 갱신 흐름 지속 중.",
  },
  eth: {
    slug: "eth",
    symbol: "ETH",
    name: "Ethereum",
    nameKo: "이더리움",
    coinTagFilter: "ETH",
    logoEmoji: "Ξ",
    logoColor: "#627EEA",
    price: 4520,
    changePct: -0.5,
    change7d: 3.1,
    change30d: 8.7,
    high24h: 4580,
    low24h: 4480,
    volume24hUsd: 14_500_000_000,
    marketCapUsd: 540_000_000_000,
    marketCapRank: 2,
    circulatingSupply: "120.3M ETH",
    tags: ["PoS", "Smart Contract", "L1"],
    sparkline: sparkSide,
    description: "스마트 컨트랙트 플랫폼의 표준. L2 생태계 확장 중.",
  },
  xrp: {
    slug: "xrp",
    symbol: "XRP",
    name: "XRP",
    nameKo: "리플",
    coinTagFilter: "XRP",
    logoEmoji: "✕",
    logoColor: "#23292F",
    price: 2.85,
    changePct: 3.4,
    change7d: 8.2,
    change30d: -2.1,
    high24h: 2.92,
    low24h: 2.74,
    volume24hUsd: 4_200_000_000,
    marketCapUsd: 158_000_000_000,
    marketCapRank: 4,
    circulatingSupply: "55.4B XRP",
    tags: ["Payment", "Cross-border"],
    sparkline: sparkUp,
    description: "국경 간 송금 최적화 자산. SEC 항소심 진행 중.",
  },
  sol: {
    slug: "sol",
    symbol: "SOL",
    name: "Solana",
    nameKo: "솔라나",
    coinTagFilter: "SOL",
    logoEmoji: "◎",
    logoColor: "#9945FF",
    price: 245.1,
    changePct: 0.8,
    change7d: 2.5,
    change30d: 18.3,
    high24h: 248,
    low24h: 240,
    volume24hUsd: 5_600_000_000,
    marketCapUsd: 116_000_000_000,
    marketCapRank: 5,
    circulatingSupply: "473M SOL",
    tags: ["High TPS", "DeFi", "L1"],
    sparkline: sparkUp,
    description: "고성능 L1. 디파이·NFT 생태계 활발.",
  },
  altcoin: {
    slug: "altcoin",
    symbol: "ALT",
    name: "Altcoin",
    nameKo: "알트코인",
    coinTagFilter: "ALT",
    logoEmoji: "🌐",
    logoColor: "#6B7280",
    price: 0,
    changePct: 1.2,
    change7d: 4.5,
    change30d: 9.0,
    high24h: 0,
    low24h: 0,
    volume24hUsd: 8_900_000_000,
    marketCapUsd: 480_000_000_000,
    marketCapRank: 0,
    tags: ["Mixed"],
    sparkline: sparkSide,
    description: "BTC·ETH 외 알트코인 통합 동향.",
  },
  kimp: {
    slug: "kimp",
    symbol: "KIMP",
    name: "Kimchi Premium",
    nameKo: "김치프리미엄",
    coinTagFilter: "ALL",
    logoEmoji: "🇰🇷",
    logoColor: "#BA1A1A",
    price: 5.2, // %
    changePct: 0.7,
    change7d: -1.2,
    change30d: 2.8,
    high24h: 6.1,
    low24h: 4.8,
    volume24hUsd: 0,
    marketCapUsd: 0,
    marketCapRank: 0,
    tags: ["KR vs Global"],
    sparkline: sparkDown,
    description: "한국 거래소와 글로벌 거래소 간 가격 차이 (%).",
  },
};

export function getCoin(slug: string): CoinDetail | null {
  return COINS[slug.toLowerCase()] ?? null;
}

/**
 * 시세 위젯 / 시세 스트립용 더미.
 * R1/T15(2026-05-23): 메인페이지(app/page.tsx)는 실데이터(lib/community/queries.ts)로 전환되어 더 이상 사용하지 않음.
 * /news, /coin/[symbol], /board/* 사이드바가 아직 사용 중 → 보존. R2에서 실데이터 전환 후 정리 예정.
 */
export const TICKER_LIST: TickerItem[] = [
  { symbol: "BTC", name: "비트코인", price: 132400, changePct: 1.58, href: "/coin/btc" },
  { symbol: "ETH", name: "이더리움", price: 4520, changePct: -0.5, href: "/coin/eth" },
  { symbol: "XRP", name: "리플", price: 2.85, changePct: 3.4, href: "/coin/xrp" },
  { symbol: "SOL", name: "솔라나", price: 245.1, changePct: 0.8, href: "/coin/sol" },
  { symbol: "DOGE", name: "도지코인", price: 0.42, changePct: -1.2, href: "/coin/altcoin" },
  { symbol: "BNB", name: "바이낸스코인", price: 720, changePct: 0.4, href: "/coin/altcoin" },
  { symbol: "ADA", name: "카르다노", price: 1.42, changePct: 2.1, href: "/coin/altcoin" },
  { symbol: "AVAX", name: "아발란체", price: 58.2, changePct: -0.3, href: "/coin/altcoin" },
  { symbol: "S&P 500", name: "미 증시", price: 6280, changePct: 0.5, href: "/stock-market" },
  { symbol: "AAPL", name: "애플", price: 248, changePct: 0.3, href: "/analysis/stock/AAPL" },
];

// R1/T15: 메인페이지는 community_hot_issues RPC 실데이터로 전환됨. /news·/coin·/board 사이드바가 아직 사용 → 보존(R2 정리 예정).
export const HOT_ISSUES = [
  { rank: 1, keyword: "비트코인 ETF", trend: "up" as const, delta: 2 },
  { rank: 2, keyword: "이더리움 업그레이드", trend: "up" as const, delta: 1 },
  { rank: 3, keyword: "SEC 발표", trend: "new" as const },
  { rank: 4, keyword: "솔라나 박스권", trend: "same" as const },
  { rank: 5, keyword: "FOMC 5월", trend: "down" as const, delta: 1 },
  { rank: 6, keyword: "13만 달러", trend: "up" as const, delta: 4 },
  { rank: 7, keyword: "리플 항소심", trend: "down" as const, delta: 2 },
  { rank: 8, keyword: "김치프리미엄", trend: "new" as const },
  { rank: 9, keyword: "고래 매집", trend: "up" as const, delta: 3 },
  { rank: 10, keyword: "단타 수익", trend: "same" as const },
];

// R1/T15: 메인페이지는 blog_posts(published) 실데이터로 전환됨. /news·/coin·/board 사이드바가 아직 사용 → 보존(R2 정리 예정).
export const OFFICIAL_POSTS = [
  { slug: "btc-cycle-analysis", title: "비트코인 사이클 분석 가이드 (2026)", date: "2026-05-08" },
  { slug: "exchange-comparison", title: "거래소 비교 정리 (수수료·보안)", date: "2026-05-05" },
  { slug: "tipping-guide", title: "공식글 작성 가이드", date: "2026-04-30" },
];
