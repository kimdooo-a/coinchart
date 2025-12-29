[POLY-TECH2_EXECUTION_PROMPT — SINGLE BLOCK]

[TASK]

NAME: P1_UI_SHELL_STANDARDIZATION (Global Layout / Container / Typography 표준화)

PHASE: P1

TARGET_AGENT: ANTIGRAVITY

[SSOT]

INPUT_SSOT: P0_IMPLEMENTATION_MAP_AUDIT_ANTIGRAVITY_RESULT_20251228.md

SSOT_ROOT: F:\11 dev\251206 코인 차트분석\kdy-addon\poly-tech2\

SSOT_RULE: P1의 모든 UI 변경은 “SAFE ZONE(프레젠테이션 레이어)”에서만 수행하며, P0의 DO NOT TOUCH 항목은 절대 수정하지 않는다. 

P0_IMPLEMENTATION_MAP_AUDIT_ANT…

[CHANGE_POLICY]

CODE_LOGIC_CHANGE: 금지 (이벤트/상태/데이터/라우팅/계산 로직 수정 금지)

ROUTE_CHANGE: 금지

API_CHANGE: 금지

STATE_FLOW_CHANGE: 금지

FILE_MOVE_DELETE: 금지

ALLOWED_CHANGES (SAFE ZONE ONLY):

Tailwind className 조정

레이아웃 wrapper(div/section) 구조 정리(기능/props/핸들러 변경 없이)

typography/spacing/container 규칙 통일

공통 UI 컴포넌트의 “스타일”만 정리(동작 유지)

[EXECUTION_ORDER]

ORDER: 2 / 3

MODE: SEQUENTIAL

BLOCKING_DEPENDENCY: P0 결과 문서(IMPLEMENTATION MAP) 기준 준수

[EXECUTION_LOG]

SAVE_ROOT: F:\11 dev\251206 코인 차트분석\communication\Report\ANTIGRAVITY\

FILE_RULE: [PHASE][TASK][AGENT]_[TYPE]_YYYYMMDD.md

MUST_CREATE: PROMPT, RESULT, COMPLETE

[GOAL]

페이지별 UI를 손대기 전에, 전체 사이트에서 공통으로 적용되는 “레이아웃 셸(헤더/메인/컨테이너) + 타이포 + spacing 규칙”을 단일 표준으로 고정한다.

목표 결과: 어떤 페이지로 이동해도 (1) 컨테이너 폭/여백이 일정하고, (2) 헤더 높이가 고정되며, (3) main 영역의 높이/overflow가 안정적이고, (4) 전역 폰트/타이포 스케일이 일관되게 보이도록 한다.

[EXECUTION_STEPS]

전역 레이아웃 엔트리포인트 파악

src/app/layout.tsx 및 전역 wrapper 구성 요소(예: Header/Nav)를 확인한다.

main wrapper(페이지 컨텐츠 영역)가 어디서 정의되는지 식별한다.

“Global Shell 표준” 정의 및 적용 (기능 변경 금지)

아래 표준을 만족하도록 wrapper 구조 + className만 조정한다:
A. <body>: min-h-screen 유지, 스크롤/오버플로우는 main에서 관리(페이지별 필요 시 예외 허용)
B. Root Layout Wrapper: min-h-screen flex flex-col
C. Header: 고정 높이(예: h-14/h-16 중 택1) + sticky/fixed 여부를 명확히 결정(현재 구현 유지가 원칙)
D. Main: flex-1 + 컨텐츠 overflow 정책 확정 (overflow-x-hidden 기본, y는 페이지 특성에 맞게)

“빈 공간 과다 / 붕 뜸”의 1차 원인이 되는 전역 padding/height/min-height 과잉 값을 제거(단, 페이지 기능 로직은 절대 건드리지 않는다).

컨테이너 규칙 단일화

