// 뉴스 룰베이스 분류기 (R1, T05, 2026-05-23)
// 키워드 사전 + 점수 + 시간 감쇠 기반으로 4차원(코인/카테고리/감정/중요도) 산출
// 소비자: T06 (news-crawl 통합), T15 (메인 표시)

import {
  COIN_KEYWORDS,
  CATEGORY_KEYWORDS,
  POSITIVE_KEYWORDS,
  NEGATIVE_KEYWORDS,
  SOURCE_WEIGHTS,
} from "./keyword-dict";

export type NewsSentiment = "positive" | "negative" | "mixed" | "neutral";
export type NewsCategory =
  | "regulation"
  | "tech"
  | "exchange"
  | "onchain"
  | "etf"
  | "altcoin_news"
  | "macro"
  | "market";

export interface ClassifyInput {
  title: string;
  snippet?: string;
  source?: string;
  pubDate?: Date | string;
}

export interface ClassifyResult {
  coinTag: string; // "BTC" | "ETH" | ... | "ALL"
  category: NewsCategory;
  sentiment: NewsSentiment;
  importance: number; // 1~10
  sentimentScore: number; // 원점수 (디버그)
  matchedKeywords: {
    positive: string[];
    negative: string[];
    coin: string[];
    category: string[];
  };
}

// 정규식 메타문자가 포함된 키워드도 안전하게 매칭하기 위해 이스케이프
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function classify(input: ClassifyInput): ClassifyResult {
  const text = `${input.title} ${input.snippet ?? ""}`.toLowerCase();

  // 1. 코인 태그 (다중 매칭 시 빈도 우선, 동률이면 사전 선언 순서)
  const coinHits: Record<string, number> = {};
  const coinMatched: string[] = [];
  for (const [tag, keywords] of Object.entries(COIN_KEYWORDS)) {
    for (const kw of keywords) {
      const re = new RegExp(escapeRegExp(kw), "gi");
      const count = (text.match(re) ?? []).length;
      if (count > 0) {
        coinHits[tag] = (coinHits[tag] ?? 0) + count;
        coinMatched.push(kw);
      }
    }
  }
  const coinTag =
    Object.entries(coinHits).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "ALL";

  // 2. 카테고리 (첫 매칭 우선 — 선언 순서가 곧 우선순위)
  let category: NewsCategory = "market";
  const categoryMatched: string[] = [];
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let hit = false;
    for (const kw of keywords) {
      if (text.includes(kw.toLowerCase())) {
        category = cat as NewsCategory;
        categoryMatched.push(kw);
        hit = true;
        break;
      }
    }
    if (hit) break;
  }

  // 3. 호악재 점수
  let posScore = 0;
  let negScore = 0;
  const posMatched: string[] = [];
  const negMatched: string[] = [];
  for (const [kw, weight] of Object.entries(POSITIVE_KEYWORDS)) {
    if (text.includes(kw.toLowerCase())) {
      posScore += weight;
      posMatched.push(kw);
    }
  }
  for (const [kw, weight] of Object.entries(NEGATIVE_KEYWORDS)) {
    if (text.includes(kw.toLowerCase())) {
      negScore += Math.abs(weight);
      negMatched.push(kw);
    }
  }
  const net = posScore - negScore;
  let sentiment: NewsSentiment;
  if (Math.abs(net) < 2) {
    sentiment = posScore > 0 && negScore > 0 ? "mixed" : "neutral";
  } else if (net > 0) {
    sentiment = "positive";
  } else {
    sentiment = "negative";
  }

  // 4. 중요도 (1~10)
  // 키워드 점수 + 매체 가중치 + 시간 감쇠 (1주일 기준 70% 감쇠)
  const sourceWeight = SOURCE_WEIGHTS[input.source ?? ""] ?? 1.0;
  const rawKeywordScore =
    posScore +
    negScore +
    categoryMatched.length * 1.5 +
    Math.min(Object.keys(coinHits).length, 3);

  let timeDecay = 1.0;
  if (input.pubDate) {
    const ageH = (Date.now() - new Date(input.pubDate).getTime()) / 3_600_000;
    timeDecay = Math.max(0.3, 1 - ageH / 168);
  }

  const importanceRaw = rawKeywordScore * sourceWeight * timeDecay;
  const importance = Math.max(1, Math.min(10, Math.round(importanceRaw / 1.5)));

  return {
    coinTag,
    category,
    sentiment,
    importance,
    sentimentScore: net,
    matchedKeywords: {
      positive: posMatched,
      negative: negMatched,
      coin: coinMatched,
      category: categoryMatched,
    },
  };
}
