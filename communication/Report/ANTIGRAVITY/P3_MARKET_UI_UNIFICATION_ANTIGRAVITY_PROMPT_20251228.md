[TASK]
NAME: P3_MARKET_UI_UNIFICATION_CORE
AGENT: ANTIGRAVITY
ROLE: MAIN (UI 구조 담당)
[TOUCHABLE PATHS — 수정 허용]
app/market/page.tsx
(선택) components/market/*
※ 단, 순수 UI 컴포넌트만 생성 가능 (props 그대로 전달)
[DO NOT TOUCH — 절대 금지]
lib/**
context/**
데이터 fetch / 상태 / 이벤트 핸들러
라우트 구조
/analysis 관련 파일
components/DetailedChart.tsx
[GOAL]
/market 페이지를 다음 상태로 만든다:
컨테이너 폭/좌우 여백이 P1 표준과 일치
카드/섹션 간격이 일관됨
과도한 상·하단 빈 공간 제거
모바일에서 가로 스크롤 없음
기능·데이터 동작은 100% 그대로
[EXECUTION STEPS]
/market 페이지를 섹션 단위로 분해
헤더/요약/리스트/카드 영역 식별
불필요한 py-*, min-h-*, 중복 px-* 제거
카드 UI 통일
예: rounded-xl or 2xl, border, bg, p-4~6, gap-4
그리드 규칙 정리
mobile: 1열
tablet: 2열
desktop: 3열(필요 시)
로직/이벤트 untouched 상태로 렌더 확인
[OUTPUT — 반드시 생성]
PATH:
F:\11 dev\251206 코인 차트분석\communication\Report\ANTIGRAVITY\
FILES:
P3_MARKET_UI_UNIFICATION_ANTIGRAVITY_PROMPT_YYYYMMDD.md
P3_MARKET_UI_UNIFICATION_ANTIGRAVITY_RESULT_YYYYMMDD.md
변경 파일 목록
적용한 UI 규칙 요약
“로직 변경 없음” 선언
P3_MARKET_UI_UNIFICATION_ANTIGRAVITY_COMPLETE_YYYYMMDD.md
