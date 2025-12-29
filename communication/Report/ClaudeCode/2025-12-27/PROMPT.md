# [PHASE 2 | SEQUENTIAL - STEP 4] TO_CLAUDE_CODE — Intelligence Blueprint (Design Only)

**Date**: 2025-12-27
**Agent**: Claude Code
**Phase**: 2 | Step 4

---

## Preconditions (SSOT)

- HANDOVER Current 문서 기준: Phase 2 / STEP 4 진행
- Worksystem/Playbook의 Non-Negotiables/Report 규칙 준수
- 허용 수정 범위 참고(단, 이번 Step은 "설계만", 코드 수정 금지)

---

## Non-Negotiables (Hard Rules)

- 구현(코드 변경) 금지: 설계(blueprint)만 작성
- 토큰 과금 AI API 호출 전면 금지 / Watcher 미사용
- "AI/인공지능 예측" 표현 금지: probability-based/statistical/historical validation 표현만 사용
- Report 없으면 작업 미수행으로 간주

---

## Mission (Single Goal)

- ChartMaster의 "확률(RISE/DROP) + 신뢰도(Confidence)" 산식/정의 재정의
- 백테스트 고급지표(MDD / Risk-Reward / Sharpe 등) 계산 설계
- 사용자 설명 템플릿(왜 관망/분할/손절)을 규칙 기반으로 설계

---

## Deliverables (Must Output)

1) **확률 모델 설계서**
   - 입력(feature) 정의
   - 산식(수식/의사코드 수준)
   - 신뢰도 산정 로직(데이터 품질/표본 수/최근성/변동성 등 반영)
   - Free vs PRO에서 노출/잠금되는 항목 명확히 구분

2) **백테스트 고급지표 설계서**
   - 각 지표의 정의/계산식
   - 최소 데이터 요구조건
   - 지표 해석 가이드(사용자 표시 문구 포함)

3) **"설명 템플릿(Explainability)" 규격**
   - 관망/분할/손절 각각에 대해
   - (근거 요약 → 리스크 → 다음 관찰 포인트) 3단 구조
   - 금지 표현(확정적 예측/자동매수/보장 등) 체크리스트 포함

---

## Report Output Format (Save-ready)

- `communication/Report/ClaudeCode/2025-12-27/`
  - PROMPT.md : 본 프롬프트 원문
  - RESULT.md : 아래 템플릿으로 작성

---

## RESULT.md Template

- 요약(5줄)
- 설계 결정사항(핵심 bullet)
- 확률/신뢰도 산식(의사코드/수식)
- 백테스트 지표 정의/계산 요약
- 사용자 설명 템플릿(관망/분할/손절)
- 리스크/보류사항
- 다음 Step 체크리스트(Phase 3 구현 시 필요한 입력)

---

## Stop Condition

- 위 Deliverables 3종 + RESULT.md 템플릿 충족하면 즉시 종료(추가 확장 금지)

---

**Prompt Status**: RECORDED
