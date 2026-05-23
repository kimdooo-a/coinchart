// R1 2026-05-23 / T12 — community like (추천/비추 토글) API
// POST /api/community/like   — body: { postId, value: 1 | -1 }
//   - 회원: user_id dedup
//   - 익명: x-client-ip-hash dedup
//   - 토글: 같은 value면 삭제, 다른 value면 UPDATE
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (s: string): boolean => UUID_REGEX.test(s);

interface LikeBody {
  postId?: unknown;
  value?: unknown;
}

export async function POST(req: NextRequest) {
  let body: LikeBody;
  try {
    body = (await req.json()) as LikeBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const postId = typeof body.postId === "string" ? body.postId : "";
  const value = body.value === 1 || body.value === -1 ? body.value : 0;

  if (!isUuid(postId)) return NextResponse.json({ error: "Invalid postId" }, { status: 400 });
  if (value !== 1 && value !== -1) {
    return NextResponse.json({ error: "value must be 1 or -1" }, { status: 400 });
  }

  const supabaseUser = await createClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  const admin = createAdminClient();

  // 게시글 존재 확인
  const { data: post, error: postErr } = await admin
    .from("community_posts")
    .select("id, is_deleted, like_count")
    .eq("id", postId)
    .single();
  if (postErr || !post || post.is_deleted) {
    return NextResponse.json({ error: "게시글 없음" }, { status: 404 });
  }

  let existingQuery = admin
    .from("community_post_likes")
    .select("id, value, user_id, ip_hash")
    .eq("post_id", postId);

  let ipHash: string | null = null;
  if (user) {
    existingQuery = existingQuery.eq("user_id", user.id);
  } else {
    ipHash = req.headers.get("x-client-ip-hash");
    if (!ipHash) return NextResponse.json({ error: "추천 식별 헤더 없음" }, { status: 400 });
    existingQuery = existingQuery.eq("ip_hash", ipHash);
  }

  const { data: existing } = await existingQuery.maybeSingle();

  let liked = false; // 최종 상태: 추천이 활성인지 여부 (value=1만 liked로 간주)

  if (existing) {
    if (existing.value === value) {
      // 토글 OFF: 삭제
      const { error: delErr } = await admin
        .from("community_post_likes")
        .delete()
        .eq("id", existing.id);
      if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });
      liked = false;
    } else {
      // 추천 <-> 비추 전환
      const { error: updErr } = await admin
        .from("community_post_likes")
        .update({ value })
        .eq("id", existing.id);
      if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
      liked = value === 1;
    }
  } else {
    const insertRow: Record<string, unknown> = { post_id: postId, value };
    if (user) insertRow.user_id = user.id;
    else insertRow.ip_hash = ipHash;
    const { error: insErr } = await admin
      .from("community_post_likes")
      .insert(insertRow);
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
    liked = value === 1;
  }

  // 갱신된 like_count 재조회 (트리거가 반영)
  const { data: refreshed } = await admin
    .from("community_posts")
    .select("like_count")
    .eq("id", postId)
    .single();

  return NextResponse.json({
    liked,
    likeCount: refreshed?.like_count ?? 0,
  });
}
