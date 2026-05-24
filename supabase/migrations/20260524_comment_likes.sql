-- ==============================================
-- 댓글 추천 토글 테이블 마이그레이션 (v2.0 커뮤니티 / R3)
-- 2026-05-24 / R3 (community-finish) / T08
-- community_post_likes 패턴 차용 (회원=user_id, 익명=ip_hash dedup)
-- ==============================================

-- ----------------------------------------------
-- 0. community_comments.like_count 카운터 컬럼 보장
--    (20260523_create_community_tables.sql에서 이미 생성되었으나
--     본 마이그레이션 단독 적용 안전을 위해 멱등 보강)
-- ----------------------------------------------
ALTER TABLE community_comments
  ADD COLUMN IF NOT EXISTS like_count INTEGER NOT NULL DEFAULT 0;

-- ----------------------------------------------
-- 1. community_comment_likes: 댓글 추천/비추 (회원=user_id, 익명=ip_hash로 dedup)
--   - community_post_likes 패턴 차용 (post_id → comment_id 치환)
--   - 작성과 다른 식별 단위: 익명 추천/비추는 마스킹 X, 전체 IP의 HMAC sha256 해시
-- ----------------------------------------------
CREATE TABLE IF NOT EXISTS community_comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES community_comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_hash TEXT, -- 익명 dedup용 sha256 (전체 IP)
  value SMALLINT NOT NULL CHECK (value IN (-1, 1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT community_comment_likes_user_or_iphash CHECK (
    user_id IS NOT NULL OR ip_hash IS NOT NULL
  )
);

-- 회원 dedup: 같은 댓글에 회원 1명은 1표
CREATE UNIQUE INDEX IF NOT EXISTS uniq_community_comment_likes_user
  ON community_comment_likes(comment_id, user_id)
  WHERE user_id IS NOT NULL;

-- 익명 dedup: 같은 댓글에 같은 IP 해시 1명은 1표
CREATE UNIQUE INDEX IF NOT EXISTS uniq_community_comment_likes_iphash
  ON community_comment_likes(comment_id, ip_hash)
  WHERE ip_hash IS NOT NULL;

-- 댓글별 추천 집계 조회 가속
CREATE INDEX IF NOT EXISTS idx_community_comment_likes_comment
  ON community_comment_likes(comment_id);

COMMENT ON TABLE community_comment_likes IS '댓글 추천/비추 토글 적재 (value: 1=추천, -1=비추) — community_post_likes 패턴 차용';
COMMENT ON COLUMN community_comment_likes.ip_hash IS '익명 추천 dedup용 sha256(전체 IP) — 표시용 guest_ip_masked와 별개';

-- ==============================================
-- 트리거 함수: community_comments.like_count 동기화
--   post_likes의 community_sync_like_count 패턴 차용
--   like_count = SUM(value) 유지 (추천 +1, 비추 -1)
-- ==============================================
CREATE OR REPLACE FUNCTION community_sync_comment_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_comments
      SET like_count = like_count + NEW.value
      WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_comments
      SET like_count = like_count - OLD.value
      WHERE id = OLD.comment_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- 추천 <-> 비추 전환 시 차이만큼 반영
    IF NEW.value <> OLD.value THEN
      UPDATE community_comments
        SET like_count = like_count - OLD.value + NEW.value
        WHERE id = NEW.comment_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_community_comment_likes_count ON community_comment_likes;
CREATE TRIGGER trg_community_comment_likes_count
  AFTER INSERT OR UPDATE OR DELETE ON community_comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION community_sync_comment_like_count();

-- ==============================================
-- RLS 정책 (community_post_likes 정책 차용)
--   공개 SELECT, INSERT 허용(서버 라우트에서 검증), DELETE는 본인만
-- ==============================================
ALTER TABLE community_comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "community_comment_likes_select" ON community_comment_likes
  FOR SELECT USING (true);

CREATE POLICY "community_comment_likes_insert" ON community_comment_likes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "community_comment_likes_delete" ON community_comment_likes
  FOR DELETE USING (user_id IS NOT NULL AND user_id = auth.uid());
