# 인수인계서 — 세션 6+7 (v2.0 커뮤니티 피벗 + Stitch 시안 코드 적용)

> 작성일: 2026-05-10
> 이전 세션: [session5-editor-upgrade](./2026-03-08-session5-editor-upgrade.md) (2026-03-08)
> 통합 사유: 같은 날 진행, 세션 6(방향성·의뢰서)→7(시안 코드 적용)이 단일 흐름

---

## 작업 요약

사이트 정체성을 **AI 차트 분석 도구 → 코인판×네이버 하이브리드 정보 공유 커뮤니티**로 피벗했다. 세션 6에서 방향성을 정의하고 Stitch에 의뢰할 디자인 의뢰서 6종을 작성했으며, 세션 7에서 Stitch가 반환한 시안을 분석하여 디자인 토큰 통합·공통 컴포넌트 13개·더미 데이터 페이지 6개로 1차 코드 적용을 완료했다.

## 대화 다이제스트

### 토픽 1: 프로젝트 점검 + git 최신화

> **사용자**: "프로젝트 점검 및 깃 최신화 확인."

원격 `origin/main`에 17 커밋이 누적되어 있고 로컬은 1주 전 상태(`52331ef`)에 머물러 있음을 확인. 워킹트리는 깨끗하므로 fast-forward로 안전하게 동기화 가능. 사용자 승인 후 `git pull --ff-only`로 `f8c24e0`까지 진입. 다른 환경에서 진행한 블로그 시스템·SEO·세션 1~5 작업물이 모두 로컬에 도착.

**결론**: 로컬·원격 동기화 완료. 블로그 시스템과 세션 1~5 인수인계서 확보.

### 토픽 2: 사이트 정체성 피벗 — 코인판 스타일 정보 공유 커뮤니티

> **사용자**: "코인판 사이트처럼 정보공유의 장을 만들고 싶다. 우선 기사를 잘 분류·표시하고, 디자인은 Stitch에 의뢰서를 던지려고 한다. 코딩으로 디자인을 바꾸는 게 아니라 방향성을 다시 정한 후 의뢰서를 만들자."

현재 구현(AI 차트 분석 메인, 단순 RSS 뉴스 카드형, 어드민 블로그)을 살펴본 뒤 4가지 핵심 결정을 받음:
- 정보 공유 주체: **유저 커뮤니티 (코인판 방식)** — 익명+회원 혼용
- AI 차트 분석: **부가 기능**으로 격리 (도구 드롭다운), URL 유지
- 뉴스 분류: **AI API 미사용** — 룰베이스 키워드 사전 + 점수
- 디자인 톤: **네이버 스타일** — 흰 배경, 정보 밀도, 표 위주

추가 결정: 작성 권한은 코인판식 익명+회원 혼용 (IP 앞 2옥텟 마스킹), 1차 MVP 범위는 메인+게시판 리스트+상세+작성+뉴스+코인룸 6페이지.

**결론**: `docs/PROJECT_DIRECTION.md`로 v2.0 방향성 합의 문서 작성. 메뉴 구조 단순화(5개 라이트 + 코인룸▼/도구▼ 2개 드롭다운).

### 토픽 3: Stitch 의뢰서 6종 작성

> **사용자**: "방향성을 정한 후 디자인 의뢰서를 만들면 내가 Stitch에 그대로 던지려고."

`docs/design-brief/`에 6개 파일 작성:
- `00-overview.md`: 디자인 시스템 (모든 페이지 의뢰에 첨부할 공통 베이스 — 컬러·타이포·헤더·푸터·공통 컴포넌트)
- `01-home.md`: 메인 — 시세 스트립 + 베스트 + 뉴스 + 게시판 3컬럼 + 코인룸 카드
- `02-board-list.md`: 게시판 리스트 — 자유/시세/정보 동일 템플릿
- `03-post-detail-write.md`: 게시글 상세 + 작성 (2화면 통합)
- `04-news.md`: 뉴스 강화 — 4차원 분류(코인·카테고리·호악재·중요도) 시각화
- `05-coin-room.md`: 코인룸 (BTC 예시 + 6개 변형 가이드)
- `README.md`: 인덱스·우선순위·체크리스트

