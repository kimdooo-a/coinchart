# PHASE8_1_RELEASE_CLAUDE_CODE_PROMPT_20251227

## Phase 8.1 — Release Notes Template Compliance Review (Fixed Wording)

**Agent**: CLAUDE_CODE
**Execution Order**: 3 / 4
**Mode**: PARALLEL
**Blocking Dependency**: None

---

## SSOT Principle
- 릴리즈 노트는 운영/검증/롤백 중심
- 과장/권유/예측/보장 표현 금지

## Global Rules (MANDATORY)
- 코드 수정 금지
- 템플릿 문구만 검수
- "운영자 시점"으로만 작성되었는지 확인

---

## Goal
RELEASE_NOTES_TEMPLATE.md가 제품/투자 오해를 유발하지 않고, 운영/안전/검증 중심의 문구로 고정되었는지 검수한다.

---

## Execution Steps

1. **금지 표현 검사**
   - 예측, 보장, 확실, 권유, 추천, 수익 등 금지 표현 검색
   - 한국어/영어 모두 검사

2. **Verification / Rollback 섹션 문구 확인**
   - 실행 가능한 명령어/체크리스트 포함 여부
   - 모호한 표현 없이 구체적인 절차 제공 여부

3. **운영 플래그(Kill Switch) 언급 확인**
   - 과장 없이 사실적으로 작성되었는지
   - 마케팅 표현 없이 운영 상황 설명만 있는지

4. **최종 판정**
   - PASS / WARN / FAIL
   - FAIL이면 수정 제안은 "문장 전/후"로만 제시 (문서만)

---

## Target Document
- `docs/RELEASE_NOTES_TEMPLATE.md`
- `docs/RELEASE_VERSIONING.md` (참고용)

---

## Expected Output
- PROMPT 기록 1건
- RESULT 컴플라이언스 검수 리포트

---

**Date**: 2025-12-27
**Agent**: CLAUDE_CODE
