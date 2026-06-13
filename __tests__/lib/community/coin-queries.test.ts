import { describe, it, expect } from "vitest";
import {
  getCoinRoomMeta,
  buildCoinView,
  toTickerItems,
  COIN_ROOM_SLUGS,
} from "@/lib/community/coin-queries";
import type { CoinTicker } from "@/types/coins";

// ─────────────────────────────────────────────────────────────
// fixture: CoinTicker (실제 네트워크 호출 없이 직접 주입)
//   fetchedAt 은 숫자면 충분(시간 무관) — 0 고정.
// ─────────────────────────────────────────────────────────────

/** BTC 실시세 fixture — buildCoinView 덮어쓰기 검증용 */
const btcTicker: CoinTicker = {
  symbol: "BTCUSDT",
  baseSymbol: "BTC",
  price: 99999,
  changePct: 2.34,
  volume24hUsd: 50_000_000_000,
  high24h: 100500,
  low24h: 98000,
  source: "binance",
  fetchedAt: 0,
};

describe("getCoinRoomMeta - 슬러그 → 메타", () => {
  it("유효 6종 슬러그 모두 메타 반환 (slug 일치)", () => {
    // COIN_ROOM_SLUGS 가 정확히 6종(btc/eth/xrp/sol/altcoin/kimp)인지
    expect(COIN_ROOM_SLUGS.sort()).toEqual(
      ["altcoin", "btc", "eth", "kimp", "sol", "xrp"].sort(),
    );
    for (const slug of COIN_ROOM_SLUGS) {
      const meta = getCoinRoomMeta(slug);
      expect(meta).not.toBeNull();
      expect(meta?.slug).toBe(slug);
    }
  });

  it("btc 메타 필드 검증", () => {
    const meta = getCoinRoomMeta("btc");
    expect(meta).not.toBeNull();
    expect(meta?.symbol).toBe("BTC");
    expect(meta?.nameKo).toBe("비트코인");
    expect(meta?.coinTagFilter).toBe("BTC");
    expect(meta?.binanceSymbol).toBe("BTCUSDT");
    expect(meta?.isAggregate).toBe(false);
    expect(meta?.marketCapRank).toBe(1);
  });

  it("집계형(altcoin/kimp) 메타는 binanceSymbol=null·isAggregate=true", () => {
    const alt = getCoinRoomMeta("altcoin");
    expect(alt?.binanceSymbol).toBeNull();
    expect(alt?.isAggregate).toBe(true);
    const kimp = getCoinRoomMeta("kimp");
    expect(kimp?.binanceSymbol).toBeNull();
    expect(kimp?.isAggregate).toBe(true);
  });

  it("대소문자 무관 — 대문자/혼합 입력도 동일 메타", () => {
    expect(getCoinRoomMeta("BTC")?.slug).toBe("btc");
    expect(getCoinRoomMeta("Eth")?.slug).toBe("eth");
    expect(getCoinRoomMeta("ALTCOIN")?.slug).toBe("altcoin");
  });

  it("미존재 슬러그 → null", () => {
    expect(getCoinRoomMeta("not-a-coin")).toBeNull();
    expect(getCoinRoomMeta("")).toBeNull();
    expect(getCoinRoomMeta("doge")).toBeNull();
  });
});

