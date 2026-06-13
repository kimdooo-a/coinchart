# 기능적 완성도 점검 연구 (Functional Completeness Audit)

> 작성: 2026-06-13 (세션 51) · 방법: 6개 영역 병렬 Explore 점검 + P0 직접 검증
> 범위: app/ 34개 페이지 + app/api/ 32개 라우트 + 주요 컴포넌트/데이터 레이어

## 0. 요약 (Executive Summary)

전체적으로 **핵심 기능은 실데이터 기반으로 잘 완성**되어 있다(홈·게시판·뉴스·코인룸·마켓·주식·포트폴리오·블로그·관심목록·설정·보안메모·문의 모두 동작). 다만 다음 갭이 남아 있다:

- **🔴 P0(보안) 1건**: `admin/users` 인증 가드 전무 → 익명 사용자가 전체 회원 조회/삭제 가능
- **🟠 P1 6건**: admin 트리거 2종 미인증, 코인룸 AI 시그널 하드코딩, 캘린더 정적 데이터, 게시글 상세 인터랙션 미연결, 상승확률 heuristic, pricing 미정
- **🟡 P2 다수**: 인증 하드코딩 통일, 뉴스 집계, watchlist reorder UI, 고아 API 정리, 환율 폴백 등

**가장 시급**: P0 보안 1건(admin/users)은 다른 작업과 무관하게 즉시 패치 권장.

---

## 1. 🔴 P0 — 보안 (즉시 조치)

| 라우트 | 결함 | 근거 | 조치 |
|--------|------|------|------|
| **`app/api/admin/users/route.ts`** | 인증 검증 **0줄**. GET/DELETE 모두 `createAdminClient()`(service_role)로 직접 실행 → 누구나 전체 회원 목록 조회 + 임의 유저 삭제 가능 | users/route.ts:7-28 (getUser/권한체크 부재) | `createClient()` → `getUser()` → `isAdminEmail()` 가드 추가 (cleanup-data:11-14 패턴 복사) |

> 검증 완료: 코드 직접 확인. false positive 아님. **운영 배포(coinchart.vercel.app) 중이므로 우선순위 최상.**

---

## 2. 🟠 P1 — 기능 미완성 / 보안 중

| 항목 | 갭 | 근거 | 조치 |
|------|----|------|------|
| **admin/news-crawl 미인증** | "In real app, verify..." 주석만, 실제 검증 없음 → 익명이 크롤링 트리거 가능 | news-crawl/route.ts:5-10 | 인증 가드 추가 |
| **admin/market-data 미인증** | `getUser()` 호출하나 결과 미사용("Auth check omitted for demo") → 익명이 시장데이터 갱신 트리거 가능 | market-data/route.ts:10-12 | 인증 가드 복구 |
| **코인룸 AI 시그널 하드코딩** | "매수 권장 / 75% / 강한 상승추세" 정적 placeholder, 실데이터 소스 없음 | coin/[symbol]/page.tsx:165-188 | coin-server에서 분석 결과 fetch → props 전달, 또는 위젯 제거 |
| **캘린더 정적 데이터** | 경제 일정이 코드 하드코딩(EVENTS 배열), DB 미연동, 과거(2025-01-15 등) 일정 표시 | calendar/page.tsx:9-97 | 경제달력 API/크롤링 연동 또는 페이지 보류 결정 |
| **게시글 상세 인터랙션 미연결** | 수정·스크랩·신고·답글·대댓글 신고 버튼 UI만 존재, onClick/라우팅 부재 | PostActions.tsx:39-46, PostVoteButtons.tsx:89-94, CommentSection.tsx:170-193 | 우선 핵심(수정·답글)부터 API 래퍼 + 핸들러 연결 |
| **상승확률 heuristic** | ChartAnalysisPanel `getRiseProb()`가 RSI/CCI 외 일부 random, 50/50 잔재. 실 백테스트 미연결 | ChartAnalysisPanel.tsx:41-49, 193-199 | 실제 확률 엔진(probability/engine) 연결 또는 표기 명확화 |
| **pricing Pro/Premium 미정** | 무료 플랜만 완성, Pro/Premium "준비 중"(가격·결제 미확정) | pricing/page.tsx:8-45 | 결제 로드맵 별도 — 현재는 정보 공개 수준 유지 가능 |

