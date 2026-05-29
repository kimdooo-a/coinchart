-- R12 / D1 (2026-05-29) — user_watchlist (회원 즐겨찾기 동기화 SSOT)
-- 익명은 localStorage, 회원은 이 테이블로 기기 간 동기화.
-- 개인 소유 데이터 패턴: secure_memos(20260114000001)와 동일한 RLS 모델 차용.
--   - user_id FK auth.users, ON DELETE CASCADE
--   - 본인(auth.uid() = user_id) 행만 SELECT/INSERT/UPDATE/DELETE
-- community_* 도메인 모델(닉+비번)은 차용하지 않음(순수 개인 상태, 공개 콘텐츠 아님).

CREATE TABLE IF NOT EXISTS user_watchlist (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    asset_type  TEXT NOT NULL CHECK (asset_type IN ('CRYPTO', 'STOCK')),
    symbol      TEXT NOT NULL,            -- CRYPTO: 'BTCUSDT' / STOCK: 'AAPL'
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, asset_type, symbol)  -- 동일 종목 중복 방지(머지 시 ON CONFLICT DO NOTHING)
);

-- 본인 목록 조회 + 정렬 순서 인덱스
CREATE INDEX IF NOT EXISTS idx_user_watchlist_user ON user_watchlist (user_id, sort_order);

-- Enable Row Level Security
ALTER TABLE user_watchlist ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-run safety)
DROP POLICY IF EXISTS "Users can view own watchlist" ON user_watchlist;
DROP POLICY IF EXISTS "Users can insert own watchlist" ON user_watchlist;
DROP POLICY IF EXISTS "Users can update own watchlist" ON user_watchlist;
DROP POLICY IF EXISTS "Users can delete own watchlist" ON user_watchlist;

-- RLS Policy: 본인(user_id = auth.uid()) 행만 접근 (secure_memos 패턴 그대로)
CREATE POLICY "Users can view own watchlist" ON user_watchlist
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watchlist" ON user_watchlist
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own watchlist" ON user_watchlist
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own watchlist" ON user_watchlist
    FOR DELETE USING (auth.uid() = user_id);
