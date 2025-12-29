# PHASE8_1_RELEASE_CURSOR_PROMPT_20251227.md

## Phase 8.1 — Release Policy Audit (SemVer Tags + Notes Template + Changelog) — Prompt

### 요청 사항

**SSOT:**
- 태그는 vX.Y.Z만 허용
- 릴리즈 노트는 템플릿 고정
- changelog는 버전 섹션 구조 고정

**GLOBAL RULES (MANDATORY):**
- 코드 수정 금지
- 문서/파일 기준으로만 PASS/FAIL 판정
- 시크릿 값 기록 금지

**AUTO-LOG:**
- 경로: `F:\11 dev\251206 코인 차트분석\communication\Report\CURSOR\`
- 파일명:
  - `PHASE8_1_RELEASE_CURSOR_PROMPT_20251227.md` (이 파일)
  - `PHASE8_1_RELEASE_CURSOR_RESULT_20251227.md` (결과 보고서)

**GOAL:**
- 릴리즈 규칙이 실제로 강제 가능한 형태인지 감사하고,
  운영 혼선을 유발할 "문서/파일 불일치"를 탐지한다.

**VERIFICATION STEPS:**
1) docs/RELEASE_VERSIONING.md 존재/내용 점검 (vX.Y.Z 규칙 명시 여부)
2) docs/RELEASE_NOTES_TEMPLATE.md 존재/섹션 고정 여부 점검
3) CHANGELOG.md 포맷 점검 ([Unreleased] + 버전별)
4) DEPLOYMENT_RUNBOOK.md에 릴리즈 절차 추가 여부 점검
5) 정합성 체크:
   - Phase 8에서 "있다고 주장된 파일"과 실제 파일이 불일치하는 항목 재확인(예: .env.example 이슈)
6) 최종 판정: PASS / FAIL (사유 명시)

**OUTPUT:**
- PROMPT 기록 1건 (이 파일)
- RESULT 감사 리포트 (PASS/FAIL + 발견된 불일치 목록)

---

## 요청 일시
- 2025-12-27

## 요청자
- Cursor AI Agent

## 작업 범위
- Phase 8.1: Release Policy Audit
- SemVer Tags + Notes Template + Changelog 검증