---

## 3. 🟡 P2 — 정리 / UX 다듬기

| 항목 | 갭 | 근거 | 조치 |
|------|----|------|------|
| **admin/cleanup-data 하드코딩** | 인증은 정상(401 차단)이나 이메일 문자열 하드코딩 | cleanup-data/route.ts:12 | `isAdminEmail()` 헬퍼로 통일(전 admin 라우트 일관성) |
| **뉴스 사이드바 집계** | "코인별 뉴스(오늘)" BTC 124/ETH 87 하드코딩, 집계 쿼리 없음 | news/page.tsx:193-201, news-server.ts | GROUP BY symbol 집계 추가 |
| **watchlist reorder UI** | 훅에 reorder 함수 존재, UI 진입점(드래그/버튼) 부재 | useWatchlist 훅 reorder + WatchlistTable | drag-and-drop 또는 순서이동 버튼 추가 |
| **blog/search 고아 API** | 완성되었으나 프론트 호출처 없음 | api/blog/search | 검색 UI 연결 또는 제거 |
| **/api/price SSOT 검토** | 분석용 가격을 Binance 직접 호출(crypto SSOT=Supabase 원칙과 별개 경로) | api/price/route.ts | 실시간성 요구 vs SSOT 정합 — 설계 결정 필요(즉시 결함 아님) |
| **DetailedChart 지표 미지원** | 캔들+평단가선만, 지표 오버레이 props 미처리(CryptoChart는 전부 지원) | components/DetailedChart.tsx | analysis/page.tsx에서 CryptoChart 사용 검토 |
| **kimchi 환율 폴백** | exchangerate 실패 시 1450 고정값 | api/kimchi/route.ts | 동적 폴백/캐시 최신값 사용 |
| **contact 입력 검증** | 이메일/길이 정규식 검증 부재(SMTP 실송은 정상) | api/contact/route.ts | 서버측 검증 추가 |
| **Giscus/이미지업로드** | 코드는 완성, 실동작 E2E 미검증 | BlogComments, BlogEditor | E2E/수동 검증 |

---

## 4. 영역별 완성도 점수 (점검 종합)

| 영역 | 완성도 | 비고 |
|------|--------|------|
| 홈 + 커뮤니티(게시판/뉴스/코인룸) | 90% | 게시판/뉴스 SSR 완성, 게시글 상세 인터랙션·코인룸 AI시그널만 미연결 |
| 분석/차트/시그널 | 85% | crypto 분석·signal 완전 연결, DetailedChart 지표·확률 heuristic 잔여 |
| 마켓/주식/포트폴리오 | 95% | 전부 실데이터. 캘린더만 정적 |
| 관심목록/설정/계정/보안메모/정적 | 97% | reorder UI·pricing만 후속 |
| 블로그 + 관리자 | 95% | 공개/관리자 모두 완성, admin 인증 가드만 결함 |
| API 엔드포인트(32) | 73% | 24 완성, admin 인증 3건이 핵심 갭 |

---

## 5. 권장 실행 순서

1. **R-A (보안 핫픽스, 단독·소규모)**: admin/users P0 + news-crawl/market-data P1 인증 가드 일괄 추가 + cleanup-data 하드코딩 통일. 공통 `requireAdmin()`/`isAdminEmail()` 헬퍼 신설 권장. → 가장 시급, 의존성 없음
2. **R-B (기능 결선)**: 게시글 상세 인터랙션(수정·답글 우선) + 코인룸 AI 시그널 실데이터화
3. **R-C (데이터 완성)**: 캘린더 실데이터 or 보류 결정 + 뉴스 코인별 집계 + 상승확률 엔진 연결
4. **R-D (정리)**: watchlist reorder UI, 고아 API, 환율 폴백, DetailedChart 지표 등

---

## 부록: 점검 방법
- 6개 disjoint 영역으로 분할, Explore 에이전트 병렬 read-only 점검
- P0 보안 4건은 main loop에서 코드 직접 재확인(cleanup-data는 false positive로 강등, admin/users는 진짜 P0 확정)
- 미검증 항목(Giscus/이미지업로드 실동작)은 "코드 완성·런타임 미검증"으로 명시
