-- ==============================================
-- R1 (2026-05-23) — 핫이슈 집계 RPC
-- ==============================================
-- 메인페이지 사이드바 HotIssueWidget의 실데이터 공급용 RPC.
-- 최근 N시간 내 community_posts.coin_symbol 빈도를 카운트하고
-- 최근 N시간 vs 직전 N시간(=N*2~N 시간 전) 추세를 비교하여
-- "UP / DOWN / FLAT / NEW" 트렌드와 정렬용 score를 반환한다.
--
-- 의존: 20260523_create_community_tables.sql (community_posts)
-- ==============================================

CREATE OR REPLACE FUNCTION community_hot_issues(
  hours_window int DEFAULT 24,
  result_limit int DEFAULT 10
)
RETURNS TABLE (
  symbol text,
  recent_count bigint,
  prev_count bigint,
  trend text,    -- "UP" | "DOWN" | "FLAT" | "NEW"
  score numeric  -- 정렬용 (recent + prev * 0.3)
) AS $$
BEGIN
  RETURN QUERY
  WITH recent AS (
    SELECT coin_symbol, COUNT(*) AS cnt
    FROM community_posts
    WHERE is_deleted = false
      AND coin_symbol IS NOT NULL
      AND created_at >= NOW() - (hours_window || ' hours')::interval
    GROUP BY coin_symbol
  ),
  prev AS (
    SELECT coin_symbol, COUNT(*) AS cnt
    FROM community_posts
    WHERE is_deleted = false
      AND coin_symbol IS NOT NULL
      AND created_at >= NOW() - (hours_window * 2 || ' hours')::interval
      AND created_at <  NOW() - (hours_window     || ' hours')::interval
    GROUP BY coin_symbol
  )
  SELECT
    r.coin_symbol AS symbol,
    r.cnt AS recent_count,
    COALESCE(p.cnt, 0) AS prev_count,
    CASE
      WHEN p.cnt IS NULL OR p.cnt = 0 THEN 'NEW'
      WHEN r.cnt::numeric / GREATEST(p.cnt, 1) > 1.2 THEN 'UP'
      WHEN r.cnt::numeric / GREATEST(p.cnt, 1) < 0.8 THEN 'DOWN'
      ELSE 'FLAT'
    END AS trend,
    r.cnt::numeric + COALESCE(p.cnt, 0)::numeric * 0.3 AS score
  FROM recent r
  LEFT JOIN prev p ON p.coin_symbol = r.coin_symbol
  ORDER BY score DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION community_hot_issues(int, int) IS
  '커뮤니티 핫이슈 집계: 최근 N시간 코인 태그 빈도 + 직전 동일 윈도우 대비 트렌드 분류 (UP/DOWN/FLAT/NEW). 임계: 1.2배↑=UP, 0.8배↓=DOWN.';

-- 권한: anon · authenticated 모두 호출 가능 (캐시 5분, RLS는 community_posts SELECT 정책으로 강제)
GRANT EXECUTE ON FUNCTION community_hot_issues(int, int) TO anon, authenticated;
