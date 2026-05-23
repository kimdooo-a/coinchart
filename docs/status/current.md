# 현재 상태 (Current Status)

| 항목 | 값 |
|------|-----|
| **마지막 세션** | 2026-05-23 (세션 10 — R1/T07 일꾼, T01/T08/T14와 동시 발사) |
| **작업 내용** | 익명 게스트 bcrypt 해시/검증 + IP 마스킹/해시 + Next.js middleware 머지. `/board/*`, `/api/board/*`, `/api/community/*` 경로에 `x-client-ip-*` 3종 헤더 주입. (R1 dispatch, T07 일꾼) |
| **브랜치** | main |
| **빌드 상태** | ⚠️ TS 1건 (`bcryptjs` 미설치, 패키지 추가 시 해소). `ip-mask.ts`/`middleware.ts`는 통과. eslint 0 errors |
| **마지막 커밋** | (T07 commit 예정) — R1 다른 일꾼 T01/T05/T08/T14 산출물 워킹트리 잔존, 컨덕터 통합 대기 |
| **프로젝트 방향성** | **v2.0 커뮤니티 피벗** ([PROJECT_DIRECTION.md](../PROJECT_DIRECTION.md)) |

## 최근 작업 이력

| 날짜 | 작업 | 결과 |
|------|------|------|
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
  - 우선순위 1: `/blog`, `/blog/[slug]`, `/blog/category`, `/blog/tag` (커뮤니티와 직접 연결)
  - 우선순위 2: `/analysis`, `/analysis/[symbol]`, `/signal`, `/market` (코인룸 진입)
  - 우선순위 3: `/stock`, `/stock-market`, `/portfolio`, `/watchlist`, `/calendar`
  - 우선순위 4: `/admin/*`, `/auth/*`, `/settings`, `/secure-memo`, `/contact`, `/terms`, `/privacy`
  - [x] TradingView 차트 색상 라이트 톤 옵션 추가 (`lib/chart/theme.ts`) ✅ R1/T08 세션 9 완료 — 페이지 적용은 T09·T10·T11 후속
- [x] BlogEditor의 `prose-invert` → 라이트 톤 옵션 props 추가 ✅ R1/T08 세션 9 완료 (`tone?: 'light'|'dark'`, default light, EditorToolbar에도 전파)
- [x] DB 마이그레이션: `community_boards`, `community_posts`, `community_comments`, `community_post_likes` ✅ R1/T01 세션 9 완료 (`supabase/migrations/20260523_create_community_tables.sql` — 실 DB 적용은 컨덕터 또는 별도 작업)
- [x] ~~익명 글 비밀번호 해싱 (bcrypt 권장)~~ → 코드 완료 (T07, `lib/community/auth.ts`). **PARTIAL**: `npm install bcryptjs @types/bcryptjs` 후속 필요
- [x] ~~IP 마스킹 미들웨어 (X-Forwarded-For 앞 2옥텟)~~ → 완료 (T07, `lib/community/ip-mask.ts` + `middleware.ts` 머지, 헤더 3종 주입)
- [ ] API 라우트: `/api/board/*`, `/api/community/*`
- [ ] 더미 데이터(`lib/community/mock-*`) → Supabase 연동
- [ ] 뉴스 룰베이스 분류 로직 (`lib/news/classifier.ts`, `lib/news/keyword-dict.ts`)
- [ ] `news` 테이블 스키마 추가 (`category`, `importance_score`)
- [ ] AI 분석 페이지를 "도구" 드롭다운 라우트와 시각적 일관성 맞추기
- [ ] /history 페이지 메뉴 정리 (도구 드롭다운에서 제외하거나 추가)
