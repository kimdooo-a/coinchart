# PHASE6_PRODUCT_GATE_VSCODE_RESULT_20251227

**작성일**: 2025-12-27  
**제목**: Phase 6 UI State Machine — 설계 및 구현 가이드  
**상태**: ✅ 설계 완료, 구현 가이드 제공  

---

## 📋 작업 개요

### 목표
Crypto/Stock 분석 결과를 Free/Pro 사용자에게 일관되게 표시하는 UI State Machine 설계

### 최종 상태
✅ uiState 정의 명확화  
✅ 4-State Pattern 표준화  
✅ Pro-locked 카드 렌더링 규칙 정의  
✅ Free 사용자 데이터 정화 전략 수립  
✅ Empty-state 발생 불가 구조 검증  

---

## 1️⃣ uiState 상태 머신 정의

### 1.1 상태 전이도

```
┌──────────────────────────────────────────────────────────┐
│                      START                               │
└───────────────────┬──────────────────────────────────────┘
                    ↓
        ┌───────────────────────┐
        │  Data Fetching        │
        │  (useEffect)          │
        │  setIsLoading(true)   │
        └──────────┬────────────┘
                   ↓
        ┌──────────────────────────────────────────────┐
        │  Validation: Data Sufficiency Check          │
        │  if (candles.length < 50)                    │
        └──────────┬─────────────────────┬─────────────┘
                   │                     │
         YES (부족)│                     │ NO (충분)
                   ↓                     ↓
        ┌──────────────────────┐  ┌──────────────────────┐
        │ uiState: insufficient│  │ Catch Block?         │
        │ (충분하지 않음)      │  │ try-catch 오류       │
        └──────────┬───────────┘  └──────────┬───────────┘
                   │                         │
                   │                    YES │
                   │                    ↓
                   │            ┌─────────────────────┐
                   │            │ uiState: error      │
                   │            │ (분석 실패)         │
                   │            └─────────────────────┘
                   │
                   │    NO: 분석 실행
                   └─────────────────┐
                                     ↓
                          ┌──────────────────────────┐
                          │ Analysis Execution       │
                          │ performAnalysis()        │
                          │ or analyzeCrypto()       │
                          │ or analyzeStock()        │
                          └──────────┬───────────────┘
                                     ↓
                          ┌──────────────────────────┐
                          │ Pro Tier Gate Check      │
                          │ if (userTier === 'pro')? │
                          └──────────┬───────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                  YES (Pro)          │ NO (Free)      │
                    ↓                │                │
        ┌───────────────────┐        │    ↓           │
        │ uiState: 'ok'     │        │  Need Pro?     │
        │ (모든 기능 표시)   │        │  (특정 기능)   │
        └───────────────────┘        │                │
                    │                │  YES  ↓        │
                    │                │  ┌─────────────┐
                    │                │  │ pro-locked  │
                    │                │  │ (일부 제한)  │
                    │                │  └─────────────┘
                    │                │
                    │                │  NO ↓
                    │                │  ┌─────────────┐
                    │                └→ │ ok (전체)   │
                    │                   └─────────────┘
                    │                         │
                    └────────────┬────────────┘
                                 ↓
                        ┌────────────────────┐
                        │ UI Render          │
                        │ based on uiState   │
                        └────────────────────┘
```

### 1.2 상태별 의미

| 상태 | 발생 시점 | UI 표시 | 다음 상태 |
|------|---------|--------|---------|
| **loading** | 데이터 로딩 중 | Skeleton 또는 animate-pulse | insufficient / error / ok / pro-locked |
| **insufficient** | candles.length < 50 | ⚠️ 데이터 부족 메시지 | (재시도) |
| **error** | try-catch 오류 | ❌ 오류 메시지 | (재시도) |
| **ok** | 분석 완료, 모든 기능 사용 가능 | 전체 데이터 표시 | (정상 상태) |
| **pro-locked** | 분석 완료, Pro 기능만 제한 | Pro 기능만 blur + CTA | (업그레이드) |

### 1.3 조건부 로직

