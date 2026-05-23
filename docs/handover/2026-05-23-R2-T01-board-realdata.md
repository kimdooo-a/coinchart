# 인수인계서 — R2 / T01 board-realdata

> 작성일: 2026-05-23
> 라운드: R2 (realdata-finish)
> 일꾼: T01
> 상태: **PASS** (게시판 3종 mock → T12 실데이터 전환 + 사이드바 위젯 실데이터화 완료)

---

## 1. 작업 요약

게시판 3종 페이지(목록 `/board/[slug]` · 상세 `/board/[slug]/[postId]` · 작성 `/board/[slug]/write`)를
`lib/community/mock-posts.ts`(MOCK_POSTS/MOCK_COMMENTS/getPost) + `mock-coins.ts`(사이드바) 의존에서
**T12 board/community API 클라이언트 fetch**로 전환. 세 페이지 모두 `"use client"`이므로 클라 `fetch()`로
서버에 정렬·검색·페이지네이션을 위임. JSX·디자인 토큰은 보존, 데이터 소스만 교체.

사이드바(시세/핫이슈/FNG/공식글)도 mock-coins 의존을 제거하고 `/api/coins/ticker`·`/api/coins/hot-issues`·
`/api/fng`·`/api/blog` 실데이터로 전환. 공용 `<BoardSidebar />` 클라 컴포넌트로 추출.

## 2. 산출물

### 신규 파일 (2)
- **`lib/community/board-queries.ts`** — 클라 fetch 래퍼 + row(snake_case)→props 매퍼. 게시판 페이지의 모든 T12·사이드바 API 호출을 중앙화(페이지 비대화 방지).
- **`components/community/BoardSidebar.tsx`** — 목록/상세 공용 사이드바(`"use client"`). 4개 위젯을 독립 fetch로 실데이터화, 실패 위젯은 조용히 숨김. `showTools` prop으로 도구 단축 위젯 토글(목록=true, 상세=false).

### 수정 파일 (3)
- **`app/board/[slug]/page.tsx`** — 목록. `MOCK_POSTS`/클라 필터·정렬·페이지 → `fetchBoardList()`(서버 위임). 로딩·에러·빈 상태 처리. 검색 300ms 디바운스. 사이드바 → `<BoardSidebar />`.
- **`app/board/[slug]/[postId]/page.tsx`** — 상세. `getPost`/`MOCK_COMMENTS` → `fetchBoardPost()`. 추천/비추 → `togglePostLike()`, 댓글 등록 → `createComment()`, 삭제 → `deleteBoardPost()`. 이전/다음·다른 글은 `fetchBoardList()`(최신 30)에서 도출. 사이드바 → `<BoardSidebar showTools={false} />`.
- **`app/board/[slug]/write/page.tsx`** — 작성. 더미 `setTimeout` → `createBoardPost()`. 성공 시 작성 글 상세(`/board/{slug}/{uuid}`)로 라우팅. 회원/익명 분기(닉네임·비번)는 기존 폼 그대로 사용.

## 3. API 매핑표 (UI 액션 → T12/사이드바 엔드포인트)

| UI | board-queries 함수 | 호출 |
|---|---|---|
| 목록 로드 | `fetchBoardList(slug, opts)` | `GET /api/board/{slug}?page=&limit=30&sort=&search=&category=` → `{ notices, posts, total, page, limit }` |
| 상세 로드 | `fetchBoardPost(slug, postId)` | `GET /api/board/{slug}/{postId}` → `{ post, comments }` |
| 글 작성 | `createBoardPost(slug, input)` | `POST /api/board/{slug}` → `{ id }` (201) |
| 댓글 등록 | `createComment(input)` | `POST /api/community/comment` → `{ comment }` (201) |
| 추천/비추 | `togglePostLike(postId, 1\|-1)` | `POST /api/community/like` → `{ liked, likeCount }` |
| 글 삭제 | `deleteBoardPost(slug, postId, pwd?)` | `DELETE /api/board/{slug}/{postId}?guestPassword=` → `{ ok }` |
| 사이드바 시세 | `fetchSidebarTickers()` | `GET /api/coins/ticker` → `{ tickers: CoinTicker[] }` |
| 사이드바 핫이슈 | `fetchSidebarHotIssues()` | `GET /api/coins/hot-issues` → `{ items }` |
| 사이드바 FNG | `fetchSidebarFng()` | `GET /api/fng` → `{ value, prevValue }` |
| 사이드바 공식글 | `fetchSidebarOfficialPosts()` | `GET /api/blog?limit=3` → `{ posts }` |

