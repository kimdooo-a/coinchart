# PHASE8_DEPLOY_CLAUDE_CODE_PROMPT_20251227

## Phase 8 — Deployment Docs Compliance & Consistency (Templates Cleanup)

**Agent**: CLAUDE_CODE
**Execution Order**: 3 / 4
**Mode**: PARALLEL
**Blocking Dependency**: None

---

## SSOT Principle
- 배포/운영 문서는 "현재 실제 구조"만 반영
- 과거 템플릿(예: Python orchestrator 언급) 제거/수정

## Global Rules (MANDATORY)
- 코드 수정 금지 (문서/텍스트만)
- 금지 표현 유지: 예측/보장/확실/AI투자비서 류 금지
- 운영 문서는 실행 가능(명령어/경로/파일명 명시)해야 함

---

## Goal
배포/운영 문서가 오해 없이 안전하며, 실제 구조(daily_cron wrapper -> batch_orchestrator single engine)를 정확히 반영하도록 정리한다.

---

## Execution Steps

1. **템플릿/체크리스트 문서에서 "옛 구조" 언급 탐지 및 수정 목록 작성**
   - Python orchestrator.py 언급 찾기
   - 실제 구조(TypeScript batch_orchestrator.ts)와 불일치 항목 식별
   - 수정 필요 목록 작성 (BEFORE/AFTER)

2. **DEPLOYMENT_RUNBOOK/ENV_REQUIRED에 금지 문구 없는지 점검**
   - 예측, 보장, 확실, 권유, 추천 등 금지 표현 검색
   - 금지 문구 발견 시 수정안 제시

3. **운영 플래그(Disable flags) 문구가 과장/권유 없이 "운영 대응"으로만 표현되는지 확인**
   - NEXT_PUBLIC_DISABLE_AUTOMATION 설명 점검
   - NEXT_PUBLIC_DISABLE_PRO_GATE 설명 점검
   - 과장/권유 표현 없이 사실적 기능 설명만 있는지 확인

4. **최종 PASS/WARN/FAIL 판정**
   - FAIL이면 수정해야 할 문장(전/후) 제시 (문서만)

---

## Documents to Review

**Root Project 배포 문서:**
- `docs/DEPLOYMENT_RUNBOOK.md`
- `docs/ENV_REQUIRED.md`

**poly-tech2 템플릿 문서:**
- `kdy-addon/Poly-Tech2/docs/70_AUTOMATION/compliance/compliance_checklist.md`
- `kdy-addon/Poly-Tech2/docs/70_AUTOMATION/USER_GUIDE.md`
- `kdy-addon/Poly-Tech2/docs/50_TEMPLATES/PROJECT_INSTALL_CHECKLIST.md`
- `kdy-addon/Poly-Tech2/docs/50_TEMPLATES/PROJECT_SETUP_CHECKLIST.md`
- `kdy-addon/Poly-Tech2/docs/50_TEMPLATES/PROJECT_UPDATE_CHECKLIST.md`

---

## Expected Output
- PROMPT 기록 1건
- RESULT: 문서 정합성/컴플라이언스 리포트 (PASS/WARN/FAIL)

---

**Date**: 2025-12-27
**Agent**: CLAUDE_CODE
