[USER_REQUEST]
[POLY-TECH2_EXECUTION_PROMPT — SINGLE BLOCK]

[TASK]
NAME: P2_ANALYSIS_PAGE_UI_NORMALIZATION (Chart 영역/심볼바/정보패널 UI 정상화)
PHASE: P2
TARGET_AGENT: ANTIGRAVITY

[SSOT]
INPUT_SSOT_1: P0_IMPLEMENTATION_MAP_AUDIT_ANTIGRAVITY_RESULT_20251228.md
INPUT_SSOT_2: P1_UI_SHELL_STANDARDIZATION_ANTIGRAVITY_RESULT_20251228.md 
SSOT_RULE: P2는 /analysis의 UI만 정상화하며, P0의 DO NOT TOUCH(데이터 fetch/useEffect, supabase client, LanguageContext, DetailedChart 초기화 로직)는 절대 변경하지 않는다.

[CHANGE_POLICY]
CODE_LOGIC_CHANGE: 금지
DATA_FLOW_CHANGE: 금지
EVENT_HANDLER_CHANGE: 금지(심볼 버튼 onClick의 setSymbol 등 로직 변경 금지)
ROUTE_CHANGE: 금지
ALLOWED_CHANGES (SAFE ZONE ONLY):
/analysis 페이지 및 하위 UI 컴포넌트의 className/레이아웃 wrapper 조정
높이/폭/overflow/spacing 조정으로 “빈 공간/깨짐” 해결
반응형 레이아웃(모바일/데스크탑) 조정(스타일만)

[EXECUTION_ORDER]
ORDER: 3 / 3
MODE: SEQUENTIAL
BLOCKING_DEPENDENCY: P1 셸 표준(헤더 h-16, main pt-20, container max-w-7xl) 유지 

[EXECUTION_LOG]
SAVE_ROOT: F:\11 dev\251206 코인 차트분석\communication\Report\ANTIGRAVITY\
FILE_RULE: [PHASE][TASK][AGENT]_[TYPE]_YYYYMMDD.md
MUST_CREATE: PROMPT, RESULT, COMPLETE

[GOAL]
/analysis 화면에서 발생하는 “레이아웃 붕뜸/과도한 하단 빈 공간/차트 높이 고정으로 인한 어색함”을 제거하고, 전역 셸(P1) 표준에 맞춘 일관된 분석 화면을 만든다.
특히 차트 영역은 현재 h-[500px] 고정에서, 모바일/데스크탑 모두 자연스러운 반응형 높이로 개선한다(로직 변경 없이). 

[EXECUTION_STEPS]
/analysis 페이지 레이아웃 진단(수정 전)
차트 컨테이너 높이 반응형화 (권장안)
상단 “심볼 버튼 바” 정렬/줄바꿈 개선
분석 정보 패널(가격/지표 등) 간격/그리드 재정렬
/analysis 전용 overflow 정책 확정
스모크 테스트(기능 보존 확인)

[OUTPUT]
OUTPUT_FILES: 3 files
PROMPT_LOG
RESULT_REPORT
COMPLETE_DECLARATION

[COMPLETION_CRITERIA]
/analysis 화면 하단 과도한 빈 공간이 제거 또는 의미 있게 감소
차트 영역이 모바일/데스크탑에서 자연스러운 반응형 높이를 가짐
심볼 버튼/분석 패널 레이아웃이 깨지지 않음
심볼 변경→데이터 갱신 기능이 기존과 동일하게 동작
PROMPT/RESULT/COMPLETE 3개 파일 생성/저장 완료
