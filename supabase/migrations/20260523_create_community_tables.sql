-- ==============================================
-- 커뮤니티 게시판 테이블 마이그레이션 (v2.0 피벗)
-- 2026-05-23 / R1 (mainpage)
-- 익명+회원 혼용 작성 권한 모델
-- ==============================================

-- ----------------------------------------------
-- 1. community_boards: 게시판 메타
-- ----------------------------------------------
CREATE TABLE IF NOT EXISTS community_boards (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT,
  emoji TEXT,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE community_boards IS '커뮤니티 게시판 메타 (자유/시세/정보 + 코인룸 6종)';
COMMENT ON COLUMN community_boards.slug IS 'free/market/info/coin-btc/coin-eth/coin-xrp/coin-sol/coin-altcoin/coin-kimp';

-- ----------------------------------------------
-- 2. community_posts: 게시글
--   - 회원(author_id) 또는 익명(guest_*) 둘 중 하나 필수 (CHECK)
--   - guest_ip_masked: 앞 2옥텟만 (예: 211.34.*.*)
-- ----------------------------------------------
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_slug TEXT NOT NULL REFERENCES community_boards(slug) ON DELETE RESTRICT,
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
  content_html TEXT NOT NULL,

  -- 회원 작성 식별 (XOR with guest_*)
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- 익명 작성 식별
  guest_nickname TEXT CHECK (guest_nickname IS NULL OR length(guest_nickname) BETWEEN 2 AND 12),
  guest_password_hash TEXT CHECK (guest_password_hash IS NULL OR length(guest_password_hash) >= 60),
  guest_ip_masked TEXT CHECK (guest_ip_masked IS NULL OR guest_ip_masked ~ '^[0-9]+\.[0-9]+\.\*\.\*$'),

  -- 분류·태그
  category TEXT NOT NULL DEFAULT '전체',
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  coin_symbol TEXT, -- BTC/ETH/... 또는 NULL (코인 무관)

  -- 카운트 캐시
  view_count INTEGER NOT NULL DEFAULT 0,
  like_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,

  -- 상태 플래그
  is_notice BOOLEAN NOT NULL DEFAULT false,
  is_hot BOOLEAN NOT NULL DEFAULT false,
  is_deleted BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- 회원 XOR 익명 강제: 둘 중 하나 식별 정보 필수
  CONSTRAINT community_posts_author_or_guest CHECK (
    author_id IS NOT NULL
    OR (
      guest_nickname IS NOT NULL
      AND guest_password_hash IS NOT NULL
      AND guest_ip_masked IS NOT NULL
    )
  )
);

COMMENT ON TABLE community_posts IS '커뮤니티 게시글 (익명+회원 혼용)';
COMMENT ON COLUMN community_posts.guest_ip_masked IS '익명 글의 IP 앞 2옥텟 (예: 211.34.*.*) — 표시용';
COMMENT ON COLUMN community_posts.coin_symbol IS '코인 태그 (NULL = 코인과 무관한 일반 글)';
COMMENT ON COLUMN community_posts.is_hot IS '베스트 진입 캐시 플래그 (배치/트리거로 갱신)';

-- ----------------------------------------------
-- 3. community_comments: 댓글·대댓글
-- ----------------------------------------------
CREATE TABLE IF NOT EXISTS community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES community_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (length(content) BETWEEN 1 AND 2000),

  -- 회원 작성
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- 익명 작성
  guest_nickname TEXT CHECK (guest_nickname IS NULL OR length(guest_nickname) BETWEEN 2 AND 12),
  guest_password_hash TEXT CHECK (guest_password_hash IS NULL OR length(guest_password_hash) >= 60),
  guest_ip_masked TEXT CHECK (guest_ip_masked IS NULL OR guest_ip_masked ~ '^[0-9]+\.[0-9]+\.\*\.\*$'),

  like_count INTEGER NOT NULL DEFAULT 0,
  is_deleted BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT community_comments_author_or_guest CHECK (
    author_id IS NOT NULL
    OR (
      guest_nickname IS NOT NULL
      AND guest_password_hash IS NOT NULL
      AND guest_ip_masked IS NOT NULL
    )
  )
);