각 의뢰서는 ASCII 와이어프레임 + 섹션 명세 + 더미 데이터 + Stitch 지시문 + 회피 사항(풀스크린 히어로·큰 카드·그라디언트·다크 프리미엄 폐기)을 포함.

**결론**: 사용자가 Stitch에 의뢰 가능한 상태로 의뢰서 완비.

### 토픽 4: Git 1차 커밋·푸시 (세션 6 종료 시점에는 미실행)

세션 6에서는 문서만 작성했으므로 미커밋 상태로 일시 보관. 사용자가 Stitch 반환 시안을 받아 `docs/design-brief/stitch_attachment_file_checker/`에 정리한 뒤 세션 7로 이어짐.

### 토픽 5: Stitch 시안 분석 (세션 7 진입)

> **사용자**: "stitch_attachment_file_checker 확인하고 적용 계획 수립." (Plan Mode)

폴더 구조 직접 확인:
- `_1`~`_5/`, `btc/` 6개 폴더 (각각 `code.html` + `screen.png`)
- `data_dense_utility/DESIGN.md`: Stitch 디자인 시스템 출력
- `00_overview.md` ~ `05_coin_room.md`: 사용자가 정제한 의뢰서

HTML 직접 검사로 시안→페이지 매핑 확정 (Explore 에이전트의 초기 매핑에 일부 오류가 있어 정정):

| 시안 | 페이지 | HTML title/h2 |
|-----|-------|---------|
| `_4` | **홈** | `ChartMaster Community` |
| `_3` | **게시판 리스트** | `Free Board` |
| `_2` | **게시글 상세** | `BTC/USDT Critical Support...` |
| `_5` | **작성 폼** | `New Post` |
| `_1` | **뉴스** | `News Dashboard - ChartMaster` |
| `btc` | **코인룸** | `Bitcoin (BTC) Coin Room` |

`DESIGN.md`의 핵심 토큰: Primary `#0050CB`(블루) + Secondary `#006E2E`(네이버 그린) + Material 3 surface 시스템 + Noto Sans KR. 시안 HTML 검사 중 미국식 색상 사용(`bg-secondary`=Bullish 그린, `bg-error`=Bearish 빨강)이 우리 한국식 결정과 정반대임을 확인 → 컴포넌트 작성 시 한국식(빨=호재, 파=악재)으로 강제 적용.

**결론**: 6개 시안 모두 의뢰 페이지와 정확히 매칭. 디자인 토큰 그대로 채택 가능, 단 시맨틱 컬러는 한국식으로 재배치.

### 토픽 6: 적용 계획 수립 (Plan Mode)

3가지 핵심 결정을 사용자에게 받음:
- **컬러 테마**: 시안대로 (Primary 블루 + Secondary 그린)
- **라이트/다크 정책**: **전체 사이트 라이트 통일** (다크 프리미엄 톤 폐기) — 큰 결정
- **1차 구현 범위**: 디자인 토큰 + 공통 컴포넌트 + 더미 데이터 페이지 5개 (DB·API는 다음 세션)

5단계 실행 계획 수립 후 Plan 파일 저장(`C:\Users\smart\.claude\plans\f-11-dev-260510-docs-design-brief-stitch-spicy-pnueli.md`). ExitPlanMode → 사용자 승인.

**결론**: 라이트 통일 결정으로 인해 다음 세션(8)에서 기존 25페이지 라이트화 작업이 필수가 됨. 본 세션은 신규 페이지·공통 컴포넌트만 처리.

### 토픽 7: Step 1 — 디자인 토큰 + 폰트 통합

`app/globals.css` 전면 교체:
- 기존 `--brand-main: 11 100% 60%` (오렌지 다크 톤) 폐기
- monet/vangogh/davinci 레거시 토큰 폐기
- Tailwind v4 `@theme` 디렉티브에 Stitch DESIGN.md의 YAML 토큰 등록
  - `--color-surface-container-lowest: #ffffff`, `--color-on-surface: #191b24` 등
  - 한국식 시맨틱: `--color-positive: #ba1a1a` (빨=호재), `--color-negative: #0050cb` (파=악재)
  - 시안에 등장한 `text-kr-up`/`text-kr-down` 호환 토큰 추가
  - 폰트 사이즈 토큰: `--text-h1` ~ `--text-meta` (font-size + line-height + font-weight 메타데이터 포함)
  - 라운드: `sm/md/lg/xl` 시안 값 그대로