```typescript
// Phase 5: 분석 함수에서 처리
export function performAnalysis(input: CryptoAnalysisInput): CryptoAnalysisResult {
    // 1. Data Source Validation
    if (input.dataSource !== 'supabase') {
        return { ..., uiState: 'error' };
    }
    
    // 2. Data Sufficiency Check (선택적: 함수에서 하거나 컴포넌트에서 함)
    // 현재: 컴포넌트에서 if (candles.length < 50) return insufficient
    
    // 3. Analysis Execution
    try {
        const probability = calculateProbability(...);
        const confidence = calculateConfidence(...);
        const backtest = calculateMetrics(...);
        const explanation = generateExplanation(...);
        
        return {
            probability,
            confidence,
            backtest,
            explanation,
            uiState: 'ok',  // ← Pro-locked 체크는 컴포넌트에서
            dataSource: 'supabase'
        };
    } catch (err) {
        return { ..., uiState: 'error' };
    }
}
```

```typescript
// Phase 6: 컴포넌트에서 Pro-locked 처리
const result = useMemo(() => {
    if (!candles || candles.length === 0) return null;
    
    // 분석 함수는 항상 'ok' 또는 'error'/'insufficient' 반환
    const analysisResult = performAnalysis({...});
    
    // 컴포넌트에서 Pro-locked 로직 추가
    if (analysisResult.uiState === 'ok' && 
        userTier === 'free' && 
        requiresProFeature(analysisResult)) {
        // Pro 기능 필요 시 uiState 변경
        analysisResult.uiState = 'pro-locked';
    }
    
    return analysisResult;
}, [candles, userTier]);
```

---

## 2️⃣ 카드별 상태 렌더링 통일

### 2.1 4-State Pattern 표준

모든 카드(메트릭, 섹션)는 다음 4가지 상태만 처리:

#### A. State: Loading
```tsx
{isLoading && (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 animate-pulse">
        <div className="h-4 bg-gray-800 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
            <div className="h-20 bg-gray-800 rounded w-full"></div>
            <div className="h-20 bg-gray-800 rounded w-full"></div>
        </div>
    </div>
)}
```

#### B. State: Insufficient / Error
```tsx
{!result || result.uiState === 'insufficient' ? (
    <div className="bg-gray-900 rounded-xl p-10 border border-gray-800 text-center">
        <div className="text-gray-500 text-lg font-bold mb-2">
            ⚠️ {result?.uiState === 'error' ? 'Error' : 'Insufficient Data'}
        </div>
        <p className="text-sm text-gray-600">
            {result?.uiState === 'error' 
                ? 'Failed to analyze data' 
                : 'Minimum 50 candles required'}
        </p>
    </div>
) : (
    // OK or Pro-locked: 계속 렌더링
)}
```

#### C. State: OK (전체 데이터 표시)
```tsx
{result && (result.uiState === 'ok' || userTier === 'pro') && (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 space-y-4">
        <div className="text-2xl font-bold text-white">
            {result.probability.probability}%
        </div>
        <div className="text-lg font-bold text-blue-400">
            {result.backtest.winRate.toFixed(1)}%
        </div>
        {/* ... all data visible */}
    </div>
)}
```

#### D. State: Pro-locked (일부 데이터만 blur)
```tsx
{result && result.uiState === 'pro-locked' && userTier === 'free' && (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 space-y-4">
        {/* Free tier: 모든 기능 표시 */}
        <div className="text-2xl font-bold text-white">
            {result.probability.probability}%
        </div>
        
        {/* Pro-locked 메트릭: blur 처리 */}
        <div className="bg-gray-800 p-3 rounded-lg relative overflow-hidden">
            <div className="text-xs text-gray-500">Max Drawdown</div>
            <div className="blur-sm select-none text-lg font-bold text-gray-600">
                ??.?%
            </div>
            <div className="absolute inset-0 flex items-center justify-center 
                          bg-black/20 text-xs text-gray-400 font-bold cursor-pointer">
                🔒 PRO
            </div>
        </div>
    </div>
)}
```

### 2.2 카드 타입별 적용

#### Crypto (AnalysisPanel.tsx)

| 카드 | State | Free | Pro |
|------|-------|------|-----|
| Probability | OK | ✅ 표시 | ✅ 표시 |
| Confidence Grade | OK | ✅ 표시 | ✅ 표시 |
| Evidence | OK | ✅ 표시 | ✅ 표시 |
| Risk | OK | ✅ 표시 | ✅ 표시 |
| Watch | OK | ✅ 표시 | ✅ 표시 |
| Win Rate | OK | ✅ 표시 | ✅ 표시 |
| Total Return | OK | ✅ 표시 | ✅ 표시 |
| **Max Drawdown** | **Pro-locked** | ❌ blur | ✅ 표시 |
| **Profit Factor** | **Pro-locked** | ❌ blur | ✅ 표시 |