COMMENT ON TABLE community_comments IS '게시글 댓글·대댓글 (parent_id로 self-reference)';

-- ----------------------------------------------
-- 4. community_post_likes: 추천/비추 (회원=user_id, 익명=ip_hash로 dedup)
--   - 작성과 다른 식별 단위: 익명 비추/추천은 마스킹 X, 전체 IP의 sha256 해시
-- ----------------------------------------------
CREATE TABLE IF NOT EXISTS community_post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_hash TEXT, -- 익명 dedup용 sha256 (전체 IP)
  value SMALLINT NOT NULL CHECK (value IN (-1, 1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT community_post_likes_user_or_iphash CHECK (
    user_id IS NOT NULL OR ip_hash IS NOT NULL
  )
);

-- 회원 dedup: 같은 글에 회원 1명은 1표
CREATE UNIQUE INDEX IF NOT EXISTS uniq_community_post_likes_user
  ON community_post_likes(post_id, user_id)
  WHERE user_id IS NOT NULL;

-- 익명 dedup: 같은 글에 같은 IP 해시 1명은 1표
CREATE UNIQUE INDEX IF NOT EXISTS uniq_community_post_likes_iphash
  ON community_post_likes(post_id, ip_hash)
  WHERE ip_hash IS NOT NULL;

COMMENT ON TABLE community_post_likes IS '게시글 추천/비추 토글 적재 (value: 1=추천, -1=비추)';
COMMENT ON COLUMN community_post_likes.ip_hash IS '익명 추천 dedup용 sha256(전체 IP) — 표시용 guest_ip_masked와 별개';

-- ==============================================
-- 인덱스
-- ==============================================
CREATE INDEX IF NOT EXISTS idx_community_posts_board_created
  ON community_posts(board_slug, created_at DESC)
  WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_community_posts_coin_created
  ON community_posts(coin_symbol, created_at DESC)
  WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_community_posts_hot
  ON community_posts(is_hot, created_at DESC)
  WHERE is_deleted = false AND is_hot = true;

CREATE INDEX IF NOT EXISTS idx_community_comments_post
  ON community_comments(post_id, created_at)
  WHERE is_deleted = false;

-- ==============================================
-- 트리거 함수
-- ==============================================

-- 1. updated_at 자동 갱신 (community_posts / community_comments 공용)
CREATE OR REPLACE FUNCTION community_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_community_posts_updated_at ON community_posts;
CREATE TRIGGER trg_community_posts_updated_at
  BEFORE UPDATE ON community_posts
  FOR EACH ROW
  EXECUTE FUNCTION community_touch_updated_at();

DROP TRIGGER IF EXISTS trg_community_comments_updated_at ON community_comments;
CREATE TRIGGER trg_community_comments_updated_at
  BEFORE UPDATE ON community_comments
  FOR EACH ROW
  EXECUTE FUNCTION community_touch_updated_at();

-- 2. comment_count 동기화 (INSERT/UPDATE soft-delete/DELETE)
CREATE OR REPLACE FUNCTION community_sync_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.is_deleted = false THEN
      UPDATE community_posts
        SET comment_count = comment_count + 1
        WHERE id = NEW.post_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.is_deleted = false THEN
      UPDATE community_posts
        SET comment_count = GREATEST(0, comment_count - 1)
        WHERE id = OLD.post_id;
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- soft delete 토글 시 카운트 보정
    IF OLD.is_deleted = false AND NEW.is_deleted = true THEN
      UPDATE community_posts
        SET comment_count = GREATEST(0, comment_count - 1)
        WHERE id = NEW.post_id;
    ELSIF OLD.is_deleted = true AND NEW.is_deleted = false THEN
      UPDATE community_posts
        SET comment_count = comment_count + 1
        WHERE id = NEW.post_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_community_comments_count ON community_comments;
CREATE TRIGGER trg_community_comments_count
  AFTER INSERT OR UPDATE OR DELETE ON community_comments
  FOR EACH ROW
  EXECUTE FUNCTION community_sync_comment_count();

-- 3. like_count 동기화 (추천만 카운트, 비추는 음수 또는 별도 집계용)
--    여기서는 value 부호 합산으로 like_count = SUM(value) 유지
CREATE OR REPLACE FUNCTION community_sync_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts
      SET like_count = like_count + NEW.value
      WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_posts
      SET like_count = like_count - OLD.value
      WHERE id = OLD.post_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- 추천 <-> 비추 전환 시 차이만큼 반영
    IF NEW.value <> OLD.value THEN
      UPDATE community_posts
        SET like_count = like_count - OLD.value + NEW.value
        WHERE id = NEW.post_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_community_post_likes_count ON community_post_likes;
CREATE TRIGGER trg_community_post_likes_count
  AFTER INSERT OR UPDATE OR DELETE ON community_post_likes
  FOR EACH ROW
  EXECUTE FUNCTION community_sync_like_count();

-- ==============================================
-- RLS 정책
-- ==============================================

-- community_boards: 공개 SELECT, 쓰기는 service_role
ALTER TABLE community_boards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "community_boards_select" ON community_boards
  FOR SELECT USING (true);

CREATE POLICY "community_boards_insert" ON community_boards
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "community_boards_update" ON community_boards
  FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "community_boards_delete" ON community_boards
  FOR DELETE USING (auth.role() = 'service_role');

-- community_posts: 공개 SELECT(삭제 제외), INSERT는 모두 허용(CHECK로 강제),
--                  UPDATE/DELETE는 본인 또는 service_role (익명은 서버 라우트에서 비번 검증 후 service_role)
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "community_posts_select" ON community_posts
  FOR SELECT USING (is_deleted = false);

CREATE POLICY "community_posts_insert" ON community_posts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "community_posts_update" ON community_posts
  FOR UPDATE USING (author_id IS NOT NULL AND author_id = auth.uid());

CREATE POLICY "community_posts_delete" ON community_posts
  FOR DELETE USING (author_id IS NOT NULL AND author_id = auth.uid());

-- community_comments: posts와 동일 패턴
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "community_comments_select" ON community_comments
  FOR SELECT USING (is_deleted = false);

CREATE POLICY "community_comments_insert" ON community_comments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "community_comments_update" ON community_comments
  FOR UPDATE USING (author_id IS NOT NULL AND author_id = auth.uid());

CREATE POLICY "community_comments_delete" ON community_comments
  FOR DELETE USING (author_id IS NOT NULL AND author_id = auth.uid());

-- community_post_likes: 공개 SELECT, INSERT 허용(서버 검증), DELETE는 본인만
ALTER TABLE community_post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "community_post_likes_select" ON community_post_likes
  FOR SELECT USING (true);

CREATE POLICY "community_post_likes_insert" ON community_post_likes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "community_post_likes_delete" ON community_post_likes
  FOR DELETE USING (user_id IS NOT NULL AND user_id = auth.uid());

-- ==============================================
-- 시드: 게시판 메타 9행
-- ==============================================
INSERT INTO community_boards (slug, name, name_en, emoji, description, sort_order) VALUES
  ('free',         '자유게시판',     'Free Board',   '💬', '일상·잡담·뉴스 반응을 자유롭게',    10),
  ('market',       '시세토론',       'Market Talk',  '📈', '차트·진입가·전략을 함께 나눠요',    20),
  ('info',         '정보공유',       'Info',         '📚', '분석글·자료·뉴스 정리',             30),
  ('coin-btc',     '비트코인 룸',    'BTC Room',     '₿',  'BTC 전용 토론·시세·뉴스',           110),
  ('coin-eth',     '이더리움 룸',    'ETH Room',     'Ξ',  'ETH 전용 토론·시세·뉴스',           120),
  ('coin-xrp',     '리플 룸',        'XRP Room',     '✕',  'XRP 전용 토론·시세·뉴스',           130),
  ('coin-sol',     '솔라나 룸',      'SOL Room',     '◎',  'SOL 전용 토론·시세·뉴스',           140),
  ('coin-altcoin', '알트코인 룸',    'Altcoin Room', '🌐', 'BTC·ETH 외 알트코인 통합 토론',     150),
  ('coin-kimp',    '김치프리미엄 룸','Kimp Room',    '🇰🇷', '한국·글로벌 거래소 가격차 토론',    160)
ON CONFLICT (slug) DO NOTHING;
