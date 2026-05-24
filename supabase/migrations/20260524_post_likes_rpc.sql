-- ==============================================
-- 게시글 추천/비추 분리 집계 + 회원전이 dedup 토글 RPC
-- 2026-05-24 / R3 (community-finish) / T07
-- 선행: 20260523_create_community_tables.sql (community_post_likes, 트리거)
--
-- 배경:
--   - community_posts.like_count 컬럼은 트리거(trg_community_post_likes_count)가
--     SUM(value) 순합산(추천 − 비추, 음수 가능)으로 유지 → 인기순 정렬용. 그대로 둔다.
--   - 본 마이그레이션은 (1) 추천/비추 "분리 집계"와 (2) 회원전이 dedup을 포함한
--     "원자적 토글"을 RPC로 제공한다. like_count 컬럼 의미·트리거는 변경하지 않는다.
-- ==============================================

-- ----------------------------------------------
-- 1. community_post_like_counts(p_post_id): 추천/비추 분리 집계 (읽기 전용)
--   - like_count    = value=1 합  (추천 수, 항상 ≥ 0)
--   - dislike_count = value=-1 합 (비추 수, 항상 ≥ 0)
--   - community_posts.like_count(SUM(value) 순합산)과는 별개의 분리 집계값
-- ----------------------------------------------
CREATE OR REPLACE FUNCTION community_post_like_counts(p_post_id UUID)
RETURNS TABLE (like_count BIGINT, dislike_count BIGINT)
LANGUAGE sql
STABLE
AS $$
  SELECT
    COALESCE(SUM(CASE WHEN value = 1  THEN 1 ELSE 0 END), 0)::BIGINT AS like_count,
    COALESCE(SUM(CASE WHEN value = -1 THEN 1 ELSE 0 END), 0)::BIGINT AS dislike_count
  FROM community_post_likes
  WHERE post_id = p_post_id;
$$;

COMMENT ON FUNCTION community_post_like_counts(UUID) IS
  '게시글 추천/비추 분리 집계 — like_count=value1 합, dislike_count=value-1 합 (R3/T07)';

-- ----------------------------------------------
-- 2. community_toggle_post_like(...): 원자적 추천/비추 토글 + 회원전이 dedup
--   파라미터:
--     p_post_id  게시글 UUID
--     p_user_id  회원이면 auth.users.id, 익명이면 NULL
--     p_ip_hash  익명 dedup 키 / 회원전이 흡수 키 (회원도 항상 전달 권장)
--     p_value    1(추천) 또는 -1(비추)
--   회원전이 dedup (p_user_id·p_ip_hash 모두 있을 때):
--     동일 글에 본인 ip_hash로 남긴 익명 추천 행이 있으면
--       · 회원 행이 아직 없음 → 익명 행을 user_id로 승계(UPDATE, value 보존 → 카운트 불변)
--       · 회원 행이 이미 있음 → 익명 중복 행 삭제(정리, 트리거가 like_count 정정)
--   토글:
--     기존 표 없음 → INSERT
--     기존 value == p_value → DELETE (취소)
--     기존 value != p_value → UPDATE (추천↔비추 전환)
--   반환: liked(최종 추천 활성 여부), like_count·dislike_count(분리 집계)
--   주의: community_posts.like_count 컬럼은 기존 트리거가 자동 갱신하므로 본 함수에서 손대지 않음.
--         함수 전체가 단일 트랜잭션이라 dedup→토글→집계가 원자적으로 처리됨.
-- ----------------------------------------------
CREATE OR REPLACE FUNCTION community_toggle_post_like(
  p_post_id UUID,
  p_user_id UUID,
  p_ip_hash TEXT,
  p_value SMALLINT
)
RETURNS TABLE (liked BOOLEAN, like_count BIGINT, dislike_count BIGINT)
LANGUAGE plpgsql
AS $$
DECLARE
  v_existing community_post_likes%ROWTYPE;
  v_liked BOOLEAN := false;
BEGIN
  -- 입력 방어 (라우트에서도 검증하지만 RPC 단독 호출 대비)
  IF p_value NOT IN (-1, 1) THEN
    RAISE EXCEPTION 'value must be 1 or -1, got %', p_value;
  END IF;
  IF p_user_id IS NULL AND p_ip_hash IS NULL THEN
    RAISE EXCEPTION 'user_id or ip_hash required';
  END IF;

  -- (A) 회원전이 dedup: 회원 요청 + ip_hash 보유 시 익명 행 흡수/정리
  IF p_user_id IS NOT NULL AND p_ip_hash IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM community_post_likes
      WHERE post_id = p_post_id AND user_id = p_user_id
    ) THEN
      -- 회원 행이 이미 있음 → 익명 중복 행 정리 (트리거가 like_count -OLD.value 정정)
      DELETE FROM community_post_likes
      WHERE post_id = p_post_id AND ip_hash = p_ip_hash AND user_id IS NULL;
    ELSE
      -- 회원 행 없음 → 익명 행을 회원 행으로 승계 (value 보존 → 카운트 변동 없음)
      -- ip_hash를 NULL로 비워 익명 unique 인덱스에서 제외, user_id 부여로 회원 dedup 편입
      UPDATE community_post_likes
      SET user_id = p_user_id, ip_hash = NULL
      WHERE post_id = p_post_id AND ip_hash = p_ip_hash AND user_id IS NULL;
    END IF;
  END IF;

  -- (B) 기존 표 조회 (식별 단위: 회원=user_id / 익명=ip_hash)
  IF p_user_id IS NOT NULL THEN
    SELECT * INTO v_existing
    FROM community_post_likes
    WHERE post_id = p_post_id AND user_id = p_user_id;
  ELSE
    SELECT * INTO v_existing
    FROM community_post_likes
    WHERE post_id = p_post_id AND ip_hash = p_ip_hash AND user_id IS NULL;
  END IF;

  -- (C) 토글
  IF v_existing.id IS NOT NULL THEN
    IF v_existing.value = p_value THEN
      DELETE FROM community_post_likes WHERE id = v_existing.id;       -- 취소
      v_liked := false;
    ELSE
      UPDATE community_post_likes SET value = p_value WHERE id = v_existing.id; -- 추천↔비추 전환
      v_liked := (p_value = 1);
    END IF;
  ELSE
    INSERT INTO community_post_likes (post_id, user_id, ip_hash, value)
    VALUES (
      p_post_id,
      p_user_id,
      CASE WHEN p_user_id IS NOT NULL THEN NULL ELSE p_ip_hash END,
      p_value
    );
    v_liked := (p_value = 1);
  END IF;

  -- (D) 분리 집계 반환 (토글 반영 후 재집계)
  RETURN QUERY
  SELECT
    v_liked,
    COALESCE(SUM(CASE WHEN cpl.value = 1  THEN 1 ELSE 0 END), 0)::BIGINT,
    COALESCE(SUM(CASE WHEN cpl.value = -1 THEN 1 ELSE 0 END), 0)::BIGINT
  FROM community_post_likes cpl
  WHERE cpl.post_id = p_post_id;
END;
$$;

COMMENT ON FUNCTION community_toggle_post_like(UUID, UUID, TEXT, SMALLINT) IS
  '추천/비추 원자적 토글 + 회원전이 dedup(익명→회원 승계/정리). 반환=liked·분리집계 (R3/T07)';
