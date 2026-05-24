// 뉴스 정적 메타 SSOT — R3/T01(2026-05-24)에서 mock-news.ts로부터 분리.
// 뉴스 카테고리 필터와 코인 필터의 단일 진실 공급원이다.
// 정적 상수이므로 별도 파일로 관리한다. (R3/T05에서 mock-news.ts는 삭제됨 —
// 모든 소비처는 본 파일을 직접 import한다.)

/** 뉴스 카테고리 필터 — key(영문 식별자)·label(한글 표시) 쌍 */
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

/** 코인 필터 — key(심볼)·label(표시) 쌍 */
export const COIN_FILTERS = [
  { key: "ALL", label: "전체" },
  { key: "BTC", label: "BTC" },
  { key: "ETH", label: "ETH" },
  { key: "XRP", label: "XRP" },
  { key: "SOL", label: "SOL" },
  { key: "ALT", label: "알트" },
  { key: "STOCK", label: "주식" },
];
