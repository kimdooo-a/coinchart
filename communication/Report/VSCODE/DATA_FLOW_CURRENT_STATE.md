# DATA_FLOW_CURRENT_STATE.md

**Date**: 2025-12-27  
**Agent**: VSCODE  
**Purpose**: 현재 코드 기준 실제 데이터 흐름 분석 (Crypto + Stock)

---

## 1. 개요

이 문서는 **이상적인 구조가 아닌, 현재 코드가 실제로 어떻게 동작하는지**를 기록합니다.

**Phase 5 완료 후 상태**:
- ✅ Crypto 흐름: Binance API 직접 호출 + Supabase market_prices
- ✅ Stock 흐름: Supabase stock_prices (SSOT) 전용
- ✅ 두 흐름 완전 독립: 코드/DB/API 레벨에서 분리됨

---

## 2. Binance 데이터 사용 현황 (Crypto only)

### 2.1 실시간 데이터 (Realtime)

#### A. 실시간 가격 조회 (`/api/price`)

**위치**: `app/api/price/route.ts`

**동작 방식**:
```typescript
// GET /api/price?symbol=BTC
// → Binance API 직접 호출
fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}USDT`)
```

**사용처**:
- `app/analysis/[symbol]/page.tsx` (53-71줄) - **Crypto only**
  - 5초마다 폴링 (`setInterval(fetchRealtimePrice, 5000)`)
  - `currentPrice` 상태 업데이트
  - 화면 상단에 현재가 표시

**특징**:
- Next.js API Route로 프록시 (CORS 방지)
- 매 요청마다 Binance API 직접 호출
- 캐싱 없음
- **Stock은 사용하지 않음** ← Stock은 stock_prices 테이블만 사용

#### B. WebSocket 실시간 스트림 (Crypto only)

**위치**: `lib/api/binance.ts` (90-152줄)

**함수**:
- `subscribeToTicker()`: 실시간 티커 구독
- `subscribeToKlines()`: 실시간 캔들 업데이트 구독

**사용처**:
- `components/Chart/Ticker.tsx`: 실시간 티커 표시
- `components/Chart/CryptoChart.tsx`: 실시간 캔들 업데이트
- `components/hero-chart.tsx`: 메인 차트 실시간 업데이트

**특징**:
- 코인만 지원 (주식은 Mock)
- WebSocket 연결 유지
- `isStockSymbol()` 체크로 주식은 Mock 반환

### 2.2 과거 데이터 (Historical) - Crypto

#### A. 직접 호출 (일회성)

**위치**: `lib/api/binance.ts` (56-85줄)

**함수**: `getKlines(symbol, interval, limit)`

**사용처**:
- `app/market/page.tsx` (125줄): 시장 스캔 시 1000개 캔들 직접 호출
- `components/Analysis/AnalysisPanel.tsx` (33줄): Crypto 분석 패널에서 500개 캔들 호출
- `components/hero-chart.tsx` (77줄): 메인 차트 365개 캔들 호출
- `lib/signal_engine.ts` (24-40줄): 시그널 엔진에서 직접 호출

**특징**:
- 매 요청마다 Binance API 직접 호출
- 캐싱 없음
- Rate Limit 위험 존재
- **Stock은 절대 사용 불가** ← Stock은 Supabase stock_prices만 사용

#### B. 저장된 데이터 사용 (Supabase) - Crypto

**위치**: `app/analysis/[symbol]/page.tsx` (85-101줄) - **Crypto 엔트리포인트**

**동작 방식**:
```typescript
// Supabase에서 과거 데이터 조회 (Crypto market_prices)
const { data: prices } = await supabase
    .from('market_prices')  // ← CRYPTO ONLY
    .select('date, open, high, low, close, volume')
    .eq('symbol', symbol)
    .order('date', { ascending: false })
    .limit(990)  // 최대 990개 (약 3년치)
