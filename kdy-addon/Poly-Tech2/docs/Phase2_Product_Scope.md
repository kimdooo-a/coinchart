# Phase 2 Product Scope (Pricing Boundary)

> [!NOTE]
> **Service Name**: **ChartMaster**
> **Model**: Freemium (Ad-supported vs Subscription).

## 1. Feature Boundary Matrix

| Feature Category | FREE (Guest/User) | PRO (Subscriber) | Design Implementation |
| :--- | :--- | :--- | :--- |
| **Home (`/`)** | - Global Sentiment (Fear/Greed)<br>- Top 5 Gainers/Losers<br>- Basic News Feed | - **Market Anomaly Detection**<br>- **Sector Flow Heatmap**<br>- Ad-free Experience | **Free**: Standard Grid<br>**Pro**: Interactive 3D/GL |
| **Coin Analysis** | - 15m Delayed Data (if API limit)<br>- Basic Indicators (RSI, MA)<br>- Simple Summary | - **Real-time Data**<br>- **Advanced Patterns** (Harmonic)<br>- **Signal Confidence Score** | **Free**: Blurred Pro Section<br>**Pro**: Clear Stats |
| **Stock Analysis** | - End-of-Day Data<br>- Major Indices (SPX, NDX) | - **Intraday Ticks**<br>- **Correlation Matrix** (Crypto vs Stock) | **Free**: Static Charts<br>**Pro**: Live Ticks |

## 2. Technical Constraints
*   **Auth**: Supabase Auth handles `is_pro` claim.
*   **API Proxy**: Server-side check (`/api/analysis/pro`) validates session before fetching Pro data.
*   **No Paywall Bypass**: Critical data must NEVER be sent to the client for Free users (do not just hide with CSS).

## 3. "Classic Masters" Theme Application
*   **Free Tier**: "Sketch" / "Canvas" feel (Lighter, simpler).
*   **Pro Tier**: "Masterpiece" feel (Deep gradients, Glassmorphism, Van Gogh textures).
