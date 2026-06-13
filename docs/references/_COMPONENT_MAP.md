# Component Map

> 최종 업데이트: 2026-06-13 (R9 gap-verify / T09 — `components/community/*` 섹션 신규 등재, R8 삭제 3종 부재 재확인)
>
> 각 컴포넌트의 사용 페이지, lib 의존성, 컴포넌트 간 의존 관계를 정리한 문서입니다.

---

## 카테고리별 컴포넌트

### Analysis

| 컴포넌트 | 사용 페이지 | lib 의존성 | 컴포넌트 의존성 |
|----------|-----------|------------|----------------|
| `AnalysisPanel` | `app/analysis/page.tsx` | `lib/analysis/orchestrator`, `lib/analysis/signals`, `lib/analysis/aggregation`, `lib/backtest/engine` (훅 경유) | `useAnalysisCandles`, `useAnalysisResult` |
| `ChartAnalysisPanel` | `app/analysis/page.tsx`, `app/stock/page.tsx` | `lib/analysis/aggregation`, `lib/analysis/signals`, `lib/indicators` | 없음 |
| `StockPanel` | `app/analysis/stock/[symbol]/page.tsx` | `lib/supabase/stock`, `lib/analysis/stock-signals`, `lib/analysis/stock` | `PremiumLock` |
| `TradingStrategyGuide` | 현재 미사용 (주석 처리됨) | 없음 | `AIAdviceSection`, `ConfigSection`, `EntryPlanSection` (R9 분할) |
| `TradingStrategyGuide/AIAdviceSection` | `TradingStrategyGuide` | 없음 | 없음 |
| `TradingStrategyGuide/ConfigSection` | `TradingStrategyGuide` | 없음 | 없음 |
| `TradingStrategyGuide/EntryPlanSection` | `TradingStrategyGuide` | 없음 | 없음 |

#### Analysis 커스텀 훅 (R9 신설 — `components/hooks/`)

| 훅 | 시그니처 | 사용 컴포넌트 | lib 의존성 |
|----|----------|---------------|------------|
| `useAnalysisCandles` | `(symbol, interval) → { candles, isLoading, error }` | `AnalysisPanel` | `lib/analysis/aggregation` |
| `useAnalysisResult` | `(candles, symbol, interval, userTier) → AnalysisResult \| null` | `AnalysisPanel` | `lib/analysis/orchestrator`, `lib/analysis/signals`, `lib/backtest/engine` |

#### `app/analysis/[symbol]` 라우트 분할 컴포넌트 (R9 신설 — `_components/`)

| 컴포넌트 | 사용 페이지 | props 핵심 |
|----------|-----------|------------|
| `AnalysisHeader` | `app/analysis/[symbol]/page.tsx` | symbol, lang, setLang, avgPrice, currentPrice, t, onBack |
| `ChartSection` | `app/analysis/[symbol]/page.tsx` | loading, historyData, avgPrice, symbol, t |
| `ProbabilityConfidenceCards` | `app/analysis/[symbol]/page.tsx` | analysisResult, lang |
| `ExplanationCard` | `app/analysis/[symbol]/page.tsx` | analysisResult, lang |
| `BacktestCard` | `app/analysis/[symbol]/page.tsx` | analysisResult, userTier, lang |
| `PositionFractalCards` | `app/analysis/[symbol]/page.tsx` | avgPrice, historyData, fractalResult, t, lang |

### Community (v2.0 커뮤니티 피벗 — `components/community/`)

> R1~R8에 걸쳐 신설된 커뮤니티(게시판·뉴스·코인룸·메인) 공통 컴포넌트. 실제 디렉터리 스냅샷(2026-06-13) 기준 15개 + `widgets/` 5개. lib 의존은 `lib/community/*`(board-meta/board-queries/coin-queries/news-meta/news-server) + `lib/utils`(cn).

