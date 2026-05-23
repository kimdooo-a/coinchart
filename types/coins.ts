// 커뮤니티 메인페이지(T15)와 코인룸에서 공유하는 SSOT 타입.
// Binance 24h ticker 응답을 정규화한 CoinTicker, 그리고
// 카드/사이드바 위젯에서 쓸 메타 정보가 더해진 CoinSnapshot.

export interface CoinTicker {
  symbol: string;          // "BTCUSDT"
  baseSymbol: string;      // "BTC"
  price: number;
  changePct: number;       // 24h 변동률 (%)
  volume24hUsd: number;
  high24h: number;
  low24h: number;
  source: "binance";
  fetchedAt: number;       // unix ms
}

export interface CoinSnapshot extends CoinTicker {
  name?: string;
  nameKo?: string;
  marketCapUsd?: number;
  marketCapRank?: number;
  logoColor?: string;
  logoEmoji?: string;
  description?: string;
  tags?: string[];
  href?: string;
  // sparkline은 별도 RPC에서 fetch — 본 타입에 포함 안 함
}