- shadcn-ui 호환 alias (`--color-background`, `--color-foreground`, `--color-card` 등) 유지로 기존 페이지 빌드 깨지지 않게

`app/layout.tsx`: `Geist`/`Geist_Mono` → `Noto_Sans_KR` 교체, `lang="ko"`, body 클래스 라이트 톤(`bg-surface-container-lowest text-on-surface`).

**결론**: 시안 HTML의 `text-primary`, `bg-surface-container`, `font-h1 text-h1` 등 클래스가 React 컴포넌트에서 그대로 작동.

### 토픽 8: Step 2 — 공통 컴포넌트 13개

`components/community/`에 신규 폴더 생성:

베이스 (Step 2-1):
- `Badge.tsx`: HOT/NEW/공지/호재/악재/혼조/중립/primary/secondary/outline 10가지 variant
- `CommunityTabs.tsx`: underline·pill 두 variant, count 표시 옵션
- `Pagination.tsx`: 네이버식 10블록 페이지네이션, baseHref·onPageChange 양쪽 지원
- `SidebarWidget.tsx`: 위젯 컨테이너 (헤더·더보기 링크·noPadding 옵션)

행/카드 (Step 2-2):
- `BoardRow.tsx` + `BoardTableHeader`: 시안 `_3`의 `grid-cols-[60px_1fr_100px_80px_60px_60px]` 패턴, NEW/HOT/이미지/댓글수 인라인 뱃지
- `NewsRow.tsx`: 시간·태그·제목+감정점·매체·중요도·토론 6컬럼
- `NewsHeadlineCard.tsx`: 호재/악재/혼조/중립 4가지 (한국식 색)
- `CoinHero.tsx`: SVG 스파크라인 자동 생성 (`buildSparklinePath`), 한국식 빨/파 색

사이드바 위젯 (Step 2-3):
- `PriceTickerWidget.tsx` — 시세 8종
- `HotIssueWidget.tsx` — 실시간 검색어 (NEW/↑/↓/− 트렌드)
- `FngGaugeWidget.tsx` — SVG 반원 게이지 (5단계 색상)
- `OfficialPostsWidget.tsx` — 블로그 미니 리스트
- `ToolsShortcutWidget.tsx` — 도구 2x2 그리드 (lucide 아이콘)

헤더/푸터 (Step 2-4):
- `global-header.tsx`: 메뉴 5+2 구조 (베스트/자유/시세/정보/뉴스 + 코인룸▼/도구▼) + 검색 + 언어 토글 + 글쓰기 CTA, 모바일 햄버거 + 드롭다운
- `footer-section.tsx`: 라이트 톤, 커뮤니티/정보 2그룹 링크

**결론**: 모든 페이지가 공유할 컴포넌트 인벤토리 완성.

### 토픽 9: Step 3 — 더미 데이터 + 6개 페이지

`lib/community/`:
- `mock-posts.ts`: 게시판 3종 × 52글 (공지 2 + 일반 50), 익명/회원 혼용, 더미 댓글 5개. 헬퍼 함수: `getPost`, `getPostsByBoard`, `getBestPosts`, `getPostsForCoin`
- `mock-news.ts`: 20개 뉴스 + 카테고리·코인 필터 + `getHeadlines` (호재/악재/중립 균형)
- `mock-coins.ts`: 코인 6종(`btc/eth/xrp/sol/altcoin/kimp`) 상세 + 시세 10종 + 핫이슈 10개 + 공식글 3개

