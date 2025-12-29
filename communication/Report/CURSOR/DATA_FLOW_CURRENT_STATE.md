# DATA_FLOW_CURRENT_STATE.md

**Date**: 2025-12-27  
**Agent**: Cursor  
**Purpose**: 현재 코드 기준 실제 데이터 흐름 분석

---

## 1. 개요

이 문서는 **이상적인 구조가 아닌, 현재 코드가 실제로 어떻게 동작하는지**를 기록합니다.

---

## 2. Binance 데이터 사용 현황

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
- `app/analysis/[symbol]/page.tsx` (53-71줄)
  - 5초마다 폴링 (`setInterval(fetchRealtimePrice, 5000)`)
  - `currentPrice` 상태 업데이트
  - 화면 상단에 현재가 표시

**특징**:
- Next.js API Route로 프록시 (CORS 방지)
- 매 요청마다 Binance API 직접 호출
- 캐싱 없음

#### B. WebSocket 실시간 스트림

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

### 2.2 과거 데이터 (Historical)

#### A. 직접 호출 (일회성)

**위치**: `lib/api/binance.ts` (56-85줄)

**함수**: `getKlines(symbol, interval, limit)`

**사용처**:
- `app/market/page.tsx` (125줄): 시장 스캔 시 1000개 캔들 직접 호출
- `components/Analysis/AnalysisPanel.tsx` (33줄): 분석 패널에서 500개 캔들 호출
- `components/hero-chart.tsx` (77줄): 메인 차트 365개 캔들 호출
- `lib/signal_engine.ts` (24-40줄): 시그널 엔진에서 직접 호출

**특징**:
- 매 요청마다 Binance API 직접 호출
- 캐싱 없음
- Rate Limit 위험 존재

#### B. 저장된 데이터 사용 (Supabase)

**위치**: `app/analysis/[symbol]/page.tsx` (85-101줄)

**동작 방식**:
```typescript
// Supabase에서 과거 데이터 조회
const { data: prices } = await supabase
    .from('market_prices')
    .select('date, open, high, low, close, volume')
    .eq('symbol', symbol)
    .order('date', { ascending: false })
    .limit(990)  // 최대 990개 (약 3년치)
```

**특징**:
- Supabase `market_prices` 테이블 사용
- 최신순 정렬 후 990개 제한
- `daily_cron.ts`로 매일 동기화됨

---

## 3. Supabase 데이터 사용 현황

### 3.1 market_prices 테이블

**용도**: 과거 가격 데이터 저장 (3년치)

**스키마**:
```sql
- symbol: text (예: "BTC", "ETH")
- date: date (YYYY-MM-DD)
- open, high, low, close, volume: numeric
- type: 'CRYPTO' | 'STOCK' | 'FOREX'
```

**동기화 방식**:
- **크론 작업**: `scripts/daily_cron.ts` (108-142줄)
  - 매일 실행 (GitHub Actions 등)
  - Binance API에서 어제 완성된 캔들 1개만 가져옴
  - `interval=1d&limit=2` → 첫 번째 캔들 사용
  - `upsert`로 중복 방지

**사용처**:
1. **`app/analysis/[symbol]/page.tsx`** (85-101줄)
   - 분석 페이지 차트 데이터
   - 지표 계산 (RSI, MACD 등)
   - 최대 990개 조회

2. **`app/portfolio/page.tsx`** (109-121줄)
   - 포트폴리오 가격 조회 (Fallback)
   - Binance 실시간 가격 실패 시 사용

**특징**:
- 코인만 저장 (주식은 별도 `stock_candles` 테이블)
- 3년 이상 오래된 데이터는 자동 삭제 (`cleanup()` 함수)
- 매일 1개 캔들만 추가 (어제 완성된 것)

### 3.2 trades 테이블

**용도**: 사용자 거래 내역 저장

**스키마**:
```sql
- id: uuid
- user_id: uuid (auth.users 참조)
- symbol: text
- side: 'BUY' | 'SELL'
- qty: numeric
- price: numeric
- executed_at: timestamptz
```

**사용처**:
1. **`app/analysis/[symbol]/page.tsx`** (213-229줄)
   - 백테스트 데이터로 사용
   - 최소 30개 거래 필요
   - `user_id`와 `symbol`로 필터링

2. **`app/portfolio/page.tsx`** (전체)
   - 포트폴리오 계산
   - 평균 매수가 계산
   - 손익 계산

**특징**:
- RLS (Row Level Security) 적용
- 사용자별로 격리 (`auth.uid() = user_id`)
- 백테스트에 사용 (30개 이상 필요)

### 3.3 auth (인증)

**용도**: 사용자 세션 관리

**사용처**:
- `app/analysis/[symbol]/page.tsx` (77줄): 로그인 체크
- 모든 보호된 페이지에서 세션 확인

---

## 4. analysis 페이지 데이터 흐름

### 4.1 실시간 vs 저장 데이터 구분

#### 실시간 데이터 (Realtime)

**1. 현재가 (currentPrice)**
- **소스**: `/api/price` 엔드포인트
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

#### 저장 데이터 (Historical)

**1. 차트 데이터 (historyData)**
- **소스**: Supabase `market_prices` 테이블
- **용도**: 차트 렌더링, 지표 계산
- **코드 위치**: `app/analysis/[symbol]/page.tsx` (85-101줄)

