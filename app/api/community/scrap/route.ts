// 스크랩 토글/목록 — 회원전용 (RLS가 user_id=auth.uid() 강제)
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (s: string) => UUID_REGEX.test(s);

interface ScrapData {
  created_at: string;
  post: {
    id: string;
    board_slug: string;
    title: string;
    category: string;
    like_count: number;
    comment_count: number;
    view_count: number;
    created_at: string;
    is_deleted: boolean;
  } | null;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });

  let postId = "";
  try {
    const body = (await req.json()) as { postId?: unknown };
    postId = typeof body.postId === "string" ? body.postId : "";
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!isUuid(postId)) return NextResponse.json({ error: "Invalid postId" }, { status: 400 });

  // 존재 여부 확인 → 토글
  const { data: existing } = await supabase
    .from("community_post_scraps")
    .select("id")
    .eq("user_id", user.id)
    .eq("post_id", postId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("community_post_scraps").delete().eq("id", existing.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ scrapped: false });
  }
  const { error } = await supabase
    .from("community_post_scraps")
    .insert({ user_id: user.id, post_id: postId });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ scrapped: true });
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });

  // 스크랩 → 게시글 조인 (최신순)
  const { data, error } = await supabase
    .from("community_post_scraps")
    .select("created_at, post:community_posts(id, board_slug, title, category, like_count, comment_count, view_count, created_at, is_deleted)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100) as { data: ScrapData[] | null; error: { message: string } | null };
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 삭제된 글 제외
  const posts = (data ?? [])
    .map((r) => r.post)
    .filter((p): p is NonNullable<typeof p> => !!p && !p.is_deleted);
  return NextResponse.json({ posts });
}
