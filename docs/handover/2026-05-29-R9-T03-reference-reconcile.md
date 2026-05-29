# 인수인계서 — R9 / T03 (레퍼런스 전수 정합 · _COMPONENT_MAP · _WEB_CONTRACT)

> 작성일: 2026-05-29
> 라운드: R9 (tree-reconcile, Wave 2) · 터미널: T03 / 3
> 인덱스: [_INDEX.md](../orchestration/2026-05-29-R9-tree-reconcile/_INDEX.md)
> 지시서: [T03-reference-reconcile.md](../orchestration/2026-05-29-R9-tree-reconcile/T03-reference-reconcile.md)
> 핵심 입력: [R9-T01 home-tree-audit](./2026-05-29-R9-T01-home-tree-audit.md) · [R9-T02 history-menu](./2026-05-29-R9-T02-history-menu.md)

---

## 작업 요약

R8(세션 34)이 "`_COMPONENT_MAP`/`_WEB_CONTRACT`의 홈 항목 stale"을 부분 정정 후 R9로 인계한 건을 **완결**했다. T01의 dead 3종 삭제 + T02의 `/history` 메뉴 정합을 확정 입력으로 받아, 두 레퍼런스를 **현 코드(워킹트리)를 직접 근거로** 전수 정합했다. 쓰기 영역(`docs/references/` 2파일)만 변경했고, `tsc`/build 무관(문서 전용). 삭제 컴포넌트 살아있는 레지스트리/트리/매핑 0 언급(맥락 노트만 잔존), 살아있는 컴포넌트 전수 실존 확인 완료.

> **발사 시점 상태(lazy)**: Wave1(T01+T02)이 아직 git 커밋 전이었으나, 워킹트리에 T01 삭제(`D hero-section·hero-chart·news-rotator`) + T02 변경(`M global-header.tsx`)이 이미 반영된 상태였다. 지시서 §2가 허용한 "현 코드 직접 스캔"으로 진행 → 정합 정확성 유지. 통합 cs(지휘자)가 Wave1·Wave2를 함께 마감하면 정합 완료.

---

## 정합한 항목 — `_COMPONENT_MAP.md`

| # | 위치 | 변경 | 근거 |
|---|------|------|------|
| 1 | 헤더(L3) | 최종 업데이트 `2026-03-08` → `2026-05-29 (R9-T03 정합)` | — |
| 2 | 루트 레벨 컴포넌트 표 | `hero-section`·`hero-chart`·`news-rotator` **3행 제거** | T01 dead 삭제 (`git rm`) |
| 3 | 루트 레벨 컴포넌트 표 | `footer-section` 사용처 `app/page.tsx` → **6페이지 공용**(page·board/[slug]·board/[slug]/write·board/[slug]/[postId]·coin/[symbol]·news) | T01 Phase2 |
| 4 | R8 노트 아래 | **R9-T01 삭제 노트 추가**(닫힌 dead 트리 3종 삭제 경위) | T01 handover |
| 5 | InvestmentQuotes 행 | 사용처에서 **`app/page.tsx` 제거**(analysis·stock·stock-market만 유지) | `app/page.tsx` import 실측(미import) |
| 6 | 페이지별 요약 — 홈 행 | "잔재 재감사 필요" → **T01 확정 9종 트리**로 명시(+`NewsHeadlineItem` 타입 전용, next/link 직접 렌더 섹션, `fetchMainPageData` 데이터) | T01 Phase1 + `app/page.tsx` import |
| 7 | 의존 관계 다이어그램 — 홈 | `hero-section→hero-chart/news-rotator` 트리 → **커뮤니티 SSR 9종 트리**(BoardRow·NewsRow·5위젯·footer-section) | T01 Phase1 + import |

## 정합한 항목 — `_WEB_CONTRACT.md`

| # | 위치 | 변경 | 근거 |
|---|------|------|------|
| 1 | 헤더(L5) | 최종 갱신 `2026-03-08`→`2026-05-29`, 계약 버전 `3`→`4` | — |
| 2 | R-001 라우트 행 | 페이지명 `랜딩` → **`홈(커뮤니티)`** | v2.0 SSR 피벗 |
| 3 | §3-1 GNB 구조 | **4그룹(코인/주식/정보/서비스) 표 전면 교체** → 실코드 구조: 1차 링크 5 + 코인룸 드롭다운 6 + 도구 드롭다운 8 | `global-header.tsx` `primary`/`coinRoom`/`tools` 배열 + `translations.ts` 라벨 실측 |
| 4 | §3-1 도구 드롭다운 | `/history`(코인 역사) **#6 포함**(R9-T02 추가 표기) | T02 + `global-header.tsx:72` |
| 5 | §3-1 고정 요소 | 검색 버튼·글쓰기(`/board/free/write`) 버튼 **추가**, 로고/언어/Auth 유지 | `global-header.tsx` 우측 영역 실측 |
| 6 | §5 공유 컴포넌트 | `HeroSection` 행 **제거** | T01 dead 삭제 |
| 7 | §5 공유 컴포넌트 | `FooterSection` 사용처 `랜딩` → **6페이지 공용** | T01 Phase2 |
| 8 | §5 공유 컴포넌트 | `InvestmentQuotes` 사용처 `랜딩, /stock, /stock-market` → **`/analysis, /stock, /stock-market`** | `app/page.tsx` 미import |
| 9 | §7 컴포넌트 매핑 R-001 | `HeroSection`(+InvestmentQuotes) → **커뮤니티 SSR 7컴포넌트**, 공유=GlobalHeader·FooterSection | T01 Phase1 + import |
| 10 | §9 변경 이력 | **v4(reconcile) 행 추가** | — |

