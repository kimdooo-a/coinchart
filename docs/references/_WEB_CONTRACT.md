# 웹 프로젝트 계약 (_WEB_CONTRACT) v2

> **이 파일은 kdyweb 스킬이 관리하는 단일 진실의 원천입니다.**
> 수동 편집 시 계약 무결성이 깨질 수 있으므로 kdyweb을 통해 갱신하세요.
> 생성일: 2026-02-20 | 최종 갱신: 2026-02-20 | 계약 버전: 2

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
| R-001 | / | 랜딩 | static | app/page.tsx | RootLayout | 아니오 | 직접URL, GNB 로고 | /analysis, /market, /signal, /stock, /stock-market, /news, /calendar, /history, /portfolio, /secure-memo, /contact, /terms | meta | ✅ 활성 |
| R-002 | /auth/login | 로그인 | auth | app/auth/login/page.tsx | RootLayout | 아니오 | AuthButton, 미들웨어 리다이렉트 | /(성공), /auth/auth-code-error(실패) | meta | ✅ 활성 |
| R-003 | /auth/auth-code-error | 인증 에러 | error | app/auth/auth-code-error/page.tsx | RootLayout | 아니오 | 인증 실패 시 자동 | /auth/login | - | ✅ 활성 |
| R-004 | /analysis | 코인 분석 | dashboard | app/analysis/page.tsx | RootLayout | 아니오 | GNB(코인>코인분석) | /analysis/[symbol] | meta | ✅ 활성 |
| R-005 | /analysis/[symbol] | 코인 상세 분석 | detail | app/analysis/[symbol]/page.tsx | RootLayout | 아니오 | /analysis에서 심볼 선택 | /analysis | API(/api/analysis/[symbol]) | ✅ 활성 |
| R-006 | /analysis/stock | 주식 분석 선택 | list | app/analysis/stock/page.tsx | RootLayout | 아니오 | /stock에서 링크 | /analysis/stock/[symbol] | - | ✅ 활성 |
| R-007 | /analysis/stock/[symbol] | 주식 상세 분석 | detail | app/analysis/stock/[symbol]/page.tsx | RootLayout | 아니오 | /analysis/stock에서 심볼 선택 | /analysis/stock | API(/api/analysis/stock/[symbol]) | ✅ 활성 |
| R-008 | /market | 시장 분위기 | dashboard | app/market/page.tsx | RootLayout | 아니오 | GNB(코인>시장분위기), Footer(플랫폼) | /analysis | meta | ✅ 활성 |
| R-009 | /signal | AI 시그널 | dashboard | app/signal/page.tsx | RootLayout | 아니오 | GNB(코인>AI시그널), Footer(플랫폼) | /analysis | API(/api/signals) | ✅ 활성 |
| R-010 | /stock | 주식 분석 | dashboard | app/stock/page.tsx | RootLayout | 아니오 | GNB(주식>주식분석) | /analysis/stock, /analysis/stock/[symbol] | API(/api/stock/*) | ✅ 활성 |
| R-011 | /stock-market | 주식 시장 분위기 | dashboard | app/stock-market/page.tsx | RootLayout | 아니오 | GNB(주식>주식시장분위기) | /stock | meta | ✅ 활성 |
| R-012 | /news | 뉴스 | list | app/news/page.tsx | RootLayout | 아니오 | GNB(정보>뉴스) | 외부 뉴스 링크 | API(/api/news) | ✅ 활성 |
| R-013 | /calendar | 경제 캘린더 | static | app/calendar/page.tsx | RootLayout | 아니오 | GNB(정보>캘린더) | - | meta | ✅ 활성 |
| R-014 | /history | 코인 히스토리 | static | app/history/page.tsx | RootLayout | 아니오 | GNB(정보>코인히스토리), Footer(플랫폼) | - | meta | ✅ 활성 |
| R-015 | /portfolio | 포트폴리오 | dashboard | app/portfolio/page.tsx | RootLayout | 예 (미들웨어) | GNB(서비스>포트폴리오), Footer(플랫폼) | /auth/login(비인증시) | meta | ✅ 활성 |
| R-016 | /secure-memo | 보안 메모 | dashboard | app/secure-memo/page.tsx | RootLayout | 예 (미들웨어) | GNB(서비스>보안메모) | /auth/login(비인증시) | meta | ✅ 활성 |
| R-017 | /contact | 문의하기 | form | app/contact/page.tsx | RootLayout | 아니오 | GNB(서비스>문의하기), Footer(정보) | - | API(/api/contact) | ✅ 활성 |
| R-018 | /terms | 이용약관 | static | app/terms/page.tsx | RootLayout | 아니오 | GNB(서비스>이용약관), Footer(정보) | - | meta | ✅ 활성 |
| R-019 | /admin | 관리자 | dashboard | app/admin/page.tsx | RootLayout | 예 (미들웨어) | 직접URL (관리자만) | /auth/login(비인증시) | API(/api/admin/*) | ✅ 활성 |
| R-020 | /settings | 설정 | form | app/settings/page.tsx | RootLayout | 예 (미들웨어) | GNB(서비스>설정) | /portfolio | meta | 🚧 개발중 |
| R-021 | /watchlist | 관심종목 | list | app/watchlist/page.tsx | RootLayout | 예 (미들웨어) | GNB(서비스>관심종목) | /analysis | meta | 🚧 개발중 |
| R-022 | /privacy | 개인정보처리방침 | static | app/privacy/page.tsx | RootLayout | 아니오 | Footer(정보) | /terms | meta | 🚧 개발중 |
| R-023 | /pricing | 요금제 | static | app/pricing/page.tsx | RootLayout | 아니오 | PremiumLock, /analysis/[symbol] | / | meta | 🚧 개발중 |
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

**드롭다운 메뉴 구조 (4그룹):**

| 그룹 | 순서 | 라벨 | 경로 | 유형 | 조건 |
|------|------|------|------|------|------|
| 코인 | 1 | 코인 분석 | /analysis | 드롭다운 | 항상 |
| 코인 | 2 | 시장 분위기 | /market | 드롭다운 | 항상 |
| 코인 | 3 | AI 시그널 | /signal | 드롭다운 | 항상 |
| 주식 | 1 | 주식 분석 | /stock | 드롭다운 | 항상 |
| 주식 | 2 | 주식 시장 분위기 | /stock-market | 드롭다운 | 항상 |
| 정보 | 1 | 뉴스 | /news | 드롭다운 | 항상 |
| 정보 | 2 | 캘린더 | /calendar | 드롭다운 | 항상 |
| 정보 | 3 | 코인 히스토리 | /history | 드롭다운 | 항상 |
| 서비스 | 1 | 포트폴리오 | /portfolio | 드롭다운 | 항상 |
| 서비스 | 2 | 보안 메모 | /secure-memo | 드롭다운 | 항상 |
| 서비스 | 3 | 관심종목 | /watchlist | 드롭다운 | 항상 |
| 서비스 | 4 | 설정 | /settings | 드롭다운 | 항상 |
| 서비스 | 5 | 문의하기 | /contact | 드롭다운 | 항상 |
| 서비스 | 6 | 이용약관 | /terms | 드롭다운 | 항상 |

**고정 요소:**

| 순서 | 라벨 | 경로/액션 | 유형 | 조건 |
|------|------|----------|------|------|
| 좌 | ChartMaster 로고 | / | 로고/링크 | 항상 |
| 우 | 언어 전환 | toggleLang() | 버튼 | 항상 |
| 우 | 로그인/로그아웃 | AuthButton | 컴포넌트 | 항상 |

**GNB 파일:** `components/global-header.tsx`

### 3-2. 사이드바

사이드바 없음 (단일 레이아웃 구조)

### 3-3. Footer

| 순서 | 라벨 | 경로 | 그룹 |
|------|------|------|------|
| 1 | 시장 개요 | /market | 플랫폼 |
| 2 | 포트폴리오 | /portfolio | 플랫폼 |
| 3 | AI 시그널 | /signal | 플랫폼 |
| 4 | 코인 히스토리 | /history | 플랫폼 |
| 5 | 이용약관 | /terms | 정보 |
| 6 | 개인정보처리방침 | /privacy | 정보 |
| 7 | 문의하기 | /contact | 정보 |

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
| FooterSection | components/footer-section.tsx | 랜딩 페이지 (app/page.tsx) 직접 포함 |
| AuthButton | components/AuthButton.tsx | GlobalHeader |
| LanguageSwitcher | components/LanguageSwitcher.tsx | GlobalHeader (인라인) |
| HeroSection | components/hero-section.tsx | 랜딩 페이지 |
| DashboardGrid | components/dashboard-grid.tsx | 랜딩 페이지 |
| AboutSection | components/about-section.tsx | 랜딩 페이지 |
| DetailedChart | components/DetailedChart.tsx | /analysis, /analysis/[symbol] |
| TradeModal | components/TradeModal.tsx | /portfolio |
| ErrorState | components/ErrorState.tsx | 에러 표시 공통 |
| InsufficientData | components/InsufficientData.tsx | 데이터 부족 표시 공통 |
| PremiumLock | components/PremiumLock.tsx | 프리미엄 기능 잠금 |
| Disclaimer | components/Common/Disclaimer.tsx | /analysis, /market |
| InvestmentQuotes | components/Stock/InvestmentQuotes.tsx | 랜딩, /stock, /stock-market |
<!-- 새 공유 컴포넌트는 이 줄 위에 추가 -->

---

## 6. 리다이렉트 맵

| 조건 | 소스 | 대상 | 방식 |
|------|------|------|------|
| 비인증 접근 | /portfolio, /settings, /watchlist, /secure-memo, /admin | /auth/login | 미들웨어 (middleware.ts) |
| Google OAuth 성공 | /auth/login | / | Supabase Auth 콜백 |
| 인증 실패 | /auth/login | /auth/auth-code-error | Supabase Auth 콜백 |
<!-- 새 리다이렉트는 이 줄 위에 추가 -->

---

## 7. 컴포넌트 매핑 (v2 신규)

> 페이지 유형별 주요 컴포넌트 의존성을 기록합니다.

| 페이지 ID | 주요 컴포넌트 | 공유 컴포넌트 | kdypick 출처 |
|----------|-------------|-------------|-------------|
| R-001 | HeroSection, DashboardGrid, AboutSection | GlobalHeader, FooterSection, InvestmentQuotes | - |
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
<!-- 새 컴포넌트 매핑은 이 줄 위에 추가 -->

---

## 8. 연결성 검증 결과

| 항목 | 결과 |
|------|------|
| 최종 검증일 | 2026-02-20 |
| 검증 범위 | 전체 (migrate 후 자동) |
| 등록 라우트 | 23개 |
| 활성 라우트 | 19개 |
| 🔴 Critical | 0개 (수정 완료: /pricing 깨진 링크 해결) |
| 🟡 Important | 0개 (수정 완료: /settings, /watchlist GNB 연결) |
| 🔵 Minor | 0개 |
| 판정 결과 | - |
| 상태 | ✅ 정상 (4개 개발중 페이지: R-020~R-023) |

### 최근 이슈 이력

| 날짜 | 이슈 | 심각도 | 조치 |
|------|------|--------|------|
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
