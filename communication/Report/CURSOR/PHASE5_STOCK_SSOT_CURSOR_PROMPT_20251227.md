# PHASE5_STOCK_SSOT_CURSOR_PROMPT_20251227.md

## Phase 5 Stock SSOT Separation — File-Level Change Report

### 요청 사항

**SSOT:**
- Crypto: `market_prices`
- Stock: `stock_prices`
- Phase 5 범위 외 코드 변경 금지

**GLOBAL RULES (MANDATORY):**
- 코드 수정 금지
- 파일 추적/정리만 수행
- 실제 변경된 것만 기록 (추정 금지)

**AUTO-LOG:**
- 경로: `F:\11 dev\251206 코인 차트분석\communication\Report\CURSOR\`
- 파일명:
  - `PHASE5_STOCK_SSOT_CURSOR_PROMPT_20251227.md` (이 파일)
  - `PHASE5_STOCK_SSOT_CURSOR_RESULT_20251227.md` (결과 보고서)

**GOAL:**
- Phase 5에서 생성/수정된 파일을 정확히 추적
- Crypto / Stock 분리가 파일 구조 차원에서 어떻게 강제되는지 명확히 기록

**EXECUTION STEPS:**
1. 신규 생성 파일 목록 정리
   - 경로 / 파일명 / 역할
2. 수정된 기존 파일 목록 정리
   - 변경 이유 / 변경 요약
3. Import 분리 강제 장치 정리
   - ESLint
   - TypeScript
   - Runtime
4. "공유 분석 로직 0" 여부 명시

**OUTPUT:**
- PROMPT 기록 1건 (이 파일)
- RESULT 보고서 1건

---

## 요청 일시
- 2025-12-27

## 요청자
- Cursor AI Agent

## 작업 범위
- Phase 5: Stock SSOT 완전 분리
- Crypto SSOT (market_prices) 유지
- Stock SSOT (stock_prices) 신규 생성 및 분리

