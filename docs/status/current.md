# 현재 상태 (Current Status)

| 항목 | 값 |
|------|-----|
| **마지막 세션** | 2026-05-23 (세션 22 — R2/T04 차트 라이트화, 4파일: CryptoChart·StockChart·DetailedChart·hero-chart 하드코딩 다크 → `getChartTheme("light")`+`getCandleColors("kr")`. 컨덕터 21 점유 후 22, 병렬 R2 충돌 시 정정) |
| **작업 내용** | 사용자 R2-T04 발사. TradingView Lightweight Charts 4종의 하드코딩 다크 색상(#1E1E1E 배경·#D9D9D9 텍스트·#2B2B43 그리드·#26a69a/#ef5350 캔들)을 `lib/chart/theme.ts`(T08 SOT) 헬퍼로 교체. 각 파일 **모듈 레벨 상수** `CHART_THEME=getChartTheme('light')`/`CANDLE_COLORS=getCandleColors('kr')` 1회 평가 후 `createChart(el,{...CHART_THEME, timeScale:{...CHART_THEME.timeScale, timeVisible:true}})` + `addSeries(CandlestickSeries,{...CANDLE_COLORS, borderVisible:false})`. 4종 모두 한국식 빨↑(#ba1a1a)/파↓(#0050cb) — StockChart도 한국 투자자 관례로 'kr' 통일(US 필요 시 'us' 교체). 미사용된 `ColorType` import 제거, `colors` prop 다크 기본값 제거(인터페이스 유지). **의도적 보존(범위 밖)**: 볼륨 막대·MACD 히스토그램 방향 색(녹↑/빨↓, 캔들과 불일치 — 후속 KR 정렬 권장), RSI/MACD/MA/BB 라인 색(데이터 식별), CSS 오버레이(hero `text-white` 등 R1 이전 잔재). 데이터 로직 무변경, 색상/테마만. |
| **브랜치** | main |
| **빌드 상태** | ✅ `npx tsc --noEmit` 0 에러 / `grep getChartTheme\|getCandleColors components/` **4/4 파일** / 다크 리터럴(#1E1E1E·#2B2B43·#D9D9D9) 잔여 **0** / `npx eslint`(4파일) 신규 이슈 0(기존 `prefer-const`/`lang` deps 경고만) / `npm run build` Compiled successfully(전체 라우트, T08 시점 bcryptjs 이슈 R1에서 해소) |
| **마지막 커밋** | (세션 22 cs commit) — 본 일꾼 책임 산출물 차트 4파일 + handover 1종 + cs 문서만 명시적 staging. **다른 일꾼 잔존 산출물은 컨덕터 통합 커밋에 위임**: R2-T01(app/board 3페이지·components/community/BoardSidebar·lib/community/board-queries.ts), R2-T05(infra·middleware.ts·app/page.tsx·BlogComments.tsx), R2 handover(T01·T05), `docs/orchestration/2026-05-23-R2-realdata-finish/` 미커밋 |
| **프로젝트 방향성** | **v2.0 커뮤니티 피벗** ([PROJECT_DIRECTION.md](../PROJECT_DIRECTION.md)) |

## 최근 작업 이력

| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-05-23 | R2/T04 — 차트 라이트화 (세션 22, 일꾼) | 사용자 R2-T04 발사(배너는 R2-T03 표시 → 사용자 지시 우선). TradingView 차트 4종(CryptoChart·StockChart·DetailedChart·hero-chart) 하드코딩 다크(#1E1E1E/#D9D9D9/#2B2B43/#26a69a·#ef5350) → `lib/chart/theme.ts`(T08) `getChartTheme('light')`+`getCandleColors('kr')` 교체. 모듈 레벨 상수 + 테마 객체 spread(timeScale/crosshair 머지로 borderColor 보존). 4종 모두 한국식 빨↑/파↓. 미사용 `ColorType` import·`colors` prop 다크 기본값 제거. 볼륨/MACD 히스토그램 방향 색(녹/빨)·RSI/MACD/MA/BB 라인·CSS 오버레이는 범위 밖 보존(후속 권장 handover 명시). tsc 0 / grep 4·4·0 / eslint 신규 0 / build PASS. handover `2026-05-23-R2-T04-chart-lightify.md` 신규 |
| 2026-05-23 | R1/T09 — 블로그 라이트화 (세션 20, 일꾼) | 사용자 T09 발사(3번째 터미널). `app/blog` 4페이지 + `components/Blog` 11컴포넌트(editor 제외) 다크 톤 → 라이트 토큰 교체(18파일, 클래스 only). 코드블록(`prose-pre`)·복사버튼·`text-green-400`·Giscus theme 의도적 보존. BlogEditor 사용처 3곳 `tone="light"` 명시. tsc 0 / 잔여 다크 grep 0건 / 라이트 토큰 70건 / build PASS(blog 4라우트). 빌드 첫 시도 `.next\lock` 점유 → 해제 후 재시도 PASS. handover `2026-05-23-R1-T09-blog-lightify.md` 신규 |
| 2026-05-23 | R1/T11 — 시그널·마켓·주식마켓 라이트화 (세션 19, 일꾼) | 사용자 T11 발사(2번째 터미널). `app/signal·market·stock-market` + `components/Signal·Market·Stock` 다크 톤(gray/black) → 라이트 토큰 교체. 수정 6파일 `git diff --stat` 45/45 대칭(순수 클래스). RSI 히트맵 셀 색상·강조 뱃지·정보 카드 의미 컬러 보존. 수정 불필요 4파일(다크톤 부재 3 + 이미 shadcn 토큰 1). 차트 옵션 호출 영역 외(T10 동일). tsc 0 / build PASS. handover `2026-05-23-R1-T11-signal-market-lightify.md` 신규. 본래 18 시작 → T15 슬롯 충돌로 19 정정 |
| 2026-05-23 | R1/T15 — 메인페이지 실데이터 전환 (세션 18, 일꾼) | `app/page.tsx` `"use client"` 제거 → async SSR + `revalidate=300`, **mock-\* import 0건**. `lib/community/queries.ts` 신규(`fetchMainPageData`: community_posts 베스트30·게시판3컬럼, news 10, blog_posts 공식글3, `community_hot_issues` RPC, Binance ticker, FNG 병렬 fetch + 외부 API `.catch` 격리). 사용자 지시대로 `await createClient()` 사용. 컴포넌트 props 변환 헬퍼 5종(Ticker/BoardRow/NewsRow/HotIssue/Official). `mock-coins`/`mock-posts` deprecated 주석(삭제 X — /news·/coin·/board 4개 페이지가 위젯에서 여전히 사용). tsc/build PASS, `/`=ƒ dynamic(cookies()→동적). T01·T02·T03·T04·T06·T12·T13 산출물 통합 |
| 2026-05-23 | R1/T13 — hot-issues 집계 RPC + API (세션 17, 일꾼) | 사용자 T13 발사 + SessionStart hook 마커 T11 → 사용자 명시 우선 채택. T13 코드 산출물 일체(SQL `community_hot_issues(int,int)` RPC + `/api/coins/hot-issues` 라우트 + `_API_REFERENCE.md` append)가 이전 세션에 이미 완성·존재 발견. 코드 0줄 추가, handover 157줄만 본 세션 신규 작성(T15 인계 trend `FLAT→same` 매핑·keyword 사전·delta 계산·502 폴백 4종). tsc/eslint/grep 2개 PASS, build Compiled OK 사후 인지. 본래 16 시작 → T02 슬롯 충돌로 17 정정 |
| 2026-05-23 | R1/T02 — community 시드 스크립트 (세션 16, 일꾼) | 사용자 T09 발사 + SessionStart hook T02 → hook 우선 채택 (R1 5번째). `scripts/seed-community.ts` 신규 (~180줄). MOCK_POSTS 3 보드 × 52행 = 156행을 community_posts 스키마로 매핑 + 100행 chunk INSERT + `--force` 가드 + bcrypt 1회 공유 해시 + 랜덤 created_at(0~30일). 검증 4/4 PASS. 실 DB INSERT는 사용자 별도 실행 |
| 2026-05-23 | R1/T03 — 사후 검증 전용 세션 (세션 15, 일꾼) | 사용자 T02 발사 + SessionStart hook T03 → hook 우선 채택. T03 산출물 일체(`types/coins.ts`/`lib/supabase/crypto.ts` append/`app/api/coins/ticker/route.ts` + references 2종)가 세션 8에 이미 완료/커밋 상태 발견. 신규 코드 0건, spec 1:1 일치 재검증 + tsc/eslint 0 에러 (bcryptjs 누락 해소도 부수 확인) |
| 2026-05-23 | R1/T07 — 검증 전용 세션 (세션 14, 일꾼) | 사용자 T07 발사 명령 → 산출물 일체가 세션 10(`30350f5`)에 사전 완료 머지된 상태 발견. 신규 코드 0건, spec 1:1 일치 재확인 + PARTIAL(bcryptjs 미설치) 유지 보고. 본래 13으로 시작 → 병렬 슬롯 충돌로 14로 정정 |
| 2026-05-23 | R1/T05 — 뉴스 룰베이스 분류 라이브러리 (세션 13, 검증·인수) | 다른 T05 일꾼이 이미 작성한 `lib/news/classifier.ts`(144) + `keyword-dict.ts`(159) + 테스트(86, 8/8 PASS) + handover(229) 인수. 본 세션 코드 0줄 추가. T06가 이미 통합 호출 완료 |
| 2026-05-23 | R1/T04 — Fear & Greed Index 프록시 (세션 12, 일꾼) | `lib/community/fng.ts`(fetchFng + 1h 메모리 캐시 + FngSnapshot 타입) + `app/api/fng/route.ts`(GET, 502 폴백) 신규. `_API_REFERENCE.md`에 `### GET /api/fng` 항목 append. `_ENV_REFERENCE.md` FNG 섹션은 T07 커밋이 이미 포함(idempotent). T15 `FngGaugeWidget` 의존 산출물 |
| 2026-05-23 | R1/T06 — 뉴스 분류 4차원 DB·API 통합 (세션 11, 일꾼) | `supabase/migrations/20260523_alter_news_classify.sql` 신규 (`category`/`importance_score`/`sentiment_score` 3컬럼 + 인덱스 2). `app/api/admin/news-crawl/route.ts`에 T05 `classify()` 호출 통합 (인라인 symbol 매칭 7줄 제거). `app/api/news/route.ts` 응답 필드 4종 확장 + `?category=`/`?minImportance=` 필터. T15 의존 산출물 |
| 2026-05-23 | R1/T07 — 익명 bcrypt + IP 마스킹 + middleware (세션 10, 일꾼) | `lib/community/auth.ts`(bcrypt 해시/검증 + 닉네임) + `lib/community/ip-mask.ts`(IP 추출/마스킹/HMAC 해시) 신규. `middleware.ts`에 IP 헤더 3종 주입 + matcher 확장. T12(board API) 의존 산출물. PARTIAL: bcryptjs 패키지 미설치 |
| 2026-05-23 | R1/T08 — 차트 라이트 테마 + BlogEditor `tone` prop (세션 9, 일꾼) | `lib/chart/theme.ts` 신규 (`getChartTheme`/`getCandleColors`, KR 빨/파 + US 녹/빨), `BlogEditor`/`EditorToolbar`에 `tone?: 'light'\|'dark'` prop 추가. T09·T10·T11 의존 산출물 |
| 2026-05-23 | R1/T14 — 번역 키 정리 + 헤더 인라인 분기 제거 (세션 9, 일꾼) | `lib/translations.ts` menu 9키(ko/en) append + `components/global-header.tsx` 인라인 한/영 분기 8건 → `t.menu.*` 교체. 잔여 분기 4건(altcoin/kimp/EN-KR 토글 ×2) 의도적 잔류 |
| 2026-05-23 | R1/T01 — community_* 4테이블 마이그레이션 (세션 9, 일꾼) | `community_boards/posts/comments/post_likes` + 시드 9행 + 트리거 4 + RLS 15 + 인덱스 6. `_SCHEMA_REFERENCE.md` 신규 섹션 append |
| 2026-05-23 | R1/T03 — Binance ticker SSOT (세션 8, 일꾼) | `fetchBinanceTickers`/`fetchCommunityTickers` + `/api/coins/ticker` 신규. 60s 이중 캐시. T15가 메인페이지 hydrate에 사용 |
| 2026-05-10 | Stitch 시안 코드 적용 Step 1~3 (세션 7) | 디자인 토큰 통합(Material 3 + 한국식 빨/파), Noto Sans KR, 공통 컴포넌트 13개, 더미 페이지 6개(홈·뉴스·게시판×3·코인룸), 빌드 통과 |
| 2026-05-10 | v2.0 방향성 정의 + 디자인 의뢰서 6종 (세션 6) | 코인판×네이버 하이브리드 커뮤니티로 피벗. Stitch 의뢰용 design-brief/ 작성 |
| 2026-03-08 | 에디터 강화 + HTML 전환 (세션 5) | TipTap 확장 10개, HTML 저장, 자동저장, 뷰모드, 전체화면, DOMPurify |
| 2026-03-08 | Giscus + Vitest + any 정리 (세션 4) | Giscus 활성화, Vitest 20개 테스트, any 35개→1개 (핵심 코드) |
| 2026-03-08 | 블로그 SEO + 디자인 (세션 3) | SEO 인프라/서버-클라이언트 분리/JSON-LD/카드 그림자/TOC 하이라이팅/코드 복사 |
| 2026-03-08 | 블로그 확장 (세션 2) | RSS/sitemap/읽기시간/댓글/Admin링크/네비독립배치/시드3글 |
| 2026-03-08 | 블로그 기능 전체 구현 | Phase 1~4 완료 (DB/타입/SSOT/API 11개 + 에디터/관리자 UI + 공개 블로그 10개 컴포넌트 + 네비게이션/번역/SEO) |
| 2026-02-28 | kdynext 전체 실행 | 체계 설정, 정크 정리, 레퍼런스 6종 생성, README 재작성 완료 |
| 2026-01-14 | SecureMemo 암호화 모듈 TypeScript 오류 수정 | 완료 |
| 2026-01-14 | SecureMemo 기능 추가 | 완료 |
| 2025-12-29 | 자동 뉴스/시장 데이터 업데이트 스크립트 | 완료 |

## 세션 기록 요약표

| # | 날짜 | 세션 제목 | 로그 | 인수인계 |
|---|------|---------|------|---------|
| 1 | 2026-03-08 | 블로그 기능 전체 구현 | [로그](../logs/2026-03.md) | [handover](../handover/2026-03-08-session1-blog.md) |
| 2 | 2026-03-08 | 블로그 확장 (Phase 5) | [로그](../logs/2026-03.md) | [handover](../handover/2026-03-08-session2-blog-extend.md) |
| 3 | 2026-03-08 | 블로그 SEO 최적화 + 디자인 강화 | [로그](../logs/2026-03.md) | [handover](../handover/2026-03-08-session3-blog-seo.md) |
| 4 | 2026-03-08 | Giscus + Vitest + any 타입 정리 | [로그](../logs/2026-03.md) | [handover](../handover/2026-03-08-session4-quality.md) |
| 5 | 2026-03-08 | 블로그 에디터 강화 + HTML 전환 | [로그](../logs/2026-03.md) | [handover](../handover/2026-03-08-session5-editor-upgrade.md) |
| 6 | 2026-05-10 | v2.0 방향성 피벗 + 디자인 의뢰서 6종 | [로그](../logs/2026-05.md) | [handover (6+7 통합)](../handover/2026-05-10-session7-stitch-applied.md) |
| 7 | 2026-05-10 | Stitch 시안 코드 적용 Step 1~3 | [로그](../logs/2026-05.md) | [handover](../handover/2026-05-10-session7-stitch-applied.md) |
| 8 | 2026-05-23 | R1/T03 일꾼 — Binance ticker SSOT + `/api/coins/ticker` | [로그](../logs/2026-05.md) | [handover](../handover/2026-05-23-R1-T03-ticker-ssot.md) |
| 9 | 2026-05-23 | R1/T01 일꾼 — community_* 4테이블 마이그레이션 | [로그](../logs/2026-05.md) | [handover](../handover/2026-05-23-R1-T01-community-migrations.md) |
| 9 | 2026-05-23 | R1/T08 일꾼 — 차트 라이트 테마 + BlogEditor `tone` prop | [로그](../logs/2026-05.md) | [handover](../handover/2026-05-23-R1-T08-chart-theme-editor-tone.md) |
| 9 | 2026-05-23 | R1/T14 일꾼 — 번역 키 정리 + 헤더 인라인 분기 제거 | [로그](../logs/2026-05.md) | [handover](../handover/2026-05-23-R1-T14-translations-cleanup.md) |
| 10 | 2026-05-23 | R1/T07 일꾼 — 익명 bcrypt + IP 마스킹 + middleware 머지 | [로그](../logs/2026-05.md) | [handover](../handover/2026-05-23-R1-T07-auth-middleware.md) |
| 11 | 2026-05-23 | R1/T06 일꾼 — 뉴스 분류 4차원 DB·API 통합 | [로그](../logs/2026-05.md) | [handover](../handover/2026-05-23-R1-T06-news-classify-integration.md) |
| 12 | 2026-05-23 | R1/T04 일꾼 — Fear & Greed Index 프록시 + `/api/fng` | [로그](../logs/2026-05.md) | [handover](../handover/2026-05-23-R1-T04-fng-proxy.md) |
| 13 | 2026-05-23 | R1/T05 일꾼 — 뉴스 룰베이스 분류 라이브러리 (검증·인수) | [로그](../logs/2026-05.md) | [handover](../handover/2026-05-23-R1-T05-news-classifier.md) |
| 14 | 2026-05-23 | R1/T07 검증 전용 — 사전 완료 확인 + 보고 (코드 변경 0건) | [로그](../logs/2026-05.md) | [handover](../handover/2026-05-23-session14-t07-verification.md) |
| 15 | 2026-05-23 | R1/T03 사후 검증 전용 — 사전 완료 확인 + 보고 (코드 변경 0건) | [로그](../logs/2026-05.md) | [handover](../handover/2026-05-23-session15-t03-reverify.md) |
| 16 | 2026-05-23 | R1/T02 일꾼 — community 시드 스크립트 (`scripts/seed-community.ts`, 156행) | [로그](../logs/2026-05.md) | [handover](../handover/2026-05-23-R1-T02-community-seed.md) |
| 17 | 2026-05-23 | R1/T13 일꾼 — hot-issues RPC + `/api/coins/hot-issues` (코드 사전 완료·handover 신규) | [로그](../logs/2026-05.md) | [handover](../handover/2026-05-23-R1-T13-hot-issues-rpc.md) |
| 18 | 2026-05-23 | R1/T15 일꾼 — 메인페이지 실데이터 전환 (mock 제거 + SSR + `queries.ts`) | [로그](../logs/2026-05.md) | [handover](../handover/2026-05-23-R1-T15-mainpage-realdata.md) |
| 19 | 2026-05-23 | R1/T11 일꾼 — 시그널·마켓·주식마켓 라이트화 (6파일 45/45 대칭, 18→19 정정) | [로그](../logs/2026-05.md) | [handover](../handover/2026-05-23-R1-T11-signal-market-lightify.md) |
| 20 | 2026-05-23 | R1/T09 일꾼 — 블로그 라이트화 (app/blog 4 + components/Blog 11 + BlogEditor tone 3, 18파일) | [로그](../logs/2026-05.md) | [handover](../handover/2026-05-23-R1-T09-blog-lightify.md) |
| 22 | 2026-05-23 | R2/T04 일꾼 — 차트 라이트화 (CryptoChart·StockChart·DetailedChart·hero-chart 4파일, getChartTheme('light')+getCandleColors('kr')) | [로그](../logs/2026-05.md) | [handover](../handover/2026-05-23-R2-T04-chart-lightify.md) |

## v2.0 피벗 핵심 (2026-05-10 결정)

- **정체성**: AI 차트 분석 도구 → **코인·주식 정보 공유 커뮤니티** (코인판 × 네이버)
- **메인 가치**: 유저 게시판 (자유/시세토론/정보공유 + 코인룸 6종)
- **AI 차트 분석**: 부가 기능. "도구" 메뉴로 격리 (URL은 유지)
- **뉴스**: 룰베이스 분류(AI 흉내), 4차원(코인·카테고리·호악재·중요도) 시각화
- **작성 권한**: 익명+회원 혼용 (코인판 방식)
- **디자인 톤**: 네이버 스타일 (흰 배경, 빨↑/파↓, 정보 밀도, 표 우선)

## 디자인 의뢰서 (Stitch 의뢰용)

| 문서 | 위치 |
|-----|------|
| 방향성 합의 문서 | [PROJECT_DIRECTION.md](../PROJECT_DIRECTION.md) |
| 디자인 시스템 (공통) | [design-brief/00-overview.md](../design-brief/00-overview.md) |
| 메인(홈) | [design-brief/01-home.md](../design-brief/01-home.md) |
| 게시판 리스트 | [design-brief/02-board-list.md](../design-brief/02-board-list.md) |
| 게시글 상세+작성 | [design-brief/03-post-detail-write.md](../design-brief/03-post-detail-write.md) |
| 뉴스 강화 | [design-brief/04-news.md](../design-brief/04-news.md) |
| 코인룸 | [design-brief/05-coin-room.md](../design-brief/05-coin-room.md) |
| 인덱스·우선순위 | [design-brief/README.md](../design-brief/README.md) |

## 미해결 사항

- ~~Supabase에 `20260308_create_blog_tables.sql` 마이그레이션 실행 필요~~ → 완료 (2026-03-08)
- ~~Supabase Storage에 `blog-images` 버킷 생성 필요~~ → 완료 (2026-03-08)
- ~~Giscus 댓글 활성화 필요~~ → 완료 (2026-03-08, GitHub Discussions + repoId/categoryId 설정)
  - **수동 작업 필요**: https://github.com/apps/giscus 에서 앱 설치
- ~~테스트 프레임워크 미도입~~ → 완료 (Vitest 20개 테스트, indicators + blog-utils)
- ~~any 타입 78회 사용~~ → 핵심 코드 1개 (BlogPost.content 레거시 호환), scripts/ 45개 (낮은 우선순위)
- 대형 파일 리팩토링 필요 (analysis/[symbol]/page.tsx 807줄)
- DB content 컬럼 이미 text 타입 (마이그레이션 불필요), 데이터도 HTML 형식 확인 완료
- ~~kdy-addon/monet-registry-main (1.7GB) 정리 필요~~ → 완료 (2026-02-28)

## v2.0 진행 상태

### 세션 7 완료 (2026-05-10)
- ✅ 디자인 토큰 통합 (`app/globals.css` 전면 교체, Material 3 + 한국식 빨/파)
- ✅ Noto Sans KR 적용 (`app/layout.tsx`)
- ✅ 헤더 라이트화 + 메뉴 5+2 구조 (`components/global-header.tsx`)
- ✅ 푸터 라이트화 (`components/footer-section.tsx`)
- ✅ 공통 컴포넌트 13개 (`components/community/*`)
  - Badge, CommunityTabs, Pagination, SidebarWidget
  - BoardRow + BoardTableHeader, NewsRow, NewsHeadlineCard, CoinHero
  - PriceTickerWidget, HotIssueWidget, FngGaugeWidget, OfficialPostsWidget, ToolsShortcutWidget
- ✅ 더미 데이터 모듈 3종 (`lib/community/mock-{posts,news,coins}.ts`)
- ✅ 신규/리디자인 페이지 6개 (모두 더미 데이터, DB 미연결)
  - 홈 (`app/page.tsx`) — 시세스트립 + 베스트30 + 최신뉴스10 + 게시판 3컬럼 + 코인룸 6카드 + 사이드바
  - 뉴스 (`app/news/page.tsx`) — 4차원 필터(코인·분류·감정·정렬) + 헤드라인3 + 표
  - 게시판 리스트 (`app/board/[slug]/page.tsx`) — free/market/info 동일 템플릿
  - 게시글 상세 (`app/board/[slug]/[postId]/page.tsx`) — 본문+추천+댓글+이전다음
  - 게시글 작성 (`app/board/[slug]/write/page.tsx`) — TipTap 에디터 재사용
  - 코인룸 (`app/coin/[symbol]/page.tsx`) — btc/eth/xrp/sol/altcoin/kimp 동일 템플릿
- ✅ Next.js 빌드 통과 (41개 라우트)

### 다음 세션 (Step 4~5 + 백엔드)
- [ ] Step 4: 기존 다크 톤 페이지 라이트화 (페이지 25개)
  - [x] 우선순위 1: `/blog`, `/blog/[slug]`, `/blog/category`, `/blog/tag` (커뮤니티와 직접 연결) ✅ R1/T09 세션 20 완료 (18파일, 코드블록 의도적 다크 보존)
  - 우선순위 2: `/analysis`, `/analysis/[symbol]`, `/signal`, `/market` (코인룸 진입)
  - 우선순위 3: `/stock`, `/stock-market`, `/portfolio`, `/watchlist`, `/calendar`
  - 우선순위 4: `/admin/*`, `/auth/*`, `/settings`, `/secure-memo`, `/contact`, `/terms`, `/privacy`
  - [x] TradingView 차트 색상 라이트 톤 옵션 추가 (`lib/chart/theme.ts`) ✅ R1/T08 세션 9 완료 — 페이지 적용은 T09·T10·T11 후속
- [x] BlogEditor의 `prose-invert` → 라이트 톤 옵션 props 추가 ✅ R1/T08 세션 9 완료 (`tone?: 'light'|'dark'`, default light, EditorToolbar에도 전파)
- [x] DB 마이그레이션: `community_boards`, `community_posts`, `community_comments`, `community_post_likes` ✅ R1/T01 세션 9 완료 (`supabase/migrations/20260523_create_community_tables.sql` — 실 DB 적용은 컨덕터 또는 별도 작업)
- [x] ~~익명 글 비밀번호 해싱 (bcrypt 권장)~~ → 코드 완료 (T07, `lib/community/auth.ts`). **PARTIAL**: `npm install bcryptjs @types/bcryptjs` 후속 필요
- [x] ~~IP 마스킹 미들웨어 (X-Forwarded-For 앞 2옥텟)~~ → 완료 (T07, `lib/community/ip-mask.ts` + `middleware.ts` 머지, 헤더 3종 주입)
- [ ] API 라우트: `/api/board/*`, `/api/community/*` (T12 진행 중 — 다른 일꾼 untracked)
- [x] community 게시글 시드 스크립트 ✅ R1/T02 세션 16 완료 (`scripts/seed-community.ts`, 156행 INSERT 준비. 실 DB 적용은 사용자가 `npx tsx scripts/seed-community.ts` 실행)
- [ ] 더미 데이터(`lib/community/mock-*`) → Supabase 연동 (T15 영역)
- [x] ~~뉴스 룰베이스 분류 로직 (`lib/news/classifier.ts`, `lib/news/keyword-dict.ts`)~~ → T05 완료 (세션 미상, 다른 터미널)
- [x] ~~`news` 테이블 스키마 추가 (`category`, `importance_score`)~~ → **T06 세션 11 완료** (3컬럼 + 인덱스 2 + crawler/API 통합). 실 DB 적용은 컨덕터 또는 별도 작업
- [ ] AI 분석 페이지를 "도구" 드롭다운 라우트와 시각적 일관성 맞추기
- [ ] /history 페이지 메뉴 정리 (도구 드롭다운에서 제외하거나 추가)
