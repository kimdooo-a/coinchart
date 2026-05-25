# T02 — UI wiring 결선 (게시글 비추 dislikeCount + 댓글 추천 PATCH)

## 1. 컨텍스트

- 프로젝트: **코인 차트 분석** (Next.js 16 + Supabase, v2.0 커뮤니티 피벗)
- 작업 디렉토리: `F:\11_dev\260523 코인 차트분석`
- 본 터미널 역할: **T02 / 4** — 백엔드는 이미 준비됐고 UI placeholder만 남은 2개 결선
- 라운드: R4 (community-wiring) · 발사 차수: **Wave 1 (코드 작성 독립 / 실동작 검증은 T01 DB 적용 후)**

## 2. 배경 (백엔드는 이미 완료)

R3(T07·T08)에서 API는 분리 집계까지 완성됐는데 클라이언트 래퍼/컴포넌트가 그 응답을 안 쓰고 있다. **API 응답 계약은 절대 변경하지 말 것** — UI 쪽만 맞춘다.

### (A) 게시글 비추 — `POST /api/community/like` 응답
```ts
// app/api/community/like/route.ts (읽기 전용 — 이미 dislikeCount 반환 중)
{ liked: boolean, likeCount: number, dislikeCount: number }
// likeCount=추천 수, dislikeCount=비추 수 (분리 집계, value=1/-1)
// 익명 dedup은 헤더 x-client-ip-hash (middleware가 자동 주입 — 클라는 명시 불필요)
```
현재 `lib/community/board-queries.ts`의 `togglePostLike`는 반환을 `{ liked, likeCount }`로만 좁혀 **dislikeCount를 버린다**. 그래서 `components/community/PostVoteButtons.tsx`는 비추 수를 `비추 {disliked ? 1 : 0}` 가짜값으로 표시 중.

### (B) 댓글 추천 — `PATCH /api/community/comment` 응답
```ts
// app/api/community/comment/route.ts (읽기 전용 — PATCH 이미 구현됨)
// body: { commentId: string, value?: 1 | -1 }  (value 미지정 시 1=추천)
{ liked: boolean, likeCount: number }
// 익명 dedup은 헤더 x-client-ip-hash (middleware 자동 주입)
```
`board-queries.ts`에 댓글 추천 래퍼가 **없고**, `components/community/CommentSection.tsx`의 ThumbsUp 버튼은 `onClick` 미연결(표시만 `{c.likes}`).

## 3. 공통 SOT (읽기 전용)

```
CLAUDE.md                                  진입점·커밋 규칙
docs/PROJECT_DIRECTION.md                  v2.0 방향성 (빨↑/파↓)
docs/references/_API_REFERENCE.md          like dislikeCount·comment PATCH 계약 (R3 갱신본)
app/api/community/like/route.ts            ← 변경 금지 (응답 계약 SOT)
app/api/community/comment/route.ts         ← 변경 금지 (PATCH 계약 SOT)
middleware.ts                              x-client-ip-hash 등 헤더 주입 (변경 금지)
```

## 4. 작업 목표 (3파일 — 본 터미널 전용 쓰기)

### Phase 1: `lib/community/board-queries.ts`
1. **`togglePostLike` 반환 타입 확장**: `Promise<{ liked: boolean; likeCount: number }>` → `{ liked, likeCount, dislikeCount }`로. 응답의 `dislikeCount`를 `Number(json.dislikeCount ?? 0)`로 파싱해 함께 반환. (기존 호출부 호환 — 필드 추가만)
2. **`toggleCommentLike` 신규 추가**: `PATCH /api/community/comment` 호출 래퍼.
   ```ts
   export async function toggleCommentLike(
     commentId: string, value: 1 | -1 = 1
   ): Promise<{ liked: boolean; likeCount: number }> { ... }
   ```
   - `togglePostLike`와 동일한 graceful 에러 패턴(`!res.ok → throw new Error(json.error ?? ...)`)

