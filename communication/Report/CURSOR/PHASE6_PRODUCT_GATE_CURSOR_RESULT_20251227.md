# PHASE6_PRODUCT_GATE_CURSOR_RESULT_20251227.md

## Phase 6 Pro / Free Feature Gating Code Trace — Result

### 📋 요약

**작업 일시:** 2025-12-27  
**작업 범위:** Phase 6 Pro/Free Feature Gating 코드 추적  
**SSOT 원칙:** 분석 결과는 동일, 노출/권한/마스킹만 다르게 처리

---

## 1. userTier 기반 분기 코드 위치

### 1.1 컴포넌트 레벨 분기

#### 1.1.1 Crypto Analysis Panel

**파일:** `components/Analysis/AnalysisPanel.tsx`

**Line 36-38: userTier 설정**
```typescript
// Free vs PRO Gate
const isPro = false;
const userTier = isPro ? 'pro' : 'free';
```

**Line 98: 분석 함수에 userTier 전달**
```typescript
return performAnalysis({
    symbol,
    timeframe: interval,
    signals,
    adxValue,
    bbWidth,
    userTier,  // ← userTier 전달
    trades: []
});
```

**Line 144-145: UI 상태 확인**
```typescript
const isLocked = uiState === 'pro-locked'; // Orchestrator might return this if strict
// But we handle masking here based on userTier too.
```

**Line 228: Free Tier 배지 표시**
```typescript
{!isPro && <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded">FREE Tier</span>}
```

#### 1.1.2 Stock Analysis Panel

**파일:** `components/Analysis/StockPanel.tsx`

**Line 21-23: userTier 설정**
```typescript
// Free vs PRO Gate
const isPro = false;
const userTier = isPro ? 'pro' : 'free';
```

**Line 66: 분석 함수에 userTier 전달**
```typescript
return analyzeStock({
    symbol,
    period,
    signals,
    adxValue,
    bbWidth,
    userTier,  // ← userTier 전달
    dataSource: 'supabase',
    sampleSize: candles.length
});
```

**Line 123: UI 상태 확인**
```typescript
const isLocked = uiState === 'pro-locked';
```

**Line 173-177: Pro Lock UI 표시**
```typescript
{isLocked && (
    <div className="bg-gradient-to-r from-purple-900 to-purple-800 rounded-lg p-6 text-center border border-purple-600">
        <PremiumLock reason={t.proLock} />
    </div>
)}
```

### 1.2 분석 함수 레벨 분기

#### 1.2.1 Explanation Generator

**파일:** `lib/explanation/generator.ts`

**Line 10: userTier 입력 타입**
```typescript
interface GeneratorInput {
    probability: ProbabilityResult;
    confidence: ConfidenceResult;
    backtest?: BacktestMetrics;
    userTier: 'free' | 'pro';  // ← userTier 입력
}
```

**Line 14: userTier 추출**
```typescript
const { probability, confidence, backtest, userTier } = input;
```

**Line 75-87: userTier 기반 설명 필터링**
```typescript
if (userTier === 'free') {
    // Free tier limitations? Template is already 3-line structure. 
    // We can keep it as is, or hide specific details. 
    // Requirement: "Free: evidence 2줄 + risk 1줄 + watch 1줄"
    // Current template is roughly that length.
} else {
    // Pro: Add extra insight if available
    if (backtest) {
        const pf = backtest.profitFactor >= 999 ? "N/A" : backtest.profitFactor.toFixed(2);
        const wr = backtest.winRate >= 999 ? "N/A" : `${backtest.winRate.toFixed(1)}%`;
        finalSections.evidence += ` (과거 승률 ${wr}, 손익비 ${pf})`;
    }
}
```

**Line 101: isPro 플래그 반환**
```typescript
isPro: userTier === 'pro'
```

#### 1.2.2 Analysis Orchestrator

**파일:** `lib/analysis/orchestrator.ts`

**Line 17: userTier 입력 타입**
```typescript
export interface AnalysisInput {
    // ...
    userTier: 'free' | 'pro';  // ← userTier 입력
    // ...
}
```

