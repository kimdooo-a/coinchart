# T05 — news-classifier

> **본 터미널은 R1 일꾼(T05)**. 1차 발사 (의존 없음). T06이 본 산출물에 의존.

## 정체성

- 역할: `worker` (T05), R1, mainpage
- 담당: 룰베이스 뉴스 분류 라이브러리 (코인 태그 / 카테고리 / 호악재 / 중요도)
- AI API 일절 사용하지 않음. 키워드 사전 + 점수 + 시간 감쇠로 4차원 산출

## 컨텍스트

`docs/PROJECT_DIRECTION.md` §4에 룰베이스 분류 정의. 메인페이지 최신 뉴스 10건 표시는 sentiment 색상·코인 태그·카테고리 라벨이 필요한데 현재 `news` 테이블은 `sentiment` 컬럼만 있음 (카테고리·중요도 미존재). T06이 news 테이블 ALTER + crawler 통합을 담당하므로 본 일꾼은 **순수 분류 라이브러리**만 작성.

## 공통 SOT

```
CLAUDE.md
docs/PROJECT_DIRECTION.md           §4 — 룰베이스 분류 사양
docs/references/_TYPE_REFERENCE.md
lib/community/mock-news.ts          ← 카테고리/감정 enum 추론
components/community/NewsRow.tsx    ← 화면에 표시될 필드
components/community/NewsHeadlineCard.tsx  ← sentiment 4가지 enum
app/api/news/route.ts               ← 기존 news API 구조
```

## 작업 목표

`lib/news/classifier.ts` + `lib/news/keyword-dict.ts` 2개 파일로 4차원 분류 함수 완성.

## 산출물

#### 1. `lib/news/keyword-dict.ts`

8개 키워드 그룹 + 호악재 사전:

```ts
export const COIN_KEYWORDS: Record<string, string[]> = {
  BTC: ["비트코인", "BTC", "bitcoin"],
  ETH: ["이더리움", "ETH", "ethereum", "이더"],
  XRP: ["리플", "XRP", "ripple"],
  SOL: ["솔라나", "SOL", "solana"],
  DOGE: ["도지", "DOGE", "dogecoin"],
  ADA: ["카르다노", "ADA", "cardano"],
  ALT: ["알트코인", "altcoin"],
  STOCK: ["S&P", "나스닥", "주식", "stock", "Nasdaq", "DJI"],
};

export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  regulation: ["SEC", "규제", "금지", "승인", "허가", "가이드라인", "제재", "과세", "세금", "법안", "법규", "법원", "소송", "FATF"],
  tech: ["업그레이드", "하드포크", "메인넷", "테스트넷", "스마트컨트랙트", "Layer2", "L2", "롤업", "스테이킹", "노드", "프로토콜"],
  exchange: ["바이낸스", "업비트", "Binance", "Upbit", "Coinbase", "거래소", "상장", "상장폐지", "출금"],
  onchain: ["고래", "온체인", "지갑", "whale", "holder", "유통량", "공급량", "채굴", "해시율", "난이도"],
  etf: ["ETF", "현물 ETF", "BlackRock", "Fidelity", "Ark"],
  altcoin_news: ["알트", "altcoin", "도지", "시바", "밈코인"],
  macro: ["FOMC", "연준", "금리", "인플레이션", "달러", "환율", "원/달러", "Fed", "CPI", "PCE", "고용지표"],
  market: [],  // fallback (위 카테고리 0매치 시)
};

export const POSITIVE_KEYWORDS: Record<string, number> = {
  "급등": 3, "사상최고": 5, "신고가": 4, "돌파": 3, "승인": 4, "가결": 3,
  "유입": 2, "매수": 2, "상승": 2, "강세": 2, "호재": 4, "파트너십": 3,
  "도입": 2, "확장": 1, "성장": 2, "상장": 3, "런칭": 2, "출시": 2,
  "rally": 3, "surge": 4, "bull": 3, "bullish": 3, "high": 2,
};

export const NEGATIVE_KEYWORDS: Record<string, number> = {
  "폭락": -5, "급락": -4, "하락": -2, "약세": -2, "악재": -4,
  "해킹": -5, "도난": -4, "유출": -3, "지연": -2, "취소": -3,
  "상장폐지": -4, "제재": -3, "소송": -3, "기각": -3, "금지": -4,
  "사임": -2, "퇴진": -2, "vulnerability": -4, "exploit": -5,
  "crash": -5, "dump": -4, "bear": -3, "bearish": -3,
};

export const SOURCE_WEIGHTS: Record<string, number> = {
  "코인데스크": 1.2, "블룸버그": 1.5, "로이터": 1.4, "CNBC": 1.3,
  "코인텔레그래프": 1.0, "더 블록": 1.1, "코인포스트": 1.0,
  "글래스노드": 1.2, "코인게이프": 0.9,
};
```

#### 2. `lib/news/classifier.ts`

