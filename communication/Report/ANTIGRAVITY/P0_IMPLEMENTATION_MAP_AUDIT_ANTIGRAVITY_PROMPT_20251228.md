[POLY-TECH2_EXECUTION_PROMPT — SINGLE BLOCK]

[TASK]

NAME: IMPLEMENTATION_MAP_AUDIT (코인 분석 웹사이트 전반 구조 파악)

PHASE: P0 (UI/디자인 변경 전 선행 감사)

TARGET_AGENT: ANTIGRAVITY

[SSOT]

SSOT_ROOT: F:\11 dev\251206 코인 차트분석\kdy-addon\poly-tech2\

SSOT_RULE: 본 작업의 최종 산출물(구현 맵)은 향후 UI 리팩터링/디자인 작업의 단일 기준(SSOT)로 사용한다.

SCOPE_GUARD: 본 작업은 READ-ONLY 분석 및 문서화만 수행한다.

[CHANGE_POLICY]

CODE_CHANGE: 금지한다

ROUTE_CHANGE: 금지한다

UI_STYLE_CHANGE: 금지한다

FILE_MOVE_DELETE: 금지한다

CONFIG_ENV_CHANGE: 금지한다

ONLY_ALLOWED: 읽기, 구조 파악, 문서 작성, 다이어그램(텍스트/mermaid) 작성만 허용한다

[EXECUTION_ORDER]

ORDER: 1 / 3

MODE: SEQUENTIAL

BLOCKING_DEPENDENCY: 없음

[EXECUTION_LOG]

SAVE_ROOT: F:\11 dev\251206 코인 차트분석\communication\Report\ANTIGRAVITY\

FILE_RULE: [PHASE][TASK][AGENT]_[TYPE]_YYYYMMDD.md

MUST_CREATE: PROMPT, RESULT, COMPLETE 를 반드시 생성한다

[GOAL]

UI/디자인 작업을 시작하기 전에, 현재 구현된 코인 분석 웹사이트의 “페이지/라우팅/버튼 연결/상태·메시지 흐름/데이터 의존성”을 누락 없이 추출하여, 기능 보존 상태로 리팩터링 가능한 IMPLEMENTATION MAP(구현 지도)을 확정한다.

[EXECUTION_STEPS]

프로젝트 루트에서 라우트 인벤토리를 추출한다.

src/app 기준으로 모든 route를 나열한다.

각 route의 page/layout/loading/error/not-found 존재 여부를 기록한다.

동적 라우트(params) 및 searchParams 사용 여부를 기록한다.

네비게이션/전역 레이아웃 구조를 파악한다.

Header/Nav/Sidebar/TabBar 등 전역 내비 컴포넌트의 위치와 책임을 기록한다.

“어떤 컴포넌트가 어떤 페이지에서 공통으로 렌더링되는지”를 명시한다.

버튼/링크 연결 맵을 추출한다.

페이지별 주요 CTA(예: 분석 시작하기, 시그널 보기, 심볼 탭 BTC/ETH/XRP/SOL/BCH/DOGE 등)를 나열한다.

각 버튼/링크가 수행하는 동작을 분류해 기록한다: ROUTE_NAV / STATE_CHANGE / API_CALL / UI_TOGGLE(모달·드로어 등).

버튼 동작이 URL을 변경하는지(router push/link) 또는 내부 상태만 바꾸는지 구분한다.

상태/메시지 플로우를 파악한다.

전역 상태(store/context/query client 등) 사용 여부와 위치를 기록한다.

심볼(symbol), 타임프레임(timeframe), 거래소/마켓(예: BTC/USDT) 변경이 어디에 저장되는지(URL/Store/Local State)를 기록한다.

사용자 액션 → 상태 변화 → 화면 갱신의 트리거 체인을 서술한다.

데이터 소스/의존성 흐름을 파악한다.

Binance Live Data / Supabase / 기타 API 호출 지점을 찾아 페이지별로 매핑한다.

차트 라이브러리(TradingView 등) 사용 방식과 초기화/업데이트 흐름을 기록한다.

데이터 로딩 실패/로딩 상태 처리 경로를 기록한다.

“절대 깨지면 안 되는 핵심 기능 목록(DO NOT TOUCH)”을 확정한다.

기능 단위(차트 표시, 심볼 변경, 시그널 페이지 진입, 시장개요 섹션 렌더링, 버튼 연결, 데이터 로딩)로 나열한다.

해당 기능이 걸린 파일/컴포넌트/핵심 로직 위치를 명시한다.

UI 리팩터링 격벽을 위한 “금지 구역”을 선언한다.

UI 작업자가 수정 가능한 범위(프레젠테이션 레이어: className/layout wrapper 등)와 금지 범위(라우트/이벤트/데이터/상태/계산 로직)를 명확히 분리해 문서에 포함한다.

문서 품질 검증을 수행한다.

route 누락이 없음을 확인한다.

버튼/링크의 목적지/동작이 모호하지 않게 기록되었음을 확인한다.

상태/데이터 흐름이 “UI만 바꾸는 작업자”에게 충분히 재현 가능하도록 작성되었음을 확인한다.

[OUTPUT]

OUTPUT_FILES: 3 files

PROMPT_LOG

PATH: F:\11 dev\251206 코인 차트분석\communication\Report\ANTIGRAVITY\

NAME: P0_IMPLEMENTATION_MAP_AUDIT_ANTIGRAVITY_PROMPT_YYYYMMDD.md

CONTENT: 본 작업지시서 원문을 그대로 저장한다.

RESULT_REPORT (핵심 산출물)

PATH: F:\11 dev\251206 코인 차트분석\communication\Report\ANTIGRAVITY\

NAME: P0_IMPLEMENTATION_MAP_AUDIT_ANTIGRAVITY_RESULT_YYYYMMDD.md

REQUIRED_SECTIONS:
A. Project Overview (목적/핵심 기능 5줄 이내)
B. Route / Page Inventory (표 형식: Route | Purpose | Key UI | Data Dependency | Params)
C. Navigation & Button Map (페이지 간 연결 + 주요 CTA 동작 분류)
D. State & Message Flow (심볼/타임프레임/시그널 흐름 중심)
E. Data Flow Summary (API/실시간/캐시/에러 처리 포함)
F. DO NOT TOUCH LIST (파일/컴포넌트/로직 단위)
G. UI-ONLY SAFE ZONE (수정 가능 범위 명문화)
H. Known Risks (현재 UI 깨짐 원인 후보를 “관찰”로만 기록하되 수정은 금지한다)

COMPLETE_DECLARATION

PATH: F:\11 dev\251206 코인 차트분석\communication\Report\ANTIGRAVITY\

NAME: P0_IMPLEMENTATION_MAP_AUDIT_ANTIGRAVITY_COMPLETE_YYYYMMDD.md

CONTENT: 완료 조건 충족 여부 체크리스트(YES/NO)와 결과물 파일명 3개를 명시한다.

[COMPLETION_CRITERIA]

모든 route가 누락 없이 나열된다.

모든 주요 버튼/탭/링크의 동작이 ROUTE_NAV/STATE_CHANGE/API_CALL/UI_TOGGLE로 분류되어 기록된다.

심볼/타임프레임/차트 갱신의 상태 흐름이 재현 가능하게 문서화된다.

DO NOT TOUCH LIST 및 UI-ONLY SAFE ZONE이 명시된다.

PROMPT/RESULT/COMPLETE 3개 파일이 지정 경로/규칙대로 저장된다.

[END — POLY-TECH2_EXECUTION_PROMPT]
