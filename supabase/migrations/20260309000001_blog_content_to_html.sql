-- 블로그 콘텐츠 JSONB → TEXT 전환
-- 주의: 먼저 scripts/migrate-blog-content-to-html.ts로 데이터 변환 후 실행

-- 1. content 컬럼 타입을 text로 변경
-- 기존 JSONB 데이터가 이미 마이그레이션 스크립트로 HTML 문자열로 변환된 상태여야 함
ALTER TABLE blog_posts ALTER COLUMN content TYPE text USING content::text;

-- 2. content 기본값 설정
ALTER TABLE blog_posts ALTER COLUMN content SET DEFAULT '';
