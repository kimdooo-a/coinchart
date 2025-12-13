# New Feature Implementation Walkthrough

## Overview
We have added three highly requested features for Korean crypto investors:
1. **Kimchi Premium Board (김프 보드)**
2. **RSI Heatmap (RSI 히트맵)**
3. **Whale Alert Feed (고래 경보)**

## Features

### 1. Kimchi Premium Board
- **Location**: `/market` (Market Mood Analysis)
- **Description**: Displays the real-time price difference between Upbit (KRW) and Binance (Global USD).
- **Tech**: 
  - Uses `app/api/kimchi/route.ts` to fetch prices securely server-side.
  - Calculates premium: `((Upbit Price / Exchange Rate) - Binance Price) / Binance Price * 100`.
  - Auto-refreshes every 10 seconds.

### 2. RSI Heatmap
- **Location**: `/market` (Market Mood Analysis)
- **Description**: Visualizes the Relative Strength Index (RSI) for major coins (BTC, ETH, SOL, XRP, DOGE, etc.).
- **Tech**: 
  - Fetches 4h Klines (Candles) from Binance API.
  - Client-side calculation using 14-period RSI formula.
  - Color-coded: Red (Overbought > 70) to Green (Oversold < 30).

### 3. Whale Alert Feed
- **Location**: `/signal` (AI Surge Detection)
- **Description**: A live scrolling feed of simulated large tracking movements.
- **Tech**: 
  - Simulates Inflow (to Exchange), Outflow (from Exchange), and Wallet Transfers.
  - Animated UI using `framer-motion`.

## Files Modified/Created
- `app/api/kimchi/route.ts` (NEW)
- `components/Market/KimchiPremium.tsx` (NEW)
- `components/Market/RSIHeatmap.tsx` (NEW)
- `components/Signal/WhaleAlert.tsx` (NEW)
- `app/market/page.tsx` (Updated)
- `app/signal/page.tsx` (Updated)
