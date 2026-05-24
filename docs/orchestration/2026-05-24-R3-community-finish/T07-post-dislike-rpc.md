# T07 — 게시글 추천/비추 dislikeCount 분리 RPC + dedup 회원전이 정책

> **본 터미널은 R3 일꾼(T07 / 12)**. Wave 1 (즉시 발사, 독립).

## 1. 컨텍스트

- 프로젝트: Crypto Chart Analysis (v2.0 커뮤니티)
- 작업 디렉토리: `F:\11_dev\260523 코인 차트분석`
- 본 터미널 역할: **T07 / 12** — 게시글 **추천/비추 카운트를 분리 집계하는 RPC** + **추천 dedup 회원 전이 케이스 정책** 구현
- 라운드: R3 (community-finish)

배경: `community_post_likes(value: 1=추천, -1=비추)` 테이블 존재. user_id/ip_hash unique 인덱스로 dedup. 현재 `/api/community/like`는 토글 후 `{ liked, likeCount }`만 반환(R2-T01 계약). **문제 (T12 §6 후보)**: (1) 추천/비추를 합산하지 않고 분리(likeCount·dislikeCount) 반환하는 RPC가 없음, (2) **회원 전이 케이스** — 익명(ip_hash)으로 추천한 사용자가 로그인하면 같은 글에 user_id로 또 추천 가능(중복). 본 터미널이 분리 집계 RPC + 회원전이 dedup 정책을 구현한다.

## 2. 공통 SOT (읽기 전용)

```
CLAUDE.md  ·  docs/PROJECT_DIRECTION.md
docs/references/_SCHEMA_REFERENCE.md                    ← community_post_likes (value ±1, unique 인덱스)
docs/references/_API_REFERENCE.md                       ← POST /api/community/like 계약
docs/handover/2026-05-23-R2-T01-board-realdata.md       ← 추천 버튼 호출 구조
app/api/community/like/route.ts                          ← 수정 대상
supabase/migrations/20260523_create_community_tables.sql ← post_likes 스키마·트리거 (읽기)
lib/community/ip-mask.ts                                 ← ip_hash 생성 방식 (읽기)
```

## 3. 작업 목표

### Phase 1: 분리 집계 RPC
- **신규** `supabase/migrations/20260524_post_likes_rpc.sql`: `community_post_like_counts(post_id)` 또는 토글 함수가 `{ like_count, dislike_count }`를 반환하도록 RPC 작성 (value=1 합 / value=-1 합 분리). 기존 트리거(`trg_community_post_likes_count`)가 합산만 한다면 보완.
- 실 DB 적용은 컨덕터/사용자가 별도 실행 (마이그레이션 파일만 작성).

### Phase 2: dedup 회원 전이 정책
- `/api/community/like/route.ts`: 추천 시 **로그인 사용자라면 같은 글에 본인 ip_hash로 남긴 익명 추천을 흡수/정리**(중복 카운트 방지). 정책 결정:
  - (권장) 회원 추천 INSERT 시, 동일 post + 동일 ip_hash 익명 추천이 있으면 user_id로 승계(UPDATE) 또는 익명 행 삭제 후 회원 행 생성
  - 트랜잭션/RPC로 원자적 처리
- 정책 근거·엣지케이스를 `docs/` 문서로 기록 (예: `docs/rules/community-like-dedup.md` 신규)

### Phase 3: API 응답 확장
- `/api/community/like` 응답에 `dislikeCount` 추가(하위호환: 기존 `likeCount`·`liked` 유지). 비추 토글도 지원.

## 4. 도구 권장
- 직접 작성. SQL RPC + 라우트 트랜잭션. 정책은 `/kdydevil` 프리모템으로 엣지케이스 점검 권장.

## 5. 의존성
- **독립** (Wave 1). 기존 post_likes 스키마 활용.
- T08(댓글 추천)과 **다른 route(like vs comment) + 다른 migration 파일** → 충돌 0.

## 6. 검증

```powershell
npx tsc --noEmit
Test-Path supabase/migrations/20260524_post_likes_rpc.sql
Select-String -Path app/api/community/like/route.ts -Pattern "dislike"   # 분리 카운트
npm run build 2>&1 | Select-Object -Last 15
```

```bash
npx tsc --noEmit
grep -n "dislike\|like_count\|dislike_count" app/api/community/like/route.ts supabase/migrations/20260524_post_likes_rpc.sql
npm run build 2>&1 | tail -15
```

## 7. 완료 신호
`docs/handover/2026-05-24-R3-T07-post-dislike-rpc.md` 작성. 명시: RPC 시그니처·회원전이 dedup 정책·트랜잭션 방식·API 응답 확장(하위호환)·정책 문서 경로·실 DB 적용 안내.

## 8. 안티패턴
- ❌ `app/api/community/comment/` 수정 (T08 영역)
- ❌ migration 파일명 충돌 (T08은 `20260524_comment_likes.sql` — 본 터미널은 `20260524_post_likes_rpc.sql`)
- ❌ 기존 `likeCount`/`liked` 응답 필드 제거 (board 추천 버튼 깨짐 — 추가만)
- ❌ 실 DB에 직접 DDL 실행 (마이그레이션 파일만 — 적용은 컨덕터)
- ❌ 한국어 주석 누락
