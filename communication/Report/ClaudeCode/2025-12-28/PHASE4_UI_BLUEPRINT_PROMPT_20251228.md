# PHASE4_UI_BLUEPRINT_PROMPT_20251228

> 본 문서는 ChartMaster UI Blueprint 설계 작업의 원본 작업지시서입니다.

---

## [TASK]
ChartMaster Web UI Design Assembly using monet-registry Components

## [EXECUTION_MODEL]
SINGLE AGENT ONLY — CLAUDE CODE
- 본 작업은 Claude Code 단독 실행을 전제로 한다.
- 다른 에이전트(Antigravity, Cursor, VSCode)는 사용하지 않는다.
- 협업/Failover/감사 단계는 존재하지 않는다.

## [PHASE]
Phase 4 — UI Design Assembly (Blueprint Only)

## [SSOT]
- UI Component SSOT:
  F:\11 dev\251206 코인 차트분석\kdy-addon\monet-registry-main
- Project Root:
  F:\11 dev\251206 코인 차트분석\
- Data Flow SSOT:
  DATA_FLOW_SSOT.md (절대 수정 금지)

## [NON-NEGOTIABLE RULES]
- 본 작업은 **디자인 설계(Blueprint)** 작업이다.
- 신규 디자인 시스템을 만들지 않는다.
- monet-registry-main에 존재하는 컴포넌트만 사용한다.
- 분석 로직, 데이터 흐름, API, 계산식 변경 ❌
- "AI 예측", "자동 추천", "확정 수익" 표현 ❌
- JSX/TSX 코드 작성 ❌
- Placeholder용 빈 카드/의미 없는 UI ❌

## [GOAL]
monet-registry-main에 이미 존재하는 웹 UI 컴포넌트들을 활용하여
ChartMaster 분석 페이지(/analysis/[symbol])의
**시각적 구조, 정보 위계, 상태별 표현을 정상화하기 위한 UI 조합 설계(Blueprint)**를 완성한다.

## [EXECUTION STEPS]
1. monet-registry-main 디렉토리를 전수 검토한다.
   - Layout / Container
   - Card / Panel
   - Typography
   - Badge / Status
   - Divider / Section 관련 컴포넌트
2. 현재 ChartMaster 분석 페이지를 다음 UI 블록으로 분해한다.
   - Page Header (symbol / timeframe / market info)
   - Probability & Confidence Summary
   - Backtest Metrics Summary
   - Explanation (Evidence / Risk / Watch)
   - State UI:
     - loading
     - insufficient
     - pro-locked
     - ok
3. 각 UI 블록마다 다음을 명확히 정의한다.
   - 사용 가능한 monet 컴포넌트 목록
   - 컴포넌트 조합 구조 (상하/좌우/그룹)
   - 정보 위계:
     - Primary
     - Secondary
     - Meta
4. "왜 이 컴포넌트 조합이 적절한지"를
   디자인 관점에서 짧고 명확하게 설명한다.
5. 모든 설명은 **구조/조합/의도 중심**으로 작성한다.
   - 구현 방법 설명 ❌
   - 코드 예시 ❌
6. 결과를 하나의 Blueprint 문서로 정리한다.

## [OUTPUT]
다음 파일을 반드시 생성한다.

경로:
F:\11 dev\251206 코인 차트분석\communication\Report\ClaudeCode\YYYY-MM-DD\

파일:
- PHASE4_UI_BLUEPRINT_PROMPT_YYYYMMDD.md
  (본 작업지시서 원문)
- PHASE4_UI_BLUEPRINT_RESULT_YYYYMMDD.md

RESULT 문서 필수 섹션:
1) 전체 UI 구조 요약 (5줄 이내)
2) 분석 페이지 UI 블록별 컴포넌트 매핑 표
3) 상태별 UI 설계 (loading / insufficient / pro-locked / ok)
4) 시각적 일관성 유지 원칙
5) 향후 구현 시 절대 깨지면 안 되는 UI 규칙

## [STOP CONDITION]
- Blueprint 문서 작성 완료 시 즉시 종료
- 코드 작성/구현 언급이 시작되기 직전에 중단
- RESULT 파일 저장 후 작업 종료 선언

---

**문서 생성일**: 2025-12-28
**작업 담당**: Claude Code (claude-opus-4-5-20251101)
