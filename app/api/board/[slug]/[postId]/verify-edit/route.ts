// 게시글 수정 권한 사전 검증 — HIGH-1 (2026-06-20)
// POST /api/board/[slug]/[postId]/verify-edit  body: { guestPassword?: string }
//   수정 페이지의 익명 비밀번호 게이트가 편집기 진입 전 비번을 서버 검증하기 위한 경로.
//   실제 수정 권한 검증(PATCH)과 동일한 verifyEditPermission(bcrypt) 사용 — 게이트가 진실해진다.
import { NextRequest, NextResponse } from "next/server";
import { verifyEditPermission } from "@/lib/community/post-edit-auth";

const VALID_SLUGS = new Set([
  "free", "market", "info",
  "coin-btc", "coin-eth", "coin-xrp", "coin-sol", "coin-altcoin", "coin-kimp",
]);

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; postId: string }> }
) {
  const { slug, postId } = await params;
  if (!VALID_SLUGS.has(slug)) return NextResponse.json({ error: "Unknown board" }, { status: 404 });
  if (!UUID_REGEX.test(postId)) return NextResponse.json({ error: "Invalid post id" }, { status: 400 });

  let guestPassword = "";
  try {
    const body = (await req.json()) as { guestPassword?: unknown };
    if (typeof body.guestPassword === "string") guestPassword = body.guestPassword;
  } catch {
    // body 없으면 빈 비번으로 검증(회원 글이면 세션으로 통과 가능)
  }

  const auth = await verifyEditPermission(postId, guestPassword);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.reason ?? "Forbidden" }, { status: auth.status ?? 403 });
  }
  return NextResponse.json({ ok: true });
}
