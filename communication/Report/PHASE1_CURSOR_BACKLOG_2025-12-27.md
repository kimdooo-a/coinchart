# 📋 PHASE 1 IMPLEMENTATION BACKLOG
**Date**: 2025-12-27  
**Reporter**: Cursor AI (Implementation Agent)  
**Target Pages**: 홈 (`app/page.tsx`), 코인 분석 (`app/analysis/[symbol]/page.tsx`), 주식 분석 (`app/stock/page.tsx`, `app/stock-market/page.tsx`)

---

## A. P1-CORE: 서버사이드 프록시 + 캐싱 (유료 SaaS 필수)

### A1. Binance API 프록시 레이어 구축
**수정 대상 파일**:
- `app/api/binance/klines/route.ts` (신규)
- `app/api/binance/ticker/route.ts` (신규)
- `lib/cache/memory-cache.ts` (신규)
- `lib/cache/types.ts` (신규)
- `app/market/page.tsx` (수정: 직접 호출 → 프록시 사용)
- `lib/signal_engine.ts` (수정: 직접 호출 → 프록시 사용)
- `components/Chart/CryptoChart.tsx` (수정: 직접 호출 → 프록시 사용)

**예상 공수**: 2-3일

**위험 요소**:
- Rate Limit 관리 로직 복잡도
- 캐시 무효화 전략 (TTL 설정)
- 에러 핸들링 (Binance API 장애 시 fallback)

**완료 기준 (Done When)**:
- [ ] 모든 Binance API 호출이 서버 사이드로 이동
- [ ] 메모리 캐시 레이어 구현 (TTL: 1분~1시간)
- [ ] Rate Limit 미들웨어 구현 (1200 req/min 관리)
- [ ] 클라이언트에서 직접 호출하는 코드 0개
- [ ] API 호출 수 90% 감소 검증

---

### A2. Supabase Edge Function 캐싱
**수정 대상 파일**:
- `supabase/functions/cache-binance/` (신규)
- `lib/cache/supabase-edge.ts` (신규)
- `app/api/binance/klines/route.ts` (수정: Edge Function 우선 사용)

**예상 공수**: 1-2일

**위험 요소**:
- Edge Function 비용 (Supabase Pro 플랜 필요)
- Cold start 지연 시간

**완료 기준 (Done When)**:
- [ ] Edge Function 캐싱 로직 구현
- [ ] 캐시 히트율 80% 이상 달성
- [ ] 응답 시간 50% 개선 검증

---

## B. P1-ANALYSIS: 백테스트 고도화

### B1. 거래 비용 반영
**수정 대상 파일**:
- `lib/backtest.ts` (수정)
- `lib/backtest/config.ts` (신규)
- `lib/backtest/types.ts` (신규)

**예상 공수**: 2일

**위험 요소**:
- 기존 Win Rate 수치와 불일치 발생 (사용자 혼란 가능)
- 수수료율 설정의 주관성

**완료 기준 (Done When)**:
- [ ] 수수료 반영 (기본 0.1%, 설정 가능)
- [ ] 슬리피지 반영 (기본 0.05%, 설정 가능)
- [ ] 기존 Win Rate와 비교 리포트 생성
- [ ] 설정 UI 추가 (Pro 사용자 전용)

---

### B2. 성과 지표 확장
**수정 대상 파일**:
- `lib/backtest/metrics.ts` (신규)
- `lib/backtest.ts` (수정: Sharpe Ratio, MDD 계산 추가)
- `components/Analysis/BacktestPanel.tsx` (신규)

**예상 공수**: 3일

**위험 요소**:
- Sharpe Ratio 계산의 복잡도 (무위험 수익률 가정 필요)
- Max Drawdown 계산 성능

**완료 기준 (Done When)**:
- [ ] Sharpe Ratio 계산 구현
- [ ] Max Drawdown 계산 구현
- [ ] Profit Factor 계산 구현
- [ ] UI에 지표 표시 (Pro 사용자 전용)

---

### B3. 전략 커스터마이징
**수정 대상 파일**:
- `lib/backtest/strategy.ts` (신규)
- `lib/backtest/strategies/` (신규 디렉토리)
- `app/api/backtest/route.ts` (신규)

