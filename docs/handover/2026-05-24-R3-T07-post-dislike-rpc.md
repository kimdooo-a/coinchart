# R3 / T07 — 게시글 추천/비추 dislikeCount 분리 RPC + 회원전이 dedup

> 라운드: R3 (community-finish) · 일꾼: T07 / 12 · Wave 1 (독립)
> 작성일: 2026-05-24 · 상태: **완료** (tsc/build 통과)

## 1. 목표 (지시서 요약)

`community_post_likes(value ±1)` 기반으로 (1) 추천/비추 **분리 집계 RPC**, (2) 익명→회원
**전이 dedup 정책**, (3) `/api/community/like` 응답에 **dislikeCount 추가**(하위호환)를 구현.

## 2. 변경 파일 (3)

| 파일 | 구분 | 내용 |
|------|------|------|
| `supabase/migrations/20260524_post_likes_rpc.sql` | 신규 | 분리 집계 RPC + 원자적 토글 RPC(회원전이 dedup) |
| `app/api/community/like/route.ts` | 수정 | 토글 RPC 호출로 전환 + `dislikeCount` 응답 추가 |
| `docs/rules/community-like-dedup.md` | 신규 | dedup·전이·엣지케이스 정책 문서 |

> 마이그레이션 파일명은 지시서 §8대로 `20260524_post_likes_rpc.sql`
> (T08의 `20260524_comment_likes.sql`과 충돌 없음). 라우트도 `like`만 수정(comment 무관).

## 3. RPC 시그니처

### 3-1. 분리 집계 (읽기)
```sql
community_post_like_counts(p_post_id UUID)
  RETURNS TABLE (like_count BIGINT, dislike_count BIGINT)   -- value=1 합 / value=-1 합
  LANGUAGE sql STABLE
```
- `like_count` = 추천 수(≥0), `dislike_count` = 비추 수(≥0).
- `community_posts.like_count` 컬럼(트리거 `SUM(value)` 순합산, 음수 가능)과는 **별개**. 컬럼·트리거 무변경(인기순 정렬용으로 유지).

### 3-2. 원자적 토글 + 회원전이 dedup
```sql
community_toggle_post_like(
  p_post_id UUID, p_user_id UUID, p_ip_hash TEXT, p_value SMALLINT)
  RETURNS TABLE (liked BOOLEAN, like_count BIGINT, dislike_count BIGINT)
  LANGUAGE plpgsql
```
- `p_user_id` NOT NULL → 회원 / NULL → 익명. `p_ip_hash`는 익명 dedup 키 겸 회원전이 흡수 키.
- 반환: `liked`(최종 추천 활성), 분리 집계 2종.

## 4. 회원전이 dedup 정책

회원 요청 + `ip_hash` 보유 시, **토글 전에** 본인 익명 추천 행을 정리:

```
IF 회원 행 존재 (post_id, user_id):
    동일 (post_id, ip_hash) 익명 행 DELETE        -- 중복 정리 (트리거가 like_count 정정)
ELSE:
    동일 (post_id, ip_hash) 익명 행 UPDATE         -- 회원 행으로 승계
        SET user_id=<회원>, ip_hash=NULL            -- value 보존 → 카운트 불변
```

- **승계는 "회원 행 없음" 분기에서만** 실행 → `(post_id, user_id)` UNIQUE 위반 없음.
- 승계 후 `ip_hash=NULL` → 익명 UNIQUE 인덱스에서 제외, CHECK(`user_id OR ip_hash NOT NULL`)는 `user_id`로 만족.
- `value`를 건드리지 않아 트리거 UPDATE 분기(`NEW.value<>OLD.value`)가 false → `like_count` 컬럼 변동 없음.
- 미들웨어(`middleware.ts`)가 `/api/community`에 `x-client-ip-hash`를 **회원·익명 모두** 주입 → 회원도 본인 ip_hash 확보.

