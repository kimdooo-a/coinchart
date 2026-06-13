// /news 순수 헬퍼/매퍼 단위 테스트 (kdyswarm 갈래 B)
// 대상: lib/community/news-queries.ts — categoryLabel, formatRelativeTime, mapApiNews
// formatRelativeTime은 Date.now()에 의존하므로 fake timers로 기준 시각 고정.
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  categoryLabel,
  formatRelativeTime,
  mapApiNews,
  type ApiNewsItem,
} from "@/lib/community/news-queries";

// ─────────────────────────────────────────────────────────────
// 1. categoryLabel — 영문 enum → 한글 8값 매핑 / fallback
// ─────────────────────────────────────────────────────────────
describe("categoryLabel", () => {
  it("8개 영문 enum을 한글 라벨로 매핑한다", () => {
    expect(categoryLabel("regulation")).toBe("규제");
    expect(categoryLabel("tech")).toBe("기술");
    expect(categoryLabel("exchange")).toBe("거래소");
    expect(categoryLabel("onchain")).toBe("온체인");
    expect(categoryLabel("etf")).toBe("ETF");
    expect(categoryLabel("altcoin_news")).toBe("알트코인");
    expect(categoryLabel("macro")).toBe("매크로");
    expect(categoryLabel("market")).toBe("시장동향");
  });

  it("null/undefined/빈 문자열 → undefined", () => {
    expect(categoryLabel(null)).toBeUndefined();
    expect(categoryLabel(undefined)).toBeUndefined();
    expect(categoryLabel("")).toBeUndefined();
    // 인자 생략(optional)도 undefined
    expect(categoryLabel()).toBeUndefined();
  });

  it("사전에 없는 값은 입력값을 그대로 반환한다 (fallback ?? cat)", () => {
    expect(categoryLabel("unknown")).toBe("unknown");
    expect(categoryLabel("defi")).toBe("defi");
    expect(categoryLabel("규제")).toBe("규제"); // 이미 한글이어도 그대로
  });
});

// ─────────────────────────────────────────────────────────────
// 2. formatRelativeTime — 경계 5종 + null/빈/invalid
//    기준 시각을 2026-06-13T00:00:00Z로 고정하고 상대 ISO를 주입.
// ─────────────────────────────────────────────────────────────
describe("formatRelativeTime", () => {
  const NOW = new Date("2026-06-13T00:00:00Z");

  afterEach(() => {
    vi.useRealTimers();
  });

  // NOW 기준 minutesAgo 분 전의 ISO 문자열 생성
  const isoMinutesAgo = (minutes: number): string =>
    new Date(NOW.getTime() - minutes * 60000).toISOString();

  it("null/undefined/빈 문자열 → \"\"", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    expect(formatRelativeTime(null)).toBe("");
    expect(formatRelativeTime(undefined)).toBe("");
    expect(formatRelativeTime("")).toBe("");
  });

  it("Invalid date(NaN) → \"\"", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    expect(formatRelativeTime("not-a-date")).toBe("");
    expect(formatRelativeTime("2026-13-99")).toBe("");
  });

  it("<1분 → \"방금 전\"", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    // 0분 전(동일 시각), 20초 전(Math.round → 0분) 모두 방금 전
    expect(formatRelativeTime(isoMinutesAgo(0))).toBe("방금 전");
    expect(formatRelativeTime(new Date(NOW.getTime() - 20000).toISOString())).toBe("방금 전");
  });

  it("<60분 → \"N분 전\" (공백 포함, Math.round)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    expect(formatRelativeTime(isoMinutesAgo(1))).toBe("1분 전");
    expect(formatRelativeTime(isoMinutesAgo(30))).toBe("30분 전");
    expect(formatRelativeTime(isoMinutesAgo(59))).toBe("59분 전");
  });

  it("<24시간 → \"N시간 전\"", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    expect(formatRelativeTime(isoMinutesAgo(60))).toBe("1시간 전"); // 정확히 60분 → 1시간
    expect(formatRelativeTime(isoMinutesAgo(60 * 5))).toBe("5시간 전");
    expect(formatRelativeTime(isoMinutesAgo(60 * 23))).toBe("23시간 전");
  });

  it("<7일 → \"N일 전\"", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    expect(formatRelativeTime(isoMinutesAgo(60 * 24))).toBe("1일 전"); // 24시간 → 1일
    expect(formatRelativeTime(isoMinutesAgo(60 * 24 * 6))).toBe("6일 전");
  });

  it("그 외 → \"N주 전\"", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    expect(formatRelativeTime(isoMinutesAgo(60 * 24 * 7))).toBe("1주 전"); // 7일 → 1주
    expect(formatRelativeTime(isoMinutesAgo(60 * 24 * 14))).toBe("2주 전");
    expect(formatRelativeTime(isoMinutesAgo(60 * 24 * 20))).toBe("2주 전"); // 20일/7 = floor 2
  });
});

