# PROMPTS RECEIVED — CLAUDE CODE

**Date**: 2025-12-27
**Agent**: Claude Code
**Session**: Phase 0 → Phase 1

---

## Prompt 1: Bootstrap

```
kdy-addon\poly-tech2\readme.md
```

---

## Prompt 2: Project Analysis

```
[TO_CLAUDE_CODE]

Analyze:
- 코인 차트분석 프로젝트 전체를 기술/논리 관점에서 평가하라.

Focus:
1. 현재 아키텍처의 강점 / 병목 / 기술부채
2. "AI 분석"이 실제로 어디까지 구현되어 있고, 어디가 껍데기인지
3. 고도화 시 가장 파괴력이 큰 지점 TOP 5
   (정확도, 차별성, 확장성 기준)

Deliver:
- 기술 고도화 제안 목록 (우선순위 포함)
- 지금 당장 하면 안 되는 것 (위험요소)
- Commander(나)가 전략 설계 시 반드시 알아야 할 함정

Constraints:
- 코드 수정 금지
- 실행 금지
```

---

## Prompt 3: Report Documentation

```
[TO_CLAUDE_CODE]

Phase 0 Mission:
1) 너에게 전달된 모든 지시/프롬프트와 네 결과물을 "정리해서 기록"하라.
2) 기술/논리 측면에서 현재 프로젝트의 "AI 실체"를 정직하게 정리하고,
   유료 SaaS 수준으로 끌어올릴 설계를 제시하라.
3) Watcher는 사용하지 않는다.

Report Folder (CREATE):
- F:\11 dev\251206 코인 차트분석\communication\Report

Write Report File:
- F:\11 dev\251206 코인 차트분석\communication\Report\CLAUDE_CODE_REPORT_2025-12-27.md

Report Must Include:
A) Prompts Received Log
B) AI Reality Check:
- Rule-based(기술적 분석) vs ML(머신러닝) vs Mock 구분
C) Commander Warnings:
- 마케팅/정확도/백테스트 착시 등 "함정" 요약
D) Upgrade Blueprint (No paid AI API):
- "AI API 과금 금지" 하에서 가능한 고도화 방법들 (서버사이드/캐싱/품질/데이터 정직성/온체인 등)

Deliver:
- Report 작성 후 communication/TO_AGENT.md에 15줄 요약 업데이트
```

---

## Prompt 4: Phase 1 Blueprint

```
[TO_CLAUDE_CODE]

Non-Negotiables:
- Watcher 미사용. TO_AGENT.md에 어떤 CMD도 쓰지 말 것.
- 토큰 과금 AI API 호출 전부 금지.
- Report는 Root communication/Report에 기록.

0) Report Folder (ensure):
- F:\11 dev\251206 코인 차트분석\communication\Report

1) Phase 1 Blueprint 작성
Write:
- F:\11 dev\251206 코인 차트분석\communication\Report\PHASE1_CLAUDE_BLUEPRINT_2025-12-27.md

포함:
A) "AI" 표기/포지셔닝 정리:
- 현재는 규칙 기반 기술적 분석임을 명확히 (법/신뢰 리스크 방지)
B) 유료 API 없이 가능한 고도화 설계:
- 서버사이드 분석/캐싱/저장
- 로컬/온디바이스 ML 가능성(선택사항)
- 데이터 정직성(Real vs Demo 분리)
C) 3개 핵심 페이지(홈/코인분석/주식)에서 "철학 있는 디자인"을 UI 시스템으로 번역하는 규칙 10개
   - Monet / Van Gogh / Da Vinci 각각 토큰(색/형/레이아웃/모션)로 정의

2) Update:
- (주의) TO_AGENT.md는 watcher 문구가 있으니 손대지 말고,
  대신 communication/Report 문서에만 기록.
```

---

## Prompt 5: Auto-Save Protocol

```
✅ PROMPT → ALL AGENTS (공통)

목표: "내가 던진 프롬프트 + 너의 결과물"을 매번 자동으로 저장해서, 사용자가 복붙/추적하는 번거로움을 없앤다.

지시:

아래 경로에 폴더 생성
F:\11 dev\251206 코인 차트분석\communication\Report\<AGENT_NAME>\YYYY-MM-DD\

파일 2개를 항상 저장

PROMPT.md : 사용자가 너에게 준 원문 프롬프트 그대로

RESULT.md : 네가 수행한 결과(요약 + 변경파일 목록 + 결정사항 + 다음 액션)

파일 규칙

RESULT.md 맨 위에 "결과 요약(5줄)"

그 다음 "변경한 파일 목록(경로 포함)"

그 다음 "리스크/보류(있으면)"

마지막 "다음에 할 일(체크리스트)"
```

