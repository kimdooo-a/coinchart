// /api/fng — Alternative.me Fear & Greed Index 프록시 (R1/T04, 2026-05-23)
import { NextResponse } from "next/server";
import { fetchFng } from "@/lib/community/fng";

export const revalidate = 3600;

export async function GET() {
  try {
    const fng = await fetchFng();
    return NextResponse.json(fng);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "fng fetch failed" },
      { status: 502 }
    );
  }
}
