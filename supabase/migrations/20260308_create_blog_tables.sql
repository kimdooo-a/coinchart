-- ==============================================
-- 블로그 기능 테이블 마이그레이션
-- 2026-03-08
-- ==============================================

-- 1. blog_categories: 카테고리
CREATE TABLE IF NOT EXISTS blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ko TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#6366f1',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. blog_posts: 포스트
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES blog_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content JSONB NOT NULL DEFAULT '{}',
  excerpt TEXT,
  featured_image TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  language TEXT NOT NULL DEFAULT 'ko' CHECK (language IN ('ko', 'en')),
  meta_title TEXT,
  meta_description TEXT,
  view_count INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  search_vector tsvector
);

-- 3. blog_tags: 태그
CREATE TABLE IF NOT EXISTS blog_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. blog_post_tags: 포스트-태그 다대다
CREATE TABLE IF NOT EXISTS blog_post_tags (
  post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES blog_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- ==============================================
-- 인덱스
-- ==============================================
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_search ON blog_posts USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_blog_tags_slug ON blog_tags(slug);

-- ==============================================
-- 트리거: updated_at 자동 갱신
-- ==============================================
CREATE OR REPLACE FUNCTION update_blog_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_posts_updated_at();

-- ==============================================
-- 트리거: search_vector 자동 생성
-- ==============================================
CREATE OR REPLACE FUNCTION update_blog_posts_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector = to_tsvector('simple', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.excerpt, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_blog_posts_search_vector
  BEFORE INSERT OR UPDATE OF title, excerpt ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_posts_search_vector();

-- ==============================================
-- RLS 정책
-- ==============================================

-- blog_categories: 누구나 읽기, service_role만 쓰기
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blog_categories_select" ON blog_categories
  FOR SELECT USING (true);

CREATE POLICY "blog_categories_insert" ON blog_categories
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "blog_categories_update" ON blog_categories
  FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "blog_categories_delete" ON blog_categories
  FOR DELETE USING (auth.role() = 'service_role');

-- blog_posts: 발행된 글만 공개, 작성자만 CUD
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blog_posts_select_published" ON blog_posts
  FOR SELECT USING (status = 'published' OR author_id = auth.uid());

CREATE POLICY "blog_posts_insert" ON blog_posts
  FOR INSERT WITH CHECK (author_id = auth.uid());

CREATE POLICY "blog_posts_update" ON blog_posts
  FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "blog_posts_delete" ON blog_posts
  FOR DELETE USING (author_id = auth.uid());

-- blog_tags: 누구나 읽기, service_role만 쓰기
ALTER TABLE blog_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blog_tags_select" ON blog_tags
  FOR SELECT USING (true);

CREATE POLICY "blog_tags_insert" ON blog_tags
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "blog_tags_update" ON blog_tags
  FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "blog_tags_delete" ON blog_tags
  FOR DELETE USING (auth.role() = 'service_role');

-- blog_post_tags: 포스트와 동일 권한
ALTER TABLE blog_post_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blog_post_tags_select" ON blog_post_tags
  FOR SELECT USING (true);

CREATE POLICY "blog_post_tags_insert" ON blog_post_tags
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM blog_posts WHERE id = post_id AND author_id = auth.uid())
  );

CREATE POLICY "blog_post_tags_delete" ON blog_post_tags
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM blog_posts WHERE id = post_id AND author_id = auth.uid())
  );

-- ==============================================
-- 기본 카테고리 시드
-- ==============================================
INSERT INTO blog_categories (name_ko, name_en, slug, color, sort_order) VALUES
  ('암호화폐', 'Cryptocurrency', 'cryptocurrency', '#f59e0b', 1),
  ('주식', 'Stocks', 'stocks', '#10b981', 2),
  ('투자 전략', 'Investment Strategy', 'investment-strategy', '#6366f1', 3),
  ('시장 분석', 'Market Analysis', 'market-analysis', '#ef4444', 4),
  ('기술', 'Technology', 'technology', '#3b82f6', 5),
  ('일상', 'Daily Life', 'daily-life', '#ec4899', 6),
  ('기타', 'Others', 'others', '#8b5cf6', 7)
ON CONFLICT (slug) DO NOTHING;