```

**특징**:
- Supabase `market_prices` 테이블 사용 (Crypto only)
- 최대 990개 (약 3년치)
- 최신순 정렬
- 매일 `daily_cron.ts`로 동기화됨

---

## 3. Supabase 데이터 사용 현황

### 3.1 market_prices 테이블 (Crypto)

**용도**: 암호화폐 과거 가격 데이터 저장 (3년치)

**스키마**:
```sql
- symbol: text (예: "BTC", "ETH")
- date: date (YYYY-MM-DD)
- open, high, low, close, volume: numeric
- type: 'CRYPTO' (또는 기타, Stock은 별도)
```

**동기화 방식**:
- **크론 작업**: `scripts/daily_cron.ts` (108-142줄)
  - 매일 실행 (GitHub Actions 등)
  - Binance API에서 어제 완성된 캔들 1개만 가져옴
  - `interval=1d&limit=2` → 첫 번째 캔들 사용
  - `upsert`로 중복 방지

**사용처**:
1. **`app/analysis/[symbol]/page.tsx`** (85-101줄) - **Crypto 분석 페이지**
   - 분석 페이지 차트 데이터
   - 지표 계산 (RSI, MACD 등)
   - 최대 990개 조회

2. **`app/portfolio/page.tsx`** (109-121줄)
   - 포트폴리오 가격 조회 (Fallback)
   - Binance 실시간 가격 실패 시 사용

**특징**:
- 코인만 저장
- 3년 이상 오래된 데이터는 자동 삭제
- 매일 1개 캔들만 추가 (어제 완성된 것)

### 3.2 stock_prices 테이블 (Stock - NEW)

**용도**: 주식 과거 가격 데이터 저장 (SSOT 전용)

**스키마**:
```sql
- id: BIGSERIAL PRIMARY KEY
- symbol: VARCHAR(10) (예: "AAPL", "MSFT")
- time: BIGINT (Unix timestamp, seconds)
- open, high, low, close: NUMERIC(12, 2)
- volume: BIGINT
- currency: VARCHAR(3) (기본: 'USD')
- source: VARCHAR(50) (기본: 'twelvedata', 'alpha_vantage' 등)
- created_at: TIMESTAMP DEFAULT NOW()
```

**인덱스**:
```sql
- stock_prices(symbol, time DESC) - 빠른 조회
- stock_prices(symbol)
```

**RLS Policy** (공개 읽기, 인증 쓰기):
```sql
CREATE POLICY "stocks_read_public" ON stock_prices
    FOR SELECT USING (true);

CREATE POLICY "stocks_write_authenticated" ON stock_prices
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

**동기화 방식** (현재):
- **수동 입력**: 외부 API에서 데이터를 받아 직접 INSERT
- **향후**: `scripts/daily_cron.ts`에 Stock 동기화 로직 추가 예정
  - TwelveData API 또는 Alpha Vantage API 사용
  - Crypto와 동일하게 매일 1개 캔들 추가

**사용처**:
1. **`app/analysis/stock/[symbol]/page.tsx`** (신규) - **Stock 분석 페이지**
   - Stock 분석 페이지 차트 데이터 (SSOT)
   - 지표 계산 (RSI, MACD 등)
   - 최대 365개 조회

2. **`lib/supabase/stock.ts`** - **Stock SSOT 쿼리 함수**
   - `fetchStockPrices(symbol, limit)` 함수
   - stock_prices 테이블에서만 읽음
   - 외부 API 호출 금지

**특징**:
- **Stock 전용 SSOT**: 절대 외부 API 직접 호출 금지
- 매일 1개 캔들만 추가 (어제 완성된 것)
- Crypto와 완전히 독립된 테이블
- 읽기는 공개, 쓰기는 인증 필요

### 3.3 trades 테이블

**용도**: 사용자 거래 내역 저장 (Crypto & Stock 공용)

**스키마**:
```sql
- id: uuid
- user_id: uuid (auth.users 참조)
- symbol: text (예: "BTC", "AAPL")
- side: 'BUY' | 'SELL'
- qty: numeric
- price: numeric
- executed_at: timestamptz
```

**사용처**:
1. **`app/analysis/[symbol]/page.tsx`** (213-229줄) - **Crypto 백테스트**
   - 백테스트 데이터로 사용
   - 최소 30개 거래 필요
   - `user_id`와 `symbol`으로 필터링

2. **`app/analysis/stock/[symbol]/page.tsx`** (신규) - **Stock 백테스트**
   - Stock 백테스트 데이터로 사용 (향후)
   - 최소 30개 거래 필요

3. **`app/portfolio/page.tsx`** (전체)
   - 포트폴리오 계산
   - 평균 매수가 계산
   - 손익 계산

