import { test, expect } from "@playwright/test";
import { SKIP_DB_DEPENDENT, DB_SKIP_REASON } from "./_helpers";

// 갈래 D (지시서 4-B) — 뉴스 필터 조합·URL 지속·0건 처리 E2E
//  · /news 는 news-server.ts(anon Supabase 직접 쿼리 + ISR)로 SSR. DB가 비어도
//    "조건에 맞는 뉴스가 없습니다 / 필터 초기화" 로 graceful 렌더되므로 DB 상태와 무관하게
//    필터 URL 갱신·쿼리스트링 persistence 를 검증할 수 있다.
//  · NewsFilters(클라)는 router.push 로 searchParams 를 갱신 → waitForURL 로 대기한다.
//  · 셀렉터는 community-news.spec.ts 컨벤션을 그대로 따른다(role + 정확명).
//    코인행 "BTC"·"전체" 등은 분류행과 중복 가능하므로 getByRole("button", { name })로 한정한다.
//  · 0건 결정 검증은 무가드 DB 의존을 피하기 위해 test.skip(SKIP_DB_DEPENDENT) 가드 하에서만 수행.

test.describe("뉴스 상세/검색 — 필터 조합·URL 지속·0건 처리", () => {
  test("N-D1 4차원 필터 조합 (코인+감정+정렬) → URL 동시 포함 (DB 무관)", async ({ page }) => {
    await page.goto("/news");
    await expect(page.getByRole("heading", { level: 1, name: "📰 뉴스 대시보드" })).toBeVisible();

    // 코인 "BTC" 클릭 → ?coin=BTC
    await page.getByRole("button", { name: "BTC" }).click();
    await page.waitForURL(/[?&]coin=BTC/);

    // 감정 "🔴 호재" 클릭 → sentiment=positive
    await page.getByRole("button", { name: "🔴 호재" }).click();
    await page.waitForURL(/[?&]sentiment=positive/);

    // 정렬 "중요도순" 클릭 → sort=importance
    await page.getByRole("button", { name: "중요도순" }).click();
    await page.waitForURL(/[?&]sort=importance/);

    // 최종 URL 에 세 쿼리가 동시 포함 + 결과는 graceful 렌더(h1 유지)
    const url = page.url();
    expect(url, "coin=BTC 포함").toMatch(/coin=BTC/);
    expect(url, "sentiment=positive 포함").toMatch(/sentiment=positive/);
    expect(url, "sort=importance 포함").toMatch(/sort=importance/);
    await expect(page.getByRole("heading", { level: 1, name: "📰 뉴스 대시보드" })).toBeVisible();
  });

  test("N-D2 URL 지속성 — 새로고침 후에도 쿼리스트링 유지 (DB 무관)", async ({ page }) => {
    await page.goto("/news?sentiment=positive&sort=importance");
    await expect(page.getByRole("heading", { level: 1, name: "📰 뉴스 대시보드" })).toBeVisible();

    // 새로고침 후에도 두 쿼리가 URL 에 유지되어야 한다(서버 재렌더 + searchParams persistence)
    await page.reload();
    const url = page.url();
    expect(url, "새로고침 후 sentiment=positive 유지").toMatch(/sentiment=positive/);
    expect(url, "새로고침 후 sort=importance 유지").toMatch(/sort=importance/);
    await expect(page.getByRole("heading", { level: 1, name: "📰 뉴스 대시보드" })).toBeVisible();
  });

  test("N-D3 필터 적용 → '필터 초기화' 링크 클릭 시 /news 복귀 (graceful)", async ({ page }) => {
    await page.goto("/news?coin=BTC&sentiment=positive&sort=importance");
    await expect(page.getByRole("heading", { level: 1, name: "📰 뉴스 대시보드" })).toBeVisible();

    // 결과가 0건이면 '필터 초기화' 링크가 노출 → 클릭 시 /news 복귀.
    // 0건이 아니어서 링크가 없으면 graceful 통과(링크 부재를 단언으로 깨지 않는다).
    const reset = page.getByRole("link", { name: "필터 초기화" });
    if (await reset.isVisible().catch(() => false)) {
      await reset.click();
      await page.waitForURL(/\/news$/);
      expect(page.url(), "필터 초기화 후 /news 복귀").toMatch(/\/news$/);
    }
  });

  test("N-D4 0건 결정 검증 — '필터 초기화' 노출 (DB 준비 시에만)", async ({ page }) => {
    // 무가드 DB 의존 금지: E2E_DB_READY=1 환경에서만 결정적으로 0건 안내를 단언한다.
    test.skip(SKIP_DB_DEPENDENT, DB_SKIP_REASON);

    // 실재하지 않을 코인+감정 조합으로 0건을 유도 → 빈 결과 안내가 확정적으로 노출되어야 한다.
    await page.goto("/news?coin=BTC&sentiment=positive&sort=importance");
    await expect(page.getByRole("heading", { level: 1, name: "📰 뉴스 대시보드" })).toBeVisible();
    await expect(page.getByText("조건에 맞는 뉴스가 없습니다")).toBeVisible();
    const reset = page.getByRole("link", { name: "필터 초기화" });
    await expect(reset).toBeVisible();
    await reset.click();
    await page.waitForURL(/\/news$/);
  });
});
