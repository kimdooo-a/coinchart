# T02 — 게시판 3종 SSR 전환 + 새 메타 적용

> **본 터미널은 R3 일꾼(T02 / 12)**. Wave 2 (T01 메타 SSOT 후 발사 권장. 미완 시 mock re-export로 lazy 진행 가능).

## 1. 컨텍스트

- 프로젝트: Crypto Chart Analysis (v2.0 커뮤니티 — 네이버 톤, 빨↑/파↓)
- 작업 디렉토리: `F:\11_dev\260523 코인 차트분석`
- 본 터미널 역할: **T02 / 12** — 게시판 3종(`/board/[slug]` 목록·`/board/[slug]/[postId]` 상세·`/board/[slug]/write` 작성)을 **`"use client"` 클라 fetch → SSR**로 전환하고 정적 메타를 `board-meta.ts`로 교체
- 라운드: R3 (community-finish)

배경: R2-T01에서 게시판은 `"use client"` + `board-queries.ts` 클라 fetch로 실데이터화됐다. R3는 **SEO 강화를 위해 SSR로 전환**한다. 목록/상세는 서버에서 초기 데이터를 렌더하고, 인터랙션(정렬/검색/페이지·추천/댓글/삭제 액션)은 `searchParams` 또는 클라이언트 하위 컴포넌트로 분리한다. **참고 패턴: R1/T15가 메인페이지를 SSR로 전환한 `lib/community/queries.ts`(`fetchMainPageData`) + 변환 헬퍼** 방식.

## 2. 공통 SOT (읽기 전용)

```
CLAUDE.md  ·  docs/PROJECT_DIRECTION.md
docs/handover/2026-05-23-R1-T15-mainpage-realdata.md   ← SSR + 서버 fetch + 변환헬퍼 패턴 (필독)
docs/handover/2026-05-23-R2-T01-board-realdata.md      ← 현 클라 fetch 구조 + API 계약표 (필독)
docs/references/_API_REFERENCE.md                       ← 커뮤니티 API 섹션
lib/community/board-meta.ts        ← T01 산출 (BOARD_META 새 SSOT). 없으면 mock-posts re-export
lib/community/board-queries.ts     ← 현 클라 fetch 래퍼 (SSR용으로 조정 대상)
app/board/[slug]/page.tsx          ← 목록 (수정 대상)
app/board/[slug]/[postId]/page.tsx ← 상세 (수정 대상)
app/board/[slug]/write/page.tsx    ← 작성 (수정 대상)
```

## 3. 작업 목표

### Phase 1: 데이터 레이어 (서버용)
- `board-queries.ts`에 **서버 사이드 fetch** 함수 추가/조정 (R1/T15 `queries.ts` 처럼 supabase 서버 클라이언트 또는 절대 URL fetch + `next.revalidate`). 기존 클라 fetch 래퍼는 인터랙션용으로 보존 가능.

### Phase 2: 목록 SSR (`/board/[slug]`)
- 서버 컴포넌트로 전환: `searchParams`(page/sort/search/category)를 읽어 서버에서 초기 목록 fetch → 렌더
- 정렬/검색/페이지 UI는 클라이언트 하위 컴포넌트(`searchParams` 갱신) 또는 `<form>` GET. JSX·디자인 토큰 보존
- `BOARD_META`는 `board-meta.ts`에서 import

### Phase 3: 상세 SSR (`/board/[slug]/[postId]`)
- 서버에서 글+댓글 초기 로드 (view_count +1은 기존 API 동작 유지)
- 추천/비추·댓글 작성·삭제 **액션은 클라이언트 하위 컴포넌트**로 분리 (`POST /api/community/like`·`comment`, `DELETE`)
- `generateMetadata`로 글 제목·요약 메타 추가 (SEO)

### Phase 4: 작성 (`/board/[slug]/write`)
- 폼은 본질적으로 인터랙티브 → 클라이언트 유지 허용. 단 `BOARD_META`는 새 경로 import

## 4. 도구 권장
- 직접 작성. SSR/CSR 경계는 Next.js 16 App Router 규약 (서버 컴포넌트 기본 + `"use client"` 하위 분리).

## 5. 의존성
- **dep T01** (board-meta.ts). 미완 시 `mock-posts`의 re-export로 lazy 진행 가능.
- 후행 T05가 mock 참조 0 확인 후 삭제 → **본 터미널은 board에서 mock-coins/mock-posts import를 전부 제거**해야 T05가 진행 가능.

## 6. 검증

```powershell
npx tsc --noEmit
# board에서 mock import 0 (BOARD_META는 board-meta 경유)
Select-String -Path app/board/**/*.tsx -Pattern "lib/community/mock-"   # 기대: 0건
# SSR 렌더 모드 확인 (build 출력에서 /board/[slug] 가 ƒ 또는 ○)
npm run build 2>&1 | Select-Object -Last 25
```

```bash
npx tsc --noEmit
grep -rn "lib/community/mock-" app/board/    # 기대: 0건
npm run build 2>&1 | tail -25
```

시각 검증(권장): `npm run dev` → `/board/free` 목록 정렬/검색/페이지, 상세 추천/댓글, 작성 흐름.

## 7. 완료 신호
`docs/handover/2026-05-24-R3-T02-board-ssr.md` 작성. 명시: SSR 전환 범위·서버/클라 경계·searchParams 설계·`generateMetadata`·mock import 제거 확인·렌더 모드(빌드 출력)·시각 검증.

## 8. 안티패턴
- ❌ `app/news/`·`app/coin/`·`app/page.tsx` 수정 (T03·T04 영역)
- ❌ `app/api/` 수정 (T06~T08 영역 — 기존 API 그대로 호출만)
- ❌ `lib/community/mock-*.ts` 삭제 (T05 영역). board에서 **import만 제거**
- ❌ JSX/디자인 무차별 변경 (데이터 흐름·렌더 모드만 전환)
- ❌ 새 패키지 무단 설치 / 한국어 주석 누락