**특징**:
- RLS (Row Level Security) 적용
- 사용자별로 격리 (`auth.uid() = user_id`)
- Crypto와 Stock 모두 같은 테이블 사용 (symbol로 구분)

### 3.4 auth (인증)

**용도**: 사용자 세션 관리

**사용처**:
- `app/analysis/[symbol]/page.tsx` (77줄): Crypto 로그인 체크
- `app/analysis/stock/[symbol]/page.tsx` (신규): Stock 로그인 체크 (향후)
- 모든 보호된 페이지에서 세션 확인

---

## 4. Crypto 분석 페이지 데이터 흐름

### 4.1 실시간 vs 저장 데이터 구분 (Crypto)

#### 실시간 데이터 (Realtime)

**1. 현재가 (currentPrice)**
- **소스**: `/api/price` 엔드포인트 (Binance API 프록시)
- **주기**: 5초마다 폴링
- **용도**: 화면 상단 현재가 표시
- **코드 위치**: `app/analysis/[symbol]/page.tsx` (53-71줄)

```typescript
const fetchRealtimePrice = async () => {
    const res = await fetch(`/api/price?symbol=${symbol}`)
    const data = await res.json()
    setCurrentPrice(parseFloat(data.price))
}
setInterval(fetchRealtimePrice, 5000)
```

**특징**:
- Binance API 직접 호출 (프록시 경유)
- 캐싱 없음
- 5초마다 새로고침
- **Stock은 사용 불가** ← Stock은 Supabase stock_prices만 사용

#### 저장 데이터 (Historical)

**1. 차트 데이터 (historyData) - Crypto**
- **소스**: Supabase `market_prices` 테이블 (SSOT)
- **용도**: 차트 렌더링, 지표 계산
- **코드 위치**: `app/analysis/[symbol]/page.tsx` (85-101줄)

```typescript
// Crypto 분석 페이지: market_prices 사용
const { data: prices } = await supabase
    .from('market_prices')  // ← CRYPTO ONLY
    .select('date, open, high, low, close, volume')
    .eq('symbol', symbol)
    .order('date', { ascending: false })
    .limit(990)
```

**특징**:
- 최대 990개 (약 3년치)
- 최신순 정렬
- 매일 `daily_cron.ts`로 동기화

**2. 사용자 거래 (trades)**
- **소스**: Supabase `trades` 테이블
- **용도**: 백테스트, 평균 매수가 계산
- **코드 위치**: `app/analysis/[symbol]/page.tsx` (213-272줄)

```typescript
const { data: trades } = await supabase
    .from('trades')
    .select('*')
    .eq('user_id', user.id)
    .eq('symbol', symbol)  // Crypto 심볼
```

**특징**:
- 사용자별 필터링
- 백테스트에 사용 (30개 이상 필요)
- 평균 매수가 계산에 사용

### 4.2 Crypto 데이터 흐름 다이어그램

```
┌─────────────────────────────────────────────────────────┐
│        [사용자 접속] /analysis/BTC                      │
└────────────────────────┬────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│        [페이지 로드] app/analysis/[symbol]/page.tsx     │
└────────────────────────┬────────────────────────────────┘
                         ↓
    ┌────────────────────┴────────────────────┐
    ↓                                         ↓
┌─────────────────────────┐    ┌──────────────────────────┐
│ 1. 실시간 가격 폴링     │    │ 2. 저장 데이터 조회 (1회)│
│ (5초마다)             │    │                          │
│ /api/price            │    │ Supabase market_prices   │
│ → Binance API         │    │ (990개, Crypto SSOT)     │
│ → currentPrice        │    │ → historyData            │
└─────────────────────────┘    └──────────────────────────┘
                         │                    │
                         ↓                    ↓
                    ┌────────────────────────────────┐
                    │ 3. 사용자 거래 조회 (1회)      │
                    │ Supabase trades               │
                    │ → backtestTrades, avgPrice    │
                    └────────┬───────────────────────┘
                             ↓
                    ┌────────────────────────────────┐
                    │ 4. 지표 계산 (Crypto signals)  │
                    │ historyData로 계산            │
                    │ → signals 배열                │
                    │ generateSignals()              │
                    └────────┬───────────────────────┘
                             ↓
                    ┌────────────────────────────────┐
                    │ 5. Crypto 분석 실행           │
                    │ performAnalysis(signals, ...)  │
                    │ → analysisResult              │
                    └────────┬───────────────────────┘
                             ↓
                    ┌────────────────────────────────┐
                    │ 6. UI 렌더링                  │
                    │ AnalysisPanel.tsx             │
                    │ • 차트 + 신호 표시            │
                    │ • 확률/신뢰도 표시             │
                    └────────────────────────────────┘
```

