-- R-B 2026-06-14 — 스크랩(community_post_scraps) + 신고(community_reports)
-- 기존 community_post_likes dedup 패턴 차용(UNIQUE 부분인덱스 + CHECK).

-- 1. 스크랩 (회원전용)
CREATE TABLE IF NOT EXISTS community_post_scraps (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id    UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uniq_post_scraps_user_post UNIQUE (user_id, post_id)
);
CREATE INDEX IF NOT EXISTS idx_post_scraps_user_created
  ON community_post_scraps (user_id, created_at DESC);

ALTER TABLE community_post_scraps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS post_scraps_select_own ON community_post_scraps;
CREATE POLICY post_scraps_select_own ON community_post_scraps
  FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS post_scraps_insert_own ON community_post_scraps;
CREATE POLICY post_scraps_insert_own ON community_post_scraps
  FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS post_scraps_delete_own ON community_post_scraps;
CREATE POLICY post_scraps_delete_own ON community_post_scraps
  FOR DELETE USING (user_id = auth.uid());

-- 2. 신고 (회원+익명)
CREATE TABLE IF NOT EXISTS community_reports (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type      TEXT NOT NULL CHECK (target_type IN ('post','comment')),
  target_id        UUID NOT NULL,
  reason           TEXT NOT NULL CHECK (reason IN ('spam','abuse','sexual','fraud','etc')),
  detail           TEXT CHECK (detail IS NULL OR char_length(detail) <= 500),
  reporter_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reporter_ip_hash TEXT,
  status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewed','dismissed')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_reports_reporter CHECK (reporter_user_id IS NOT NULL OR reporter_ip_hash IS NOT NULL)
);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_reports_user
  ON community_reports (target_type, target_id, reporter_user_id)
  WHERE reporter_user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_reports_iphash
  ON community_reports (target_type, target_id, reporter_ip_hash)
  WHERE reporter_ip_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reports_status_created
  ON community_reports (status, created_at DESC);

ALTER TABLE community_reports ENABLE ROW LEVEL SECURITY;
-- INSERT만 공개(무결성은 CHECK가 강제), 조회·수정은 service_role(API)만.
DROP POLICY IF EXISTS reports_insert_any ON community_reports;
CREATE POLICY reports_insert_any ON community_reports
  FOR INSERT WITH CHECK (true);
-- service_role은 RLS 우회하므로 SELECT/UPDATE 정책 불필요(공개 정책 미부여 = anon/auth 차단).