**Line 95: Explanation Generator에 userTier 전달**
```typescript
const explanation = generateExplanation({
    probability,
    confidence: probability.confidence,
    backtest,
    userTier: input.userTier  // ← userTier 전달
});
```

**Line 127-129: userTier 체크 (주석 처리)**
```typescript
if (input.userTier === 'free') {
    // We deliver 'ok' state generally, but UI components checks userTier to mask slots.
}
```

**참고:** Orchestrator는 분석 결과를 변경하지 않고, userTier를 explanation generator에만 전달

#### 1.2.3 Stock Analysis

**파일:** `lib/analysis/stock.ts`

**Line 21: userTier 입력 타입**
```typescript
export interface StockAnalysisInput {
    // ...
    userTier: 'free' | 'pro';  // ← userTier 입력
    // ...
}
```

**Line 84: Explanation Generator에 userTier 전달**
```typescript
const explanation = generateExplanation({
    probability,
    confidence,
    backtest,
    userTier: input.userTier  // ← userTier 전달
});
```

**참고:** Stock 분석 함수는 분석 계산 자체는 변경하지 않고, userTier를 explanation generator에만 전달

#### 1.2.4 Crypto Analysis

**파일:** `lib/analysis/crypto.ts`

**Line 21: userTier 입력 타입**
```typescript
export interface CryptoAnalysisInput {
    // ...
    userTier: 'free' | 'pro';  // ← userTier 입력
    // ...
}
```

**Line 84: Explanation Generator에 userTier 전달**
```typescript
const explanation = generateExplanation({
    probability,
    confidence,
    backtest,
    userTier: input.userTier  // ← userTier 전달
});
```

**참고:** Crypto 분석 함수도 분석 계산 자체는 변경하지 않고, userTier를 explanation generator에만 전달

---

## 2. Pro 전용 필드 마스킹 처리

### 2.1 Crypto Analysis Panel 마스킹

**파일:** `components/Analysis/AnalysisPanel.tsx`

#### 2.1.1 Max Drawdown 마스킹

**Line 245-253: Max Drawdown Pro Lock**
```typescript
<div className="bg-gray-800 p-3 rounded-lg relative overflow-hidden group">
    <div className="text-xs text-gray-500">Max Drawdown</div>
    {isPro ? (
        <div className="text-lg font-bold text-red-400">-{result.backtest.maxDrawdownPercent.toFixed(1)}%</div>
    ) : (
        <div className="blur-sm select-none text-lg font-bold text-gray-600">??.?%</div>
    )}
    {!isPro && <div className="absolute inset-0 flex items-center justify-center bg-black/20 text-xs text-gray-400 font-bold">🔒 PRO</div>}
</div>
```

**마스킹 방식:**
- Free: `blur-sm` (블러 효과) + `??.?%` (플레이스홀더) + `🔒 PRO` 오버레이
- Pro: 실제 값 표시 (`-{result.backtest.maxDrawdownPercent.toFixed(1)}%`)

#### 2.1.2 Profit Factor 마스킹

**Line 254-264: Profit Factor Pro Lock**
```typescript
<div className="bg-gray-800 p-3 rounded-lg relative overflow-hidden group">
    <div className="text-xs text-gray-500">Profit Factor</div>
    {isPro ? (
        <div className="text-lg font-bold text-blue-400">
            {result.backtest.profitFactor >= 999 ? 'Inf' : result.backtest.profitFactor.toFixed(2)}
        </div>
    ) : (
        <div className="blur-sm select-none text-lg font-bold text-gray-600">?.??</div>
    )}
    {!isPro && <div className="absolute inset-0 flex items-center justify-center bg-black/20 text-xs text-gray-400 font-bold">🔒 PRO</div>}
</div>
```

**마스킹 방식:**
- Free: `blur-sm` (블러 효과) + `?.??` (플레이스홀더) + `🔒 PRO` 오버레이
- Pro: 실제 값 표시 (999 이상이면 'Inf', 아니면 소수점 2자리)

### 2.2 Free 사용자에게 노출되는 값

#### 2.2.1 Crypto Analysis Panel

**노출되는 값 (Free):**
1. **Win Rate** (Line 232-237)
   - Free/Pro 모두 노출
   - `result.backtest.winRate.toFixed(1)%` 또는 `N/A`

