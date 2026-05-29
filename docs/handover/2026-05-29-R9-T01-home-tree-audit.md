# 인수인계서 — R9 / T01 (홈 컴포넌트 트리 재감사 + dead 컴포넌트 삭제)

> 작성일: 2026-05-29
> 라운드: R9 (tree-reconcile, Wave 1) · 터미널: T01 / 3
> 인덱스: [_INDEX.md](../orchestration/2026-05-29-R9-tree-reconcile/_INDEX.md)
> 지시서: [T01-home-tree-audit.md](../orchestration/2026-05-29-R9-tree-reconcile/T01-home-tree-audit.md)
> 직전 맥락: [session34-r8-page-lightify](./2026-05-25-session34-r8-page-lightify.md)

---

## 작업 요약

`app/page.tsx` 홈 트리를 전수 재감사하여 **실제 렌더 트리 9종**을 확정하고, `components/` 루트 11파일의 사용처를 grep + import 추적으로 전수 스캔했다. 그 결과 구 다크 랜딩 잔재 **3종(`hero-section`·`hero-chart`·`news-rotator`)이 닫힌 dead 의존 트리**임을 확정하여 `git rm` 삭제. `tsc` 0 에러·`npm run build` green·잔존 import 0·`footer-section` 보존 확인 완료.

---

## Phase 1 — 확정 홈 트리 맵 (T03 입력)

`app/page.tsx`(SSR, `revalidate=300`)가 **실제로 import + JSX 렌더**하는 컴포넌트. R8 cs가 인계한 "레퍼런스 홈 항목 stale" 문제의 정답 트리다. (지휘부 사전 검증 9종과 일치 — 누락/추가 없음 본인 재확인 완료.)

| 컴포넌트 | 경로 | 역할 | JSX 위치 |
|---|---|---|---|
| `BoardRow` | `components/community/BoardRow.tsx` | 베스트/게시판 행 | page.tsx:185 |
| `BoardTableHeader` | `components/community/BoardRow.tsx` (동일 모듈 named) | 게시판 표 헤더 | page.tsx:181 |
| `NewsRow` | `components/community/NewsRow.tsx` | 최신 뉴스 행 | page.tsx:210 |
| `NewsHeadlineItem` (type) | `components/community/NewsHeadlineCard.tsx` | **타입 전용 import** (`toNewsItem` 반환형) | — (런타임 미사용) |
| `PriceTickerWidget` | `components/community/widgets/PriceTickerWidget.tsx` | 사이드바 시세 위젯 | page.tsx:316 |
| `HotIssueWidget` | `components/community/widgets/HotIssueWidget.tsx` | 사이드바 핫이슈 | page.tsx:317 |
| `FngGaugeWidget` | `components/community/widgets/FngGaugeWidget.tsx` | 공포·탐욕 게이지 | page.tsx:318 |
| `OfficialPostsWidget` | `components/community/widgets/OfficialPostsWidget.tsx` | 공식 게시물 | page.tsx:319 |
| `ToolsShortcutWidget` | `components/community/widgets/ToolsShortcutWidget.tsx` | 도구 바로가기 | page.tsx:320 |
| `FooterSection` | `components/footer-section.tsx` | 푸터 (6페이지 공용) | page.tsx:324 |

> 비고: 시세 스트립·게시판 미리보기(3컬럼)·코인룸 카드 섹션은 page.tsx 내부에서 `next/link`로 직접 렌더(별도 컴포넌트 아님). `lib/community/queries.ts`의 `fetchMainPageData`로 데이터 공급.

---

## Phase 2 — `components/` 루트 11파일 dead 전수 스캔

각 파일을 컴포넌트명 + 파일 basename으로 `.ts/.tsx/.js/.jsx` 전 범위 grep + import 추적. (주석처리된 import는 사용처로 집계하지 않음.)