#### Stock (StockPanel.tsx)

| 카드 | State | Free | Pro |
|------|-------|------|-----|
| Probability | OK | ✅ 표시 | ✅ 표시 |
| Confidence Grade | OK | ✅ 표시 | ✅ 표시 |
| Analysis Basis | OK | ✅ 표시 | ✅ 표시 |
| **향후 Pro 기능** | **Pro-locked** | ❌ blur | ✅ 표시 |

---

## 3️⃣ Pro-locked 상태 상세 구현

### 3.1 Blur + Lock 아이콘

```tsx
// Pro-only 메트릭 렌더링 (재사용 가능)
const renderProLockedMetric = (
    label: string,
    value: any,
    userTier: 'free' | 'pro',
    onLockClick?: () => void
) => {
    const displayValue = userTier === 'pro' 
        ? (value >= 999 ? 'Inf' : value.toFixed(2))
        : '?.??';
    
    return (
        <div className="bg-gray-800 p-3 rounded-lg relative overflow-hidden group">
            <div className="text-xs text-gray-500">{label}</div>
            
            {/* Value: blurred for free tier */}
            <div className={`text-lg font-bold ${
                userTier === 'pro' 
                    ? 'text-blue-400' 
                    : 'blur-sm select-none text-gray-600'
            }`}>
                {displayValue}
            </div>
            
            {/* Lock overlay: clickable for free tier */}
            {userTier !== 'pro' && (
                <div 
                    className="absolute inset-0 flex items-center justify-center 
                              bg-black/20 text-xs text-gray-400 font-bold 
                              cursor-pointer hover:bg-black/40 transition"
                    onClick={onLockClick}
                >
                    🔒 PRO
                </div>
            )}
        </div>
    );
};
```

### 3.2 CTA (Call-To-Action) 연동

```tsx
// PremiumLock 모달 연동
const [showPremiumModal, setShowPremiumModal] = useState(false);

const handleProLockClick = () => {
    setShowPremiumModal(true);
};

return (
    <>
        {/* 메트릭 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {renderProLockedMetric(
                'Max Drawdown',
                result.backtest.maxDrawdownPercent,
                userTier,
                handleProLockClick  // ← CTA
            )}
            {renderProLockedMetric(
                'Profit Factor',
                result.backtest.profitFactor,
                userTier,
                handleProLockClick  // ← CTA
            )}
        </div>
        
        {/* PremiumLock 모달 */}
        {showPremiumModal && (
            <PremiumLock 
                onClose={() => setShowPremiumModal(false)}
                feature="Advanced Backtest Metrics"
            />
        )}
    </>
);
```

---

## 4️⃣ Free 사용자 데이터 정화

### 4.1 금지사항

| 패턴 | ❌ 금지 | ✅ 대체 |
|------|--------|--------|
| "N/A" 표시 | `{value ? value : 'N/A'}` | uiState로 처리: insufficient/error |
| 999 표시 | `{profitFactor >= 999 ? '999' : value}` | `{profitFactor >= 999 ? 'Inf' : value}` |
| 빈 문자열 | `{explanation || ''}` | null 체크 + fallback |
| 부분 표시 | Backtest 섹션 일부만 로드 | 전체 또는 전체 blur |

### 4.2 안전한 패턴

#### Before (위험)
```tsx
// ❌ 위험: undefined 값 표시
<div>{result.backtest?.winRate}%</div>

// ❌ 위험: "N/A" 표시
<div>{result.probability || 'N/A'}</div>

// ❌ 위험: 빈 카드
{result.confidence && <ResultCard />}
```

#### After (안전)
```tsx
// ✅ 안전: uiState 기반
{result?.uiState === 'ok' && (
    <div>{result.backtest.winRate}%</div>
)}

// ✅ 안전: 기본값 처리
{result?.uiState === 'ok' ? (
    <div>{result.probability}%</div>
) : (
    <InsufficientDataMessage />
)}

// ✅ 안전: 전체 섹션 조건부
{result?.uiState !== 'insufficient' && result?.uiState !== 'error' && (
    <ResultCard result={result} />
)}
```

---

## 5️⃣ Empty-state 발생 불가 구조

### 5.1 데이터 흐름 검증

