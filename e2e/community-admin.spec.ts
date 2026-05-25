import { test, expect } from "@playwright/test";

// R4/T04 — 관리자 공지 E2E (비인증 부분만)
//  · /admin/* 는 middleware(protectedPaths: /admin)가 보호하는 라우트 — 비로그인 시
//    /auth/login 으로 리다이렉트한다(라우트 보호 정상 동작).
//  · admin/board 클라 컴포넌트의 "접근 권한 없음" 게이트는 로그인했으나 비관리자일 때의
//    2차 방어선이라, 비로그인 E2E로는 도달하지 않는다(미들웨어가 먼저 가로챔).
//
// R6/T01: AD1(관리자 is_notice 토글)은 "로그인된 관리자" 상태가 필요해 인증 상태가 정반대인
//   S-AD1(로그아웃)과 같은 파일에서 돌릴 수 없다. → AD1 은 admin 프로젝트 전용
//   e2e/community-admin-auth.spec.ts 로 분리하고, 본 파일은 비인증 chromium 프로젝트에 남는다.

test.describe("관리자 공지 (비인증)", () => {
  test("S-AD1 비로그인 /admin/board → 로그인 보호 리다이렉트", async ({ page }) => {
    await page.goto("/admin/board");
    // 미들웨어가 비로그인 접근을 /auth/login 으로 리다이렉트한다.
    await page.waitForURL(/\/auth\/login/);
    await expect(page.getByRole("heading", { name: "Welcome Back" })).toBeVisible();
  });
});
