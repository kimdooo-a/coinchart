# 📌 SHARED_CONTEXT.md

## 목적 (Purpose)

이 문서는 **코인 차트 분석 프로젝트**에서 작업하는 모든 에이전트(Antigravity, Cursor AI, VSCode)가
항상 동일한 전제와 기준선을 공유하도록 하기 위한 **공통 컨텍스트 문서**이다.

본 문서는 작업 중 수시로 참조되며, **설계·정책·환경에 대한 단일 진실원(Single Source of Truth)** 역할을 한다.

---

## 🧱 프로젝트 기준 정보 (Baseline)

### 프로젝트 명

* **Coin Chart Analysis Project**

### 메인 루트 경로

```
F:\11 dev\251206 코인 차트분석
```

### 현재 전체 구조 요약

```
/
├─ app/                 # Next.js App Router (페이지/라우팅)
├─ components/          # UI 컴포넌트
├─ context/             # 전역 상태/언어 컨텍스트
├─ lib/                 # 핵심 분석 로직(Core Logic)
├─ scripts/             # 로컬 실행/디버깅 스크립트
├─ docs/                # 설계/정책/워크플로우 문서
├─ communication/       # 에이전트 간 작업 큐
├─ kdy-addon/
│  ├─ Poly-Tech/        # 멀티 에이전트 협업 엔진(Core)
│  └─ monet-registry-main/ # 랜딩 페이지/양식 템플릿
├─ package.json
├─ tsconfig.json
├─ eslint.config.mjs
└─ next.config.ts
```

---

## ☁️ 클라우드 / 배포 관련 기준

* ❌ **클라우드 코드, 배포 자동화, 외부 인프라 연동은 현재 범위에서 제외**
* Vercel / AWS / Supabase / 외부 API 확장은 **논의 전까지 금지**
* 본 프로젝트는 **로컬 분석 + 로컬 실행**을 기준으로 한다

---

## 🧠 작업 철학 및 원칙

1. **구조 우선**

   * 구현보다 모듈 경계와 책임 분리가 항상 우선한다

2. **단계 기반 진행**

   * Phase 1~4 워크플로우를 반드시 따른다

3. **Owner 존중**

   * MODULE_OWNERSHIP.md에 정의된 소유권을 침범하지 않는다

4. **명령은 communication을 통해서만 전달**

   * 구두/암묵적 요청 금지

---

## 🧩 모듈 소유권 요약

* **Antigravity**

  * 구조 설계, 정책, Core Logic 승인, 최종 리뷰

* **Cursor AI**

  * UI/페이지/컴포넌트 및 기능 구현

* **VSCode**

  * 로컬 실행, 테스트, 통합, 디버깅

상세 내용은 `docs/MODULE_OWNERSHIP.md`를 따른다.

---

## 🔄 커뮤니케이션 규칙 (필수)

| 파일                | 용도          | 규칙            |
| ----------------- | ----------- | ------------- |
| TO_ANTIGRAVITY.md | 설계/정책/승인 요청 | 구조·정책 관련만 작성  |
| TO_CURSOR.md      | 구현 작업 요청    | 기능/코드 작업만 작성  |
| TO_VSCODE.md      | 실행/디버깅 요청   | 테스트/실행/환경 이슈만 |
| SHARED_CONTEXT.md | 공통 기준선      | 요약/결정 사항만 기록  |

---

## 🚫 금지 사항 (Hard Rules)

* communication 폴더에 실제 코드 작성 금지
* 승인 없이 `lib/**` 공개 타입 변경 금지
* Phase를 건너뛰는 작업 금지
* 작업 기록 없이 코드 변경 금지

---

## ✅ 현재 확정 상태 (2025-12-25 기준)

* Phase 1 완료
* MODULE_OWNERSHIP.md 확정
* WORKFLOW.md 확정
* 클라우드/배포 범위 제외 확정

---

## 🔁 문서 갱신 규칙

* 본 문서는 **Antigravity만 수정 가능**
* 변경 시 반드시 하단에 변경 이력 추가

---

## 📝 변경 이력

* 2025-12-25: 초기 기준선 생성

---

**Maintainer**: Antigravity (Main Agent)
