# T03 — ticker-ssot

> **본 터미널은 R1 일꾼(T03)**. 1차 발사 (의존 없음).

## 정체성

- 역할: `worker` (T03), R1, mainpage
- 담당: Binance 24h ticker SSOT 확장 + `/api/coins/ticker` 라우트
- 메인페이지 시세 스트립·코인룸 6카드·사이드바 시세 위젯 3곳을 1개 SSOT로 통합

## 컨텍스트

메인페이지의 `TICKER_LIST`, `COINS[*].price/changePct/volume24hUsd/marketCapUsd/...` 가 전부 더미. 기존 `lib/supabase/crypto.ts`는 `market_prices` 테이블의 OHLCV 시계열만 다루지, "현재가 + 24h 변동률 + 거래량" 같은 ticker 단위 데이터가 없다.

해결책: Binance `/api/v3/ticker/24hr` 엔드포인트를 60초 캐시로 프록시하고, `lib/supabase/crypto.ts`에 함수 추가 + 신규 API 라우트로 노출.

## 공통 SOT (읽기 전용)

```
CLAUDE.md
docs/PROJECT_DIRECTION.md
docs/references/_API_REFERENCE.md
docs/references/_TYPE_REFERENCE.md
lib/supabase/crypto.ts                                  ← SSOT 확장 대상
lib/community/mock-coins.ts                             ← UI 필드 추론
components/community/widgets/PriceTickerWidget.tsx      ← TickerItem 인터페이스
lib/cache/                                              ← 캐시 패턴
app/api/price/route.ts                                  ← API 라우트 스타일
app/api/klines/route.ts                                 ← Binance 호출 패턴
```

## 작업 목표

1. `lib/supabase/crypto.ts`에 `fetchBinanceTickers(symbols)` + `fetchCommunityTickers()` 추가
2. `app/api/coins/ticker/route.ts` 신규 — 메인페이지가 호출할 단일 엔드포인트
3. `types/coins.ts` 신규 — TickerItem·CoinSnapshot 타입 통합

## 산출물

### 신규/수정 파일

#### 1. `types/coins.ts` (신규)

```ts
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
```

#### 2. `lib/supabase/crypto.ts` (수정 — append만, 기존 함수 손대지 말 것)

다음 함수 추가:

```ts
import type { CoinTicker } from "@/types/coins";

const BINANCE_TICKER_URL = "https://api.binance.com/api/v3/ticker/24hr";
const TICKER_CACHE = new Map<string, { data: CoinTicker[]; expiresAt: number }>();
const TICKER_TTL_MS = 60_000;

export async function fetchBinanceTickers(symbols: string[]): Promise<CoinTicker[]> {
  const key = symbols.sort().join(",");
  const cached = TICKER_CACHE.get(key);
  const now = Date.now();
  if (cached && cached.expiresAt > now) return cached.data;

  const url = `${BINANCE_TICKER_URL}?symbols=${encodeURIComponent(JSON.stringify(symbols))}`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`[ticker] Binance ${res.status}`);
  const raw = (await res.json()) as Array<Record<string, string>>;
  const list: CoinTicker[] = raw.map((r) => ({
    symbol: r.symbol,
    baseSymbol: r.symbol.replace(/USDT$/, ""),
    price: Number(r.lastPrice),
    changePct: Number(r.priceChangePercent),
    volume24hUsd: Number(r.quoteVolume),
    high24h: Number(r.highPrice),
    low24h: Number(r.lowPrice),
    source: "binance",
    fetchedAt: now,
  }));
  TICKER_CACHE.set(key, { data: list, expiresAt: now + TICKER_TTL_MS });
  return list;
}

const COMMUNITY_DEFAULT_SYMBOLS = [
  "BTCUSDT","ETHUSDT","XRPUSDT","SOLUSDT","DOGEUSDT","ADAUSDT","BNBUSDT","TRXUSDT","LINKUSDT","AVAXUSDT",
];

export async function fetchCommunityTickers(): Promise<CoinTicker[]> {
  return fetchBinanceTickers(COMMUNITY_DEFAULT_SYMBOLS);
}
```

> 기존 `fetchCryptoMarketPrices` 등의 함수는 절대 손대지 말 것. 본 작업은 **append-only**.

#### 3. `app/api/coins/ticker/route.ts` (신규)

```ts
import { NextResponse } from "next/server";
import { fetchCommunityTickers, fetchBinanceTickers } from "@/lib/supabase/crypto";

export const revalidate = 60;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const symbolsParam = url.searchParams.get("symbols");
    const tickers = symbolsParam
      ? await fetchBinanceTickers(symbolsParam.split(",").filter(Boolean))
      : await fetchCommunityTickers();
    return NextResponse.json({ tickers, ts: Date.now() });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "ticker fetch failed" },
      { status: 502 }
    );
  }
}
```

#### 4. `docs/references/_API_REFERENCE.md` (append만)

마지막에 다음 섹션 추가:

```markdown
### GET /api/coins/ticker

R1 (2026-05-23) 추가.

| 쿼리 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| symbols | string (CSV) | (기본 10개) | Binance pair (예: BTCUSDT,ETHUSDT) |

응답: `{ tickers: CoinTicker[], ts: number }` — `types/coins.ts#CoinTicker`
캐시: 60초 (Next revalidate + 메모리 Map)
```

#### 5. `docs/references/_TYPE_REFERENCE.md` (append만)

```markdown
### CoinTicker / CoinSnapshot (R1 2026-05-23)
- 파일: `types/coins.ts`
- 사용: `app/api/coins/ticker/route.ts`, `lib/supabase/crypto.ts`, 메인페이지(T15)
```

## 작업 단계

1. SOT 읽기 (병렬)
2. `types/coins.ts` 작성
3. `lib/supabase/crypto.ts` append
4. `app/api/coins/ticker/route.ts` 작성
5. references append × 2
6. 검증

## 검증

```bash
npx tsc --noEmit
npx eslint types/coins.ts app/api/coins/ticker/route.ts 2>&1 | tail -10

# 실 호출 검증 (개발 서버 띄우지 않고 fetch만)
npx tsx -e "import('./lib/supabase/crypto').then(async m => { const t = await m.fetchCommunityTickers(); console.log('count', t.length, 'first', t[0]); })"
```

응답에 BTCUSDT가 포함되고 `price > 0`이면 PASS.

## 완료 신호

`docs/handover/2026-05-23-R1-T03-ticker-ssot.md` 작성.

명시:
- 캐시 정책 (60초 + 메모리 Map)
- `fetchBinanceTickers(symbols)` 시그니처
- 다음 일꾼(T15)에게: `/api/coins/ticker?symbols=BTCUSDT,...`로 호출하면 됨

## 안티패턴

- `lib/supabase/crypto.ts`의 기존 함수 수정 금지 (append-only)
- `lib/supabase/stock.ts` 절대 임포트 금지 (SSOT 규칙)
- `app/api/price/` 또는 `app/api/klines/` 손대지 말 것 (기존 동작 보존)
- `mock-coins.ts` 삭제 금지 (T15)
- WebSocket·스트리밍 도입 금지 (HTTP polling 60s가 충분)
