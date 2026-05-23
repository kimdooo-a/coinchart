import { describe, it, expect } from "vitest";
import { classify } from "@/lib/news/classifier";

describe("classify - 5대 시나리오", () => {
  it("비트코인 ETF 자금 유입 200억 달러 돌파 → BTC/etf/positive/중요도≥6", () => {
    const r = classify({
      title: "비트코인 ETF 자금 유입 200억 달러 돌파",
      source: "블룸버그",
      pubDate: new Date(),
    });
    expect(r.coinTag).toBe("BTC");
    expect(r.category).toBe("etf");
    expect(r.sentiment).toBe("positive");
    expect(r.importance).toBeGreaterThanOrEqual(6);
  });

  it("한국 가상자산 과세 최종안 확정 → regulation/negative/coinTag=ALL", () => {
    const r = classify({
      title: "한국 가상자산 과세 최종안 확정",
      source: "코인데스크",
      pubDate: new Date(),
    });
    expect(r.category).toBe("regulation");
    expect(r.sentiment).toBe("negative");
    expect(r.coinTag).toBe("ALL");
  });

  it("솔라나 네트워크 일시 정지 → SOL/negative", () => {
    const r = classify({
      title: "솔라나 네트워크 일시 정지 — 50분 만에 복구",
      source: "코인텔레그래프",
      pubDate: new Date(),
    });
    expect(r.coinTag).toBe("SOL");
    expect(r.sentiment).toBe("negative");
  });

  it("이더리움 트랜잭션 비용 30% 절감 → ETH/tech/positive", () => {
    const r = classify({
      title: "이더리움 다음 업그레이드, 트랜잭션 비용 30% 절감 전망",
      source: "더 블록",
      pubDate: new Date(),
    });
    expect(r.coinTag).toBe("ETH");
    expect(r.category).toBe("tech");
    expect(r.sentiment).toBe("positive");
  });

  it("빈 텍스트 → market/neutral", () => {
    const r = classify({ title: "" });
    expect(r.category).toBe("market");
    expect(r.sentiment).toBe("neutral");
    expect(r.coinTag).toBe("ALL");
  });
});

describe("classify - 보조 검증", () => {
  it("matchedKeywords 가 사전과 일관성", () => {
    const r = classify({
      title: "비트코인 급등, 사상최고 갱신",
      source: "코인데스크",
    });
    expect(r.matchedKeywords.coin).toContain("비트코인");
    expect(r.matchedKeywords.positive.length).toBeGreaterThan(0);
    expect(r.sentiment).toBe("positive");
  });

  it("호악재 동시 출현 → mixed 또는 negative 가능", () => {
    const r = classify({
      title: "비트코인 상승하지만 해킹 우려 확산",
    });
    // 상승(+2) - 해킹(-5) = net -3, |net|>=2 → negative
    expect(["mixed", "negative"]).toContain(r.sentiment);
  });

  it("중요도 1~10 범위", () => {
    const r = classify({
      title: "이더리움 스테이킹 비율 30% 돌파",
      source: "블룸버그",
      pubDate: new Date(),
    });
    expect(r.importance).toBeGreaterThanOrEqual(1);
    expect(r.importance).toBeLessThanOrEqual(10);
  });
});