**예상 공수**: 4-5일

**위험 요소**:
- 전략 파라미터 조합 폭발
- 백테스팅 성능 저하

**완료 기준 (Done When)**:
- [ ] 진입/청산 전략 인터페이스 정의
- [ ] 기본 전략 3개 구현 (Breakout, Mean Reversion, Trend Following)
- [ ] 전략별 백테스트 결과 비교 UI
- [ ] Pro 사용자 전용 기능

---

## C. P1-STOCK: 주식 데이터 Mock 제거 또는 Demo 분리

### C1. TwelveData API 연동 (또는 Alpha Vantage)
**수정 대상 파일**:
- `lib/api/twelvedata.ts` (수정 또는 신규)
- `lib/api/stock-factory.ts` (신규)
- `lib/api/binance.ts` (수정: `generateMockCandles` 제거 또는 분리)
- `app/stock/page.tsx` (수정: Mock 분기 제거)
- `components/Chart/StockChart.tsx` (수정: 실제 API 사용)

**예상 공수**: 2-3일

**위험 요소**:
- TwelveData API 키 비용 (Free tier 제한)
- API Rate Limit (Free: 8 calls/min)
- 데이터 형식 차이 (Binance vs TwelveData)

**완료 기준 (Done When)**:
- [ ] `generateMockCandles()` 함수 제거 또는 Demo 모드로 분리
- [ ] TwelveData API 연동 완료
- [ ] 주식 차트에 실제 데이터 표시
- [ ] Mock 데이터 사용 시 "(Demo)" 라벨 명시

---

### C2. 주식 데이터 Demo 모드 분리
**수정 대상 파일**:
- `lib/api/binance.ts` (수정: `generateMockCandles` → `generateDemoCandles`)
- `app/stock/page.tsx` (수정: Demo 모드 토글 추가)
- `components/Chart/StockChart.tsx` (수정: Demo 배지 표시)

**예상 공수**: 1일

**위험 요소**:
- 사용자가 Demo와 Real을 구분하지 못할 수 있음

**완료 기준 (Done When)**:
- [ ] Demo 모드 명시적 표시 ("Demo Data" 배지)
- [ ] Real/Demo 모드 전환 UI
- [ ] Demo 모드 사용 시 경고 메시지

---

### C3. 주식 API 라우트 구현
**수정 대상 파일**:
- `app/api/stock/quote/route.ts` (수정: 실제 API 연동)
- `app/api/stock/history/route.ts` (수정: 실제 API 연동)
- `app/api/stock/time-series/route.ts` (수정: 실제 API 연동)

**예상 공수**: 2일

**위험 요소**:
- API 키 관리 (환경 변수)
- 에러 핸들링 (API 장애 시)

**완료 기준 (Done When)**:
- [ ] 모든 주식 API 라우트가 실제 데이터 반환
- [ ] 에러 핸들링 구현
- [ ] 캐싱 레이어 적용

---

## D. P1-UX: 홈/분석/주식 UI 일관성

### D1. Design System 토큰 정의
**수정 대상 파일**:
- `lib/design-system/tokens.ts` (신규)
- `lib/design-system/colors.ts` (신규)
- `lib/design-system/typography.ts` (신규)
- `tailwind.config.ts` (수정: 커스텀 토큰 추가)

**예상 공수**: 1일

**위험 요소**:
- 기존 스타일과의 충돌
- 브레이킹 체인지 가능성

**완료 기준 (Done When)**:
- [ ] 색상 팔레트 통일 (Primary, Secondary, Accent)
- [ ] 타이포그래피 스케일 정의
- [ ] 간격(Spacing) 시스템 정의
- [ ] Tailwind 설정에 반영

---

### D2. 공통 컴포넌트 라이브러리
**수정 대상 파일**:
- `components/ui/card.tsx` (수정: Design System 적용)
- `components/ui/button.tsx` (수정: Design System 적용)
- `components/ui/badge.tsx` (수정: Design System 적용)
- `components/layout/PageHeader.tsx` (신규)
- `components/layout/PageContainer.tsx` (신규)

**예상 공수**: 2-3일

