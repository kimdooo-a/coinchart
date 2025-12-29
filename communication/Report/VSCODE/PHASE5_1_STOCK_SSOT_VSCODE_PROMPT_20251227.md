# PHASE5_1_STOCK_SSOT_VSCODE_PROMPT_20251227

**작성일**: 2025-12-27  
**프로젝트**: 코인/주식 차트분석 (Next.js + Supabase)  
**Phase**: Phase 5.1 - Stock Flow 문서화  
**요청자**: VSCODE Agent  

---

## 📋 작업 배경

### 목표
기존 `DATA_FLOW_CURRENT_STATE.md` 문서를 기반으로, **Stock 분석 흐름을 명시적으로 추가**하여 개발자가 Crypto와 Stock의 데이터 흐름을 명확히 구분할 수 있도록 문서화

### 현재 상태
- ✅ Phase 5: Crypto/Stock SSOT 분리 완료 (코드 레벨)
- ✅ Stock 데이터 경로, 분석 함수 구현됨
- ❌ 하지만 DATA_FLOW 문서에는 **Crypto 흐름만** 기술됨
- ❌ Stock 흐름이 별도로 문서화되지 않음

### 문제점
현재 `DATA_FLOW_CURRENT_STATE.md`는:
1. Crypto 데이터 흐름만 상세히 설명
2. Stock 흐름에 대한 내용 전무
3. 두 흐름의 분리 지점 명확하지 않음
4. 새로운 개발자가 Stock 파이프라인을 이해하기 어려움

---

## 🎯 작업 범위

### 작업 내용

#### 1. Stock 데이터 수집 경로 문서화
- Supabase `stock_prices` 테이블 스키마
- `lib/supabase/stock.ts` → `fetchStockPrices()` 함수 설명
- 데이터 동기화 방식 (현재: 수동 입력 / 향후: daily_cron 연동)
- Crypto `market_prices`와의 차이점 명시

#### 2. Stock 분석 API 흐름 문서화
- `/api/analysis/stock/[symbol]` 엔드포인트
- `lib/analysis/stock/fetchStockSSOT.ts` → `lib/analysis/stock-signals.ts` → `lib/analysis/stock.ts` 흐름
- Stock 신호 생성 (`generateStockSignals()`)
- Stock 분석 함수 (`analyzeStock()`)
- API 응답 형식

#### 3. Crypto 흐름과의 분리 지점 명시
- 파일 구조 비교 (crypto.ts vs stock.ts)
- 함수 이름 비교 (performAnalysis vs analyzeStock)
- 데이터 소스 비교 (market_prices vs stock_prices)
- URL 경로 비교 (/analysis/[symbol] vs /analysis/stock/[symbol])

#### 4. 공유 분석 로직 0 명문화
- Stock 분석이 독립적 구현임을 명시
- calculateProbability, calculateConfidence 등은 **공유**
- 하지만 signal generation은 **완전히 독립** (generateSignals vs generateStockSignals)
- input/output 타입도 독립 (CryptoAnalysisInput vs StockAnalysisInput)

---

## 🔒 제약사항 (MANDATORY)

- 🚫 **코드 수정 금지**: 문서화만 수행
- 🚫 **기존 Crypto 흐름 변경 금지**: 섹션 추가만 가능
- ✅ **현재 구현된 상태만**: 가상/예정/추측 흐름 금지
- ✅ **정확성 우선**: 실제 코드 기준으로 작성

---

## 📂 산출물

### 최종 산출물 2건

1. **PHASE5_1_STOCK_SSOT_VSCODE_PROMPT_20251227.md** (본 문서)
   - 작업 요청사항, 범위, 제약사항

2. **PHASE5_1_STOCK_SSOT_VSCODE_RESULT_20251227.md**
   - 문서 업데이트 리포트
   - 추가/수정 사항 목록

### 대상 문서

**업데이트 대상**: `F:\11 dev\251206 코인 차트분석\communication\Report\VSCODE\DATA_FLOW_CURRENT_STATE.md`

**원본 문서**: `F:\11 dev\251206 코인 차트분석\communication\Report\CURSOR\DATA_FLOW_CURRENT_STATE.md`

---

## ✅ 검증 기준

작성된 문서는 다음 조건을 만족해야 함:

- [ ] Stock 데이터 흐름 다이어그램 포함
- [ ] Stock API 엔드포인트 상세 설명
- [ ] Stock 신호 생성 로직 명시
- [ ] Crypto와 Stock의 분리 지점 명확
- [ ] 코드 경로 참조 (line number 포함)
- [ ] 실제 구현과 일치 (SSOT 원칙)
- [ ] 신규 개발자 이해 가능한 수준

---

## 📞 참고

**작성 기준일**: 2025-12-27  
**기준 파일 목록**:
- `lib/supabase/stock.ts` (StockPriceData fetch)
- `lib/analysis/stock.ts` (analyzeStock orchestrator)
- `lib/analysis/stock-signals.ts` (Stock signal generation)
- `components/Analysis/StockPanel.tsx` (Stock UI component)
- `app/api/analysis/stock/[symbol]/route.ts` (Stock API endpoint)
- `app/analysis/stock/[symbol]/page.tsx` (Stock detail page)
