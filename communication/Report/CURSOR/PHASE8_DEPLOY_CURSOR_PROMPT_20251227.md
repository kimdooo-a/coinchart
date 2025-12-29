# PHASE8_DEPLOY_CURSOR_PROMPT_20251227.md

## Phase 8 — Secrets & Env & Pipeline Change Trace (No-Secret-In-Repo Audit) — Prompt

### 요청 사항

**SSOT:**
- 시크릿은 repo 외부(Platform secrets)에만 존재
- repo에는 "스키마/템플릿/변수명"만 존재

**GLOBAL RULES (MANDATORY):**
- 코드 수정 금지
- 실제 변경된 파일/라인만 기록
- 시크릿 노출(값/토큰/URL) 기록 금지 (변수명만)

**AUTO-LOG:**
- 경로: `F:\11 dev\251206 코인 차트분석\communication\Report\CURSOR\`
- 파일명:
  - `PHASE8_DEPLOY_CURSOR_PROMPT_20251227.md` (이 파일)
  - `PHASE8_DEPLOY_CURSOR_RESULT_20251227.md` (결과 보고서)

**GOAL:**
- Phase 8에서 추가된 배포/환경/게이트 관련 변경을
  파일·라인 단위로 추적하고 "시크릿 커밋 0"을 검증한다.

**VERIFICATION STEPS:**
1) .env.example / ENV_REQUIRED.md / RUNBOOK 등 문서 변경 추적
2) GitHub Actions 워크플로 변경 추적 (schedule, env, secrets 참조)
3) preflight/healthcheck 스크립트 추가 여부 확인

**OUTPUT:**
- PROMPT 기록 1건 (이 파일)
- RESULT 검증 리포트 (시크릿 노출 여부, 파일/라인 단위 추적)

---

## 요청 일시
- 2025-12-27

## 요청자
- Cursor AI Agent

## 작업 범위
- Phase 8: Secrets & Env & Pipeline Change Trace
- No-Secret-In-Repo Audit

