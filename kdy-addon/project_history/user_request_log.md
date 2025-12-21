# User Request History Log
Generated on: 2025-12-21

This document archives all user requests and main objectives extracted from the project's conversation history, ordered chronologically.

## 2025-12-06
### [01:57 AM] Crypto Service MVP Planning
- **Objective**: Define product requirements for a cryptocurrency market analysis web service.
- **Details**: Outlined features, menu structure, and page layouts for the MVP (Real-time price, Charting, Basic indicators).

### [10:25 AM] Enhancing Coin History Timeline
- **Objective**: Expand historical content for cryptocurrencies.
- **Details**: Populated `lib/coin_histories.ts` with detailed events for BTC, ETH, XRP, SOL, DOGE. Developed a Detail View UI (modal) for events in `app/history/page.tsx`.

### [02:13 PM] Refining Coin History Details
- **Objective**: Enrich content and presentation of `app/history/page.tsx`.
- **Details**: Added comprehensive historical events for Bitcoin Cash (BCH), including narratives like "Operation Dragon Slayer". Added bilingual introductions for each coin.

## 2025-12-07
### [11:34 AM] Implementing Fractal Analysis
- **Objective**: Upgrade Market Mood and Analysis pages with Fractal Pattern Matching.
- **Details**: Integrated a Fractal Engine to analyze historical price patterns (last 1000 candles) and recommend positions based on similarity.

## 2025-12-13
### [12:33 AM] Verifying Market Mood Integration
- **Objective**: Verify integration of advanced analysis logic in `app/market/page.tsx`.
- **Details**: Confirmed `analyzeMarket` usage and `RSIHeatmap` integration.

### [02:42 AM] Fixing Errors, Adding Languages
- **Objective**: Resolve build errors and add bilingual support (KR/EN).
- **Details**: Implemented missing technical indicators (`calculateADX`, `calculateMACD`) in `lib/indicators.ts`. Integrated `LanguageContext`.

### [08:50 AM] Stock Data Persistence
- **Objective**: Store historical US stock data in Supabase.
- **Details**: Created Supabase table, server-side API for Twelve Data ingestion, and configured Vercel Cron.

### [01:38 PM] Continue Stock Data Persistence
- **Objective**: Integrate Supabase stock data into the frontend.
- **Details**: Modified stock analysis page to fetch chart data from `stock_candles` table.

### [01:50 PM] GitHub Workflow Guidance
- **Objective**: Documentation on GitHub workflow.

### [01:54 PM] Fix Chart Component Type Errors
- **Objective**: Fix TypeScript errors in `CryptoChart.tsx` and `StockChart.tsx`.

### [02:58 PM] Refactor Coin History Details
- **Objective**: Finalize Coin History feature refactoring.
- **Details**: Consolidated data into `lib/history-data.ts`.

### [11:07 PM] Debugging Login Error
- **Objective**: Resolve "requested path is invalid" error during login.

## 2025-12-14
### [12:02 AM] Android App Packaging
- **Objective**: Package the React web app as a native Android app using Capacitor.

### [03:11 AM] Troubleshooting Android Emulator
- **Objective**: Fix Android Emulator issues in Android Studio.

## 2025-12-21
### [04:51 AM] Analyze Project Structure
- **Objective**: Analyze current project state.

### [Current Session] Home UI & Asset Upgrade
- **Objective**: Globalize header and enhance home page visuals.
- **Details**: 
    - Extracted `GlobalHeader`.
    - Updated Logo to "사랑하는 마누라".
    - Added "About Us" and "Footer" sections.
    - Added 1.5x Spacer to sub-pages (`h-24`).

### [Current Session] Dashboard Asset Upgrade
- **Objective**: Replace emoji icons with premium graphics.
- **Details**: Implemented `GlassIcon` component using CSS/SVG.

### [Current Session] Navigation Debugging
- **Objective**: Fix internal "Back" navigation issues.
- **Details**: Removed redundant local headers. Resolved layout overlap issues.

### [Current Session] Add Legal & Contact Pages
- **Objective**: Add essential sub-pages.
- **Details**:
    - Created `/terms` (Terms of Service) page.
    - Created `/contact` (Contact Us) page with email form.
    - Implemented `/api/contact` using `nodemailer`.

### [Current Session] Archive User Requests
- **Objective**: Create a log of all user requests.
- **Details**: Created `kdy-addon/project_history/user_request_log.md` to track project history and future requests.