| 컴포넌트 | 사용 페이지·컴포넌트 | lib 의존성 | 컴포넌트 의존성 |
|----------|---------------------|------------|----------------|
| `Badge` | `app/board/[slug]/[postId]/page.tsx` | `lib/utils` | 없음 |
| `BoardListControls` | `app/board/[slug]/page.tsx` | `lib/community/board-meta`, `lib/community/board-queries` | `CommunityTabs` |
| `BoardRow` | `app/board/[slug]/page.tsx`, `app/board/[slug]/[postId]/page.tsx`, `app/page.tsx`, `CoinRoomTabs` | `lib/utils` | 없음 |
| `BoardSidebar` | `app/board/[slug]/page.tsx`, `app/board/[slug]/[postId]/page.tsx` | `lib/community/board-queries` | `widgets/FngGaugeWidget`, `widgets/HotIssueWidget`, `widgets/OfficialPostsWidget`, `widgets/PriceTickerWidget`, `widgets/ToolsShortcutWidget` |
| `CoinHero` | `app/coin/[symbol]/page.tsx` | `lib/utils` | 없음 |
| `CoinRoomTabs` | `app/coin/[symbol]/page.tsx` | `lib/community/coin-queries` | `BoardRow`, `NewsRow`, `CommunityTabs` |
| `CommentSection` | `app/board/[slug]/[postId]/page.tsx` | `lib/community/board-queries` | 없음 |
| `CommunityTabs` | `BoardListControls`, `CoinRoomTabs` | `lib/utils` | 없음 |
| `NewsFilters` | `app/news/page.tsx` | `lib/community/news-meta`, `lib/community/news-server`, `lib/utils` | `NewsHeadlineCard` |
| `NewsHeadlineCard` | `app/news/page.tsx`, `app/page.tsx`, `NewsFilters` | `lib/utils` | 없음 |
| `NewsRow` | `app/news/page.tsx`, `app/page.tsx`, `CoinRoomTabs` | `lib/utils` | 없음 |
| `Pagination` | `app/board/[slug]/page.tsx` | `lib/utils` | 없음 |
| `PostActions` | `app/board/[slug]/[postId]/page.tsx` | `lib/community/board-meta`, `lib/community/board-queries` | 없음 |
| `PostVoteButtons` | `app/board/[slug]/[postId]/page.tsx` | `lib/community/board-queries` | 없음 |
| `SidebarWidget` | `app/coin/[symbol]/page.tsx`, `app/news/page.tsx` | `lib/utils` | 없음 |

#### Community 사이드바 위젯 (`components/community/widgets/`)

| 위젯 | 사용 컴포넌트 | lib 의존성 |
|------|---------------|------------|
| `FngGaugeWidget` | `BoardSidebar` | `lib/utils` (데이터: `/api/fng`) |
| `HotIssueWidget` | `BoardSidebar` | `lib/utils` (데이터: `/api/coins/hot-issues`) |
| `OfficialPostsWidget` | `BoardSidebar` | 없음 |
| `PriceTickerWidget` | `BoardSidebar` | `lib/utils` (데이터: `/api/coins/ticker`) |
| `ToolsShortcutWidget` | `BoardSidebar` | 없음 |

### Chart

| 컴포넌트 | 사용 페이지 | lib 의존성 | 컴포넌트 의존성 |
|----------|-----------|------------|----------------|
| `CryptoChart` | 현재 미사용 (주석 처리됨) | `lib/api/binance`, `lib/indicators` | 없음 |
| `StockChart` | `app/stock/page.tsx` | `lib/indicators` | 없음 |
| `Ticker` | `app/analysis/page.tsx` | `lib/api/binance` | 없음 |
| `StockTicker` | `app/stock/page.tsx` | `lib/api/twelvedata` | 없음 |

### Market

| 컴포넌트 | 사용 페이지 | lib 의존성 | 컴포넌트 의존성 |
|----------|-----------|------------|----------------|
| `KimchiPremium` | `app/market/page.tsx` | `context/LanguageContext` | 없음 |
| `RSIHeatmap` | `app/market/page.tsx` | `context/LanguageContext`, `lib/indicators` | 없음 |

### Stock

| 컴포넌트 | 사용 페이지 | lib 의존성 | 컴포넌트 의존성 |
|----------|-----------|------------|----------------|
| `StockSectorPerformance` | 현재 미사용 (페이지에서 import 없음) | `context/LanguageContext`, `lib/indicators` | 없음 |
| `StockRSIHeatmap` | `app/stock-market/page.tsx` | `context/LanguageContext`, `lib/indicators`, `lib/constants` | 없음 |
| `StockAnalysisPanel` | `app/stock/page.tsx` | `lib/analysis/orchestrator`, `lib/analysis/signals`, `lib/analysis/aggregation`, `lib/backtest/engine` | 없음 |
| `InvestmentQuotes` | `app/page.tsx`, `app/analysis/page.tsx`, `app/stock/page.tsx`, `app/stock-market/page.tsx` | `context/LanguageContext`, `lib/quotes` | 없음 |

### Signal