**위험 요소**:
- 기존 컴포넌트 사용처 전반 수정 필요
- 스타일 충돌

**완료 기준 (Done When)**:
- [ ] 모든 페이지에서 공통 Header 사용
- [ ] 모든 페이지에서 공통 Container 사용
- [ ] 버튼 스타일 통일
- [ ] 카드 스타일 통일

---

### D3. 홈 페이지 리뉴얼
**수정 대상 파일**:
- `app/page.tsx` (수정)
- `components/hero-section.tsx` (수정: Design System 적용)
- `components/dashboard-grid.tsx` (수정: Design System 적용)

**예상 공수**: 2일

**위험 요소**:
- 기존 사용자 경험 변화
- 성능 영향

**완료 기준 (Done When)**:
- [ ] Design System 토큰 적용
- [ ] 반응형 레이아웃 개선
- [ ] 로딩 상태 개선
- [ ] 접근성 향상 (ARIA 속성)

---

### D4. 분석 페이지 UI 통일
**수정 대상 파일**:
- `app/analysis/[symbol]/page.tsx` (수정: Design System 적용)
- `app/analysis/page.tsx` (수정: Design System 적용)
- `components/Analysis/AnalysisPanel.tsx` (수정: Design System 적용)

**예상 공수**: 2일

**위험 요소**:
- 기존 분석 로직과의 충돌
- 성능 저하 가능성

**완료 기준 (Done When)**:
- [ ] Design System 토큰 적용
- [ ] 지표 카드 스타일 통일
- [ ] 차트 레이아웃 개선
- [ ] 모바일 반응형 개선

---

### D5. 주식 페이지 UI 통일
**수정 대상 파일**:
- `app/stock/page.tsx` (수정: Design System 적용)
- `app/stock-market/page.tsx` (수정: Design System 적용)
- `components/Chart/StockChart.tsx` (수정: Design System 적용)
- `components/Chart/StockTicker.tsx` (수정: Design System 적용)

**예상 공수**: 2일

**위험 요소**:
- Mock 데이터 제거와 동시 진행 시 복잡도 증가

**완료 기준 (Done When)**:
- [ ] Design System 토큰 적용
- [ ] 코인 분석 페이지와 스타일 일관성
- [ ] Demo 모드 배지 표시 (Mock 사용 시)
- [ ] 모바일 반응형 개선

---

## E. Quick Sanity: Mock/Simulation 분리표

### 현재 주식/온체인/고래 알림 중 Mock/Simulation

| 기능 | 파일 경로 | 상태 | Mock 비율 | 비고 |
|------|----------|------|-----------|------|
| **주식 차트 데이터** | `lib/api/binance.ts:27-51` | 🔴 100% Mock | 100% | `generateMockCandles()` 랜덤 생성 |
| **주식 Ticker** | `lib/api/binance.ts:90-108` | 🔴 100% Mock | 100% | `subscribeToTicker()` Mock 인터벌 |
| **주식 Klines** | `lib/api/binance.ts:128-133` | 🔴 100% Mock | 100% | `subscribeToKlines()` 빈 함수 반환 |
| **고래 경보** | `components/Signal/WhaleAlert.tsx:25-61` | 🔴 100% Simulation | 100% | `Math.random()` 기반 생성 |
| **시그널 스캔** | `app/signal/page.tsx:26-31` | 🔴 100% Mock | 100% | 3초 후 빈 배열 반환 |
| **주식 시장 심리** | `app/stock-market/page.tsx:104-112` | 🟡 부분 Real | 0% | `/api/stock/history` 호출 (실제 API) |
| **코인 분석** | `app/analysis/[symbol]/page.tsx` | ✅ 100% Real | 0% | Supabase + Binance API |
| **코인 차트** | `components/Chart/CryptoChart.tsx` | ✅ 100% Real | 0% | Binance API |
| **시장 스캔** | `lib/signal_engine.ts` | ✅ 100% Real | 0% | Binance API |

**요약**:
- **Mock/Simulation**: 5개 기능 (주식 3개, 고래 1개, 시그널 1개)
- **Real Data**: 4개 기능 (코인 관련)
- **부분 Real**: 1개 기능 (주식 시장 심리 - API는 Real이지만 데이터 소스 확인 필요)

