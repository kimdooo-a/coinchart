-- R1 (2026-05-23) — 뉴스 룰베이스 분류 컬럼 추가
-- 소비자: app/api/admin/news-crawl (lib/news/classifier 호출 결과 저장),
--        app/api/news (메인 NewsRow 표시용 응답)
-- 의존: lib/news/classifier.ts (T05 산출물)

ALTER TABLE news
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'market'
    CHECK (category IN ('regulation','tech','exchange','onchain','etf','altcoin_news','macro','market'));

ALTER TABLE news
  ADD COLUMN IF NOT EXISTS importance_score smallint DEFAULT 5
    CHECK (importance_score BETWEEN 1 AND 10);

ALTER TABLE news
  ADD COLUMN IF NOT EXISTS sentiment_score integer DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_news_category_pubdate ON news(category, pub_date DESC);
CREATE INDEX IF NOT EXISTS idx_news_importance ON news(importance_score DESC, pub_date DESC);
