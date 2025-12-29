# 🧩 MODULE_OWNERSHIP.md

## 목적 (Purpose)

이 문서는 **코인 차트 분석 프로젝트**에서 발생할 수 있는 멀티 에이전트 간 충돌을 방지하기 위해,
각 **폴더/모듈 단위의 소유권(Owner)** 과 **변경 승인 규칙**을 명확히 정의한다.

본 문서는 Poly-Tech 기반 멀티 에이전트 협업의 **최상위 기준선(Ground Truth)** 이다.

---

## 에이전트 역할 요약

| Agent           | 역할 요약                        |
| --------------- | ---------------------------- |
| **Antigravity** | 구조 설계, 정책 결정, 아키텍처 리뷰, 최종 승인 |
| **Cursor AI**   | 기능 구현(UI, 페이지, 앱 연결 로직)      |
| **VSCode**      | 실행/통합/디버깅, 로컬 테스트 및 환경 유지    |

---

## 전체 모듈 소유권 매트릭스

### 1️⃣ App / UI 영역 (제품 구현)

| 경로              | Owner  | 승인 필요 여부 |
| --------------- | ------ | -------- |
| `app/**`        | Cursor | ❌        |
| `components/**` | Cursor | ❌        |
| `context/**`    | Cursor | ❌        |

**설명**

* UI, 페이지, 라우팅, 사용자 인터랙션 담당 영역
* Cursor는 자유롭게 구현 가능
* 단, Core Logic(`lib/**`) 공개 타입을 직접 변경하는 것은 금지

---

### 2️⃣ Core Logic 영역 (분석 엔진 핵심)

| 경로                     | 기본 Owner    | 변경 승인       |
| ---------------------- | ----------- | ----------- |
| `lib/indicators/**`    | Cursor (구현) | Antigravity |
| `lib/analysis/**`      | Cursor (구현) | Antigravity |
| `lib/backtest/**`      | Cursor (구현) | Antigravity |
| `lib/fractal/**`       | Cursor (구현) | Antigravity |
| `lib/signal_engine/**` | Cursor (구현) | Antigravity |
| `lib/types/**` (공개 타입) | Antigravity | 필수          |

**설명**

* Core Logic는 프로젝트의 “수학적·통계적 근간”
* Cursor는 내부 구현 가능
* **공개 타입, 인터페이스, 알고리즘 정책 변경은 Antigravity 승인 필수**

---

### 3️⃣ Ops / 실행 / 디버깅 영역

| 경로                  | Owner  | 승인 필요 여부 |
| ------------------- | ------ | -------- |
| `scripts/**`        | VSCode | ❌        |
| `package.json`      | VSCode | ❌        |
| `tsconfig.json`     | VSCode | ❌        |
| `eslint.config.mjs` | VSCode | ❌        |
| `.vscode/**`        | VSCode | ❌        |
| `middleware.ts`     | VSCode | ❌        |
| `next.config.ts`    | VSCode | ❌        |

**설명**

* 로컬 실행, 테스트, 디버깅, 성능 측정 책임 영역
* VSCode는 자유롭게 수정 가능
* 단, Core Logic의 의미가 바뀌는 수정은 Cursor/Antigravity에 패치 요청

---

### 4️⃣ 문서 / 정책 / 워크플로우 영역

| 경로                | Owner       | 승인 필요 여부 |
| ----------------- | ----------- | -------- |
| `docs/**`         | Antigravity | ❌        |
| `ARCHITECTURE.md` | Antigravity | ❌        |
| `POLICIES.md`     | Antigravity | ❌        |
| `WORKFLOW.md`     | Antigravity | ❌        |
| `FINAL_REVIEW.md` | Antigravity | ❌        |

**설명**

* 프로젝트 구조, 정책, 단계 흐름의 기준선
* 다른 에이전트는 수정 제안만 가능

---

### 5️⃣ Agent Communication 영역 (Poly-Tech 연계)

| 경로                                | Owner       | 규칙            |
| --------------------------------- | ----------- | ------------- |
| `communication/TO_ANTIGRAVITY.md` | All         | 설계/승인 요청만 작성  |
| `communication/TO_CURSOR.md`      | All         | 구현 작업 요청만 작성  |
| `communication/TO_VSCODE.md`      | All         | 실행/디버깅 요청만 작성 |
| `communication/SHARED_CONTEXT.md` | Antigravity | 기준선 요약 전용     |

**설명**

* 이 영역은 "작업 큐" 역할
* 실제 코드는 작성하지 않음
* 상태 공유 및 명령 전달 전용

---

## 변경 승인 규칙 (Approval Rules)

### ❗ Antigravity 승인 필수 변경

* `lib/**` 공개 타입 변경
* 알고리즘 정책(가중치, 판단 기준) 변경
* 모듈 경계 이동 또는 신규 Core 모듈 추가

### ⭕ 승인 불필요 변경

* UI/페이지/컴포넌트 구현 변경
* 디버깅 목적의 설정/스크립트 수정
* 테스트 코드 추가

---

## 분쟁 해결 원칙

1. Owner가 우선 결정권을 가진다
2. 경계가 모호할 경우 Antigravity 판단을 따른다
3. 긴급 디버깅 상황에서도 Core 정책 변경은 사후 승인 필요

---

## 이 문서의 지위

* 이 문서는 **Phase 1 (기획 단계)** 에서 확정된다
* Phase 2~4 동안 모든 에이전트는 본 문서를 기준으로 행동한다
* 변경 시 반드시 Antigravity가 직접 수정한다

---

**Last Updated**: 2025-12-25
**Maintainer**: Antigravity (Main Agent)
