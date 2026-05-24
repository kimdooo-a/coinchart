# 인수인계 — R3 / T08: 댓글 추천 토글 (community_comment_likes)

- **날짜**: 2026-05-24
- **라운드**: R3 (community-finish)
- **터미널**: T08 / 12 (Wave 1, 독립)
- **상태**: ✅ 완료 (tsc·grep·build 검증 통과)

## 1. 작업 요약

`community_post_likes` 패턴을 차용하여 **댓글 추천/비추 토글** 기능을 신규 구현했다.

| 산출물 | 종류 | 경로 |
|--------|------|------|
| `community_comment_likes` 테이블 | 신규 마이그레이션 | `supabase/migrations/20260524_comment_likes.sql` |
| 댓글 추천 토글 API | `PATCH` 메서드 추가 | `app/api/community/comment/route.ts` |

- 실 DB 적용은 **미실행** (마이그레이션 파일만 작성 — §5 적용 안내 참조).
- 프론트 UI는 **미구현** (T02 board SSR 영역 — §4 UI 연결 가이드 인계).

## 2. comment_likes 스키마 (post_likes 차용점)

`community_post_likes`를 1:1로 차용하되 `post_id → comment_id`로 치환:

```sql
CREATE TABLE community_comment_likes (
  id         UUID PK DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES community_comments(id) ON DELETE CASCADE,  -- post_id → comment_id
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,  -- 회원 dedup
  ip_hash    TEXT,                                              -- 익명 dedup (HMAC sha256 전체 IP)
  value      SMALLINT NOT NULL CHECK (value IN (-1, 1)),        -- 1=추천, -1=비추
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT community_comment_likes_user_or_iphash CHECK (user_id IS NOT NULL OR ip_hash IS NOT NULL)
);
```

**차용점 / 차이점 정리**

| 항목 | community_post_likes (원본) | community_comment_likes (신규) |
|------|------------------------------|--------------------------------|
| FK 대상 | `post_id → community_posts` | `comment_id → community_comments` |
| 회원 dedup | `uniq_..._user (post_id, user_id) WHERE user_id IS NOT NULL` | `uniq_community_comment_likes_user (comment_id, user_id) WHERE user_id IS NOT NULL` |
| 익명 dedup | `uniq_..._iphash (post_id, ip_hash) WHERE ip_hash IS NOT NULL` | `uniq_community_comment_likes_iphash (comment_id, ip_hash) WHERE ip_hash IS NOT NULL` |
| value | `SMALLINT CHECK (value IN (-1,1))` | 동일 |
| 식별 CHECK | `user_id OR ip_hash` | 동일 |
| 추가 인덱스 | (없음) | `idx_community_comment_likes_comment (comment_id)` — 집계 조회 가속 |

> 익명 dedup용 `ip_hash`는 표시용 `guest_ip_masked`(앞 2옥텟)와 **별개**다. 전체 IP의 HMAC sha256(`lib/community/ip-mask.ts`의 `hashIp`)을 사용하며, 라우트는 `x-client-ip-hash` 헤더로 전달받는다.

## 3. 트리거 / 카운터

- `community_comments.like_count` 컬럼은 `20260523_create_community_tables.sql`에서 이미 생성됨. 본 마이그레이션은 단독 적용 안전을 위해 `ADD COLUMN IF NOT EXISTS`로 멱등 보강.
- 트리거 `community_sync_comment_like_count()` — post_likes의 `community_sync_like_count()` 패턴 차용. `like_count = SUM(value)` 유지:
  - INSERT → `+ NEW.value`
  - DELETE → `- OLD.value`
  - UPDATE(value 변경) → `- OLD.value + NEW.value`
- 트리거 `trg_community_comment_likes_count` — `AFTER INSERT OR UPDATE OR DELETE`.

> 집계 RPC는 별도로 두지 않음(post_likes와 동일하게 트리거 카운터 방식 채택). like_count는 추천(+1)/비추(-1) 부호합이므로 순추천수를 의미.

## 4. API 토글 계약 (UI 연결 가이드 — T02용)

`POST`(작성)·`DELETE`(삭제)와 충돌 없이 **`PATCH`** 메서드로 토글 추가.

