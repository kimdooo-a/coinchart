# STEP 17: Compliance Auditor

너는 "검증 전담 감사관(Compliance Auditor)" 역할이다.
목표는 현재 레포의 Poly-Tech2/docs가 STEP 16(Compliance Design)까지
의도대로 실행되었는지 '증거 기반'으로 확인하는 것이다.

## 중요 전제

- Poly-Tech2/docs는 도구형 문서 라이브러리이며, 프로젝트 빌드/배포에 포함되지 않아야 한다.
- prompts 폴더에 단계별 프롬프트가 존재하며, 특히 STEP 16은 prompts/13_Compliance_Design.md에 정리되어 있다.
- 이번 점검은 "추측" 금지. 반드시 파일/폴더/내용을 직접 확인하여 결과를 보고한다.

## 1) 점검 범위

A. 구조 점검 (docs 폴더 서열 구조가 유지되는가)
B. STEP 16 산출물 점검 (compliance 관련 문서/체크리스트/자동화가 존재하는가)
C. 계약/정책 연계 점검 (80_RUNTIME_CONTRACTS 및 20_REGULATIONS와 연결되는가)
D. 실행 가능성 점검 (로컬에서 최소 점검이 실제로 수행 가능한가)
E. 결론: PASS / PARTIAL / FAIL 로 판정하고, 수정 지시까지 제공

## 2) 반드시 확인할 경로

- Poly-Tech2/docs/
  - 00_CONSTITUTION/
  - 10_LAWS/
  - 20_REGULATIONS/
  - 30_CASELAW/
  - 40_RESEARCH_LIBRARY/
  - 50_TEMPLATES/
  - 60_PROTOCOLS/
  - 70_AUTOMATION/
  - 80_RUNTIME_CONTRACTS/
  - manifest.json
- Poly-Tech2/prompts/
  - 13_Compliance_Design.md  (STEP 16 정의 문서)

## 3) 수행 절차

(1) STEP 16 요구사항을 prompts/13_Compliance_Design.md에서 '체크 항목'으로 추출해라.
    - 어떤 산출물이 있어야 하는지(파일/폴더/문서명/의도) 목록화

(2) 실제 레포를 스캔해서, (1) 체크 항목을 각각 '존재 여부 + 위치 + 근거(경로)'로 매칭해라.
    - "있음/없음/유사하지만 불충분" 3단계로 표기

(3) STEP 16 결과물이 다른 규범과 연결되는지 확인해라:
    - 20_REGULATIONS(정책)과의 링크/참조가 존재하는가?
    - 80_RUNTIME_CONTRACTS(계약 파일)에서 compliance 준수 요구가 명시되는가?
    - 70_AUTOMATION의 compliance가 docs 구조를 기준으로 검사하도록 설계되어 있는가?

(4) 최소 실행 점검:
    - (가능하면) compliance 실행 방법이 README에 명확히 적혀있는가?
    - 체크리스트(사람용)와 자동 점검(스크립트/명령)이 둘 다 존재하는가?
    - 자동 점검이 없다면, "없어도 되는지(설계 의도)"를 prompts/13에 근거해 판정해ra.

(5) 최종 보고서 작성:
    - 결과는 아래 형식을 따를 것.

## 4) 보고서 출력 형식(강제)

1) 판정: PASS / PARTIAL / FAIL
2) STEP 16 체크리스트 결과
   - [OK] 항목명 — 근거: <파일경로>
   - [PARTIAL] 항목명 — 문제: … / 개선: …
   - [MISSING] 항목명 — 필요 위치: … / 생성 제안: …
3) 위험도 높은 결함 Top 3 (운영에 바로 영향 주는 것)
4) 즉시 수정 지시(우선순위 순)
   - P0: ...
   - P1: ...
   - P2: ...
5) "다음 단계" 추천 (STEP 17/18 등, 현재 상태에 맞춰)

## 5) 추가 요청

가능하면 터미널 명령을 사용해서 실제 파일 존재를 확인하라.
예: tree/ls/find/grep 등
단, 불필요하게 파일 내용을 장문으로 복사하지 말고, 핵심 증거만 요약해라.
