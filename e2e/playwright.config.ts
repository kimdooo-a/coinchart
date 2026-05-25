import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

// R4/T04 — 커뮤니티 E2E 설정
//
// 본 config는 e2e/ 안에 둔다(격리: 앱 루트를 오염시키지 않음). 산출물(report/results)도
// e2e/ 하위에 모은다(e2e/.gitignore가 무시). 앱 dev 서버는 루트(ROOT)에서 구동한다.
// 실행: 루트에서 `npx playwright test --config=e2e/playwright.config.ts`

const ROOT = path.resolve(__dirname, "..");
const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
// R6/T01 — 관리자 인증 storageState(auth.setup.ts 가 생성/갱신, e2e/.gitignore로 커밋 제외)
const ADMIN_AUTH_FILE = path.join(__dirname, ".auth", "admin.json");

export default defineConfig({
  testDir: __dirname,
  // dev 서버 단일 인스턴스에 부하를 주지 않도록 직렬 실행
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  outputDir: path.join(__dirname, "test-results"),
  reporter: [
    ["list"],
    ["html", { outputFolder: path.join(__dirname, "playwright-report"), open: "never" }],
  ],
  use: {
    baseURL: BASE_URL,
    headless: true,
    locale: "ko-KR",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  // R6/T01 — projects 분리:
  //   · setup  : auth.setup.ts 만 실행 → 관리자 storageState(admin.json) 생성(자격 부재 시 빈 상태)
  //   · chromium: 기존 비인증 스위트(29건). setup/admin-auth 스펙은 제외(비로그인 그대로 유지)
  //   · admin  : community-admin-auth.spec.ts(AD1)만, 관리자 storageState 로 로그인 상태 실행
  projects: [
    { name: "setup", testMatch: /.*\.setup\.ts$/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      // auth.setup.ts(인증 셋업) + community-admin-auth.spec.ts(로그인 필요)는 비인증 프로젝트에서 제외
      testIgnore: [/.*\.setup\.ts$/, /community-admin-auth\.spec\.ts$/],
    },
    {
      name: "admin",
      testMatch: /community-admin-auth\.spec\.ts$/,
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], storageState: ADMIN_AUTH_FILE },
    },
  ],
  // dev 서버 자동 구동 — 이미 떠 있으면 재사용. Next 16 첫 컴파일을 고려해 timeout 넉넉히.
  webServer: {
    command: "npm run dev",
    cwd: ROOT,
    url: BASE_URL,
    timeout: 180_000,
    reuseExistingServer: true,
    stdout: "ignore",
    stderr: "pipe",
  },
});
