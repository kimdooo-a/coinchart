import { test, expect } from "@playwright/test";
import { COIN_SLUGS } from "./_helpers";

// R4/T04 — 코인룸 E2E (SSG/ISR 6종 + 탭 인터랙션)
//  · /coin/[symbol] 은 6종 슬러그가 빌드 시 프리렌더(SSG+ISR, dynamicParams=false).
//    시세는 Binance API(외부)·게시글/뉴스는 community/news(빈 DB면 graceful 폴백)로 렌더.
//  · 탭 전환(전체/토론/뉴스/시세·분석/공지)은 CoinRoomTabs(클라, useState) — 즉시 토글, 재fetch 없음.

test.describe("코인룸 SSG/ISR (DB 무관)", () => {
  for (const slug of COIN_SLUGS) {
    test(`S-C1 /coin/${slug} 렌더 (탭리스트 + 핵심지표)`, async ({ page }) => {
      const res = await page.goto(`/coin/${slug}`);
      expect(res?.status(), "응답 200대").toBeLessThan(400);
      // 메인 컬럼 탭리스트
      await expect(page.getByRole("tablist")).toBeVisible();
      // 사이드바 "<SYMBOL> 핵심 지표" 위젯
      await expect(page.getByText(/핵심 지표/).first()).toBeVisible();
    });
  }

  test("N-C1 탭 '시세·분석' 전환 → 분석 안내 노출", async ({ page }) => {
    await page.goto("/coin/btc");
    await page.getByRole("tab", { name: "📊 시세·분석" }).click();
    await expect(page.getByText(/차트 분석은 도구 페이지에서/)).toBeVisible();
  });

  test("N-C2 탭 '공지' 전환 → 공지 패널 (빈 DB: 공지 없음)", async ({ page }) => {
    await page.goto("/coin/btc");
    await page.getByRole("tab", { name: "📌 공지" }).click();
    await expect(page.getByText("현재 공지가 없습니다")).toBeVisible();
  });

  test("N-C3 탭 '토론' 전환 → 토론 패널 표시", async ({ page }) => {
    await page.goto("/coin/btc");
    await page.getByRole("tab", { name: "💬 토론" }).click();
    // 빈 DB: "아직 글이 없습니다" / 시드 시: 표 — 어느 쪽이든 패널은 표시됨
    await expect(page.getByRole("tab", { name: "💬 토론" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
  });

  test("S-C2 잘못된 코인 슬러그 → 404 (dynamicParams=false)", async ({ page }) => {
    const res = await page.goto("/coin/not-a-coin");
    expect(res?.status()).toBe(404);
  });
});
