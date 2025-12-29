# 📝 Project Prompt History

이 문서는 Poly-Tech2 Governance Hardening 및 Orchestrator 구현 과정에서 요청된 주요 프롬프트들을 정리한 기록입니다.

---

## 1. Rule DSL 제정 (Step 343, 353)
**요청 내용**:
`docs/10_LAWS/RULE_DSL.md`를 생성하여 Watcher/Orchestrator를 위한 공식 DSL을 정의할 것.
*   **요구사항**: `COMMUNICATION.md` 호환, Phase/Policy 인식, `runtime/bus` 내 의사결정 금지.
*   **내용**: Scope, Core Concepts (Event, Rule, Guard), Schema (YAML), Security 등.
*   **후속**: Draft v0.1 내용으로 구체화 및 스키마 확정.

## 2. Executable Rule Pack 생성 (Step 360)
**요청 내용**:
`runtime/rules/rules.v0.1.yaml` 및 `README.md` 생성.
*   **포함 규칙**:
    *   R1: Phase 0 Bootstrap Guard
    *   R2: TypeScript Lint (Phase 2)
    *   R3: Test Execution (Phase 2)
    *   R4: Category B/C Approval Logic
    *   R5: Emergency D Retroactive Approval
*   **조건**: Evidence-only logging.

## 3. Approval Token Mechanism 정의 (Step 374)
**요청 내용**:
`docs/20_REGULATIONS/APPROVAL_TOKENS.md` 생성.
*   **메커니즘**: `SHARED_CONTEXT.md`를 레지스트리로 사용하여 승인(Approval) 상태 관리.
*   **요구사항**: 필드 정의(MSG_ID, Authority, Category), 취소(Revocation) 프로토콜.

## 4. Implementation Reporting (Step 386)
**요청 내용**:
`TO_HUMAN.md`에 현재까지의 구현(DSL, Rules, Assumptions) 요약 리포트 작성.

## 5. Phase 0 Bootstrap Gate 구현 (Step 393)
**요청 내용**:
`WORKFLOW.md` Phase 0 게이트 업데이트 및 `SHARED_CONTEXT.md` 생성.
*   **SHARED_CONTEXT.md**: 헌법 경로, Bus 경로, 초기 Phase(0) 정의. 모든 에이전트의 로딩 진입점.
*   **WORKFLOW.md**: Phase 0 진입 시 `SHARED_CONTEXT.md` 필독 의무화.

## 6. Universal Root Loading (Step 406)
**요청 내용**:
최상위 `README.md` 생성 및 Universal Loading Flow 확립.
*   **내용**: "START HERE for AGENTS" 섹션 추가 -> `SHARED_CONTEXT.md` 리딩 지시.
*   **WORKFLOW.md**: `README.md` -> `SHARED_CONTEXT.md` 순서로 로딩하도록 게이트 업데이트.

## 7. Minimal Orchestrator Loop 구현 (Step 424)
**요청 내용**:
실제 작동하는 Minimal Local Orchestrator (`runtime/orchestrator/orchestrator_loop.py`) 구현.
*   **기능**:
    *   `runtime/bus/input` 감시 및 `processing`으로 이동 (Lock).
    *   `SHARED_CONTEXT.md`에서 Phase 로드.
    *   `rules.v0.1.yaml` 규칙 엔진 구동.
    *   Allowed Commands (Whitelist) 실행.
    *   결과를 `runtime/bus/output` (Evidence)에 기록.
    *   Category B/C 요청 시 Approval Request 생성.
*   **산출물**: Python Script, README, Sample Commands.

## 8. Sandbox & Guardrails 구현 (Step 463)
**요청 내용**:
실제 실행 전 격리된 테스트 환경 구축을 위해 `runtime/_sandbox` 구조 생성 및 안전장치 추가.
*   **Sandbox**: `_sandbox/bus/{input,processing,output,error}` 및 `.gitignore` 설정.
*   **Guardrails**: `orchestrator_loop.py`에 `--bus-root` 및 `--dry-run` CLI 인자 추가.
*   **Test Data**: Category A(Safe) 및 B(Blocked) 테스트 메시지 생성.

## 9. Engine Fix & Rendering (Step 520)
**요청 내용**:
Dry-Run 테스트 실패(규칙 미매칭, 템플릿 렌더링 오류) 수정.
*   **Rule**: `R0_CAT_A_EXEC` (기본 실행 규칙) 추가.
*   **Engine**: `{{msg_run_0}}` 등 템플릿 렌더링 로직 구현 후 Allowlist 검사 수행으로 변경.

## 10. Sandbox Verification Gate (Step 528)
**요청 내용**:
수정된 엔진으로 Dry-Run 재검증 수행 및 Gate 통과 기준 정의.
*   **기준**: Safe 메시지는 "Would execute" 증거, Blocked 메시지는 "Approval Request" 증거 생성 확인.
*   **결과**: `TO_HUMAN.md`에 "Sandbox Guardrails Gate = PASS" 기록.

## 11. Communication Protocol SSOT (Step 571)
**요청 내용**:
`docs/00_CONSTITUTION/COMMUNICATION.md` 생성 및 헌법 등재.
*   **내용**: 에이전트 간 채널(`TO_AGENT`, `TO_HUMAN`, `SHARED_CONTEXT`) 정의, 권한(R/W), 금지 사항(타 채널 덮어쓰기 등).

## 12. Runtime Bus Protocol (Step 578)
**요청 내용**:
`runtime/bus/README.md` 생성.
*   **내용**: Bus 디렉토리 역할, 메시지 스키마(v0.1), Rule DSL 실행 로직, Sandbox 우선 정책 문서화.

---
**저장 일시**: 2025-12-27 (Update 2)