```
┌─────────────────────────────────────────────────────────────┐
│ 분석 함수 출력: CryptoAnalysisResult / StockAnalysisResult  │
├─────────────────────────────────────────────────────────────┤
│ • probability: { probability: number, ... } | null          │
│ • confidence: { grade: Grade, ... } | null                  │
│ • backtest: { winRate: number, ... } | null                 │
│ • explanation: { sections: { ... } } | null                 │
│ • uiState: 'loading' | 'insufficient' | 'ok' |             │
│             'pro-locked' | 'error'                          │
│ • dataSource: 'supabase'                                     │
└─────────────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────────────┐
│ 컴포넌트 렌더링 로직                                         │
├─────────────────────────────────────────────────────────────┤
│ if (isLoading) → Loading State                              │
│ else if (result?.uiState === 'error') → Error State         │
│ else if (result?.uiState === 'insufficient') → Insufficient │
│ else if (result?.uiState === 'ok') → Full Display           │
│ else if (result?.uiState === 'pro-locked') → Pro-locked     │
│ else → Fallback (불가능, 모든 경로 커버됨)                 │
└─────────────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────────────┐
│ UI 출력: 항상 명확한 상태 표시, empty 없음                  │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 불가능한 상태 (모두 처리됨)

| 상황 | uiState | 처리 |
|------|---------|------|
| candles 빔 | insufficient / error | ✅ |
| 분석 오류 | error | ✅ |
| 데이터 부족 | insufficient | ✅ |
| 분석 완료, 모든 기능 | ok | ✅ |
| 분석 완료, Pro 제한 | pro-locked | ✅ |
| **어떤 상태도 아님** | **불가능** | ✅ 모든 경로 커버 |

### 5.3 체크리스트

- [ ] `isLoading` 여부 항상 체크
- [ ] `result` null 체크
- [ ] `result.uiState` 5가지 상태 모두 처리
- [ ] 어떤 카드도 `uiState === 'loading'` 상태에서 데이터 표시 안함
- [ ] 어떤 카드도 `uiState === 'insufficient'` 상태에서 값 표시 안함
- [ ] Pro-locked 메트릭만 blur, 나머지는 전체 표시
- [ ] 모든 fallback이 `return <something>` (항상 렌더링)

---

## 6️⃣ AnalysisPanel.tsx 구현 예시

### 6.1 현재 상태 → 개선된 구조

#### Before (개선 전)
```tsx
// 불완전: uiState 체크 부족, N/A 표시 등
if (isLoading) return <Skeleton />;
if (!result) return <InsufficientData />;

const { probability, explanation, uiState } = result;
const isLocked = uiState === 'pro-locked';

return (
    <div>
        {/* 항상 표시됨 (isLocked 상관없이) */}
        <div>{probability.probability}%</div>
        
        {/* Pro-locked일 수 있지만 값은 표시됨 */}
        <div>
            {isPro ? <div>{result.backtest.maxDrawdown}</div> : <blur>??</blur>}
        </div>
    </div>
);
```

#### After (개선 후)
```tsx
// 완전: uiState 기반 조건부 렌더링
// 1. Loading State
if (isLoading) {
    return (
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 animate-pulse">
            <div className="h-4 bg-gray-800 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
                <div className="h-20 bg-gray-800 rounded w-full"></div>
                <div className="h-20 bg-gray-800 rounded w-full"></div>
            </div>
        </div>
    );
}

// 2. Insufficient / Error State
if (!result || result.uiState === 'insufficient') {
    return (
        <div className="bg-gray-900 rounded-xl p-10 border border-gray-800 text-center">
            <div className="text-gray-500 text-lg font-bold mb-2">
                ⚠️ {lang === 'ko' ? '데이터 부족' : 'Insufficient Data'}
            </div>
            <p className="text-sm text-gray-600">
                {lang === 'ko' ? '최근 50개 캔들 필요' : 'Minimum 50 candles required'}
            </p>
        </div>
    );
}

if (result.uiState === 'error') {
    return (
        <div className="bg-gray-900 rounded-xl p-10 border border-red-800 text-center">
            <div className="text-red-500 text-lg font-bold mb-2">❌ Error</div>
            <p className="text-sm text-gray-600">Failed to analyze data</p>
        </div>
    );
}

// 3. OK / Pro-locked State
const { probability, explanation, uiState } = result;
const isProLocked = uiState === 'pro-locked' && userTier === 'free';
const [showPremium, setShowPremium] = useState(false);

