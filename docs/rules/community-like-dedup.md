# 커뮤니티 게시글 추천/비추 dedup 정책 (회원전이 포함)

> R3 (community-finish) / T07 — 2026-05-24 작성
> 대상: `community_post_likes` 테이블, `POST /api/community/like`,
> RPC `community_toggle_post_like` / `community_post_like_counts`
> (`supabase/migrations/20260524_post_likes_rpc.sql`)

## 1. 배경

`community_post_likes(value: 1=추천, -1=비추)`는 두 가지 식별 단위로 중복 투표를 막는다.

| 식별 단위 | dedup 키 | UNIQUE 인덱스 |
|-----------|----------|----------------|
| 회원 | `user_id` | `uniq_community_post_likes_user(post_id, user_id) WHERE user_id IS NOT NULL` |
| 익명 | `ip_hash` = `hmac_sha256(전체 IP)` | `uniq_community_post_likes_iphash(post_id, ip_hash) WHERE ip_hash IS NOT NULL` |

`ip_hash`는 미들웨어(`middleware.ts`)가 `/api/community` 요청에 `x-client-ip-hash` 헤더로
**회원·익명 모두에게** 주입한다 (`lib/community/ip-mask.ts`의 `hashIp`).

### 해결한 문제

1. **추천/비추 미분리** — `community_posts.like_count`는 트리거가 `SUM(value)`(추천−비추 순합산,
   음수 가능)로 유지하므로 "추천 N / 비추 M"을 분리해 보여줄 수 없었다.
2. **회원 전이 중복** — 익명(`ip_hash`)으로 추천한 사용자가 로그인하면 같은 글에 `user_id`로
   **또 추천**할 수 있었다(두 행이 모두 카운트 → 중복 집계).

## 2. 분리 집계 (Phase 1)

- `community_post_like_counts(post_id)` → `{ like_count, dislike_count }`
  - `like_count`    = `value=1` 행 수 (추천 수, ≥ 0)
  - `dislike_count` = `value=-1` 행 수 (비추 수, ≥ 0)
- `community_posts.like_count` **컬럼과 트리거는 그대로 유지**한다(순합산 = 인기순 정렬용).
  분리 집계는 RPC가 즉시 계산해 반환하므로 별도 캐시 컬럼을 두지 않는다.

## 3. 회원 전이 dedup 정책 (Phase 2)

회원 요청이면서 `ip_hash`를 함께 보유한 경우, **토글 전에** 본인 익명 추천 행을 정리한다.

```
IF 회원 행이 이미 존재 (post_id, user_id):
    동일 (post_id, ip_hash) 익명 행 DELETE        -- 중복 정리 (트리거가 like_count 정정)
ELSE:
    동일 (post_id, ip_hash) 익명 행을 UPDATE        -- 회원 행으로 승계
        SET user_id = <회원>, ip_hash = NULL        -- value 보존 → 카운트 변동 없음
```

### 승계(UPDATE) vs 삭제(DELETE) 선택 근거

- **회원 행이 없으면 승계**: 사용자의 기존 투표 의사(추천/비추 + value)를 보존한다.
  `value`를 건드리지 않으므로 트리거의 UPDATE 분기(`NEW.value <> OLD.value`)가 false →
  `like_count` 컬럼 변동 없음. 즉 "표가 익명→회원으로 식별자만 바뀐다".
- **회원 행이 이미 있으면 삭제**: 이미 회원으로 투표한 상태이므로 익명 행은 순수 중복.
  삭제로 정정한다(레거시·중복 적재분 정리).
- 승계는 항상 "회원 행 없음" 분기에서만 실행하므로 `(post_id, user_id)` UNIQUE 위반이 없다.
- 승계 후 `ip_hash = NULL`이라 익명 UNIQUE 인덱스에서 제외되고,
  CHECK(`user_id IS NOT NULL OR ip_hash IS NOT NULL`)는 `user_id`로 만족한다.

## 4. 토글 + 원자성

dedup → 토글 → 집계를 단일 RPC(`community_toggle_post_like`, plpgsql 함수 = 단일 트랜잭션)로
처리해 중간 상태 노출·부분 실패를 방지한다.

토글 규칙(기존 R1 계약 유지):
- 기존 표 없음 → INSERT
- 기존 `value` == 요청 `value` → DELETE (취소)
- 기존 `value` != 요청 `value` → UPDATE (추천↔비추 전환)

## 5. 엣지 케이스 (프리모템)

| # | 시나리오 | 처리 | 결과 |
|---|----------|------|------|
| 1 | 익명 추천 → 로그인 → **추천** 클릭 | 익명 행 승계(value=1 보존) → 회원 행 토글 | 동일 value → **취소** (like_count −1) |
| 2 | 익명 추천 → 로그인 → **비추** 클릭 | 익명 행 승계 → 회원 행 토글 | value 전환 → 추천 0·비추 1 |
| 3 | 레거시 중복(익명+회원 추천 공존) → 클릭 | 익명 중복 행 삭제 → 회원 행 토글 | 중복 정리 + 토글 1회로 정정 |
| 4 | 회원인데 `ip_hash` 헤더 누락 | 흡수 스킵(`p_ip_hash IS NULL`) | `user_id` dedup으로 정상 토글 |
| 5 | 익명인데 `ip_hash` 없음 | 라우트에서 **400 거부** | dedup 식별자 부재 |
| 6 | 동시 더블클릭(별도 트랜잭션) | UNIQUE 인덱스가 두 번째 INSERT 차단 가능 → 500 | 프런트 `likeBusy` 가드로 1차 방지 |

### 알려진 트레이드오프
- **#1**: 로그인 직후 "추천 상태"를 UI가 모른 채 추천 버튼을 누르면 의도와 달리 취소될 수 있다.
  근본 해결은 게시글 상세 진입 시 "내 투표 상태"를 조회하는 별도 API(후속) — 본 라운드 범위 외.
- **#3**: 레거시 중복은 한 번의 클릭으로 양쪽이 모두 정리되어 카운트가 크게 변동할 수 있으나,
  dedup 도입 이후 정상 흐름에서는 중복이 더 이상 쌓이지 않는다.

## 6. API 응답 (Phase 3, 하위호환)

`POST /api/community/like` 응답:

```jsonc
{
  "liked": true,        // (기존) 최종 추천 활성 여부 — value=1만 true
  "likeCount": 12,      // 추천 수 (value=1 합). 기존 필드명 유지, 값 의미는 순합산 → 추천 수로 변경
  "dislikeCount": 3     // (신규) 비추 수 (value=-1 합)
}
```

- `liked`·`likeCount` 필드는 제거하지 않는다(board 추천 버튼 하위호환).
- `likeCount`는 분리 집계 도입에 맞춰 **추천 수**(value=1 합)를 의미한다.
  기존엔 `community_posts.like_count`(순합산, 음수 가능)였으나, board 상세는 이를 "추천 N"으로
  표시 중이라 추천 수로 바뀌면 오히려 표시가 정확해진다(필드/타입 동일 → UI 무수정 동작).
- `dislikeCount`는 board 상세의 로컬 토글(0/1) 비추 표시를 실데이터로 교체할 때 사용(UI 연결은 후속).

## 7. 실 DB 적용

마이그레이션 파일만 작성됨. 실제 적용은 컨덕터/운영자가 수행:

```bash
# Supabase SQL Editor 또는 CLI
supabase db push          # 또는 SQL Editor에 20260524_post_likes_rpc.sql 붙여넣기
```

함수는 `CREATE OR REPLACE`라 재적용 안전(idempotent). 테이블/트리거 변경 없음.
