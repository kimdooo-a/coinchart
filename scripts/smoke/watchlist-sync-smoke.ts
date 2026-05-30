/**
 * scripts/smoke/watchlist-sync-smoke.ts
 *
 * R14 / T04 — watchlist 회원 동기화 DB 레이어 스모크 검증.
 *
 * R12(세션 38·39)에서 구축한 user_watchlist(회원 즐겨찾기 동기화)의 **DB 계약**이
 * 운영 DB에 정상 적용·동작하는지 자격증명 없이(service_role) 검증한다.
 *
 * ⚠️ 본 스크립트는 "DB 레이어"만 검증한다. 실제 앱 흐름
 *    (익명 localStorage → 로그인 시 /api/watchlist/sync → 다른 기기 복원)은
 *    회원 브라우저 로그인이 필요하므로 이 스크립트로 대체할 수 없다.
 *    그 부분은 절차서 docs/db/R14-watchlist-sync-smoke.md (§3·§5)가 사람에게 위임한다.
 *
 * 검증 항목:
 *   [dry-run · 기본 / 읽기 전용]
 *     (1) 테이블 user_watchlist 존재·SELECT 가능
 *     (2) 컬럼 계약 — asset_type/symbol/sort_order/created_at/user_id/id 선택 가능
 *     (3) 현재 행 수(head count) 보고
 *     (4) RLS — anon 키 클라이언트의 비로그인 SELECT가 0행(RLS 차단) — anon 키 있을 때만
 *   [--write / 라운드트립]
 *     (5) INSERT → SELECT → 중복 INSERT(UNIQUE 충돌·멱등) → reorder UPDATE → DELETE 라운드트립
 *         service_role로 수행하여 DB CRUD·제약이 정상인지 확인. 자기 생성 행은 즉시 정리(잔여 0).
 *
 * 사용:
 *   npx tsx scripts/smoke/watchlist-sync-smoke.ts                 # 읽기 전용(기본)
 *   npx tsx scripts/smoke/watchlist-sync-smoke.ts --dry-run       # 동일(명시)
 *   npx tsx scripts/smoke/watchlist-sync-smoke.ts --write         # 라운드트립(auth.users 첫 사용자 자동 선택)
 *   npx tsx scripts/smoke/watchlist-sync-smoke.ts --write --user-id=<uuid>   # 특정 사용자 지정
 *
 * 환경변수 (.env.local — community-like-smoke.ts 와 동일 패턴):
 *   NEXT_PUBLIC_SUPABASE_URL          (필수)
 *   SUPABASE_SERVICE_ROLE_KEY         (필수)
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY     (선택 — RLS 차단 검증용. 없으면 (4) SKIP)
 *
 * 종료 코드:
 *   0 = 전 항목 PASS (데이터·사용자 부재로 일부 SKIP 포함 가능)
 *   1 = 객체 누락(마이그레이션 미적용) 또는 라운드트립 계약 불일치
 *
 * 보안: service_role 키·자격증명을 로그에 절대 출력하지 않는다.
 *       --write는 합성 심볼(SMOKE-...) 행만 만들고 같은 실행 내에서 정리한다.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "[smoke] 환경변수 누락: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (.env.local 확인)",
  );
  process.exit(1);
}

// ---- CLI 인자 파싱 ----
const argv = process.argv.slice(2);
const WRITE = argv.includes("--write");
// --dry-run은 기본값. --write가 없으면 무조건 읽기 전용.
const userIdArg = argv.find((a) => a.startsWith("--user-id="))?.split("=")[1]?.trim();

const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// 합성 심볼 — 실데이터와 충돌하지 않으며 종료 시 정리 대상. symbol CHECK·길이(≤32) 만족.
const SYNTH_SYMBOL = `SMOKE${Date.now().toString(36).toUpperCase()}`.slice(0, 32);
const SYNTH_ASSET = "CRYPTO" as const;

type Status = "PASS" | "FAIL" | "SKIP";
interface CheckResult {
  name: string;
  status: Status;
  detail: string;
}
const results: CheckResult[] = [];

interface PgErrorLike {
  code?: string;
  message?: string;
}

/**
 * "객체(테이블/컬럼)가 없음" 류의 오류인지 판별.
 * PostgREST 스키마 캐시 오류(PGRST20x) + Postgres undefined_table/column(42P01/42703) 커버.
 */