2. **Total Return** (Line 238-243)
   - Free/Pro 모두 노출
   - `result.backtest.totalReturn.toFixed(1)%` 또는 `N/A`

3. **Confidence Grade** (Line 177-179)
   - Free/Pro 모두 노출
   - `result.confidence.grade` (A, B, C, D, F)

4. **Rise Probability** (Line 184-186)
   - Free/Pro 모두 노출
   - `probability.probability%`

5. **Explanation Sections** (Line 192-222)
   - Free/Pro 모두 노출
   - Evidence, Risk, Watch 섹션 전체 텍스트

**마스킹되는 값 (Free):**
1. **Max Drawdown** (Line 245-253)
   - Free: `??.?%` (블러 + 플레이스홀더)
   - Pro: 실제 값

2. **Profit Factor** (Line 254-264)
   - Free: `?.??` (블러 + 플레이스홀더)
   - Pro: 실제 값

#### 2.2.2 Stock Analysis Panel

**노출되는 값 (Free):**
1. **Rise Probability** (Line 138-143)
   - Free/Pro 모두 노출
   - `probability?.probability || t.na%`

2. **Confidence Grade** (Line 146-155)
   - Free/Pro 모두 노출
   - `result.confidence?.grade || t.na`

3. **Regime** (Line 158-163)
   - Free/Pro 모두 노출
   - `probability?.regime || t.na`

4. **Data Points** (Line 166-169)
   - Free/Pro 모두 노출
   - `candles.length`

5. **Explanation Sections** (Line 180-206)
   - Free: `isLocked === false`일 때만 노출
   - Evidence, Risk, Watch 섹션 전체 텍스트

**마스킹되는 값 (Free):**
- Stock Panel은 전체 섹션 레벨에서 `isLocked` 상태로 제어
- `isLocked === true`일 때 PremiumLock 컴포넌트 표시

---

## 3. Locked UI 처리 코드

### 3.1 PremiumLock 컴포넌트

**파일:** `components/PremiumLock.tsx`

**Line 7-12: Props 정의**
```typescript
interface PremiumLockProps {
  feature: string;
  tier?: 'pro' | 'enterprise';
  className?: string;
  lang?: 'ko' | 'en';
}
```

**Line 20-68: Lock UI 렌더링**
```typescript
return (
    <div className={`vangogh-card p-8 relative ${className}`} style={{ borderColor: 'var(--vangogh-secondary)' }}>
        {/* Blur Overlay */}
        <div className="absolute inset-0 backdrop-blur-md bg-black/40 z-10 rounded-xl" />
        
        {/* Lock Icon & CTA */}
        <div className="relative z-20 flex flex-col items-center justify-center gap-4">
            {/* Lock Icon */}
            {/* Feature Text */}
            {/* Upgrade Button */}
        </div>
        
        {/* Content (blurred) */}
        <div className="pointer-events-none opacity-30">
            {/* This will be replaced by actual content */}
        </div>
    </div>
);
```

**주요 기능:**
- Blur 오버레이 (`backdrop-blur-md bg-black/40`)
- Lock 아이콘 (Van Gogh 스타일)
- Upgrade CTA 버튼 (`/pricing` 링크)
- 다국어 지원 (ko/en)

### 3.2 Crypto Analysis Panel Lock 처리

**파일:** `components/Analysis/AnalysisPanel.tsx`

**Line 144: isLocked 상태 확인**
```typescript
const isLocked = uiState === 'pro-locked';
```

**참고:** 현재 코드에서는 `isLocked`를 사용하지 않고, 개별 필드 레벨에서 `isPro`로 마스킹 처리

### 3.3 Stock Analysis Panel Lock 처리

**파일:** `components/Analysis/StockPanel.tsx`

**Line 123: isLocked 상태 확인**
```typescript
const isLocked = uiState === 'pro-locked';
```

**Line 173-177: PremiumLock 표시**
```typescript
{isLocked && (
    <div className="bg-gradient-to-r from-purple-900 to-purple-800 rounded-lg p-6 text-center border border-purple-600">
        <PremiumLock reason={t.proLock} />
    </div>
)}
```

