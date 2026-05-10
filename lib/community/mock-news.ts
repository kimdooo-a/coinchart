import type { NewsHeadlineItem, NewsSentiment } from "@/components/community/NewsHeadlineCard";

export interface MockNewsItem extends NewsHeadlineItem {
  coinTag?: string;
}

export const NEWS_CATEGORIES = [
  { key: "all", label: "전체" },
  { key: "market", label: "시장동향" },
  { key: "regulation", label: "규제" },
  { key: "tech", label: "기술" },
  { key: "exchange", label: "거래소" },
  { key: "etf", label: "ETF" },
  { key: "onchain", label: "온체인" },
  { key: "macro", label: "매크로" },
];

export const COIN_FILTERS = [
  { key: "ALL", label: "전체" },
  { key: "BTC", label: "BTC" },
  { key: "ETH", label: "ETH" },
  { key: "XRP", label: "XRP" },
  { key: "SOL", label: "SOL" },
  { key: "ALT", label: "알트" },
  { key: "STOCK", label: "주식" },
];

const SOURCES = [
  "코인데스크",
  "블룸버그",
  "코인텔레그래프",
  "더 블록",
  "코인포스트",
  "글래스노드",
  "로이터",
  "CNBC",
  "코인게이프",
];

const SENTIMENTS: NewsSentiment[] = ["positive", "negative", "mixed", "neutral"];

const NEWS_TITLES = [
  { title: "비트코인 ETF 자금 유입 가속, 누적 200억 달러 돌파", sentiment: "positive" as const, coinTag: "BTC", category: "ETF", importance: 8 },
  { title: "SEC, 리플 항소심 결정 다음 달로 연기", sentiment: "negative" as const, coinTag: "XRP", category: "규제", importance: 7 },
  { title: "솔라나 가격 횡보, 단기 박스권 형성", sentiment: "neutral" as const, coinTag: "SOL", category: "시장동향", importance: 5 },
  { title: "이더리움 다음 업그레이드, 트랜잭션 비용 30% 절감 전망", sentiment: "positive" as const, coinTag: "ETH", category: "기술", importance: 6 },
  { title: "미 연준 금리 결정, 시장 혼조 반응", sentiment: "mixed" as const, coinTag: "BTC", category: "매크로", importance: 6 },
  { title: "바이낸스 일부 토큰 상장폐지 발표", sentiment: "negative" as const, coinTag: "ALT", category: "거래소", importance: 5 },
  { title: "도지코인 새 업데이트 베타 출시", sentiment: "neutral" as const, coinTag: "DOGE", category: "기술", importance: 3 },
  { title: "비트코인 고래 지갑 24시간 1만 BTC 매수", sentiment: "positive" as const, coinTag: "BTC", category: "온체인", importance: 7 },
  { title: "S&P 500 사상 최고 갱신, 테크 주도", sentiment: "mixed" as const, coinTag: "STOCK", category: "매크로", importance: 5 },
  { title: "카르다노 신규 거버넌스 가결", sentiment: "positive" as const, coinTag: "ALT", category: "기술", importance: 4 },
  { title: "한국 가상자산 과세 최종안 확정", sentiment: "negative" as const, coinTag: "ALL", category: "규제", importance: 8 },
  { title: "이더리움 스테이킹 비율 30% 돌파", sentiment: "positive" as const, coinTag: "ETH", category: "온체인", importance: 6 },
  { title: "리플, 일본 SBI와 신규 파트너십 발표", sentiment: "positive" as const, coinTag: "XRP", category: "기술", importance: 6 },
  { title: "BlackRock 비트코인 ETF 단일 일자 매수 사상 최대", sentiment: "positive" as const, coinTag: "BTC", category: "ETF", importance: 9 },
  { title: "솔라나 네트워크 일시 정지 — 50분 만에 복구", sentiment: "negative" as const, coinTag: "SOL", category: "기술", importance: 6 },
  { title: "SEC 의장 사임 발언, 시장 환영", sentiment: "positive" as const, coinTag: "ALL", category: "규제", importance: 7 },
  { title: "테더 USDT 시가총액 1500억 달러 돌파", sentiment: "neutral" as const, coinTag: "ALT", category: "시장동향", importance: 4 },
  { title: "비트코인 채굴 난이도 사상 최고치 갱신", sentiment: "neutral" as const, coinTag: "BTC", category: "온체인", importance: 4 },
  { title: "CPI 발표 앞두고 시장 변동성 확대", sentiment: "mixed" as const, coinTag: "BTC", category: "매크로", importance: 6 },
  { title: "이더리움 L2 거래량 메인넷 추월", sentiment: "positive" as const, coinTag: "ETH", category: "온체인", importance: 5 },
];

function relativeTime(minutesAgo: number): string {
  if (minutesAgo < 60) return `${Math.max(1, Math.round(minutesAgo))}분 전`;
  if (minutesAgo < 24 * 60) return `${Math.floor(minutesAgo / 60)}시간 전`;
  return `${Math.floor(minutesAgo / 60 / 24)}일 전`;
}

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

export const MOCK_NEWS: MockNewsItem[] = NEWS_TITLES.map((item, i) => ({
  id: `news-${i + 1}`,
  title: item.title,
  summary: `${item.title} 와 관련된 상세 내용입니다. 시장 영향과 분석을 함께 확인하세요. 본 기사는 ${item.coinTag === "ALL" ? "전체 시장" : item.coinTag} 관련 동향을 다룹니다.`,
  sentiment: item.sentiment,
  category: item.category,
  source: pick(SOURCES, i),
  timeLabel: relativeTime((i + 1) * 13),
  importance: item.importance,
  link: `https://example.com/news/${i + 1}`,
  discussionHref: `/board/info`,
  commentCount: Math.floor(Math.random() * 30),
  coinTag: item.coinTag,
}));

/** 헤드라인 3개 (호재 1, 악재 1, 중립/혼조 1) */
export function getHeadlines(): MockNewsItem[] {
  const positive = MOCK_NEWS.find((n) => n.sentiment === "positive" && n.importance && n.importance >= 8);
  const negative = MOCK_NEWS.find((n) => n.sentiment === "negative" && n.importance && n.importance >= 7);
  const mixed =
    MOCK_NEWS.find((n) => n.sentiment === "mixed") ??
    MOCK_NEWS.find((n) => n.sentiment === "neutral");
  return [positive, negative, mixed].filter(Boolean) as MockNewsItem[];
}

export function getNewsForCoin(coin: string, limit = 10): MockNewsItem[] {
  return MOCK_NEWS.filter((n) => n.coinTag === coin || n.coinTag === "ALL").slice(0, limit);
}

export function filterNews({
  coin,
  category,
  sentiment,
}: {
  coin?: string;
  category?: string;
  sentiment?: NewsSentiment | "all";
}): MockNewsItem[] {
  return MOCK_NEWS.filter((n) => {
    if (coin && coin !== "ALL" && n.coinTag !== coin) return false;
    if (category && category !== "all" && n.category !== NEWS_CATEGORIES.find((c) => c.key === category)?.label) return false;
    if (sentiment && sentiment !== "all" && n.sentiment !== sentiment) return false;
    return true;
  });
}