### 엣지케이스 (상세는 정책 문서 §5)
| 시나리오 | 결과 |
|----------|------|
| 익명 추천 → 로그인 → 추천 클릭 | 승계 후 동일 value → **취소** |
| 익명 추천 → 로그인 → 비추 클릭 | 승계 후 추천↔비추 전환 |
| 레거시 중복(익명+회원) → 클릭 | 익명 행 삭제 + 회원 행 토글로 정정 |
| 회원, ip_hash 헤더 누락 | 흡수 스킵, user_id dedup로 정상 토글 |
| 익명, ip_hash 없음 | 라우트 400 |

## 5. 트랜잭션 방식

dedup → 토글 → 분리집계를 **단일 plpgsql 함수(= 단일 트랜잭션)** 로 처리.
기존 라우트의 다중 쿼리(조회→분기→INSERT/UPDATE/DELETE→재조회)를 RPC 1회 호출로 대체해
중간 상태 노출·부분 실패를 제거. 라우트는 게시글 존재 확인(404)과 입력 검증만 담당.

## 6. API 응답 확장 (하위호환)

`POST /api/community/like` →
```jsonc
{
  "liked": true,        // (기존) 최종 추천 활성 여부
  "likeCount": 12,      // 추천 수(value=1 합). 필드명 유지, 의미는 순합산 → 추천 수로 변경
  "dislikeCount": 3     // (신규) 비추 수(value=-1 합)
}
```
- `liked`·`likeCount` **필드 제거 없음**(board 추천 버튼 하위호환 — 지시서 §8 준수).
- `likeCount` 의미 변경: 기존 `community_posts.like_count`(순합산, 음수 가능) → 추천 수(≥0).
  board 상세는 이를 "추천 N"으로 표시 중이라 표시가 **더 정확**해짐(필드명·타입 동일 → `togglePostLike`/UI 무수정 동작).
- `lib/community/board-queries.ts`의 `togglePostLike`는 `{liked, likeCount}`만 구조분해 → 추가 필드 무시되어 **무변경 호환**.

## 7. 후속 작업 (본 라운드 범위 외)

1. **API 레퍼런스 갱신 필요** — `docs/references/_API_REFERENCE.md` §`POST /api/community/like`:
   응답에 `dislikeCount` 추가, `likeCount` 의미(순합산 → 추천 수) 정정. (읽기전용 SOT라 본 일꾼은 미수정 — 컨덕터 통합 시 반영)
2. **UI 연결** — board 상세(`app/board/[slug]/[postId]/page.tsx`, T12 영역)의 비추 표시가
   로컬 토글(0/1)이므로 `dislikeCount`로 교체하면 실데이터화. `togglePostLike` 반환 타입에 `dislikeCount` 추가 필요.
3. **내 투표 상태 조회 API** — 로그인 직후 추천 상태를 UI가 모르는 문제(정책 §5 #1) 해소용. 후속 라운드.
4. **동시 더블클릭** — 별도 트랜잭션 경합 시 UNIQUE 위반 500 가능. 프런트 `likeBusy` 가드로 1차 방지 중.

## 8. 실 DB 적용 안내

마이그레이션 **파일만 작성**(실 DB 미적용 — 지시서 §8). 컨덕터/운영자가 적용:

```bash
supabase db push    # 또는 Supabase SQL Editor에 20260524_post_likes_rpc.sql 붙여넣기
```
- 두 함수 모두 `CREATE OR REPLACE` → 재적용 안전(idempotent).
- 테이블/트리거/인덱스 변경 없음(함수만 추가). 적용 후 `/api/community/like`가 RPC를 호출하므로 **함수 생성이 라우트 배포의 선행조건**.

## 9. 검증 결과

```
npx tsc --noEmit                                   → PASS (에러 없음)
Test-Path supabase/migrations/20260524_post_likes_rpc.sql → True
Select-String route.ts -Pattern "dislike"          → 매치 (응답·타입·주석)
npm run build                                       → PASS (전 라우트 정상 빌드)
```
