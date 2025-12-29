# Stock Analysis SSOT Module

## Overview

This module provides **Single Source of Truth (SSOT)** data fetching for stock analysis.

**CRITICAL RULE**: This module **ONLY** reads from Supabase `stock_prices` table. **NO external API calls allowed.**

## Files

- `fetchStockSSOT.ts` - Main SSOT fetcher (Supabase only)

## Usage

### Basic Usage

```typescript
import { fetchStockSSOT } from '@/lib/analysis/stock/fetchStockSSOT';

// Fetch latest 365 candles
const result = await fetchStockSSOT({ symbol: 'AAPL', limit: 365 });

if (result.success && result.data) {
    // Use result.data for analysis
    const candles = result.data;
    // candles is sorted ascending by time (oldest to newest)
}
```

### Helper Functions

```typescript
import { 
    fetchStockSSOTByDays,
    fetchStockSSOTLatest 
} from '@/lib/analysis/stock/fetchStockSSOT';

// Fetch last 30 days
const last30Days = await fetchStockSSOTByDays('AAPL', 30);

// Fetch latest 100 candles
const latest = await fetchStockSSOTLatest('AAPL', 100);
```

## Data Source

- **Table**: `stock_prices` (Supabase)
- **Populated by**: `scripts/daily_cron.ts` (TwelveData API → stock_prices)
- **No direct API calls**: This module does NOT call TwelveData, Alpha Vantage, or any external API

## Blocked External APIs

The following are **FORBIDDEN** in analysis code:

- ❌ `lib/api/twelvedata.ts` - DO NOT import in analysis
- ❌ `lib/api/alphavantage.ts` - DO NOT import in analysis
- ❌ Direct `fetch()` to external stock APIs
- ❌ Any external API calls in analysis context

## Integration with Analysis

Use this module in:

- `app/analysis/stock/[symbol]/page.tsx` (if exists)
- `lib/analysis/stock.ts` (orchestrator)
- Any stock analysis components

**Example Integration**:

```typescript
// ✅ CORRECT - Use SSOT fetcher
import { fetchStockSSOT } from '@/lib/analysis/stock/fetchStockSSOT';
const result = await fetchStockSSOT({ symbol: 'AAPL', limit: 365 });

// ❌ WRONG - External API in analysis
import { getTwelveDataTimeSeries } from '@/lib/api/twelvedata';
const data = await getTwelveDataTimeSeries('AAPL', '1d', 365);
```

## Error Handling

The function returns a result object:

```typescript
interface FetchStockSSOTResult {
    success: boolean;
    data: StockCandleData[] | null;
    error: string | null;
    count: number;
}
```

Always check `result.success` before using `result.data`.

## Data Format

```typescript
interface StockCandleData {
    time: number;      // Unix timestamp (seconds)
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    symbol: string;
    currency?: string;  // 'USD'
    source?: string;   // 'twelvedata'
}
```

Data is **sorted ascending by time** (oldest to newest) for analysis compatibility.