| 파일 | export | 코드 사용처 | 판정 |
|---|---|---|---|
| `AuthButton.tsx` | `AuthButton` | `global-header.tsx:8,146` | **살아있음** |
| `DetailedChart.tsx` | `DetailedChart` | `app/analysis/page.tsx`, `app/analysis/[symbol]/page.tsx` | **살아있음** |
| `ErrorState.tsx` | `ErrorState` | 0건 | **보존**(재사용 프리미티브) |
| `footer-section.tsx` | `FooterSection` | 6페이지 (`page`·`board/[slug]`·`board/[slug]/write`·`board/[slug]/[postId]`·`coin/[symbol]`·`news`) | **살아있음(삭제 금지)** |
| `global-header.tsx` | `GlobalHeader` | `app/layout.tsx:5,47` | **살아있음** |
| `hero-chart.tsx` | `HeroChart` | `hero-section.tsx`에서만 | **dead(연쇄) → 삭제** |
| `hero-section.tsx` | `HeroSection` (default) | **자기 파일 외 0건** | **dead → 삭제** |
| `InsufficientData.tsx` | `InsufficientData` | 0건 | **보존**(재사용 프리미티브 — R8 선례) |
| `news-rotator.tsx` | `NewsRotator` | `hero-section.tsx`에서만 | **dead(연쇄) → 삭제** |
| `PremiumLock.tsx` | `PremiumLock` | `Analysis/StockPanel.tsx:8,175` | **살아있음** |
| `TradeModal.tsx` | `TradeModal` | `app/portfolio/page.tsx:6,358` | **살아있음** |

> `Stock/StockAnalysisPanel.tsx:6`·`Analysis/AnalysisPanel.tsx:10`의 `PremiumLock`은 **주석처리된 import**("Backtest now free")라 사용처 아님 — 살아있는 사용처는 `Analysis/StockPanel.tsx` 단 1곳.

---

## 삭제한 dead 목록 (git rm — 3종)

구 다크 랜딩(`HeroSection` 루트, `mode="dark"` 기본값) 트리. v2.0 커뮤니티 SSR 피벗 후 `app/page.tsx`가 이 트리를 더 이상 사용하지 않으며, **세 파일이 서로 닫힌 의존 트리**를 이뤄 외부 사용처가 0이다.

| # | 파일 | 사용처 0 근거 |
|---|---|---|
| 1 | `components/hero-section.tsx` | `grep "hero-section\|HeroSection" --*.{ts,tsx,js,jsx}` → 코드 사용처는 자기 파일 정의(L12·L16)뿐. `app/page.tsx`는 import하지 않음(`_COMPONENT_MAP`의 "app/page.tsx 사용" 표기는 stale). |
| 2 | `components/hero-chart.tsx` | `HeroChart` 코드 사용처 = `hero-section.tsx:7,72` **단독**. hero-section 삭제 시 import 0. 단일 export(`HeroChart`)뿐 — 타 모듈 재사용 유틸 없음. |
| 3 | `components/news-rotator.tsx` | `NewsRotator` 코드 사용처 = `hero-section.tsx:10,83` **단독**. hero-section 삭제 시 import 0. 단일 export(`NewsRotator`)뿐. 내부 `fetchNews`는 파일 로컬 함수(R4 handover 기확인 — 별개). |

**연쇄 삭제 판단 근거**: 지시서는 "`hero-chart`·`news-rotator`는 사용처 확인 후 판정 — analysis/signal/coin 등에서 쓰일 수 있으니 신중"이라 했다. 전 범위 grep 결과 둘 다 **`hero-section`에서만** 쓰이고 다른 라우트(analysis/signal/coin/portfolio 등) 사용 0건임을 확정했다. hero-section을 제거하면 둘은 import 0의 진짜 dead가 되므로, 닫힌 트리 전체를 한 라운드에서 정리(R3 stale-snapshot 규칙 위반 아님 — 사용처를 확정 후 트리 단위 삭제).

