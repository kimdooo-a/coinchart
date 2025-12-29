# PHASE4_UI_IMPLEMENT_CLAUDE_CODE_PROMPT_20251228

> Phase 4 UI Implementation 지시서 원문

---

## [TASK]
Phase 4 UI Implementation — Apply Blueprint to /analysis/[symbol] using monet-registry components

## [EXECUTION_MODEL]
SINGLE AGENT ONLY — CLAUDE CODE
- 다른 에이전트 사용 금지
- 협업/감사/Failover 단계 없음

## [PHASE]
Phase 4 — STEP: UI IMPLEMENTATION (Blueprint → Code)

## [SSOT]
- Blueprint Result (Ground Truth):
  /mnt/data/PHASE4_UI_BLUEPRINT_RESULT_20251228.md
- UI Component Source (SSOT):
  F:\11 dev\251206 코인 차트분석\kdy-addon\monet-registry-main
- Project Root:
  F:\11 dev\251206 코인 차트분석\
- Data Flow SSOT:
  DATA_FLOW_SSOT.md (절대 수정 금지)

## [NON-NEGOTIABLE RULES]
- monet-registry-main 컴포넌트만 사용한다 (Section/Card/Badge/Separator/Label/Button 등).
- 신규 UI 컴포넌트 파일 생성은 "불가피한 조합 컴포넌트(페이지 전용)"만 허용하고,
  ui-kit 레벨 신규 컴포넌트 생성은 금지한다.
- 분석 로직/데이터 흐름/API 호출/계산식 변경 ❌
- "AI 예측/자동 추천/확정 수익" 표현 ❌
- uiState 분기(loading/insufficient/pro-locked/ok) 혼합 표시 ❌
- 빈 카드/의미 없는 Placeholder ❌
- 스타일은 Tailwind 유틸만 사용(새 디자인 시스템 발명 금지)

## [GOAL]
업로드된 Blueprint(Phase4 UI Blueprint Result)에 따라
ChartMaster의 /analysis/[symbol] 페이지 UI를
Header → Chart → Analysis Grid 구조로 재정렬하고,
Probability/Confidence/Explanation/Backtest/Status 및 4가지 uiState를
monet-registry 컴포넌트 조합으로 "정상 시각화" 한다.

## [EXECUTION STEPS]
1) Blueprint 문서를 먼저 읽고, 구현 체크리스트를 10줄 이내로 작성한다.
   - 반드시 "블록별 컴포넌트 매핑"과 "상태별 UI"를 체크리스트에 포함한다.

2) /analysis/[symbol] 관련 페이지/컴포넌트 트리를 찾는다.
   - 현재 렌더링이 "빈 카드/아이콘만" 보이는 원인을 UI 레벨에서만 파악한다.
   - 로직 문제로 판단되더라도 로직 변경은 하지 않는다(표현만 수정).

3) 페이지 레이아웃을 Blueprint 기준으로 재구성한다.
   - Header (Section + Label + Badge)
   - Chart Section (Section wrapper only)
   - Analysis Grid:
     - Probability Card (CardHeader/CardTitle/Badge + CardContent)
     - Confidence Card (CardHeader/CardTitle/Badge + CardContent)
     - Explanation Card (CardContent 3-column + Separator)
     - Backtest Card (CardHeader + CardContent 4-metric grid + CardFooter CTA)
     - Position Status (Meta Card + Badge)

4) uiState 4분기 렌더링을 "명확히" 구현한다.
   - loading: Card opacity + skeleton + Badge secondary "분석 중…"
   - insufficient: destructive Badge + 사유 list + outline Button(대안 행동)
   - pro-locked: blur + overlay + outline Badge(PRO) + glow Button(업그레이드 CTA)
   - ok: 정상 렌더(값 기반 Badge variant 적용)
   ※ Badge variant 의미 규칙(blueprint의 표) 절대 위반 금지.

5) Backtest/Explanation의 "Pro Gate"는 UI 레벨에서만 처리한다.
   - 데이터를 숨길 때는 "존재는 보이되 잠금(blur/overlay)" 방식 유지
   - CTA 버튼 문구는 과장 없이 "프리미엄으로 전체 보기/업그레이드" 톤으로 작성

6) 구현 후, 최소 3가지 시나리오를 로컬에서 화면 확인한다.
   - loading 강제(초기 렌더) 상태에서 UI가 깨지지 않는지
   - insufficient 케이스에서 단일 카드/사유/대안 버튼이 정상인지
   - pro-locked에서 blur/overlay/CTA가 정상인지
   (상태 강제는 mock/flag가 아닌 "기존 uiState 분기"를 이용해 재현한다)

7) 변경 파일 목록을 정리하고, 불필요한 변경은 되돌린다.
   - "UI 정렬/컴포넌트 교체/조건부 렌더" 외 변경이 있으면 제거한다.

## [OUTPUT / AUTO-LOG]
아래 경로에 반드시 저장한다.

경로:
F:\11 dev\251206 코인 차트분석\communication\Report\ClaudeCode\YYYY-MM-DD\

파일:
- PHASE4_UI_IMPLEMENT_CLAUDE_CODE_PROMPT_YYYYMMDD.md  (본 지시서 원문)
- PHASE4_UI_IMPLEMENT_CLAUDE_CODE_RESULT_YYYYMMDD.md  (결과 보고서)

RESULT 필수 섹션:
1) 완료 요약(5줄)
2) 변경한 파일 목록(절대경로/상대경로)
3) uiState 4분기 구현 방식 요약(각 상태별 2~3줄)
4) 화면 확인 시나리오 3개 결과(OK/이슈)
5) 남은 이슈/추가 개선 TODO (있으면)

## [STOP CONDITION]
- /analysis/[symbol]에서 Blueprint 구조가 눈으로 확인되면 즉시 종료한다.
- "추가로 더 예쁘게" 같은 확장 작업을 시작하려는 순간 중단한다.
- Report 저장 후 작업 종료 선언한다.

---

**문서 저장일**: 2025-12-28