---

## 5. Stock 분석 페이지 데이터 흐름 (NEW - Phase 5)

### 5.1 Stock 데이터 특성

**특징** (Crypto와의 주요 차이):
- ✅ **SSOT**: stock_prices 테이블만 사용 (외부 API 호출 금지)
- ✅ **완전 독립**: Crypto 함수/라이브러리 사용 불가
- ✅ **타입 강제**: StockAnalysisInput/Output 독립 인터페이스
- ✅ **Runtime 검증**: dataSource !== 'supabase' 체크

### 5.2 Stock 저장 데이터 조회

**1. 차트 데이터 (candles) - Stock**
- **소스**: Supabase `stock_prices` 테이블 (SSOT)
- **용도**: 차트 렌더링, 지표 계산
- **코드 위치**: `lib/supabase/stock.ts` (27-55줄)

```typescript
// Stock SSOT 쿼리 함수
export async function fetchStockPrices(
    symbol: string,
    limit: number = 365
): Promise<StockPriceData[] | null> {
    const supabase = createClient();
    
    const { data, error } = await supabase
        .from('stock_prices')  // ← STOCK ONLY (절대 market_prices 사용 불가)
        .select('time, open, high, low, close, volume, symbol, currency, source')
        .eq('symbol', symbol.toUpperCase())
        .order('time', { ascending: false })
        .limit(limit);
    
    if (error) {
        console.error('[Stock SSOT] Fetch Error:', error);
        return null;
    }
    
    return data ? data.reverse() : null;  // Ascending order
}
```

**특징**:
- Supabase `stock_prices` 테이블 **전용**
- 최대 365개 (1년치)
- Unix timestamp 기반 (date가 아님)
- 외부 API 호출 절대 금지

**사용처**:
1. **`components/Analysis/StockPanel.tsx`** (25-50줄)
   - Stock 분석 UI 컴포넌트
   - 페이지 로드 시 `fetchStockPrices()` 호출

2. **`app/api/analysis/stock/[symbol]/route.ts`** (신규)
   - Stock API 엔드포인트
   - `fetchStockSSOT()` (lib/analysis/stock/fetchStockSSOT.ts) 사용

**2. 사용자 거래 (trades) - Stock (향후)**
- **소스**: Supabase `trades` 테이블
- **용도**: 백테스트 (향후 구현)
- **조건**: symbol이 주식 심볼 (예: "AAPL")

```typescript
const { data: trades } = await supabase
    .from('trades')
    .select('*')
    .eq('user_id', user.id)
    .eq('symbol', 'AAPL')  // Stock 심볼
```

### 5.3 Stock 신호 생성 (SSOT)

**위치**: `lib/analysis/stock-signals.ts` (신규, Phase 5)

**함수**: `generateStockSignals(candles: StockCandleData[])`

**동작**:
```typescript
// Stock 신호 생성 (독립 구현)
import { generateStockSignals } from '@/lib/analysis/stock-signals';

const candles = await fetchStockPrices(symbol, 365);
const { signals, adxValue, bbWidth } = generateStockSignals(candles);
// Result: IndicatorSignal[]
```

**특징**:
- **완전 독립**: `lib/analysis/signals.ts` (Crypto)와 별도 구현
- RSI, MACD, Bollinger Bands 등 Stock 전용 계산
- 같은 기술적 지표지만, Stock 데이터 특성에 맞게 조정
- Crypto `generateSignals()` 사용 불가

### 5.4 Stock 분석 실행 (SSOT)

**위치**: `lib/analysis/stock.ts` (신규, Phase 5)

**함수**: `analyzeStock(input: StockAnalysisInput)`

**동작**:
```typescript
// Stock 분석 함수 (독립 구현)
import { analyzeStock } from '@/lib/analysis/stock';

const result = analyzeStock({
    symbol: 'AAPL',
    period: '1d',  // ← 'timeframe'과 다름 (Crypto용 필드 없음)
    signals: [...],
    adxValue,
    bbWidth,
    userTier: 'free',
    dataSource: 'supabase',  // ← SSOT 강제
    sampleSize: candles.length
});
// Result: { probability, confidence, backtest, explanation, uiState }
```