function isMissingObject(err: PgErrorLike | null | undefined): boolean {
  if (!err) return false;
  const code = err.code ?? "";
  const msg = (err.message ?? "").toLowerCase();
  return (
    code === "PGRST202" ||
    code === "PGRST204" ||
    code === "PGRST205" ||
    code === "42P01" ||
    code === "42703" ||
    msg.includes("could not find the table") ||
    msg.includes("could not find the") ||
    msg.includes("does not exist") ||
    msg.includes("schema cache")
  );
}

function record(name: string, status: Status, detail: string): void {
  results.push({ name, status, detail });
  const icon = status === "PASS" ? "✅" : status === "FAIL" ? "❌" : "⚠️ ";
  console.log(`${icon} [${status}] ${name} — ${detail}`);
}

// ---------------------------------------------
// (1)(2)(3) 테이블 존재·컬럼 계약·행 수
// ---------------------------------------------
async function checkTableAndColumns(): Promise<void> {
  const name = "테이블 user_watchlist (존재·컬럼)";

  // SSOT(lib/supabase/watchlist.ts)·스키마 레퍼런스가 의존하는 컬럼 전체를 명시 SELECT.
  // 컬럼이 하나라도 없으면 PostgREST가 42703/스키마 캐시 오류를 던진다.
  const { error } = await supabase
    .from("user_watchlist")
    .select("id, user_id, asset_type, symbol, sort_order, created_at")
    .limit(1);

  if (error) {
    record(
      name,
      "FAIL",
      isMissingObject(error)
        ? `테이블/컬럼 미존재 (마이그레이션 20260529000001 미적용): ${error.code ?? error.message}`
        : `SELECT 오류: ${error.message}`,
    );
    return;
  }
  record(name, "PASS", "SELECT id·user_id·asset_type·symbol·sort_order·created_at 가능 (컬럼 계약 일치)");

  // (3) 행 수 (head count)
  const { count, error: cErr } = await supabase
    .from("user_watchlist")
    .select("id", { count: "exact", head: true });
  if (cErr) {
    record("행 수(head count)", "SKIP", `count 조회 오류: ${cErr.message}`);
    return;
  }
  record("행 수(head count)", "PASS", `현재 user_watchlist 행 수 = ${count ?? 0}`);
}

