import { test, expect } from "@playwright/test";

// R4/T04 — 뉴스 E2E (SSR 렌더 + 4차원 필터)
//  · /news 는 news-server.ts(anon Supabase 직접 쿼리 + 5분 ISR)로 SSR. 데이터가 비어도
//    "조건에 맞는 뉴스가 없습니다" 로 graceful 렌더되므로 DB 상태와 무관하게 검증 가능.
//  · 필터(코인/분류/감정/정렬)는 NewsFilters(클라)가 searchParams를 갱신 → 서버 재렌더.
//    감정·정렬은 컴포넌트 로컬 상수라 라벨이 고정 → 셀렉터 안정적.

test.describe("뉴스 SSR + 4차원 필터 (DB 무관)", () => {
  test("S-N1 /news 렌더 (헤더·표·필터 라벨)", async ({ page }) => {
    const res = await page.goto("/news");
    expect(res?.status(), "응답 200대").toBeLessThan(400);
    await expect(page.getByRole("heading", { level: 1, name: "📰 뉴스 대시보드" })).toBeVisible();
    // 뉴스 표 헤더 "뉴스 (N)"
    await expect(page.getByText(/^뉴스 \(/)).toBeVisible();
    // 4차원 필터 라벨
    for (const label of ["코인", "분류", "감정", "정렬"]) {
      await expect(page.getByText(label, { exact: true })).toBeVisible();
    }
  });

  test("N-N1 감정 '호재' 필터 클릭 → URL ?sentiment=positive", async ({ page }) => {
    await page.goto("/news");
    await page.getByRole("button", { name: "🔴 호재" }).click();
    await page.waitForURL(/[?&]sentiment=positive/);
    expect(page.url()).toMatch(/sentiment=positive/);
  });

  test("N-N2 정렬 '중요도순' 클릭 → URL ?sort=importance", async ({ page }) => {
    await page.goto("/news");
    await page.getByRole("button", { name: "중요도순" }).click();
    await page.waitForURL(/[?&]sort=importance/);
    expect(page.url()).toMatch(/sort=importance/);
  });

  test("N-N3 필터 조합 후 → /news 복귀(필터 초기화 경로)", async ({ page }) => {
    await page.goto("/news?sentiment=positive&sort=importance");
    // 필터 적용 상태에서 헤더는 그대로 렌더
    await expect(page.getByRole("heading", { level: 1, name: "📰 뉴스 대시보드" })).toBeVisible();
    // 결과가 비면 '필터 초기화' 링크가 /news 로 복귀시킨다(존재 시에만 검증)
    const reset = page.getByRole("link", { name: "필터 초기화" });
    if (await reset.isVisible().catch(() => false)) {
      await reset.click();
      await page.waitForURL(/\/news$/);
    }
  });

  test("S-N2 사이드바 위젯 렌더 (코인별 뉴스)", async ({ page }) => {
    await page.goto("/news");
    await expect(page.getByText("📊 코인별 뉴스 (오늘)")).toBeVisible();
  });
});
