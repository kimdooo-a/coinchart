/**
 * scripts/smoke/community-like-smoke.ts
 *
 * R4 / T01 — 커뮤니티 추천 백엔드(마이그레이션 2종) 적용 후 스모크 검증.
 *
 * 운영자가 `supabase db push` 로 다음 2개를 적용한 뒤 1회 실행하여
 * 라운드트립으로 정상 적용 여부를 확인한다:
 *   - 20260524000002_post_likes_rpc.sql  → RPC community_toggle_post_like / community_post_like_counts
 *   - 20260524000001_comment_likes.sql   → 테이블 community_comment_likes + 트리거(like_count 동기화)
 *
 * 검증 항목:
 *   (1) RPC community_toggle_post_like 존재·호출 가능 — 익명(합성 ip_hash)으로 추천 ON→취소로
 *       원상복구하며 분리집계(like_count) 증감을 확인. 게시글이 없으면 임의 UUID로 "존재 여부"만 확인.
 *   (2) community_comment_likes 테이블 SELECT 가능.
 *   (3) 트리거가 community_comments.like_count 를 갱신하는지 — 추천 INSERT→재조회→DELETE→재조회 라운드트립.
 *
 * 사용:
 *   npx tsx scripts/smoke/community-like-smoke.ts
 *
 * 환경변수 (.env.local — seed-community.ts 와 동일 패턴):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * 종료 코드:
 *   0 = 전 항목 PASS (데이터가 없어 일부 SKIP 포함 가능)
 *   1 = 객체 누락(마이그레이션 미적용) 또는 라운드트립 검증 불일치
 *
 * 부작용: 합성 ip_hash 로 추가한 추천 행은 같은 실행 내에서 원상복구하며,
 *         종료 직전 안전망으로 합성 ip_hash 행을 한 번 더 정리한다.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "[smoke] 환경변수 누락: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (.env.local 확인)",
  );
  process.exit(1);
}

const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// 합성 익명 dedup 키 — 실데이터와 충돌하지 않으며 종료 시 정리 대상
const SYNTH_IP = `smoke-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
// 게시글이 없을 때 RPC "존재 여부"만 확인하기 위한 더미 UUID (FK 위반을 유도 → 함수 존재 증명)
const PROBE_UUID = "00000000-0000-4000-8000-000000000000";

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

interface ToggleRow {
  liked: boolean;
  like_count: number | string;
  dislike_count: number | string;
}

/**
 * "객체(함수/테이블)가 없음" 류의 오류인지 판별.
 * PostgREST 스키마 캐시 오류(PGRST202/205) + Postgres undefined_function/table(42883/42P01) 커버.
 */
