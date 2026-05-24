# T08 — 댓글 추천 토글 (comment_likes 신규 테이블)

> **본 터미널은 R3 일꾼(T08 / 12)**. Wave 1 (즉시 발사, 독립).

## 1. 컨텍스트

- 프로젝트: Crypto Chart Analysis (v2.0 커뮤니티)
- 작업 디렉토리: `F:\11_dev\260523 코인 차트분석`
- 본 터미널 역할: **T08 / 12** — **댓글 추천 토글** 기능 신규 구현 (테이블 + API)
- 라운드: R3 (community-finish)

배경: `community_comments` 테이블은 존재(parent_id self-reference 대댓글). 게시글에는 `community_post_likes`(추천/비추)가 있지만 **댓글 추천용 테이블·API는 없다**(T12 §6 후보). 본 터미널이 `community_post_likes` 패턴을 차용해 `community_comment_likes`를 신규 생성하고, `/api/community/comment`에 댓글 추천 토글을 추가한다.

## 2. 공통 SOT (읽기 전용)

```
CLAUDE.md  ·  docs/PROJECT_DIRECTION.md
docs/references/_SCHEMA_REFERENCE.md                    ← community_comments / community_post_likes 패턴
docs/references/_API_REFERENCE.md                       ← POST /api/community/comment 계약
supabase/migrations/20260523_create_community_tables.sql ← post_likes 스키마·트리거·RLS (차용 원본, 읽기)
app/api/community/comment/route.ts                       ← 수정 대상 (추천 액션 추가)
lib/community/ip-mask.ts  ·  lib/community/auth.ts       ← 익명/회원 dedup 패턴 (읽기)
```

## 3. 작업 목표

### Phase 1: comment_likes 테이블 (신규 마이그레이션)
- **신규** `supabase/migrations/20260524_comment_likes.sql`:
  - `community_comment_likes(id, comment_id FK, user_id?, ip_hash?, value, created_at)` — `community_post_likes` 패턴 차용 (회원=user_id, 익명=ip_hash dedup unique 인덱스)
  - `community_comments`에 `like_count` 카운터 컬럼 + 트리거(`post_likes` 트리거 패턴) 또는 집계 RPC
  - RLS: 공개 SELECT, INSERT 서버 검증, DELETE 본인만 (post_likes 정책 차용)
- 실 DB 적용은 컨덕터/사용자 별도 실행 (파일만 작성).

### Phase 2: 댓글 추천 API
- `/api/community/comment/route.ts`에 댓글 추천 토글 추가(또는 별도 메서드/서브경로). 익명/회원 dedup은 ip_hash/user_id. 응답에 `liked`·`likeCount`.

### Phase 3: (선택) 댓글 추천 UI 연결 노트
- 상세 페이지 댓글 추천 버튼은 T02(board SSR) 영역이므로 **본 터미널은 API까지만**. handover에 UI 연결 가이드(엔드포인트·payload) 명시 → T02 또는 후속 라운드가 연결.

## 4. 도구 권장
- 직접 작성. post_likes 마이그레이션을 템플릿으로 차용(일관성).

## 5. 의존성
- **독립** (Wave 1). post_likes 패턴 참고만.
- T07(게시글 dislike)과 **다른 route(comment vs like) + 다른 migration 파일** → 충돌 0.

## 6. 검증

```powershell
npx tsc --noEmit
Test-Path supabase/migrations/20260524_comment_likes.sql
Select-String -Path app/api/community/comment/route.ts -Pattern "like|comment_like" 
npm run build 2>&1 | Select-Object -Last 15
```

```bash
npx tsc --noEmit
grep -n "comment_likes\|community_comment_likes" supabase/migrations/20260524_comment_likes.sql
grep -n "like" app/api/community/comment/route.ts
npm run build 2>&1 | tail -15
```

## 7. 완료 신호
`docs/handover/2026-05-24-R3-T08-comment-likes.md` 작성. 명시: comment_likes 스키마(post_likes 차용점)·트리거/RPC·API 토글 계약·UI 연결 가이드(T02용)·실 DB 적용 안내.

## 8. 안티패턴
- ❌ `app/api/community/like/` 수정 (T07 영역)
- ❌ migration 파일명 충돌 (T07은 `20260524_post_likes_rpc.sql` — 본 터미널은 `20260524_comment_likes.sql`)
- ❌ `app/board/` 프론트 수정 (T02 영역 — API까지만, UI는 가이드 인계)
- ❌ 실 DB에 직접 DDL 실행 (마이그레이션 파일만)
- ❌ 한국어 주석 누락