페이지 6개:
- `app/page.tsx` — 시세 마퀴 + 베스트30 + 뉴스10 + 게시판 3컬럼 + 코인룸 6카드 + 사이드바 5위젯
- `app/news/page.tsx` — 4차원 필터(코인/분류/감정/정렬) + 헤드라인 3분할 + 표 + "더 보기" + 코인별 뉴스 랭킹 사이드바
- `app/board/[slug]/page.tsx` — 카테고리 탭 + 정렬·검색 + 표 30줄 + 페이지네이션 (free/market/info 동일 템플릿, `notFound` 분기)
- `app/board/[slug]/[postId]/page.tsx` — 게시글 상세 (본문 dangerouslySetInnerHTML + 추천/비추 토글 + 댓글 작성 폼 + 댓글+대댓글 + 이전/다음 + 같은 게시판 미니 표)
- `app/board/[slug]/write/page.tsx` — 작성 폼 (게시판/카테고리 드롭다운 + 익명 닉네임/비번 + 제목 + TipTap 에디터 dynamic import + 태그 칩)
- `app/coin/[symbol]/page.tsx` — CoinHero + 5탭(전체/토론/뉴스/시세분석/공지) + 인기글/뉴스/토론 + 핵심 지표 사이드바 + AI 시그널 카드

**결론**: 시안과 시각적으로 매칭되는 더미 페이지 6개 완성. DB 연동은 다음 세션.

### 토픽 10: 빌드 검증 (블로커 처리 포함)

`npx tsc --noEmit` 1차 시도에서 `Cannot find module '@tiptap/react'`, `'vitest'` 등 누락 에러 다수. 원인: `node_modules` 일부 패키지 미설치 상태였음. `npm install`로 208 패키지 추가 후 재실행 → tsc 통과.

`npm run build` → 41개 라우트 정상 컴파일 (정적/동적 분류 적절). 새 라우트(`/board/[slug]`, `/board/[slug]/[postId]`, `/board/[slug]/write`, `/coin/[symbol]`)가 ƒ(dynamic)로 정상 등록. 리디자인된 `/`, `/news`도 ○(static)로 빌드.

**결론**: 빌드 통과. 다만 기존 다크 톤 페이지(`/analysis`, `/blog`, `/portfolio` 등)는 토큰이 라이트로 바뀌어 시각 회귀 발생 가능 — Step 4(다음 세션) 작업 대상.

### 토픽 11: 커밋·푸시

> **사용자**: "commit all changes including not related this session. and push."

56개 파일 (`+9,917 / −656`)을 단일 커밋으로 묶음. 커밋 메시지에 세션 6과 7의 작업을 모두 명시. `a79fe24` 커밋 생성 후 `git push origin main` 성공 (`f8c24e0..a79fe24`).

**결론**: 원격 동기화 완료.

## 의사결정 요약

| # | 결정 | 선택지 | 선택 이유 |
|---|------|--------|----------|
| 1 | 정보 공유 주체 = 유저 커뮤니티 | 큐레이션 / 커뮤니티 / 하이브리드 | 사용자가 명시적으로 코인판식 채택 |
| 2 | AI 분석 = 부가 기능 | 메인 유지 / 부가 / 동등 | 정체성을 정보 공유로 명확화 |
| 3 | 뉴스 분류 = 룰베이스 | AI API / 룰베이스 / 하이브리드 | 비용·복잡도 회피, "AI처럼 보이는" 코드 로직 |
| 4 | 디자인 톤 = 네이버 스타일 | ChartMaster 유지 / 코인판 / 모던 / 새 톤 | 한국 사용자 친숙성 + 정보 밀도 |
| 5 | 작성 권한 = 익명+회원 혼용 | 회원 의무 / 코인판식 / 회원만 | 진입장벽 낮춤, 코인판 모델 차용 |
| 6 | MVP = 메인+게시판+뉴스+코인룸 | 단계별 vs 전체 | 사용자가 4가지 모두 다중 선택 |
| 7 | 컬러 = 시안대로 블루+그린 | 블루 유지 / 그린 변경 / 후조정 | Stitch 결정을 그대로 채택 (그린은 secondary 액센트) |
| 8 | 톤 = 전체 라이트 통일 | 라우트 그룹 분리 / 통일 / 토글 | 일관성 최우선, 다크 톤 기존 자산 폐기 |
| 9 | 1차 범위 = 컴포넌트 + 더미 페이지 | 토큰만 / 컴포넌트+더미 / DB까지 | 단일 세션 작업량 적정 + DB는 별도 사이클 |
| 10 | 메뉴 = 의뢰서 5+2 (시안 4 거부) | 시안 단순 / 의뢰서 5+2 / 절충 | 의뢰서가 정보 풍부 (Plan에 명시) |

