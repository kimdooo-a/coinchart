# Component Map

> 최종 업데이트: 2026-05-29 (R9-T03 레퍼런스 정합)
>
> 각 컴포넌트의 사용 페이지, lib 의존성, 컴포넌트 간 의존 관계를 정리한 문서입니다.

---

## 카테고리별 컴포넌트

### Analysis

| 컴포넌트 | 사용 페이지 | lib 의존성 | 컴포넌트 의존성 |
|----------|-----------|------------|----------------|
| `AnalysisPanel` | `app/analysis/page.tsx` | `lib/analysis/orchestrator`, `lib/analysis/signals`, `lib/analysis/aggregation`, `lib/backtest/engine` | 없음 |
| `ChartAnalysisPanel` | `app/analysis/page.tsx`, `app/stock/page.tsx` | `lib/analysis/aggregation`, `lib/analysis/signals`, `lib/indicators` | 없음 |
| `StockPanel` | `app/analysis/stock/[symbol]/page.tsx` | `lib/supabase/stock`, `lib/analysis/stock-signals`, `lib/analysis/stock` | `PremiumLock` |
| `TradingStrategyGuide` | 현재 미사용 (주석 처리됨) | 없음 | 없음 |

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
| `InvestmentQuotes` | `app/analysis/page.tsx`, `app/stock/page.tsx`, `app/stock-market/page.tsx` | `context/LanguageContext`, `lib/quotes` | 없음 |

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
| `footer-section` | `app/page.tsx`, `board/[slug]`, `board/[slug]/write`, `board/[slug]/[postId]`, `coin/[symbol]`, `news` (6페이지 공용) | 없음 (lucide-react만 사용) | 없음 |
| `global-header` | `app/layout.tsx` (전역) | `context/LanguageContext`, `lib/translations` | `AuthButton` |
| `DetailedChart` | `app/analysis/page.tsx`, `app/analysis/[symbol]/page.tsx` | 없음 (lightweight-charts만 사용) | 없음 |
| `TradeModal` | `app/portfolio/page.tsx` | `lib/supabase/client`, `lib/constants` | 없음 |

> **세션 34(R8, 2026-05-25)**: `about-section`·`dashboard-grid`·`LanguageSwitcher` 3종 **삭제**(import 0건 dead code — v2.0 커뮤니티 피벗 후 구 다크 랜딩 잔재). 홈은 커뮤니티 SSR로 재구축되어 미사용, 언어 전환은 `global-header` 내장 토글로 대체됨.
>
> **R9-T01(2026-05-29)**: 구 다크 랜딩의 닫힌 dead 트리 `hero-section`·`hero-chart`·`news-rotator` 3종 **삭제**(`git rm`). `hero-section`이 `app/page.tsx`에서 미사용(import 0)이고 `hero-chart`·`news-rotator`는 `hero-section`에서만 쓰여 연쇄 dead. 위 레지스트리/요약/다이어그램에서 제거 완료. `app/page.tsx` 홈은 커뮤니티 SSR 9종 트리(아래 요약 참조).

---

## 페이지별 컴포넌트 사용 요약

| 페이지 | 사용 컴포넌트 |
|--------|-------------|
| `app/page.tsx` (홈, SSR `revalidate=300`) | `BoardTableHeader`, `BoardRow`, `NewsRow`, `PriceTickerWidget`, `HotIssueWidget`, `FngGaugeWidget`, `OfficialPostsWidget`, `ToolsShortcutWidget`, `FooterSection` (+ `NewsHeadlineItem` 타입 전용 import). 시세 스트립·게시판 미리보기·코인룸 카드 섹션은 page.tsx 내부 `next/link` 직접 렌더. 데이터는 `lib/community/queries.ts`의 `fetchMainPageData` 공급 |
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

app/page.tsx (홈, SSR revalidate=300) ── lib/community/queries (fetchMainPageData)
  ├── BoardTableHeader · BoardRow ── community/BoardRow
  ├── NewsRow ── community/NewsRow
  ├── PriceTickerWidget ── community/widgets/PriceTickerWidget
  ├── HotIssueWidget ── community/widgets/HotIssueWidget
  ├── FngGaugeWidget ── community/widgets/FngGaugeWidget
  ├── OfficialPostsWidget ── community/widgets/OfficialPostsWidget
  ├── ToolsShortcutWidget ── community/widgets/ToolsShortcutWidget
  └── footer-section
  (시세 스트립·게시판 미리보기·코인룸 카드는 page.tsx 내 next/link 직접 렌더)

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
