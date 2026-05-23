# 인수인계서 — R1 / T05 / news-classifier

- 일시: 2026-05-23
- 라운드: R1 (mainpage)
- 일꾼: T05 (worker)
- 의존: 없음 (1차 발사)
- 후속 소비자: **T06** (news-crawl 통합), **T15** (메인 표시)
- 상태: **완료** (산출물 + 테스트 8/8 PASS + 타입 OK)

---

## 1. 산출물 (Single Source of Truth)

| 파일 | 라인 수 | 역할 |
|------|---------|------|
| `lib/news/keyword-dict.ts` | 130 | 키워드 사전 5종 (COIN/CATEGORY/POSITIVE/NEGATIVE/SOURCE_WEIGHTS) |
| `lib/news/classifier.ts` | 134 | `classify(input)` 단일 진입점 — 4차원 분류 |
| `__tests__/lib/news-classifier.test.ts` | 84 | Vitest 8케이스 (5대 시나리오 + 3보조 검증) |
| `docs/references/_TYPE_REFERENCE.md` | +12 | 타입/인터페이스 인덱스 등록 (T05 섹션) |

---

## 2. `classify(input)` 시그니처

```ts
import { classify } from "@/lib/news/classifier";

interface ClassifyInput {
  title: string;
  snippet?: string;
  source?: string;          // 매체명 (SOURCE_WEIGHTS 조회용)
  pubDate?: Date | string;  // 시간 감쇠 계산용
}

interface ClassifyResult {
  coinTag: string;          // "BTC" | "ETH" | "XRP" | "SOL" | "DOGE" | "ADA" | "ALT" | "STOCK" | "ALL"
  category: NewsCategory;   // "regulation" | "tech" | "exchange" | "onchain" | "etf" | "altcoin_news" | "macro" | "market"
  sentiment: NewsSentiment; // "positive" | "negative" | "mixed" | "neutral"
  importance: number;       // 1~10
  sentimentScore: number;   // 원점수 (디버그용)
  matchedKeywords: {
    positive: string[];
    negative: string[];
    coin: string[];
    category: string[];
  };
}
```

**Entry point for T06**: `import { classify } from "@/lib/news/classifier";`

---

## 3. 키워드 사전 통계

| 사전 | 그룹/엔트리 수 | 비고 |
|------|---------------|------|
| `COIN_KEYWORDS` | 8개 그룹 | BTC/ETH/XRP/SOL/DOGE/ADA/ALT/STOCK — 한·영 혼용 |
| `CATEGORY_KEYWORDS` | 8개 그룹 | regulation/tech/exchange/onchain/etf/altcoin_news/macro/market(fallback) |
| `POSITIVE_KEYWORDS` | 26개 (가중치 1~5) | 사상최고(5), 호재(4), surge(4), 절감(2) 등 |
| `NEGATIVE_KEYWORDS` | 28개 (가중치 -2~-5) | 폭락(-5), 해킹(-5), exploit(-5), 과세(-3), 정지(-3) 등 |
| `SOURCE_WEIGHTS` | 9개 매체 | 블룸버그(1.5), 로이터(1.4), CNBC(1.3), 코인데스크(1.2) 등 |

> **사전 보강 사항** — spec 원본 사전으로는 테스트 5/8만 통과했음. 다음 키워드를 보강하여 8/8 통과 확보:
> - POSITIVE 신규: `절감(2)`, `개선(2)`, `복구(1)`
> - NEGATIVE 신규: `정지(-3)`, `중단(-3)`, `장애(-3)`, `과세(-3)`, `세금(-2)`, `연기(-2)`
> - 이유: "이더리움 ... 비용 30% 절감", "솔라나 네트워크 일시 정지", "과세 최종안 확정" 등 spec 테스트 케이스에서 핵심 키워드가 사전 누락 → neutral 오분류 발생.

---

## 4. 4차원 산출 로직 요약

### (1) `coinTag` — 빈도 우선
- 모든 `COIN_KEYWORDS` 그룹의 정규식 매칭을 누적하고, **가장 많이 매칭된 태그** 선택.
- 0매치 시 `"ALL"` 반환.
- 정규식 메타문자 안전 처리 (`escapeRegExp` 헬퍼) — `S&P` 같은 키워드도 안정 매칭.

### (2) `category` — 선언 순서 우선
- 8개 그룹을 선언 순서대로 순회. **첫 매칭에서 break** (선언 순서 = 우선순위).
- 우선순위: regulation → tech → exchange → onchain → etf → altcoin_news → macro → market(fallback).
- 0매치 시 `market`.

### (3) `sentiment` — net 점수 기반 4값 분류
```
posScore = Σ POSITIVE_KEYWORDS 매칭 가중치
negScore = Σ |NEGATIVE_KEYWORDS 매칭 가중치|
net = posScore - negScore

|net| < 2 → posScore>0 AND negScore>0 ? "mixed" : "neutral"
net ≥  2 → "positive"
net ≤ -2 → "negative"
```

### (4) `importance` — 1~10 정수
```
rawScore = posScore + negScore
         + categoryMatched.length × 1.5
         + min(coinHits 그룹 수, 3)

sourceWeight = SOURCE_WEIGHTS[input.source] ?? 1.0
timeDecay    = max(0.3, 1 - ageHours / 168)   // 1주일에 70% 감쇠

importance = clamp(1, 10, round((rawScore × sourceWeight × timeDecay) / 1.5))
```

---

## 5. 검증 결과

