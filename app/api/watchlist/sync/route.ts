// R12 / D2 (2026-05-29) — watchlist 로컬→DB 머지 업로드 API
// POST /api/watchlist/sync  { items: [{ assetType, symbol, sortOrder? }, ...] }
//   - taste #2: 로컬 우선 병합 — 로컬 + DB 합집합, 중복(UNIQUE)은 DB 기존 유지(로컬 손실 0)
//   - taste #3: 합집합 상한 100, 초과 신규분은 입력 순서로 잘라냄(skipped 보고)
//   - 로그인 직후 1회 호출(D3). 회원 전용(미회원 401).
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  syncWatchlist,
  normalizeWatchlistInput,
  type WatchlistInput,
} from '@/lib/supabase/watchlist';

export const dynamic = 'force-dynamic';

// 단일 sync에서 허용할 최대 입력 개수(DoS 방어 — 상한 100보다 여유).
const MAX_SYNC_ITEMS = 500;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const rawItems = (body as { items?: unknown })?.items;
  if (!Array.isArray(rawItems)) {
    return NextResponse.json({ error: 'items 배열 필요' }, { status: 400 });
  }
  if (rawItems.length > MAX_SYNC_ITEMS) {
    return NextResponse.json(
      { error: `한 번에 최대 ${MAX_SYNC_ITEMS}개까지 동기화 가능합니다.` },
      { status: 400 }
    );
  }

  // 유효 입력만 통과(잘못된 항목은 조용히 무시 — 머지는 best-effort)
  const inputs: WatchlistInput[] = [];
  for (const raw of rawItems) {
    const normalized = normalizeWatchlistInput(raw);
    if (normalized) inputs.push(normalized);
  }

  try {
    const result = await syncWatchlist(supabase, user.id, inputs);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
