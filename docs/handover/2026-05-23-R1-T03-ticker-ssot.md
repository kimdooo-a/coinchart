# T03 — Binance ticker SSOT + /api/coins/ticker (R1 mainpage)

- 일자: 2026-05-23
- 라운드/그룹: R1 / mainpage
- 일꾼: T03 (1차 발사, 의존 없음)
- 상태: COMPLETED ✅

## 무엇을 했나

메인페이지 시세 스트립 · 코인룸 6카드 · 사이드바 시세 위젯이 공유할 **단일 ticker SSOT**를 구축. Binance `/api/v3/ticker/24hr`을 60초 캐시로 프록시하고 `lib/supabase/crypto.ts`에 `fetchBinanceTickers` / `fetchCommunityTickers`를 추가, `/api/coins/ticker` 신규 라우트로 노출.

## 변경 파일

| 파일 | 종류 | 비고 |
|---|---|---|
| `types/coins.ts` | 신규 | `CoinTicker` · `CoinSnapshot` 타입 |
| `lib/supabase/crypto.ts` | 수정 (append-only) | `fetchBinanceTickers` · `fetchCommunityTickers` 추가. 기존 `fetchCryptoMarketPrices`는 미변경 |
| `app/api/coins/ticker/route.ts` | 신규 | `GET /api/coins/ticker?symbols=...` |
| `docs/references/_API_REFERENCE.md` | 수정 (append-only) | `GET /api/coins/ticker` 섹션 추가 |
| `docs/references/_TYPE_REFERENCE.md` | 수정 (append-only) | `CoinTicker / CoinSnapshot` 섹션 추가 |

## 핵심 시그니처

```ts
// types/coins.ts
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

// lib/supabase/crypto.ts
export async function fetchBinanceTickers(symbols: string[]): Promise<CoinTicker[]>;
export async function fetchCommunityTickers(): Promise<CoinTicker[]>;
```

## 캐시 정책 (이중 캐시)

| 레이어 | TTL | 위치 |
|---|---|---|
| Next fetch `revalidate` | 60초 | `fetch(..., { next: { revalidate: 60 } })` |
| 메모리 `Map` | 60초 | `TICKER_CACHE: Map<string, { data, expiresAt }>` (lib/supabase/crypto.ts) |
| 라우트 `revalidate` | 60초 | `app/api/coins/ticker/route.ts` |

- 캐시 키: `symbols.slice().sort().join(",")` (요청 심볼 정렬 후 join) → 동일 셋의 다른 순서도 같은 캐시 슬롯 사용
- 기본 심볼 셋(10개): `BTCUSDT, ETHUSDT, XRPUSDT, SOLUSDT, DOGEUSDT, ADAUSDT, BNBUSDT, TRXUSDT, LINKUSDT, AVAXUSDT`

## API

### GET `/api/coins/ticker`

| 쿼리 | 타입 | 기본값 |
|---|---|---|
| `symbols` | CSV | 기본 10개 |

응답:

```json
{
  "tickers": [
    {
      "symbol": "BTCUSDT",
      "baseSymbol": "BTC",
      "price": 75414.25,
      "changePct": -2.84,
      "volume24hUsd": 925684360.94,
      "high24h": 77900,
      "low24h": 75220,
      "source": "binance",
      "fetchedAt": 1779501174869
    }
  ],
  "ts": 1779501174890
}
```

에러: `502 { "error": "..." }`

## 검증 결과

| 단계 | 명령 | 결과 |
|---|---|---|
| TypeScript | `npx tsc --noEmit` | PASS (exit 0) |
| ESLint | `npx eslint types/coins.ts app/api/coins/ticker/route.ts` | PASS (exit 0) |
| Binance 응답 정규화 | 임시 ESM 스크립트 (지시서 tsx 1-liner는 `@/` path alias가 tsx ESM 변환 단계에서 named export를 default로 래핑하는 이슈로 실패 → 우회) | PASS |

검증 출력:
```
count 10
first BTCUSDT, price 75414.25, baseSymbol "BTC", source "binance"
btc_price > 0 ✅
btc_baseSymbol === "BTC" ✅
```

> 임시 검증 스크립트(`scripts/verify-t03-ticker.mjs`)는 검증 후 삭제 완료.

## 다음 일꾼(T15)에게

메인페이지에서는 **fetch 한 줄로 끝**.

```ts
// 기본 10개 (커뮤니티 디폴트 셋)
const res = await fetch("/api/coins/ticker", { next: { revalidate: 60 } });
const { tickers } = await res.json() as { tickers: CoinTicker[]; ts: number };

// 또는 원하는 셋 지정
const res = await fetch("/api/coins/ticker?symbols=BTCUSDT,ETHUSDT,XRPUSDT");
```

- 타입은 `import type { CoinTicker } from "@/types/coins";`
- 메인페이지 `TICKER_LIST` 더미는 위 응답으로 매핑 (symbol → baseSymbol, price → price, changePct → changePct)
- `mock-coins.ts`의 `COINS[*]`에서 `price/changePct/volume24hUsd/high24h/low24h`도 동일 응답으로 hydrate
- 사이드바 `PriceTickerWidget`의 `TickerItem`은 `{ symbol: baseSymbol, name: 한국어명, price, changePct, href }` 형태 → name 매핑 테이블만 따로 정의하면 됨

## 안티패턴 (지킨 것)

- ✅ `lib/supabase/crypto.ts`의 기존 `fetchCryptoMarketPrices` 미변경 (append-only)
- ✅ `lib/supabase/stock.ts` 임포트 없음 (SSOT 규칙)
- ✅ `app/api/price/` `app/api/klines/` 손대지 않음
- ✅ `mock-coins.ts` 삭제 안 함 (T15가 hydrate 후 결정)
- ✅ HTTP polling 60s — WebSocket·스트리밍 도입 안 함

## 관련 솔루션

- 검증 1-liner 우회: [`docs/solutions/2026-05-23-tsx-path-alias-esm-named-export.md`](../solutions/2026-05-23-tsx-path-alias-esm-named-export.md)
