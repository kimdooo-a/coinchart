# P3_MARKET_UI_VERIFICATION_CURSOR_PROMPT_20251228.md

**Date**: 2025-12-28  
**Agent**: CURSOR  
**Role**: AUX (Verification / Audit)  
**Phase**: P3-3 (Market UI Verification)

---

## 작업 개요

P3 단계에서 금지 영역 침범, 리그레션, 충돌 가능성을 사전에 차단하기 위한 검증 작업입니다.

**성격**: READ-ONLY / VERIFY ONLY  
**위치**: 협업 체계의 "감사관"

---

## 입력 문서 (검증 기준)

1. `P0_IMPLEMENTATION_MAP_AUDIT_ANTIGRAVITY_RESULT_20251228.md`
   - 금지 영역 정의 (lib/**, context/**, DetailedChart.tsx, Supabase 관련, 이벤트 핸들러/계산 로직)

2. `P1_UI_SHELL_STANDARDIZATION_ANTIGRAVITY_RESULT_20251228.md`
   - Global Shell 규칙: max-w-7xl, padding 규칙, header offset

3. `P3_MARKET_UI_UNIFICATION_ANTIGRAVITY_RESULT_20251228.md`
   - ANTIGRAVITY가 수행한 구조/UI 변경 내역

4. `P3_MARKET_UI_POLISH_VSCODE_RESULT_20251228.md`
   - VSCODE가 수행한 className 미세 조정 내역

---

## TOUCHABLE POLICY

❌ **코드 수정 금지**  
❌ **className 변경 금지**  
❌ **파일 생성/이동/삭제 금지**  

👉 **읽고, 비교하고, 검증만 수행**

---

## 검증 항목

### 1️⃣ 금지 영역 침범 여부 체크 (최우선)

다음 경로에 diff가 발생했는지 여부 확인:

- `lib/**`
- `context/**`
- `components/DetailedChart.tsx`
- Supabase 관련 파일
- 이벤트 핸들러 / 계산 로직

**결과를 YES / NO로 명시**

### 2️⃣ "ONE FILE ONE OWNER" 규칙 검증

동일 파일에 대해:
- ANTIGRAVITY → 구조/UI
- VSCODE → className 미세 조정

이외의 수정 흔적이 없는지 확인

### 3️⃣ 리그레션 가능성 점검

논리적 관점에서 아래 항목 점검:

- `/market` 렌더 시 조건부 렌더링이 CSS 변경으로 가려질 가능성
- 모바일에서 숨겨질 수 있는 정보 존재 여부
- grid/overflow 변경으로 클릭 불가 요소 발생 가능성

(※ 실제 실행이 아닌 정적 추론 기반)

### 4️⃣ P1 Global Shell 규칙 유지 여부

- `max-w-7xl` 규칙 충돌 여부
- `padding` 규칙 충돌 여부
- `header offset` 충돌 여부
- `/market`만 예외 처리된 CSS가 없는지 확인

---

## 출력 파일

**PATH**: `F:\11 dev\251206 코인 차트분석\communication\Report\CURSOR\`

**FILES**:
1. `P3_MARKET_UI_VERIFICATION_CURSOR_PROMPT_YYYYMMDD.md` (본 문서)
2. `P3_MARKET_UI_VERIFICATION_CURSOR_RESULT_YYYYMMDD.md` (항목별 검증 결과)
3. `P3_MARKET_UI_VERIFICATION_CURSOR_COMPLETE_YYYYMMDD.md` (전체 PASS 여부 및 다음 Phase 진행 가능 여부)

---

## 🔒 총사령관 명령

**CURSOR는 절대 고치지 않는다**

문제를 "발견"하면, 고치는 건 다음 Phase에서 다른 에이전트가 한다.

이 단계는 신뢰를 쌓는 단계다.

