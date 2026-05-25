# 2026-05-25 — R4 N-터미널 작업 매트릭스 (community-wiring)

> 본 인덱스는 사용자가 4개 Claude Code 터미널을 띄워 각 프롬프트를 붙여넣어 병렬 실행하는 SOT입니다.

`created: 2026-05-25` · `conductor-session: 본 세션 (CEO)` · `라운드: R4` · `이전 라운드: R3 (docs/handover/2026-05-24-R3-_SUMMARY.md)`

## 프로젝트 방향성 (모든 터미널 공통)

> **v2.0 — 코인·주식 정보 공유 커뮤니티** (코인판 × 네이버). 디자인 톤: **네이버 스타일** (흰 배경 라이트, 한국식 **빨↑/파↓**, 정보 밀도, 표 우선). AI 차트 분석은 "도구" 메뉴로 격리된 부가 기능.
> 상세: `docs/PROJECT_DIRECTION.md`

## 라운드 배경 (R3 → R4)

R3에서 board/news/coin **SSR 전환** + mock 완전 삭제 + 게시글 dislike 분리 RPC(T07) + 댓글 추천 comment_likes(T08)까지 백엔드·UI가 양측 준비됐으나 **결선(wiring)이 미완**. R4는 그 마지막 결선 + 실 DB 적용 + 정리 + 검증을 마감한다.

- **백엔드 준비 완료**: `/api/community/like`는 이미 `{ liked, likeCount, dislikeCount }` 반환, `/api/community/comment` PATCH는 `{ liked, likeCount }` 반환.
- **UI placeholder 잔존**: `PostVoteButtons`의 `비추 {disliked ? 1 : 0}`, `CommentSection`의 ThumbsUp `onClick` 미연결.
- **실 DB 미적용**: `20260524_post_likes_rpc.sql`(RPC `community_toggle_post_like`)·`20260524_comment_likes.sql`(테이블/트리거)가 적용돼야 위 라우트가 실동작.

## 사용법

1. 4개 Claude Code 터미널을 본 프로젝트 디렉토리(`F:\11_dev\260523 코인 차트분석`)에서 띄움
2. 각 터미널에서 발사 프롬프트 1줄(또는 `T0N-*.md` 전체)을 첫 메시지로 붙여넣기
3. 각 터미널은 자기완결적으로 진행 (독립 1M 컨텍스트)
4. 완료 시 각자 `docs/handover/2026-05-25-R4-T0N-<name>.md` 작성
5. 지휘자(본 세션)는 후속 통합·검증 담당

## 매트릭스

| T# | 트랙 | 작업 | 의존성 | 발사 차수 | 쓰기 디렉토리(격리) |
|----|------|------|--------|----------|--------------------|
| T01 | DB | 마이그레이션 2종 검증 + `supabase db push` 런북 + 적용후 스모크 스크립트 (실제 push는 운영자) | — | Wave 1 | `docs/db/`(신규)·`scripts/smoke/`(신규) |
| T02 | UI | 게시글 비추(dislikeCount) + 댓글 추천(PATCH) UI 결선 | — (실동작은 T01) | Wave 1 | `lib/community/board-queries.ts`·`components/community/PostVoteButtons.tsx`·`CommentSection.tsx` |
| T03 | 정리 | `news-queries.ts` SSR 전환 후 unused 클라 fetch 함수 제거 | — | Wave 1 | `lib/community/news-queries.ts` |
| T04 | QA | board/news/coin SSR + 추천/비추/댓글/관리자공지 E2E (kdye2e) | T01·T02 | Wave 2 | `e2e/`(신규)·`docs/e2e/`(신규) |

## 발사 차수 (DAG)

```
Wave 1 (즉시, 3개 독립):    T01 T02 T03
                            │
                            ▼ (T01 DB 적용 + T02 wiring 완료 후)
Wave 2 (1개, dep T01·T02):  T04 (E2E — 시나리오·코드는 즉시 작성 가능, 실행 검증은 선행 후)
```

- **Wave 1 3개는 즉시 동시 발사 가능** (쓰기 디렉토리 충돌 0).
- T04(E2E)는 시나리오·Playwright 코드 작성은 독립적으로 가능하나, **실행 검증**은 T01(실 DB 적용)+T02(wiring) 완료가 선행. 실 DB 미적용 시 SSR 라우트 렌더까지만 부분 검증하고 추천/댓글 플로우는 "DB 적용 후 재실행" 보고.

## 병렬 안전성 (격리 검증 — Phase 1 §2-6 통과)

- 각 터미널은 자기 쓰기 디렉토리에만 기록.
- **T02 ↔ T03**: 둘 다 `lib/community/` 아래지만 `board-queries.ts`(T02) vs `news-queries.ts`(T03) — 별개 파일. 충돌 0.
- **T01 ↔ T04**: 둘 다 `docs/` 신규 하위 — T01=`docs/db/`, T04=`docs/e2e/`. 경로 분리. scripts도 T01=`scripts/smoke/`(신규)로 격리.
- **T01의 `supabase/migrations/`는 읽기 전용** (검증만, 수정 금지 — 이미 R3에서 작성·커밋됨).
- 공통 SOT(`CLAUDE.md`·`docs/references/*`·`docs/PROJECT_DIRECTION.md`)는 **모든 터미널 읽기 전용** (지휘자만 수정).
- handover는 각자 `docs/handover/2026-05-25-R4-T0N-*.md` (파일명 분리 — 충돌 0).

## 안티패턴 (전 터미널 공통)

- ❌ 자기 쓰기 디렉토리 밖 수정 (마커 `allowed_dirs` 위반)
- ❌ 공통 SOT(`CLAUDE.md`·`docs/references/*`) 수정 — 갱신 필요 시 handover에 명시, 지휘자가 통합
- ❌ 의존성 위반 (선행 미완료를 hard-fail로 진행 — graceful fallback 사용)
- ❌ handover 누락
- ❌ 한국어 주석/커밋 메시지 누락 (글로벌 룰)
- ❌ `.env`·`.env.local`·`nul` 커밋
- ❌ 새 패키지 무단 설치 (필요 시 handover에 명시)
- ❌ 실 DB 자격증명·서비스 키를 코드/문서에 하드코딩

## 완료 시 인수인계 형식

`docs/handover/2026-05-25-R4-T0N-<name>.md` — 수정 파일·검증 결과(PASS/FAIL)·격리 준수·미해결 TODO 명시.

## 관련

- 진입점: `../../../CLAUDE.md`
- 이전 라운드: `../../handover/2026-05-24-R3-_SUMMARY.md` · `../2026-05-24-R3-community-finish/_DISPATCH_CHECKPOINT.md`
- 현재 상태: `../../status/current.md`
- 다음 작업 프롬프트: `../../handover/next-dev-prompt.md` (R4 후보 §)
