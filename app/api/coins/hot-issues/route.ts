import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 5분 캐시 (RPC가 STABLE이라 동일 인자/시간 윈도우 내 결과 동일)
export const revalidate = 300;

type HotIssueRow = {
  symbol: string;
  recent_count: number;
  prev_count: number;
  trend: string;
  score: number;
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const hoursRaw = Number(url.searchParams.get("hours") ?? "24");
    const limitRaw = Number(url.searchParams.get("limit") ?? "10");

    // 입력 보호: NaN/음수/과대 차단
    const hours = Number.isFinite(hoursRaw) && hoursRaw > 0 ? Math.min(hoursRaw, 168) : 24;
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 50) : 10;

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("community_hot_issues", {
      hours_window: hours,
      result_limit: limit,
    });
    if (error) throw error;

    const rows = (data ?? []) as HotIssueRow[];
    return NextResponse.json({
      items: rows.map((r, i) => ({
        rank: i + 1,
        symbol: r.symbol,
        count: Number(r.recent_count),
        trend: r.trend,
        score: Number(r.score),
      })),
      ts: Date.now(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "hot-issues failed" },
      { status: 500 },
    );
  }
}
