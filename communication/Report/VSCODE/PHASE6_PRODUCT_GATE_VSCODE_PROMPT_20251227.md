# PHASE6_PRODUCT_GATE_VSCODE_PROMPT_20251227

**작성일**: 2025-12-27  
**프로젝트**: 코인/주식 차트분석 (Next.js + Supabase)  
**Phase**: Phase 6 - UI State Machine for Product Tiers  
**요청자**: VSCODE Agent  

---

## 📋 작업 배경

### 현재 상태
- ✅ Phase 5: Crypto/Stock SSOT 분리 완료
- ✅ 분석 함수: `performAnalysis()`, `analyzeCrypto()`, `analyzeStock()` 구현
- ✅ uiState 필드: `loading | insufficient | ok | pro-locked | error` 정의됨
- ✅ UI 컴포넌트: `AnalysisPanel.tsx`, `StockPanel.tsx` 구현됨

### 문제점
1. **uiState 활용 미흡**
   - 컴포넌트에서 uiState를 사용하지만, Pro-locked 상태가 명확하지 않음
   - Free 사용자에게 Pro 기능 값이 blur로 숨겨지고 있으나, 일관성 부족

2. **카드별 렌더링 비일관성**
   - AnalysisPanel: Pro Locked에서 `blur-sm` + 절대 오버레이
   - StockPanel: 유사 패턴이지만 세부 구현 다름
   - 표준 패턴 정의 필요

3. **빈 상태 처리**
   - insufficient 상태에서 "N/A" 표시하는 경우 있음
   - 일부 카드에서 null 또는 undefined 값 표시 가능성
   - 표준화된 empty-state 필요

4. **Pro-locked 사용자 경험**
   - 블러 처리만 있고, CTA (Call-To-Action) 없음
   - "업그레이드" 버튼 또는 링크 없음
   - PremiumLock 컴포넌트는 정의되어 있으나 활용 불충분

---

## 🎯 작업 범위

### Phase 6 목표
**Crypto/Stock 분석 결과를 Free/Pro 사용자에게 일관되게 표시하는 UI State Machine 완성**

### 작업 내용

#### 1. uiState 정의 확정
```
- loading: 데이터 분석 중
- insufficient: 데이터 부족 (50개 미만)
- ok: 분석 완료, 모든 결과 표시 가능
- pro-locked: 분석 완료, Pro 기능만 제한
- error: 분석 실패
```

#### 2. 분석 결과 객체 구조 확인
- CryptoAnalysisResult / StockAnalysisResult 인터페이스
- probability, confidence, backtest, explanation, uiState
- **규칙**: uiState로만 UI 분기, 값 조작 금지

#### 3. 카드별 상태 렌더링 통일
- **4개 상태별 UI 표준**:
  1. Loading: skeleton 또는 animate-pulse
  2. Insufficient: 경고 아이콘 + 메시지
  3. OK: 전체 데이터 표시
  4. Pro-locked: 일부 데이터 blur + CTA

#### 4. Pro-locked 상태 처리
- Backtest 메트릭 중 일부만 blur (Max Drawdown, Profit Factor)
- 블러 처리 + 🔒 아이콘 + "PRO" 레이블
- **추가**: 클릭 시 업그레이드 모달 열기 (PremiumLock 활용)

#### 5. Free 사용자 데이터 정화
- "N/A" 표시 금지 (불필요함)
- insufficient 상태로 가지 않은 경우, 모든 값 유효
- 999 같은 이상 값 처리 (Profit Factor infinity → "Inf")

#### 6. Empty-state 발생 불가 구조
- null/undefined 체크 추가
- 모든 경로에서 uiState 명시
- fallback 값 정의 (없으면 insufficient 또는 error)

---

## 🏗️ 설계

### State Machine 다이어그램
```
┌──────────┐
│ Start    │
└────┬─────┘
     ↓
┌──────────────────────┐
│ Data Fetching        │ → uiState: 'loading'
└────┬─────────────────┘
     ↓
┌──────────────────────────────────────┐
│ Data Validation                      │
│ if (candles.length < 50)             │
│   → uiState: 'insufficient'          │
│ else if (error)                      │
│   → uiState: 'error'                 │
│ else                                 │
│   → Continue to Analysis             │
└────┬─────────────────────────────────┘
     ↓
┌──────────────────────────────────────┐
│ Analysis Execution                   │
│ performAnalysis() / analyzeCrypto()  │
│ analyzeStock()                       │
└────┬─────────────────────────────────┘
     ↓
┌──────────────────────────────────────┐
│ Pro Tier Gate                        │
│ if (userTier === 'free' &&           │
│     proFeatureRequired)              │
│   → uiState: 'pro-locked'            │
│ else                                 │
│   → uiState: 'ok'                    │
└────┬─────────────────────────────────┘
     ↓
┌──────────────────────┐
│ UI Render            │
│ based on uiState     │
└──────────────────────┘
```

