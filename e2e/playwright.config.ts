import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

// R4/T04 — 커뮤니티 E2E 설정
//
// 본 config는 e2e/ 안에 둔다(격리: 앱 루트를 오염시키지 않음). 산출물(report/results)도
// e2e/ 하위에 모은다(e2e/.gitignore가 무시). 앱 dev 서버는 루트(ROOT)에서 구동한다.
// 실행: 루트에서 `npx playwright test --config=e2e/playwright.config.ts`

const ROOT = path.resolve(__dirname, "..");
const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

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
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
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