전 페이지 공통으로 사용 가능한 Container 패턴을 정한다(새 컴포넌트 생성 가능하나, 라우팅/로직 변경 금지).

표준 예: mx-auto w-full max-w-6xl px-4 md:px-6 (정확 값은 프로젝트 UI에 맞게 선택)

모든 페이지에서 “컨테이너 폭/좌우 패딩/섹션 간격”이 통일되도록 layout 레벨에서 적용하거나, 공통 wrapper를 제공한다.

타이포그래피 스케일/기본 색 대비 정리

h1/h2/body/small 등의 기본 크기 체계를 정하고, 페이지별로 과도한 텍스트 크기 차이가 줄어들도록 className을 정리한다.

다크모드/라이트모드가 있다면 배경/전경 대비(가독성)만 점검한다(테마 시스템 자체 변경 금지).

글로벌 CSS 충돌 점검(“정리만”, 기능 금지)

globals.css 또는 src/styles/*에서 section/main/* 와 같은 광역 셀렉터가 과도한 padding/margin/min-height를 주는지 확인한다.

있다면, UI 안전 범위 내에서 (전역 레이아웃 기준에 맞게) 최소 수정한다.

주의: shadcn 변수/테마 구조 자체를 갈아엎지 말고, 과한 spacing/height만 안정화한다.

1차 스모크 테스트(수동)

아래 경로 진입 시 레이아웃 셸이 안정적인지 확인한다:
/ → /analysis → /market → /signal → /news → /auth/login

확인 항목:
A. 헤더/컨테이너 폭 일관성
B. 과도한 빈 공간(특히 하단) 감소
C. 좌우 스크롤(overflow-x) 발생 여부
D. 폰트/여백의 불균형 완화

[OUTPUT]

OUTPUT_FILES: 3 files

PROMPT_LOG

PATH: F:\11 dev\251206 코인 차트분석\communication\Report\ANTIGRAVITY\

NAME: P1_UI_SHELL_STANDARDIZATION_ANTIGRAVITY_PROMPT_YYYYMMDD.md

CONTENT: 본 작업지시서 원문 저장

RESULT_REPORT

PATH: F:\11 dev\251206 코인 차트분석\communication\Report\ANTIGRAVITY\

NAME: P1_UI_SHELL_STANDARDIZATION_ANTIGRAVITY_RESULT_YYYYMMDD.md

REQUIRED_SECTIONS:
A. 변경 대상 파일 목록(파일명만)
B. 적용한 Global Shell 표준(Body/Header/Main/Container 규칙)
C. 바꾼 className 요약(전/후 개념)
D. 스모크 테스트 결과(경로별 PASS/FAIL + 관찰)
E. P2(페이지별 정리)로 넘어가기 위한 권고사항

COMPLETE_DECLARATION

PATH: F:\11 dev\251206 코인 차트분석\communication\Report\ANTIGRAVITY\

NAME: P1_UI_SHELL_STANDARDIZATION_ANTIGRAVITY_COMPLETE_YYYYMMDD.md

CONTENT:

DO NOT TOUCH 준수 여부(YES/NO)

SAFE ZONE 변경만 수행 여부(YES/NO)

스모크 테스트 경로 6개 수행 여부(YES/NO)

산출물 3종 생성 여부(YES/NO + 파일명)

[COMPLETION_CRITERIA]

전 페이지 공통 레이아웃(헤더/메인/컨테이너/타이포)이 단일 기준으로 정리됨

DO NOT TOUCH 영역(analysis 데이터 로직/차트 초기화/언어 컨텍스트/supabase client)이 변경되지 않음 

P0_IMPLEMENTATION_MAP_AUDIT_ANT…

6개 경로 스모크 테스트에서 레이아웃 붕뜸/과도한 빈 공간/좌우 스크롤이 의미 있게 감소함

PROMPT/RESULT/COMPLETE 3개 파일이 규칙대로 저장됨

[END — POLY-TECH2_EXECUTION_PROMPT]