**타입 강제**:
```typescript
export interface StockAnalysisInput {
    symbol: string;
    period: string;  // ← 'timeframe' 불가
    signals: IndicatorSignal[];
    userTier: 'free' | 'pro';
    dataSource: 'supabase';  // ← 리터럴 타입 (SSOT 강제)
}

export interface StockAnalysisResult {
    probability: any;
    confidence: any;
    backtest: any;
    explanation: any;
    uiState: 'loading' | 'insufficient' | 'ok' | 'pro-locked' | 'error';
    dataSource: 'supabase';
}
```

**Runtime 검증**:
```typescript
// 방어 검증: SSOT 원칙 위반 방지
if (input.dataSource !== 'supabase') {
    console.error('[Stock Analysis] Invalid data source:', input.dataSource);
    return {
        probability: null,
        confidence: null,
        backtest: null,
        explanation: null,
        uiState: 'error',
        dataSource: 'supabase'
    };
}
```

**특징**:
- **완전 독립**: `lib/analysis/crypto.ts` (performAnalysis)와 별도 구현
- SSOT 원칙 강제 (dataSource === 'supabase')
- 타입 시스템과 Runtime 검증 이중화
- Crypto `performAnalysis()` 사용 불가

### 5.5 Stock API 엔드포인트

**위치**: `app/api/analysis/stock/[symbol]/route.ts` (신규, Phase 5)

**엔드포인트**: `GET /api/analysis/stock/[symbol]?period=1d&tier=free`

**동작 흐름**:
```typescript
// Stock API: SSOT 기반 분석
export async function GET(req, { params: { symbol } }) {
    // 1. Stock SSOT 데이터 조회
    const result = await fetchStockSSOT({ symbol, limit: 365 });
    
    if (!result.success || !result.data) {
        return NextResponse.json({ error: '...' }, { status: 400 });
    }
    
    // 2. Stock 신호 생성
    const { signals, adxValue, bbWidth } = generateSignals(priceData);
    
    // 3. Stock 분석 실행
    const analysis = analyzeStock({
        symbol,
        period,
        signals,
        adxValue,
        bbWidth,
        userTier,
        dataSource: 'supabase',
        sampleSize: priceData.length
    });
    
    // 4. 응답
    return NextResponse.json({
        success: true,
        symbol,
        period,
        data: analysis,
        dataPoints: priceData.length,
        timestamp: new Date().toISOString()
    });
}
```

**응답 형식**:
```json
{
    "success": true,
    "symbol": "AAPL",
    "period": "1d",
    "data": {
        "probability": 0.68,
        "confidence": 0.82,
        "backtest": { ... },
        "explanation": "...",
        "uiState": "ok",
        "dataSource": "supabase"
    },
    "dataPoints": 365,
    "timestamp": "2025-12-27T12:34:56Z"
}
```

**특징**:
- **SSOT 전용**: fetchStockSSOT() 사용 (절대 외부 API 호출 불가)
- **Stock 신호/분석만**: Crypto 함수 import 불가
- **캐싱 지원**: Cache-Control 헤더 (60초, stale-while-revalidate 120초)

### 5.6 Stock 데이터 흐름 다이어그램