return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 space-y-6">
        {/* 항상 표시: Probability, Grade, Evidence, Risk, Watch */}
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800 p-4 rounded-lg">
                <div className="text-xs text-gray-400">Confidence Grade</div>
                <div className="text-3xl font-black text-green-400">
                    {result.confidence.grade}
                </div>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
                <div className="text-xs text-gray-400">Rise Probability</div>
                <div className="text-3xl font-black text-white">
                    {probability.probability}%
                </div>
            </div>
        </div>

        {/* Evidence, Risk, Watch: 항상 표시 */}
        <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-950 p-4 rounded-lg">
                <h4 className="text-blue-400 font-bold text-sm mb-2">🔍 Evidence</h4>
                <p className="text-sm text-gray-300">{explanation.sections.evidence}</p>
            </div>
            <div className="bg-gray-950 p-4 rounded-lg">
                <h4 className="text-orange-400 font-bold text-sm mb-2">⚠️ Risk</h4>
                <p className="text-sm text-gray-300">{explanation.sections.risk}</p>
            </div>
            <div className="bg-gray-950 p-4 rounded-lg">
                <h4 className="text-purple-400 font-bold text-sm mb-2">👀 Watch</h4>
                <p className="text-sm text-gray-300">{explanation.sections.watch}</p>
            </div>
        </div>

        {/* Backtest: Pro-locked 처리 */}
        <div className="pt-4 border-t border-gray-800">
            <h4 className="text-lg font-bold text-gray-200 mb-4">System Backtest</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Free Tier: 항상 표시 */}
                <div className="bg-gray-800 p-3 rounded-lg">
                    <div className="text-xs text-gray-500">Win Rate</div>
                    <div className="text-lg font-bold text-white">
                        {result.backtest.winRate.toFixed(1)}%
                    </div>
                </div>
                <div className="bg-gray-800 p-3 rounded-lg">
                    <div className="text-xs text-gray-500">Total Return</div>
                    <div className="text-lg font-bold text-white">
                        {result.backtest.totalReturn.toFixed(1)}%
                    </div>
                </div>

                {/* Pro-locked: Blur 처리 */}
                <div className="bg-gray-800 p-3 rounded-lg relative overflow-hidden">
                    <div className="text-xs text-gray-500">Max Drawdown</div>
                    <div className={`text-lg font-bold ${
                        userTier === 'pro' ? 'text-red-400' : 'blur-sm select-none text-gray-600'
                    }`}>
                        {userTier === 'pro' 
                            ? `-${result.backtest.maxDrawdownPercent.toFixed(1)}%`
                            : '-??.?%'}
                    </div>
                    {userTier !== 'pro' && (
                        <div 
                            className="absolute inset-0 flex items-center justify-center bg-black/20 text-xs text-gray-400 font-bold cursor-pointer"
                            onClick={() => setShowPremium(true)}
                        >
                            🔒 PRO
                        </div>
                    )}
                </div>
                <div className="bg-gray-800 p-3 rounded-lg relative overflow-hidden">
                    <div className="text-xs text-gray-500">Profit Factor</div>
                    <div className={`text-lg font-bold ${
                        userTier === 'pro' ? 'text-blue-400' : 'blur-sm select-none text-gray-600'
                    }`}>
                        {userTier === 'pro' 
                            ? (result.backtest.profitFactor >= 999 ? 'Inf' : result.backtest.profitFactor.toFixed(2))
                            : '?.??'}
                    </div>
                    {userTier !== 'pro' && (
                        <div 
                            className="absolute inset-0 flex items-center justify-center bg-black/20 text-xs text-gray-400 font-bold cursor-pointer"
                            onClick={() => setShowPremium(true)}
                        >
                            🔒 PRO
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Premium Modal */}
        {showPremium && (
            <PremiumLock 
                onClose={() => setShowPremium(false)}
                feature="Advanced Backtest Metrics"
            />
        )}
    </div>
);
```

---

## 7️⃣ 테스트 시나리오

### 7.1 Crypto 분석 페이지 (/analysis/BTC)

#### 시나리오 1: Free 사용자, 데이터 충분
```
1. 페이지 로드 → isLoading = true
   UI: Skeleton 표시 ✅

2. Supabase 데이터 로드 → candles.length = 990
   UI: Skeleton 사라짐 ✅

3. 분석 실행 → result.uiState = 'ok'
   UI 표시:
   - Probability: 68% ✅
   - Confidence: A ✅
   - Evidence/Risk/Watch: 텍스트 ✅
   - Win Rate: 52.3% ✅
   - Total Return: 45.2% ✅
   - Max Drawdown: blur ❌ (Pro-locked)
   - Profit Factor: blur ❌ (Pro-locked)
   - 🔒 PRO 오버레이: ✅

