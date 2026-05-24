# 2026-05-24 — R3 N-터미널 작업 매트릭스 (community-finish)

> 본 인덱스는 사용자가 12개 Claude Code 터미널을 띄워 각 프롬프트를 붙여넣어 병렬 실행하는 SOT입니다.

`created: 2026-05-24` · `conductor-session: 본 세션 (CEO)` · `라운드: R3` · `이전 라운드: R2 (docs/handover/2026-05-23-R2-_SUMMARY.md)`

## 프로젝트 방향성 (모든 터미널 공통)

> **v2.0 — 코인·주식 정보 공유 커뮤니티** (코인판 × 네이버). 디자인 톤: **네이버 스타일** (흰 배경 라이트, 한국식 **빨↑/파↓**, 정보 밀도, 표 우선). AI 차트 분석은 "도구" 메뉴로 격리된 부가 기능.
> 상세: `docs/PROJECT_DIRECTION.md`

## 사용법

1. 12개 Claude Code 터미널을 본 프로젝트 디렉토리(`F:\11_dev\260523 코인 차트분석`)에서 띄움
2. 각 터미널에서 `T0N-*.md` 내용을 복사 → 첫 메시지로 붙여넣기 (또는 발사 프롬프트 1줄)
3. 각 터미널은 자기완결적으로 진행 (독립 1M 컨텍스트)
4. 완료 시 각자 `docs/handover/2026-05-24-R3-T0N-<name>.md` 작성
5. 지휘자(본 세션)는 후속 통합·검증 담당

## 매트릭스

| T# | 트랙 | 작업 | 의존성 | 발사 차수 | 쓰기 디렉토리(격리) |
|----|------|------|--------|----------|--------------------|
| T01 | A·데이터 | 메타 SSOT 분리 (board-meta·news-meta 신규) | — | Wave 1 | `lib/community/board-meta.ts`·`news-meta.ts` + mock-*.ts re-export |
| T02 | A·데이터 | board SSR 전환 + 새 메타 | T01 | Wave 2 | `app/board/**`·`lib/community/board-queries.ts` |
| T03 | A·데이터 | news SSR 전환 + 새 메타 | T01 | Wave 2 | `app/news/**`·`lib/community/news-queries.ts` |
| T04 | A·데이터 | coin SSR 전환 + 새 메타 | T01 | Wave 2 | `app/coin/**`·`lib/community/coin-queries.ts` |
| T05 | A·데이터 | mock 완전 삭제 통합 | T02·T03·T04 | Wave 3 | `lib/community/mock-*.ts`(삭제)·`BoardSidebar.tsx`·`seed-community.ts` |
| T06 | B·기능 | 관리자 게시판 라우트 (is_notice) | — | Wave 1 | `app/admin/board/**`(신규)·`app/api/board/route.ts` 확장 |
| T07 | B·기능 | 게시글 dislike 분리 RPC + dedup 회원전이 | — | Wave 1 | `app/api/community/like/**`·`supabase/migrations/20260524_post_likes_rpc.sql` |
| T08 | B·기능 | 댓글 추천 토글 (comment_likes 신규) | — | Wave 1 | `app/api/community/comment/**`·`supabase/migrations/20260524_comment_likes.sql` |
| T09 | C·라이트화 | analysis + stock 계열 | — | Wave 1 | `app/analysis/**`·`app/stock/**`·`components/Analysis`·`components/Stock` |
| T10 | C·라이트화 | admin 계열 (16매치) | — | Wave 1 | `app/admin/page.tsx`·`app/admin/blog/**` |
| T11 | C·라이트화 | 계정/유틸 페이지 | — | Wave 1 | `app/{portfolio,watchlist,calendar,settings,secure-memo}/**`·`components/SecureMemo` |
| T12 | C·라이트화 | 정적/인증 페이지 | — | Wave 1 | `app/{contact,pricing,terms,privacy,auth,history}/**` |

## 발사 차수 (DAG)

```
Wave 1 (즉시, 9개 독립):   T01 T06 T07 T08 T09 T10 T11 T12
                            │
                            ▼ (T01 메타 SSOT 완료 후)
Wave 2 (3개, dep T01):      T02 T03 T04
                            │
                            ▼ (T02·T03·T04 도메인 SSR 완료 후)
Wave 3 (1개, dep T02~T04):  T05 (mock 완전 삭제 — 참조 0 확인 후)
```

- **Wave 1 9개는 즉시 동시 발사 가능** (충돌 0). T01은 Wave 2의 선행이므로 우선.
- Wave 2 (T02~T04)는 T01의 `board-meta.ts`/`news-meta.ts`가 있어야 새 import 경로 사용. T01 미완 시 mock-*.ts re-export로 lazy 진행 가능 (graceful).
- Wave 3 (T05)는 T02~T04가 mock 참조를 모두 끊은 후 삭제. 선행 미완 시 "참조 잔존" 보고하고 부분 진행.

## 병렬 안전성 (격리 검증 — Phase 1 §2-6 통과)

- 각 터미널은 자기 쓰기 디렉토리에만 기록.
- **T01 ↔ T05**: 둘 다 `mock-*.ts` 접촉 — T01은 re-export 1줄 추가(Wave1), T05는 삭제(Wave3). Wave 분리 + 의존으로 순차 보장.
- **T06 ↔ T10**: 둘 다 `app/admin/` — T06=`app/admin/board/`(신규), T10=`app/admin/{page,blog}`(기존 라이트화). 경로 분리.
- **T02 ↔ T06**: `app/board/`(프론트, T02) vs `app/api/board/`(API, T06). 분리.
- **T07 ↔ T08**: 다른 route(like vs comment) + 다른 migration 파일명. 충돌 0.
- 공통 SOT(`CLAUDE.md`·`docs/references/*`·`docs/PROJECT_DIRECTION.md`)는 **모든 터미널 읽기 전용** (지휘자만 수정).

## 안티패턴 (전 터미널 공통)

- ❌ 자기 쓰기 디렉토리 밖 수정 (마커 `allowed_dirs` 위반)
- ❌ 공통 SOT(`CLAUDE.md`·`docs/references/*`) 수정
- ❌ 의존성 위반 (선행 미완료를 hard-fail로 진행 — graceful fallback 사용)
- ❌ handover 누락
- ❌ 한국어 주석/커밋 메시지 누락 (글로벌 룰)
- ❌ `.env`·`.env.local`·`nul` 커밋
- ❌ 새 패키지 무단 설치 (필요 시 handover에 명시)
- ❌ 라이트화 시 의미 컬러(빨↑/파↓·강조 뱃지·코드블록 다크) 무차별 제거

## 완료 시 인수인계 형식

`docs/handover/2026-05-24-R3-T0N-<name>.md` — 수정 파일·검증 결과(PASS/FAIL)·격리 준수·미해결 TODO 명시.

## 관련

- 진입점: `../../../CLAUDE.md`
- 이전 라운드: `../../handover/2026-05-23-R2-_SUMMARY.md` · `../2026-05-23-R2-realdata-finish/_DISPATCH_CHECKPOINT.md`
- 현재 상태: `../../status/current.md`
