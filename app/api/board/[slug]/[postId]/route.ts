// R1 2026-05-23 / T12 — board post detail API
// GET    /api/board/[slug]/[postId]  — 게시글 상세 + view_count 증가 + 첫 페이지 댓글
// PATCH  /api/board/[slug]/[postId]  — 수정 (회원: 본인 / 익명: 비번 일치)
// DELETE /api/board/[slug]/[postId]  — soft delete (is_deleted=true)
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeHtml } from "@/lib/blog-sanitize";
import { verifyEditPermission } from "@/lib/community/post-edit-auth";

const VALID_SLUGS = new Set([
  "free", "market", "info",
  "coin-btc", "coin-eth", "coin-xrp", "coin-sol", "coin-altcoin", "coin-kimp",
]);

const POST_DETAIL_FIELDS = "id, board_slug, title, content_html, author_id, guest_nickname, guest_ip_masked, category, tags, coin_symbol, view_count, like_count, comment_count, is_notice, is_hot, is_deleted, created_at, updated_at";
const COMMENT_FIELDS = "id, post_id, parent_id, content, author_id, guest_nickname, guest_ip_masked, like_count, is_deleted, created_at, updated_at";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(s: string): boolean {
  return UUID_REGEX.test(s);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string; postId: string }> }
) {
  const { slug, postId } = await params;
  if (!VALID_SLUGS.has(slug)) {
    return NextResponse.json({ error: "Unknown board" }, { status: 404 });
  }
  if (!isUuid(postId)) {
    return NextResponse.json({ error: "Invalid post id" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: post, error } = await supabase
    .from("community_posts")
    .select(POST_DETAIL_FIELDS)
    .eq("id", postId)
    .eq("board_slug", slug)
    .eq("is_deleted", false)
    .single();

  if (error || !post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // view_count 비동기 증가 (실패해도 응답에 영향 없음)
  const admin = createAdminClient();
  void admin
    .from("community_posts")
    .update({ view_count: (post.view_count ?? 0) + 1 })
    .eq("id", postId)
    .then(() => undefined);

  // 댓글 첫 페이지 (최신순 50)
  const { data: comments } = await supabase
    .from("community_comments")
    .select(COMMENT_FIELDS)
    .eq("post_id", postId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: true })
    .limit(100);

  // 로그인 사용자의 스크랩 여부 — additive 필드(비회원 false, 기존 호출 무해)
  // community_post_scraps 테이블 부재/네트워크 오류 시 500 방지 (운영 전제: 테이블 미존재 가능)
  let scrapped = false;
  try {
    const { data } = await supabase.auth.getUser();
    const user = data?.user;
    if (user) {
      const { data: scrapRow } = await supabase
        .from("community_post_scraps")
        .select("post_id")
        .eq("user_id", user.id)
        .eq("post_id", postId)
        .maybeSingle();
      scrapped = scrapRow !== null;
    }
  } catch {
    // 테이블 부재/네트워크 오류 시 false 유지
  }

  return NextResponse.json({ post, comments: comments ?? [], scrapped });
}

interface UpdateBody {
  title?: unknown;
  contentHtml?: unknown;
  category?: unknown;
  tags?: unknown;
  coinSymbol?: unknown;
  guestPassword?: unknown;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; postId: string }> }
) {
  const { slug, postId } = await params;
  if (!VALID_SLUGS.has(slug)) return NextResponse.json({ error: "Unknown board" }, { status: 404 });
  if (!isUuid(postId)) return NextResponse.json({ error: "Invalid post id" }, { status: 400 });

  let body: UpdateBody;
  try {
    body = (await req.json()) as UpdateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const guestPassword = typeof body.guestPassword === "string" ? body.guestPassword : "";
  const auth = await verifyEditPermission(postId, guestPassword);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.reason ?? "Forbidden" }, { status: auth.status ?? 403 });
  }

  const updates: Record<string, unknown> = {};
  if (typeof body.title === "string") {
    const t = body.title.trim();
    if (!t || t.length > 200) return NextResponse.json({ error: "제목 1~200자" }, { status: 400 });
    updates.title = t;
  }
  if (typeof body.contentHtml === "string" && body.contentHtml.length > 0) {
    // 저장형 XSS 방어: 수정 본문도 서버에서 sanitize (생성 경로·블로그와 동일 정책)
    updates.content_html = sanitizeHtml(body.contentHtml);
  }
  if (typeof body.category === "string" && body.category.trim()) {
    updates.category = body.category.trim();
  }
  if (Array.isArray(body.tags)) {
    updates.tags = (body.tags as unknown[]).filter((t): t is string => typeof t === "string").slice(0, 10);
  }
  if (typeof body.coinSymbol === "string") {
    updates.coin_symbol = body.coinSymbol.trim() ? body.coinSymbol.trim().toUpperCase() : null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "변경할 필드 없음" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("community_posts")
    .update(updates)
    .eq("id", postId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; postId: string }> }
) {
  const { slug, postId } = await params;
  if (!VALID_SLUGS.has(slug)) return NextResponse.json({ error: "Unknown board" }, { status: 404 });
  if (!isUuid(postId)) return NextResponse.json({ error: "Invalid post id" }, { status: 400 });

  // 비번은 오직 request body(JSON)에서만 읽는다 — query string은 평문 로깅 위험(H-2)
  let guestPassword = "";
  try {
    const body = (await req.json()) as { guestPassword?: unknown };
    if (typeof body.guestPassword === "string") guestPassword = body.guestPassword;
  } catch {
    // body 없으면 무시
  }

  const auth = await verifyEditPermission(postId, guestPassword);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.reason ?? "Forbidden" }, { status: auth.status ?? 403 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("community_posts")
    .update({ is_deleted: true })
    .eq("id", postId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
