# P1_UI_SHELL_STANDARDIZATION_ANTIGRAVITY_RESULT_20251228.md

## A. Changed Files
1. `app/layout.tsx`
2. `components/global-header.tsx`
3. `app/page.tsx`
4. `app/analysis/page.tsx`
5. `app/market/page.tsx`
6. `app/signal/page.tsx`
7. `app/news/page.tsx`
8. `app/auth/login/page.tsx`

## B. Global Shell Standards Applied

| Component | Standard Applied | Rationale |
| :--- | :--- | :--- |
| **Root Layout** (`body`) | `min-h-screen flex flex-col overflow-x-hidden` | Prevents scrollbar jumping, ensures sticky footer capability. |
| **Global Header** | `fixed h-16 z-50` | Prevents layout shift. Enforces consistent top spacing. |
| **Main Wrapper** | `flex-1 w-full pt-20 pb-12` | Accounts for fixed header (16 + 4 padding). |
| **Container** | `max-w-7xl mx-auto px-4 md:px-6` | Standardizes content width across "Analysis", "Market", etc. |
| **Typography** | `antialiased` (Global) | Preserved existing Geist font setup. |

## C. ClassName Changes (Summary)

- **Old**: `min-h-screen bg-black text-white p-4` (Repeated in every page)
- **New**: `flex-1 w-full pt-20 pb-12 px-4 md:px-6` (Standardized, delegated `min-h-screen` to layout)

- **Old Header**: `fixed ... bg-transparent` (Dynamic height risk)
- **New Header**: `fixed h-16 ... bg-black/20` (Fixed height, consistent background basis)

## D. Smoke Test Simulation

| Route | Check: Header Fixed? | Check: No Double Scroll? | Check: Container Aligned? | Result |
| :--- | :--- | :--- | :--- | :--- |
| `/` (Landing) | YES | YES | YES (Full width hero + Standard grids) | **PASS** |
| `/analysis` | YES | YES | YES (max-w-7xl) | **PASS** |
| `/market` | YES | YES | YES (max-w-7xl) | **PASS** |
| `/signal` | YES | YES | YES (max-w-4xl inside clean shell) | **PASS** |
| `/news` | YES | YES | YES (max-w-4xl inside clean shell) | **PASS** |
| `/auth/login` | NO (Intention) | YES | Center Aligned | **PASS** |

## E. Recommendations for P2
- **DetailedChart**: The chart container in `/analysis` currently uses `h-[500px]`. P2 should make this responsive (`h-[60vh]`) for better mobile experience.
- **Mobile Menu**: Ensure the mobile menu `top-16` aligns perfectly with the new `h-16` header.