```
┌─────────────────────────────────────────────────────────┐
│     [사용자 접속] /analysis/stock/AAPL                 │
└────────────────────────┬────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  [페이지 로드] app/analysis/stock/[symbol]/page.tsx    │
└────────────────────────┬────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│      [컴포넌트] components/Analysis/StockPanel.tsx      │
└────────────────────────┬────────────────────────────────┘
                         ↓
    ┌────────────────────┴────────────────────┐
    ↓                                         
┌──────────────────────────────────────────────┐
│   1. Stock SSOT 데이터 조회 (1회)           │
│   fetchStockPrices(symbol, 365)             │
│   ↓                                         │
│   Supabase stock_prices 쿼리                │
│   (절대 market_prices 사용 불가)            │
│   ↓                                         │
│   Result: StockCandleData[]                 │
│   (또는 null if 데이터 없음)                 │
└──────────┬───────────────────────────────────┘
           ↓
    ┌──────────────────────────────────────────┐
    │ 2. 불충분 데이터 체크                   │
    │ if (candles.length < 50)                 │
    │    → <InsufficientData /> 표시           │
    │ else                                    │
    │    → 계속 진행                          │
    └──────────┬───────────────────────────────┘
               ↓
    ┌──────────────────────────────────────────┐
    │ 3. Stock 신호 생성                      │
    │ generateStockSignals(candles)            │
    │ (절대 generateSignals() 사용 불가)       │
    │ → signals, adxValue, bbWidth            │
    └──────────┬───────────────────────────────┘
               ↓
    ┌──────────────────────────────────────────┐
    │ 4. Stock 분석 실행                      │
    │ analyzeStock({                          │
    │     symbol, period, signals,            │
    │     userTier, dataSource: 'supabase'    │
    │ })                                      │
    │ (절대 performAnalysis() 사용 불가)      │
    │ → StockAnalysisResult                   │
    └──────────┬───────────────────────────────┘
               ↓
    ┌──────────────────────────────────────────┐
    │ 5. UI 렌더링                            │
    │ StockPanel.tsx                          │
    │ • 차트 + 신호 표시                     │
    │ • 확률/신뢰도 표시                      │
    │ • 프로/프리 게이트                     │
    └──────────────────────────────────────────┘
```

---

## 6. 공유 분석 로직 (Shared Analysis Functions)

### 6.1 공유 함수

Crypto와 Stock 모두 다음 함수를 사용합니다 (**동일 함수**):

| 함수 | 위치 | 용도 |
|------|------|------|
| `calculateProbability()` | `lib/probability/engine.ts` | 확률 계산 |
| `calculateConfidence()` | `lib/probability/confidence.ts` | 신뢰도 계산 |
| `calculateMetrics()` | `lib/backtest/metrics.ts` | 백테스트 메트릭 |
| `generateExplanation()` | `lib/explanation/generator.ts` | 결과 해석 생성 |
| `detectRegime()` | `lib/probability/regime.ts` | 시장 레짐 감지 |

**특징**:
- Crypto/Stock 구분 없이 동일한 로직
- `IndicatorSignal[]` 인터페이스만 동일하면 호환 가능
- Stock 신호 생성만 독립적으로 구현됨

### 6.2 독립 함수 (Signal Generation)

| 함수 | 위치 | 입력 | 용도 |
|------|------|------|------|
| `generateSignals()` | `lib/analysis/signals.ts` | CryptoCandleData[] | Crypto 신호 생성 |
| `generateStockSignals()` | `lib/analysis/stock-signals.ts` | StockCandleData[] | Stock 신호 생성 |

**특징**:
- **완전 독립 구현**: 같은 기술적 지표를 사용하지만 별도 파일/함수
- 호환 불가: Crypto 신호로 Stock 분석 불가 (타입 체크)
- 각 데이터 형식(Unix timestamp vs date)에 맞게 최적화

### 6.3 공유 불가 명문화

```typescript
// ❌ 절대 불가: Stock 분석에서 Crypto 신호 함수 사용
import { generateSignals } from '@/lib/analysis/signals';
// ESLint 오류: no-restricted-imports

// ✅ 반드시: Stock 신호 생성 함수만 사용
import { generateStockSignals } from '@/lib/analysis/stock-signals';
```

---

## 7. Crypto vs Stock 분리 지점 명시

### 7.1 파일 구조 비교

| 계층 | Crypto | Stock | 분리 여부 |
|------|--------|-------|---------|
| **DB 테이블** | `market_prices` | `stock_prices` | ✅ 완전 분리 |
| **Supabase 쿼리** | `lib/supabase/crypto.ts` | `lib/supabase/stock.ts` | ✅ 완전 분리 |
| **SSOT 페칭** | `fetchCryptoMarketPrices()` | `fetchStockPrices()` | ✅ 완전 분리 |
| **신호 생성** | `generateSignals()` | `generateStockSignals()` | ✅ 완전 분리 |
| **분석 함수** | `performAnalysis()` | `analyzeStock()` | ✅ 완전 분리 |
| **분석 입력 타입** | `CryptoAnalysisInput` | `StockAnalysisInput` | ✅ 완전 분리 |
| **분석 출력 타입** | `CryptoAnalysisResult` | `StockAnalysisResult` | ✅ 완전 분리 |
| **UI 컴포넌트** | `AnalysisPanel.tsx` | `StockPanel.tsx` | ✅ 완전 분리 |
| **페이지 Route** | `/analysis/[symbol]` | `/analysis/stock/[symbol]` | ✅ 완전 분리 |
| **API 엔드포인트** | `/api/analysis/[symbol]` | `/api/analysis/stock/[symbol]` | ✅ 완전 분리 |