4. Pro-locked 메트릭 클릭
   → PremiumLock 모달 열림 ✅
```

#### 시나리오 2: Pro 사용자, 데이터 충분
```
1. 페이지 로드 → isLoading = true
   UI: Skeleton 표시 ✅

2. Supabase 데이터 로드 → candles.length = 990
   UI: Skeleton 사라짐 ✅

3. 분석 실행 → result.uiState = 'ok'
   UI 표시:
   - Probability: 68% ✅
   - Confidence: A ✅
   - Evidence/Risk/Watch: 텍스트 ✅
   - Win Rate: 52.3% ✅
   - Total Return: 45.2% ✅
   - Max Drawdown: -23.5% ✅ (Pro-locked 해제)
   - Profit Factor: 2.15 ✅ (Pro-locked 해제)
```

#### 시나리오 3: Free 사용자, 데이터 부족
```
1. 페이지 로드 → isLoading = true
   UI: Skeleton 표시 ✅

2. Supabase 데이터 로드 → candles.length = 30
   → candles.length < 50 체크 통과 ❌

3. 컴포넌트에서 result = null 설정
   result.uiState = 'insufficient' ✅
   
   UI 표시:
   - "⚠️ Insufficient Data" ✅
   - "Minimum 50 candles required" ✅
   - 분석 결과 없음 ✅
```

#### 시나리오 4: 분석 오류
```
1. performAnalysis() 실행 중 오류 발생
   → catch block 실행
   → uiState = 'error' ✅

   UI 표시:
   - "❌ Error" ✅
   - "Failed to analyze data" ✅
```

### 7.2 Stock 분석 페이지 (/analysis/stock/AAPL)

#### 시나리오 1: Free 사용자, 데이터 충분
```
1. 페이지 로드 → isLoading = true
   UI: Skeleton 표시 ✅

2. Supabase stock_prices 로드 → candles.length = 365
   UI: Skeleton 사라짐 ✅

3. 분석 실행 → result.uiState = 'ok'
   UI 표시:
   - Probability: 72% ✅
   - Confidence: B ✅
   - Analysis Basis: "365 days of 1d data" ✅
   - 모든 기본 지표 표시 ✅
```

#### 시나리오 2: 데이터 미입력
```
1. 페이지 로드 → isLoading = true
   UI: Skeleton 표시 ✅

2. Supabase stock_prices 로드 → candles = null
   → candles.length < 50 체크 ❌

3. result.uiState = 'insufficient' ✅
   
   UI 표시:
   - "⚠️ Insufficient Data" 또는 "⚠️ No data available" ✅
   - "Stock data is not available for this symbol" ✅
```

---

## 📊 구현 체크리스트

### Phase 6 완료 조건

- [ ] **uiState 정의**
  - [x] 5가지 상태 명확히 정의: loading, insufficient, error, ok, pro-locked
  - [x] 상태 전이도 명시
  - [x] 조건부 로직 명확화

- [ ] **4-State Pattern**
  - [ ] AnalysisPanel.tsx에서 모든 5가지 상태 처리
  - [ ] StockPanel.tsx에서 모든 5가지 상태 처리
  - [ ] 각 상태별 UI 명확히 표시

- [ ] **Pro-locked 렌더링**
  - [ ] Max Drawdown blur (Crypto)
  - [ ] Profit Factor blur (Crypto)
  - [ ] 🔒 PRO 오버레이 추가
  - [ ] 클릭 시 PremiumLock 모달 열림

- [ ] **Free 사용자 데이터 정화**
  - [ ] "N/A" 표시 제거
  - [ ] 999 값 "Inf"로 변환
  - [ ] 빈 카드 없음

- [ ] **Empty-state 불가 구조**
  - [ ] 모든 경로에서 uiState 명시
  - [ ] 어떤 상황도 빈 UI 반환 안함
  - [ ] fallback 값 정의

---

## 🎯 다음 단계

### Phase 6 완료 후
1. AnalysisPanel.tsx 구현 (4-State Pattern 적용)
2. StockPanel.tsx 구현 (4-State Pattern 적용)
3. E2E 테스트 (Free/Pro 사용자 각각 4가지 시나리오)
4. 배포 전 검증 (빈 카드 없음, "N/A" 없음, Pro-locked 작동)

---

**작성 완료일**: 2025-12-27  
**검수 상태**: ✅ 설계 단계 완료  
**구현 상태**: ⏳ 가이드 제공, 구현 대기 중  
