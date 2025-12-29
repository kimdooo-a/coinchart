# Pricing Boundary (Freemium Model)

> [!NOTE]
> **Model**: Freemium (Ad-supported Free Tier + Subscription Paid Tier).
> **Objective**: Hook users with high-fidelity visualization, monetize deep insights.

## 1. Free vs. Paid Feature Matrix

| Feature | Free (Guest/User) | Paid (Subscriber) |
| :--- | :--- | :--- |
| **Real-time Chart** | ✅ Yes (Basic Ticks) | ✅ Yes (High Frequency) |
| **Indicators** | ✅ Standard (RSI, MACD) | ✅ **Advanced** (Bollinger, Custom) |
| **Analysis** | ⚠️ **Limited** (Summary only) | ✅ **Full Report** (Detailed Signals) |
| **Backtest** | ⚠️ **Latests 3 Months** | ✅ **Full History** (Unlimited) |
| **Stock Data** | ⚠️ **Delayed (15m)** | ✅ **Real-time** (if API allows) |
| **Asset** | ⚠️ Public Domain Art | ✅ Premium Themes (Monet/VanGogh) |

## 2. Lock Mechanism (UX)
*   **Blur Effect**: Details of "Pro" analysis are blurred out for free users.
*   **Teaser**: "Unlock Historical Data (3 Years) with ChartMaster Pro."
*   **Call-to-Action**: Strategically placed on the most valuable insight block.

## 3. Implementation
*   **User Role**: `free` vs `pro`.
*   **Gatekeeper**: Server-side check before returning "Pro" data.
*   **Frontend**: `if (isPro) <Detail /> else <LockOverlay />`.
