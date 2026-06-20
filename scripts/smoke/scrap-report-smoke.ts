/**
 * scripts/smoke/scrap-report-smoke.ts
 *
 * R-B — 스크랩(community_post_scraps)·신고(community_reports) DB 계약 스모크 검증.
 *
 * 마이그레이션 20260614000001_create_scraps_reports.sql 적용 후 1회 실행하여
 * 두 테이블의 insert/dedup/delete 라운드트립이 정상인지 service_role 로 확인한다.
 *
 * ⚠️ 본 스크립트는 DB 레이어(테이블·컬럼·UNIQUE 제약·CRUD)만 검증한다.
 *    실 회원 인증·API 흐름(/api/community/scraps, /api/community/reports)은
 *    별도 E2E 테스트에서 검증한다.
 *
 * 검증 항목:
 *   [dry-run · 기본 / 읽기 전용]
 *     (1) 테이블 community_post_scraps 존재·컬럼 SELECT 가능
 *     (2) 테이블 community_reports 존재·컬럼 SELECT 가능
 *   [--write / 라운드트립]
 *     (3) scrap: 기존 user_id + post_id로 INSERT → UNIQUE(user_id,post_id) 중복 충돌(23505) → DELETE → 잔여 0
 *     (4) report: 합성 reporter_ip_hash(SMOKE_...)로 INSERT → 동일 재INSERT 23505 충돌 → status UPDATE('reviewed') → DELETE → 잔여 0
 *
 * FK 제약 처리:
 *   - community_post_scraps.user_id → auth.users: auth.admin.listUsers로 실존 user_id 확보
 *   - community_post_scraps.post_id → community_posts: community_posts에서 첫 행 id SELECT
 *   - community_reports.target_id: FK 없음(자유 UUID) — 합성 UUID 사용 가능
 *
 * 사용:
 *   npx tsx scripts/smoke/scrap-report-smoke.ts              # 읽기 전용(기본)
 *   npx tsx scripts/smoke/scrap-report-smoke.ts --dry-run    # 동일(명시)
 *   npx tsx scripts/smoke/scrap-report-smoke.ts --write      # 라운드트립
 *   npx tsx scripts/smoke/scrap-report-smoke.ts --write --user-id=<uuid>  # 특정 user_id 지정
 *   npx tsx scripts/smoke/scrap-report-smoke.ts --write --post-id=<uuid>  # 특정 post_id 지정
 *
 * 환경변수 (.env.local):
 *   NEXT_PUBLIC_SUPABASE_URL          (필수)
 *   SUPABASE_SERVICE_ROLE_KEY         (필수)
 *   없으면 graceful skip(exit 0).
 *
 * 종료 코드:
 *   0 = 전 항목 PASS (데이터·사용자 부재로 일부 SKIP 포함 가능)
 *   1 = 객체 누락(마이그레이션 미적용) 또는 라운드트립 계약 불일치
 *
 * 보안: service_role 키·자격증명을 로그에 절대 출력하지 않는다.
 *       --write는 합성 접두사(SMOKE_...) 행만 만들고 같은 실행 내에서 정리한다.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    "[smoke] 환경변수 누락: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (.env.local 확인) — graceful skip",
  );
  process.exit(0);
}

// ---- CLI 인자 파싱 ----
const argv = process.argv.slice(2);
const WRITE = argv.includes("--write");
const userIdArg = argv.find((a) => a.startsWith("--user-id="))?.split("=")[1]?.trim();
const postIdArg = argv.find((a) => a.startsWith("--post-id="))?.split("=")[1]?.trim();

const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// 합성 신고자 IP 해시 — 실데이터와 충돌하지 않으며 종료 시 정리 대상
const SYNTH_IP_HASH = `SMOKE_REPORT_${Date.now().toString(36).toUpperCase()}`;
// 합성 target_id — community_reports.target_id 는 FK 없음, 자유 UUID 사용 가능
const SYNTH_TARGET_ID = "00000000-0000-4000-b000-000000000099";

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
// (1) 테이블 community_post_scraps 존재·컬럼
// ---------------------------------------------
async function checkScrapsTable(): Promise<void> {
  const name = "테이블 community_post_scraps (존재·컬럼)";
  const { error } = await supabase
    .from("community_post_scraps")
    .select("id, user_id, post_id, created_at")
    .limit(1);

  if (error) {
    record(
      name,
      "FAIL",
      isMissingObject(error)
        ? `테이블/컬럼 미존재 (마이그레이션 20260614000001 미적용): ${error.code ?? error.message}`
        : `SELECT 오류: ${error.message}`,
    );
    return;
  }
  record(name, "PASS", "SELECT id·user_id·post_id·created_at 가능 (컬럼 계약 일치)");

  // 행 수(head count)
  const { count, error: cErr } = await supabase
    .from("community_post_scraps")
    .select("id", { count: "exact", head: true });
  if (cErr) {
    record("행 수 — community_post_scraps", "SKIP", `count 조회 오류: ${cErr.message}`);
    return;
  }
  record("행 수 — community_post_scraps", "PASS", `현재 community_post_scraps 행 수 = ${count ?? 0}`);
}

// ---------------------------------------------
// (2) 테이블 community_reports 존재·컬럼
// ---------------------------------------------
async function checkReportsTable(): Promise<void> {
  const name = "테이블 community_reports (존재·컬럼)";
  const { error } = await supabase
    .from("community_reports")
    .select("id, target_type, target_id, reason, detail, reporter_user_id, reporter_ip_hash, status, created_at")
    .limit(1);

  if (error) {
    record(
      name,
      "FAIL",
      isMissingObject(error)
        ? `테이블/컬럼 미존재 (마이그레이션 20260614000001 미적용): ${error.code ?? error.message}`
        : `SELECT 오류: ${error.message}`,
    );
    return;
  }
  record(name, "PASS", "SELECT 전 컬럼 가능 (컬럼 계약 일치)");

  // 행 수(head count)
  const { count, error: cErr } = await supabase
    .from("community_reports")
    .select("id", { count: "exact", head: true });
  if (cErr) {
    record("행 수 — community_reports", "SKIP", `count 조회 오류: ${cErr.message}`);
    return;
  }
  record("행 수 — community_reports", "PASS", `현재 community_reports 행 수 = ${count ?? 0}`);
}

// ---------------------------------------------
// FK 대상 확보: user_id (auth.users 첫 사용자)
// ---------------------------------------------
async function resolveUserId(): Promise<string | null> {
  if (userIdArg) return userIdArg;
  try {
    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (error) {
      record("user_id 확보", "SKIP", `auth admin listUsers 오류: ${error.message}`);
      return null;
    }
    const u = data.users[0];
    if (!u) {
      record("user_id 확보", "SKIP", "auth.users 에 사용자 없음 — 스크랩 라운드트립 생략 (테스트 계정 가입 필요)");
      return null;
    }
    return u.id;
  } catch (err) {
    record("user_id 확보", "SKIP", `auth admin 접근 실패: ${(err as Error).message}`);
    return null;
  }
}

// ---------------------------------------------
// FK 대상 확보: post_id (community_posts 첫 행)
// ---------------------------------------------
async function resolvePostId(): Promise<string | null> {
  if (postIdArg) return postIdArg;
  const { data, error } = await supabase
    .from("community_posts")
    .select("id")
    .limit(1)
    .single();
  if (error || !data) {
    record(
      "post_id 확보",
      "SKIP",
      `community_posts 첫 행 조회 실패 — 스크랩 라운드트립 생략: ${error?.message ?? "행 없음"}`,
    );
    return null;
  }
  return data.id as string;
}

// ---------------------------------------------
// (3) scrap 라운드트립: INSERT → UNIQUE 충돌 → DELETE → 잔여 0
// ---------------------------------------------
async function checkScrapRoundTrip(): Promise<void> {
  const name = "scrap 라운드트립 INSERT→중복충돌(UNIQUE)→DELETE";

  const userId = await resolveUserId();
  if (!userId) {
    record(name, "SKIP", "유효 user_id 없음 — scrap 라운드트립 생략");
    return;
  }
  const postId = await resolvePostId();
  if (!postId) {
    record(name, "SKIP", "유효 post_id 없음 — scrap 라운드트립 생략");
    return;
  }

  const userMask = `${userId.slice(0, 8)}…`;
  const postMask = `${postId.slice(0, 8)}…`;

  // 선제 정리 (이전 실패 잔여 대비)
  await supabase
    .from("community_post_scraps")
    .delete()
    .eq("user_id", userId)
    .eq("post_id", postId);

  // 1) INSERT
  const { data: ins, error: insErr } = await supabase
    .from("community_post_scraps")
    .insert({ user_id: userId, post_id: postId })
    .select("id")
    .single();

  if (insErr || !ins) {
    record(
      name,
      "FAIL",
      isMissingObject(insErr)
        ? `테이블 미존재: ${insErr?.code ?? insErr?.message}`
        : `INSERT 실패 (user=${userMask}, post=${postMask}): ${insErr?.code ?? ""} ${insErr?.message ?? "행 없음"}`,
    );
    return;
  }
  const rowId = ins.id as string;

  // 2) 중복 INSERT → UNIQUE(user_id,post_id) 충돌이어야 함
  const { error: dupErr } = await supabase
    .from("community_post_scraps")
    .insert({ user_id: userId, post_id: postId });
  const dupConflict =
    dupErr?.code === "23505" || (dupErr?.message ?? "").toLowerCase().includes("duplicate");
  if (!dupErr) {
    // 충돌이 안 났으면 UNIQUE 제약 부재
    await supabase
      .from("community_post_scraps")
      .delete()
      .eq("user_id", userId)
      .eq("post_id", postId);
    record(name, "FAIL", "중복 INSERT가 충돌하지 않음 — UNIQUE(user_id,post_id) 제약 부재 의심");
    return;
  }
  if (!dupConflict) {
    await supabase.from("community_post_scraps").delete().eq("id", rowId);
    record(name, "FAIL", `중복 INSERT가 UNIQUE 외 오류로 실패: ${dupErr?.code} ${dupErr?.message}`);
    return;
  }

  // 3) DELETE + 잔여 확인
  const { error: delErr } = await supabase.from("community_post_scraps").delete().eq("id", rowId);
  const { count: residual } = await supabase
    .from("community_post_scraps")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("post_id", postId);

  if (delErr || (residual ?? 0) !== 0) {
    record(name, "FAIL", `DELETE 실패/잔여 ${residual}행: ${delErr?.message ?? ""}`);
    return;
  }

  record(
    name,
    "PASS",
    `user=${userMask} post=${postMask} INSERT→UNIQUE충돌(23505)→DELETE 정상, 잔여 0행`,
  );
}

// ---------------------------------------------
// (4) report 라운드트립: INSERT → UNIQUE 충돌 → status UPDATE → DELETE → 잔여 0
// ---------------------------------------------
async function checkReportRoundTrip(): Promise<void> {
  const name = "report 라운드트립 INSERT→중복충돌(23505)→status UPDATE→DELETE";

  // 선제 정리 (이전 실패 잔여 대비)
  await supabase
    .from("community_reports")
    .delete()
    .eq("reporter_ip_hash", SYNTH_IP_HASH);

  // 1) INSERT
  const { data: ins, error: insErr } = await supabase
    .from("community_reports")
    .insert({
      target_type: "post",
      target_id: SYNTH_TARGET_ID,
      reason: "spam",
      reporter_ip_hash: SYNTH_IP_HASH,
    })
    .select("id, status")
    .single();

  if (insErr || !ins) {
    record(
      name,
      "FAIL",
      isMissingObject(insErr)
        ? `테이블 미존재: ${insErr?.code ?? insErr?.message}`
        : `INSERT 실패: ${insErr?.code ?? ""} ${insErr?.message ?? "행 없음"}`,
    );
    return;
  }
  const rowId = ins.id as string;

  // 2) 동일 (target_type, target_id, reporter_ip_hash) 재INSERT → uniq_reports_iphash 위반(23505)
  const { error: dupErr } = await supabase
    .from("community_reports")
    .insert({
      target_type: "post",
      target_id: SYNTH_TARGET_ID,
      reason: "abuse",
      reporter_ip_hash: SYNTH_IP_HASH,
    });
  const dupConflict =
    dupErr?.code === "23505" || (dupErr?.message ?? "").toLowerCase().includes("duplicate");
  if (!dupErr) {
    await supabase.from("community_reports").delete().eq("reporter_ip_hash", SYNTH_IP_HASH);
    record(name, "FAIL", "중복 INSERT가 충돌하지 않음 — uniq_reports_iphash 부분 인덱스 부재 의심");
    return;
  }
  if (!dupConflict) {
    await supabase.from("community_reports").delete().eq("id", rowId);
    record(name, "FAIL", `중복 INSERT가 UNIQUE 외 오류로 실패: ${dupErr?.code} ${dupErr?.message}`);
    return;
  }

  // 3) status UPDATE('reviewed') 확인
  const { error: updErr } = await supabase
    .from("community_reports")
    .update({ status: "reviewed" })
    .eq("id", rowId);
  const { data: updRow, error: selErr } = await supabase
    .from("community_reports")
    .select("status")
    .eq("id", rowId)
    .single();
  if (updErr || selErr || updRow?.status !== "reviewed") {
    await supabase.from("community_reports").delete().eq("id", rowId);
    record(
      name,
      "FAIL",
      `status UPDATE 'reviewed' 실패: ${updErr?.message ?? selErr?.message ?? `status=${updRow?.status}`}`,
    );
    return;
  }

  // 4) DELETE + 잔여 확인
  const { error: delErr } = await supabase.from("community_reports").delete().eq("id", rowId);
  const { count: residual } = await supabase
    .from("community_reports")
    .select("id", { count: "exact", head: true })
    .eq("reporter_ip_hash", SYNTH_IP_HASH);

  if (delErr || (residual ?? 0) !== 0) {
    record(name, "FAIL", `DELETE 실패/잔여 ${residual}행: ${delErr?.message ?? ""}`);
    return;
  }

  record(
    name,
    "PASS",
    `ip_hash=${SYNTH_IP_HASH} INSERT→중복충돌(23505)→status UPDATE('reviewed')→DELETE 정상, 잔여 0행`,
  );
}

// ---------------------------------------------
// 안전망 정리: 합성 데이터 잔여 행 제거
// ---------------------------------------------
async function cleanup(): Promise<void> {
  await supabase
    .from("community_reports")
    .delete()
    .eq("reporter_ip_hash", SYNTH_IP_HASH);
  // community_post_scraps 합성 행은 resolveUserId/resolvePostId 결과에 따라
  // checkScrapRoundTrip 내부에서 이미 정리되므로 여기서는 reports만 재차 정리.
}

async function main(): Promise<void> {
  console.log(
    `[smoke] scrap·report DB 레이어 스모크 시작 (mode=${WRITE ? "WRITE 라운드트립" : "DRY-RUN 읽기전용"})\n`,
  );

  await checkScrapsTable();
  await checkReportsTable();

  if (WRITE) {
    await checkScrapRoundTrip();
    await checkReportRoundTrip();
    await cleanup().catch((err) => console.warn("[smoke] cleanup 경고:", err));
  } else {
    record(
      "라운드트립 (scrap·report)",
      "SKIP",
      "DRY-RUN(기본) — 쓰기 검증 생략. 활성화: --write [--user-id=<uuid>] [--post-id=<uuid>]",
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
    "[smoke] 실 회원 로그인→/api/community/scraps·reports 흐름은 별도 E2E에서 검증하세요.",
  );

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