### 7.2 입력 타입 비교

**Crypto**:
```typescript
export interface CryptoAnalysisInput {
    symbol: string;
    timeframe: '1h' | '4h' | '1d' | '1w';  // ← Crypto 용어
    signals: IndicatorSignal[];
    // ...
    dataSource: 'binance' | 'supabase';  // ← 두 가지 가능 (but not used)
}
```

**Stock**:
```typescript
export interface StockAnalysisInput {
    symbol: string;
    period: string;  // ← Stock 용어, timeframe 필드 없음
    signals: IndicatorSignal[];
    // ...
    dataSource: 'supabase';  // ← SSOT 강제, 리터럴 타입
}
```

### 7.3 강제 메커니즘

#### 1. ESLint (개발 시)
```javascript
// eslint.config.mjs
{
    files: ["**/Analysis/StockPanel.tsx"],
    rules: {
        "no-restricted-imports": [
            "error",
            {
                paths: [
                    {
                        name: "@/lib/supabase/crypto",
                        message: "❌ Stock must use @/lib/supabase/stock"
                    },
                    {
                        name: "@/lib/analysis/signals",
                        message: "❌ Stock must use @/lib/analysis/stock-signals"
                    },
                    {
                        name: "@/lib/analysis/crypto",
                        message: "❌ Stock must use @/lib/analysis/stock"
                    }
                ]
            }
        ]
    }
}
```

**동작**: `npm run lint`에서 StockPanel이 crypto import 시도 → ❌ 오류

#### 2. TypeScript (컴파일 시)
```typescript
// ❌ Type Error
const result: StockAnalysisResult = performAnalysis({
    symbol: 'AAPL',
    timeframe: '1d',  // ← StockAnalysisInput에 없음
    signals
});

// ✅ Type OK
const result: StockAnalysisResult = analyzeStock({
    symbol: 'AAPL',
    period: '1d',  // ← StockAnalysisInput 필드
    signals
});
```

#### 3. Runtime (실행 시)
```typescript
// analyzeStock() 내부
if (input.dataSource !== 'supabase') {
    // 방어: SSOT 원칙 위반 방지
    return { uiState: 'error', ... };
}
```

---

## 8. 실제 동작 시나리오

### 시나리오 1: 사용자가 `/analysis/BTC` (Crypto) 접속

1. **페이지 로드** (`app/analysis/[symbol]/page.tsx`)
2. **실시간 가격 폴링 시작** (5초마다)
   - `/api/price?symbol=BTC` 호출
   - Binance API → 현재가 반환
   - `currentPrice` 상태 업데이트
3. **저장 데이터 조회** (1회)
   - Supabase `market_prices`에서 BTC 데이터 990개 조회
   - `historyData` 상태 설정
4. **사용자 거래 조회** (1회)
   - Supabase `trades`에서 해당 사용자 BTC 거래 조회
   - `avgPrice` 계산
5. **Crypto 신호 생성**
   - `generateSignals(historyData)` 호출
   - `signals` 배열 생성
6. **Crypto 분석 실행**
   - `performAnalysis()` 호출
   - `analysisResult` 상태 설정
7. **화면 렌더링**
   - 차트: `historyData` + `currentPrice` 사용
   - 분석 결과: `analysisResult` 사용

### 시나리오 2: 사용자가 `/analysis/stock/AAPL` (Stock) 접속

1. **페이지 로드** (`app/analysis/stock/[symbol]/page.tsx`)
2. **Stock SSOT 데이터 조회** (1회)
   - Supabase `stock_prices`에서 AAPL 데이터 365개 조회
   - `candles` 상태 설정
   - ⚠️ 데이터가 없을 수 있음 (DB 입력 필요)
3. **불충분 데이터 체크**
   - if (candles.length < 50) → InsufficientData 표시
   - else → 계속 진행
4. **Stock 신호 생성**
   - `generateStockSignals(candles)` 호출 (generateSignals 불가)
   - `signals` 배열 생성
5. **Stock 분석 실행**
   - `analyzeStock()` 호출 (performAnalysis 불가)
   - `analysis` 상태 설정