```ts
import {
  COIN_KEYWORDS, CATEGORY_KEYWORDS, POSITIVE_KEYWORDS, NEGATIVE_KEYWORDS, SOURCE_WEIGHTS
} from "./keyword-dict";

export type NewsSentiment = "positive" | "negative" | "mixed" | "neutral";
export type NewsCategory = "regulation" | "tech" | "exchange" | "onchain" | "etf" | "altcoin_news" | "macro" | "market";

export interface ClassifyInput {
  title: string;
  snippet?: string;
  source?: string;
  pubDate?: Date | string;
}

export interface ClassifyResult {
  coinTag: string;        // "BTC" | "ETH" | ... | "ALL"
  category: NewsCategory;
  sentiment: NewsSentiment;
  importance: number;     // 1~10
  sentimentScore: number; // 원점수 (디버그)
  matchedKeywords: { positive: string[]; negative: string[]; coin: string[]; category: string[] };
}

export function classify(input: ClassifyInput): ClassifyResult {
  const text = `${input.title} ${input.snippet ?? ""}`.toLowerCase();
  const title = input.title;

  // 1. 코인 태그 (다중 매칭 시 빈도 우선)
  const coinHits: Record<string, number> = {};
  const coinMatched: string[] = [];
  for (const [tag, keywords] of Object.entries(COIN_KEYWORDS)) {
    for (const kw of keywords) {
      const re = new RegExp(kw, "gi");
      const count = (text.match(re) ?? []).length;
      if (count > 0) {
        coinHits[tag] = (coinHits[tag] ?? 0) + count;
        coinMatched.push(kw);
      }
    }
  }
  const coinTag = Object.entries(coinHits).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "ALL";

  // 2. 카테고리 (첫 매칭 우선)
  let category: NewsCategory = "market";
  const categoryMatched: string[] = [];
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (text.includes(kw.toLowerCase())) {
        category = cat as NewsCategory;
        categoryMatched.push(kw);
        break;
      }
    }
    if (category !== "market") break;
  }

  // 3. 호악재 점수
  let posScore = 0, negScore = 0;
  const posMatched: string[] = [];
  const negMatched: string[] = [];
  for (const [kw, weight] of Object.entries(POSITIVE_KEYWORDS)) {
    if (text.includes(kw.toLowerCase())) { posScore += weight; posMatched.push(kw); }
  }
  for (const [kw, weight] of Object.entries(NEGATIVE_KEYWORDS)) {
    if (text.includes(kw.toLowerCase())) { negScore += Math.abs(weight); negMatched.push(kw); }
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
  // 키워드 점수 + 매체 가중치 + 시간 감쇠
  const sourceWeight = SOURCE_WEIGHTS[input.source ?? ""] ?? 1.0;
  const rawKeywordScore = posScore + negScore + categoryMatched.length * 1.5 + Math.min(Object.keys(coinHits).length, 3);

  let timeDecay = 1.0;
  if (input.pubDate) {
    const ageH = (Date.now() - new Date(input.pubDate).getTime()) / 3_600_000;
    timeDecay = Math.max(0.3, 1 - ageH / 168); // 1주일에 70% 감쇠
  }

  const importanceRaw = rawKeywordScore * sourceWeight * timeDecay;
  const importance = Math.max(1, Math.min(10, Math.round(importanceRaw / 1.5)));

  return {
    coinTag,
    category,
    sentiment,
    importance,
    sentimentScore: net,
    matchedKeywords: { positive: posMatched, negative: negMatched, coin: coinMatched, category: categoryMatched },
  };
}
```

#### 3. `lib/news/__tests__/classifier.test.ts` (선택)

Vitest 패턴이 이미 있다면 다음 5개 케이스 작성:
- "비트코인 ETF 자금 유입 200억 달러 돌파" → coinTag=BTC, category=etf, sentiment=positive, importance≥6
- "한국 가상자산 과세 최종안 확정" → category=regulation, sentiment=negative, coinTag=ALL
- "솔라나 네트워크 일시 정지" → coinTag=SOL, sentiment=negative
- "이더리움 트랜잭션 비용 30% 절감" → coinTag=ETH, category=tech, sentiment=positive
- 빈 텍스트 → category=market, sentiment=neutral

Vitest가 없으면 본 테스트 파일 생략하고 handover에 "테스트 미작성, 다음 라운드 후보" 명시.

#### 4. `docs/references/_TYPE_REFERENCE.md` (append)

```markdown
### NewsSentiment / NewsCategory / ClassifyResult (R1 2026-05-23)
- 파일: `lib/news/classifier.ts`
- 소비자: T06 (news-crawl 통합), T15 (메인 표시)
```

## 작업 단계

1. SOT 읽기 (mock-news.ts에서 sentiment·category enum 확인)
2. `keyword-dict.ts` → `classifier.ts` → 테스트 → references 순으로 작성
3. 검증

## 검증

```bash
npx tsc --noEmit
npx tsx -e "import('./lib/news/classifier').then(m => { console.log(m.classify({ title: '비트코인 ETF 자금 유입 200억 달러 돌파' })); })"
# 기대: coinTag=BTC, category=etf, sentiment=positive

# Vitest가 있다면
npx vitest run lib/news/__tests__/classifier.test.ts 2>&1 | tail -20
```

## 완료 신호

`docs/handover/2026-05-23-R1-T05-news-classifier.md` 작성.

명시:
- `classify(input)` 시그니처
- 키워드 사전 갯수 (각 그룹)
- 4차원 산출 로직 요약
- T06이 import 할 entry point: `import { classify } from "@/lib/news/classifier"`

## 안티패턴

- `news` 테이블 ALTER 금지 (T06 영역)
- `app/api/admin/news-crawl/` 또는 `app/api/news/` 수정 금지 (T06 영역)
- `lib/community/mock-news.ts` 수정 금지 (T15가 정리)
- AI/LLM 호출 금지 (룰베이스만)