```typescript
const { data: prices } = await supabase
    .from('market_prices')
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
    .eq('symbol', symbol)
```

**특징**:
- 사용자별 필터링
- 백테스트에 사용 (30개 이상 필요)
- 평균 매수가 계산에 사용

### 4.2 데이터 흐름 다이어그램

```
[사용자 접속]
    ↓
[페이지 로드]
    ↓
┌─────────────────────────────────────┐
│ 1. 실시간 가격 (5초마다)            │
│    /api/price → Binance API         │
│    → currentPrice 상태              │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 2. 저장된 차트 데이터 (1회)          │
│    Supabase market_prices           │
│    → historyData 상태 (990개)        │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 3. 사용자 거래 내역 (1회)            │
│    Supabase trades                  │
│    → backtestTrades, avgPrice       │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 4. 지표 계산                        │
│    historyData로 RSI, MACD 등 계산   │
│    → signals 배열                   │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 5. 분석 실행                        │
│    performAnalysis(signals, ...)    │
│    → analysisResult                 │
└─────────────────────────────────────┘
```

---

## 5. 데이터 소스 요약

### 5.1 Binance API 직접 호출

**위치**:
1. `app/api/price/route.ts`: 실시간 가격 프록시
2. `lib/api/binance.ts`: getKlines, WebSocket
3. `app/market/page.tsx`: 시장 스캔 시 직접 호출
4. `app/portfolio/page.tsx`: 실시간 가격 조회 (Fallback)
5. `scripts/daily_cron.ts`: 매일 동기화

**특징**:
- 캐싱 없음
- Rate Limit 위험
- CORS 이슈 방지를 위해 API Route 사용

### 5.2 Supabase 저장 데이터

**테이블**:
1. `market_prices`: 과거 가격 (3년치)
2. `trades`: 사용자 거래 내역
3. `auth.users`: 사용자 인증

**동기화**:
- `market_prices`: `daily_cron.ts`로 매일 1개 캔들 추가
- `trades`: 사용자가 거래 입력 시 저장
- 3년 이상 오래된 데이터 자동 삭제

---

## 6. 실제 동작 시나리오

### 시나리오 1: 사용자가 `/analysis/BTC` 접속

1. **페이지 로드** (`useEffect` 실행)
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
5. **지표 계산**
   - `historyData`로 RSI, MACD 등 계산
   - `signals` 배열 생성
6. **분석 실행**
   - `performAnalysis()` 호출
   - `analysisResult` 상태 설정
7. **화면 렌더링**
   - 차트: `historyData` 사용
   - 현재가: `currentPrice` 사용 (5초마다 업데이트)
   - 분석 결과: `analysisResult` 사용

### 시나리오 2: daily_cron.ts 실행 (매일)

1. **코인 동기화** (`syncCoins()`)
   - Binance API에서 어제 완성된 캔들 1개 가져옴
   - `market_prices` 테이블에 `upsert`
2. **주식 동기화** (`syncStocks()`)
   - TwelveData API 사용 (별도 테이블)
3. **뉴스 동기화** (`syncNews()`)
   - Google News RSS 파싱
4. **정리 작업** (`cleanup()`)
   - 3년 이상 오래된 데이터 삭제

---

## 7. 주의사항 및 제약사항

### 7.1 Binance API 직접 호출

**문제점**:
- Rate Limit: 1200 req/min 제한
- 캐싱 없음: 매 요청마다 API 호출
- 단일 장애점: Binance API 장애 시 전체 영향

**현재 상태**:
- 여러 곳에서 직접 호출
- 중앙화된 캐싱 레이어 없음

### 7.2 Supabase 데이터

**제약사항**:
- `market_prices`: 코인만 저장 (주식은 별도)
- 매일 1개 캔들만 추가 (어제 완성된 것)
- 실시간 데이터 아님 (최대 1일 지연)

**장점**:
- 빠른 조회 (DB 캐시)
- Rate Limit 부담 없음
- 오프라인 분석 가능

### 7.3 실시간 vs 저장 데이터 혼용

**현재 구조**:
- 실시간: 현재가만 (5초 폴링)
- 저장: 차트 데이터 (Supabase)
- **문제**: 실시간 가격과 차트 데이터가 불일치할 수 있음

**예시**:
- 차트 마지막 캔들: 어제 종가
- 실시간 가격: 현재가
- → 차트와 현재가가 다를 수 있음

---

## 8. 결론

### 현재 데이터 흐름 요약

1. **실시간 데이터**: Binance API 직접 호출 (5초 폴링)
2. **과거 데이터**: Supabase `market_prices` (990개, 매일 동기화)
3. **사용자 데이터**: Supabase `trades` (사용자별)
4. **분석 데이터**: 클라이언트에서 계산 (지표, 확률 등)

### 주요 특징

- ✅ 실시간 가격은 Binance API 직접 호출
- ✅ 차트 데이터는 Supabase 저장 데이터 사용
- ✅ 사용자 거래는 Supabase에 저장
- ⚠️ 캐싱 레이어 없음
- ⚠️ Rate Limit 위험 존재
- ⚠️ 실시간과 저장 데이터 혼용

---

**작성일**: 2025-12-27  
**담당 에이전트**: Cursor







