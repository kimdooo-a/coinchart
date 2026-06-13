# R9 / T03 — 댓글 좋아요 RPC + 타입 센트럴라이제이션 (인수인계)

- **일자**: 2026-06-13
- **라운드/역할**: R9 (gap-verify) / T03 (10)
- **목표**: 댓글 좋아요만 RPC 없이 라우트가 테이블 직접 CUD하던 비대칭을 해소 — 댓글용 토글 RPC 신설 + PATCH 핸들러 단순화 + community 타입 센트럴라이제이션.
- **결과**: 완료. `tsc --noEmit` 0 에러, 검증 5항목 통과.
- **실DB 변경 없음** — 마이그 파일만 작성(적용은 지휘자/사용자).

---

## 1. 신규/변경 파일

| 구분 | 파일 | 내용 |
|------|------|------|
| 신규 | `supabase/migrations/20260613000001_create_comment_likes_rpc.sql` | `community_toggle_comment_like` RPC (멱등) |
| 변경 | `app/api/community/comment/route.ts` | PATCH 핸들러 직접 CUD(약 60줄) → RPC 1콜로 대체, `ToggleLikeRow` import |
| 신규 | `types/community.ts` | community DB row(snake_case) + RPC 반환 + API 응답 타입 센트럴라이즈 |

---

## 2. 신규 RPC 정확한 시그니처

```sql
community_toggle_comment_like(
  p_comment_id UUID,
  p_user_id    UUID,    -- 회원이면 auth.users.id, 익명이면 NULL
  p_ip_hash    TEXT,    -- 익명 dedup 키 / 회원전이 흡수 키 (회원도 전달 권장)
  p_value      SMALLINT -- 1(추천) | -1(비추)
)
RETURNS TABLE (liked BOOLEAN, like_count BIGINT, dislike_count BIGINT)
LANGUAGE plpgsql
```

- **동작**: 게시글 정본 `community_toggle_post_like`(20260524000002)를 1:1 차용 — `post_id`→`comment_id`, `community_post_likes`→`community_comment_likes` 치환. 단일 트랜잭션으로 (A) 회원전이 dedup → (B) 기존 표 조회 → (C) 토글(INSERT/DELETE/UPDATE) → (D) 분리 집계 반환.
- **입력 방어**: `p_value NOT IN (-1,1)` → RAISE; `p_user_id IS NULL AND p_ip_hash IS NULL` → RAISE.
- **멱등**: 시그니처 변경 충돌 대비 선행 `DROP FUNCTION IF EXISTS community_toggle_comment_like(UUID, UUID, TEXT, SMALLINT);` + `CREATE OR REPLACE` + 한국어 `COMMENT ON FUNCTION`.
- **like_count 컬럼 불간섭**: `community_comments.like_count`는 기존 트리거 `trg_community_comment_likes_count`(SUM(value)) 자동 갱신 → 함수에서 직접 UPDATE 안 함 (post 패턴 준수).

### 의존 관계 (T09 레퍼런스 정합용)
- **선행 테이블/트리거/RLS**: `20260524000001_comment_likes.sql`
  - 테이블 `community_comment_likes(id, comment_id, user_id, ip_hash, value, created_at)`
  - 유니크 인덱스: `uniq_community_comment_likes_user`(comment_id, user_id WHERE user_id NOT NULL), `uniq_community_comment_likes_iphash`(comment_id, ip_hash WHERE ip_hash NOT NULL)
  - 트리거: `trg_community_comment_likes_count` → `community_sync_comment_like_count()` (SUM(value))
- **신규 RPC**는 위 테이블/트리거/인덱스에 의존하며, 회원전이 승계 시 `ip_hash=NULL` 비움으로 익명 unique 인덱스에서 제외.
- 본 일꾼은 `_SCHEMA_REFERENCE.md`를 **직접 수정하지 않음** — T09가 위 시그니처/의존을 반영.

---

## 3. PATCH 핸들러 변경

- **유지**: JSON 파싱, `commentId`(UUID)·`value`(미지정/오류 시 1 기본) 검증, 댓글 존재/`is_deleted` 검증, 익명 시 `x-client-ip-hash` 필수 체크(`!user && !ipHash` → 400).
- **변경**: `existingQuery`→`maybeSingle`→분기 INSERT/UPDATE/DELETE→`like_count` 재조회 블록 제거 → `admin.rpc("community_toggle_comment_like", {...})` 1콜.
  - 회원: `p_user_id=user.id` + `p_ip_hash=헤더`(있으면 회원전이 dedup 활성). 익명: `p_user_id=null`, `p_ip_hash=ipHash`.
