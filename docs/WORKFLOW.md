# 🔄 WORKFLOW.md

## 목적 (Purpose)

이 문서는 **코인 차트 분석 프로젝트**의 전체 작업 흐름을 **Phase 1 ~ Phase 4**로 구분하고,
각 단계별 **역할, Gate(완료 조건), 에이전트 간 채널 규칙**을 명확히 정의한다.

본 워크플로우는 **Poly-Tech 멀티 에이전트 협업 방식**의 공식 운영 기준이다.

---

## 🧭 전체 Phase 개요

| Phase   | 단계명        | 주도 Agent        | 핵심 목표       |
| ------- | ---------- | --------------- | ----------- |
| Phase 1 | 기획 · 구조 확정 | Antigravity     | 구조/정책/경계 고정 |
| Phase 2 | 구현 · 병렬 코딩 | Cursor · VSCode | 기능 구현 및 통합  |
| Phase 3 | 최종 확인 · 승인 | Antigravity     | 설계·정책 준수 검증 |
| Phase 4 | 디버깅 · 안정화  | VSCode          | 실행 안정성 확보   |

---

## Phase 1 — 기획 · 구조 확정 (Antigravity)

### 🎯 목표

* 프로젝트 구조와 모듈 경계 고정
* 멀티 에이전트 협업 규칙 확정
* 이후 단계에서 **설계 드리프트 방지**

### 👤 담당 Agent

* **Antigravity (단독)**

### 📦 주요 작업

* 전체 디렉토리 구조 분석
* 모듈 경계 정의 및 소유권 지정
* 정책(승인/금지/허용 규칙) 정의

### 📄 산출물

* `docs/MODULE_OWNERSHIP.md`
* `docs/POLICIES.md`
* `docs/WORKFLOW.md`
* `communication/SHARED_CONTEXT.md` (기준선 요약)

### 🚦 Gate 조건 (Phase 1 → Phase 2)

* MODULE_OWNERSHIP 문서 확정
* 정책 문서 확정
* SHARED_CONTEXT에 "현재 기준선" 명시

---

## Phase 2 — 구현 · 병렬 코딩 (Cursor · VSCode)

### 🎯 목표

* 모듈 소유권을 기준으로 **충돌 없는 병렬 구현**
* 기능 단위로 점진적 완성

### 👥 담당 Agent 역할

#### Cursor AI

* UI / 페이지 / 컴포넌트 구현
* Core Logic 내부 구현(정책 변경 제외)
* 기능 단위 코드 작성

#### VSCode

* 로컬 실행 환경 유지
* 테스트 / 린트 / 빌드 실행
* 통합 과정에서 발생하는 오류 재현 및 정리

#### Antigravity (수시 개입)

* 인터페이스 변경 승인
* 구조/정책 위반 여부 판단

### 📄 산출물

* 기능 구현 코드
* 테스트 통과 결과
* 통합 실행 로그

### 🚦 Gate 조건 (Phase 2 → Phase 3)

* 로컬 테스트/린트 통과 (VSCode 확인)
* 주요 기능 동작 확인 (Cursor 확인)
* 모듈 경계 위반 0건 (Antigravity 확인)

---

## Phase 3 — 최종 확인 · 승인 (Antigravity)

### 🎯 목표

* 전체 코드가 **초기 설계/정책을 준수**하는지 검증
* 다음 단계(디버깅)로 넘길 수 있는 상태인지 판단

### 👤 담당 Agent

* **Antigravity (단독)**

### 📦 주요 작업

* Core Logic 구조 검토
* 공개 타입/인터페이스 변경 이력 확인
* Phase 2 구현 결과 종합 리뷰

### 📄 산출물

* `docs/FINAL_REVIEW.md`
* 승인 또는 수정 요청 기록

### 🚦 Gate 조건 (Phase 3 → Phase 4)

* Antigravity 승인 완료
* 디버깅 대상 이슈 목록 정리

---

## Phase 4 — 디버깅 · 안정화 (VSCode)

### 🎯 목표

* 실행 중 발생하는 오류 제거
* 성능/안정성 확보

### 👥 담당 Agent 역할

#### VSCode (주도)

* 디버깅 세션 수행
* 브레이크포인트/로그 기반 원인 분석
* 재현 케이스 정리

#### Cursor AI

* VSCode가 정리한 이슈 기반 코드 수정
* Owner 범위 내 패치 수행

#### Antigravity (필요 시)

* 수정 사항이 설계를 침해하는지 판단

### 📄 산출물

* 안정화 패치
* 재현 및 해결 기록

### 🚦 Gate 조건 (완료)

* 치명적 오류 0
* 주요 시나리오 정상 동작

---

## 🔌 Communication 채널 규칙

| 파일                  | 용도          | 작성 규칙         |
| ------------------- | ----------- | ------------- |
| `TO_ANTIGRAVITY.md` | 설계/정책/승인 요청 | 구조·정책 관련 내용만  |
| `TO_CURSOR.md`      | 구현 작업 요청    | 기능/코드 구현만     |
| `TO_VSCODE.md`      | 실행/디버깅 요청   | 테스트/실행/환경 이슈만 |
| `SHARED_CONTEXT.md` | 공통 기준선      | 결정 사항 요약 전용   |

**공통 규칙**

* 실제 코드는 communication 폴더에 작성하지 않는다
* 각 채널의 목적을 벗어난 요청은 무효

---

## ⚖️ 우선순위 원칙

1. **MODULE_OWNERSHIP.md**가 항상 최우선 기준
2. Phase 상위 단계의 결정은 하위 단계보다 우선
3. 긴급 상황에서도 Core 정책 변경은 사후 승인 필수

---

## 📌 이 문서의 효력

* Phase 1에서 확정되며 이후 단계에서 준수 의무 발생
* 변경 시 Antigravity가 직접 수정

---

**Last Updated**: 2025-12-25
**Maintainer**: Antigravity (Main Agent)
