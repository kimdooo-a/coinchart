// R1 2026-05-23 / T12 — board post detail API
// GET    /api/board/[slug]/[postId]  — 게시글 상세 + view_count 증가 + 첫 페이지 댓글
// PATCH  /api/board/[slug]/[postId]  — 수정 (회원: 본인 / 익명: 비번 일치)
// DELETE /api/board/[slug]/[postId]  — soft delete (is_deleted=true)
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyGuestPassword } from "@/lib/community/auth";

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

  return NextResponse.json({ post, comments: comments ?? [] });
}

interface UpdateBody {
  title?: unknown;
  contentHtml?: unknown;
  category?: unknown;
  tags?: unknown;
  coinSymbol?: unknown;
  guestPassword?: unknown;
}

async function verifyEditPermission(
  postId: string,
  guestPassword: string
): Promise<{ ok: boolean; reason?: string; status?: number; row?: { author_id: string | null; guest_password_hash: string | null } }> {
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
    updates.content_html = body.contentHtml;
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

  // 비번은 query string 또는 body 어디서든 받음 (DELETE 메서드라 body 처리 분기)
  let guestPassword = "";
  const url = new URL(req.url);
  const qPwd = url.searchParams.get("guestPassword");
  if (qPwd) guestPassword = qPwd;
  else {
    try {
      const body = (await req.json()) as { guestPassword?: unknown };
      if (typeof body.guestPassword === "string") guestPassword = body.guestPassword;
    } catch {
      // body 없으면 무시
    }
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