### Phase 2: `components/community/PostVoteButtons.tsx`
- `dislikes` 상태 추가 (`useState`), `initialDislikes?: number` prop 추가(선택 — 없으면 0 시작).
- `handleLike`/`handleDislike`에서 `togglePostLike` 반환의 `dislikeCount`를 `setDislikes`로 반영.
- 표시부 `비추 {disliked ? 1 : 0}` → `비추 {dislikes}` 로 교체 (실제 분리 집계 수).
- 추천/비추는 상호 배타 토글 — 기존 `liked`/`disliked` 상태 로직 유지하되 카운트는 응답 기반.
- ⚠️ `initialDislikes` prop을 추가했으면 호출처(게시글 상세 페이지 — `app/board/[slug]/[postId]/`)에서 넘기도록. **단 호출처가 본 터미널 쓰기 영역 밖이면** prop을 optional(default 0)로 두고 호출처 수정은 handover에 "후속" 메모. (호출처 파일이 `app/board/` 라 T02 영역 밖 → optional 처리 + 메모 권장)

### Phase 3: `components/community/CommentSection.tsx`
- 각 댓글/대댓글의 ThumbsUp 버튼에 `onClick` 연결 → `toggleCommentLike(c.id, 1)` 호출.
- 응답 `likeCount`로 해당 댓글의 `likes`를 낙관적/확정 갱신 (comments 상태 배열에서 해당 id 업데이트).
- 진행 중 중복 클릭 가드(busy) — `PostVoteButtons` 패턴 참고.
- 추천순 정렬(`commentSort === "popular"`)이 갱신된 likes를 반영하는지 확인.

## 5. 도구 권장
- 직접 작성 (작은 결선 — 스킬 불필요)

## 6. 의존성
- **코드 작성은 독립** (응답 계약 기반). `app/api/community/*`는 읽기만.
- **실동작 검증은 T01(실 DB 적용) 후** — DB 미적용이면 추천/댓글 클릭 시 500이 나므로, 본 터미널은 `tsc`/`build`/렌더까지 검증하고 "런타임 토글은 T01 db push 후 확인" 메모.

## 7. 검증

```powershell
npx tsc --noEmit                                    # 0 에러
npx eslint lib/community/board-queries.ts components/community/PostVoteButtons.tsx components/community/CommentSection.tsx
# placeholder 제거 확인 (가짜 비추값이 사라졌는지)
Select-String -Path components/community/PostVoteButtons.tsx -Pattern 'disliked \? 1 : 0'   # 0건이어야 함
# 댓글 추천 onClick 연결 확인
Select-String -Path components/community/CommentSection.tsx -Pattern 'toggleCommentLike'    # ≥1건
npm run build                                       # board 라우트 컴파일 성공
```

## 8. 완료 신호
`docs/handover/2026-05-25-R4-T02-ui-wiring.md` 작성:
- 수정 3파일 + diff 요약
- 검증 결과 (tsc/eslint/grep/build PASS/FAIL)
- ⚠️ 런타임 토글 검증은 T01 db push 선행 명시
- `PostVoteButtons`에 `initialDislikes` prop 추가했으면 호출처(`app/board/[slug]/[postId]`) 연결 후속 메모

## 안티패턴
- ❌ `app/api/community/*` 응답 계약 변경 (UI만 맞춤)
- ❌ `lib/community/board-queries.ts`·`components/community/{PostVoteButtons,CommentSection}.tsx` 밖 쓰기 (격리 위반)
- ❌ `app/board/` 페이지 직접 수정 (영역 밖 — prop optional + 후속 메모로 처리)
- ❌ 익명 헤더를 클라에서 수동 주입 시도 (middleware가 처리 — 중복/오염)
- ❌ DB 미적용을 hard-fail로 막지 말 것 (코드는 완성, 런타임은 후속 검증)
- ❌ handover 누락 / 한국어 주석 누락