---

## Prompt 6: AI 분석 고도화 + 철학 디자인 UX 패턴

```
✅ PROMPT → TO_CLAUDE_CODE

1) 먼저 확인(ACK):

지금까지 전달된 사용자 목표/제약(토큰 API 금지 포함)을 다시 10줄로 정리해라.

2) 'AI 분석' 기대 수준을 "토큰 API 없이" 끌어올리는 설계:

목표: 규칙 기반 요약 → 시나리오/확률 기반 분석 → 의사결정 보조까지 단계적으로

단, "ML 모델/외부 LLM 호출" 없이 가능한 범위에서:

시그널 신뢰도(Confidence) 산식

시장 상태(추세/횡보/변동성)별 가중치 동적화

백테스트 지표 고도화(승률 말고 MDD/손익비/Sharpe 등)

3) "철학 있는 디자인"을 제품 설득력으로 연결:

Classic Masters를 단순 배경이 아니라,

"시장 분위기 = 색감/붓터치 질감"

"리스크 구간 = 다빈치 스케치풍(선/구조)"
처럼 정보 구조/시각언어로 번역하는 3가지 UX 패턴을 제안해라.
(홈/코인분석/주식분석 3페이지 기준)

4) 산출물 저장:
공통 지시 0의 Report 규칙대로 저장.
```

---

## Prompt 7: 확률 모델 + 설명 템플릿

```
Mission:
1. 확률 계산 로직 고도화 (RISE/DROP 신뢰도)
2. 백테스트 지표 개선 설계
3. "왜 이 확률인가?" 설명 템플릿 설계

Constraint:
- ML 모델 / 외부 LLM 호출 금지

Deliver:
- Probability_Model.md
- Explanation_Templates.md

Report 규칙 준수.
```

---

## Prompt 8: [PHASE 2 | STEP 4] Intelligence Blueprint (Design Only)

```
Title: [PHASE 2 | SEQUENTIAL - STEP 4] TO_CLAUDE_CODE — Intelligence Blueprint (Design Only)

Preconditions (SSOT):
- HANDOVER Current 문서 기준: Phase 2 / STEP 4 진행
- Worksystem/Playbook의 Non-Negotiables/Report 규칙 준수
- 허용 수정 범위 참고(단, 이번 Step은 "설계만", 코드 수정 금지)

Non-Negotiables (Hard Rules):
- 구현(코드 변경) 금지: 설계(blueprint)만 작성
- 토큰 과금 AI API 호출 전면 금지 / Watcher 미사용
- "AI/인공지능 예측" 표현 금지: probability-based/statistical/historical validation 표현만 사용
- Report 없으면 작업 미수행으로 간주

Mission (Single Goal):
- ChartMaster의 "확률(RISE/DROP) + 신뢰도(Confidence)" 산식/정의 재정의
- 백테스트 고급지표(MDD / Risk-Reward / Sharpe 등) 계산 설계
- 사용자 설명 템플릿(왜 관망/분할/손절)을 규칙 기반으로 설계

Deliverables (Must Output):
1) 확률 모델 설계서
   - 입력(feature) 정의
   - 산식(수식/의사코드 수준)
   - 신뢰도 산정 로직(데이터 품질/표본 수/최근성/변동성 등 반영)
   - Free vs PRO에서 노출/잠금되는 항목 명확히 구분
2) 백테스트 고급지표 설계서
   - 각 지표의 정의/계산식
   - 최소 데이터 요구조건
   - 지표 해석 가이드(사용자 표시 문구 포함)
3) "설명 템플릿(Explainability)" 규격
   - 관망/분할/손절 각각에 대해
   - (근거 요약 → 리스크 → 다음 관찰 포인트) 3단 구조
   - 금지 표현(확정적 예측/자동매수/보장 등) 체크리스트 포함

Report Output Format (Save-ready):
- communication/Report/ClaudeCode/2025-12-27/
  - PROMPT.md : 본 프롬프트 원문
  - RESULT.md : 아래 템플릿으로 작성

RESULT.md Template:
- 요약(5줄)
- 설계 결정사항(핵심 bullet)
- 확률/신뢰도 산식(의사코드/수식)
- 백테스트 지표 정의/계산 요약
- 사용자 설명 템플릿(관망/분할/손절)
- 리스크/보류사항
- 다음 Step 체크리스트(Phase 3 구현 시 필요한 입력)

Stop Condition:
- 위 Deliverables 3종 + RESULT.md 템플릿 충족하면 즉시 종료(추가 확장 금지)
```

---

**End of Prompts**