### 타입 체크
```
$ npx tsc --noEmit
→ lib/news/* 관련 오류 0건
(잔존 에러는 lib/chart/theme.ts, lib/community/auth.ts 모두 T05 영역 밖)
```

### Vitest (8/8 PASS)
```
✓ classify - 5대 시나리오 (5)
  ✓ 비트코인 ETF 자금 유입 200억 달러 돌파 → BTC/etf/positive/중요도≥6
  ✓ 한국 가상자산 과세 최종안 확정 → regulation/negative/coinTag=ALL
  ✓ 솔라나 네트워크 일시 정지 → SOL/negative
  ✓ 이더리움 트랜잭션 비용 30% 절감 → ETH/tech/positive
  ✓ 빈 텍스트 → market/neutral
✓ classify - 보조 검증 (3)
  ✓ matchedKeywords 사전 일관성
  ✓ 호악재 동시 출현 → mixed/negative 가능
  ✓ 중요도 1~10 범위 검증

Test Files: 1 passed (1)
Tests:      8 passed (8)
Duration:   713ms
```

### 샘플 출력 (`비트코인 ETF 자금 유입 200억 달러 돌파` / 블룸버그 / now)
```json
{
  "coinTag": "BTC",
  "category": "etf",
  "sentiment": "positive",
  "importance": 6~8 범위,
  "sentimentScore": 5,
  "matchedKeywords": {
    "positive": ["유입", "돌파"],
    "negative": [],
    "coin": ["비트코인", "BTC"],
    "category": ["ETF"]
  }
}
```

---

## 6. T06 (news-crawl) 통합 가이드

T06이 본 모듈을 import 할 때 권장 패턴:

```ts
import { classify } from "@/lib/news/classifier";

const result = classify({
  title: rss.title,
  snippet: rss.description,
  source: rss.source,
  pubDate: rss.pubDate,
});

await supabase.from("news").upsert({
  // 기존 필드 ...
  sentiment: result.sentiment,          // 기존 컬럼
  coin_tag: result.coinTag,             // 신규 (T06이 ALTER)
  category: result.category,            // 신규 (T06이 ALTER)
  importance: result.importance,        // 신규 (T06이 ALTER)
  matched_keywords: result.matchedKeywords, // 신규 jsonb (T06이 ALTER, 디버그용)
});
```

- 본 모듈은 **순수 함수** — 외부 의존(Supabase/fetch) 없음 → 단위테스트와 cron/serverless 양쪽에서 안전.
- DB 마이그레이션은 T06 영역이며 본 일꾼은 손대지 않음 (anti-pattern 회피).

---

## 7. T15 (메인페이지) 통합 가이드

`NewsCategory` 값 ↔ `NEWS_CATEGORIES` (UI 한글 라벨) 매핑이 필요합니다.

| classifier 값 | UI 라벨 (`mock-news.ts`) | UI key |
|--------------|--------------------------|--------|
| `regulation` | "규제" | `regulation` |
| `tech` | "기술" | `tech` |
| `exchange` | "거래소" | `exchange` |
| `onchain` | "온체인" | `onchain` |
| `etf` | "ETF" | `etf` |
| `altcoin_news` | (UI 누락) | — |
| `macro` | "매크로" | `macro` |
| `market` | "시장동향" | `market` |

**주의**: `altcoin_news` 는 UI `NEWS_CATEGORIES` 에 없음. T15가 정리 시 `market` 으로 합치거나 UI에 추가할지 결정 필요.

`COIN_FILTERS` 도 마찬가지로 분류기는 `DOGE`/`ADA` 를 산출하지만 UI 필터는 `ALT` 로 묶여 있음 → T15 가 매핑 정책 결정.

---

## 8. 안티패턴 준수 체크

- [x] `news` 테이블 ALTER **하지 않음** (T06 영역)
- [x] `app/api/admin/news-crawl/`, `app/api/news/` **수정하지 않음** (T06 영역)
- [x] `lib/community/mock-news.ts` **수정하지 않음** (T15 영역)
- [x] AI/LLM 호출 **없음** (룰베이스 100%)

---

## 9. 다음 라운드 후보 (개선 여지)

1. **사전 외부화** — 키워드 사전을 JSON 파일로 분리하고 운영 환경에서 핫리로드 가능하게 (현재는 코드 상수).
2. **N-gram 매칭** — "사상 최고" 같은 띄어쓰기 변형은 `사상최고` 키워드와 매칭 안 됨. 정규화 전처리 또는 bigram 추가.
3. **컨텍스트 가중치** — "급등 우려" vs "급등 호재" 처럼 부정문/긍정문 컨텍스트는 현재 인식 못함. 인접 부정어("우려"/"위험" 등) 보정 룰 검토.
4. **카테고리 다중 라벨** — 현재 첫 매칭 1개만 반환. T15 가 다중 태그 UI 를 원하면 `categories: NewsCategory[]` 로 변경 필요.
5. **`sentiment` "mixed" 임계 튜닝** — 현재 `|net|<2 AND pos>0 AND neg>0` 만 mixed. 실제 운영 데이터로 임계값 재조정 권장.

---

## 10. 핵심 통계

- **추가 코드**: TypeScript 264 LoC (classifier.ts 134 + keyword-dict.ts 130)
- **추가 테스트**: 8케이스, 평균 1ms 미만
- **타입 노출**: 3개 (`NewsSentiment`, `NewsCategory`, `ClassifyResult`)
- **외부 의존성**: **0개** (런타임 dependency 추가 없음)
- **검증 시간**: 약 1초 (tsc 별도 약 30초)

— EOF —