- **정렬 키 매핑**(`SORT_MAP`): 페이지 `latest→recent`, `popular→popular`, `comments→comments`, `views→views`
- **slug 화이트리스트**: `free`, `market`, `info` (페이지 `VALID_SLUGS` + API 검증 이중)

### 검증 grep 관련 메모
`grep "/api/board/" app/board/`는 **0건**입니다. 모든 fetch 호출은 산출물 정의대로 `lib/community/board-queries.ts`에 중앙화했기 때문(orchestration "클라 fetch 래퍼" 지시 준수). API wiring은 `grep -n "/api/" lib/community/board-queries.ts`로 확인(12+건).

## 4. 변환 헬퍼 (board-queries.ts)

snake_case DB row → 컴포넌트 props 매퍼:
- `toBoardListItem(row)` → `BoardListItem`(= `BoardPost` + `uuid`). `id`(number)는 표시용 placeholder, **라우팅·React key는 `uuid`(실제 UUID)** 사용. 목록 No 컬럼은 `number`에 `total - offset - index` 시퀀스 주입(최신순 기준, 다른 정렬은 근사 표시값).
- `toBoardPostDetail(row)` → `BoardPostDetail`(id=UUID, contentHtml, tags 등).
- `toBoardComment(row)` → `BoardCommentItem`(id=UUID, parentId, content, likes).
- 공통: `maskedIpToShort("211.34.*.*"→"211.34")`(BoardRow가 `(앞2옥텟.*.*)`로 표시), `relativeTime(iso→"3시간전")`.
- 작성자 표시: 회원 글은 `"회원"`(T12 API가 프로필명 미노출), 익명 글은 `guest_nickname ?? "익명"`.
- `isAdmin`은 항상 `false`(T12 API 운영자 플래그 미노출).

## 5. Fallback (전체 페이지 깨짐 방지)

- **목록**: `loading`(불러오는 중) / `error`(에러 메시지) / 빈 목록("첫 글 작성") 3분기. fetch 실패 시 notices/posts/total을 빈 값으로 리셋.
- **상세**: `loading`/`error`/`!post` 시 전용 화면(목록 링크 제공)으로 조기 반환. 추천·댓글·삭제 액션 실패는 `alert`로 통지(페이지 유지).
- **사이드바**: 4개 위젯 각각 독립 fetch + `.catch(()=>undefined)`. 데이터 없거나 실패한 위젯은 렌더 생략(나머지 위젯은 정상 표시). 외부 API(시세/FNG) 장애가 사이드바 전체나 본문을 막지 않음.
- `useEffect` 데이터 로드는 `alive` 플래그로 언마운트 후 setState 방지.

## 6. mock import 잔여 (BOARD_META 보존 사유)

`grep "@/lib/community/mock-" app/board/` 결과 — **`BOARD_META`/`type BoardSlug`만** 잔존 (3개 페이지 각 1줄):
```
app/board/[slug]/page.tsx:          import { BOARD_META, type BoardSlug } from "@/lib/community/mock-posts";
app/board/[slug]/[postId]/page.tsx: import { BOARD_META, type BoardSlug } from "@/lib/community/mock-posts";
app/board/[slug]/write/page.tsx:    import { BOARD_META, type BoardSlug } from "@/lib/community/mock-posts";
```
- **`BOARD_META`**: 게시판 이름·이모지·설명·**카테고리 목록**은 정적 메타(mock 데이터 아님). 탭/카테고리 select/헤더에 사용. DB로 옮길 성질이 아니어서 보존(orchestration 지시).
- **`mock-coins`(TICKER_LIST/HOT_ISSUES/OFFICIAL_POSTS) import 완전 제거** ✓ (사이드바 실데이터화로 의존 소멸).
- `MOCK_POSTS`/`MOCK_COMMENTS`/`getPost` import **완전 제거** ✓.
- **삭제 금지 준수**: `mock-posts.ts`·`mock-coins.ts` 파일 자체는 미삭제(타 페이지/일꾼 의존 — 지휘자 일괄 정리 예정).