**Line 180: Explanation 섹션 조건부 렌더링**
```typescript
{!isLocked && explanation && (
    <div className="space-y-4">
        {/* Evidence, Risk, Watch Sections */}
    </div>
)}
```

**Lock 처리 방식:**
- `isLocked === true`: PremiumLock 컴포넌트 표시, Explanation 섹션 숨김
- `isLocked === false`: Explanation 섹션 표시

---

## 4. Free 사용자에게 노출되는 값 범위

### 4.1 Crypto Analysis Panel

**완전 노출 (Free/Pro 동일):**
- ✅ Confidence Grade (A, B, C, D, F)
- ✅ Rise Probability (%)
- ✅ Win Rate (%)
- ✅ Total Return (%)
- ✅ Explanation Sections (Evidence, Risk, Watch) 전체 텍스트

**부분 마스킹 (Free):**
- ⚠️ Max Drawdown: `??.?%` (블러 + 플레이스홀더)
- ⚠️ Profit Factor: `?.??` (블러 + 플레이스홀더)

**추가 정보 (Pro만):**
- ✅ Max Drawdown 실제 값
- ✅ Profit Factor 실제 값
- ✅ Explanation에 백테스트 통계 추가 (과거 승률, 손익비)

### 4.2 Stock Analysis Panel

**완전 노출 (Free/Pro 동일, isLocked === false일 때):**
- ✅ Rise Probability (%)
- ✅ Confidence Grade (A, B, C, D, F)
- ✅ Regime
- ✅ Data Points
- ✅ Explanation Sections (Evidence, Risk, Watch) 전체 텍스트

**전체 마스킹 (Free, isLocked === true일 때):**
- ❌ Explanation Sections 숨김
- ❌ PremiumLock 컴포넌트 표시

---

## 5. 분석 로직과 분리 여부 확인

### 5.1 분석 계산 함수

**확인된 파일:**
- `lib/analysis/orchestrator.ts` (performAnalysis)
- `lib/analysis/stock.ts` (analyzeStock)
- `lib/analysis/crypto.ts` (analyzeCrypto)

**분석 로직:**
- ✅ `calculateProbability()` - userTier 무관
- ✅ `calculateConfidence()` - userTier 무관
- ✅ `calculateMetrics()` - userTier 무관
- ✅ `detectRegime()` - userTier 무관

**결론:** ✅ **분석 계산 로직은 userTier와 완전히 분리됨**

### 5.2 Explanation Generator

**파일:** `lib/explanation/generator.ts`

**userTier 영향:**
- ✅ 텍스트 생성 로직은 동일
- ⚠️ Pro 사용자에게만 백테스트 통계 추가 (Line 82-86)
  ```typescript
  if (backtest) {
      const pf = backtest.profitFactor >= 999 ? "N/A" : backtest.profitFactor.toFixed(2);
      const wr = backtest.winRate >= 999 ? "N/A" : `${backtest.winRate.toFixed(1)}%`;
      finalSections.evidence += ` (과거 승률 ${wr}, 손익비 ${pf})`;
  }
  ```

**결론:** ⚠️ **Explanation 텍스트는 Free/Pro에 따라 약간 다름 (Pro에 백테스트 통계 추가)**

### 5.3 UI 레벨 마스킹

**파일:**
- `components/Analysis/AnalysisPanel.tsx`
- `components/Analysis/StockPanel.tsx`

**마스킹 처리:**
- ✅ 분석 결과 데이터는 모두 계산됨
- ✅ UI에서 `isPro` 플래그로 마스킹 처리
- ✅ Free 사용자에게도 동일한 분석 결과가 전달됨 (마스킹만 다름)

**결론:** ✅ **UI 레벨에서만 마스킹 처리, 분석 로직과 분리됨**

---

## 6. 파일별 요약

### 6.1 userTier 기반 분기 코드 위치

| 파일 | 라인 | 역할 |
|------|------|------|
| `components/Analysis/AnalysisPanel.tsx` | 36-38 | userTier 설정 |
| `components/Analysis/AnalysisPanel.tsx` | 98 | 분석 함수에 userTier 전달 |
| `components/Analysis/StockPanel.tsx` | 21-23 | userTier 설정 |
| `components/Analysis/StockPanel.tsx` | 66 | 분석 함수에 userTier 전달 |
| `lib/explanation/generator.ts` | 10, 14, 75-87 | userTier 기반 설명 필터링 |
| `lib/analysis/orchestrator.ts` | 17, 95 | userTier 전달 |
| `lib/analysis/stock.ts` | 21, 84 | userTier 전달 |
| `lib/analysis/crypto.ts` | 21, 84 | userTier 전달 |