// ---------------------------------------------
// (4) RLS — anon 비로그인 SELECT는 0행이어야 함
// ---------------------------------------------
async function checkRlsBlocksAnon(): Promise<void> {
  const name = "RLS — anon 비로그인 SELECT 차단";
  if (!SUPABASE_ANON_KEY) {
    record(name, "SKIP", "NEXT_PUBLIC_SUPABASE_ANON_KEY 미설정 — RLS 차단 검증 생략");
    return;
  }
  const anon = createClient(SUPABASE_URL as string, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await anon
    .from("user_watchlist")
    .select("id")
    .limit(5);

  // RLS가 켜져 있고 SELECT 정책이 auth.uid()=user_id면, 세션 없는 anon은 0행을 받는다(오류 아님).
  if (error) {
    // 일부 설정에서 RLS가 권한 오류로 표면화될 수 있음 — 그래도 "노출 안 됨"이므로 PASS 처리.
    record(name, "PASS", `anon SELECT 차단(오류 반환): ${error.code ?? error.message}`);
    return;
  }
  if ((data?.length ?? 0) === 0) {
    record(name, "PASS", "anon 비로그인 SELECT = 0행 (RLS가 타인 행 비노출)");
  } else {
    record(
      name,
      "FAIL",
      `anon 비로그인 SELECT가 ${data?.length}행 노출 — RLS SELECT 정책 점검 필요(개인정보 누출 위험)`,
    );
  }
}

// ---------------------------------------------
// (5) --write 라운드트립: INSERT→SELECT→중복→UPDATE→DELETE
// ---------------------------------------------
async function resolveUserId(): Promise<string | null> {
  if (userIdArg) return userIdArg;
  // auth.users는 PostgREST로 직접 조회 불가 → service_role admin API로 첫 사용자 선택.
  try {
    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (error) {
      record("사용자 해석", "SKIP", `auth admin listUsers 오류: ${error.message}`);
      return null;
    }
    const u = data.users[0];
    if (!u) {
      record("사용자 해석", "SKIP", "auth.users에 사용자 없음 — 라운드트립 생략(테스트 계정 가입 필요)");
      return null;
    }
    return u.id;
  } catch (err) {
    record("사용자 해석", "SKIP", `auth admin 접근 실패: ${(err as Error).message}`);
    return null;
  }
}

async function checkRoundTrip(): Promise<void> {
  const name = "라운드트립 INSERT→SELECT→UPDATE→DELETE";
  const userId = await resolveUserId();
  if (!userId) {
    record(name, "SKIP", "유효 user_id 없음 — DB 라운드트립 생략");
    return;
  }
  // user_id는 로그에 노출하지 않는다(짧은 마스킹만).
  const mask = `${userId.slice(0, 8)}…`;

  // 선제 정리(이전 실패 잔여 대비)
  await supabase
    .from("user_watchlist")
    .delete()
    .eq("user_id", userId)
    .eq("asset_type", SYNTH_ASSET)
    .eq("symbol", SYNTH_SYMBOL);

  // 1) INSERT
  const { data: ins, error: insErr } = await supabase
    .from("user_watchlist")
    .insert({ user_id: userId, asset_type: SYNTH_ASSET, symbol: SYNTH_SYMBOL, sort_order: 0 })
    .select("id, sort_order")
    .single();

  if (insErr || !ins) {
    // FK 위반(가짜 user-id) 등은 여기서 드러난다.
    record(
      name,
      "FAIL",
      isMissingObject(insErr)
        ? `테이블 미존재: ${insErr?.code ?? insErr?.message}`
        : `INSERT 실패(user=${mask}): ${insErr?.code ?? ""} ${insErr?.message ?? "행 없음"}`,
    );
    return;
  }
  const rowId = ins.id as string;

  // 2) SELECT 확인
  const { data: sel, error: selErr } = await supabase
    .from("user_watchlist")
    .select("asset_type, symbol, sort_order")
    .eq("id", rowId)
    .single();
  if (selErr || !sel || sel.symbol !== SYNTH_SYMBOL) {
    await supabase.from("user_watchlist").delete().eq("id", rowId);
    record(name, "FAIL", `INSERT 후 SELECT 불일치: ${selErr?.message ?? JSON.stringify(sel)}`);
    return;
  }

  // 3) 중복 INSERT → UNIQUE(user_id,asset_type,symbol) 충돌이어야 함(sync의 ON CONFLICT 계약 근거)
  const { error: dupErr } = await supabase
    .from("user_watchlist")
    .insert({ user_id: userId, asset_type: SYNTH_ASSET, symbol: SYNTH_SYMBOL, sort_order: 1 });
  const dupConflict = dupErr?.code === "23505" || (dupErr?.message ?? "").toLowerCase().includes("duplicate");
  if (!dupErr) {
    // 충돌이 안 났으면 UNIQUE 제약 부재 — 멱등 머지 계약 위반
    await supabase
      .from("user_watchlist")
      .delete()
      .eq("user_id", userId)
      .eq("asset_type", SYNTH_ASSET)
      .eq("symbol", SYNTH_SYMBOL);
    record(name, "FAIL", "중복 INSERT가 충돌하지 않음 — UNIQUE(user_id,asset_type,symbol) 제약 부재 의심");
    return;
  }
  if (!dupConflict) {
    await supabase.from("user_watchlist").delete().eq("id", rowId);
    record(name, "FAIL", `중복 INSERT가 UNIQUE 외 오류로 실패: ${dupErr?.code} ${dupErr?.message}`);
    return;
  }

  // 4) reorder UPDATE (sort_order 변경)
  const { error: updErr } = await supabase
    .from("user_watchlist")
    .update({ sort_order: 99 })
    .eq("id", rowId);
  const { data: updRow } = await supabase
    .from("user_watchlist")
    .select("sort_order")
    .eq("id", rowId)
    .single();
  if (updErr || Number(updRow?.sort_order) !== 99) {
    await supabase.from("user_watchlist").delete().eq("id", rowId);
    record(name, "FAIL", `reorder UPDATE 실패: ${updErr?.message ?? `sort_order=${updRow?.sort_order}`}`);
    return;
  }

  // 5) DELETE + 잔여 확인
  const { error: delErr } = await supabase.from("user_watchlist").delete().eq("id", rowId);
  const { count: residual } = await supabase
    .from("user_watchlist")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("asset_type", SYNTH_ASSET)
    .eq("symbol", SYNTH_SYMBOL);

  if (delErr || (residual ?? 0) !== 0) {
    record(name, "FAIL", `DELETE 실패/잔여 ${residual}행: ${delErr?.message ?? ""}`);
    return;
  }

  record(
    name,
    "PASS",
    `user=${mask} INSERT→SELECT→중복충돌(UNIQUE)→reorder(0→99)→DELETE 정상, 잔여 0행`,
  );
}

// ---------------------------------------------
// 안전망 정리: 합성 심볼 잔여 행 제거(모든 사용자 대상 — 합성 심볼은 고유)
// ---------------------------------------------
async function cleanup(): Promise<void> {
  await supabase
    .from("user_watchlist")
    .delete()
    .eq("asset_type", SYNTH_ASSET)
    .eq("symbol", SYNTH_SYMBOL);
}

async function main(): Promise<void> {
  console.log(
    `[smoke] watchlist DB 레이어 스모크 시작 (mode=${WRITE ? "WRITE 라운드트립" : "DRY-RUN 읽기전용"})\n`,
  );

  await checkTableAndColumns();
  await checkRlsBlocksAnon();

  if (WRITE) {
    await checkRoundTrip();
    await cleanup().catch((err) => console.warn("[smoke] cleanup 경고:", err));
  } else {
    record(
      "라운드트립",
      "SKIP",
      "DRY-RUN(기본) — 쓰기 검증 생략. 활성화: --write [--user-id=<uuid>]",
    );
  }

  const failed = results.filter((r) => r.status === "FAIL");
  const skipped = results.filter((r) => r.status === "SKIP");
  const passed = results.filter((r) => r.status === "PASS");

  console.log(
    `\n[smoke] 결과: PASS ${passed.length} / SKIP ${skipped.length} / FAIL ${failed.length}`,
  );

  console.log(
    "\n[smoke] 주의: 본 스크립트는 DB 레이어(테이블·컬럼·제약·CRUD)만 검증합니다.",
  );
  console.log(
    "[smoke] 실 회원 로그인→/api/watchlist/sync→타 기기 복원 흐름은 절차서로 위임:",
  );
  console.log("[smoke]   docs/db/R14-watchlist-sync-smoke.md (§3·§5)");

  if (failed.length > 0) {
    console.error("\n[smoke] ❌ 실패 — 마이그레이션 미적용이거나 DB 계약 불일치:");
    for (const f of failed) console.error(`  - ${f.name}: ${f.detail}`);
    process.exit(1);
  }

  if (skipped.length > 0) {
    console.warn("\n[smoke] ⚠️  일부 SKIP — 객체는 존재하나 검증 데이터/사용자가 부족합니다.");
  }
  console.log("\n[smoke] ✅ DB 레이어 계약 정상.");
  process.exit(0);
}

main().catch((err) => {
  console.error("[smoke] 예외:", err);
  process.exit(1);
});
