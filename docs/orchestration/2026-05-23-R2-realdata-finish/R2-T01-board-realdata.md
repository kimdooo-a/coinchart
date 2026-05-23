# R2-T01 — board-realdata

> **본 터미널은 R2 일꾼(R2-T01)**. 1차 발사 (의존 R1 완료분). 동시 발사 그룹.

## 정체성

- 역할: `worker` (R2-T01), R2, realdata-finish
- 담당: 게시판 3종 페이지(`/board/[slug]` 목록·`/board/[slug]/[postId]` 상세·`/board/[slug]/write` 작성)를 **mock → 실데이터(T12 API)** 로 전환
- 의존: R1/T12 (board/community API 8핸들러), R1/T01 (community_* 스키마)

## 컨텍스트

R1에서 메인페이지(T15)는 실데이터 SSR로 전환됐으나, 게시판 3종은 아직 `lib/community/mock-posts.ts`(BOARD_META/MOCK_POSTS) + `mock-coins.ts`(사이드바)를 사용 중. T12가 게시판 전용 API 8개를 완성해 두었으므로, **본 일꾼은 페이지를 T12 API 호출로 연결**한다. 세 페이지 모두 `"use client"`(탭/정렬/검색/페이지네이션 상태 보유)이므로 **클라이언트 `fetch()`** 가 가장 자연스럽다. JSX·디자인은 보존하고 데이터 소스만 교체.

## 공통 SOT (읽기 전용)

```
CLAUDE.md
docs/handover/2026-05-23-R1-T12-board-api.md        ← API 8핸들러 계약 (필독)
docs/handover/2026-05-23-R1-T15-mainpage-realdata.md ← fetch/fallback/변환헬퍼 패턴 참고
docs/references/_API_REFERENCE.md                    ← "커뮤니티 (R1, T12)" 섹션
app/board/[slug]/page.tsx                            ← 현재 목록 (수정 대상)
app/board/[slug]/[postId]/page.tsx                   ← 현재 상세 (수정 대상)
app/board/[slug]/write/page.tsx                      ← 현재 작성 (수정 대상)
components/community/BoardRow.tsx                     ← BoardPost props 계약
lib/community/mock-posts.ts                          ← BOARD_META(보존)·BoardPost 타입 참고 (수정 금지)
```

## T12 API 계약 (요약 — handover 필독)

| UI | 호출 |
|---|---|
| 목록 | `GET /api/board/{slug}?page=&limit=30&sort={recent\|popular\|comments\|views}&search=&category=` → `{ notices, posts, total, page, limit }` |
| 상세 | `GET /api/board/{slug}/{postId}` → `{ post, comments }` (view_count 자동 +1) |
| 작성 | `POST /api/board/{slug}` body `{ title, contentHtml, category, tags, coinSymbol, postAsAnonymous, guestNickname, guestPassword }` |
| 수정 | `PATCH /api/board/{slug}/{postId}` body `{ title?, contentHtml?, ..., guestPassword? }` |
| 삭제 | `DELETE /api/board/{slug}/{postId}?guestPassword=` |
| 댓글 | `POST /api/community/comment` body `{ postId, parentId?, content, postAsAnonymous, guestNickname?, guestPassword? }` |
| 추천 | `POST /api/community/like` body `{ postId, value: 1\|-1 }` → `{ liked, likeCount }` |

- 정렬 키 매핑: 페이지 `latest→recent`, `popular→popular`, `comments→comments`, `views→views`
- slug 화이트리스트(목록/작성 3종): `free`, `market`, `info`

## 작업 목표

세 페이지의 mock 호출을 T12 API `fetch`로 교체. 서버 응답(snake_case DB row)을 컴포넌트 props(`BoardPost` 등)로 변환하는 헬퍼를 페이지 내부 또는 `lib/community/board-queries.ts`(신규, 클라용 fetch 래퍼+매퍼)에 작성.

### 산출물

- **수정** `app/board/[slug]/page.tsx`: `MOCK_POSTS`/필터/정렬/페이지네이션 → `GET /api/board/{slug}` 호출(서버 사이드 정렬·검색·페이지). `useState`/`useEffect`로 로딩·에러·빈 상태 처리. `BOARD_META`는 보존(정적 메타).
- **수정** `app/board/[slug]/[postId]/page.tsx`: `getPost`/`MOCK_COMMENTS` → `GET /api/board/{slug}/{postId}`. 추천 버튼 → `POST /api/community/like`. 댓글 작성 → `POST /api/community/comment`. 삭제 → `DELETE`.
- **수정** `app/board/[slug]/write/page.tsx`: 폼 제출 → `POST /api/board/{slug}`. 회원/익명 분기(닉네임·비밀번호 입력). 성공 시 상세로 라우팅.
- **(선택) 신규** `lib/community/board-queries.ts`: 클라 fetch 래퍼 + row→props 매퍼(`toBoardPost` 등). 페이지 비대화 방지.
- **사이드바 위젯**: `TICKER_LIST`/`HOT_ISSUES`/`OFFICIAL_POSTS`(mock-coins) → 클라 fetch `GET /api/coins/ticker`, `GET /api/coins/hot-issues`, `GET /api/fng`. (mock-coins 사이드바 의존 제거)

## 작업 단계

1. SOT 정독 (T12 handover 우선)
2. `board-queries.ts` 또는 페이지 내부 fetch 헬퍼 작성 (row→props 매퍼 포함)
3. 목록 페이지: 서버 정렬/검색/페이지 위임, 클라는 파라미터만 관리
4. 상세 페이지: 글+댓글 로드, 추천/댓글/삭제 액션 연결
5. 작성 페이지: POST 연결, 회원/익명 분기
6. 사이드바 위젯 실데이터화
7. 빈/로딩/에러 fallback (전체 페이지 깨짐 방지)
8. 검증

## 검증

```bash
npx tsc --noEmit                                                  # 0 error

# mock-posts/mock-coins import 0건 (board 3종에서)
grep -rn "@/lib/community/mock-" app/board/                       # 기대: BOARD_META만 (또는 0)

# T12 API 호출 존재
grep -rn "/api/board/\|/api/community/" app/board/                # 기대: 다수

npm run build 2>&1 | tail -20                                     # Compiled successfully
```

시각 검증(권장): 실DB 시드(`npx tsx scripts/seed-community.ts --force`) 후 `npm run dev` → `/board/free` 목록·상세·작성 흐름 확인.

## 완료 신호

`docs/handover/2026-05-23-R2-T01-board-realdata.md` 작성. 명시: 수정 파일·API 매핑표·변환 헬퍼·fallback·mock import 잔여(BOARD_META 보존 사유)·시각 검증 방법.

## 안티패턴

- `lib/community/mock-*.ts` 파일 **삭제 금지** (다른 R2 일꾼/타 페이지가 아직 의존 — 전체 삭제는 회수 후 지휘자가 일괄)
- `app/api/`, `middleware.ts`, `supabase/`, `lib/community/auth.ts`·`ip-mask.ts` **수정 금지** (T12·T07 영역)
- `app/news/`, `app/coin/`, `app/page.tsx` **수정 금지** (R2-T02·T03·T05 영역)
- JSX 구조·디자인 토큰 대폭 변경 금지 (데이터 소스만 교체)
- 새 패키지 설치 금지