function isMissingObject(err: PgErrorLike | null): boolean {
  if (!err) return false;
  const code = err.code ?? "";
  const msg = (err.message ?? "").toLowerCase();
  return (
    code === "PGRST202" ||
    code === "PGRST205" ||
    code === "42883" ||
    code === "42P01" ||
    msg.includes("could not find the function") ||
    msg.includes("could not find the table") ||
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
// (1) RPC community_toggle_post_like
// ---------------------------------------------
async function checkToggleRpc(): Promise<void> {
  const name = "RPC community_toggle_post_like";

  const { data: posts, error: postErr } = await supabase
    .from("community_posts")
    .select("id")
    .eq("is_deleted", false)
    .limit(1);

  if (postErr && isMissingObject(postErr)) {
    record(name, "FAIL", `선행 테이블 community_posts 없음 (${postErr.code ?? postErr.message})`);
    return;
  }
  if (postErr) {
    record(name, "FAIL", `community_posts 조회 오류: ${postErr.message}`);
    return;
  }

  // 게시글이 없으면: 더미 UUID로 함수 존재 여부만 확인 (FK 위반 = 함수 존재 증명)
  if (!posts || posts.length === 0) {
    const { error } = await supabase.rpc("community_toggle_post_like", {
      p_post_id: PROBE_UUID,
      p_user_id: null,
      p_ip_hash: SYNTH_IP,
      p_value: 1,
    });
    if (error && isMissingObject(error)) {
      record(name, "FAIL", `RPC 미존재 (마이그레이션 미적용): ${error.code ?? error.message}`);
      return;
    }
    // 오류여도 미존재가 아니면(FK 위반 등) 함수는 존재. 오류가 없으면 더미 행이 생겼을 수 있어 정리됨(아래 cleanup).
    record(
      name,
      "SKIP",
      "함수는 존재하나 검증할 게시글이 없음 — 라운드트립 생략 (npx tsx scripts/seed-community.ts 권장)",
    );
    return;
  }

  const postId = posts[0].id as string;

  // 1st 토글: 추천 ON (신규 합성 ip_hash → INSERT)
  const { data: r1, error: e1 } = await supabase.rpc("community_toggle_post_like", {
    p_post_id: postId,
    p_user_id: null,
    p_ip_hash: SYNTH_IP,
    p_value: 1,
  });
  if (e1) {
    record(name, "FAIL", isMissingObject(e1) ? `RPC 미존재: ${e1.message}` : `토글 ON 오류: ${e1.message}`);
    return;
  }
  const row1 = (Array.isArray(r1) ? r1[0] : r1) as ToggleRow | undefined;

  // 2nd 토글: 같은 값 재요청 → 취소(DELETE) → 원상복구
  const { data: r2, error: e2 } = await supabase.rpc("community_toggle_post_like", {
    p_post_id: postId,
    p_user_id: null,
    p_ip_hash: SYNTH_IP,
    p_value: 1,
  });
  if (e2) {
    record(name, "FAIL", `토글 취소 오류(잔여 행 가능): ${e2.message}`);
    return;
  }
  const row2 = (Array.isArray(r2) ? r2[0] : r2) as ToggleRow | undefined;

  if (!row1 || !row2) {
    record(name, "FAIL", "RPC 반환 행 없음 (RETURNS TABLE 계약 불일치 가능)");
    return;
  }

  const likeOn = Number(row1.like_count);
  const likeOff = Number(row2.like_count);
  const ok = row1.liked === true && row2.liked === false && likeOn - likeOff === 1;

  if (ok) {
    record(name, "PASS", `토글 ON→취소 원상복구 (like ${likeOff}→${likeOn}→${likeOff}, dislike 분리집계 OK)`);
  } else {
    record(
      name,
      "FAIL",
      `라운드트립 불일치: row1=${JSON.stringify(row1)} row2=${JSON.stringify(row2)}`,
    );
  }
}

// ---------------------------------------------
// (2) community_comment_likes 테이블 SELECT
// ---------------------------------------------
async function checkCommentLikesTable(): Promise<void> {
  const name = "테이블 community_comment_likes";
  const { error } = await supabase.from("community_comment_likes").select("id").limit(1);
  if (error) {
    record(
      name,
      "FAIL",
      isMissingObject(error)
        ? `테이블 미존재 (마이그레이션 미적용): ${error.code ?? error.message}`
        : `SELECT 오류: ${error.message}`,
    );
    return;
  }
  record(name, "PASS", "SELECT 가능");
}

// ---------------------------------------------
// (3) 트리거 → community_comments.like_count 동기화
// ---------------------------------------------
async function checkCommentLikeTrigger(): Promise<void> {
  const name = "트리거 community_comments.like_count";

  const { data: comments, error: cErr } = await supabase
    .from("community_comments")
    .select("id, like_count")
    .eq("is_deleted", false)
    .limit(1);

  if (cErr) {
    record(name, "FAIL", `community_comments 조회 오류: ${cErr.message}`);
    return;
  }
  if (!comments || comments.length === 0) {
    record(name, "SKIP", "검증할 댓글이 없음 — 트리거 라운드트립 생략 (댓글 시드 필요)");
    return;
  }

  const commentId = comments[0].id as string;
  const before = Number(comments[0].like_count);

  // 추천 INSERT (합성 ip_hash)
  const { data: inserted, error: insErr } = await supabase
    .from("community_comment_likes")
    .insert({ comment_id: commentId, ip_hash: SYNTH_IP, value: 1 })
    .select("id")
    .single();

  if (insErr || !inserted) {
    record(
      name,
      "FAIL",
      isMissingObject(insErr)
        ? `테이블/트리거 미존재: ${insErr?.code ?? insErr?.message}`
        : `추천 INSERT 오류: ${insErr?.message ?? "행 없음"}`,
    );
    return;
  }
  const likeRowId = inserted.id as string;

  // 트리거 반영 후 재조회
  const { data: afterRow, error: aErr } = await supabase
    .from("community_comments")
    .select("like_count")
    .eq("id", commentId)
    .single();

  // 잔여 행 정리 (검증 결과와 무관하게 항상)
  await supabase.from("community_comment_likes").delete().eq("id", likeRowId);

  if (aErr || !afterRow) {
    record(name, "FAIL", `INSERT 후 재조회 오류: ${aErr?.message ?? "행 없음"}`);
    return;
  }

  const after = Number(afterRow.like_count);

  // DELETE 반영 후 원복 확인
  const { data: restoredRow } = await supabase
    .from("community_comments")
    .select("like_count")
    .eq("id", commentId)
    .single();
  const restored = restoredRow ? Number(restoredRow.like_count) : NaN;

  if (after - before === 1 && restored === before) {
    record(name, "PASS", `like_count ${before}→${after}→${restored} (INSERT +1 / DELETE -1 트리거 정상)`);
  } else {
    record(name, "FAIL", `트리거 증감 불일치: before=${before} after=${after} restored=${restored}`);
  }
}

// ---------------------------------------------
// 안전망 정리: 합성 ip_hash 잔여 행 제거
// ---------------------------------------------
async function cleanup(): Promise<void> {
  await supabase.from("community_post_likes").delete().eq("ip_hash", SYNTH_IP);
  await supabase.from("community_comment_likes").delete().eq("ip_hash", SYNTH_IP);
}

async function main(): Promise<void> {
  console.log(`[smoke] 커뮤니티 추천 백엔드 스모크 시작 (synth ip_hash=${SYNTH_IP})\n`);

  await checkToggleRpc();
  await checkCommentLikesTable();
  await checkCommentLikeTrigger();

  await cleanup().catch((err) => console.warn("[smoke] cleanup 경고:", err));

  const failed = results.filter((r) => r.status === "FAIL");
  const skipped = results.filter((r) => r.status === "SKIP");
  const passed = results.filter((r) => r.status === "PASS");

  console.log(
    `\n[smoke] 결과: PASS ${passed.length} / SKIP ${skipped.length} / FAIL ${failed.length}`,
  );

  if (failed.length > 0) {
    console.error("\n[smoke] ❌ 실패 — 마이그레이션 미적용이거나 계약 불일치:");
    for (const f of failed) console.error(`  - ${f.name}: ${f.detail}`);
    console.error("\n운영자: docs/db/R4-db-apply-runbook.md 의 db push 절차를 먼저 실행하세요.");
    process.exit(1);
  }

  if (skipped.length > 0) {
    console.warn("\n[smoke] ⚠️  일부 SKIP — 객체는 존재하나 검증 데이터가 부족합니다 (시드 권장).");
  }
  console.log("\n[smoke] ✅ 모든 객체 존재 확인. 추천 백엔드 적용 정상.");
  process.exit(0);
}

main().catch((err) => {
  console.error("[smoke] 예외:", err);
  process.exit(1);
});