## 수정 파일 (56개)

### 신규 (47개)

| 분류 | 파일 |
|------|------|
| 방향성 문서 | `docs/PROJECT_DIRECTION.md` |
| 의뢰서 (7개) | `docs/design-brief/{00-overview,01-home,02-board-list,03-post-detail-write,04-news,05-coin-room,README}.md` |
| Stitch 반환물 (18개) | `docs/design-brief/stitch_attachment_file_checker/` 하위 (HTML 6, PNG 6, MD 6) |
| 페이지 (4개) | `app/board/[slug]/page.tsx`, `app/board/[slug]/[postId]/page.tsx`, `app/board/[slug]/write/page.tsx`, `app/coin/[symbol]/page.tsx` |
| 컴포넌트 베이스 (4개) | `components/community/{Badge,CommunityTabs,Pagination,SidebarWidget}.tsx` |
| 행/카드 (4개) | `components/community/{BoardRow,NewsRow,NewsHeadlineCard,CoinHero}.tsx` |
| 사이드바 위젯 (5개) | `components/community/widgets/{PriceTicker,HotIssue,FngGauge,OfficialPosts,ToolsShortcut}Widget.tsx` |
| 더미 데이터 (3개) | `lib/community/mock-{posts,news,coins}.ts` |

### 수정 (8개)

| # | 파일 | 변경 내용 |
|---|------|-----------|
| 1 | `app/globals.css` | 다크 토큰 + monet/vangogh/davinci 레거시 폐기, Material 3 라이트 토큰 + 한국식 빨/파 + Stitch 폰트 스케일 신규 |
| 2 | `app/layout.tsx` | Geist → Noto Sans KR, lang ko, 라이트 톤 body |
| 3 | `app/page.tsx` | 홈 전면 리디자인 (시세 마퀴 + 베스트30 + 뉴스 + 게시판 3컬럼 + 코인룸) |
| 4 | `app/news/page.tsx` | 4차원 필터 + 헤드라인 3분할 + 표로 리디자인 |
| 5 | `components/global-header.tsx` | 메뉴 5+2 구조 + 라이트 톤 + 글쓰기 CTA |
| 6 | `components/footer-section.tsx` | 라이트 톤 + 커뮤니티/정보 그룹 |
| 7 | `CLAUDE.md` | 풀뿌리 트리에 PROJECT_DIRECTION.md, design-brief/ 등록 |
| 8 | `docs/status/current.md` | 세션 6, 7 진행 상태 반영 |

## 상세 변경 사항

### 1. 디자인 토큰 시스템 (Tailwind v4 @theme)

`app/globals.css`에서 핵심 토큰 그룹 8가지를 정의:
1. Surface (배경 8단계 — `surface-container-lowest` ~ `surface-container-highest`)
2. On-surface (텍스트 — `on-surface`, `on-surface-variant`)
3. Outline (보더 — `outline`, `outline-variant`)
4. Primary (블루 계열 — fixed/dim 변형 포함)
5. Secondary (그린 계열)
6. Tertiary/Error
7. 한국식 시맨틱 (`positive`/`negative`/`mixed`/`neutral` + `kr-up`/`kr-down` + `hot`/`new`/`notice`)
8. shadcn-ui 호환 alias (기존 페이지 보호)

타이포 토큰(`--text-h1` ~ `--text-meta`)은 Tailwind v4 형식으로 작성하여 `text-h1` 클래스 적용 시 font-size + line-height + font-weight가 한 번에 적용되도록.

### 2. 익명+회원 혼용 작성 권한 모델 (UI 단)

작성 페이지 `app/board/[slug]/write/page.tsx`:
- `postAsAnonymous` 체크박스로 토글 (기본 ON)
- 익명 시: 닉네임(2~12자) + 비밀번호(4자 이상) 필드 표시
- 회원 시: 자동 닉네임 사용 (다음 세션 Supabase Auth 연동)

게시글 행/상세에서 표시:
- 회원: 닉네임 (`isAdmin`이면 🛡)
- 익명: 닉네임 + `(211.34.*.*)` 형식 IP 마스킹 (앞 2옥텟만)