---

## T01/T02 입력 반영 내역

- **T01(dead 삭제 3종)**: `hero-section`·`hero-chart`·`news-rotator`를 양 레퍼런스의 모든 **살아있는** 레지스트리/트리/매핑에서 제거. 삭제 경위는 맥락 노트(변경 이력)에만 보존.
- **T01(확정 홈 트리 9종)**: `_COMPONENT_MAP` 페이지별 요약·의존 다이어그램, `_WEB_CONTRACT` R-001 매핑을 9종(BoardTableHeader·BoardRow·NewsRow·PriceTickerWidget·HotIssueWidget·FngGaugeWidget·OfficialPostsWidget·ToolsShortcutWidget·FooterSection +`NewsHeadlineItem` 타입)으로 갱신.
- **T01(보존 프리미티브)**: `ErrorState`·`InsufficientData`는 기존대로 "미사용이나 보존" 표기 유지(dead 표로 강등하지 않음).
- **T02(`/history` 메뉴)**: 실코드상 `/history`는 "정보 그룹"이 아니라 **도구 드롭다운 #6**임을 확인 → GNB를 실구조로 재작성하며 정위치 반영. 라우트 수 불변(R-014 `/history` 활성 유지).

## 추가 코드 근거 발견(추측 아님)

- `app/page.tsx` import 실측 결과 **`InvestmentQuotes` 미사용** → 양 레퍼런스의 "랜딩/홈에서 InvestmentQuotes" 표기를 stale로 판정·제거(analysis·stock·stock-market 사용처는 evidence 없어 유지).
- `_WEB_CONTRACT` GNB가 v2.0 피벗 전 4그룹 구조로 **전면 stale**임을 발견 → `global-header.tsx`(primary 5 / coinRoom 6 / tools 8) + `translations.ts` ko 라벨로 전수 재작성.

---

## 교차 검증 결과

```
[1] grep 'hero-section|hero-chart|news-rotator|HeroSection|HeroChart|NewsRotator|about-section|dashboard-grid|LanguageSwitcher'
    → 4건 매치 = 전부 맥락/변경이력 노트(R8 노트·R9-T01 삭제 노트·R8 dead 노트·v4 이력). 살아있는 레지스트리/트리/매핑 0건. (지시서 "0건 목표(맥락 설명 제외)" 충족)
[2] 삭제 파일 (False 기대): hero-section.tsx·hero-chart.tsx·news-rotator.tsx → 전부 '없음' (OK)
[3] 홈 트리 9 + global-header (EXISTS 기대): footer-section, community/BoardRow, NewsRow, NewsHeadlineCard,
    widgets/{PriceTicker,HotIssue,FngGauge,OfficialPosts,ToolsShortcut}, global-header → 전부 EXISTS (OK)
[4] GNB 동적 라우트 (EXISTS 기대): coin/[symbol], board/[slug], board/[slug]/write, history, news → 전부 EXISTS (OK)
[5] git status: 변경 = docs/references/_COMPONENT_MAP.md·_WEB_CONTRACT.md 단 2파일(M) — 격리 준수
```

---

## 잔여 stale (다음 라운드 후보 — 내 확정 입력 밖이라 미수정)

> 아래는 T03 범위(홈 트리 + `/history` 메뉴 정합) 밖이며, 라우트/링크 전수 감사 입력이 없어 **임의 수정 금지(추측 금지)** 원칙상 미반영. 별도 라운드 권장.

1. **`_WEB_CONTRACT` 라우트 레지스트리 커뮤니티 라우트 누락**: `/board/[slug]`·`/board/[slug]/write`·`/board/[slug]/[postId]`·`/coin/[symbol]`(BTC/ETH/XRP/SOL/altcoin/kimp) 등 v2.0 신규 라우트가 R-001~R-030에 **미등록**. T02가 언급한 "정적 54개"와 레지스트리 30행 괴리.
2. **§8 연결성 검증 카운트 stale**: "등록 라우트 23개 / 활성 19개"(최종 검증일 2026-02-20)가 레지스트리 실제 30행과 불일치.
3. **라우트 레지스트리 진입점 표기 stale**: `/blog`(R-024 "GNB>정보>블로그")·`/contact`·`/terms`·`/settings`는 실제 GNB(primary/coinRoom/tools)에 **없음** → 진입점 컬럼이 과거 4그룹 기준. /blog는 현재 GNB·Footer 어디에도 진입점 없어 고아 가능성.
4. **Footer 정합 미검증**: `footer-section.tsx` 실제 내용은 본 라운드에서 미열람(T02가 footer 미변경) — Footer 레지스트리(§3-3)는 그대로 둠. 다음 라운드에서 실코드 대조 권장.

---

## 격리/안티패턴 준수

- ✅ `docs/references/` 2파일만 수정(`git status` M = _COMPONENT_MAP·_WEB_CONTRACT). 코드/타 문서 미접촉.
- ✅ 코드/T01·T02 handover 근거로만 정합 — 추측 0(R3 stale 교훈).
- ✅ `_COMPONENT_MAP` ↔ `_WEB_CONTRACT` 상호 정합(홈 트리·삭제분·InvestmentQuotes 양쪽 일치).
- ✅ 한국어 주석/노트/handover.
- ✅ 확정 입력(T01 삭제 + T02 메뉴) 반영 — 범위 밖 stale은 미수정·플래그만.

---
[← _INDEX.md](../orchestration/2026-05-29-R9-tree-reconcile/_INDEX.md)
