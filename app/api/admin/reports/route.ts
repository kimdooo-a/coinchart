import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/admin-guard";

const STATUSES = new Set(["pending", "reviewed", "dismissed"]);
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.res;

  const status = new URL(req.url).searchParams.get("status") ?? "pending";
  const admin = createAdminClient();
  let q = admin
    .from("community_reports")
    .select("id, target_type, target_id, reason, detail, reporter_user_id, status, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (STATUSES.has(status)) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reports: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.res;

  let body: { reportId?: unknown; status?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const reportId = typeof body.reportId === "string" ? body.reportId : "";
  const status = typeof body.status === "string" ? body.status : "";
  if (!UUID_REGEX.test(reportId)) return NextResponse.json({ error: "Invalid reportId" }, { status: 400 });
  if (!STATUSES.has(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from("community_reports").update({ status }).eq("id", reportId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
