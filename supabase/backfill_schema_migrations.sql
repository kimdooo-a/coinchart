-- supabase/backfill_schema_migrations.sql
-- 생성: 2026-05-25 / R6-polish T02 (마이그레이션 히스토리 정합 — 코드만)
--
-- ⚠️ 적용 금지(코드만): 이 파일은 작성만 되어 있고 운영 DB에 적용하지 않았습니다.
--    적용은 자격증명 보유자(사용자)가 정합 환경(config.toml + `supabase link` 완료)에서
--    `supabase db push` 후 SQL Editor 로, 또는 SQL Editor 에서 직접 수동 실행하십시오.
--    (런북: docs/db/R4-db-apply-runbook.md §9-4)
--
-- 목적: 운영 DB(enksnhshciyvllwfiwrm)에 객체는 이미 적용됐으나
--       supabase_migrations.schema_migrations 에 기록되지 않은 마이그레이션을,
--       T02에서 정규화한 14자리 version 기준으로 backfill 한다.
--
-- 배경: schema_migrations.version = 파일명 첫 숫자 토큰. T02에서 14개 파일 전부를
--       8자리 날짜 → 14자리 timestamp 로 정규화했으므로 backfill version 도 14자리 기준.
--       (런북 §9-2 운영 DB 실측 / §9-3 같은 날짜 version 충돌 진단 참조)

-- ─────────────────────────────────────────────────────────────────────
-- Part A. 커뮤니티 5종 — schema_migrations 에 전혀 미기록 (런북 §9-2 / §9-4 (3))
--         객체 자체는 세션 29에서 Management API 로 이미 운영 DB에 적용 완료.
--         이 INSERT 는 '히스토리 기록'만 보충한다.
-- ─────────────────────────────────────────────────────────────────────
INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES
  ('20260523000001', 'create_community_tables'),
  ('20260523000002', 'alter_news_classify'),
  ('20260523000003', 'create_hot_issues_rpc'),
  ('20260524000001', 'comment_likes'),
  ('20260524000002', 'post_likes_rpc')
ON CONFLICT (version) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────
-- Part B. (선택 — 완전 정합 시에만 실행) 비-커뮤니티 9종
--   T02 정규화로 파일명이 8→14자리로 바뀌면서, 운영 DB schema_migrations 의
--   기존 8자리 날짜 version 6행(b-1)과 새 14자리 파일명이 더 이상 매칭되지 않는다.
--   `supabase migration list` 가 이 9종을 '미적용'으로 표시하지 않으려면(= version 정합)
--   아래를 실행해 8자리 행을 14자리로 재기록한다.
--   ⚠️ 운영 DB의 실제 객체(테이블/함수/트리거)는 모두 이미 존재한다 — 아래는 '기록'만 정정한다.
--   Part A 만으로도 커뮤니티 정합은 충분하므로, 기존 6행 정정이 불필요하면 Part B 는 건너뛴다.
--
-- b-1. 정규화 전 8자리 version 6행 제거.
--      운영 DB 실측(런북 §9-2): 20241213, 20241214, 20251227, 20260114, 20260308, 20260309.
DELETE FROM supabase_migrations.schema_migrations
 WHERE version IN ('20241213', '20241214', '20251227', '20260114', '20260308', '20260309');

-- b-2. 14자리 정규화 version 으로 9종 재기록.
--      (20241213/20241214 는 날짜당 1행만 기록돼 있었으나, 같은 날짜 다중 파일을
--       모두 정규화했으므로 9종 전체를 기록한다.)
INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES
  ('20241213000001', 'init_market_prices'),
  ('20241213000002', 'update_cleanup_and_forex'),
  ('20241213000003', 'auto_cleanup'),
  ('20241214000001', 'news_archive'),
  ('20241214000002', 'add_news_language'),
  ('20251227000001', 'create_stock_prices'),
  ('20260114000001', 'create_secure_memos'),
  ('20260308000001', 'create_blog_tables'),
  ('20260309000001', 'blog_content_to_html')
ON CONFLICT (version) DO NOTHING;
