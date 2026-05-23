# R1 Dispatch Checkpoint — 메인페이지 풀데이터

> SOT 파일. 각 라운드 진행 상태를 본 세션(지휘자)이 갱신. 다음 라운드 재개 시 P1 컨텍스트로 적재.

## 라운드 메타

| 항목 | 값 |
|---|---|
| 라운드 | R1 |
| 시작일 | 2026-05-23 |
| 태그 | mainpage |
| 터미널 수 | 15 |
| 상태 | **round1_complete** (15/15 완료 · 블로커 0 · tsc/build PASS) |
| 다음 갱신 시점 | R1 일괄 통합 커밋 완료 → R2 발사 여부 사용자 결정 |

## 일꾼 진행 상태 (2026-05-23 R1 재개 세션 재검증)

> 지휘자 재개 세션이 산출물 직접 검증으로 재조정. 11:05 체크포인트(9/15) → 세션 16(T02)·17(T13) 완료분 반영하여 **12/15**로 정정. 미완료 3건(T09·T11·T15)은 산출물 부재 직접 확인.

| ID | 이름 | 상태 | handover | 산출물 검증 |
|---|---|---|---|---|
| T01 | community-migrations | ✅ **DONE** | ✅ | SQL 335줄 |
| T02 | community-seed | ✅ **DONE** | ✅ | seed-community.ts 156행 (세션16 커밋) |
| T03 | ticker-ssot | ✅ **DONE** | ✅ | coins.ts + /api/coins/ticker (세션8 커밋) |
| T04 | fng-proxy | ✅ **DONE** | ✅ | fng.ts + /api/fng |
| T05 | news-classifier | ✅ **DONE** | ✅ | classifier.ts + keyword-dict.ts |
| T06 | news-classify-integration | ✅ **DONE** | ✅ | alter SQL + crawl/news API 통합 |
| T07 | auth-middleware | ✅ **DONE (PASS)** | ✅ | auth/ip-mask/middleware, bcryptjs 설치 |
| T08 | chart-theme + editor-tone | ✅ **DONE** | ✅ | lib/chart/theme.ts + BlogEditor tone |
| T09 | blog-lightify | ✅ **DONE** (재발사) | ✅ | 18파일, 영역 내 다크톤 0·라이트토큰 70 |
| T10 | analysis-lightify | ✅ **DONE** | ✅ | analysis 8파일 라이트화 |
| T11 | signal-market-lightify | ✅ **DONE** (재발사) | ✅ | 6파일 45/45 대칭, 다크 surface 0 |
| T12 | board-api | ✅ **DONE** | ✅ | api/board + community/{comment,like} |
| T13 | hot-issues-rpc | ✅ **DONE** | ✅ | RPC + /api/coins/hot-issues (세션17 커밋) |
| T14 | translations-cleanup | ✅ **DONE** | ✅ | translations menu + global-header |
| T15 | mainpage-realdata | ✅ **DONE** (재발사) | ✅ | queries.ts 신규 + page.tsx SSR, mock import 0, revalidate=300 (`/`는 cookies로 동적 렌더) |

## 블로커

1. ~~**bcryptjs 미설치**~~ → ✅ **해소** (CEO가 2026-05-23T13:00에 `npm install bcryptjs @types/bcryptjs` 완료. tsc 0 에러 통과. T07 PASS 승급.)

## 중복 발사 정리

- **T03 마커 PID 87016 (2026-05-23T13:00 발사)**: T03 handover가 이미 작성된 상태에서 중복 발사. 사용자가 해당 터미널 종료 예정. SessionEnd hook이 마커를 `.dispatch/archive/R1-2026-05-23/`로 이동.

## 산출 파일 검증 (12개 모두 존재)

✅ supabase/migrations/20260523_create_community_tables.sql (335줄)
✅ supabase/migrations/20260523_alter_news_classify.sql (18줄)
✅ types/coins.ts (28줄)
✅ app/api/coins/ticker/route.ts (20줄)
✅ lib/community/fng.ts (46줄)
✅ app/api/fng/route.ts (17줄)
✅ lib/news/classifier.ts (143줄)
✅ lib/news/keyword-dict.ts (158줄)
✅ lib/community/auth.ts (21줄)
✅ lib/community/ip-mask.ts (24줄)
✅ middleware.ts (94줄)
✅ lib/chart/theme.ts (67줄)

## 상태 코드

- `pending`: 미발사
- `launched`: 사용자가 새 터미널에서 발사 완료, hook이 마커 바인딩
- `in_progress`: 진행 중
- `handover_written`: handover 파일 작성됨, 지휘자 검증 대기
- `verified`: 지휘자 검증 통과
- `failed`: 검증 실패 또는 격리 위반 발생, 재발사 또는 부분 수정 필요

## 통합 메트릭 (R1 재개 세션 중간 집계)

- 완료율: **12 / 15 (80%)**
- 자가 검증 PASS율: 12 / 12 (handover 작성분 전원 PASS)
- 격리 위반 건수: **0** (목표 0 달성)
- 미해결: 미완료 3건 (T09·T11·T15) — 부분 재발사 후보, 의존성 전부 충족·병렬 가능
- 통합 보고서: `docs/handover/2026-05-23-R1-_SUMMARY.md`

## 다음 라운드 결정 (Phase 5)

- [ ] 종료
- [ ] R2 발사 — 주제: __
- [x] **부분 재발사 — 대상 T09·T11·T15** (3개 새 터미널 병렬, 쓰기 영역 비충돌)
  - T09: app/blog 라이트화 (의존 T08 ✅)
  - T11: app/signal·market·stock-market 라이트화 (의존 T08 ✅)
  - T15: 메인페이지 실데이터 — R1 핵심 산출물 (의존 T01·T02·T03·T04·T06·T12·T13 전부 ✅)
