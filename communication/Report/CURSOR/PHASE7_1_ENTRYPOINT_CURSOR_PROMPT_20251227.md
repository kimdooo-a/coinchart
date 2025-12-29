# PHASE7_1_ENTRYPOINT_CURSOR_PROMPT_20251227.md

## Phase 7.1 — Batch Entry Point Duplication Verification — Prompt

### 요청 사항

**SSOT:**
- batch_orchestrator.ts = 유일한 배치 엔진

**GLOBAL RULES (MANDATORY):**
- 코드 수정 금지
- 실제 파일 기준으로만 판단
- 추정/의견 기록 금지

**AUTO-LOG:**
- 경로: `F:\11 dev\251206 코인 차트분석\communication\Report\CURSOR\`
- 파일명:
  - `PHASE7_1_ENTRYPOINT_CURSOR_PROMPT_20251227.md` (이 파일)
  - `PHASE7_1_ENTRYPOINT_CURSOR_RESULT_20251227.md` (결과 보고서)

**GOAL:**
- 배치가 orchestrator 단일 엔트리포인트로만 실행되는지 검증

**VERIFICATION STEPS:**
1) batch_orchestrator.ts 외 배치 실행 파일 존재 여부 점검
2) daily_cron.ts가 orchestrator만 호출하는지 확인
3) GitHub Actions yml에서 실행 대상 파일 확인
4) 수동 실행(workflow_dispatch) 경로 중복 여부 점검
5) 중복 엔트리포인트:
   - 존재하면 파일/라인 명시
   - 없으면 "NONE" 명시

**OUTPUT:**
- PROMPT 기록 1건 (이 파일)
- RESULT 검증 리포트 (PASS / FAIL)

---

## 요청 일시
- 2025-12-27

## 요청자
- Cursor AI Agent

## 작업 범위
- Phase 7.1: Batch Entry Point Duplication Verification
- 배치 엔트리포인트 중복 검증

