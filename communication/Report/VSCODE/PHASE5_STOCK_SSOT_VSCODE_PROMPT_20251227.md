# PHASE5_STOCK_SSOT_VSCODE_PROMPT_20251227

**작성일**: 2025-12-27  
**프로젝트**: 코인/주식 차트분석 (Next.js + Supabase)  
**Phase**: Phase 5 - Stock SSOT 분리 구현  
**요청자**: VSCODE Agent  

---

## 📋 작업 배경

### 목표
Phase 5에서 구현된 **Stock 분석 SSOT (Single Source of Truth) 완전 분리**의 실제 구현 상태를 기술 관점에서 정리하고, 다른 개발자가 지속적으로 작업할 수 있도록 문서화

### SSOT 분리 원칙
1. **분석 입력은 DB(Supabase)만 사용** - 실시간 API 호출 금지
2. **Crypto와 Stock 파이프라인 완전 독립** - 코드/타입/DB 레벨에서 혼용 불가
3. **3단계 강제 메커니즘** - ESLint, TypeScript, Runtime 검증

### 제약사항
- 🚫 코드 수정 금지
- 📝 현재 구현된 상태 기준으로만 작성
- ✅ 기술적 정확성 중심

---

## 🎯 작업 내용

### 1. Crypto 분석 플로우 요약
- URL 경로, 데이터 소스, 분석 함수 명시
- Supabase `market_prices` 테이블 연동 구조
- 신호 생성 → 확률/신뢰도 계산 흐름

### 2. Stock 분석 플로우 요약
- URL 경로, 데이터 소스, 분석 함수 명시
- Supabase `stock_prices` 테이블 연동 구조
- 신호 생성 → 확률/신뢰도 계산 흐름

### 3. 두 플로우가 섞일 수 없는 이유
- **파일 구조 분리**: `lib/supabase/crypto.ts` vs `lib/supabase/stock.ts`
- **타입 강제**: `CryptoAnalysisInput` vs `StockAnalysisInput`의 `dataSource` 리터럴 타입
- **Import 제한**: ESLint 규칙으로 교차 import 차단
- **런타임 검증**: `dataSource !== 'supabase'` 체크

### 4. Route / API / Component / Analysis 연결 구조
- 각 엔트리포인트(Route) → API 엔드포인트 → 컴포넌트 → 분석 함수 연결도
- 데이터 흐름: DB → 쿼리 함수 → 신호 생성 → 분석 → UI
- 각 계층의 책임 범위 명시

### 5. 테스트 시나리오 요약
- Crypto 정상 경로 (기존 `/analysis/[symbol]`)
- Stock 정상 경로 (신규 `/analysis/stock/[symbol]`)
- 불충분 데이터 처리
- 프리/프로 레벨 게이트

---

## 📂 생성 산출물

### 최종 산출물 2건
1. **PHASE5_STOCK_SSOT_VSCODE_PROMPT_20251227.md** (본 문서)
   - 작업 요청사항, 범위, 제약사항
   
2. **PHASE5_STOCK_SSOT_VSCODE_RESULT_20251227.md**
   - 기술 리포트: 현재 구현된 상태 기준 전체 정리

### 저장 위치
```
F:\11 dev\251206 코인 차트분석\communication\Report\VSCODE\
├── PHASE5_STOCK_SSOT_VSCODE_PROMPT_20251227.md (✅ 생성됨)
└── PHASE5_STOCK_SSOT_VSCODE_RESULT_20251227.md (⏳ 작성중)
```

---

## ✅ 전체 체크리스트

- [ ] Crypto 분석 플로우 문서화
- [ ] Stock 분석 플로우 문서화
- [ ] SSOT 분리 메커니즘 설명
- [ ] Route/API/Component 연결도 작성
- [ ] 테스트 시나리오 정리
- [ ] RESULT 리포트 완성
- [ ] 기술 정확성 검증

---

## 📞 문의사항

**작성 기준일**: 2025-12-27  
**Next.js 버전**: Latest  
**Supabase 설정**: Production  
**배포 환경**: Vercel  