> docs 내 `hero-chart` 다수 매치(R2/R6/R7 차트 라이트화 기록 등)는 **전부 과거 라운드 문서**이며 코드 사용처가 아님. 범용 차트는 `components/Chart/{CryptoChart,StockChart}.tsx`·`components/DetailedChart.tsx`가 별도 담당 → hero-chart는 랜딩 전용이라 재사용 프리미티브 아님.

---

## 보존 결정 목록 (미사용이나 보존)

| 파일 | 사유 |
|---|---|
| `components/ErrorState.tsx` | 코드 import 0건이나 **에러 표시 공통 UI 프리미티브**. 지시서 §4가 `InsufficientData`와 함께 명시 보존 지목. 향후 페이지 에러 핸들링 재사용 가능. |
| `components/InsufficientData.tsx` | 코드 import 0건이나 **데이터 부족 표시 재사용 프리미티브**. R8(세션 34)에서도 동일 사유로 보존(라이트화만 적용)한 선례. |

---

## 불확실로 보류한 후보

- **없음.** 삭제 3종은 닫힌 트리 + 외부 사용처 0 확정, 보존 2종은 명시적 재사용 프리미티브로 판정이 모두 확정됨.

---

## 검증 결과

```
npx tsc --noEmit                  → exit 0 (에러 없음)
npm run build                     → exit 0 (green, 전 라우트 정상 생성, dangling import 0)
grep hero-section|hero-chart|news-rotator (전 코드 .ts/.tsx/.js/.jsx) → No matches found (잔존 import 0)
test -f components/footer-section.tsx → EXISTS (보존 OK, 삭제 안 함)
```

- `tsc` **0 에러** — 삭제로 인한 타입 깨짐 없음.
- `build` **green** — 모든 라우트 정상, dead 삭제 후 dangling import 0.
- 삭제 3종의 코드 잔존 참조 **0건**(docs 매치는 과거 라운드 문서뿐).
- `footer-section.tsx` **존재 확인** — 6페이지 사용 중이라 삭제하지 않음.

---

## T03(레퍼런스 정합) 입력 요약

T03이 `docs/references/_COMPONENT_MAP.md`·`_WEB_CONTRACT.md`를 정합할 때 반영할 변경:

1. **삭제된 컴포넌트 항목 제거**: `hero-section`·`hero-chart`·`news-rotator` 3종을 레지스트리/트리/R-001에서 제거.
   - `_COMPONENT_MAP.md`: L125(`hero-section`)·L126(`hero-chart`)·L129(`news-rotator`)·L141(홈 항목의 "구 hero-section 잔재" 표기)·L171~173(트리 다이어그램의 hero-section/hero-chart/news-rotator 노드).
   - `_WEB_CONTRACT.md`: L146(`HeroSection` 레지스트리)·L175(R-001 `HeroSection`).
2. **홈 항목 stale 정정**: `app/page.tsx` 홈 트리를 위 **Phase 1 확정 트리 맵 9종**으로 갱신(기존 "hero-section 사용" 표기는 오류).
3. `ErrorState`·`InsufficientData`는 미사용이나 보존이므로 dead-code 표가 아닌 "보존 프리미티브"로 유지.

---

## 격리/안티패턴 준수

- ✅ 쓰기 영역(`app/page.tsx` 읽기 전용 감사 + `components/` 루트 dead 삭제)만 변경. `git status`상 staged 변경은 dead 3종 삭제뿐.
- ✅ `components/global-header.tsx` 미수정 (T02 전담 — git status의 `M`은 T02 작업).
- ✅ `docs/references/` 미수정 (T03 전담 — 본 handover에만 기록).
- ✅ `footer-section.tsx` 미삭제.
- ✅ 사용처 확정 후에만 삭제 (R3 stale-snapshot 재발 방지).

---
[← _INDEX.md](../orchestration/2026-05-29-R9-tree-reconcile/_INDEX.md)
