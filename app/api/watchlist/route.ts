// R12 / D2 (2026-05-29) — watchlist 회원 동기화 API
// GET    /api/watchlist          — 본인 즐겨찾기 목록 (회원 전용)
// POST   /api/watchlist          — 즐겨찾기 추가 { assetType, symbol, sortOrder? } (상한 100 가드)
// PATCH  /api/watchlist          — 표시 순서 일괄 갱신 { order: [{ assetType, symbol, sortOrder }] } (R13 B-2)
// DELETE /api/watchlist          — 즐겨찾기 삭제 { assetType, symbol } (또는 ?assetType=&symbol=)
// DELETE /api/watchlist?all=true — 본인 즐겨찾기 전건 삭제(벌크 clear) (R13 B-3)
// 모든 라우트 인증 가드: 미회원 401. RLS로 본인 행만 노출(secure_memos 패턴).
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  fetchUserWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  reorderWatchlist,
  clearUserWatchlist,
  normalizeWatchlistInput,
  MEMBER_WATCHLIST_LIMIT,
  type WatchlistAssetType,
  type WatchlistInput,
} from '@/lib/supabase/watchlist';

export const dynamic = 'force-dynamic';

const VALID_ASSET_TYPES = ['CRYPTO', 'STOCK'] as const;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  try {
    const items = await fetchUserWatchlist(supabase, user.id);
    return NextResponse.json({ items, limit: MEMBER_WATCHLIST_LIMIT });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

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

  const input = normalizeWatchlistInput(body);
  if (!input) {
    return NextResponse.json(
      { error: 'assetType(CRYPTO|STOCK)·symbol 필요' },
      { status: 400 }
    );
  }

  try {
    const result = await addToWatchlist(supabase, user.id, input);
    if (!result.ok) {
      // 상한 초과(taste #3: 회원 100)
      return NextResponse.json(
        { error: `즐겨찾기는 최대 ${result.limit}개까지 가능합니다.`, limit: result.limit },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { item: result.item, alreadyExists: result.alreadyExists },
      { status: result.alreadyExists ? 200 : 201 }
    );
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

// 단일 reorder 요청에서 허용할 최대 항목 수(DoS 방어 — 상한 100보다 여유)
const MAX_REORDER_ITEMS = 500;

export async function PATCH(req: NextRequest) {
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

  const rawOrder = (body as { order?: unknown })?.order;
  if (!Array.isArray(rawOrder)) {
    return NextResponse.json({ error: 'order 배열 필요' }, { status: 400 });
  }
  if (rawOrder.length > MAX_REORDER_ITEMS) {
    return NextResponse.json(
      { error: `한 번에 최대 ${MAX_REORDER_ITEMS}개까지 정렬 가능합니다.` },
      { status: 400 }
    );
  }

  // 유효 입력만 통과(sortOrder 누락 시 normalize가 0으로). 잘못된 항목은 조용히 무시.
  const order: WatchlistInput[] = [];
  for (const raw of rawOrder) {
    const normalized = normalizeWatchlistInput(raw);
    if (normalized) order.push(normalized);
  }

  try {
    const updated = await reorderWatchlist(supabase, user.id, order);
    return NextResponse.json({ ok: true, updated });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  // body 또는 쿼리스트링 둘 다 허용
  const url = new URL(req.url);

  // ?all=true → 전건 삭제(벌크 clear, B-3). assetType/symbol 무시.
  if (url.searchParams.get('all') === 'true') {
    try {
      const cleared = await clearUserWatchlist(supabase, user.id);
      return NextResponse.json({ ok: true, cleared });
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
  }

  let assetType = (url.searchParams.get('assetType') ?? '').toUpperCase();
  let symbol = (url.searchParams.get('symbol') ?? '').trim().toUpperCase();

  if (!assetType || !symbol) {
    try {
      const body = (await req.json()) as { assetType?: unknown; symbol?: unknown };
      if (!assetType && typeof body.assetType === 'string') assetType = body.assetType.toUpperCase();
      if (!symbol && typeof body.symbol === 'string') symbol = body.symbol.trim().toUpperCase();
    } catch {
      // body 없을 수 있음(쿼리스트링만)
    }
  }

  if (!VALID_ASSET_TYPES.includes(assetType as (typeof VALID_ASSET_TYPES)[number]) || !symbol) {
    return NextResponse.json(
      { error: 'assetType(CRYPTO|STOCK)·symbol 필요' },
      { status: 400 }
    );
  }

  try {
    await removeFromWatchlist(supabase, user.id, assetType as WatchlistAssetType, symbol);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
