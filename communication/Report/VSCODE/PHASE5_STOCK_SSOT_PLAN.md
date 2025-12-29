# PHASE_5_STOCK_SSOT_PLAN.md

## Phase 5 실행 계획: Stock SSOT 완전 분리

### 목표
- Crypto SSOT (Supabase market_prices) 유지
- Stock SSOT 완전 분리 (Supabase stock_prices 신규)
- Crypto/Stock 코드 import 섞임 방지

### 1단계: Supabase 스키마 설계

#### 1.1 stock_prices 테이블 설계

```sql
-- stock_prices 테이블 (Stocks 전용 SSOT)
CREATE TABLE stock_prices (
    id BIGSERIAL PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL,        -- e.g., 'AAPL', 'MSFT'
    time BIGINT NOT NULL,               -- Unix timestamp (seconds)
    open NUMERIC(12, 2) NOT NULL,
    high NUMERIC(12, 2) NOT NULL,
    low NUMERIC(12, 2) NOT NULL,
    close NUMERIC(12, 2) NOT NULL,
    volume BIGINT NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',  -- 통화
    source VARCHAR(50) DEFAULT 'twelvedata',
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(symbol, time)
);

-- Index 추가
CREATE INDEX idx_stock_prices_symbol_time ON stock_prices(symbol, time DESC);
CREATE INDEX idx_stock_prices_symbol ON stock_prices(symbol);

-- RLS Policy (공개 읽기, 인증된 사용자만 쓰기)
ALTER TABLE stock_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stocks_read_public" ON stock_prices
    FOR SELECT
    USING (true);

CREATE POLICY "stocks_write_authenticated" ON stock_prices
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');
```

#### 1.2 분리 원칙
- **market_prices**: Crypto only (symbol = 'BTCUSDT', 'ETHUSDT' 등)
- **stock_prices**: Stock only (symbol = 'AAPL', 'MSFT' 등)
- 양쪽 모두 동일 스키마 (time, open, high, low, close, volume)

### 2단계: 파일 구조 강제 분리

#### 2.1 폴더 구조
```
lib/
├── api/
│   ├── binance.ts          (Crypto only)
│   ├── twelvedata.ts       (Stock only - 신규)
│   └── index.ts            (never import from here for analysis)
├── analysis/
│   ├── crypto.ts           (Crypto 분석 - 기존 orchestrator.ts 이름 변경)
│   ├── stock.ts            (Stock 분석 - 신규)
│   └── shared.ts           (절대 금지)
├── supabase/
│   ├── crypto.ts           (market_prices 쿼리)
│   ├── stock.ts            (stock_prices 쿼리 - 신규)
│   └── index.ts            (re-export 금지)

app/
├── api/
│   ├── analysis/
│   │   ├── [symbol]/route.ts    (crypto 전용)
│   │   └── stock/[symbol]/route.ts (stock 전용 - 신규)
│   └── klines/route.ts          (crypto 프록시, 기존 유지)

components/
├── Analysis/
│   ├── CryptoPanel.tsx      (기존 AnalysisPanel.tsx 이름 변경)
│   └── StockPanel.tsx       (신규)
```

#### 2.2 import 강제 규칙
- **Crypto 컴포넌트**: `@/lib/supabase/crypto`, `@/lib/analysis/crypto` only
- **Stock 컴포넌트**: `@/lib/supabase/stock`, `@/lib/analysis/stock` only
- **공통 금지**: `@/lib/analysis`, `@/lib/supabase` (명시적 파일 경로 필수)

### 3단계: 구현 단계

#### 3.1 Supabase 쿼리 함수
- `lib/supabase/crypto.ts`: `fetchCryptoMarketPrices(symbol, limit)`
- `lib/supabase/stock.ts`: `fetchStockPrices(symbol, limit)` (신규)

#### 3.2 분석 함수
- `lib/analysis/crypto.ts`: `analyzeCrypto(candles, symbol, timeframe, ...)`
- `lib/analysis/stock.ts`: `analyzeStock(candles, symbol, period, ...)` (신규)

#### 3.3 API Route
- `/api/analysis/[symbol]` (기존, Crypto 전용)
- `/api/analysis/stock/[symbol]` (신규, Stock 전용)

#### 3.4 UI 컴포넌트
- `components/Analysis/CryptoPanel.tsx` (기존 AnalysisPanel.tsx 복사)
- `components/Analysis/StockPanel.tsx` (신규)

### 4단계: CI/검증

#### 4.1 Import 검증 (lint rule)
```javascript
// .eslintrc에 추가
{
  "rules": {
    "no-restricted-imports": [
      "error",
      {
        "paths": [
          {
            "name": "@/lib/analysis",
            "message": "Use @/lib/analysis/crypto or @/lib/analysis/stock"
          },
          {
            "name": "@/lib/supabase",
            "message": "Use @/lib/supabase/crypto or @/lib/supabase/stock"
          }
        ]
      }
    ]
  }
}
```

#### 4.2 테스트
- Crypto `/analysis/BTC`: Supabase market_prices 1회, Binance 0회
- Stock `/analysis/stock/AAPL`: Supabase stock_prices 1회, TwelveData 0회 (API Route 프록시)

### 5단계: 마이그레이션 (향후)

#### 5.1 기존 Stock 데이터 이관
- TwelveData API → stock_prices 테이블 bulk insert

#### 5.2 동기화 (선택)
- daily_cron.ts: Binance data → market_prices
- daily_cron.ts: TwelveData API → stock_prices (별도 job)

### 산출물
1. Supabase 마이그레이션 파일 (stock_prices 테이블)
2. lib/supabase/crypto.ts, lib/supabase/stock.ts
3. lib/analysis/crypto.ts, lib/analysis/stock.ts
4. app/api/analysis/stock/[symbol]/route.ts
5. components/Analysis/StockPanel.tsx
6. ESLint 규칙 업데이트
7. RESULT_PHASE5_VSCODE.md (검증 보고서)