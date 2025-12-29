[PHASE 2 | SEQUENTIAL - STEP 3]
TO_VSCODE

Precondition (Already Done):
- Step 2 결과 확인 완료: Branding Fix + AI 문구 제거 + Free/PRO UI Lock 적용됨.
  (변경 파일: translations, analysis pages, signal, stock-market, terms, AnalysisPanel, stock page 등) 

Non-Negotiables:
- Watcher 미사용
- 토큰 과금 AI API 호출 전부 금지
- 이번 Step 3에서는 "안정화/검증"만 한다 (기능 확장 금지)
- 결과는 반드시 Report 규칙에 저장

Mission:
Phase 2 Step 2 구현 결과를 서비스급 품질로 검증하고,
배포 전 품질 게이트를 통과시키기 위한 최소 조치를 확정하라.

A) Reproducible Commands (반드시 실행/기록)
1) npm run dev
2) npm run build
3) npm run lint
4) (가능하면) npm run typecheck 또는 next build 시 TS 체크 결과

각 결과에 대해:
- 성공/실패 여부
- 대표 경고/에러 Top 10
- “이건 지금 고쳐야 배포 가능” vs “나중에 가능” 분리

B) Lint 폭탄 격리 플랜 (필수)
현재 lint가 monet-registry-main 등 외부 폴더 영향으로 폭발했었다는 리포트가 있음.
- 메인 앱(ChartMaster) 배포 품질을 위해 다음 중 1개 이상을 제안/적용:
  1) eslint ignore / override로 특정 경로 제외
  2) lint scope 한정(메인 앱 디렉토리만)
  3) workspace 분리(가능하면 제안 중심)
- 단, 구조 변경은 최소화하고 “가장 안전한 한 방” 우선.

C) Free/PRO Gate 보안 점검 (중요)
Step 2는 UI 레벨 잠금이며 `isPro=false` 하드코딩 상태.
- 지금 단계에서는 “클라이언트에서 PRO 데이터가 계산/노출 가능한지”만 확인
- 위험하면: “민감 데이터 계산을 서버로 옮겨야 한다”는 결론을 명시 (구현은 Step 4 전/후 결정)

D) Stock Page 신뢰성 점검
- "Delayed 15m" 표기 정상 노출 확인
- TwelveData API 키 누락/에러 시 사용자 경험(에러 화면/빈 값) 점검

Deliverables (Write Files):
1) F:\11 dev\251206 코인 차트분석\communication\Report\VSCODE\2025-12-27\
   - PROMPT_06_PHASE2_STEP3.md   (이 프롬프트 원문)
   - RESULT_06_PHASE2_STEP3.md   (요약/명령결과/리스크/권장수정/다음)

RESULT_06 필수 포함:
- 5줄 요약
- 실행 결과 표(dev/build/lint/typecheck)
- “배포 가능/불가능” 판정
- 즉시 고쳐야 할 항목 Top 5 (파일 경로 포함)
- Lint 폭탄 격리 최우선안(1개) + 이유

STOP CONDITION:
- 위 Report 저장 완료 후, “STEP 3 완료”만 선언하고 추가 작업 금지.