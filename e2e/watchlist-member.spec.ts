import { test, expect, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

// 세션49 — watchlist 회원 sync 런타임 스모크 (R17 잔여 마감)
// 설계: docs/superpowers/specs/2026-06-03-watchlist-sync-e2e-smoke-design.md
//
// 본 스펙은 watchlist-member 프로젝트에서만 실행된다(playwright.config testMatch).
//   회원 세션 = auth.setup 가 생성한 e2e/.auth/admin.json(E2E_ADMIN_EMAIL, magiclink fallback).
//   watchlist 는 관리자/일반 구분이 없어 관리자 계정을 "회원"으로 재사용한다.
//
// 검증 흐름(절차서 docs/db/R14-watchlist-sync-smoke.md):
//   §3 익명 localStorage 적재 → 로그인 → POST /api/watchlist/sync 200 + 로컬 손실 0
//   §5 빈 localStorage 새 컨텍스트 + 동일 세션 → sync 로 DB 항목 복원
//   §6 reorder PATCH 200 + sort_order 반영 / clear DELETE?all 200 + 잔여 복원 없음
//
// 활성 조건(모두 충족 시 실행, 아니면 graceful skip — AD1 과 동일 런타임 패턴):
//   E2E_DB_READY=1 + 회원 인증 마커(e2e/.auth/admin.ready) + E2E_ADMIN_EMAIL/service_role/URL
// 격리: e2e/ 안만 변경(앱 코드 무수정). 합성 심볼(SMOKEE2E*)만 적재·정리(운영 오염 0).

const AUTH_FILE = path.join(__dirname, ".auth", "admin.json");
const READY_FILE = path.join(__dirname, ".auth", "admin.ready");
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const EMAIL = process.env.E2E_ADMIN_EMAIL;

// 활성 여부는 런타임(test 진입 시)에 평가한다. READY_FILE 은 dependencies:['setup'] 의
//   auth.setup 가 생성하는데 test collection 은 setup 보다 먼저 1회 일어난다 → top-level 상수로
//   굳히면 fresh 실행(CI 첫 회)에서 항상 skip 되는 함정이 있어 함수로 평가한다(AD1 과 동일).
const runSmoke = () =>
  process.env.E2E_DB_READY === "1" &&
  fs.existsSync(READY_FILE) &&
  !!SUPABASE_URL &&
  !!SERVICE_ROLE &&
  !!EMAIL;

const SKIP_REASON =
  "watchlist sync 스모크 비활성 — 활성 조건: E2E_DB_READY=1 + 회원 인증(e2e/.auth/admin.ready, auth.setup) + " +
  "E2E_ADMIN_EMAIL/service_role/URL 주입.";

const STORAGE_KEY = "cca:watchlist";
// 합성 심볼(운영 시세에 없는 SMOKEE2E* — normalizeWatchlistInput 은 1~32자 임의 대문자 허용)
const SYNTH = [
  { assetType: "CRYPTO", symbol: "SMOKEE2EAAA", sortOrder: 0, createdAt: 1717000000000 },
  { assetType: "CRYPTO", symbol: "SMOKEE2EBBB", sortOrder: 1, createdAt: 1717000001000 },
];

interface LocalItem {
  assetType: string;
  symbol: string;
  sortOrder: number;
  createdAt: number;
}

test.describe.configure({ mode: "serial" });

test.describe("watchlist 회원 sync 런타임 스모크 (인증+DB)", () => {
  const adminDb = () =>
    createClient(SUPABASE_URL!, SERVICE_ROLE!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

  // 회원 컨텍스트 헬퍼: admin.json 세션 + (선택) localStorage 선적재(addInitScript).
  const memberContext = async (
    browser: Browser,
    seed?: typeof SYNTH
  ): Promise<BrowserContext> => {
    const ctx = await browser.newContext({ storageState: AUTH_FILE });
    if (seed) {
      await ctx.addInitScript(
        ([key, items]) => {
          window.localStorage.setItem(
            key as string,
            JSON.stringify({ version: 1, items })
          );
        },
        [STORAGE_KEY, seed] as const
      );
    }
    return ctx;
  };

  const readLocal = (page: Page): Promise<LocalItem[]> =>
    page.evaluate((key) => {
      const raw = window.localStorage.getItem(key);
      if (!raw) return [] as LocalItem[];
      try {
        const p = JSON.parse(raw) as { items?: LocalItem[] };
        return Array.isArray(p?.items) ? p.items : [];
      } catch {
        return [] as LocalItem[];
      }
    }, STORAGE_KEY);

  const waitSync = (page: Page) =>
    page.waitForResponse(
      (r) => r.url().includes("/api/watchlist/sync") && r.request().method() === "POST"
    );

  test.afterAll(async () => {
    if (!runSmoke()) return;
    // 합성 심볼 정리(잔여 0) — user_id 확보 후 SMOKEE2E* 만 삭제(계정 실데이터 불간섭).
    const { data } = await adminDb().auth.admin.generateLink({
      type: "magiclink",
      email: EMAIL!,
    });
    const uid = data?.user?.id;
    if (uid) {
      await adminDb()
        .from("user_watchlist")
        .delete()
        .eq("user_id", uid)
        .like("symbol", "SMOKEE2E%");
    }
  });

  test("TC1 (§3) 익명 localStorage 적재 → 로그인 sync 200 + 손실 0", async ({ browser }) => {
    test.skip(!runSmoke(), SKIP_REASON);
    const ctx = await memberContext(browser, SYNTH);
    const page = await ctx.newPage();
    // 시작 클린(이전 잔여 0 보장 — DELETE?all 은 멱등)
    await page.request.delete("/api/watchlist?all=true");

    const [syncRes] = await Promise.all([waitSync(page), page.goto("/watchlist")]);
    expect(syncRes.status(), "sync POST 200").toBe(200);
    const body = (await syncRes.json()) as { added: number; limit: number };
    expect(body.added, "신규 업로드 ≥2").toBeGreaterThanOrEqual(2);
    expect(body.limit, "회원 상한 100").toBe(100);

    // 로컬 병합본에 합성 2종 손실 0
    const symbols = (await readLocal(page)).map((i) => i.symbol);
    expect(symbols, "SMOKEE2EAAA 보존").toContain("SMOKEE2EAAA");
    expect(symbols, "SMOKEE2EBBB 보존").toContain("SMOKEE2EBBB");
    await ctx.close();
  });

  test("TC2 (§5) 빈 컨텍스트 로그인 → DB 항목 복원", async ({ browser }) => {
    test.skip(!runSmoke(), SKIP_REASON);
    const ctx = await memberContext(browser); // 빈 localStorage(addInitScript 없음)
    const page = await ctx.newPage();

    const [syncRes] = await Promise.all([waitSync(page), page.goto("/watchlist")]);
    expect(syncRes.status(), "sync POST 200").toBe(200);

    const symbols = (await readLocal(page)).map((i) => i.symbol);
    expect(symbols, "TC1 합성 2종 복원").toEqual(
      expect.arrayContaining(["SMOKEE2EAAA", "SMOKEE2EBBB"])
    );
    await ctx.close();
  });

  test("TC3 (§6) reorder PATCH 반영 + clear DELETE?all + 잔여 복원 없음", async ({
    browser,
  }) => {
    test.skip(!runSmoke(), SKIP_REASON);
    const ctx = await memberContext(browser);
    const page = await ctx.newPage();

    // reorder: 역순 sort_order 영속화(AAA 0→1, BBB 1→0)
    const patchRes = await page.request.patch("/api/watchlist", {
      data: {
        order: [
          { assetType: "CRYPTO", symbol: "SMOKEE2EAAA", sortOrder: 1 },
          { assetType: "CRYPTO", symbol: "SMOKEE2EBBB", sortOrder: 0 },
        ],
      },
    });
    expect(patchRes.status(), "reorder PATCH 200").toBe(200);
    expect((await patchRes.json()).ok, "reorder ok").toBe(true);

    // GET 으로 역순 반영 확인(BBB 가 AAA 보다 앞)
    const getRes = await page.request.get("/api/watchlist");
    expect(getRes.status(), "GET 200").toBe(200);
    const getBody = (await getRes.json()) as { items: LocalItem[] };
    const aaa = getBody.items.find((i) => i.symbol === "SMOKEE2EAAA");
    const bbb = getBody.items.find((i) => i.symbol === "SMOKEE2EBBB");
    expect(aaa, "AAA 존재").toBeTruthy();
    expect(bbb, "BBB 존재").toBeTruthy();
    expect(bbb!.sortOrder, "BBB 가 앞(작은 sortOrder)").toBeLessThan(aaa!.sortOrder);

    // clear: /watchlist 진입(sync 1회) → 전체 비우기 버튼 → window.confirm 수락 → DELETE?all
    page.on("dialog", (d) => void d.accept());
    const [syncRes] = await Promise.all([waitSync(page), page.goto("/watchlist")]);
    expect(syncRes.status(), "clear 전 sync 200").toBe(200);

    const [clearRes] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes("/api/watchlist") &&
          r.request().method() === "DELETE" &&
          r.url().includes("all=true")
      ),
      page.getByRole("button", { name: "전체 비우기" }).click(),
    ]);
    expect(clearRes.status(), "clear DELETE?all 200").toBe(200);
    await ctx.close();

    // §6-4 잔여 복원 없음 — 새 컨텍스트 로그인 후 합성 심볼이 복원되지 않아야 함
    const ctx2 = await memberContext(browser);
    const page2 = await ctx2.newPage();
    await Promise.all([waitSync(page2), page2.goto("/watchlist")]);
    const synthLeft = (await readLocal(page2)).filter((i) =>
      i.symbol.startsWith("SMOKEE2E")
    );
    expect(synthLeft, "clear 후 합성 잔여 복원 없음").toHaveLength(0);
    await ctx2.close();
  });
});