// ─────────────────────────────────────────────────────────────
// 3. mapApiNews — ApiNewsItem → NewsListItem 매핑/폴백
// ─────────────────────────────────────────────────────────────
describe("mapApiNews", () => {
  const NOW = new Date("2026-06-13T00:00:00Z");

  afterEach(() => {
    vi.useRealTimers();
  });

  // 완전체 fixture (필요 필드만 override)
  const baseItem = (override: Partial<ApiNewsItem> = {}): ApiNewsItem => ({
    title: "비트코인 사상 최고가 경신",
    link: "https://example.com/news/btc-all-time-high-12345",
    pubDate: NOW.toISOString(),
    publisher: "코인데스크",
    sentiment: "positive",
    snippet: "BTC가 신고가를 기록했다.",
    symbol: "BTC",
    category: "market",
    importance: 8,
    sentimentScore: 0.7,
    ...override,
  });

  it("id를 news-${i}-${link.slice(-16)} 형태로 합성한다", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const link = "https://example.com/abcdefghijklmnop"; // 끝 16자: abcdefghijklmnop
    const r = mapApiNews(baseItem({ link }), 3);
    expect(r.id).toBe(`news-3-${link.slice(-16)}`);
    expect(r.id).toBe("news-3-abcdefghijklmnop");
  });

  it("link가 없으면 linkKey로 인덱스를 사용한다", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const r = mapApiNews(baseItem({ link: "" }), 7);
    expect(r.id).toBe("news-7-7");
    expect(r.link).toBe("");
  });

  it("symbol이 'ALL'이면 coinTag는 undefined", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    expect(mapApiNews(baseItem({ symbol: "ALL" }), 0).coinTag).toBeUndefined();
  });

  it("symbol이 일반 심볼이면 coinTag로 그대로 전달", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    expect(mapApiNews(baseItem({ symbol: "BTC" }), 0).coinTag).toBe("BTC");
  });

  it("symbol이 null이면 coinTag는 undefined", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    expect(mapApiNews(baseItem({ symbol: null }), 0).coinTag).toBeUndefined();
  });

  it("sentiment가 null이면 기본값 'neutral'", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    expect(mapApiNews(baseItem({ sentiment: null }), 0).sentiment).toBe("neutral");
  });

  it("snippet null → summary \"\", publisher null → source '출처 미상'", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const r = mapApiNews(baseItem({ snippet: null, publisher: null }), 0);
    expect(r.summary).toBe("");
    expect(r.source).toBe("출처 미상");
  });

  it("importance/sentimentScore null → undefined", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const r = mapApiNews(baseItem({ importance: null, sentimentScore: null }), 0);
    expect(r.importance).toBeUndefined();
    expect(r.sentimentScore).toBeUndefined();
  });

  it("category는 한글 라벨로, timeLabel은 상대 시간으로 매핑된다", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const r = mapApiNews(
      baseItem({
        category: "regulation",
        pubDate: new Date(NOW.getTime() - 30 * 60000).toISOString(), // 30분 전
      }),
      0,
    );
    expect(r.category).toBe("규제");
    expect(r.timeLabel).toBe("30분 전");
  });

  it("나머지 필드(title/link/importance/sentimentScore)를 그대로 전달한다", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const item = baseItem();
    const r = mapApiNews(item, 2);
    expect(r.title).toBe(item.title);
    expect(r.link).toBe(item.link);
    expect(r.importance).toBe(8);
    expect(r.sentimentScore).toBe(0.7);
  });
});
