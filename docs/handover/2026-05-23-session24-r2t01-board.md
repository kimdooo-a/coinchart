# 인수인계서 — 세션 24 (R2/T01 일꾼 — board-realdata)

> 작성일: 2026-05-23
> 이전 세션: [session23 (R2/T05 infra)](./2026-05-23-session23-r2t05-infra.md)
> 기술 상세 인수인계: [2026-05-23-R2-T01-board-realdata.md](./2026-05-23-R2-T01-board-realdata.md) (수정 파일·API 매핑표·변환 헬퍼·fallback·제약 7건)
> 세션 저널: [journal-2026-05-23.md](../logs/journal-2026-05-23.md) §세션 24

---

## 작업 요약

게시판 3종(목록/상세/작성)을 `mock-posts`/`mock-coins` 의존에서 **T12 board/community API 클라이언트 fetch**로 전환. 사이드바 위젯(시세/핫이슈/FNG/공식글)도 실데이터화. JSX·디자인 보존, 데이터 소스만 교체.

## 대화 다이제스트

### 토픽 1: R2-T01 발사 — 게시판 실데이터 전환
> **사용자**: "① R2-T01 게시판: `R2-T01-board-realdata.md`를 정독하고 그대로 실행해. 게시판 3종(목록/상세/작성)을 mock-posts에서 T12 board API 클라 fetch로 전환, 사이드바 위젯도 실데이터화. 완료 시 handover 작성."

orchestration 문서 + T12 handover + 라우트 4파일 실제 응답 형상(snake_case row) + BoardRow props 계약 + 위젯 4종 props + 사이드바 API 4종을 정독. 세 페이지 모두 `"use client"`(탭/정렬/검색/페이지 상태) → 클라 `fetch()`가 자연스러움.

**결론**: 데이터 소스만 교체, JSX·디자인 토큰 보존.

### 토픽 2: fetch 중앙화 결정
orchestration 산출물이 `board-queries.ts`(클라 fetch 래퍼 + 매퍼)를 명시 → 모든 T12·사이드바 호출을 `lib/community/board-queries.ts`로 중앙화.

**결론**: 페이지는 fetch 함수만 호출. 검증 grep `"/api/board/" app/board/`가 0건이 되는 부작용은 handover에 "wiring은 board-queries.ts grep으로 확인"으로 명시.

### 토픽 3: UUID vs number id 충돌
T12 게시글 `id`는 UUID(string)인데 `BoardRow`의 `BoardPost.id`는 `number`(읽기 전용 계약).

**결론**: `BoardListItem extends BoardPost` + `uuid: string` 추가 → 라우팅·React key는 `uuid`, `BoardPost.id`는 표시용 placeholder. No 컬럼은 `number`에 `total - offset - index` 시퀀스 주입. BoardRow 무수정.

### 토픽 4: 사이드바 공용 컴포넌트 추출
목록·상세가 동일 사이드바를 사용 → `<BoardSidebar showTools?>` 클라 컴포넌트로 추출하여 useEffect 중복 fetch 방지. 위젯별 독립 fetch + `.catch`로 실패 위젯만 숨김.

**결론**: mock-coins(TICKER_LIST/HOT_ISSUES/OFFICIAL_POSTS) import 완전 제거.

### 토픽 5: React19 set-state-in-effect 차단 (문제 해결)
ESLint가 로드 effect 본문의 동기 `setLoading(true)`와 `setPage(1)` 리셋 effect를 **에러**로 차단.

**원인**: React19 `react-hooks/set-state-in-effect` — effect 본문의 동기 setState가 cascading render 유발로 간주됨(콜백 내부는 허용).

**해결**: (a) 로드 effect 동기 setState를 내부 `async load()` 함수로 이동 후 `void load()`, (b) page 리셋 effect 제거 → 카테고리/정렬/검색 이벤트 핸들러에서 직접 `setPage(1)`. 검색은 300ms 디바운스 유지. → eslint exit 0. solution 문서로 기록.

### 토픽 6: 검증 — 병렬 트리에서 내 영역 격리
`tsc`가 `app/page.tsx` 단독 에러를 보고 → 병렬 T05의 중간 편집 상태. `git stash push -- app/page.tsx` 후 tsc 재실행 = **전역 0 에러**(내 신규 파일 전 코드베이스 타입 정합 입증), 즉시 stash pop 복원. 빌드 시점엔 T05가 정상화하여 `npm run build` **Compiled successfully** + board 3 라우트 등록 확인.