```
PATCH /api/community/comment
Content-Type: application/json
(익명일 경우) Header: x-client-ip-hash: <hashIp(전체 IP)>

body: { "commentId": "<uuid>", "value": 1 }   // value 생략·잘못된 값 → 1(추천) 기본
```

**동작**
- 회원: `user_id` dedup / 익명: `x-client-ip-hash` 헤더 dedup (헤더 없으면 400).
- 토글 규칙(post_like와 동일):
  - 기존 행 없음 → INSERT (liked = value===1)
  - 기존 행의 value === 요청 value → **삭제(토글 OFF)**, liked=false
  - 기존 행의 value ≠ 요청 value → **전환(UPDATE)**, liked = value===1

**응답**
```json
{ "liked": true, "likeCount": 12 }
```
- `liked`: 추천(value=1)이 현재 활성인지.
- `likeCount`: 트리거 반영 후 재조회한 `community_comments.like_count`.

**에러**
| 상태 | 조건 |
|------|------|
| 400 | Invalid JSON / Invalid commentId / (익명) 추천 식별 헤더 없음 |
| 404 | 댓글 없음(삭제 포함) |
| 500 | DB 오류 |

**UI 연결 (T02 또는 후속 라운드가 구현)**
1. 댓글 상세(board SSR)의 각 댓글 추천 버튼 onClick → `fetch("/api/community/comment", { method: "PATCH", body: { commentId, value: 1 } })`.
2. 익명 사용자는 게시글 추천과 동일하게 `x-client-ip-hash` 헤더 필요. 기존 게시글 추천(`/api/community/like`)에서 헤더를 주입하는 방식(미들웨어/클라이언트 유틸)을 그대로 재사용할 것.
3. 응답의 `liked`로 버튼 활성 상태, `likeCount`로 카운트 표시 갱신.
4. 비추 버튼이 필요하면 `value: -1` 전달(스키마·API 모두 지원). 현재 기획은 추천 위주이므로 기본 1.

## 5. 실 DB 적용 안내

- 마이그레이션 파일만 작성됨. **실 DB DDL은 미실행**.
- 컨덕터/사용자가 별도 적용:
  - Supabase SQL Editor에 `supabase/migrations/20260524_comment_likes.sql` 내용 실행, 또는
  - `supabase db push` / 프로젝트 마이그레이션 파이프라인으로 적용.
- 멱등 작성(`IF NOT EXISTS`, `CREATE OR REPLACE`, `DROP TRIGGER IF EXISTS`)이므로 재실행 안전.
- 단, `CREATE POLICY`는 멱등이 아님 — 정책 이미 존재 시 재적용하면 에러. 재적용 필요 시 해당 `DROP POLICY IF EXISTS` 선행 필요(현재 신규 테이블이라 최초 적용은 무관).

## 6. 검증 결과

| 검사 | 결과 |
|------|------|
| `npx tsc --noEmit` | ✅ 에러 없음 |
| `Test-Path .../20260524_comment_likes.sql` | ✅ 존재 (4374 B) |
| migration grep `community_comment_likes` | ✅ 테이블/인덱스/트리거/RLS 매칭 |
| route grep `like` / `PATCH` | ✅ PATCH 핸들러·comment_likes 참조 매칭 |
| `npm run build` | ✅ 성공 (라우트 맵 정상 출력) |

## 7. 충돌 회피 (안티패턴 준수)

- ❌ `app/api/community/like/` 미수정 (T07 영역) — 패턴 **읽기만** 차용.
- ❌ migration 파일명 충돌 없음 — T07=`20260524_post_likes_rpc.sql`, 본 터미널=`20260524_comment_likes.sql`.
- ❌ `app/board/` 프론트 미수정 — API까지만, UI는 본 문서 §4로 인계.
- ❌ 실 DB 직접 DDL 미실행 — 마이그레이션 파일만 작성.
- ✅ 전 코드 한국어 주석.

## 8. 후속 작업 (다음 라운드 / T02)

1. 실 DB에 `20260524_comment_likes.sql` 적용 (§5).
2. 댓글 추천 버튼 UI 연결 (§4 가이드).
3. (선택) `docs/references/_SCHEMA_REFERENCE.md`·`_API_REFERENCE.md`에 `community_comment_likes` 테이블·`PATCH /api/community/comment` 계약 반영 — 컨덕터 통합 시 일괄 갱신 권장.
