// ====================================================
// WATCHLIST SSOT (Single Source of Truth)
// user_watchlist (회원 즐겨찾기 동기화) 접근 전용
// DO NOT import crypto or stock functions from here (신규 도메인 — SSOT 교차 금지)
//
// 시세 조회는 각 도메인 SSOT(lib/supabase/crypto.ts / stock.ts) 책임.
// 여기서는 "어떤 심볼을 담았는가"(개인 상태)만 관리한다.
// 인증/RLS: 호출부(app/api/watchlist)가 RLS-scoped 서버 클라이언트를 주입.
//   본인(auth.uid() = user_id) 행만 접근(secure_memos 패턴).
// ====================================================

import type { SupabaseClient } from '@supabase/supabase-js';

// taste #3 (2026-05-29): 즐겨찾기 상한 — 회원 100 (익명 30은 클라이언트 useWatchlist 훅 책임)
export const MEMBER_WATCHLIST_LIMIT = 100;

export type WatchlistAssetType = 'CRYPTO' | 'STOCK';

// DB 행을 클라이언트 친화 형태(localStorage 스키마와 1:1)로 매핑한 형태
export interface WatchlistItem {
  assetType: WatchlistAssetType;
  symbol: string;
  sortOrder: number;
  createdAt: string;
}

// 추가/머지 입력(클라이언트 → 서버). sortOrder 미지정 시 0.
export interface WatchlistInput {
  assetType: WatchlistAssetType;
  symbol: string;
  sortOrder?: number;
}

const VALID_ASSET_TYPES: readonly WatchlistAssetType[] = ['CRYPTO', 'STOCK'];

/** 입력 정규화·검증. 유효하지 않으면 null. symbol은 대문자·trim. */
export function normalizeWatchlistInput(raw: unknown): WatchlistInput | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const assetType = typeof o.assetType === 'string' ? o.assetType.toUpperCase() : '';
  const symbolRaw = typeof o.symbol === 'string' ? o.symbol.trim().toUpperCase() : '';
  if (!VALID_ASSET_TYPES.includes(assetType as WatchlistAssetType)) return null;
  if (!symbolRaw || symbolRaw.length > 32) return null;
  const sortOrder =
    typeof o.sortOrder === 'number' && Number.isFinite(o.sortOrder) ? Math.trunc(o.sortOrder) : 0;
  return { assetType: assetType as WatchlistAssetType, symbol: symbolRaw, sortOrder };
}

// DB 행 → WatchlistItem 매핑
interface WatchlistRow {
  asset_type: string;
  symbol: string;
  sort_order: number;
  created_at: string;
}

function mapRow(r: WatchlistRow): WatchlistItem {
  return {
    assetType: r.asset_type as WatchlistAssetType,
    symbol: r.symbol,
    sortOrder: r.sort_order,
    createdAt: r.created_at,
  };
}

const itemKey = (assetType: string, symbol: string): string => `${assetType}:${symbol}`;

/**
 * 본인 즐겨찾기 목록 조회 (sort_order → created_at 순)
 * RLS가 본인 행만 노출하므로 user_id eq는 방어적 중복 필터.
 */
export async function fetchUserWatchlist(
  supabase: SupabaseClient,
  userId: string
): Promise<WatchlistItem[]> {
  const { data, error } = await supabase
    .from('user_watchlist')
    .select('asset_type, symbol, sort_order, created_at')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[Watchlist SSOT] fetch error:', error);
    throw new Error(error.message);
  }
  return (data ?? []).map(mapRow);
}

/** 본인 즐겨찾기 행 수 */
export async function countUserWatchlist(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('user_watchlist')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) {
    console.error('[Watchlist SSOT] count error:', error);
    throw new Error(error.message);
  }
  return count ?? 0;
}

export type AddResult =
  | { ok: true; item: WatchlistItem; alreadyExists: boolean }
  | { ok: false; reason: 'limit'; limit: number };

/**
 * 즐겨찾기 추가. taste #3 상한 100 가드.
 * 이미 존재(UNIQUE 충돌)하면 기존 행을 반환(alreadyExists=true) — 멱등.
 */
export async function addToWatchlist(
  supabase: SupabaseClient,
  userId: string,
  input: WatchlistInput
): Promise<AddResult> {
  // 멱등: 이미 있으면 그대로 반환(상한 카운트 소비 X)
  const { data: existing } = await supabase
    .from('user_watchlist')
    .select('asset_type, symbol, sort_order, created_at')
    .eq('user_id', userId)
    .eq('asset_type', input.assetType)
    .eq('symbol', input.symbol)
    .maybeSingle();

  if (existing) {
    return { ok: true, item: mapRow(existing as WatchlistRow), alreadyExists: true };
  }

  // 상한 가드(신규 추가 시에만)
  const current = await countUserWatchlist(supabase, userId);
  if (current >= MEMBER_WATCHLIST_LIMIT) {
    return { ok: false, reason: 'limit', limit: MEMBER_WATCHLIST_LIMIT };
  }

  const { data, error } = await supabase
    .from('user_watchlist')
    .insert({
      user_id: userId,
      asset_type: input.assetType,
      symbol: input.symbol,
      sort_order: input.sortOrder ?? 0,
    })
    .select('asset_type, symbol, sort_order, created_at')
    .single();

  if (error || !data) {
    console.error('[Watchlist SSOT] add error:', error);
    throw new Error(error?.message ?? 'insert failed');
  }
  return { ok: true, item: mapRow(data as WatchlistRow), alreadyExists: false };
}

