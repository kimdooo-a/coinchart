-- ==============================================
-- 댓글 추천/비추 분리 집계 + 회원전이 dedup 토글 RPC
-- 2026-06-13 / R9 (gap-verify) / T03
-- 선행: 20260524000001_comment_likes.sql (community_comment_likes 테이블/트리거/RLS/유니크 인덱스)
--
-- 배경:
--   - 게시글 좋아요는 community_toggle_post_like RPC로 통일(원자적 토글 + 회원전이 dedup)되었으나,
--     댓글 좋아요만 라우트 핸들러가 community_comment_likes를 직접 CUD하여 회원전이 dedup이 미실장이었다.
--   - 본 마이그레이션은 20260524000002_post_likes_rpc.sql의 community_toggle_post_like를 그대로 차용해
--     댓글용 토글 RPC를 신설, 이 비대칭을 해소한다. (post_id→comment_id, community_post_likes→community_comment_likes)
--   - community_comments.like_count 컬럼은 기존 트리거(trg_community_comment_likes_count)가
--     SUM(value) 순합산으로 유지하므로 본 함수에서 직접 손대지 않는다(post 패턴과 동일).
-- ==============================================

-- ----------------------------------------------
-- community_toggle_comment_like(...): 원자적 추천/비추 토글 + 회원전이 dedup
--   파라미터:
--     p_comment_id 댓글 UUID
--     p_user_id    회원이면 auth.users.id, 익명이면 NULL
--     p_ip_hash    익명 dedup 키 / 회원전이 흡수 키 (회원도 항상 전달 권장)
--     p_value      1(추천) 또는 -1(비추)
--   회원전이 dedup (p_user_id·p_ip_hash 모두 있을 때):
--     동일 댓글에 본인 ip_hash로 남긴 익명 추천 행이 있으면
--       · 회원 행이 아직 없음 → 익명 행을 user_id로 승계(UPDATE, value 보존 → 카운트 불변)
--       · 회원 행이 이미 있음 → 익명 중복 행 삭제(정리, 트리거가 like_count 정정)
--   토글:
--     기존 표 없음 → INSERT
--     기존 value == p_value → DELETE (취소)
--     기존 value != p_value → UPDATE (추천↔비추 전환)
--   반환: liked(최종 추천 활성 여부), like_count·dislike_count(분리 집계)
--   주의: community_comments.like_count 컬럼은 기존 트리거가 자동 갱신하므로 본 함수에서 손대지 않음.
--         함수 전체가 단일 트랜잭션이라 dedup→토글→집계가 원자적으로 처리됨.
-- ----------------------------------------------

-- 멱등: 반환 타입(시그니처) 변경 시 CREATE OR REPLACE 충돌 대비 선행 DROP
DROP FUNCTION IF EXISTS community_toggle_comment_like(UUID, UUID, TEXT, SMALLINT);

CREATE OR REPLACE FUNCTION community_toggle_comment_like(
  p_comment_id UUID,
  p_user_id UUID,
  p_ip_hash TEXT,
  p_value SMALLINT
)
RETURNS TABLE (liked BOOLEAN, like_count BIGINT, dislike_count BIGINT)
LANGUAGE plpgsql
AS $$
DECLARE
  v_existing community_comment_likes%ROWTYPE;
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
      SELECT 1 FROM community_comment_likes
      WHERE comment_id = p_comment_id AND user_id = p_user_id
    ) THEN
      -- 회원 행이 이미 있음 → 익명 중복 행 정리 (트리거가 like_count -OLD.value 정정)
      DELETE FROM community_comment_likes
      WHERE comment_id = p_comment_id AND ip_hash = p_ip_hash AND user_id IS NULL;
    ELSE
      -- 회원 행 없음 → 익명 행을 회원 행으로 승계 (value 보존 → 카운트 변동 없음)
      -- ip_hash를 NULL로 비워 익명 unique 인덱스에서 제외, user_id 부여로 회원 dedup 편입
      UPDATE community_comment_likes
      SET user_id = p_user_id, ip_hash = NULL
      WHERE comment_id = p_comment_id AND ip_hash = p_ip_hash AND user_id IS NULL;
    END IF;
  END IF;

  -- (B) 기존 표 조회 (식별 단위: 회원=user_id / 익명=ip_hash)
  IF p_user_id IS NOT NULL THEN
    SELECT * INTO v_existing
    FROM community_comment_likes
    WHERE comment_id = p_comment_id AND user_id = p_user_id;
  ELSE
    SELECT * INTO v_existing
    FROM community_comment_likes
    WHERE comment_id = p_comment_id AND ip_hash = p_ip_hash AND user_id IS NULL;
  END IF;

  -- (C) 토글
  IF v_existing.id IS NOT NULL THEN
    IF v_existing.value = p_value THEN
      DELETE FROM community_comment_likes WHERE id = v_existing.id;       -- 취소
      v_liked := false;
    ELSE
      UPDATE community_comment_likes SET value = p_value WHERE id = v_existing.id; -- 추천↔비추 전환
      v_liked := (p_value = 1);
    END IF;
  ELSE
    INSERT INTO community_comment_likes (comment_id, user_id, ip_hash, value)
    VALUES (
      p_comment_id,
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
    COALESCE(SUM(CASE WHEN ccl.value = 1  THEN 1 ELSE 0 END), 0)::BIGINT,
    COALESCE(SUM(CASE WHEN ccl.value = -1 THEN 1 ELSE 0 END), 0)::BIGINT
  FROM community_comment_likes ccl
  WHERE ccl.comment_id = p_comment_id;
END;
$$;

COMMENT ON FUNCTION community_toggle_comment_like(UUID, UUID, TEXT, SMALLINT) IS
  '댓글 추천/비추 원자적 토글 + 회원전이 dedup(익명→회원 승계/정리). 반환=liked·분리집계 (R9/T03)';
