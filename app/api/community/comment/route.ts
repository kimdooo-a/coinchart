// R1 2026-05-23 / T12 — community comment API
// POST   /api/community/comment  — 댓글/대댓글 작성 (회원/익명)
// DELETE /api/community/comment  — soft delete (회원: 본인 / 익명: 비번 일치)
// PATCH  /api/community/comment  — 댓글 추천 토글 (R3 / T08, 2026-05-24)
//   body: { commentId, value: 1 | -1 } — 회원=user_id / 익명=x-client-ip-hash dedup
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashGuestPassword, verifyGuestPassword, validateGuestNickname } from "@/lib/community/auth";

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

// PATCH — 댓글 추천 토글 (R3 / T08)
//   body: { commentId, value?: 1 | -1 }  (value 미지정 시 1=추천)
//   - 회원: user_id dedup / 익명: x-client-ip-hash dedup
//   - 토글: 같은 value면 삭제(OFF), 다른 value면 전환(UPDATE)
//   - 응답: { liked, likeCount }  (liked = value=1 추천이 활성인지)
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

  let existingQuery = admin
    .from("community_comment_likes")
    .select("id, value, user_id, ip_hash")
    .eq("comment_id", commentId);

  let ipHash: string | null = null;
  if (user) {
    existingQuery = existingQuery.eq("user_id", user.id);
  } else {
    ipHash = req.headers.get("x-client-ip-hash");
    if (!ipHash) return NextResponse.json({ error: "추천 식별 헤더 없음" }, { status: 400 });
    existingQuery = existingQuery.eq("ip_hash", ipHash);
  }

  const { data: existing } = await existingQuery.maybeSingle();

  let liked = false; // 최종 상태: 추천(value=1)이 활성인지 여부

  if (existing) {
    if (existing.value === value) {
      // 토글 OFF: 삭제
      const { error: delErr } = await admin
        .from("community_comment_likes")
        .delete()
        .eq("id", existing.id);
      if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });
      liked = false;
    } else {
      // 추천 <-> 비추 전환
      const { error: updErr } = await admin
        .from("community_comment_likes")
        .update({ value })
        .eq("id", existing.id);
      if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
      liked = value === 1;
    }
  } else {
    const insertRow: Record<string, unknown> = { comment_id: commentId, value };
    if (user) insertRow.user_id = user.id;
    else insertRow.ip_hash = ipHash;
    const { error: insErr } = await admin
      .from("community_comment_likes")
      .insert(insertRow);
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
    liked = value === 1;
  }

  // 갱신된 like_count 재조회 (트리거가 반영)
  const { data: refreshed } = await admin
    .from("community_comments")
    .select("like_count")
    .eq("id", commentId)
    .single();

  return NextResponse.json({
    liked,
    likeCount: refreshed?.like_count ?? 0,
  });
}
