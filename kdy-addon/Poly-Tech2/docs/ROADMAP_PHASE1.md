# ROADMAP: PHASE 1 (Architecture Lock)

**Goal**: Transform "Bootstrap" state into a functional "MVP".
**Focus**: Revenue-generating Core Pages (Home, Analysis, Stock).

## 1. Core Pages (The "Money Makers")
Priority targets for high-quality implementation.

1.  **Home (`/`)**:
    *   **Goal**: Dashboard showing the "Market Art".
    *   **Key Feature**: Global Market Sentiment (Fear/Greed), Top Movers.
2.  **Coin Analysis (`/analysis/[symbol]`)**:
    *   **Goal**: Deep Dive.
    *   **Key Feature**: TradingView Chart (Lightweight), AI Insight Summary (Mock/Local), Technical Indicators.
3.  **Stock Analysis (`/stock`)**:
    *   **Goal**: Market Expansion.
    *   **Key Feature**: US Stock Data (Mock fix required), Sector Performance.

## 2. Timeline (Draft)

### Sprint 1: Architecture Foundation (Week 1-2)
- [ ] **Proxy Server**: Implement Next.js Router Handler for external APIs (CoinGecko/Binance).
- [ ] **Data Caching**: Redis or In-Memory cache to prevent rate limits.
- [ ] **Design System**: Apply "Classic Masters" theme variables (CSS/Tailwind).

### Sprint 2: Core Implementation (Week 3-4)
- [ ] **Home Page**: Refactor with new Design System.
- [ ] **Coin Page**: Enhance Chart interaction and data loading.
- [ ] **Stock Page**: Replace "Lorem Ipsum" with structured Mock/Real data.

### Sprint 3: Refinement (Week 5-8)
- [ ] **Backtest Engine**: Reliable historical testing.
- [ ] **User Auth**: Save favorite coins/stocks (Supabase).

---
**Status**: APPROVED by Commander.