| 컴포넌트 | 사용 페이지 | lib 의존성 | 컴포넌트 의존성 |
|----------|-----------|------------|----------------|
| `WhaleAlert` | `app/signal/page.tsx` | `context/LanguageContext` | 없음 |

### SecureMemo

| 컴포넌트 | 사용 페이지 | lib 의존성 | 컴포넌트 의존성 |
|----------|-----------|------------|----------------|
| `MemoCard` | `app/secure-memo/page.tsx` | 없음 (lucide-react, framer-motion만 사용) | 없음 |
| `MemoCreateModal` | `app/secure-memo/page.tsx` | `lib/crypto/memo-encryption`, `lib/supabase/client` | 없음 |
| `MemoUnlockModal` | `app/secure-memo/page.tsx` | `lib/crypto/memo-encryption` | 없음 |
| `MemoViewModal` | `app/secure-memo/page.tsx` | `lib/crypto/memo-encryption`, `lib/supabase/client` | 없음 |

### Blog

| 컴포넌트 | 사용 페이지 | lib 의존성 | 컴포넌트 의존성 |
|----------|-----------|------------|----------------|
| `BlogPageClient` | `app/blog/page.tsx` (서버) | `context/LanguageContext`, `lib/translations` | `BlogPostList`, `BlogCategoryFilter`, `BlogSearchBar`, `BlogSidebar` |
| `CategoryPageClient` | `app/blog/category/[category]/page.tsx` (서버) | `context/LanguageContext`, `lib/translations` | `BlogPostList` |
| `TagPageClient` | `app/blog/tag/[tag]/page.tsx` (서버) | `context/LanguageContext`, `lib/translations` | `BlogPostList` |
| `BlogPostCard` | `BlogPageClient` | `context/LanguageContext` | 없음 |
| `BlogPostList` | `BlogPageClient`, `CategoryPageClient`, `TagPageClient` | `context/LanguageContext` | `BlogPostCard` |
| `BlogPostContent` | `app/blog/[slug]/BlogPostDetail.tsx`, `BlogEditor` (미리보기) | `lib/blog-html-utils` | 없음 |
| `BlogCategoryFilter` | `BlogPageClient` | `context/LanguageContext` | 없음 |
| `BlogTagBadge` | `app/blog/[slug]/BlogPostDetail.tsx` | 없음 | 없음 |
| `BlogSearchBar` | `BlogPageClient` | `context/LanguageContext` | 없음 |
| `BlogSidebar` | `BlogPageClient` | `context/LanguageContext` | 없음 |
| `BlogRelatedPosts` | `app/blog/[slug]/BlogPostDetail.tsx` | `context/LanguageContext` | 없음 |
| `BlogShareButtons` | `app/blog/[slug]/BlogPostDetail.tsx` | `context/LanguageContext` | 없음 |
| `BlogTableOfContents` | `app/blog/[slug]/BlogPostDetail.tsx` | `context/LanguageContext`, `lib/blog-html-utils` | 없음 |
| `BlogComments` | `app/blog/[slug]/BlogPostDetail.tsx` | `context/LanguageContext` | 없음 (Giscus 외부 스크립트) |

### SEO

| 컴포넌트 | 사용 페이지 | lib 의존성 | 컴포넌트 의존성 |
|----------|-----------|------------|----------------|
| `JsonLd` | `app/layout.tsx`, `app/blog/[slug]/page.tsx` | `lib/seo/json-ld` | 없음 |

### Blog Editor

| 컴포넌트 | 사용 페이지 | lib 의존성 | 컴포넌트 의존성 |
|----------|-----------|------------|----------------|
| `BlogEditor` | `app/admin/blog/new/`, `app/admin/blog/edit/` | `lib/blog-editor-extensions`, `@tiptap/react` | `EditorToolbar`, `EditorImageUpload`, `BlogPostContent` (미리보기 모드) |
| `EditorToolbar` | `BlogEditor` | `@tiptap/react` | `ColorPicker` |
| `EditorImageUpload` | `BlogEditor` | `@tiptap/react` | 없음 |
| `ColorPicker` | `EditorToolbar` | 없음 | 없음 |
| `useAutoSave` (훅) | `app/admin/blog/new/`, `app/admin/blog/edit/` | 없음 (localStorage) | 없음 |

### Common

| 컴포넌트 | 사용 페이지 | lib 의존성 | 컴포넌트 의존성 |
|----------|-----------|------------|----------------|
| `Disclaimer` | `app/analysis/page.tsx`, `app/market/page.tsx`, `app/stock/page.tsx` | `context/LanguageContext` | 없음 |

