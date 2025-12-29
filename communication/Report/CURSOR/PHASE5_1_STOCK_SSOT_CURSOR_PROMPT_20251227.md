# PHASE5_1_STOCK_SSOT_CURSOR_PROMPT_20251227.md

## Phase 5.1 Stock API Signal Usage Verification — Prompt

### 요청 사항

**SSOT:**
- Stock 분석은 `generateStockSignals`만 사용
- Crypto `generateSignals` 혼용 절대 금지

**GLOBAL RULES (MANDATORY):**
- 코드 수정 금지
- 실제 코드 기준으로만 판단
- 추정/가정 기록 금지

**AUTO-LOG:**
- 경로: `F:\11 dev\251206 코인 차트분석\communication\Report\CURSOR\`
- 파일명:
  - `PHASE5_1_STOCK_SSOT_CURSOR_PROMPT_20251227.md` (이 파일)
  - `PHASE5_1_STOCK_SSOT_CURSOR_RESULT_20251227.md` (결과 보고서)

**GOAL:**
- Stock API route에서 Crypto signal 함수 혼용 여부 최종 확인
- Phase 5 원칙 위반 여부를 파일 단위로 명확히 판정

**EXECUTION STEPS:**
1. `app/api/analysis/stock/[symbol]/route.ts` 확인
2. import 목록 점검
3. `generateSignals` 사용 여부 확인
4. 결과를 YES / NO로 명시
5. 위반 시 정확한 파일/라인 명시

**OUTPUT:**
- PROMPT 기록 1건 (이 파일)
- RESULT 점검 리포트 1건

---

## 요청 일시
- 2025-12-27

## 요청자
- Cursor AI Agent

## 작업 범위
- Phase 5.1: Stock API Signal Usage Verification
- Stock API route에서 Crypto signal 함수 혼용 여부 확인

