# Project Summary: Coin Chart Analysis (Root Project)

> [!NOTE]
> This document summarizes the **Root Project** (`crypto-chart-analysis`) context, distinct from the `poly-tech2` sub-module.

## 1. Project Identity
*   **Name**: `crypto-chart-analysis`
*   **Purpose**: Cryptocurrency Chart Analysis & Information Dashboard.
*   **Type**: Web Application (Next.js 16).

## 2. Tech Stack (Core Dependencies)
*   **Framework**: Next.js 16.0.7 (React 19, TSX)
*   **Database/Auth**: Supabase (`@supabase/ssr`, `@supabase/supabase-js`)
*   **Charting**: Lightweight Charts (`lightweight-charts`) - TradingView library equivalent.
*   **Styling**: Tailwind CSS v4, Lucide React (Icons), Framer Motion (Animations).
*   **Utilities**: 
    *   `rss-parser`: For fetching news dumps?
    *   `nodemailer`: Email services.
    *   `scripts/daily_cron.ts`: Scheduled tasks.

## 3. Directory Structure (High Level)
*   `app/`: Next.js App Router (Pages & API routes).
*   `components/`: React UI components.
*   `lib/`: Shared logic & utilities.
*   `supabase/`: DB migrations/config.
*   `scripts/`: Automation scripts (e.g., cron jobs).
*   `kdy-addon/`: **Poly-Tech2** sub-project location (Independent Agent System).

## 4. Key Configurations
*   **Environment**: Uses `.env.local`.
*   **Scripts**:
    *   `dev`, `build`, `start`: Standard Next.js lifecycle.
    *   `cron:daily`: Custom daily task runner.

---
**Last Analyzed**: 2025-12-27
**Scope**: Root Directory Only