### UI (shadcn/ui 기반)

| 컴포넌트 | 사용 위치 | lib 의존성 | 컴포넌트 의존성 |
|----------|----------|------------|----------------|
| `Badge` | `PremiumLock`, `InsufficientData`, `app/analysis/[symbol]/page.tsx` | `lib/utils` | 없음 |
| `Button` | `PremiumLock`, `InsufficientData`, `app/analysis/[symbol]/page.tsx` | `lib/utils` | 없음 |
| `Card` (Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription) | `PremiumLock`, `InsufficientData`, `app/analysis/[symbol]/page.tsx` | `lib/utils` | 없음 |
| `Label` | `PremiumLock`, `InsufficientData`, `app/analysis/[symbol]/page.tsx` | `lib/utils` | 없음 |
| `Separator` | `app/analysis/[symbol]/page.tsx` | `lib/utils` | 없음 |

### Hooks

| 훅 | 사용 위치 | lib 의존성 |
|----|----------|------------|
| `useSubscription` | 현재 미사용 (구현만 존재) | `lib/supabase/client` (TODO) |

### 루트 레벨 컴포넌트

| 컴포넌트 | 사용 페이지 | lib 의존성 | 컴포넌트 의존성 |
|----------|-----------|------------|----------------|
| `AuthButton` | `global-header` (-> `app/layout.tsx`) | `lib/supabase/client` | 없음 |
| `PremiumLock` | `Analysis/StockPanel` | `lib/utils` | `ui/card`, `ui/badge`, `ui/button`, `ui/label` |
| `ErrorState` | 현재 미사용 (페이지에서 import 없음) | 없음 (lucide-react만 사용) | 없음 |
| `InsufficientData` | 현재 미사용 (페이지에서 import 없음) | 없음 | `ui/card`, `ui/badge`, `ui/button`, `ui/label` |
| `hero-section` | `app/page.tsx` | `context/LanguageContext`, `lib/translations` | `hero-chart`, `news-rotator` |
| `hero-chart` | `hero-section` | `lib/api/binance` | 없음 |
| `footer-section` | `app/page.tsx` | 없음 (lucide-react만 사용) | 없음 |
| `global-header` | `app/layout.tsx` (전역) | `context/LanguageContext`, `lib/translations` | `AuthButton` |
| `news-rotator` | `hero-section` | `context/LanguageContext` | 없음 |
| `DetailedChart` | `app/analysis/page.tsx`, `app/analysis/[symbol]/page.tsx` | 없음 (lightweight-charts만 사용) | 없음 |
| `TradeModal` | `app/portfolio/page.tsx` | `lib/supabase/client`, `lib/constants` | 없음 |

> **세션 34(R8, 2026-05-25)**: `about-section`·`dashboard-grid`·`LanguageSwitcher` 3종 **삭제**(import 0건 dead code — v2.0 커뮤니티 피벗 후 구 다크 랜딩 잔재). 홈은 커뮤니티 SSR로 재구축되어 미사용, 언어 전환은 `global-header` 내장 토글로 대체됨.

---

## 페이지별 컴포넌트 사용 요약

| 페이지 | 사용 컴포넌트 |
|--------|-------------|
| `app/page.tsx` (홈) | 커뮤니티 SSR로 재구축 (베스트30·뉴스·게시판·코인룸·사이드바). 구 `hero-section`/`footer-section` 등 잔재 일부 존재 여부는 재감사 필요 |
| `app/layout.tsx` (전역 레이아웃) | `global-header` -> `AuthButton` |
| `app/analysis/page.tsx` | `DetailedChart`, `Ticker`, `AnalysisPanel`, `ChartAnalysisPanel`, `InvestmentQuotes`, `Disclaimer` |
| `app/analysis/[symbol]/page.tsx` | `DetailedChart`, `Card`, `Badge`, `Button`, `Separator`, `Label` |
| `app/analysis/stock/[symbol]/page.tsx` | `StockPanel` -> `PremiumLock` |
| `app/stock/page.tsx` | `StockTicker`, `StockChart`, `StockAnalysisPanel`, `ChartAnalysisPanel`, `InvestmentQuotes`, `Disclaimer` |
| `app/stock-market/page.tsx` | `InvestmentQuotes`, `StockRSIHeatmap` |
| `app/market/page.tsx` | `KimchiPremium`, `RSIHeatmap`, `Disclaimer` |
| `app/signal/page.tsx` | `WhaleAlert` |
| `app/portfolio/page.tsx` | `TradeModal` |
| `app/secure-memo/page.tsx` | `MemoCard`, `MemoCreateModal`, `MemoUnlockModal`, `MemoViewModal` |
| `app/blog/page.tsx` | `BlogPageClient` → `BlogPostList`, `BlogCategoryFilter`, `BlogSearchBar`, `BlogSidebar` |
| `app/blog/[slug]/page.tsx` | `JsonLd`, `BlogPostDetail` → `BlogPostContent`, `BlogTagBadge`, `BlogShareButtons`, `BlogRelatedPosts`, `BlogTableOfContents` |
| `app/blog/category/[category]/page.tsx` | `CategoryPageClient` → `BlogPostList` |
| `app/blog/tag/[tag]/page.tsx` | `TagPageClient` → `BlogPostList` |
| `app/admin/blog/page.tsx` | 없음 (독립 구현) |
| `app/admin/blog/new/page.tsx` | `BlogEditor` |
| `app/admin/blog/edit/[id]/page.tsx` | `BlogEditor` |