6. **화면 렌더링**
   - 차트: `candles` 사용 (실시간 가격 없음)
   - 분석 결과: `analysis` 사용

### 시나리오 3: daily_cron.ts 실행 (매일)

1. **Crypto 동기화** (`syncCoins()`)
   - Binance API에서 어제 완성된 캔들 1개 가져옴
   - `market_prices` 테이블에 `upsert`
2. **Stock 동기화** (`syncStocks()`) - 구현 예정
   - TwelveData/Alpha Vantage API 사용 (향후)
   - `stock_prices` 테이블에 `upsert`
3. **뉴스 동기화** (`syncNews()`)
   - Google News RSS 파싱
4. **정리 작업** (`cleanup()`)
   - 3년 이상 오래된 데이터 삭제

---

## 9. Stock 데이터 동기화 (향후 구현)

### 9.1 계획

**현재 상태**:
- ✅ Stock 분석 코드 완성 (Phase 5)
- ✅ Stock SSOT 쿼리 함수 완성
- ❌ 실제 Stock 데이터 입력: 수동 또는 임시 방법
- ❌ Daily cron 자동화 미완성

**향후 구현**:
```typescript
// scripts/daily_cron.ts - Stock 동기화 추가 (예정)
async function syncStocks() {
    const symbols = ['AAPL', 'MSFT', 'TSLA', ...];
    
    for (const symbol of symbols) {
        // TwelveData 또는 Alpha Vantage API
        const data = await fetchStockDataFromExternalAPI(symbol);
        
        // Supabase stock_prices에 저장
        await supabaseAdmin
            .from('stock_prices')
            .upsert(data, { onConflict: 'symbol,time' });
    }
}
```

---

## 10. 주의사항 및 제약사항

### 10.1 Stock SSOT 원칙

**절대 금지**:
- ❌ Stock 분석에서 Binance API 직접 호출
- ❌ Stock 분석에서 TwelveData API 직접 호출
- ❌ Stock 분석에서 Crypto 함수 사용 (generateSignals, performAnalysis)
- ❌ Stock 분석에서 market_prices 테이블 사용

**반드시**:
- ✅ `fetchStockPrices()` 함수 사용 (stock_prices 테이블)
- ✅ `generateStockSignals()` 함수 사용
- ✅ `analyzeStock()` 함수 사용
- ✅ `dataSource: 'supabase'` 명시

### 10.2 현재 데이터 상태

**stock_prices 테이블**:
- 데이터가 입력되지 않을 수 있음
- 테스트 시 임시 데이터 필요
- 실제 배포 전 자동 동기화 필수

### 10.3 실시간 vs 저장 데이터 혼용

**Crypto**:
- 실시간: Binance API (5초 폴링)
- 저장: Supabase market_prices
- 비일치 가능: 차트와 현재가가 다를 수 있음

**Stock**:
- 실시간: 없음 (Supabase stock_prices만)
- 저장: Supabase stock_prices
- 일관성: 모든 데이터가 동일 소스에서 나옴 (SSOT)

---

## 11. 결론

### 11.1 현재 데이터 흐름 요약

| 측면 | Crypto | Stock |
|------|--------|-------|
| **실시간 데이터** | Binance API 직접 호출 | 없음 (SSOT만) |
| **과거 데이터** | Supabase market_prices | Supabase stock_prices |
| **신호 생성** | generateSignals() | generateStockSignals() |
| **분석 함수** | performAnalysis() | analyzeStock() |
| **입력 타입** | CryptoAnalysisInput | StockAnalysisInput |
| **자동 동기화** | ✅ daily_cron.ts | ⏳ 구현 예정 |
| **API 엔드포인트** | /api/analysis/[symbol] | /api/analysis/stock/[symbol] |

### 11.2 SSOT 원칙 달성

✅ **Crypto**: market_prices (매일 동기화)  
✅ **Stock**: stock_prices (SSOT, 외부 API 호출 금지)  
✅ **분리**: 파일, 타입, 함수, Route, API 모두 독립  
✅ **강제**: ESLint + TypeScript + Runtime 검증  

---

**작성일**: 2025-12-27  
**담당 에이전트**: VSCODE  
**기반 문서**: CURSOR의 DATA_FLOW_CURRENT_STATE.md (Stock 섹션 추가)