## 의사결정 요약

| # | 결정 | 선택지 | 선택 이유 |
|---|------|--------|----------|
| 1 | fetch를 board-queries.ts에 중앙화 | 페이지 인라인 vs lib 중앙화 | orchestration 산출물 명시("클라 fetch 래퍼"), 페이지 비대화 방지 |
| 2 | uuid 필드 추가, BoardPost.id는 placeholder | BoardRow 수정 vs 뷰타입 확장 | BoardRow는 읽기 전용 계약 → 무수정 원칙 |
| 3 | BoardSidebar 공용 컴포넌트 신설 | 페이지별 인라인 fetch vs 공용 | 목록·상세 중복 useEffect 제거 |
| 4 | set-state-in-effect: 내부 async + 핸들러 리셋 | eslint-disable vs 구조 변경 | 규칙 의도 충족(비파괴), disable 주석 회피 |
| 5 | 회원 표시명 "회원" 고정 | profiles join vs 후속 위임 | T12 API가 프로필 미노출 → 후속 과제로 명시 |

## 수정/신규 파일 (6개 + cs 문서)

| # | 파일 | 변경 |
|---|------|------|
| 1 | `lib/community/board-queries.ts` | 신규 — fetch 래퍼 6 + 사이드바 4 + row→props 매퍼 3 + 표시 헬퍼 |
| 2 | `components/community/BoardSidebar.tsx` | 신규 — 목록/상세 공용 사이드바(실데이터 4위젯) |
| 3 | `app/board/[slug]/page.tsx` | 수정 — 목록 서버 위임 + 로딩/에러/빈 상태 |
| 4 | `app/board/[slug]/[postId]/page.tsx` | 수정 — 글+댓글 로드, 추천/댓글/삭제 액션 |
| 5 | `app/board/[slug]/write/page.tsx` | 수정 — POST 연결 + 상세 라우팅 |
| 6 | `docs/handover/2026-05-23-R2-T01-board-realdata.md` | 신규 — 기술 상세 인수인계 |

## 검증 결과

- `npx tsc --noEmit` — 내 파일 0 에러 / `app/page.tsx`(병렬 T05) HEAD 복원 시 전역 0 에러 입증
- `npx eslint`(내 5파일) — exit 0
- `grep "@/lib/community/mock-" app/board/` — BOARD_META만(3건)
- `npm run build` — Compiled successfully, `/board/*` 3 라우트 등록

## 터치하지 않은 영역

- 병렬 R2 일꾼 산출물 — T02 news(`app/news/page.tsx`·`news-queries.ts`), T03 coin(`app/coin/[symbol]/page.tsx`·`coin-queries.ts`) 및 각 handover → 컨덕터 통합 위임
- `app/api/*`·`middleware.ts`·`supabase/`·`lib/community/auth.ts`·`ip-mask.ts` — T12/T07 영역(안티패턴)
- `components/community/BoardRow.tsx` — 읽기 전용 props 계약(무수정)
- `lib/community/mock-*.ts` — 삭제 금지(타 페이지 의존, 컨덕터 일괄 정리)
- `_COMPONENT_MAP.md`/`_TYPE_REFERENCE.md` — 공유 SOT, 병렬 충돌 회피(handover에 델타 기록)

## 알려진 이슈

- 회원 글/댓글 작성자 "회원" 고정(T12 프로필 미join), 비추 분리 카운트 부재, 운영자 뱃지(isAdmin=false), 이전/다음 최신 30개 기준 도출 — 상세 handover §9 7건 참조
- 댓글 "답글"/"신고"/게시글 "수정" 버튼 미연결(본 라운드 범위 외)

## 다음 작업 제안

- **컨덕터 R2 통합 커밋**: T01(board, 본 세션 커밋 완료)·T02(news)·T03(coin) 산출물 통합 후, mock-* 파일 의존이 모두 사라졌는지 확인하고 `lib/community/mock-{posts,coins,news}.ts` 일괄 정리(BOARD_META는 정적 메타라 별도 모듈 분리 검토)
- profiles join으로 회원 표시명 실데이터화(API 응답 확장)
- 게시글 수정 라우트 + 댓글 답글/추천 토글 연결

---
[← handover/_index.md](./_index.md)