## 7. 검증 결과

| 게이트 | 결과 |
|---|---|
| `npx tsc --noEmit` (내 파일) | **0 error** (board 3종 + board-queries + BoardSidebar) |
| `npx tsc --noEmit` (전체) | app/page.tsx를 커밋 HEAD로 두면 **0 error** — 전 코드베이스에서 내 신규 파일 타입 정합 확인 |
| `npx eslint` (내 파일 5종) | **exit 0** (React19 `set-state-in-effect` 대응: 동기 setState를 내부 async 함수로 이동, page 리셋을 이벤트 핸들러로 이동) |
| `grep "@/lib/community/mock-" app/board/` | **BOARD_META만** (3건) ✓ |
| `grep "/api/" lib/community/board-queries.ts` | T12 6종 + 사이드바 4종 모두 존재 ✓ |
| `npm run build` | **Compiled successfully** — `/board/[slug]`, `/board/[slug]/[postId]`, `/board/[slug]/write` 3 라우트 정상 등록 ✓ |

> 참고: 본 작업은 다중 R2 일꾼이 공유하는 working tree에서 진행. 검증 시점 `app/page.tsx`는 병렬 **T05**(차트/메인 영역, 내 안티패턴상 수정 금지)의 중간 편집 상태였으나, 빌드 시점엔 정상화되어 통합 빌드 성공 확인.

## 8. 시각 검증 방법 (권장)

```bash
# 1) 실 DB 시드 (community_posts 156행 등)
npx tsx scripts/seed-community.ts --force

# 2) dev 서버
npm run dev
```
- `/board/free` — 목록: 정렬(최신/인기/댓글/조회) 전환, 카테고리 탭, 제목 검색(디바운스), 페이지네이션이 **서버 응답**으로 동작하는지.
- `/board/free/{uuid}` — 상세: 본문/댓글 로드, 추천 클릭 시 카운트 토글, 댓글 등록(닉네임+비번), 삭제(익명 글은 비번 prompt).
- `/board/free/write` — 작성: 익명(닉네임+비번) 작성 → 성공 시 상세로 이동.
- 사이드바: 시세/핫이슈/FNG/공식글이 실데이터로 표시(외부 API 장애 시 해당 위젯만 숨김).

## 9. 알려진 제약 / 후속 라운드 후보

1. **회원 표시명**: T12 API가 프로필명을 join하지 않아 회원 글/댓글 작성자는 `"회원"`으로 표시. profiles join API 또는 응답 확장 필요.
2. **비추 카운트**: `/api/community/like`의 `likeCount`는 `SUM(value)` 순합산(추천−비추). UI "비추 N"은 로컬 토글 표시(0/1)만. 추천/비추 분리 집계는 T12 handover §6-6 RPC 필요.
3. **운영자 뱃지**: `isAdmin` 항상 false(API 미노출). 운영자/공지 작성 라우트는 별도 admin 라운드.
4. **이전/다음·다른 글**: 상세에서 최신 30개 목록 기준 도출(현재 글이 30위 밖이면 prev/next 미표시). 정밀 인접글 API는 후속.
5. **댓글 정렬**: createdAt이 상대시간 라벨이라 "최신순"은 API 오름차순 결과를 역순 표시, "추천순"은 likes 정렬. 정밀 정렬 위해 ISO 타임스탬프 보존 검토 가능.
6. **댓글 답글/신고·게시글 수정**: 상세의 "답글"·"신고"·"수정" 버튼은 미연결(본 라운드 범위 외 — 작성/추천/댓글/삭제만). 수정은 작성 페이지 재사용 또는 edit 라우트 후속.
7. **목록 No 컬럼**: `total - offset - index` 근사 시퀀스(인기/조회 정렬 시 실제 글번호와 불일치). DB에 글번호 컬럼 도입 시 정확화 가능.

## 10. 참조

- 작업 명세: `docs/orchestration/2026-05-23-R2-realdata-finish/R2-T01-board-realdata.md`
- T12 API 계약: `docs/handover/2026-05-23-R1-T12-board-api.md`
- T15 fetch/매퍼 패턴 참고: `app/page.tsx`, `lib/community/queries.ts`
- API 레퍼런스: `docs/references/_API_REFERENCE.md` ("커뮤니티 (R1, T12)" 섹션)
