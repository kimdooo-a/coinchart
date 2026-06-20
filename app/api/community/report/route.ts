import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (s: string) => UUID_REGEX.test(s);
const REASONS = new Set(["spam", "abuse", "sexual", "fraud", "etc"]);

export async function POST(req: NextRequest) {
  let body: { targetType?: unknown; targetId?: unknown; reason?: unknown; detail?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const targetType = body.targetType === "post" || body.targetType === "comment" ? body.targetType : "";
  const targetId = typeof body.targetId === "string" ? body.targetId : "";
  const reason = typeof body.reason === "string" ? body.reason : "";
  const detail = typeof body.detail === "string" ? body.detail.trim().slice(0, 500) : null;

  if (!targetType) return NextResponse.json({ error: "Invalid targetType" }, { status: 400 });
  if (!isUuid(targetId)) return NextResponse.json({ error: "Invalid targetId" }, { status: 400 });
  if (!REASONS.has(reason)) return NextResponse.json({ error: "Invalid reason" }, { status: 400 });

  const supabaseUser = await createClient();
  const { data: { user } } = await supabaseUser.auth.getUser();

  const row: Record<string, unknown> = { target_type: targetType, target_id: targetId, reason, detail };
  if (user) {
    row.reporter_user_id = user.id;
  } else {
    const ipHash = req.headers.get("x-client-ip-hash");
    if (!ipHash) return NextResponse.json({ error: "신고 식별 헤더 없음" }, { status: 400 });
    row.reporter_ip_hash = ipHash;
  }

  const admin = createAdminClient();
  const { error } = await admin.from("community_reports").insert(row);
  if (error) {
    // dedup UNIQUE 위반 = 이미 신고
    if (error.code === "23505") return NextResponse.json({ error: "이미 신고한 콘텐츠입니다" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}