/** 즐겨찾기 삭제. 없어도 멱등(ok). */
export async function removeFromWatchlist(
  supabase: SupabaseClient,
  userId: string,
  assetType: WatchlistAssetType,
  symbol: string
): Promise<void> {
  const { error } = await supabase
    .from('user_watchlist')
    .delete()
    .eq('user_id', userId)
    .eq('asset_type', assetType)
    .eq('symbol', symbol);

  if (error) {
    console.error('[Watchlist SSOT] remove error:', error);
    throw new Error(error.message);
  }
}

/**
 * 표시 순서 일괄 갱신(B-2 / R13). 회원이 reorder한 결과를 DB에 영속화.
 * 각 (asset_type, symbol)의 sort_order를 UPDATE — 존재하지 않는 키는 조용히 무시(0행 영향).
 * 신규 행 삽입 없음(reorder는 기존 항목 재배열 전용) → upsert 대신 update 사용.
 * RLS가 본인 행만 노출하므로 user_id eq는 방어적 중복 필터.
 * @returns 실제 UPDATE 시도한 항목 수(영향 행 수와 무관 — best-effort)
 */
export async function reorderWatchlist(
  supabase: SupabaseClient,
  userId: string,
  order: WatchlistInput[]
): Promise<number> {
  // 입력 정규화·중복 제거(동일 키 마지막 sortOrder 우선)
  const byKey = new Map<string, WatchlistInput>();
  for (const input of order) {
    byKey.set(itemKey(input.assetType, input.symbol), input);
  }
  const updates = [...byKey.values()];

  // Supabase는 행별 상이한 값의 단일 일괄 UPDATE 원시명령이 없으므로 병렬 UPDATE.
  // 최대 100건(상한)이라 round-trip 허용 범위. 하나라도 실패하면 throw.
  await Promise.all(
    updates.map(async (input) => {
      const { error } = await supabase
        .from('user_watchlist')
        .update({ sort_order: input.sortOrder ?? 0 })
        .eq('user_id', userId)
        .eq('asset_type', input.assetType)
        .eq('symbol', input.symbol);
      if (error) {
        console.error('[Watchlist SSOT] reorder error:', error);
        throw new Error(error.message);
      }
    })
  );
  return updates.length;
}

/**
 * 본인 즐겨찾기 전건 삭제(B-3 / R13). clear 벌크 삭제용 — 단일 쿼리.
 * 항목별 루프(N회 DELETE)를 1회로 대체 → 다음 로그인 sync의 잔여행 복원 위험 제거.
 * @returns 삭제된 행 수
 */
export async function clearUserWatchlist(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { data, error } = await supabase
    .from('user_watchlist')
    .delete()
    .eq('user_id', userId)
    .select('id');

  if (error) {
    console.error('[Watchlist SSOT] clear error:', error);
    throw new Error(error.message);
  }
  return data?.length ?? 0;
}

export interface SyncResult {
  items: WatchlistItem[]; // 머지 후 최종 목록
  added: number; // 신규 삽입된 개수
  skipped: number; // 상한 초과로 누락된 신규 개수
  limit: number;
}

/**
 * 로컬 우선 병합(taste #2): 클라이언트 로컬 목록 + DB = 합집합 업로드.
 * - 중복(UNIQUE: user_id+asset_type+symbol)은 무시/유지(DB 기존 우선·로컬은 손실 0).
 * - 합집합이 상한(100)을 넘으면 신규분을 입력 순서대로 잘라 삽입(skipped 보고).
 * 로그인 직후 1회 호출(D3).
 */
export async function syncWatchlist(
  supabase: SupabaseClient,
  userId: string,
  inputs: WatchlistInput[]
): Promise<SyncResult> {
  const existing = await fetchUserWatchlist(supabase, userId);
  const existingKeys = new Set(existing.map((i) => itemKey(i.assetType, i.symbol)));

  // 로컬 입력 중 DB에 없는 것 = 신규. 입력 내 중복도 제거.
  const seen = new Set<string>();
  const fresh: WatchlistInput[] = [];
  for (const input of inputs) {
    const key = itemKey(input.assetType, input.symbol);
    if (existingKeys.has(key) || seen.has(key)) continue;
    seen.add(key);
    fresh.push(input);
  }

  // 상한 가드: 기존 + 신규 ≤ 100. 초과분은 잘라낸다(skipped).
  const room = Math.max(0, MEMBER_WATCHLIST_LIMIT - existing.length);
  const toInsert = fresh.slice(0, room);
  const skipped = fresh.length - toInsert.length;

  if (toInsert.length > 0) {
    const rows = toInsert.map((input) => ({
      user_id: userId,
      asset_type: input.assetType,
      symbol: input.symbol,
      sort_order: input.sortOrder ?? 0,
    }));
    // ON CONFLICT DO NOTHING — UNIQUE 충돌 시 무시(로컬 우선 병합, DB 기존 유지)
    const { error } = await supabase
      .from('user_watchlist')
      .upsert(rows, { onConflict: 'user_id,asset_type,symbol', ignoreDuplicates: true });
    if (error) {
      console.error('[Watchlist SSOT] sync upsert error:', error);
      throw new Error(error.message);
    }
  }

  const items = await fetchUserWatchlist(supabase, userId);
  return { items, added: toInsert.length, skipped, limit: MEMBER_WATCHLIST_LIMIT };
}
