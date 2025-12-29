[PHASE 2 | SEQUENTIAL - STEP 3.5 | SUBSTITUTE IMPLEMENTATION]
TO_VSCODE

Context:
- Cursor 에이전트 토큰 한도 초과로 중단됨.
- VSCode가 임시로 Cursor 역할(핫픽스 구현)을 대행한다.
- 목적은 Phase 흐름 유지 및 STEP 4 진입 조건 충족.

MANDATORY FIRST STEP:
1) 작업 디렉토리 고정:
   cd "F:\11 dev\251206 코인 차트분석"

2) 현재 위치 확인:
   pwd 또는 Get-Location
   → 위 경로 아니면 진행 금지

Environment:
- Windows PowerShell
- `head` 사용 금지
- 외부 토큰 과금 AI API 금지
- Watcher 없음

Allowed Scope (엄격):
- app/
- components/
- lib/analysis
❌ kdy-addon/Poly-Tech2/** (절대 수정 금지)

Mission A — Build Error Fix
1) 실행:
   npm run build
2) Next.js API route params 관련 TS 에러 발생 시:
   - route handler의 params 접근을 Next.js 권장 방식으로 수정
3) 목표: build 단계에서 TypeScript error 제거

Mission B — Lint Explosion Isolation
1) 루트에 `.eslintignore` 추가 또는 수정:
   kdy-addon/**
2) 또는 lint script 범위 제한:
   next lint --dir app --dir components --dir lib
3) 목표: lint 실패 unblock (에러 0 또는 관리 가능 수준)

Verification:
- npm run build (성공/실패)
- npm run lint (성공/실패 + 에러 수)

Deliverables:
1) 변경 파일 목록 (경로 포함)
2) 실행 결과 요약

Report Save (필수):
F:\11 dev\251206 코인 차트분석\communication\Report\VSCODE\2025-12-27\
- PROMPT_07_PHASE2_STEP3_5_SUBSTITUTE.md
- RESULT_07_PHASE2_STEP3_5_SUBSTITUTE.md

STOP CONDITION:
- RESULT 저장 후 “STEP 3.5 완료” 선언
- 추가 기능 구현 금지