---

## 의존 관계 다이어그램 (텍스트)

```
app/layout.tsx
  └── global-header
        └── AuthButton
              └── lib/supabase/client

app/page.tsx (홈)
  ├── hero-section
  │     ├── hero-chart ─── lib/api/binance
  │     └── news-rotator ── context/LanguageContext
  ├── footer-section
  └── InvestmentQuotes ── lib/quotes, context/LanguageContext

app/analysis/page.tsx
  ├── Ticker ─── lib/api/binance
  ├── DetailedChart
  ├── AnalysisPanel ─── lib/analysis/orchestrator, lib/analysis/signals,
  │                     lib/analysis/aggregation, lib/backtest/engine
  ├── ChartAnalysisPanel ── lib/analysis/aggregation, lib/analysis/signals, lib/indicators
  ├── InvestmentQuotes
  └── Disclaimer ── context/LanguageContext

app/stock/page.tsx
  ├── StockTicker ── lib/api/twelvedata
  ├── StockChart ── lib/indicators
  ├── StockAnalysisPanel ── lib/analysis/orchestrator, lib/analysis/signals,
  │                         lib/analysis/aggregation, lib/backtest/engine
  ├── ChartAnalysisPanel
  ├── InvestmentQuotes
  └── Disclaimer

app/market/page.tsx
  ├── KimchiPremium ── context/LanguageContext
  ├── RSIHeatmap ── context/LanguageContext, lib/indicators
  └── Disclaimer

app/stock-market/page.tsx
  ├── InvestmentQuotes
  └── StockRSIHeatmap ── context/LanguageContext, lib/indicators, lib/constants

app/signal/page.tsx
  └── WhaleAlert ── context/LanguageContext

app/portfolio/page.tsx
  └── TradeModal ── lib/supabase/client, lib/constants

app/secure-memo/page.tsx
  ├── MemoCard
  ├── MemoCreateModal ── lib/crypto/memo-encryption, lib/supabase/client
  ├── MemoUnlockModal ── lib/crypto/memo-encryption
  └── MemoViewModal ── lib/crypto/memo-encryption, lib/supabase/client

Analysis/StockPanel (app/analysis/stock/[symbol])
  └── PremiumLock
        ├── ui/card
        ├── ui/badge
        ├── ui/button
        └── ui/label
```

---

## 미사용 컴포넌트 (Dead Code 후보)

| 컴포넌트 | 상태 |
|----------|------|
| `Chart/CryptoChart` | 주석 처리됨 (analysis 페이지에서 REMOVED for SSOT) |
| `Analysis/TradingStrategyGuide` | 주석 처리됨 (AnalysisPanel에서 import 제거) |
| `Stock/StockSectorPerformance` | 어떤 페이지에서도 import 되지 않음 |
| `ErrorState` | 어떤 페이지에서도 import 되지 않음 |
| `InsufficientData` | 어떤 페이지에서도 import 안 됨. 단 재사용 UI 프리미티브로 **보존**(세션 34 R8에서 라이트화) |
| `hooks/useSubscription` | 어떤 컴포넌트에서도 import 되지 않음 |

> 세션 34(R8): `about-section`·`dashboard-grid`·`LanguageSwitcher`는 dead code로 **삭제 완료**(더 이상 후보 아님).