DB 스키마 매핑은 다음 세션 마이그레이션에서:
```sql
author_id (uuid, nullable, FK profiles)
guest_nickname (text, nullable)
guest_password_hash (text, nullable)
guest_ip_masked (text, nullable)
```

### 3. CoinHero 스파크라인 SVG 자동 생성

`components/community/CoinHero.tsx`의 `buildSparklinePath` 함수:
```ts
function buildSparklinePath(values: number[]): string {
  if (values.length < 2) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = 100 / (values.length - 1);
  return values.map((v, i) => {
    const x = i * stepX;
    const y = 30 - ((v - min) / range) * 30;
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");
}
```
- 0~100 viewBox, 자동 정규화
- 색상은 `changePct >= 0 ? "#BA1A1A" : "#0050CB"` (한국식)
- mock-coins.ts의 `sparkUp`/`sparkDown`/`sparkSide` 더미 배열로 코인별 시각화

### 4. 한국식 빨/파 강제 (시안 미국식 → 한국식 재배치)

시안 HTML에서 `bg-secondary text-on-secondary` (그린)이 Bullish, `bg-error` (빨강)이 Bearish로 사용된 것을 발견. 우리 한국식 결정과 정반대.

`components/community/NewsHeadlineCard.tsx`의 `SENTIMENT_STYLE`:
```ts
positive: { badgeClass: "bg-[var(--color-positive)] text-white", ... }, // 빨강
negative: { badgeClass: "bg-[var(--color-negative)] text-white", ... }, // 파랑
```

`var(--color-positive) = #ba1a1a` (빨)이 호재, `var(--color-negative) = #0050cb` (파)가 악재. 시안의 미국식 색상 배치는 채택하지 않음.

### 5. 메뉴 구조 5+2 (시안 4 거부)

시안 헤더는 단순 4개(`Board / Market Talk / Info / News`)였으나 `components/global-header.tsx`에서는 의뢰서대로 채택:
- 1차 5개: 베스트(`/`) / 자유게시판(`/board/free`) / 시세토론(`/board/market`) / 정보공유(`/board/info`) / 뉴스(`/news`)
- 2개 드롭다운: 코인룸▼ (BTC/ETH/XRP/SOL/알트/김프), 도구▼ (차트분석/AI시그널/마켓무드/캘린더/워치리스트/보안메모)
- 우측: 검색 / 언어 / 로그인 / **글쓰기 CTA** (브랜드 블루)