- **응답 계약 유지**: `{ liked, likeCount }` (RPC `like_count`를 camelCase 매핑). `dislike_count`는 RPC가 반환하나 **비노출** — 게시글 라우트가 dislikeCount를 노출하는 것과 비대칭이나, 댓글 UI는 단일 추천 카운트만 소비하므로 과확장 방지 차원에서 기존 계약 유지.
  - **후속 제안(선택)**: 댓글에도 비추 수 노출이 필요해지면 `{ liked, likeCount, dislikeCount }`로 확장 + `lib/community/board-queries.ts`의 `toggleCommentLike` 래퍼 반환 타입 동반 확장.
- **직접 CUD 제거 확인**: route.ts에서 `community_comment_likes` 직접 참조 grep 결과 **0건**.

---

## 4. types 통합 범위 / 미교체 잔여

`types/community.ts` 신규 export:
- **DB row(snake_case)**: `CommunityPost`, `CommunityPostDetail`, `CommunityComment`, `CommunityLikeRow`, `CommunityPostLikeRow`, `CommunityCommentLikeRow`
- **RPC 반환**: `ToggleLikeRow`(liked, like_count, dislike_count) — 게시글/댓글 토글 RPC 공통
- **API 응답(camelCase)**: `PostLikeResult`, `CommentLikeResult`

필드는 추측이 아니라 실제 select 컬럼·RPC 시그니처 기준 도출(`board-queries.ts`, `queries.ts`, `comment/route.ts`).

### 현재 적용
- `comment/route.ts`만 `ToggleLikeRow`를 신규 파일에서 import 적용.

### 미교체 잔여 (후속 권고 — 범위 폭증 방지로 보류)
- `lib/community/board-queries.ts`의 인라인 `PostListRow`/`PostDetailRow`/`CommentRow`를 `types/community.ts`의 `CommunityPost`/`CommunityPostDetail`/`CommunityComment` 재노출로 치환.
- `app/api/community/like/route.ts`의 인라인 `ToggleLikeRow`를 `@/types/community`에서 import로 치환.
- 일괄 교체 시 import 경로 변경이 광범위(컴포넌트·라우트 다수)하므로 별도 후속 라운드로 분리 권고.

---

## 5. 내부 병렬(kdyswarm) 사용 내역

- **모드**: 인라인 단일 에이전트 실행(팬아웃 미사용, 사실상 mode 1).
- **사유**: 산출 3곳이 (1)RPC→(2)route **순차 의존**이고 (3)types도 route가 import하므로 긴밀 결합 + 총 3파일 소규모. 워크트리/서브에이전트 격리 오버헤드가 이득을 초과한다고 판단해 순차 직접 실행. (지시서 §9는 mode 2 소규모 팬아웃 "권장"이나 충돌 경계가 단일 에이전트로도 안전하게 보존됨.)
- **subagent 수**: 0 (메인 컨텍스트 직접 수행).
- **산출**: 마이그 1 + route 개조 1 + types 신규 1.

---

## 6. 검증 결과

| # | 항목 | 결과 |
|---|------|------|
| 1 | `npx tsc --noEmit` | **0 에러** |
| 2 | RPC grep (정의/호출) | 정의 1(`DROP`+`CREATE`+`COMMENT`) + 호출 1(route.ts:188) |
| 3 | 멱등 `DROP FUNCTION IF EXISTS` 선행 | 존재(.sql:36) |
| 4 | `supabase db lint` | **미실행** — 로컬 Postgres 스택 실행 필요(실DB 변경 금지·오프라인). SQL은 정본 `20260524000002` 1:1 치환이라 구문 정합. |
| 5 | PATCH 직접 CUD(`.from("community_comment_likes").insert/update/delete`) 제거 | route.ts 내 `community_comment_likes` 참조 **0건** |

---

## 7. 다음 액션 (지휘자/사용자)

1. **마이그 적용**: `supabase/migrations/20260613000001_create_comment_likes_rpc.sql`을 운영 DB에 적용(지휘자/사용자 책임). 선행 `20260524000001_comment_likes.sql`(테이블/트리거)이 이미 적용돼 있어야 함.
2. **T09**: 위 §2 RPC 시그니처/의존을 `_SCHEMA_REFERENCE.md`·`_API_REFERENCE.md`에 반영.
3. **(선택) 후속 라운드**: §4 미교체 잔여 타입 일괄 치환, §3 dislikeCount 노출 확장.
