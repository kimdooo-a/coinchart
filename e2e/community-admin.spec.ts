import { test, expect } from "@playwright/test";
import { DB_SKIP_REASON } from "./_helpers";

// R4/T04 — 관리자 공지 E2E
//  · /admin/* 는 middleware(protectedPaths: /admin)가 보호하는 라우트 — 비로그인 시
//    /auth/login 으로 리다이렉트한다(라우트 보호 정상 동작).
//  · admin/board 클라 컴포넌트의 "접근 권한 없음" 게이트는 로그인했으나 비관리자일 때의
//    2차 방어선이라, 비로그인 E2E로는 도달하지 않는다(미들웨어가 먼저 가로챔).
//  · is_notice 승격/해제 토글은 관리자 인증(storageState) + community_posts 시드가 필요 → skip.

test.describe("관리자 공지", () => {
  test("S-AD1 비로그인 /admin/board → 로그인 보호 리다이렉트", async ({ page }) => {
    await page.goto("/admin/board");
    // 미들웨어가 비로그인 접근을 /auth/login 으로 리다이렉트한다.
    await page.waitForURL(/\/auth\/login/);
    await expect(page.getByRole("heading", { name: "Welcome Back" })).toBeVisible();
  });

  test("AD1 관리자 is_notice 토글 → 목록 상단 공지 노출 (인증+DB 의존)", async ({ page }) => {
    test.skip(
      true,
      `관리자 인증 storageState 미구성 + ${DB_SKIP_REASON}`
    );
    // (관리자 storageState + DB 적용 후) 일반글 '공지 등록' → 공지 목록 상단 노출,
    // '공지 해제' → 일반글 복귀. /board/{slug} 목록 상단 공지 섹션 노출까지 확인.
    await page.goto("/admin/board");
    await page.getByRole("button", { name: "공지 등록" }).first().click();
    await expect(page.getByText(/현재 공지 \(/)).toBeVisible();
  });
});