### 공유 분석 로직 (수정 불가)
- calculateProbability()
- calculateConfidence()
- calculateMetrics()
- generateExplanation()

### UI 레이어만 변경
- AnalysisPanel.tsx
- StockPanel.tsx
- 새로운 CardRenderer 유틸리티 (선택사항)

---

## 📊 카드 렌더링 표준

### 모든 카드에 적용할 4-State Pattern

#### State 1: Loading
```tsx
<div className="bg-gray-900 rounded-xl p-6 border border-gray-800 animate-pulse">
  <div className="h-4 bg-gray-800 rounded w-1/3 mb-2"></div>
  <div className="h-20 bg-gray-800 rounded w-full"></div>
</div>
```

#### State 2: Insufficient / Error
```tsx
<div className="bg-gray-900 rounded-xl p-8 border border-gray-800 text-center">
  <div className="text-gray-500 text-lg font-bold">⚠️ Data Unavailable</div>
  <p className="text-sm text-gray-600 mt-2">Message</p>
</div>
```

#### State 3: OK (Free/Pro 모두)
```tsx
<div className="bg-gray-900 rounded-xl p-6 border border-gray-800 space-y-4">
  {/* All data visible */}
  <div className="text-2xl font-bold text-white">{value}</div>
</div>
```

#### State 4: Pro-locked (Free 사용자)
```tsx
<div className="bg-gray-800 p-3 rounded-lg relative overflow-hidden">
  {/* Label */}
  <div className="text-xs text-gray-500">Metric Name</div>
  
  {/* Value: blurred for free tier */}
  {userTier === 'pro' ? (
    <div className="text-lg font-bold text-white">{value}</div>
  ) : (
    <div className="blur-sm select-none text-lg font-bold text-gray-600">??</div>
  )}
  
  {/* Lock overlay */}
  {userTier !== 'pro' && (
    <div className="absolute inset-0 flex items-center justify-center 
                    bg-black/20 text-xs text-gray-400 font-bold">
      🔒 PRO
    </div>
  )}
</div>
```

---

## 🔒 Pro-locked 기능 목록

### Crypto (AnalysisPanel.tsx)
- Max Drawdown (최대 낙폭)
- Profit Factor (수익률 지수)

### Stock (StockPanel.tsx)
- 추가 지표 (Ichimoku, Volume Profile 등, 향후)
- 백테스트 상세 분석

---

## 🚫 금지사항 (MANDATORY)

- ❌ 분석 결과 값 조작: calculateProbability() 입력/출력 수정 금지
- ❌ 분석 로직 변경: performAnalysis(), analyzeCrypto(), analyzeStock() 수정 금지
- ❌ "N/A" / 999 / 빈 값 표시: 반드시 uiState로 처리
- ❌ 부분 카드 표시: insufficient 상태면 전체 섹션 비표시

---

## 📂 산출물

### 최종 산출물 2건

1. **PHASE6_PRODUCT_GATE_VSCODE_PROMPT_20251227.md** (본 문서)
   - 작업 요청, 범위, 설계, 제약사항

2. **PHASE6_PRODUCT_GATE_VSCODE_RESULT_20251227.md**
   - UI 구현 리포트
   - 변경 사항 목록
   - 테스트 케이스

### 저장 위치
```
F:\11 dev\251206 코인 차트분석\communication\Report\VSCODE\
├── PHASE6_PRODUCT_GATE_VSCODE_PROMPT_20251227.md ✅
└── PHASE6_PRODUCT_GATE_VSCODE_RESULT_20251227.md ⏳
```

---

## ✅ 검증 기준

### Phase 6 완료 조건
- [ ] uiState: 'loading' 상태에서 모두 skeleton UI
- [ ] uiState: 'insufficient' 상태에서 모두 경고 메시지
- [ ] uiState: 'ok' 상태에서 Pro/Free 모두 전체 데이터 표시
- [ ] uiState: 'pro-locked' 상태에서 Pro-only 기능만 blur + CTA
- [ ] 모든 카드가 4-state pattern 준수
- [ ] Free 사용자 화면에 "N/A" 또는 999 값 없음
- [ ] Pro 사용자는 모든 데이터 확인 가능
- [ ] PremiumLock 모달 클릭 시 업그레이드 페이지로 이동

---

## 📞 참고

**기준 파일**:
- `components/Analysis/AnalysisPanel.tsx`
- `components/Analysis/StockPanel.tsx`
- `components/PremiumLock.tsx`
- `lib/analysis/crypto.ts` (CryptoAnalysisResult)
- `lib/analysis/stock.ts` (StockAnalysisResult)

**관련 타입**:
- `CryptoAnalysisInput/Result`
- `StockAnalysisInput/Result`
- `ConfidenceResult`
- `ProbabilityResult`

**배경**: Phase 5에서 분석 로직 SSOT 분리 완료, Phase 6에서 제품화를 위한 UI 일관성 정리
