# P0 IMPLEMENTATION MAP AUDIT result (ANTIGRAVITY)

**Date**: 2025-12-28
**Executor**: ANTIGRAVITY
**Target**: Poly-Tech2 (Crypto Chart Analysis)
**Phase**: P0 (Pre-UI Audit)

## A. Project Overview
This project is a Next.js 16+ application (`crypto-chart-analysis`) focused on Cryptocurrency and Stock market analysis.
It uses **Supabase** as the SSOT for market data (`market_prices` table) and **Lightweight Charts** for visualization.
Global state handles **Language** (KO/EN), while feature state (Symbol, Chart Data) is primarily **Local**.
Key features include real-time (or snapshot) charting, market sentiment analysis, and AI signals.

## B. Route / Page Inventory

| Route | Purpose | Key UI | Data Dependency | Params |
| :--- | :--- | :--- | :--- | :--- |
| `/` | Landing Page | Hero, DashboardGrid, About, Footer | None (Static/Client Translate) | - |
| `/auth/login` | User Authentication | Login Form | Supabase Auth | - |
| `/analysis` | **Core Crypto Analysis** | Coin Bar, DetailedChart, Ticker, AnalysisPanel | **Supabase (market_prices)** | - |
| `/analysis/[symbol]` | Dynamic Crypto Page | (Likely same as /analysis but SSR?) | Supabase | `[symbol]` |
| `/analysis/stock` | Stock Analysis Hub | (Stock Dashboard) | (Stock API) | - |
| `/market` | Market Mood | Heatmap/List | Coingecko/Binance API? | - |
| `/signal` | AI Signal Dashboard | Signal Cards, History | Supabase (signals table?) | - |
| `/stock` | Stock Landing | Stock Overview | - | - |
| `/stock-market` | Stock Market Mood | - | - | - |
| `/news` | News Feed | News List | RSS/News API | - |
| `/api/*` | Data Endpoints | REST Handlers | DB/External APIs | Dynamic |

## C. Navigation & Button Map

### Global Navigation (`GlobalHeader`)
- **Coin Menu**: Analysis (`/analysis`), Market (`/market`), Signal (`/signal`)
- **Stock Menu**: Analysis (`/stock`), Market (`/stock-market`)
- **Info Menu**: News (`/news`), Calendar (`/calendar`), History (`/history`)
- **Language**: Toggle Button (KO/EN) -> Updates `LanguageContext` + `localStorage`

### Core Feature CTA (`/analysis`)
- **Symbol Selection Buttons** (BTC, ETH, XRP, etc.):
  - **Action**: `onClick={() => setSymbol(item.symbol + 'USDT')}`
  - **Type**: `STATE_CHANGE` (Local Re-render)
  - **Note**: Does NOT change URL path (SPA feel).
- **Timeframe Toggles** (1h, 4h, 1d):
  - **Action**: `useState` setter (visual only in current snippet?)
  - **Type**: `STATE_CHANGE`

## D. State & Message Flow

1.  **Language Flow**:
    - User Click Toggle -> `LanguageContext.toggleLang()` -> Update State & `localStorage` -> Re-render All Components with `t[lang]`.
2.  **Chart Data Flow (`/analysis`)**:
    - User Click Symbol -> `setSymbol('ETHUSDT')` -> `useEffect` triggers ->
    - `setIsLoading(true)` ->
    - `supabase.from('market_prices').select(...)` ->
    - `setHistoryData(formatted)` -> `setIsLoading(false)` ->
    - Chart Component receives new `data` prop -> Re-draws.

## E. Data Flow Summary

- **Primary Source**: Supabase Database
- **Table**: `market_prices` (Columns: `date`, `open`, `high`, `low`, `close`, `volume`, `symbol`)
- **Optimization**: Client-side fetching in `useEffect`. No React Query found (native `fetch`/state).
- **Risk**: Large manual data mapping in client (`formatted = data.map...`).

## F. DO NOT TOUCH LIST (Critical Logic)

> [!CAUTION]
> The following files and logic blocks MUST NOT be modified during UI Refactoring.

1.  **`app/analysis/page.tsx`**:
    - `useEffect` data fetching logic (Lines 47-86).
    - `setSymbol` logic in buttons (Lines 115).
    - Imports marked `// SSOT Compliant`.
2.  **`lib/supabase/client.ts`**:
    - Supabase client initialization.
3.  **`context/LanguageContext.tsx`**:
    - Entire Provider logic (don't break translation state).
    - `localStorage` sync logic.
4.  **`components/DetailedChart.tsx`**:
    - Chart initialization (Lightweight Charts logic).

## G. UI-ONLY SAFE ZONE

> [!TIP]
> You MAY freely modify the following for design improvements:

1.  **CSS Classes**: Tailwind classes (`className="..."`) in `app/page.tsx`, `app/analysis/page.tsx`, `components/global-header.tsx`.
2.  **Layout Wrappers**: `div` containers for spacing/grid (e.g. `max-w-7xl mx-auto`).
3.  **Visual Assets**: Icons (Lucide), Colors, Gradients, Backgrounds.
4.  **Text Content**: Headers, Labels (as long as `t.variable` mapping is preserved).

## H. Known Risks (Observation Only)
- **Unused State**: `showRSI`, `showBB`, etc. in `AnalysisPage` are defined but NOT passed to `DetailedChart`. UI controls for these might be fake placeholders.
- **Any Type**: `historyData` uses `any[]`, potentially fragile if DB schema changes.
- **Hardcoded Symbol**: Default is `'BTCUSDT'`.