---

## F. Phase 1 우선순위 매트릭스

| 작업 | 카테고리 | 공수 | 수익화 영향 | 기술 난이도 | 우선순위 |
|------|---------|------|------------|------------|----------|
| A1. Binance API 프록시 | CORE | 2-3일 | ⭐⭐⭐⭐⭐ | ⭐⭐ | **P0** |
| A2. Supabase Edge 캐싱 | CORE | 1-2일 | ⭐⭐⭐⭐ | ⭐⭐⭐ | **P1** |
| B1. 거래 비용 반영 | ANALYSIS | 2일 | ⭐⭐⭐⭐ | ⭐⭐ | **P1** |
| B2. 성과 지표 확장 | ANALYSIS | 3일 | ⭐⭐⭐⭐ | ⭐⭐⭐ | **P2** |
| B3. 전략 커스터마이징 | ANALYSIS | 4-5일 | ⭐⭐⭐ | ⭐⭐⭐⭐ | **P3** |
| C1. TwelveData 연동 | STOCK | 2-3일 | ⭐⭐⭐⭐⭐ | ⭐⭐ | **P0** |
| C2. Demo 모드 분리 | STOCK | 1일 | ⭐⭐⭐ | ⭐ | **P1** |
| C3. 주식 API 라우트 | STOCK | 2일 | ⭐⭐⭐⭐ | ⭐⭐ | **P1** |
| D1. Design System 토큰 | UX | 1일 | ⭐⭐ | ⭐ | **P2** |
| D2. 공통 컴포넌트 | UX | 2-3일 | ⭐⭐ | ⭐⭐ | **P2** |
| D3. 홈 페이지 리뉴얼 | UX | 2일 | ⭐⭐ | ⭐⭐ | **P3** |
| D4. 분석 페이지 UI | UX | 2일 | ⭐⭐ | ⭐⭐ | **P2** |
| D5. 주식 페이지 UI | UX | 2일 | ⭐⭐ | ⭐⭐ | **P2** |

**총 예상 공수**: 24-32일 (약 5-6주)

---

## G. Phase 1 실행 순서 권장

### Week 1: 핵심 인프라
1. **Day 1-3**: A1. Binance API 프록시 (P0)
2. **Day 4-5**: C1. TwelveData 연동 (P0)

### Week 2: 데이터 정직성
3. **Day 1**: C2. Demo 모드 분리 (P1)
4. **Day 2-3**: C3. 주식 API 라우트 (P1)
5. **Day 4-5**: A2. Supabase Edge 캐싱 (P1)

### Week 3: 분석 고도화
6. **Day 1-2**: B1. 거래 비용 반영 (P1)
7. **Day 3-5**: B2. 성과 지표 확장 (P2)

### Week 4-5: UI 통일
8. **Day 1**: D1. Design System 토큰 (P2)
9. **Day 2-4**: D2. 공통 컴포넌트 (P2)
10. **Day 5-6**: D4. 분석 페이지 UI (P2)
11. **Day 7-8**: D5. 주식 페이지 UI (P2)

### Week 6: 선택적 작업
12. **Day 1-5**: B3. 전략 커스터마이징 (P3, 선택)
13. **Day 6-7**: D3. 홈 페이지 리뉴얼 (P3, 선택)

---

## H. 위험 관리 체크리스트

### 기술적 위험
- [ ] Rate Limit 초과 시 Fallback 전략
- [ ] 캐시 무효화 전략 문서화
- [ ] 에러 핸들링 통일
- [ ] 성능 모니터링 도구 도입

### 비즈니스 위험
- [ ] Mock 데이터 제거 시 사용자 혼란 최소화
- [ ] Win Rate 수치 변경 시 사용자 안내
- [ ] API 비용 예산 관리

### 품질 위험
- [ ] 단위 테스트 작성 (최소 60% 커버리지)
- [ ] 통합 테스트 작성
- [ ] E2E 테스트 (핵심 플로우)

---

**Backlog Status**: ✅ COMPLETED  
**Next Action**: Commander 승인 후 Phase 1 시작








