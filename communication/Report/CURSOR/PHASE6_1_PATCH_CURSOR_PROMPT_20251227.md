# PHASE6_1_PATCH_CURSOR_PROMPT_20251227.md

## Phase 6.1 PATCH — Compliance Wording Fix (translations.ts & Guide) — Prompt

### 요청 사항

**SSOT:**
- 문구/텍스트만 수정
- 기능/로직 변경 금지

**GLOBAL RULES (MANDATORY):**
- 코드 로직 수정 금지
- 텍스트 리터럴만 수정
- Claude Code 지정 FROM → TO를 그대로 적용

**AUTO-LOG:**
- 경로: `F:\11 dev\251206 코인 차트분석\communication\Report\CURSOR\`
- 파일명:
  - `PHASE6_1_PATCH_CURSOR_PROMPT_20251227.md` (이 파일)
  - `PHASE6_1_PATCH_CURSOR_RESULT_20251227.md` (결과 보고서)

**GOAL:**
- 컴플라이언스 FAIL(필수 4건) 제거 + WARN(2건) 완화

**PATCH ITEMS (MUST DO):**
1. lib/translations.ts (필수 4건)
   - '인공지능 투자 비서' → '시장 분석 도우미'
   - '인공지능이 분석해 드립니다' → '통계적으로 분석합니다'
   - '인공지능이 가려드립니다' → '심리 분석으로 분류합니다'
   - 'AI 분석 지표' → '알고리즘 분석 지표'
2. TradingStrategyGuide.tsx (권장 2건)
   - '추천하며' → '유리할 수 있으며'
   - '손절은 -5.0% 추천' → '손절 기준: -5.0%'

**OUTPUT:**
- PROMPT 기록 1건 (이 파일)
- RESULT: 수정 파일/수정 문자열 목록(전후) 포함

---

## 요청 일시
- 2025-12-27

## 요청자
- Cursor AI Agent

## 작업 범위
- Phase 6.1 PATCH: Compliance Wording Fix
- 컴플라이언스 문구 수정

## 실행 순서
- ORDER: 1 / 3
- MODE: PARALLEL
- BLOCKING_DEPENDENCY: 없음

