// R1 2026-05-23 / T12 — community like (추천/비추 토글) API
// R3 2026-05-24 / T07 — 원자적 토글 RPC 전환 + 회원전이 dedup + dislikeCount 분리 응답
// POST /api/community/like   — body: { postId, value: 1 | -1 }
//   - 회원: user_id dedup (+ 본인 ip_hash 익명 추천 흡수/정리 = 회원전이 dedup)
//   - 익명: x-client-ip-hash dedup
//   - 토글: 같은 value면 삭제(취소), 다른 value면 전환(추천↔비추)
//   - dedup→토글→집계를 단일 RPC(community_toggle_post_like)로 원자 처리
//   - 응답: { liked, likeCount, dislikeCount } — likeCount=추천 수, dislikeCount=비추 수
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (s: string): boolean => UUID_REGEX.test(s);

interface LikeBody {
  postId?: unknown;
  value?: unknown;
}

// community_toggle_post_like RPC 반환 행 (RETURNS TABLE → 배열 첫 행)
interface ToggleLikeRow {
  liked: boolean;
  like_count: number;
  dislike_count: number;
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
    .select("id, is_deleted")
    .eq("id", postId)
    .single();
  if (postErr || !post || post.is_deleted) {
    return NextResponse.json({ error: "게시글 없음" }, { status: 404 });
  }

  // ip_hash: 회원/익명 공통으로 읽음
  //   - 익명: dedup 식별자(필수)
  //   - 회원: 본인 익명 추천 흡수(회원전이 dedup)용 (없어도 토글은 동작)
  const ipHash = req.headers.get("x-client-ip-hash");
  if (!user && !ipHash) {
    return NextResponse.json({ error: "추천 식별 헤더 없음" }, { status: 400 });
  }

  // 원자적 토글 + 회원전이 dedup + 분리 집계 (RPC 단일 트랜잭션)
  const { data: rows, error: rpcErr } = await admin.rpc("community_toggle_post_like", {
    p_post_id: postId,
    p_user_id: user?.id ?? null,
    p_ip_hash: ipHash,
    p_value: value,
  });
  if (rpcErr) return NextResponse.json({ error: rpcErr.message }, { status: 500 });

  const result = (Array.isArray(rows) ? rows[0] : rows) as ToggleLikeRow | undefined;

  return NextResponse.json({
    liked: !!result?.liked,           // 하위호환: 최종 추천 활성 여부
    likeCount: Number(result?.like_count ?? 0),     // 추천 수 (value=1 합)
    dislikeCount: Number(result?.dislike_count ?? 0), // 비추 수 (value=-1 합) — 신규
  });
}
