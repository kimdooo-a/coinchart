# PHASE5_1_STOCK_SSOT_CURSOR_RESULT_20251227.md

## Phase 5.1 Stock API Signal Usage Verification — Result

### 📋 요약

**작업 일시:** 2025-12-27  
**작업 범위:** Stock API route에서 Crypto signal 함수 혼용 여부 확인  
**검증 대상:** `app/api/analysis/stock/[symbol]/route.ts`

---

## 1. 검증 결과

### 1.1 Phase 5 원칙 위반 여부

**결과:** ✅ **YES - 위반 확인됨**

**판정 근거:**
- Stock API route에서 Crypto `generateSignals` 함수를 사용하고 있음
- Phase 5 원칙: "Stock 분석은 `generateStockSignals`만 사용" 위반

---

## 2. 상세 점검 결과

### 2.1 파일 정보

**파일 경로:** `app/api/analysis/stock/[symbol]/route.ts`  
**파일 목적:** Stock 분석 API 엔드포인트  
**SSOT 원칙:** Stock 분석은 `generateStockSignals`만 사용해야 함

### 2.2 Import 목록 점검

**Line 7-10: Import 문**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { fetchStockSSOT } from '@/lib/analysis/stock/fetchStockSSOT';
import { generateSignals } from '@/lib/analysis/signals';  // ❌ 위반
import { analyzeStock } from '@/lib/analysis/stock';
```

**위반 내용:**
- Line 9: `import { generateSignals } from '@/lib/analysis/signals';`
  - `@/lib/analysis/signals`는 Crypto 전용 signals 파일
  - Stock API route에서 Crypto signals import 사용

**올바른 Import:**
```typescript
import { generateStockSignals } from '@/lib/analysis/stock-signals';  // ✅ 올바름
```

### 2.3 generateSignals 사용 여부

**Line 48-49: 함수 호출**
```typescript
// 2. Generate Signals (from SSOT data only)
const { signals, adxValue, bbWidth } = generateSignals(priceData);  // ❌ 위반
```

**위반 내용:**
- Line 49: `generateSignals(priceData)` 호출
  - Crypto 전용 `generateSignals` 함수 사용
  - Stock 전용 `generateStockSignals` 함수를 사용해야 함

**올바른 호출:**
```typescript
const { signals, adxValue, bbWidth } = generateStockSignals(priceData);  // ✅ 올바름
```

---

## 3. 위반 상세 정보

### 3.1 위반 파일

| 파일 경로 | 위반 라인 | 위반 내용 | 심각도 |
|----------|----------|----------|--------|
| `app/api/analysis/stock/[symbol]/route.ts` | Line 9 | Crypto `generateSignals` import | 🔴 Critical |
| `app/api/analysis/stock/[symbol]/route.ts` | Line 49 | Crypto `generateSignals` 함수 호출 | 🔴 Critical |

### 3.2 위반 유형

**위반 유형:** Phase 5 SSOT 분리 원칙 위반

**위반 내용:**
1. **Import 위반:**
   - Crypto 전용 signals 모듈을 Stock API route에서 import
   - `@/lib/analysis/signals` (Crypto) → `@/lib/analysis/stock-signals` (Stock)로 변경 필요

2. **함수 호출 위반:**
   - Crypto 전용 `generateSignals()` 함수를 Stock 분석에 사용
   - `generateSignals()` → `generateStockSignals()`로 변경 필요

### 3.3 영향 범위

**영향 받는 기능:**
- `/api/analysis/stock/[symbol]` API 엔드포인트
- Stock 분석 결과의 신호 생성 로직
- Stock 분석의 기술적 지표 계산

**잠재적 문제:**
- Crypto 전용 기술적 지표가 Stock 데이터에 적용됨
- Stock 전용 지표 (SMA, RSI, MACD 등)가 제대로 계산되지 않을 수 있음
- Phase 5 SSOT 분리 원칙 위반으로 인한 아키텍처 일관성 훼손

---

## 4. 참고 정보

### 4.1 올바른 사용 예시

**Stock 컴포넌트 (StockPanel.tsx):**
```typescript
// ✅ 올바른 사용
import { generateStockSignals } from '@/lib/analysis/stock-signals';

const { signals, adxValue, bbWidth } = generateStockSignals(candles);
```

**Crypto 컴포넌트 (AnalysisPanel.tsx):**
```typescript
// ✅ 올바른 사용
import { generateSignals } from '@/lib/analysis/signals';

const { signals, adxValue, bbWidth } = generateSignals(candles);
```

### 4.2 함수 비교

**Crypto Signals (`lib/analysis/signals.ts`):**
- 함수명: `generateSignals(candles: CandleData[])`
- 입력: `CandleData[]` (Crypto 전용)
- 지표: Crypto 전용 기술적 지표
- 용도: Crypto 분석 전용

**Stock Signals (`lib/analysis/stock-signals.ts`):**
- 함수명: `generateStockSignals(candles: StockPriceData[])`
- 입력: `StockPriceData[]` (Stock 전용)
- 지표: Stock 전용 기술적 지표 (SMA, RSI, MACD, Volume Trend, Price Position)
- 용도: Stock 분석 전용

---

## 5. 수정 필요 사항

### 5.1 수정 대상 파일

**파일:** `app/api/analysis/stock/[symbol]/route.ts`

**수정 사항:**

1. **Line 9: Import 수정**
   ```typescript
   // 변경 전
   import { generateSignals } from '@/lib/analysis/signals';
   
   // 변경 후
   import { generateStockSignals } from '@/lib/analysis/stock-signals';
   ```

2. **Line 49: 함수 호출 수정**
   ```typescript
   // 변경 전
   const { signals, adxValue, bbWidth } = generateSignals(priceData);
   
   // 변경 후
   const { signals, adxValue, bbWidth } = generateStockSignals(priceData);
   ```

### 5.2 수정 후 검증

**검증 항목:**
- [ ] Import 문이 `generateStockSignals`로 변경됨
- [ ] 함수 호출이 `generateStockSignals()`로 변경됨
- [ ] ESLint 검증 통과 (cross-import 없음)
- [ ] TypeScript 컴파일 성공
- [ ] Stock 분석 API 정상 동작 확인

---

## 6. 결론

### 6.1 최종 판정

**Phase 5 원칙 위반:** ✅ **YES**

**위반 파일:**
- `app/api/analysis/stock/[symbol]/route.ts` (Line 9, Line 49)

**위반 내용:**
- Crypto 전용 `generateSignals` 함수를 Stock API route에서 사용
- Phase 5 SSOT 분리 원칙 위반

### 6.2 권장 조치

1. **즉시 수정 필요:**
   - `app/api/analysis/stock/[symbol]/route.ts` 파일 수정
   - `generateSignals` → `generateStockSignals`로 변경

2. **검증 필요:**
   - 수정 후 ESLint 검증
   - Stock 분석 API 동작 확인
   - Stock 전용 지표 정상 계산 확인

3. **예방 조치:**
   - ESLint 규칙 강화 (Crypto/Stock cross-import 차단)
   - 코드 리뷰 체크리스트에 추가

---

**보고서 작성 일시:** 2025-12-27  
**작성자:** Cursor AI Agent  
**검증 상태:** ✅ 완료  
**위반 여부:** ✅ YES (위반 확인됨)