describe("buildCoinView - 정적 메타 + 실시세 병합", () => {
  it("ticker 제공 시 시세 필드를 ticker 값으로 덮어쓴다", () => {
    const meta = getCoinRoomMeta("btc")!;
    const view = buildCoinView(meta, btcTicker);
    // ticker 유래 — 실시세 덮어쓰기
    expect(view.price).toBe(99999);
    expect(view.changePct).toBe(2.34);
    expect(view.volume24hUsd).toBe(50_000_000_000);
    expect(view.high24h).toBe(100500);
    expect(view.low24h).toBe(98000);
  });

  it("ticker=null 시 static 폴백값 사용", () => {
    const meta = getCoinRoomMeta("btc")!;
    const view = buildCoinView(meta, null);
    expect(view.price).toBe(meta.staticPrice);
    expect(view.changePct).toBe(meta.staticChangePct);
    expect(view.volume24hUsd).toBe(meta.volume24hUsd);
    expect(view.high24h).toBe(meta.staticHigh24h);
    expect(view.low24h).toBe(meta.staticLow24h);
  });

  it("항상 meta 유래 필드는 ticker 유무와 무관하게 유지", () => {
    const meta = getCoinRoomMeta("btc")!;
    const withTicker = buildCoinView(meta, btcTicker);
    const withoutTicker = buildCoinView(meta, null);
    for (const view of [withTicker, withoutTicker]) {
      expect(view.marketCapUsd).toBe(meta.marketCapUsd);
      expect(view.marketCapRank).toBe(meta.marketCapRank);
      expect(view.tags).toEqual(meta.tags);
      expect(view.sparkline).toEqual(meta.sparkline);
      expect(view.slug).toBe(meta.slug);
      expect(view.description).toBe(meta.description);
      expect(view.coinTagFilter).toBe(meta.coinTagFilter);
      expect(view.change7d).toBe(meta.change7d);
      expect(view.change30d).toBe(meta.change30d);
      expect(view.dominance).toBe(meta.dominance);
      expect(view.circulatingSupply).toBe(meta.circulatingSupply);
      // 브랜드 표시값
      expect(view.symbol).toBe(meta.symbol);
      expect(view.name).toBe(meta.name);
      expect(view.nameKo).toBe(meta.nameKo);
      expect(view.logoEmoji).toBe(meta.logoEmoji);
      expect(view.logoColor).toBe(meta.logoColor);
    }
  });

  it("nullish 병합(??) — ticker 필드가 0이면 0이 유지된다 (falsy 폴백 아님)", () => {
    const meta = getCoinRoomMeta("btc")!;
    const zeroTicker: CoinTicker = {
      ...btcTicker,
      price: 0,
      changePct: 0,
      volume24hUsd: 0,
      high24h: 0,
      low24h: 0,
    };
    const view = buildCoinView(meta, zeroTicker);
    // ?? 병합이므로 0(falsy)도 그대로 통과 — static 폴백 금지
    expect(view.price).toBe(0);
    expect(view.changePct).toBe(0);
    expect(view.volume24hUsd).toBe(0);
    expect(view.high24h).toBe(0);
    expect(view.low24h).toBe(0);
  });
});

describe("toTickerItems - 시세 배열 → 위젯 아이템", () => {
  it("COIN_META 등록 심볼은 nameKo·href 사전값 사용", () => {
    const items = toTickerItems([btcTicker]);
    expect(items).toHaveLength(1);
    expect(items[0]).toEqual({
      symbol: "BTC",
      name: "비트코인",
      price: 99999,
      changePct: 2.34,
      href: "/coin/btc",
    });
  });

  it("여러 등록 심볼 변환 — symbol=baseSymbol, price/changePct 보존", () => {
    const ethTicker: CoinTicker = {
      ...btcTicker,
      symbol: "ETHUSDT",
      baseSymbol: "ETH",
      price: 4520,
      changePct: -0.5,
    };
    const items = toTickerItems([btcTicker, ethTicker]);
    expect(items.map((i) => i.symbol)).toEqual(["BTC", "ETH"]);
    expect(items[1].name).toBe("이더리움");
    expect(items[1].href).toBe("/coin/eth");
    expect(items[1].price).toBe(4520);
    expect(items[1].changePct).toBe(-0.5);
  });

  it("COIN_META 미등록 심볼 → name=baseSymbol·href는 소문자 fallback 경로", () => {
    const unknownTicker: CoinTicker = {
      ...btcTicker,
      symbol: "PEPEUSDT",
      baseSymbol: "PEPE",
      price: 0.000012,
      changePct: 5.0,
    };
    const items = toTickerItems([unknownTicker]);
    expect(items[0].name).toBe("PEPE"); // nameKo 폴백 = baseSymbol
    expect(items[0].href).toBe("/coin/pepe"); // 소문자 fallback 경로
    expect(items[0].price).toBe(0.000012);
    expect(items[0].changePct).toBe(5.0);
  });

  it("빈 배열 → 빈 배열", () => {
    expect(toTickerItems([])).toEqual([]);
  });
});
