# 웹 프로젝트 계약 (_WEB_CONTRACT) v2

> **이 파일은 kdyweb 스킬이 관리하는 단일 진실의 원천입니다.**
> 수동 편집 시 계약 무결성이 깨질 수 있으므로 kdyweb을 통해 갱신하세요.
> 생성일: 2026-02-20 | 최종 갱신: 2026-05-29 (R11-T01 라우트 레지스트리 전수 정합) | 계약 버전: 5

---

## 1. 프로젝트 설정

| 항목 | 값 |
|------|-----|
| 프레임워크 | next-app |
| 라우터 유형 | app-router |
| 인증 라이브러리 | supabase |
| UI 라이브러리 | tailwind + radix-ui (shadcn 스타일) + framer-motion |
| 페이지 디렉토리 | app/ |
| 컴포넌트 디렉토리 | components/ |
| 레이아웃 디렉토리 | app/layout.tsx (단일 RootLayout) |
| 생성 방식 | migrate |

---

## 2. 라우트 레지스트리

> 모든 페이지가 이 테이블에 등록되어야 합니다.
> 진입점이 없는 행은 "고아 페이지"로 verify에서 감지됩니다.

| ID | 경로 | 페이지명 | 유형 | 파일 위치 | 레이아웃 | 인증 | 진입점 | 이동대상 | 동반 파일 | 상태 |
|----|------|---------|------|----------|----------|------|--------|---------|----------|------|
| R-001 | / | 홈(커뮤니티) | static | app/page.tsx | RootLayout | 아니오 | 직접URL, GNB 로고 | /analysis, /market, /signal, /stock, /stock-market, /news, /calendar, /history, /portfolio, /secure-memo, /contact, /terms | meta | ✅ 활성 |
| R-002 | /auth/login | 로그인 | auth | app/auth/login/page.tsx | RootLayout | 아니오 | AuthButton, 미들웨어 리다이렉트 | /(성공), /auth/auth-code-error(실패) | meta | ✅ 활성 |
| R-003 | /auth/auth-code-error | 인증 에러 | error | app/auth/auth-code-error/page.tsx | RootLayout | 아니오 | 인증 실패 시 자동 | /auth/login | - | ✅ 활성 |
| R-004 | /analysis | 코인 분석 | dashboard | app/analysis/page.tsx | RootLayout | 아니오 | GNB(도구>코인 분석) | /analysis/[symbol] | meta | ✅ 활성 |
| R-005 | /analysis/[symbol] | 코인 상세 분석 | detail | app/analysis/[symbol]/page.tsx | RootLayout | 아니오 | /analysis에서 심볼 선택 | /analysis | API(/api/analysis/[symbol]) | ✅ 활성 |
| R-006 | /analysis/stock | 주식 분석 선택 | list | app/analysis/stock/page.tsx | RootLayout | 아니오 | /stock에서 링크 | /analysis/stock/[symbol] | - | ✅ 활성 |
| R-007 | /analysis/stock/[symbol] | 주식 상세 분석 | detail | app/analysis/stock/[symbol]/page.tsx | RootLayout | 아니오 | /analysis/stock에서 심볼 선택 | /analysis/stock | API(/api/analysis/stock/[symbol]) | ✅ 활성 |
| R-008 | /market | 시장 분위기 | dashboard | app/market/page.tsx | RootLayout | 아니오 | GNB(도구>시장 심리) | /analysis | meta | ✅ 활성 |
| R-009 | /signal | AI 시그널 | dashboard | app/signal/page.tsx | RootLayout | 아니오 | GNB(도구>시그널) | /analysis | API(/api/signals) | ✅ 활성 |
| R-010 | /stock | 주식 분석 | dashboard | app/stock/page.tsx | RootLayout | 아니오 | GNB(도구>주식 분석) | /analysis/stock, /analysis/stock/[symbol] | API(/api/stock/*) | ✅ 활성 |
| R-011 | /stock-market | 주식 시장 분위기 | dashboard | app/stock-market/page.tsx | RootLayout | 아니오 | ⚠️ nav 진입점 없음 (v2.0 GNB 피벗으로 '주식' 그룹 제거, 직접 URL만) | /stock | meta | ✅ 활성 |
| R-012 | /news | 뉴스 | list | app/news/page.tsx | RootLayout | 아니오 | GNB(1차>뉴스), Footer(커뮤니티) | 외부 뉴스 링크 | API(/api/news) | ✅ 활성 |
| R-013 | /calendar | 경제 캘린더 | static | app/calendar/page.tsx | RootLayout | 아니오 | GNB(도구>경제 일정) | - | meta | ✅ 활성 |
| R-014 | /history | 코인 히스토리 | static | app/history/page.tsx | RootLayout | 아니오 | GNB(도구>코인 역사) | - | meta | ✅ 활성 |
| R-015 | /portfolio | 포트폴리오 | dashboard | app/portfolio/page.tsx | RootLayout | 예 (미들웨어) | AuthButton(로그인 사용자 메뉴), 미들웨어 리다이렉트 | /auth/login(비인증시) | meta | ✅ 활성 |
| R-016 | /secure-memo | 보안 메모 | dashboard | app/secure-memo/page.tsx | RootLayout | 예 (미들웨어) | GNB(도구>보안 메모) | /auth/login(비인증시) | meta | ✅ 활성 |
| R-017 | /contact | 문의하기 | form | app/contact/page.tsx | RootLayout | 아니오 | Footer(정보) | - | API(/api/contact) | ✅ 활성 |
| R-018 | /terms | 이용약관 | static | app/terms/page.tsx | RootLayout | 아니오 | Footer(정보) | - | meta | ✅ 활성 |
| R-019 | /admin | 관리자 | dashboard | app/admin/page.tsx | RootLayout | 예 (미들웨어) | 직접URL (관리자만) | /auth/login(비인증시) | API(/api/admin/*) | ✅ 활성 |
| R-020 | /settings | 설정 | form | app/settings/page.tsx | RootLayout | 아니오 (R12 익명 우선) | GNB(도구▼>설정, 익명·회원 공통) + AuthButton ⚙️(회원) | /portfolio | meta | ✅ 활성 |
| R-021 | /watchlist | 관심종목 | list | app/watchlist/page.tsx | RootLayout | 아니오 (R12 익명 우선) | GNB(도구>관심종목, 익명·회원 공통) | /analysis | meta | ✅ 활성 |
| R-022 | /privacy | 개인정보처리방침 | static | app/privacy/page.tsx | RootLayout | 아니오 | Footer(정보) | /terms | meta | 🚧 개발중 |
| R-023 | /pricing | 요금제 | static | app/pricing/page.tsx | RootLayout | 아니오 | PremiumLock, /analysis/[symbol] | / | meta | 🚧 개발중 |
| R-024 | /blog | 블로그 목록 | list | app/blog/page.tsx | RootLayout | 아니오 | Footer(커뮤니티>공식글) — `footer-section.tsx:35` (고아 아님) | /blog/[slug] | API(/api/blog) | ✅ 활성 |
| R-025 | /blog/[slug] | 블로그 상세 | detail | app/blog/[slug]/page.tsx | RootLayout | 아니오 | /blog에서 포스트 선택 | /blog | API(/api/blog/slug/[slug]), meta(dynamic) | ✅ 활성 |
| R-026 | /blog/category/[category] | 카테고리별 블로그 | list | app/blog/category/[category]/page.tsx | RootLayout | 아니오 | /blog 사이드바 카테고리 링크 | /blog | API(/api/blog) | ✅ 활성 |
| R-027 | /blog/tag/[tag] | 태그별 블로그 | list | app/blog/tag/[tag]/page.tsx | RootLayout | 아니오 | /blog/[slug] 태그 뱃지 | /blog | API(/api/blog) | ✅ 활성 |
| R-028 | /admin/blog | 블로그 관리 | dashboard | app/admin/blog/page.tsx | RootLayout | 예 (이메일) | /admin에서 링크 | /admin/blog/new, /admin/blog/edit/[id] | API(/api/blog) | ✅ 활성 |
| R-029 | /admin/blog/new | 새 글 작성 | form | app/admin/blog/new/page.tsx | RootLayout | 예 (이메일) | /admin/blog에서 '새 글' 버튼 | /admin/blog | API(/api/blog, /api/blog/upload) | ✅ 활성 |
| R-030 | /admin/blog/edit/[id] | 글 수정 | form | app/admin/blog/edit/[id]/page.tsx | RootLayout | 예 (이메일) | /admin/blog에서 수정 아이콘 | /admin/blog | API(/api/blog/[id]) | ✅ 활성 |
| R-031 | /admin/board | 공지 게시판 관리 | dashboard | app/admin/board/page.tsx | RootLayout | 예 (미들웨어 /admin + 이메일 게이트) | /admin에서 링크('공지 게시판 관리') | /admin, / | API(/api/admin/board) | ✅ 활성 |
| R-032 | /board/[slug] | 커뮤니티 게시판 목록 | list | app/board/[slug]/page.tsx | RootLayout | 아니오 (익명 열람) | GNB(1차>자유게시판·시세토론·정보공유), Footer(커뮤니티), 홈 BoardRow | /board/[slug]/write, /board/[slug]/[postId] | API(/api/board/[slug]), meta(dynamic) | ✅ 활성 |
| R-033 | /board/[slug]/write | 게시글 작성 | form | app/board/[slug]/write/page.tsx | RootLayout | 아니오 (익명 작성: 게스트 닉/PW) | GNB(글쓰기 버튼 /board/free/write), /board/[slug] 글쓰기, /coin/[symbol] 히어로 | /board/[slug]/[postId](등록 성공), /board/[slug](취소) | API(/api/board/[slug]) | ✅ 활성 |
| R-034 | /board/[slug]/[postId] | 게시글 상세 | detail | app/board/[slug]/[postId]/page.tsx | RootLayout | 아니오 | /board/[slug] BoardRow, 이전/다음, /coin/[symbol] | /board/[slug] | API(/api/board/[slug]/[postId], /api/community/comment, /api/community/like), meta(dynamic) | ✅ 활성 |
| R-035 | /coin/[symbol] | 코인룸(코인별 토론·시세) | detail | app/coin/[symbol]/page.tsx | RootLayout | 아니오 | GNB(코인룸>BTC·ETH·XRP·SOL·알트코인·김치프리미엄) | /analysis/[symbol], /board/free/write | meta(SSG: generateStaticParams 6종, dynamicParams=false) | ✅ 활성 |
<!-- 새 라우트는 이 줄 위에 추가 -->

**유형 값:** `auth`, `dashboard`, `list`, `detail`, `form`, `static`, `error` (7종)

**동반 파일 값:** `loading`, `error`, `API(/경로)`, `meta`, `-` (없음)

**상태 값:**
- ✅ 활성 — 정상 운영 중
- 🚧 개발중 — 파일 생성됨, 구현 진행 중
- ⚠️ 스텁 — 파일 존재하나 미완성 (audit 모드에서 감지)
- ❌ 삭제됨 — 파일 제거됨 (정리 필요)
- ⏸️ 비활성 — 일시적으로 비활성화

---

## 3. 네비게이션 구조

### 3-1. GNB (Global Navigation Bar)

> v2.0 커뮤니티 피벗 후 GNB는 **1차 링크 5개 + 드롭다운 2그룹(코인룸·도구)** 구조다(`components/global-header.tsx`의 `primary`·`coinRoom`·`tools` 배열). 데스크탑/모바일이 `[coinRoom, tools].map(...)`로 동일 배열을 렌더 → 양쪽 자동 노출. 라벨은 `lib/translations.ts`의 ko 값.

**1차 상단 링크 (`primary`, 5개):**

| 순서 | 라벨 | 경로 | 유형 | 조건 |
|------|------|------|------|------|
| 1 | 베스트 | / | 링크 | 항상 |
| 2 | 자유게시판 | /board/free | 링크 | 항상 |
| 3 | 시세토론 | /board/market | 링크 | 항상 |
| 4 | 정보공유 | /board/info | 링크 | 항상 |
| 5 | 뉴스 | /news | 링크 | 항상 |

**코인룸 드롭다운 (`coinRoom`, 6개):**

| 순서 | 라벨 | 경로 | 유형 | 조건 |
|------|------|------|------|------|
| 1 | BTC | /coin/btc | 드롭다운 | 항상 |
| 2 | ETH | /coin/eth | 드롭다운 | 항상 |
| 3 | XRP | /coin/xrp | 드롭다운 | 항상 |
| 4 | SOL | /coin/sol | 드롭다운 | 항상 |
| 5 | 알트코인 | /coin/altcoin | 드롭다운 | 항상 |
| 6 | 김치프리미엄 | /coin/kimp | 드롭다운 | 항상 |

**도구 드롭다운 (`tools`, 9개):**

| 순서 | 라벨 | 경로 | 유형 | 조건 |
|------|------|------|------|------|
| 1 | 코인 분석 | /analysis | 드롭다운 | 항상 |
| 2 | 주식 분석 | /stock | 드롭다운 | 항상 |
| 3 | 시그널 | /signal | 드롭다운 | 항상 |
| 4 | 시장 심리 | /market | 드롭다운 | 항상 |
| 5 | 경제 일정 | /calendar | 드롭다운 | 항상 |
| 6 | 코인 역사 | /history | 드롭다운 | 항상 (R9-T02 추가) |
| 7 | 관심종목 | /watchlist | 드롭다운 | 항상 |
| 8 | 보안 메모 | /secure-memo | 드롭다운 | 항상 |
| 9 | 설정 | /settings | 드롭다운 | 항상 (R12-TD 추가, 익명·회원 공통) |

> 회원은 위 도구▼ 외에 헤더 우측 **AuthButton ⚙️ 아이콘**으로도 /settings 진입 (R12-TD, taste #5 진입점 둘다).

**고정 요소:**

| 순서 | 라벨 | 경로/액션 | 유형 | 조건 |
|------|------|----------|------|------|
| 좌 | ChartMaster 로고 | / | 로고/링크 | 항상 |
| 우 | 검색 | (UI 버튼, 미연결) | 버튼 | 데스크탑(md+) |
| 우 | 언어 전환 | toggleLang() | 버튼 | 항상 |
| 우 | 로그인/로그아웃 | AuthButton | 컴포넌트 | 항상 |
| 우 | 글쓰기 | /board/free/write | 버튼 | 항상(sm+) |

**GNB 파일:** `components/global-header.tsx`

### 3-2. 사이드바

사이드바 없음 (단일 레이아웃 구조)

### 3-3. Footer

> v2.0 커뮤니티 피벗 후 Footer는 **커뮤니티 그룹(5) + 정보 그룹(3)** + 브랜드/소셜 영역 구조다(`components/footer-section.tsx` 실코드 기준, R11-T01 정합). 기존 '플랫폼 그룹(/market·/portfolio·/signal·/history)'은 코드에서 제거됨.

| 순서 | 라벨 | 경로 | 그룹 |
|------|------|------|------|
| 1 | 자유게시판 | /board/free | 커뮤니티 |
| 2 | 시세토론 | /board/market | 커뮤니티 |
| 3 | 정보공유 | /board/info | 커뮤니티 |
| 4 | 뉴스 | /news | 커뮤니티 |
| 5 | 공식글 | /blog | 커뮤니티 |
| 6 | 이용약관 | /terms | 정보 |
| 7 | 개인정보처리방침 | /privacy | 정보 |
| 8 | 문의하기 | /contact | 정보 |

**고정 요소:** 브랜드 로고 → `/` · 소셜 아이콘(GitHub/Twitter/Mail) → `#`(미연결)

**Footer 파일:** `components/footer-section.tsx`

---

## 4. 레이아웃 레지스트리

| 이름 | 파일 위치 | 구성 요소 | 적용 대상 |
|------|----------|----------|----------|
| RootLayout | app/layout.tsx | LanguageProvider + GlobalHeader + children | 전체 페이지 |
<!-- 새 레이아웃은 이 줄 위에 추가 -->

---

## 5. 공유 컴포넌트 레지스트리

| 컴포넌트 | 파일 위치 | 사용처 |
|----------|----------|--------|
| GlobalHeader | components/global-header.tsx | RootLayout (전체) |
| FooterSection | components/footer-section.tsx | 6페이지 공용 (app/page.tsx, /board/[slug], /board/[slug]/write, /board/[slug]/[postId], /coin/[symbol], /news) 직접 포함 |
| AuthButton | components/AuthButton.tsx | GlobalHeader |
| DetailedChart | components/DetailedChart.tsx | /analysis, /analysis/[symbol] |
| TradeModal | components/TradeModal.tsx | /portfolio |
| PremiumLock | components/PremiumLock.tsx | 프리미엄 기능 잠금 |
| Disclaimer | components/Common/Disclaimer.tsx | /analysis, /market |
| InvestmentQuotes | components/Stock/InvestmentQuotes.tsx | /analysis, /stock, /stock-market |
<!-- 새 공유 컴포넌트는 이 줄 위에 추가 -->

---

## 6. 리다이렉트 맵

| 조건 | 소스 | 대상 | 방식 |
|------|------|------|------|
| 비인증 접근 | /portfolio, /secure-memo, /admin | /auth/login | 미들웨어 (middleware.ts) — R12: /settings·/watchlist 보호 해제(익명 우선 MVP) |
| Google OAuth 성공 | /auth/login | / | Supabase Auth 콜백 |
| 인증 실패 | /auth/login | /auth/auth-code-error | Supabase Auth 콜백 |
<!-- 새 리다이렉트는 이 줄 위에 추가 -->

---

## 7. 컴포넌트 매핑 (v2 신규)

> 페이지 유형별 주요 컴포넌트 의존성을 기록합니다.

| 페이지 ID | 주요 컴포넌트 | 공유 컴포넌트 | kdypick 출처 |
|----------|-------------|-------------|-------------|
| R-001 | BoardRow, NewsRow, PriceTickerWidget, HotIssueWidget, FngGaugeWidget, OfficialPostsWidget, ToolsShortcutWidget (커뮤니티 SSR) | GlobalHeader, FooterSection | - |
| R-004 | DetailedChart, Ticker, AnalysisPanel, ChartAnalysisPanel | Disclaimer, InvestmentQuotes | - |
| R-005 | DetailedChart, Card, Badge, Button, Separator, Label | Disclaimer | - |
| R-006 | - (드롭다운 선택 UI) | - | - |
| R-007 | StockPanel | - | - |
| R-008 | KimchiPremium, RSIHeatmap | Disclaimer | - |
| R-009 | WhaleAlert | - | - |
| R-010 | StockTicker, StockChart, StockAnalysisPanel, ChartAnalysisPanel | InvestmentQuotes, Disclaimer | - |
| R-011 | StockRSIHeatmap | InvestmentQuotes | - |
| R-015 | TradeModal | - | - |
| R-016 | MemoCard, MemoCreateModal, MemoUnlockModal, MemoViewModal | - | - |
| R-031 | BlogEditor(동적), 보드 select | GlobalHeader | - |
| R-032 | BoardRow, BoardTableHeader, Pagination, BoardSidebar, BoardListControls | GlobalHeader, FooterSection | - |
| R-033 | BlogEditor(동적) | FooterSection | - |
| R-034 | BoardRow, CommunityBadge, BoardSidebar, PostActions, PostVoteButtons, CommentSection | FooterSection | - |
| R-035 | CoinHero, CoinRoomTabs, SidebarWidget, PriceTickerWidget, HotIssueWidget, FngGaugeWidget, OfficialPostsWidget | FooterSection | - |
<!-- 새 컴포넌트 매핑은 이 줄 위에 추가 -->

---

## 8. 연결성 검증 결과

| 항목 | 결과 |
|------|------|
| 최종 검증일 | 2026-05-29 (R11-T01, `npm run build` green 출력 기준) |
| 검증 범위 | 전체 (빌드 라우트 전수 추출 ↔ 레지스트리 1:1) |
| 빌드 라우트 총계 | **71 엔트리** (Route(app) 표) = 페이지 35 + API 31 + auth/callback 1 + 메타 3(feed.xml·robots.txt·sitemap.xml) + _not-found 1. 정적 프리렌더 카운터 = 54/54 |
| 등록 라우트(페이지) | **35개** (R-001~R-035) — 빌드 페이지 라우트와 1:1, 누락 0 |
| 활성 라우트 | **33개** (개발중 2 제외) |
| 🔴 Critical | 0개 |
| 🟡 Important | 0개 |
| 🔵 Minor | 1개 — `/stock-market` nav 진입점 소실(v2.0 GNB 피벗, 직접 URL만 도달) |
| 판정 결과 | 빌드 페이지 라우트 35 ↔ 레지스트리 35 완전 일치 |
| 상태 | ✅ 정상 (개발중 2: R-022 privacy·R-023 pricing / nav-less 1: R-011 stock-market). R12: settings·watchlist 활성화 + nav 진입점 확보 + 미들웨어 보호 해제(익명 우선) |

**API 라우트(31, 레지스트리 비등록 — 페이지 동반 파일 컬럼에서 추적):** `/api/admin/{board,cleanup-data,market-data,news-crawl,users}`, `/api/analysis/[symbol]`, `/api/analysis/stock/[symbol]`, `/api/blog`(+`[id]`·`categories`·`search`·`slug/[slug]`·`tags`·`upload`·`view/[id]`), `/api/board/[slug]`(+`[postId]`), `/api/coins/{hot-issues,ticker}`, `/api/community/{comment,like}`, `/api/contact`, `/api/fng`, `/api/kimchi`, `/api/klines`, `/api/news`, `/api/price`, `/api/signals`, `/api/stock/{history,quote,time-series}`

**특수 라우트(4):** `/auth/callback`(OAuth 콜백 route handler), `/feed.xml`·`/robots.txt`·`/sitemap.xml`(메타데이터 route)

### 최근 이슈 이력

| 날짜 | 이슈 | 심각도 | 조치 |
|------|------|--------|------|
| 2026-05-30 | 익명 우선 MVP인데 /settings·/watchlist가 미들웨어 인증 보호로 익명 도달 불가 (taste #3·T-A/B/D/F 설계 모순) | 🔴 Critical | middleware.ts protectedPaths에서 둘 제거(익명 우선), R-020·R-021 인증 '아니오'·상태 '활성'으로 갱신 — R12 지휘자 통합 |
| 2026-05-30 | /settings nav 진입점 소실(R11 Minor) 해소 | 🔵 Minor→해소 | 도구▼>설정(익명·회원) + AuthButton ⚙️(회원) 2진입점 추가, GNB §3-1 9번째 등재 — R12-TD |
| 2026-05-29 | v2.0 커뮤니티 라우트 미등록 (레지스트리 30 ↔ 빌드 페이지 35) | 🟡 Important | R-031~R-035 추가(/admin/board·/board/[slug]·/board/[slug]/write·/board/[slug]/[postId]·/coin/[symbol]) — R11-T01 |
| 2026-05-29 | §8 카운트 stale (23/19 ↔ 실제 빌드 71엔트리) | 🟡 Important | 등록 35/활성 31로 갱신, 빌드 분류(페이지35·API31·특수4·_not-found1) 명시 — R11-T01 |
| 2026-05-29 | /settings·/stock-market nav 진입점 소실 (v2.0 GNB 피벗으로 '서비스'·'주식' 그룹 제거) | 🔵 Minor | 진입점 컬럼에 ⚠️ 표기, §8 Minor 등재(직접 URL/미들웨어 도달 가능, 기능 정상) — R11-T01 |
| 2026-05-29 | 레지스트리·§3-3 Footer 진입점 stale (구 GNB 그룹·플랫폼 그룹 라벨) | 🔵 Minor | 진입점 전수 정합(GNB §3-1·Footer 실코드), §3-3 커뮤니티/정보 그룹으로 갱신, /blog Footer 공식글 확정 — R11-T01 |
| 2026-02-20 | /pricing 깨진 링크 (PremiumLock, analysis/[symbol]) | 🔴 Critical | /pricing 스텁 페이지 생성, 계약 R-023 등록 |
| 2026-02-20 | /settings, /watchlist 고아 페이지 (GNB 진입점 없음) | 🟡 Important | GNB 서비스 메뉴에 추가, 번역 키 추가 |
| 2026-02-20 | /settings, /watchlist 미들웨어에 등록되었으나 페이지 없음 | 🟡 Important | 스텁 페이지 생성 |
| 2026-02-20 | /admin 미들웨어 보호 누락 | 🟡 Important | 미들웨어 protectedPaths에 추가 |
| 2026-02-20 | Footer 개인정보처리방침 /terms로 중복 링크 | 🔵 Minor | /privacy 별도 페이지 생성 |
<!-- 이슈 이력은 이 줄 위에 추가 -->

---

## 9. 계약 변경 이력 (v2 신규)

| 버전 | 날짜 | 변경 내용 | 모드 |
|------|------|----------|------|
| 5 | 2026-05-29 | R11-T01 라우트 레지스트리 전수 정합: `npm run build`(green) 출력으로 빌드 71엔트리 추출 → 페이지 라우트 35 ↔ 레지스트리 1:1. 미등록 5건 추가(R-031 /admin/board·R-032 /board/[slug]·R-033 /board/[slug]/write·R-034 /board/[slug]/[postId]·R-035 /coin/[symbol]). 진입점 전수 정합(GNB §3-1·Footer 실코드 기준), §3-3 Footer를 커뮤니티/정보 그룹으로 갱신, /blog Footer 공식글 진입점 확정(고아 아님), §7 신규 5행, §8 카운트 35/31 + 빌드 분류 명시, /settings·/stock-market nav-less 등재 | reconcile |
| 4 | 2026-05-29 | R9-T03 정합: HeroSection 레지스트리·R-001 매핑 제거(R9-T01 dead 삭제 반영), GNB를 v2.0 실구조(1차 5 + 코인룸 6 + 도구 8, /history 포함 — R9-T02)로 정합, InvestmentQuotes 홈 사용 표기 제거(코드 근거) | reconcile |
| 2 | 2026-02-20 | 검증 이슈 수정: /pricing 생성, /settings·/watchlist GNB 연결, 총 23개 라우트 | verify |
| 1 | 2026-02-20 | 초기 계약 생성 (기존 19개 페이지 + 신규 3개 스텁) | migrate |
<!-- 변경 이력은 이 줄 위에 추가 -->

---

## 계약 규칙

1. **페이지 추가 시** → 라우트 레지스트리에 행 추가 필수 (유형 + 동반 파일 포함)
2. **페이지 삭제 시** → 상태를 `❌ 삭제됨`으로 변경 + 진입점 링크 제거
3. **네비게이션 변경 시** → 네비게이션 구조 섹션 갱신 필수 (조건 컬럼 포함)
4. **레이아웃 추가 시** → 레이아웃 레지스트리에 행 추가
5. **검증 실행 시** → 연결성 검증 결과 섹션 갱신 (전체: 6가지, 풀뿌리: 10가지 이슈유형, 3단계 심각도)
6. **모든 모드는** → 작업 전 계약 읽기, 작업 후 계약 갱신
7. **계약 변경 시** → 변경 이력 섹션에 버전 증가 + 변경 내용 기록
8. **컴포넌트 추가 시** → 컴포넌트 매핑 섹션 갱신
