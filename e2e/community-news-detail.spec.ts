import { test, expect } from "@playwright/test";
import { SKIP_DB_DEPENDENT, DB_SKIP_REASON } from "./_helpers";

// 뉴스 필터 조합·URL 지속·0건 처리 E2E (r9-gap-verify 회수: N-D1/N-D2/N-D4)
//  · /news 는 news-server.ts(anon Supabase 직접 쿼리 + ISR)로 SSR. DB가 비어도
//    "조건에 맞는 뉴스가 없습니다 / 필터 초기화" 로 graceful 렌더되므로 DB 상태와 무관하게
//    필터 URL 갱신·쿼리스트링 persistence 를 검증할 수 있다.
//  · NewsFilters(클라)는 router.push 로 searchParams 를 갱신 → waitForURL 로 대기한다.
//  · 셀렉터는 community-news.spec.ts 컨벤션을 따른다(role + 정확명). 코인 "BTC" 는 사이드바
//    티커 등과의 부분일치 충돌을 피하기 위해 exact:true 로 한정한다(빈 DB에서 사이드바는 비어 있음).
//  · 기존 community-news.spec.ts 가 개별 필터(N-N1/N-N2)·필터초기화 복귀(N-N3)를 이미 커버하므로
//    여기서는 main 미커버 항목(동시조합·새로고침 지속성·0건 결정검증)만 다룬다.

test.describe("뉴스 필터 — 동시조합·URL 지속·0건 처리", () => {
  test("N-D1 4차원 필터 조합 (코인+감정+정렬) → URL 동시 포함 (DB 무관)", async ({ page }) => {
    await page.goto("/news");
    await expect(page.getByRole("heading", { level: 1, name: "📰 뉴스 대시보드" })).toBeVisible();

    // 코인 "BTC" 클릭 → ?coin=BTC
    await page.getByRole("button", { name: "BTC", exact: true }).click();
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