### 6.2 Pro 전용 필드 마스킹 처리

| 파일 | 라인 | 필드 | 마스킹 방식 |
|------|------|------|------------|
| `components/Analysis/AnalysisPanel.tsx` | 245-253 | Max Drawdown | blur-sm + `??.?%` + 🔒 PRO |
| `components/Analysis/AnalysisPanel.tsx` | 254-264 | Profit Factor | blur-sm + `?.??` + 🔒 PRO |
| `components/Analysis/StockPanel.tsx` | 173-177 | 전체 섹션 | PremiumLock 컴포넌트 |

### 6.3 Locked UI 처리 코드

| 파일 | 라인 | 역할 |
|------|------|------|
| `components/PremiumLock.tsx` | 전체 | Lock UI 컴포넌트 |
| `components/Analysis/StockPanel.tsx` | 123, 173-177 | isLocked 상태 확인 및 PremiumLock 표시 |
| `components/Analysis/StockPanel.tsx` | 180 | Explanation 섹션 조건부 렌더링 |

### 6.4 Free 사용자 노출 값 범위

**Crypto Analysis Panel:**
- ✅ 노출: Grade, Probability, Win Rate, Total Return, Explanation
- ⚠️ 마스킹: Max Drawdown, Profit Factor

**Stock Analysis Panel:**
- ✅ 노출 (isLocked === false): Grade, Probability, Regime, Data Points, Explanation
- ❌ 숨김 (isLocked === true): Explanation 섹션 전체

### 6.5 분석 로직 분리 여부

| 항목 | 분리 여부 | 설명 |
|------|----------|------|
| 분석 계산 | ✅ 완전 분리 | userTier 무관, 동일한 계산 |
| Explanation 텍스트 | ⚠️ 부분 분리 | Pro에 백테스트 통계 추가 |
| UI 마스킹 | ✅ 완전 분리 | UI 레벨에서만 처리 |

---

## 7. 결론

### 7.1 SSOT 원칙 준수

✅ **분석 결과는 동일:**
- 모든 분석 계산 함수는 userTier와 무관하게 동일한 결과 생성
- `calculateProbability()`, `calculateConfidence()`, `calculateMetrics()` 등은 userTier를 받지 않음

✅ **노출/권한/마스킹만 다르게 처리:**
- UI 레벨에서 `isPro` 플래그로 마스킹 처리
- Explanation 텍스트에 Pro 사용자에게만 백테스트 통계 추가 (선택적 정보)

### 7.2 게이트 로직 구조

**3단계 게이트 시스템:**

1. **분석 함수 레벨:**
   - userTier를 explanation generator에만 전달
   - 분석 계산 자체는 변경 없음

2. **Explanation Generator 레벨:**
   - Free: 기본 설명 텍스트
   - Pro: 백테스트 통계 추가

3. **UI 컴포넌트 레벨:**
   - Free: 일부 필드 마스킹 (blur + 플레이스홀더)
   - Pro: 전체 데이터 노출

### 7.3 주요 특징

✅ **분석 로직 보호:**
- 분석 계산 함수는 userTier를 받지 않음
- 분석 결과는 항상 동일하게 계산됨

✅ **UI 레벨 게이트:**
- 마스킹은 UI 컴포넌트에서만 처리
- Free 사용자에게도 동일한 분석 결과 전달 (마스킹만 다름)

⚠️ **Explanation 텍스트 차이:**
- Pro 사용자에게만 백테스트 통계 추가
- 이는 선택적 정보 추가이므로 분석 결과 자체는 동일

---

**보고서 작성 일시:** 2025-12-27  
**작성자:** Cursor AI Agent  
**검증 상태:** ✅ 완료  
**SSOT 원칙 준수:** ✅ 준수 (분석 결과 동일, 노출/마스킹만 다름)