이유: 의뢰서가 정보 풍부 (Plan §7 블로커 #3 명시).

## 검증 결과

- `npx tsc --noEmit` — 통과 (0 에러)
- `npm run build` — 통과 (41개 라우트, Turbopack)
- `npm run lint` — 신규 코드 0 에러, 0 경고. 기존 `scripts/` 파일들의 `any`/`require` 경고는 알려진 항목 (current.md에 명시).
- 시각 검증: 다음 세션 Step 4 라이트화 완료 시 `npm run dev`로 시안 PNG와 비교 예정

## 터치하지 않은 영역

이번 세션은 **신규 라우트와 공통 컴포넌트**에 집중했고 다음 영역은 변경하지 않음:

- `app/analysis/*`, `app/signal/*`, `app/market/*`, `app/stock/*`, `app/stock-market/*` — AI 분석 도구 페이지 (다크 톤 유지, 도구 드롭다운으로만 격리)
- `app/portfolio`, `app/watchlist`, `app/calendar`, `app/secure-memo`, `app/settings`, `app/contact`, `app/terms`, `app/privacy`, `app/history` — 다크 톤 유지
- `app/admin/*` — 어드민 페이지
- `app/blog/*`, `app/api/blog/*` — 블로그 (다크 톤 유지, 다음 세션 라이트화 우선순위 1)
- `app/auth/*` — 인증 페이지
- `app/api/*` — 모든 기존 API 라우트
- `lib/analysis.ts`, `lib/indicators.ts`, `lib/fractal_engine.ts`, `lib/signal_engine.ts`, `lib/probability/*`, `lib/backtest/*` — 핵심 비즈니스 로직 한 줄도 안 건드림
- `supabase/migrations/*`, `lib/supabase/*` — DB 스키마·SSOT 미수정 (커뮤니티 테이블은 다음 세션)

## 알려진 이슈

1. **다크 톤 페이지 시각 회귀 가능성**: 디자인 토큰을 라이트로 통일했으므로 기존 25페이지가 색깔이 부분적으로 어색하게 표시될 수 있음. 빌드는 통과하지만 시각적으로 깨짐. **다음 세션 Step 4의 우선순위 1**.
2. **TradingView Lightweight Charts**: 다크 톤 차트 옵션이 라이트에 어울리지 않음. `lib/chart/theme.ts` 신규 파일로 light/dark 옵션 분리 필요.
3. **BlogEditor `prose-invert`**: TipTap 에디터가 여전히 다크 톤. 작성 페이지에서 입력 시 텍스트가 잘 안 보일 수 있음. props로 `tone` 옵션 추가 필요.
4. **Material Symbols 폰트**: Stitch 시안 HTML이 Material Symbols 아이콘을 사용하지만 우리는 lucide-react로 교체. 누락된 아이콘이 있으면 시각 차이 발생 가능.
5. **번역 키 일부 미추가**: `lib/translations.ts`의 `menu` 키에 `best`, `boardFree`, `boardMarket`, `boardInfo` 등이 없어서 헤더 컴포넌트가 인라인 한/영 분기 사용 중. 다음 세션에서 정리.
6. **`/history` 메뉴 미배치**: 기존 페이지지만 신규 메뉴 5+2에 들어가지 않음. 도구 드롭다운 추가 또는 폐기 결정 필요.
7. **다음 세션 작업량 큼**: Step 4 라이트화 25페이지 + DB 마이그레이션 + API + 룰베이스 분류는 1세션에 다 어려움. 분할 권장.

## 다음 작업 제안

### 세션 8 (권장: 라이트화)
- **Step 4-1 (필수)**: `/blog`, `/blog/[slug]`, `/blog/category/[category]`, `/blog/tag/[tag]` 라이트화 + BlogEditor `prose-invert` 제거
- **Step 4-2 (높음)**: `/analysis`, `/analysis/[symbol]`, `/analysis/stock`, `/analysis/stock/[symbol]`, `/signal`, `/market` 라이트화 + 차트 라이트 테마 (`lib/chart/theme.ts`)
- 번역 키 정리 (`lib/translations.ts`)

### 세션 9 (백엔드)
- DB 마이그레이션: `community_boards`, `community_posts`, `community_comments`, `community_post_likes`
- 익명 비번 해싱 (`lib/community/auth.ts`)
- IP 마스킹 미들웨어 (`middleware.ts` 또는 API 단)
- API 라우트: `/api/board/[slug]`, `/api/board/[slug]/[postId]`, `/api/board/[slug]/write`, `/api/community/comment`, `/api/community/like`
- 더미 데이터(`lib/community/mock-*`) → Supabase 연동

### 세션 10 (뉴스 강화)
- 룰베이스 분류 (`lib/news/classifier.ts`, `lib/news/keyword-dict.ts`)
- `news` 테이블 컬럼 추가 (`category`, `importance_score`)
- `app/api/admin/news-crawl/route.ts`에 분류 호출 통합

### 검증 체크리스트 (Step 4 완료 시)
- [ ] 시안 PNG와 실제 페이지 시각 비교 (`docs/design-brief/stitch_attachment_file_checker/_*/screen.png`)
- [ ] Playwright MCP로 6개 신규 페이지 스크린샷 자동 캡처
- [ ] 모바일 뷰포트 확인 (햄버거·FAB·1단 레이아웃)
- [ ] 한국식 빨/파 색상 검증

## 참조

- 방향성 문서: [`docs/PROJECT_DIRECTION.md`](../PROJECT_DIRECTION.md)
- 의뢰서: [`docs/design-brief/README.md`](../design-brief/README.md)
- Stitch 시안: `docs/design-brief/stitch_attachment_file_checker/`
- Plan 파일: `C:\Users\smart\.claude\plans\f-11-dev-260510-docs-design-brief-stitch-spicy-pnueli.md`
- 작업 로그: [`docs/logs/2026-05.md`](../logs/2026-05.md)
- 커밋: `a79fe24`

---
[← 이전: session5-editor-upgrade](./2026-03-08-session5-editor-upgrade.md)
