import { test as setup, expect } from "@playwright/test";
import { createServerClient } from "@supabase/ssr";
import fs from "node:fs";
import path from "node:path";

// R6/T01 — 관리자 인증 storageState 캡처 (setup 프로젝트)
//
// 목적: /admin/* (middleware protectedPaths 보호)에 접근 가능한 관리자 세션 쿠키를
//   playwright storageState(e2e/.auth/admin.json)로 저장한다. admin 프로젝트가 이 파일을
//   로드해 "로그인된 관리자" 상태로 AD1(관리자 공지 토글)을 실행한다.
//
// 로그인 방식(중요): app/auth/login 은 Google OAuth 전용(이메일/비밀번호 폼 없음)이라 UI
//   로그인이 불가능하다. 따라서 앱과 동일한 @supabase/ssr 로 프로그래밍 로그인하여
//   미들웨어/서버 클라가 그대로 읽는 쿠키 포맷(sb-<ref>-auth-token, 청크 포함)을 생성한다.
//   → app/auth/login 등 앱 코드는 일절 수정하지 않는다(격리: e2e/ 안만 변경).
//
// 자격증명: 환경변수 E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD
//   (관리자 = isAdminEmail, 2026-05-25 현재 smartkdy7@gmail.com — lib/supabase/blog.ts).
//   ⚠️ 해당 계정은 Google OAuth 계정이라 기본적으로 비밀번호가 없다 → 비밀번호 로그인을 쓰려면
//      Supabase Auth 대시보드에서 비밀번호를 설정해야 한다(handover "활성화 절차" 참조).
//   미주입 시: 빈 storageState 만 생성하고 READY 마커를 만들지 않아 AD1 은 graceful skip 된다
//   (자격 주입 + 비밀번호 설정 시 자동 활성).

const AUTH_DIR = path.join(__dirname, ".auth");
const AUTH_FILE = path.join(AUTH_DIR, "admin.json");
// 진짜 인증 성공 시에만 생성하는 마커 — AD1 활성 조건. (admin.json 존재 ≠ 인증됨)
const READY_FILE = path.join(AUTH_DIR, "admin.ready");

// admin 프로젝트가 storageState 파일을 항상 읽을 수 있도록 두는 빈(비인증) 상태
const EMPTY_STATE = JSON.stringify({ cookies: [], origins: [] });

setup("관리자 인증 storageState 캡처", async () => {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

  fs.mkdirSync(AUTH_DIR, { recursive: true });
  // 이전 실행의 READY 마커 잔여 제거 — 이번 실행 결과로만 활성 판단
  if (fs.existsSync(READY_FILE)) fs.rmSync(READY_FILE);
  // 빈 상태 선기록(admin 프로젝트 컨텍스트 생성 시 ENOENT 방지)
  fs.writeFileSync(AUTH_FILE, EMPTY_STATE);

  // 자격증명 부재 → graceful: 빈 상태 유지, READY 미생성 → AD1 skip
  if (!email || !password) {
    console.warn(
      "[auth.setup] 관리자 자격증명 미주입(E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD) — " +
        "빈 storageState 생성, AD1 비활성 유지"
    );
    return;
  }
  if (!url || !anon) {
    console.warn(
      "[auth.setup] Supabase 환경변수 미주입(NEXT_PUBLIC_SUPABASE_URL/ANON_KEY) — AD1 비활성 유지"
    );
    return;
  }

  // 앱과 동일한 @supabase/ssr 로 로그인 → setAll 콜백으로 인증 쿠키를 캡처(메모리 jar)
  const jar = new Map<string, string>();
  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll: () => Array.from(jar, ([name, value]) => ({ name, value })),
      setAll: (toSet) => toSet.forEach(({ name, value }) => jar.set(name, value)),
    },
  });

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  // 자격증명을 명시 주입했는데 로그인 실패 = 활성 의도가 분명한 오설정 → 표면화(throw).
  //   (admin 프로젝트는 setup 의존이라 setup 실패 시 AD1 은 실행되지 않는다 — 비인증 chromium 29건은 무관)
  expect(
    error,
    `관리자 로그인 실패: ${error?.message ?? ""}. ` +
      "로그인 폼이 Google OAuth 전용이라 비밀번호 로그인은 관리자 계정에 비밀번호가 설정돼 있어야 한다 " +
      "(Supabase Auth 대시보드). handover '활성화 절차' 참조."
  ).toBeNull();
  expect(data.user?.email, "로그인 사용자 이메일이 관리자와 일치").toBe(email);
  expect(jar.size, "인증 쿠키가 캡처됨").toBeGreaterThan(0);

  // 캡처 쿠키를 baseURL 도메인에 부착한 storageState 작성
  const { hostname, protocol } = new URL(baseURL);
  // 세션 쿠키는 storageState 직렬화에서 누락될 수 있어 만료를 미래(7일)로 고정
  const expires = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7;
  const cookies = Array.from(jar, ([name, value]) => ({
    name,
    value,
    domain: hostname,
    path: "/",
    expires,
    httpOnly: false,
    secure: protocol === "https:",
    sameSite: "Lax" as const,
  }));
  fs.writeFileSync(AUTH_FILE, JSON.stringify({ cookies, origins: [] }, null, 2));
  fs.writeFileSync(READY_FILE, new Date().toISOString());
  console.log(
    `[auth.setup] 관리자 storageState 저장 완료 (${cookies.length} cookies, ${email}) — AD1 활성`
  );
});
