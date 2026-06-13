// 관리자 전용 API 라우트 권한 게이트 (공통 SSOT)
// 기존 app/api/admin/board/route.ts의 로컬 requireAdmin을 추출하여
// 모든 admin 라우트가 동일한 서버측 검증 단일 지점을 공유하도록 한다.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/supabase/blog";

/**
 * 관리자 권한 게이트. 서버 측 role 검증을 단일 지점으로 강제한다.
 * - 미인증: 401 / 인증되었으나 비관리자: 403 (안티패턴: 클라만 신뢰 금지)
 *
 * 사용:
 *   const gate = await requireAdmin();
 *   if (!gate.ok) return gate.res;
 *   // 이후 gate.userId 사용 가능
 */
export async function requireAdmin(): Promise<
  { ok: true; userId: string } | { ok: false; res: NextResponse }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, res: NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 }) };
  }
  if (!isAdminEmail(user.email)) {
    return { ok: false, res: NextResponse.json({ error: "관리자 권한이 필요합니다" }, { status: 403 }) };
  }
  return { ok: true, userId: user.id };
}
