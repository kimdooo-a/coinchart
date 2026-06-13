// R1 2026-05-23 / T12 — community comment API
// POST   /api/community/comment  — 댓글/대댓글 작성 (회원/익명)
// DELETE /api/community/comment  — soft delete (회원: 본인 / 익명: 비번 일치)
// PATCH  /api/community/comment  — 댓글 추천 토글 (R3 / T08, 2026-05-24)
//   body: { commentId, value: 1 | -1 } — 회원=user_id / 익명=x-client-ip-hash dedup
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashGuestPassword, verifyGuestPassword, validateGuestNickname } from "@/lib/community/auth";
import type { ToggleLikeRow } from "@/types/community";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (s: string): boolean => UUID_REGEX.test(s);

interface CommentCreateBody {
  postId?: unknown;
  parentId?: unknown;
  content?: unknown;
  postAsAnonymous?: unknown;
  guestNickname?: unknown;
  guestPassword?: unknown;
}

export async function POST(req: NextRequest) {
  let body: CommentCreateBody;
  try {
    body = (await req.json()) as CommentCreateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const postId = typeof body.postId === "string" ? body.postId : "";
  const parentId = typeof body.parentId === "string" && body.parentId ? body.parentId : null;
  const content = typeof body.content === "string" ? body.content.trim() : "";
  const postAsAnonymous = body.postAsAnonymous === true;

  if (!isUuid(postId)) return NextResponse.json({ error: "Invalid postId" }, { status: 400 });
  if (parentId && !isUuid(parentId)) return NextResponse.json({ error: "Invalid parentId" }, { status: 400 });
  if (!content || content.length > 2000) {
    return NextResponse.json({ error: "댓글 1~2000자" }, { status: 400 });
  }

  // 게시글 존재/삭제 여부 확인
  const supabaseUser = await createClient();
  const { data: { user } } = await supabaseUser.auth.getUser();

  const admin = createAdminClient();
  const { data: post, error: postErr } = await admin
    .from("community_posts")
    .select("id, is_deleted")
    .eq("id", postId)
    .single();
  if (postErr || !post || post.is_deleted) {
    return NextResponse.json({ error: "게시글 없음" }, { status: 404 });
  }

  const insertRow: Record<string, unknown> = {
    post_id: postId,
    parent_id: parentId,
    content,
  };

  if (user && !postAsAnonymous) {
    insertRow.author_id = user.id;
  } else {
    const guestNickname = typeof body.guestNickname === "string" ? body.guestNickname.trim() : "";
    const guestPassword = typeof body.guestPassword === "string" ? body.guestPassword : "";
    const nickCheck = validateGuestNickname(guestNickname);
    if (!nickCheck.ok) return NextResponse.json({ error: nickCheck.reason ?? "닉네임 오류" }, { status: 400 });
    if (!guestPassword || guestPassword.length < 4) {
      return NextResponse.json({ error: "비밀번호 4자 이상" }, { status: 400 });
    }
    const ipMasked = req.headers.get("x-client-ip-masked") ?? "0.0.*.*";
    insertRow.guest_nickname = guestNickname;
    insertRow.guest_password_hash = await hashGuestPassword(guestPassword);
    insertRow.guest_ip_masked = ipMasked;
  }

  const { data, error } = await admin
    .from("community_comments")
    .insert(insertRow)
    .select("id, post_id, parent_id, content, author_id, guest_nickname, guest_ip_masked, like_count, created_at")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "댓글 등록 실패" }, { status: 500 });
  }
  return NextResponse.json({ comment: data }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  let commentId = url.searchParams.get("commentId") ?? "";
  let guestPassword = url.searchParams.get("guestPassword") ?? "";

  if (!commentId || !guestPassword) {
    try {
      const body = (await req.json()) as { commentId?: unknown; guestPassword?: unknown };
      if (!commentId && typeof body.commentId === "string") commentId = body.commentId;
      if (!guestPassword && typeof body.guestPassword === "string") guestPassword = body.guestPassword;
    } catch {
      // body 없을 수 있음
    }
  }

  if (!isUuid(commentId)) return NextResponse.json({ error: "Invalid commentId" }, { status: 400 });

  const supabaseUser = await createClient();
  const { data: { user } } = await supabaseUser.auth.getUser();

  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from("community_comments")
    .select("author_id, guest_password_hash, is_deleted")
    .eq("id", commentId)
    .single();

  if (error || !row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (row.is_deleted) return NextResponse.json({ ok: true });

  if (row.author_id) {
    if (!user || user.id !== row.author_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else {
    if (!row.guest_password_hash) return NextResponse.json({ error: "권한 없음" }, { status: 403 });
    if (!guestPassword) return NextResponse.json({ error: "비밀번호 필요" }, { status: 401 });
    const ok = await verifyGuestPassword(guestPassword, row.guest_password_hash);
    if (!ok) return NextResponse.json({ error: "비밀번호 불일치" }, { status: 403 });
  }

  const { error: delErr } = await admin
    .from("community_comments")
    .update({ is_deleted: true })
    .eq("id", commentId);

  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// PATCH — 댓글 추천 토글 (R3 / T08 → R9 / T03 RPC 전환, 2026-06-13)
//   body: { commentId, value?: 1 | -1 }  (value 미지정 시 1=추천)
//   - 회원: user_id dedup (+ 본인 ip_hash 익명 추천 흡수/정리 = 회원전이 dedup) / 익명: x-client-ip-hash dedup
//   - dedup→토글→집계를 단일 RPC(community_toggle_comment_like)로 원자 처리 (게시글 좋아요와 동일 패턴)
//   - 응답: { liked, likeCount }  (liked = value=1 추천이 활성인지) — 기존 계약 유지
interface CommentLikeBody {
  commentId?: unknown;
  value?: unknown;
}

export async function PATCH(req: NextRequest) {
  let body: CommentLikeBody;
  try {
    body = (await req.json()) as CommentLikeBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const commentId = typeof body.commentId === "string" ? body.commentId : "";
  // value 미지정/잘못된 값은 1(추천)로 기본 처리
  const value = body.value === -1 ? -1 : 1;

  if (!isUuid(commentId)) return NextResponse.json({ error: "Invalid commentId" }, { status: 400 });

  const supabaseUser = await createClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  const admin = createAdminClient();

  // 댓글 존재/삭제 여부 확인
  const { data: comment, error: commentErr } = await admin
    .from("community_comments")
    .select("id, is_deleted")
    .eq("id", commentId)
    .single();
  if (commentErr || !comment || comment.is_deleted) {
    return NextResponse.json({ error: "댓글 없음" }, { status: 404 });
  }

  // ip_hash: 회원/익명 공통으로 읽음
  //   - 익명: dedup 식별자(필수)
  //   - 회원: 본인 익명 추천 흡수(회원전이 dedup)용 (없어도 토글은 동작)
  const ipHash = req.headers.get("x-client-ip-hash");
  if (!user && !ipHash) {
    return NextResponse.json({ error: "추천 식별 헤더 없음" }, { status: 400 });
  }

  // 원자적 토글 + 회원전이 dedup + 분리 집계 (RPC 단일 트랜잭션)
  const { data: rows, error: rpcErr } = await admin.rpc("community_toggle_comment_like", {
    p_comment_id: commentId,
    p_user_id: user?.id ?? null,
    p_ip_hash: ipHash,
    p_value: value,
  });
  if (rpcErr) return NextResponse.json({ error: rpcErr.message }, { status: 500 });

  const result = (Array.isArray(rows) ? rows[0] : rows) as ToggleLikeRow | undefined;

  // 응답은 기존 계약 { liked, likeCount } 유지 (dislike_count는 RPC가 반환하나 비노출)
  return NextResponse.json({
    liked: !!result?.liked,
    likeCount: Number(result?.like_count ?? 0),
  });
}
