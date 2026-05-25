import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";

// R6/T01 — AD1 관리자 공지 토글 (인증 storageState + 실 DB 의존)
//
// 본 스펙은 admin 프로젝트에서만 실행된다(playwright.config testMatch). 관리자 로그인
//   상태(e2e/.auth/admin.json)가 전제다. 비로그인 리다이렉트 검증 S-AD1 은 인증 상태가
//   정반대(로그아웃)라 비인증 chromium 프로젝트의 community-admin.spec.ts 에 그대로 둔다
//   (한 파일을 두 인증 상태로 동시에 돌릴 수 없어 파일을 분리).
//
// 활성 조건(모두 충족 시 실행, 아니면 graceful skip):
//   · E2E_DB_READY=1 (실 DB — community_* 테이블/RPC 적용 + 운영 DB URL 주입)
//   · 관리자 인증 마커 e2e/.auth/admin.ready (auth.setup 가 로그인 성공 시 생성)
//   · service_role / Supabase URL (대상 데이터 자체 생성·정리용)
//
// 신뢰성 패턴([[e2e-db-dependent-test-reliability]], R5): 시드 의존 대신 대상 일반글을
//   service_role 로 자체 생성 → UI 로 공지 승격/해제 → 검증 → 생성 데이터 정리(잔여 0).

const READY_FILE = path.join(__dirname, ".auth", "admin.ready");
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 활성 여부는 런타임(beforeAll/test)에 평가한다. READY_FILE 은 dependencies:['setup'] 의
//   auth.setup 가 생성하는데, playwright 의 test collection 은 모든 프로젝트 실행보다 먼저
//   1회 일어난다 → top-level 상수로 굳히면 setup 이 마커를 만들기 전에 평가되어 fresh 실행
//   (CI 첫 회)에서 항상 skip 되는 함정이 있다. 함수로 만들어 setup 완료 후 시점에 평가한다.
const runAd1 = () =>
  process.env.E2E_DB_READY === "1" &&
  fs.existsSync(READY_FILE) &&
  !!SUPABASE_URL &&
  !!SERVICE_ROLE;

const SKIP_REASON =
  "AD1 비활성 — 활성 조건: E2E_DB_READY=1 + 관리자 인증(e2e/.auth/admin.ready, auth.setup) + " +
  "service_role/URL 주입. 관리자 계정이 OAuth 전용이면 비밀번호 설정 또는 service_role generateLink fallback(R7-2)";

test.describe("관리자 공지 토글 (인증+DB)", () => {

  // 자체 생성 대상 일반글 — 고유 제목으로 식별/정리
  const TITLE = `E2E 공지대상 ${Date.now()}`;
  let postId: string | null = null;

  const adminDb = () =>
    createClient(SUPABASE_URL!, SERVICE_ROLE!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

  test.beforeAll(async () => {
    if (!runAd1()) return; // 비활성(skip 예정)이면 대상 데이터를 만들지 않는다
    // 익명(guest_*) 일반글로 적재 — author XOR guest CHECK 충족(guest 3요소).
    const hash = await bcrypt.hash("e2e-admin-ad1", 10); // guest_password_hash CHECK(≥60자)
    const { data, error } = await adminDb()
      .from("community_posts")
      .insert({
        board_slug: "free",
        title: TITLE,
        content_html: `<p>${TITLE}</p>`,
        author_id: null,
        guest_nickname: "E2E봇",
        guest_password_hash: hash,
        guest_ip_masked: "0.0.*.*", // guest_ip_masked CHECK regex(\d+\.\d+\.\*\.\*)
        category: "전체",
        tags: [],
        coin_symbol: null,
        is_notice: false,
      })
      .select("id")
      .single();
    expect(error, `대상 일반글 생성 실패: ${error?.message ?? ""}`).toBeNull();
    postId = (data?.id as string) ?? null;
    expect(postId, "생성된 게시글 id").toBeTruthy();
  });

  test.afterAll(async () => {
    // 생성 데이터 정리(잔여 0). 댓글/추천은 FK ON DELETE CASCADE.
    if (postId) {
      await adminDb().from("community_posts").delete().eq("id", postId);
    }
  });

  test("AD1 관리자 is_notice 토글 → 공지 승격/해제 + 목록 상단 공지 노출", async ({ page }) => {
    // 런타임 skip 판정(setup 의존 완료 후 — READY_FILE 존재 시점). collection 함정 회피.
    test.skip(!runAd1(), SKIP_REASON);
    // free 보드가 기본 선택 — 마운트 시 verifyAdmin → loadBoard('free')
    await page.goto("/admin/board");
    // 관리자 게이트 통과(미들웨어 통과 + 클라 게이트 "접근 권한 없음" 아님)
    await expect(page.getByRole("heading", { name: "📌 공지 게시판 관리" })).toBeVisible();

    // "최근 글(공지 승격)" 섹션의 방금 만든 일반글 행 → '공지 등록'
    //   방금 생성(created_at=now)이라 최근 30건 목록 상단에 위치한다.
    const targetRow = page.locator("li").filter({ hasText: TITLE });
    await expect(targetRow).toBeVisible();
    const [promoteRes] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes("/api/admin/board") && r.request().method() === "PATCH"
      ),
      targetRow.getByRole("button", { name: "공지 등록" }).click(),
    ]);
    expect(promoteRes.status(), "공지 승격 PATCH 200").toBe(200);

    // 승격 후 재로드(handleToggle→loadBoard) → "현재 공지" 섹션에 our 글 노출('공지 해제' 버튼)
    await expect(
      page.locator("li").filter({ hasText: TITLE }).getByRole("button", { name: "공지 해제" })
    ).toBeVisible();

    // 목록 상단 공지 노출 검증 — /board/free 의 공지 영역에 our 제목 노출
    await page.goto("/board/free");
    await expect(page.getByText(TITLE).first()).toBeVisible();

    // 공지 해제 → 일반글 복귀
    await page.goto("/admin/board");
    await expect(page.getByRole("heading", { name: "📌 공지 게시판 관리" })).toBeVisible();
    const [demoteRes] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes("/api/admin/board") && r.request().method() === "PATCH"
      ),
      page
        .locator("li")
        .filter({ hasText: TITLE })
        .getByRole("button", { name: "공지 해제" })
        .click(),
    ]);
    expect(demoteRes.status(), "공지 해제 PATCH 200").toBe(200);
    // 해제 후 '공지 등록' 버튼으로 복귀(일반글)
    await expect(
      page.locator("li").filter({ hasText: TITLE }).getByRole("button", { name: "공지 등록" })
    ).toBeVisible();
  });
});
