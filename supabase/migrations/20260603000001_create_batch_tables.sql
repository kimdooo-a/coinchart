-- ==============================================
-- daily-cron 배치 출력 테이블 마이그레이션 (PGRST205 해소)
-- 2026-06-03 / 세션 47 — kdyswarm T1
-- ==============================================
-- daily-cron 배치(scripts/batch_analysis.ts·scripts/alert_engine.ts)가
-- 결과를 저장하려는 3개 테이블이 운영 DB에 없어 PostgREST가 PGRST205
-- (스키마에 테이블 없음)를 반환한다. 코드 insert 컬럼을 SSOT로 삼아 생성.
--
-- 운영 배치(service_role) 전용 쓰기/읽기. anon/authenticated 불필요.
-- service_role은 RLS를 우회하므로 별도 정책 없이도 동작하나, 의도 명시를 위해
-- "service_role full access" 정책을 각 테이블에 추가한다(anon/auth 기본 차단).
--
-- 멱등 패턴: CREATE TABLE/INDEX IF NOT EXISTS, RLS는 DROP POLICY IF EXISTS 선행.
-- FK 순서: batch_runs 먼저 생성(나머지 둘이 참조).

-- ----------------------------------------------
-- 1. batch_runs: 배치 실행 메타 (PK = id text)
--   - scripts/batch_analysis.ts recordBatchStart(INSERT) / recordBatchComplete(UPDATE) / recordBatchFailed(UPDATE)
--   - id = `batch_${YYYYMMDDHHMMSS}`
-- ----------------------------------------------
CREATE TABLE IF NOT EXISTS batch_runs (
  id              TEXT PRIMARY KEY,                       -- batch_${YYYYMMDDHHMMSS}
  type            TEXT NOT NULL,                          -- 'daily' | 'weekly'
  run_date        DATE NOT NULL,
  started_at      TIMESTAMPTZ NOT NULL,
  status          TEXT NOT NULL,                          -- 'running' | 'completed' | 'failed'
  symbol_count    INTEGER NOT NULL,
  succeeded_count INTEGER NOT NULL DEFAULT 0,
  failed_count    INTEGER NOT NULL DEFAULT 0,
  alerts_sent     INTEGER NOT NULL DEFAULT 0,
  completed_at    TIMESTAMPTZ,                            -- 완료/실패 UPDATE 시 채움
  error_message   TEXT                                    -- 실패 시 사유
);

COMMENT ON TABLE batch_runs IS 'daily-cron 배치 실행 메타 (running→completed/failed 1행/실행)';
COMMENT ON COLUMN batch_runs.id IS 'batch_${YYYYMMDDHHMMSS} (코드 생성)';
COMMENT ON COLUMN batch_runs.type IS 'daily | weekly';
COMMENT ON COLUMN batch_runs.status IS 'running | completed | failed';

-- ----------------------------------------------
-- 2. batch_analysis_results: 분석 결과 (PK = uuid 자동)
--   - scripts/batch_analysis.ts 결과 저장 INSERT (id 미지정 → gen_random_uuid)
--   - batch_id FK → batch_runs(id) ON DELETE CASCADE
-- ----------------------------------------------
CREATE TABLE IF NOT EXISTS batch_analysis_results (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id    TEXT NOT NULL REFERENCES batch_runs(id) ON DELETE CASCADE,
  symbol      TEXT NOT NULL,
  asset_type  TEXT NOT NULL,                              -- 'crypto' | 'stock'
  result      JSONB NOT NULL,                             -- 분석 결과 전체
  analyzed_at TIMESTAMPTZ NOT NULL
);

COMMENT ON TABLE batch_analysis_results IS '배치 심볼별 분석 결과 (batch_runs 1:N)';
COMMENT ON COLUMN batch_analysis_results.asset_type IS 'crypto | stock';
COMMENT ON COLUMN batch_analysis_results.result IS '분석 결과 JSON 전체';

-- ----------------------------------------------
-- 3. alert_history: 알림 이력 (PK = id text)
--   - scripts/alert_engine.ts recordAlert(INSERT) / shouldSendAlert(SELECT)
--   - id = `alert_${ts}_${rand}`
--   - batch_id FK → batch_runs(id) ON DELETE CASCADE
--   - status CHECK 미적용: shouldSendAlert가 'pending'을 필터로 사용(fail-open),
--     스키마는 status 값을 제한하지 않는다(쿼리 호환).
-- ----------------------------------------------
CREATE TABLE IF NOT EXISTS alert_history (
  id           TEXT PRIMARY KEY,                          -- alert_${ts}_${rand}
  batch_id     TEXT NOT NULL REFERENCES batch_runs(id) ON DELETE CASCADE,
  symbol       TEXT NOT NULL,
  alert_id     TEXT NOT NULL,                             -- 알림 조건 ID
  priority     TEXT NOT NULL,                             -- 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  triggered_at TIMESTAMPTZ NOT NULL,
  message      TEXT NOT NULL,
  sent_at      TIMESTAMPTZ,                               -- status='sent'일 때만
  status       TEXT NOT NULL,                             -- 'sent' | 'failed' | 'skipped'
  reason       TEXT                                       -- 스킵/실패 사유
);

COMMENT ON TABLE alert_history IS '배치 알림 발송 이력 (중복방지 24h 윈도우 조회 대상)';
COMMENT ON COLUMN alert_history.priority IS 'LOW | MEDIUM | HIGH | CRITICAL';
COMMENT ON COLUMN alert_history.status IS 'sent | failed | skipped';

-- ==============================================
-- 인덱스 (조회 패턴 기반)
-- ==============================================
-- FK 조인 + 심볼별 최신 조회
CREATE INDEX IF NOT EXISTS idx_batch_analysis_results_batch
  ON batch_analysis_results (batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_analysis_results_symbol_analyzed
  ON batch_analysis_results (symbol, analyzed_at DESC);

-- FK 조인 + shouldSendAlert 중복확인(symbol+alert_id+triggered_at 범위)
CREATE INDEX IF NOT EXISTS idx_alert_history_batch
  ON alert_history (batch_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_symbol_alert_triggered
  ON alert_history (symbol, alert_id, triggered_at DESC);

-- batch_runs 일자/타입별 조회
CREATE INDEX IF NOT EXISTS idx_batch_runs_run_date
  ON batch_runs (run_date DESC);
CREATE INDEX IF NOT EXISTS idx_batch_runs_type_run_date
  ON batch_runs (type, run_date DESC);

-- ==============================================
-- RLS 정책 (service_role 전용 — anon/authenticated 기본 차단)
-- ==============================================
-- ⚠️ CREATE POLICY는 비멱등 → DROP POLICY IF EXISTS 선행으로 재적용 안전 보장.
-- service_role은 RLS를 우회하므로 배치는 정책 없이도 동작하나, 의도 명시 목적.

-- batch_runs
ALTER TABLE batch_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "batch_runs_service_role_all" ON batch_runs;
CREATE POLICY "batch_runs_service_role_all" ON batch_runs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- batch_analysis_results
ALTER TABLE batch_analysis_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "batch_analysis_results_service_role_all" ON batch_analysis_results;
CREATE POLICY "batch_analysis_results_service_role_all" ON batch_analysis_results
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- alert_history
ALTER TABLE alert_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "alert_history_service_role_all" ON alert_history;
CREATE POLICY "alert_history_service_role_all" ON alert_history
  FOR ALL TO service_role USING (true) WITH CHECK (true);
