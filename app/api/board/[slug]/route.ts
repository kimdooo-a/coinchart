// R1 2026-05-23 / T12 — board API
// GET  /api/board/[slug]       — 게시판 글 목록 (페이지·정렬·검색·카테고리)
// POST /api/board/[slug]       — 새 글 작성 (회원/익명)
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashGuestPassword, validateGuestNickname } from "@/lib/community/auth";
import { sanitizeHtml } from "@/lib/blog-sanitize";

const VALID_SLUGS = new Set([
  "free", "market", "info",
  "coin-btc", "coin-eth", "coin-xrp", "coin-sol", "coin-altcoin", "coin-kimp",
]);

const POST_SELECT_FIELDS = "id, board_slug, title, author_id, guest_nickname, guest_ip_masked, category, tags, coin_symbol, view_count, like_count, comment_count, is_notice, is_hot, created_at, updated_at";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!VALID_SLUGS.has(slug)) {
    return NextResponse.json({ error: "Unknown board" }, { status: 404 });
  }

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? "30")));
  const sort = url.searchParams.get("sort") ?? "recent"; // recent | popular | views | comments
  const search = (url.searchParams.get("search") ?? "").trim();
  const category = (url.searchParams.get("category") ?? "").trim();

  const supabase = await createClient();

  // 공지글 (페이지와 무관하게 항상 상단)
  const noticeQuery = supabase
    .from("community_posts")
    .select(POST_SELECT_FIELDS)
    .eq("board_slug", slug)
    .eq("is_deleted", false)
    .eq("is_notice", true)
    .order("created_at", { ascending: false });

  // 일반글
  let q = supabase
    .from("community_posts")
    .select(POST_SELECT_FIELDS, { count: "exact" })
    .eq("board_slug", slug)
    .eq("is_deleted", false)
    .eq("is_notice", false)
    .range((page - 1) * limit, page * limit - 1);

  if (sort === "popular") q = q.order("like_count", { ascending: false }).order("created_at", { ascending: false });
  else if (sort === "views") q = q.order("view_count", { ascending: false }).order("created_at", { ascending: false });
  else if (sort === "comments") q = q.order("comment_count", { ascending: false }).order("created_at", { ascending: false });
  else q = q.order("created_at", { ascending: false });

  if (search) q = q.ilike("title", `%${search}%`);
  if (category && category !== "전체") q = q.eq("category", category);

  const [{ data: notices, error: noticeErr }, { data: posts, error: postErr, count }] =
    await Promise.all([noticeQuery, q]);

  if (noticeErr) return NextResponse.json({ error: noticeErr.message }, { status: 500 });
  if (postErr) return NextResponse.json({ error: postErr.message }, { status: 500 });

  return NextResponse.json({
    notices: notices ?? [],
    posts: posts ?? [],
    total: count ?? 0,
    page,
    limit,
  });
}

interface CreatePostBody {
  title?: unknown;
  contentHtml?: unknown;
  category?: unknown;
  tags?: unknown;
  coinSymbol?: unknown;
  postAsAnonymous?: unknown;
  guestNickname?: unknown;
  guestPassword?: unknown;
  isNotice?: unknown;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!VALID_SLUGS.has(slug)) {
    return NextResponse.json({ error: "Unknown board" }, { status: 404 });
  }

  let body: CreatePostBody;
  try {
    body = (await req.json()) as CreatePostBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const contentHtml = typeof body.contentHtml === "string" ? body.contentHtml : "";
  const category = typeof body.category === "string" && body.category.trim() ? body.category.trim() : "전체";
  const tags = Array.isArray(body.tags) ? (body.tags as unknown[]).filter((t): t is string => typeof t === "string").slice(0, 10) : [];
  const coinSymbol = typeof body.coinSymbol === "string" && body.coinSymbol.trim() ? body.coinSymbol.trim().toUpperCase() : null;
  const postAsAnonymous = body.postAsAnonymous === true;

  if (!title || title.length > 200) {
    return NextResponse.json({ error: "제목은 1~200자" }, { status: 400 });
  }
  if (!contentHtml || contentHtml.length < 1) {
    return NextResponse.json({ error: "본문 필수" }, { status: 400 });
  }

  // 회원 식별 (cookie 기반 supabase 세션 — middleware는 /api/ 스킵하므로 여기서 직접 조회)
  const supabaseUser = await createClient();
  const { data: { user } } = await supabaseUser.auth.getUser();

  const admin = createAdminClient();

  const insertRow: Record<string, unknown> = {
    board_slug: slug,
    title,
    // 저장형 XSS 방어: 클라(TipTap) 출력을 신뢰하지 않고 서버에서 sanitize (블로그 경로와 동일 정책)
    content_html: sanitizeHtml(contentHtml),
    category,
    tags,
    coin_symbol: coinSymbol,
    is_notice: false, // 공지는 service_role 어드민 별도 라우트로 (R1 범위 외)
  };

  if (user && !postAsAnonymous) {
    insertRow.author_id = user.id;
  } else {
    // 익명 작성
    const guestNickname = typeof body.guestNickname === "string" ? body.guestNickname.trim() : "";
    const guestPassword = typeof body.guestPassword === "string" ? body.guestPassword : "";
    const nickCheck = validateGuestNickname(guestNickname);
    if (!nickCheck.ok) {
      return NextResponse.json({ error: nickCheck.reason ?? "닉네임 오류" }, { status: 400 });
    }
    if (!guestPassword || guestPassword.length < 4) {
      return NextResponse.json({ error: "비밀번호 4자 이상" }, { status: 400 });
    }

    const ipMasked = req.headers.get("x-client-ip-masked") ?? "0.0.*.*";
    insertRow.guest_nickname = guestNickname;
    insertRow.guest_password_hash = await hashGuestPassword(guestPassword);
    insertRow.guest_ip_masked = ipMasked;
  }

  const { data, error } = await admin
    .from("community_posts")
    .insert(insertRow)
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "게시글 생성 실패" }, { status: 500 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
