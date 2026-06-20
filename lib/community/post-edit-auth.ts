// 게시글 수정/삭제 권한 검증 (server-only) — HIGH-1 (2026-06-20)
//
// 회원 글: 세션 author_id 일치. 익명 글: 작성 시 비밀번호(bcrypt) 일치.
// PATCH/DELETE(수정·삭제)와 verify-edit(게이트 사전 검증)이 동일 로직을 공유하도록 추출한 SSOT.
// 서버 전용: @/lib/supabase/server·admin·auth를 import하므로 클라이언트에서 import 금지.
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyGuestPassword } from "@/lib/community/auth";

export interface EditPermissionResult {
  ok: boolean;
  reason?: string;
  status?: number;
  row?: { author_id: string | null; guest_password_hash: string | null };
}

export async function verifyEditPermission(
  postId: string,
  guestPassword: string
): Promise<EditPermissionResult> {
  const supabaseUser = await createClient();
  const { data: { user } } = await supabaseUser.auth.getUser();

  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from("community_posts")
    .select("author_id, guest_password_hash, is_deleted")
    .eq("id", postId)
    .single();

  if (error || !row) return { ok: false, reason: "Not found", status: 404 };
  if (row.is_deleted) return { ok: false, reason: "Deleted", status: 410 };

  // 회원 작성: author_id 일치
  if (row.author_id) {
    if (!user || user.id !== row.author_id) {
      return { ok: false, reason: "Forbidden", status: 403, row };
    }
    return { ok: true, row };
  }

  // 익명 작성: 비번 검증
  if (!row.guest_password_hash) {
    return { ok: false, reason: "권한 없음", status: 403, row };
  }
  if (!guestPassword) {
    return { ok: false, reason: "비밀번호 필요", status: 401, row };
  }
  const ok = await verifyGuestPassword(guestPassword, row.guest_password_hash);
  if (!ok) return { ok: false, reason: "비밀번호 불일치", status: 403, row };

  return { ok: true, row };
}
