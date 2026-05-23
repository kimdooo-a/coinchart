# 다음 개발 프롬프트

> 최종 갱신: 2026-05-23

## 최근 완료된 작업

- **세션 23 (2026-05-23)**: R2/T05 일꾼 — 인프라 마무리 (ISR + node:crypto + Giscus). 사용자 R2-T05 발사(배너는 R2-T02 표시 → 사용자 명시 지시 우선). R1 잔여 인프라 3건: **(1) `/` 순수 ISR 전환** — `app/page.tsx`의 `fetchMainPageData()`(쿠키 의존 `createClient`→`cookies()`) 호출을 제거하고 **cookies 비의존 anon 클라이언트 로더 `loadMainPageData()`+매퍼 4종**을 내장 → `/` 렌더 모드 **`ƒ (Dynamic)`→`○ (Static)` ISR 전환**(세션 18 §4·solution에서 진단됐던 문제 **해결 확정**). 핵심: supabase-js `global.fetch`에 `next:{revalidate:300}` 주입해야 정적 prerender 유지(미주입 시 uncached fetch가 dynamic 복귀). 라우트 revalidate는 의존 fetch 최솟값(ticker 60s) → `1m` 표기. **(2) middleware `node:crypto` 경고 해소** — `middleware.ts`에 `export const runtime = 'nodejs'`(ip-mask T07의 `node:crypto` import 대응, 방안 b Web Crypto는 ip-mask 수정 필요라 불가). matcher·헤더·인증 로직 불변. **(3) Giscus 라이트** — `BlogComments.tsx` `data-theme` `'dark_dimmed'`→`'light'`. **queries.ts·server.ts·ip-mask(R1 read-only) 무수정** — page.tsx 자급으로 `fetchMainPageData` 미사용화 부수효과는 **지휘자 SSOT 환원 후속 권장**(queries.ts 클라이언트만 anon 교체 + page.tsx 로더 제거, handover §6). 검증: tsc 0(2회) / build ✓(`┌ ○ /  1m  1y`·node:crypto 경고 부재·`ƒ Proxy (Middleware)`). 지휘자 21·T04 22 점유 → 23 채택. (handover `2026-05-23-R2-T05-infra-finish.md`, 세션 메타 `2026-05-23-session23-r2t05-infra.md`, solution 해결 확정 보강)
- **세션 22 (2026-05-23)**: R2/T04 일꾼 — 차트 라이트화. 사용자 R2-T04 발사(배너는 R2-T03 표시 → 사용자 명시 지시 우선, 세션 9 T08 패턴). TradingView Lightweight Charts 4종(`components/Chart/CryptoChart.tsx`·`StockChart.tsx`·`components/DetailedChart.tsx`·`hero-chart.tsx`)의 하드코딩 다크 색상(#1E1E1E 배경·#D9D9D9 텍스트·#2B2B43 그리드·#26a69a/#ef5350 캔들)을 `lib/chart/theme.ts`(T08 SOT) `getChartTheme('light')`+`getCandleColors('kr')`로 교체. 각 파일 **모듈 레벨 상수** `CHART_THEME`/`CANDLE_COLORS` 1회 평가 → `createChart(el,{...CHART_THEME, timeScale:{...CHART_THEME.timeScale, timeVisible:true}})`(borderColor 등 테마 하위키 보존) + `addSeries(CandlestickSeries,{...CANDLE_COLORS, borderVisible:false})`. **4종 모두 한국식 빨↑(#ba1a1a)/파↓(#0050cb)** — StockChart도 한국 투자자 관례로 'kr' 통일(US 종목 필요 시 'us' 교체). 미사용 `ColorType` import·`colors` prop 다크 기본값 제거(인터페이스 유지). 데이터 로직 무변경, 색상/테마만. **의도적 보존(범위 밖, 후속 권장)**: 볼륨 막대·MACD 히스토그램 방향 색(녹↑/빨↓ — 빨/파 캔들과 불일치, KR 정렬 권장), RSI/MACD/MA/BB 라인 색(데이터 식별), CSS 오버레이(hero `text-white` 심볼·`bg-black/40` 패널 — R1 라이트화 이전부터의 잔재). 검증: tsc 0 / `grep getChartTheme|getCandleColors` 4/4 / 다크 리터럴 잔여 0 / eslint 신규 0 / build Compiled successfully. 세션 21(컨덕터) 점유 후 22(병렬 R2 T01/T03/T05 충돌 가능성 인지). (handover `2026-05-23-R2-T04-chart-lightify.md`)
- **세션 19 (2026-05-23)**: R1/T11 일꾼 — 시그널·마켓·주식마켓 라이트화. 사용자 T11 발사(2번째 터미널). `app/signal·market·stock-market` + `components/Signal·Market·Stock`의 다크 톤 클래스(gray/black) → 라이트 토큰(`bg-surface-container*`/`text-on-surface*`/`border-outline-variant`) 교체. T09 매핑표 + T10 차트 패턴 + T08 `lib/chart/theme.ts` 참조. **수정 6파일**(signal·market page + WhaleAlert·KimchiPremium·RSIHeatmap·StockSectorPerformance), `git diff --stat` **45/45 좌우 대칭**(순수 클래스 교체). **의미 컬러 보존**: RSI 히트맵 셀(red/orange/gray/teal/green-600 + 셀 위 흰 글씨), 토글/범례 강조 뱃지(indigo/rose/destructive), 정보 카드(red/green-900/20). **수정 불필요 4파일**: stock-market page·InvestmentQuotes·StockAnalysisPanel(다크톤 부재) + StockRSIHeatmap(이미 shadcn 토큰). **차트 옵션 호출은 본 영역 부재**(grep 0건, T10과 동일하게 외부 Chart 컴포넌트 위임 — 후속 라운드가 `components/Chart/*`·`DetailedChart`·`hero-chart`에 `getChartTheme("light")` 적용 필요). tsc 0 / build PASS(`/signal`·`/market`·`/stock-market` 모두 ○ 정적). 본래 18 시작 → T15 슬롯 충돌로 19 정정. (handover `2026-05-23-R1-T11-signal-market-lightify.md`, 세션 메타 `2026-05-23-session19-t11-signal-market-lightify.md`)
- **세션 18 (2026-05-23)**: R1/T15 일꾼 — 메인페이지 실데이터 전환. `app/page.tsx` `"use client"` 제거 → async Server Component(SSR) + `revalidate=300`, **mock-\* import 0건**. 신규 `lib/community/queries.ts`(`fetchMainPageData` 단일 진입점): community_posts 베스트30(공지 제외)·게시판3컬럼 + blog_posts 공식글3 SELECT + `community_hot_issues` RPC + Binance ticker + FNG **병렬 fetch**. 외부 API(ticker/FNG)는 `.catch`로 격리, Supabase는 `?? []` graceful degrade → 전체 페이지 500 방지. 사용자 지시대로 `await createClient()`(cookies 기반) 사용 — 명세서 `createServerClient` 보정. 컴포넌트 계약 변환 헬퍼 5종(Ticker/BoardRow/NewsRow/HotIssue/Official, T13 인계 `TREND_MAP` 적용) + `COIN_META` 브랜드 사전 + `formatRelativeTime`(ISO→상대시간). `mock-coins`/`mock-posts` deprecated 주석(**삭제 X** — `/news`·`/coin/[symbol]`·`/board/*` 4페이지 사이드바가 사용 중, grep 확인). 검증: tsc 0 / grep(mock 0·use client 0·fetchMainPageData 2·revalidate 1) / build PASS. ⚠️ **`cookies()` 때문에 `/`는 `ƒ` dynamic으로 등록**(revalidate 무효 → fetch 레이어 캐시 분산, solution `2026-05-23-nextjs-cookies-breaks-isr-revalidate.md`). 슬롯 18 유지(T11이 19로 양보). (handover `2026-05-23-R1-T15-mainpage-realdata.md`)
- **세션 17 (2026-05-23)**: R1/T13 일꾼 — hot-issues 집계 RPC + API (코드 사전 완료 인수 + handover 신규 하이브리드). 사용자 T13 발사 vs SessionStart hook 마커 T11(시각 페이지 라이트화) — 사용자 명시 지시 우선 채택. T13 코드 산출물(`supabase/migrations/20260523_create_hot_issues_rpc.sql` 65줄 + `app/api/coins/hot-issues/route.ts` 50줄 + `_API_REFERENCE.md` L645~681 append)이 이전 세션에 이미 완성·존재 발견 — 코드 0줄 추가. handover `docs/handover/2026-05-23-R1-T13-hot-issues-rpc.md` 신규 157줄 작성 (T15 인계 4종 — trend `FLAT→same` 매핑 코드 스니펫·keyword 사전 매핑 필요성·delta 클라이언트 계산·502/빈 결과 graceful degrade). 검증 본 일꾼 4종 PASS(tsc/eslint/grep 2개) + npm run build 사후 갱신 결과도 Compiled successfully(35.4s, `/api/coins/hot-issues` 동적 라우트 등록) 인지. 본래 세션 16 시작 → T02 슬롯 충돌로 17 정정 (세션 14 13→14 패턴). **T15 메인페이지 통합 시점 즉시 사용 가능** — `mock-coins.ts`의 `HOT_ISSUES` 더미를 `fetch('/api/coins/hot-issues', { next: { revalidate: 300 } })` + `TREND_MAP = { UP:"up", DOWN:"down", NEW:"new", FLAT:"same" }` 매핑으로 교체. (handover `2026-05-23-R1-T13-hot-issues-rpc.md`, 세션 메타 `2026-05-23-session17-t13-hot-issues.md`)
- **세션 16 (2026-05-23)**: R1/T02 일꾼 — community 시드 스크립트. 사용자 T09 발사 + SessionStart hook T02 마커 충돌 → hook 우선 채택 (R1 5번째 사례). `scripts/seed-community.ts` 신규(~180줄): `MOCK_POSTS` 3 보드 × 52행 = **156행**을 `community_posts` 스키마로 매핑 + 100행 chunk INSERT + `--force` 가드 + bcrypt 1회 공유 해시(`seed123!`) + 랜덤 `created_at`(0~30일). `toMaskedIp` 헬퍼로 mock IP("211.34") → CHECK 정규식("211.34.*.*") 변환. 모든 시드 글 익명(`author_id=null`), 운영자 공지도 `guest_*` 3요소로 적재. 검증 4/4 PASS (tsc 빈 출력 / 컬럼 grep 27회 / ESLint 0 / tsx import "OK"+가드 동작). **실 DB INSERT는 사용자 직접 실행** (`npx tsx scripts/seed-community.ts`, T01 SQL 적용 환경 필요). (handover `2026-05-23-R1-T02-community-seed.md`)
- **세션 15 (2026-05-23)**: R1/T03 사후 검증 전용 세션 — 사용자 T02 발사 + SessionStart hook T03 마커 충돌 → hook 우선 채택. T03 산출물 일체(`types/coins.ts` + `lib/supabase/crypto.ts` append 영역 L68~110 + `app/api/coins/ticker/route.ts` + references 2종)가 세션 8에 이미 완료/머지된 상태 발견. 신규 코드 변경 0건, spec 1:1 일치 + `npx tsc --noEmit` 전역 0 에러 + ESLint 0 에러. **부수 발견**: 세션 10~14의 PARTIAL(`bcryptjs` 미설치)이 본 세션 시점에 이미 해소 — 워킹트리 `M package.json/-lock.json` 흔적. (handover `2026-05-23-session15-t03-reverify.md`)
- **세션 14 (2026-05-23)**: R1/T07 검증 전용 세션 — 사용자 T07 발사 명령에 대응했으나 산출물 일체(`lib/community/auth.ts`/`ip-mask.ts`/`middleware.ts` + references 2종 + handover)가 세션 10(`30350f5`)에 이미 완료/머지된 상태 발견. 신규 코드 변경 0건, spec 1:1 일치 + PARTIAL(bcryptjs 미설치) 유지 보고. (PARTIAL은 세션 15에서 해소 확인됨)
- **세션 13 (2026-05-23)**: R1/T05 일꾼 (검증·인수) — 다른 T05 일꾼이 이미 워킹트리에 생성한 산출물 4종(`lib/news/classifier.ts` 144 LoC, `lib/news/keyword-dict.ts` 159 LoC, `__tests__/lib/news-classifier.test.ts` 86 LoC/8 tests, handover 229 LoC)을 작업 지시서 사양과 1:1 대조 + TS·런타임·Vitest·ESLint 4종 검증 PASS 후 인수. 코드 0줄 추가, 공유 문서만 갱신. T05 ↔ T06(세션 11) 통합은 사실상 완료.
- **세션 12 (2026-05-23)**: R1/T04 일꾼 — Alternative.me Fear & Greed Index 프록시. `lib/community/fng.ts` 신규(`fetchFng()` + `FngSnapshot` 인터페이스 + 1시간 모듈 메모리 캐시 + `next: { revalidate: 3600 }`) + `app/api/fng/route.ts` 신규(`GET /api/fng`, 실패 시 502). `_API_REFERENCE.md`에 `### GET /api/fng` 항목 append. `_ENV_REFERENCE.md` FNG 섹션은 T07 커밋(`30350f5`)이 이미 동일 텍스트를 포함하고 있어 idempotent(git diff 0). 라이브 fetch 검증 PASS(`value=28, classification="Fear"`). **T15 메모**: 메인페이지 `FngGaugeWidget`에서 `/api/fng` 호출, 502 시 fallback UI(현재 하드코딩 72/68 재사용 가능) 권장. ENV 추가 없음·`FngGaugeWidget.tsx`/`app/page.tsx` 미수정.
- **세션 11 (2026-05-23)**: R1/T06 일꾼 — 뉴스 분류 4차원 DB·API 통합. `supabase/migrations/20260523_alter_news_classify.sql` 신규 (`category` text + 8값 enum CHECK / `importance_score` smallint 1~10 / `sentiment_score` integer, 인덱스 2). `app/api/admin/news-crawl/route.ts`에 T05 `classify()` 호출 통합하여 RSS item 파싱 직후 4차원 결과를 적재 (기존 인라인 symbol 매칭 7줄 제거). `app/api/news/route.ts`에 `?category=` / `?minImportance=` 쿼리 파라미터 + 응답 필드 4종(camelCase) 추가. T15가 메인 NewsRow에서 소비. 실 DB 적용은 컨덕터 또는 별도 작업.
- **세션 10 (2026-05-23)**: R1/T07 일꾼 — 익명 게스트 bcrypt 해시/검증 (`lib/community/auth.ts`) + IP 마스킹/HMAC 해시 (`lib/community/ip-mask.ts`) + 기존 `middleware.ts`에 IP 헤더 3종(`x-client-ip`/`-masked`/`-hash`) 주입 로직 머지 + matcher에 `/api/board/:path*`, `/api/community/:path*` 추가. T12(board API)가 의존할 헤더 명세 handover에 코드 예시로 명시. **PARTIAL**: `npm install bcryptjs @types/bcryptjs` 후속 필요.
- **세션 9 (2026-05-23)**: R1/T08 일꾼 — `lib/chart/theme.ts` 신규 (`getChartTheme('light'|'dark')` + `getCandleColors('kr'|'us')`, KR 빨/파 + US 녹/빨) + `BlogEditor`/`EditorToolbar`에 `tone?: 'light'|'dark'` prop 추가 (default `light`). lightweight-charts v5 `ColorType.Solid` enum 호환성 솔루션 별도 기록(`docs/solutions/2026-05-23-lightweight-charts-v5-colortype-enum.md`). 페이지 적용은 T09(signal)·T10(analysis)·T11(market) 의존.
- **세션 9 (2026-05-23)**: R1/T14 일꾼 — `lib/translations.ts` menu 그룹에 신규 키 9개(ko/en) append(`best`, `boardFree`, `boardMarket`, `boardInfo`, `coinRoom`, `tools`, `write`, `search`, `login`; `news`는 기존 존재) + `components/global-header.tsx` 인라인 한/영 분기 8건 → `t.menu.*` 호출로 교체. JSX 구조·아이콘 무변경. 잔여 분기 4건(altcoin/김치프리미엄/EN-KR 토글 ×2) 의도적 잔류.
- **세션 9 (2026-05-23)**: R1/T01 일꾼 — `community_boards/posts/comments/post_likes` 4테이블 마이그레이션 SQL (`supabase/migrations/20260523_create_community_tables.sql`) + 시드 9행(`free`/`market`/`info` + 코인룸 6종) + 트리거 4 + RLS 15 + 인덱스 6. `_SCHEMA_REFERENCE.md` 신규 섹션 append. 익명 XOR 회원 CHECK 제약 DB 레벨 강제.
- **세션 8 (2026-05-23)**: R1/T03 일꾼 — Binance 24h ticker SSOT 추가 (`lib/supabase/crypto.ts`의 `fetchBinanceTickers`/`fetchCommunityTickers`) + `/api/coins/ticker` 신규 라우트. 60s 이중 캐시.
- **세션 7 (2026-05-10)**: Stitch 시안 → 코드 적용 1차 — Material 3 디자인 토큰 통합 (한국식 빨↑/파↓), Noto Sans KR, 헤더·푸터 라이트화 + 메뉴 5+2 구조, 공통 컴포넌트 13개(`components/community/`), 더미 데이터 모듈 3종, 신규/리디자인 페이지 6개(홈·뉴스·게시판×3·코인룸), 41개 라우트 빌드 통과 → 커밋 `a79fe24`
- **세션 6 (2026-05-10)**: v2.0 커뮤니티 피벗 — `docs/PROJECT_DIRECTION.md`로 코인판×네이버 하이브리드 정체성 정의, Stitch 의뢰서 7종 작성(`docs/design-brief/`), Stitch 반환 시안 6세트 검토
- **세션 5 (2026-03-08)**: 블로그 에디터 티스토리급 강화 — TipTap extension 10개, HTML 저장, 자동저장, DOMPurify
- **세션 4 (2026-03-08)**: Giscus + Vitest 20개 + any 타입 정리
- **세션 3 (2026-03-08)**: 블로그 SEO + 디자인 강화 (JSON-LD, sitemap, TOC)
- **세션 2 (2026-03-08)**: 블로그 확장 Phase 5 (RSS, 댓글, 시드)
- **세션 1 (2026-03-08)**: 블로그 기능 전체 구현 (Phase 1~4)

## 추천 다음 작업 (우선순위)

### 세션 8 — 라이트화 (Step 4)

1. ~~**블로그 라이트화** (필수, 커뮤니티 직접 연결) — `/blog`, `/blog/[slug]`, `/blog/category/[category]`, `/blog/tag/[tag]`.~~ → **세션 20(T09) 완료** (18파일: 페이지 4 + components/Blog 11(editor 제외) + BlogEditor 사용처 3에 `tone="light"`). 코드블록(`prose-pre`)·복사버튼·`text-green-400` 의도적 다크 보존. **잔여(R2)**: Giscus `data-theme` `'dark_dimmed'`→`'light'` 전환, `components/Blog/editor/` 내부 ToolButton 색상 tone-aware 분기. (BlogEditor `tone` prop은 세션 9(T08) 완료)
2. **AI 분석 도구 라이트화** (높음) — `/analysis/*`, `/signal`, `/market`. ~~차트 라이트 테마 분리 (`lib/chart/theme.ts` 신규).~~ → **세션 9(T08) 완료** (`getChartTheme('light')` + `getCandleColors('kr')`). ~~`/analysis/*` 페이지·컴포넌트 라이트화~~ → **세션(T10) 완료**. ~~`/signal`·`/market`·`/stock-market` 페이지·컴포넌트 라이트화~~ → **세션 19(T11) 완료** (6파일 클래스 교체). ~~차트 컴포넌트 자체(`components/Chart/*`·`DetailedChart`·`hero-chart`)에 T08 헬퍼 적용~~ → **세션 22(R2/T04) 완료** (4파일, 한국식 빨/파 캔들). **잔여(후속 권장)**: 볼륨 막대·MACD 히스토그램 방향 색 KR 정렬, hero/로딩 CSS 오버레이 라이트화, MA99 #FFEA00 대비 보강.
3. ~~**번역 키 정리** — `lib/translations.ts`의 `menu` 그룹에 `best`, `boardFree`, `boardMarket`, `boardInfo`, `coinRoom`, `tools`, `write` 키 추가.~~ → **세션 9(T14) 완료** (9키 append + 헤더 인라인 분기 8건 교체). 잔여: altcoin/kimp 라벨, EN-KR 토글 — 후속 라운드 처리 권고.
4. **나머지 페이지 라이트화** (중간) — `/stock`, `/stock-market`, `/portfolio`, `/watchlist`, `/calendar`, `/secure-memo`, `/admin/*`, `/auth/*`, 정책 페이지.

### R1 (in progress) — 백엔드 (DB + API) — dispatch 일꾼별

5. ~~**DB 마이그레이션** — `community_boards`, `community_posts`, `community_comments`, `community_post_likes`~~ → **세션 9(T01) 완료** (`supabase/migrations/20260523_create_community_tables.sql`). 실 DB 적용은 컨덕터 또는 별도 작업
6. ~~**익명 비밀번호 해싱** — bcrypt 권장~~ → **세션 10(T07) 완료** (`lib/community/auth.ts`, PARTIAL: `npm install bcryptjs @types/bcryptjs` 후속 필요)
7. ~~**IP 마스킹 미들웨어** — `X-Forwarded-For` 앞 2옥텟만 저장~~ → **세션 10(T07) 완료** (`lib/community/ip-mask.ts` + `middleware.ts` 머지, 3종 헤더 주입)
8. **API 라우트** — `/api/board/[slug]`, `/api/board/[slug]/[postId]`, `/api/community/comment`, `/api/community/like` — T12 영역 (워킹트리에 다른 일꾼 untracked 잔존)
9. ~~**더미 → 실데이터** — `lib/community/mock-*` → Supabase 연동~~ → **세션 18(T15) 메인페이지 한정 완료** (`app/page.tsx` async SSR + 신규 `lib/community/queries.ts`, mock import 0건). **잔여(R2)**: `/board/*`·`/news`·`/coin/*`도 실데이터 전환 후 mock-* 파일 완전 삭제 (현재 4페이지 사이드바가 mock-coins 위젯 데이터 사용 중) — T15 영역
   - ~~**community 시드 스크립트** (`scripts/seed-community.ts`, 156행 적재)~~ → **세션 16(T02) 완료**. 사용자가 `npx tsx scripts/seed-community.ts` 직접 실행 (T01 SQL 적용 후). 기존 행 있으면 `--force` 필요
   - ~~**FngGaugeWidget 하드코딩(`value=72, prevValue=68`) → `/api/fng` hydrate**~~ → **세션 12(T04) 산출물 준비 완료** (`/api/fng`). 메인페이지 통합 **세션 18(T15) 완료** (`queries.ts`에서 `fetchFng()` 직접 호출, 실패 시 `.catch`→`{value:50, Neutral}` 폴백)
   - ~~**HotIssueWidget 하드코딩(`HOT_ISSUES` 10행) → `/api/coins/hot-issues` hydrate**~~ → **세션 17(T13) 산출물 준비 완료** (RPC `community_hot_issues(int, int)` + `/api/coins/hot-issues?hours=&limit=`, revalidate 300s). 메인페이지 통합 **세션 18(T15) 완료** — `queries.ts` `supabase.rpc("community_hot_issues",...)` 직접 호출 + page.tsx에서 `TREND_MAP`(UP→up/DOWN→down/NEW→new/FLAT→same) 적용 + 빈 결과 graceful degrade. 의존: T02 시드 적용 후 의미 있는 결과 산출

### 뉴스 룰베이스 분류 (완료)

10. ~~**분류 로직** — `lib/news/classifier.ts`, `lib/news/keyword-dict.ts`~~ → **T05 완료** (세션 13에서 검증·인수 확정, Vitest 8/8 PASS)
11. ~~**`news` 테이블 확장** — `category`, `importance_score` 컬럼 추가~~ → **세션 11(T06) 완료** (`sentiment_score`도 함께 추가 + 인덱스 2)
12. ~~**크롤러 통합** — `app/api/admin/news-crawl/route.ts`에 분류 호출~~ → **세션 11(T06) 완료** (인라인 매칭 제거 + `classify()` 호출 통합)

### 후순위

13. **Giscus App 설치** (수동) — https://github.com/apps/giscus 에서 kimdooo-a/coinchart 리포 연결
14. **`/history` 메뉴 정리** — 도구 드롭다운 추가 또는 폐기
15. **OG 이미지 자동 생성** — `app/blog/[slug]/opengraph-image.tsx`
16. **에디터 Phase 2** — 예약 발행, 비공개 글, 단축키 모달
17. **대형 파일 리팩토링** — `app/analysis/[symbol]/page.tsx` 807줄
18. **테스트 커버리지 확대** — analysis, backtest, probability

## 알려진 이슈 및 주의사항

- **다크 톤 페이지 시각 회귀** (세션 7 진입 후): 디자인 토큰을 라이트로 통일했으므로 기존 25페이지가 색상 일관성이 일시 깨짐. 빌드는 통과. 다음 세션 Step 4 우선순위 1.
- ~~**TradingView 차트**: 다크 옵션 그대로라 라이트 환경에 어울리지 않음. `lib/chart/theme.ts`로 분리 필요.~~ → **세션 9(T08) + 세션 22(R2/T04) 완료** — T08 헬퍼 신규 + T04에서 `components/Chart/CryptoChart·StockChart`·`DetailedChart`·`hero-chart` 4종에 `getChartTheme('light')`+`getCandleColors('kr')` 적용(한국식 빨/파 캔들). **잔여**: 볼륨 막대·MACD 히스토그램 방향 색이 여전히 녹↑/빨↓(서양식)이라 빨/파 캔들과 불일치 — 후속 KR 정렬 권장. hero `text-white` 심볼 등 CSS 오버레이는 차트 색 범위 밖이라 별도 라이트화 필요.
- ~~**BlogEditor `prose-invert`**: TipTap 에디터 내부 텍스트가 라이트 환경에서 잘 안 보일 수 있음. props로 톤 전환 옵션 추가.~~ → **세션 9(T08) 완료** — `tone?: 'light'|'dark'` prop 추가 (default light). EditorToolbar ToolButton 내부 색상은 minimal diff로 미수정, R2에서 세부 조정 권장.
- **`/history` 메뉴 미배치**: 신규 메뉴 5+2에 미포함. 도구 드롭다운 추가 또는 폐기 결정 필요.
- **Material Symbols vs lucide-react**: 시안은 Material Symbols 사용, 우리는 lucide-react. 누락 아이콘 있으면 시각 차이.
- **번역 키 일부 미추가**: 헤더에서 인라인 한/영 분기 사용 중 (`lang === "ko" ? "베스트" : "Best"` 등).
- ~~Supabase DB 마이그레이션~~ → 완료
- ~~Supabase Storage blog-images 버킷~~ → 완료
- ~~블로그 SEO 미성숙~~ → 80%로 개선
- ~~Giscus 미설정~~ → 코드 설정 완료, **App 설치만 필요**
- ~~테스트 프레임워크 미도입~~ → Vitest 20개 동작
- ~~any 타입 78회~~ → 핵심 코드 1개, scripts/ 45개
- ~~에디터 기능 부족~~ → 28개 버튼, HTML 저장, 자동저장 완비
- `app/analysis/[symbol]/page.tsx` 807줄 (리팩토링 필요)
- `BlogPost.content` 타입이 union — 레거시 호환 제거 가능
- Supabase 마이그레이션 히스토리 동일 날짜 중복 파일 — 리네이밍 권장

## 빌드 상태

- Next.js 빌드 (`npm run build`): ✅ 성공 (41개 라우트, Turbopack)
- TypeScript (`npx tsc --noEmit`): ✅ 에러 없음
- ESLint: 신규 코드 0 에러, 기존 `scripts/` any/require 경고는 알려진 항목
- Vitest: ✅ 동작 중 (커뮤니티 신규 모듈은 테스트 미작성 — 다음 세션 추가 권장)
- Git: 커밋 `a79fe24` 푸시 완료

## v2.0 진행 상태

| 단계 | 상태 | 세션 |
|------|------|------|
| 방향성 정의 | ✅ 완료 | 6 |
| Stitch 의뢰서 | ✅ 완료 | 6 |
| Stitch 시안 수령 | ✅ 완료 | 6→7 |
| 디자인 토큰 통합 | ✅ 완료 | 7 |
| 공통 컴포넌트 | ✅ 완료 (13개) | 7 |
| 더미 페이지 | ✅ 완료 (6개) | 7 |
| 기존 페이지 라이트화 | ⏳ 대기 (25개) | 8 |
| DB 마이그레이션 | ⏳ 대기 (4개 테이블) | 9 |
| API + 실데이터 | ⏳ 대기 | 9 |
| 뉴스 룰베이스 분류 | ⏳ 대기 | 10 |
