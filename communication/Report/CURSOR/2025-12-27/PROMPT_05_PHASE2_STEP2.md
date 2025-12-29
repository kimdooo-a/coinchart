[PHASE 2 | SEQUENTIAL - STEP 2]
TO_CURSOR

Precondition (Must Read):
- kdy-addon/Poly-Tech2/docs/Phase2_Architecture_Lock.md
- kdy-addon/Poly-Tech2/docs/Phase2_Product_Scope.md
- kdy-addon/Poly-Tech2/docs/Phase2_Copy_Rules.md

Non-Negotiables:
- Allowed only: app/, components/, lib/analysis
- Forbidden: kdy-addon/Poly-Tech2/core, kdy-addon/Poly-Tech2/docs (do not modify governance docs)
- "AI" 문구 전면 금지 (Copy Rules 준수: Algorithm / Probability 사용)
- 토큰 과금 AI API 호출 전부 금지
- Watcher 없음

Mission:
Phase 2 구현을 승인 범위 내에서 수행하라.
핵심 3페이지(/, /analysis/[symbol], /stock)만 대상.

A) Branding Fix (Immediate)
1) GlobalHeader 로고 텍스트가 '사랑하는 마누라'로 되어있으면 즉시 제거하고:
   - Brand Name: ChartMaster
   - Tagline(선택): "Probability-based Market Intelligence"
2) 상단 영역에서 "AI"라는 단어가 보이면 모두 제거.

B) Product Scope: Free vs PRO UI Lock
- Free: Delayed/Basic 요약, 확률/진입/손절/백테스트 세부값은 숨김
- PRO: 확률(%) + 진입/분할/손절 가격 + 백테스트 신뢰도 노출
구현 방식(간단 우선):
1) UI 레벨 잠금(blur + lock + CTA)
2) Gate flag는 임시로 `const isPro = false`로 시작 (백엔드 연결은 Step 3 이후 논의)

C) "Classic Masters" Design System (Assets는 정적 only)
- 홈(/): Monet mood (soft gradient, calm)
- 분석(/analysis/[symbol]): Van Gogh + Da Vinci (volatility + structure)
- 주식(/stock): Da Vinci (clean, technical, trust-first)
주의: 외부 생성 API 금지. public/ 정적 에셋 + CSS만 사용.

D) Stock Page Trust Fix
- "Delayed 15m" / "Twelve Data" 표기는 "Free 모델" 신뢰 안내로 정리
- PRO에서만 '더 촘촘한 데이터/고급 분석'을 보여주는 구조로 설계

Deliverables:
1) 코드 변경(승인된 폴더만)
2) Report 저장:
   - F:\11 dev\251206 코인 차트분석\communication\Report\CURSOR\2025-12-27\
     - PROMPT_05_PHASE2_STEP2.md  (이 프롬프트 원문)
     - RESULT_05_PHASE2_STEP2.md  (요약/변경파일/리스크/다음)

RESULT.md 필수 포함:
- 5줄 요약
- 변경한 파일 경로 전체 목록
- 적용한 Free/PRO 게이트 방식 설명
- 'AI' 문구 제거 완료 여부 체크

STOP CONDITION:
- 위 Report 저장 완료 후, "STEP 2 완료"만 선언하고 추가 작업 금지.








