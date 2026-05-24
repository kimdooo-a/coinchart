# T03 — 뉴스 페이지 SSR 전환 + 새 메타 적용

> **본 터미널은 R3 일꾼(T03 / 12)**. Wave 2 (T01 메타 SSOT 후 발사 권장. 미완 시 mock re-export로 lazy 진행).

## 1. 컨텍스트

- 프로젝트: Crypto Chart Analysis (v2.0 커뮤니티 — 네이버 톤, 빨↑/파↓)
- 작업 디렉토리: `F:\11_dev\260523 코인 차트분석`
- 본 터미널 역할: **T03 / 12** — `/news`를 **`"use client"` 클라 fetch → SSR**로 전환하고 `NEWS_CATEGORIES`/`COIN_FILTERS`를 `news-meta.ts`로 교체
- 라운드: R3 (community-finish)

배경: R2-T02에서 `/news`는 `"use client"` + `news-queries.ts` 클라 fetch(목록·헤드라인=`/api/news` 4차원 필터, 사이드바=ticker/hot/fng/blog)로 실데이터화됐다. R3는 **SEO 강화를 위해 SSR로 전환**한다. 초기 목록·헤드라인은 서버 렌더, 4차원 필터(코인/카테고리/감정/정렬)는 `searchParams` 또는 클라 하위 컴포넌트. **참고: R1/T15 SSR 패턴**.

## 2. 공통 SOT (읽기 전용)

```
CLAUDE.md  ·  docs/PROJECT_DIRECTION.md
docs/handover/2026-05-23-R1-T15-mainpage-realdata.md   ← SSR + 서버 fetch 패턴 (필독)
docs/handover/2026-05-23-R2-T02-news-realdata.md       ← 현 클라 fetch + 4차원 필터 구조 (필독)
docs/references/_API_REFERENCE.md                       ← GET /api/news 섹션
lib/community/news-meta.ts        ← T01 산출 (NEWS_CATEGORIES/COIN_FILTERS 새 SSOT). 없으면 mock-news re-export
lib/community/news-queries.ts     ← 현 클라 fetch 래퍼 (SSR용 조정 대상)
app/news/page.tsx                 ← 수정 대상
```

## 3. 작업 목표

### Phase 1: 데이터 레이어 (서버용)
- `news-queries.ts`에 서버 사이드 fetch 추가/조정 (서버 클라이언트 또는 절대 URL fetch + `next.revalidate`). 감정·정렬은 서버 위임 가능 시 위임, 클라 useMemo 잔존분은 하위 컴포넌트.

### Phase 2: 목록·헤드라인 SSR (`/news`)
- 서버 컴포넌트로 전환: `searchParams`(query/category/sentiment/sort)를 읽어 서버에서 초기 `/api/news` 결과 + 헤드라인 fetch → 렌더
- 4차원 필터 UI는 클라이언트 하위 컴포넌트(searchParams 갱신) 또는 `<form>` GET. JSX·디자인 토큰 보존
- 사이드바 위젯(ticker/hot/fng/blog)도 서버 초기 fetch 권장 (가능하면). `NEWS_CATEGORIES`/`COIN_FILTERS`는 `news-meta.ts` import
- `generateMetadata`로 뉴스 페이지 메타 (SEO)

## 4. 도구 권장
- 직접 작성. Next.js 16 App Router 서버/클라 경계 규약 준수.

## 5. 의존성
- **dep T01** (news-meta.ts). 미완 시 `mock-news` re-export로 lazy 진행.
- 후행 T05가 mock 참조 0 확인 후 삭제 → **news에서 mock import 전부 제거** 필수.

## 6. 검증

```powershell
npx tsc --noEmit
Select-String -Path app/news/page.tsx -Pattern "lib/community/mock-"   # 기대: 0건
npm run build 2>&1 | Select-Object -Last 25                            # /news 렌더 모드 확인
```

```bash
npx tsc --noEmit
grep -n "lib/community/mock-" app/news/page.tsx     # 기대: 0건
grep -n "/api/news" app/news/page.tsx               # 기대: ≥1
npm run build 2>&1 | tail -25
```

시각 검증(권장): `npm run dev` → `/news` 4차원 필터·헤드라인·사이드바.

## 7. 완료 신호
`docs/handover/2026-05-24-R3-T03-news-ssr.md` 작성. 명시: SSR 전환 범위·서버/클라 경계·searchParams 필터 설계·`generateMetadata`·mock import 제거·렌더 모드.

## 8. 안티패턴
- ❌ `app/board/`·`app/coin/`·`app/page.tsx` 수정 (T02·T04 영역)
- ❌ `app/api/` 수정 (기존 `/api/news` 호출만)
- ❌ `lib/community/mock-*.ts` 삭제 (T05). news에서 **import만 제거**
- ❌ JSX/디자인 무차별 변경 / 필터 동작 회귀
- ❌ 새 패키지 무단 설치 / 한국어 주석 누락
