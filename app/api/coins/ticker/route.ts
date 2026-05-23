import { NextResponse } from "next/server";
import { fetchCommunityTickers, fetchBinanceTickers } from "@/lib/supabase/crypto";

export const revalidate = 60;

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const symbolsParam = url.searchParams.get("symbols");
        const tickers = symbolsParam
            ? await fetchBinanceTickers(symbolsParam.split(",").filter(Boolean))
            : await fetchCommunityTickers();
        return NextResponse.json({ tickers, ts: Date.now() });
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "ticker fetch failed" },
            { status: 502 }
        );
    }
}
