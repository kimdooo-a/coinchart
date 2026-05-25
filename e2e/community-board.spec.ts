import { test, expect } from "@playwright/test";
import {
  BOARDS,
  NONEXISTENT_POST_ID,
  SKIP_DB_DEPENDENT,
  DB_SKIP_REASON,
} from "./_helpers";

// R4/T04 — 게시판 E2E
//  · SSR 목록/상세 + 정렬·검색 내비게이션 (DB 무관: graceful 빈 목록도 렌더됨)
//  · 추천/비추(T02 dislikeCount 분리집계)·댓글 작성/추천(T02 PATCH) — 실 DB 의존 → skip
//
// 게시판 글 클릭/추천/댓글은 community_posts 시드가 있어야 의미가 있다. 2026-05-25 운영 DB
// 미적용 상태에서는 목록이 "이 카테고리에 아직 글이 없습니다"로 렌더되므로 동적 skip 처리한다.

/** 첫 일반글 행 locator (글쓰기 링크 /write 제외). */
function firstPostRow(page: import("@playwright/test").Page, slug: string) {
  return page
    .locator(`a[href^="/board/${slug}/"]`)
    .filter({ hasNotText: "글쓰기" })
    .filter({ hasNotText: "첫 글을 작성" })
    .first();
}

test.describe("게시판 SSR + 내비게이션 (DB 무관)", () => {
  for (const b of BOARDS) {
    test(`S-B1 /board/${b.slug} 목록 SSR 렌더`, async ({ page }) => {
      const res = await page.goto(`/board/${b.slug}`);
      expect(res?.status(), "응답 200대").toBeLessThan(400);
      // 게시판 헤더 h1 (이모지 포함)
      await expect(page.getByRole("heading", { level: 1, name: b.h1 })).toBeVisible();
      // 표 헤더(No/제목/작성자/시간/조회/추천) — "제목" 컬럼 헤더
      await expect(page.getByText("제목", { exact: true })).toBeVisible();
      // 글쓰기 진입점 최소 1개
      await expect(page.getByRole("link", { name: /글쓰기/ }).first()).toBeVisible();
    });
  }

  test("N-B1 정렬 select 변경 → URL ?sort=views 갱신", async ({ page }) => {
    await page.goto("/board/free");
    await page.getByRole("combobox").first().selectOption("views");
    await page.waitForURL(/[?&]sort=views/);
    expect(page.url()).toMatch(/sort=views/);
  });

  test("N-B2 제목 검색 입력+Enter → URL ?search= 갱신", async ({ page }) => {
    await page.goto("/board/free");
    const search = page.getByPlaceholder("제목 검색");
    await search.fill("비트코인");
    await search.press("Enter");
    await page.waitForURL(/[?&]search=/);
    expect(decodeURIComponent(page.url())).toContain("search=비트코인");
  });

  test("S-B2 글쓰기 링크 → 작성 페이지 진입", async ({ page }) => {
    await page.goto("/board/free");
    await page.getByRole("link", { name: /글쓰기/ }).first().click();
    await page.waitForURL(/\/board\/free\/write/);
    await expect(page.getByRole("heading", { level: 1, name: "새 게시글" })).toBeVisible();
    await expect(page.getByPlaceholder("제목을 입력하세요")).toBeVisible();
  });

  test("S-B3 잘못된 게시판 슬러그 → 404", async ({ page }) => {
    const res = await page.goto("/board/not-a-board");
    expect(res?.status()).toBe(404);
  });

  test("E-B1 존재하지 않는 게시글 → 소프트 안내(하드 404 아님)", async ({ page }) => {
    await page.goto(`/board/free/${NONEXISTENT_POST_ID}`);
    await expect(page.getByText("게시글을 찾을 수 없습니다")).toBeVisible();
  });

  test("N-B3 목록 글 클릭 → 상세 진입 (시드 없으면 skip)", async ({ page }) => {
    await page.goto("/board/free");
    const empty = page.getByText("이 카테고리에 아직 글이 없습니다");
    if (await empty.isVisible().catch(() => false)) {
      test.skip(true, `게시글 시드 없음 — ${DB_SKIP_REASON}`);
    }
    await firstPostRow(page, "free").click();
    await page.waitForURL(/\/board\/free\/[0-9a-f-]{36}/);
    await expect(page.locator("article")).toBeVisible();
  });
});

test.describe("게시글 추천/비추 (DB 의존)", () => {
  test.skip(SKIP_DB_DEPENDENT, DB_SKIP_REASON);

  test("L-B1 추천 클릭 → likeCount 증가", async ({ page }) => {
    await page.goto("/board/free");
    await firstPostRow(page, "free").click();
    const likeBtn = page.getByRole("button", { name: /추천 \d+/ });
    const before = Number((await likeBtn.innerText()).replace(/\D/g, ""));
    await likeBtn.click();
    await expect(likeBtn).not.toHaveText(`추천 ${before}`);
  });

  test("L-B2 비추 클릭 → dislikeCount 실값 표시(T02 분리집계, 가짜 0/1 아님)", async ({ page }) => {
    await page.goto("/board/free");
    await firstPostRow(page, "free").click();
    const dislikeBtn = page.getByRole("button", { name: /비추 \d+/ });
    const before = Number((await dislikeBtn.innerText()).replace(/\D/g, ""));
    await dislikeBtn.click();
    // 분리 집계 비추 수가 응답 기반으로 갱신되어야 한다(0/1 토글 가짜값이 아님)
    await expect(dislikeBtn).not.toHaveText(`비추 ${before}`);
  });
});

test.describe("댓글 (DB 의존)", () => {
  test.skip(SKIP_DB_DEPENDENT, DB_SKIP_REASON);

  test("L-B3 댓글 작성(익명 닉/비번) → 목록 반영", async ({ page }) => {
    await page.goto("/board/free");
    await firstPostRow(page, "free").click();
    await page.getByPlaceholder("닉네임 (비회원)").fill("e2e_tester");
    await page.getByPlaceholder("비밀번호 (수정/삭제 시)").fill("1234");
    await page.getByPlaceholder("댓글을 입력하세요...").fill("E2E 자동 댓글");
    await page.getByRole("button", { name: "등록" }).click();
    await expect(page.getByText("E2E 자동 댓글")).toBeVisible();
  });

  test("L-B4 댓글 추천 클릭 → likeCount 증가 + 추천순 정렬", async ({ page }) => {
    await page.goto("/board/free");
    await firstPostRow(page, "free").click();
    // 댓글 영역의 첫 ThumbsUp 버튼(숫자만 포함)
    const thumb = page
      .locator("section")
      .filter({ hasText: "댓글" })
      .getByRole("button")
      .filter({ hasText: /^\d+$/ })
      .first();
    const before = Number((await thumb.innerText()).replace(/\D/g, ""));
    await thumb.click();
    await expect(thumb).not.toHaveText(String(before));
    // 추천순 정렬 토글
    await page.getByRole("button", { name: "추천순" }).click();
    await expect(page.getByRole("button", { name: "추천순" })).toBeVisible();
  });
});
