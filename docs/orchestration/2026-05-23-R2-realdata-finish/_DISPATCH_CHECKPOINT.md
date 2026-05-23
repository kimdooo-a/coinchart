# R2 Dispatch Checkpoint — realdata-finish

> SOT 파일. 지휘자가 갱신. 재개 시 P1 컨텍스트로 적재.

## 라운드 메타

| 항목 | 값 |
|---|---|
| 라운드 | R2 |
| 시작일 | 2026-05-23 |
| 태그 | realdata-finish |
| 터미널 수 | 5 (평면) |
| 발사 방식 | 동시 발사 허용 |
| 상태 | **round2_complete** (5/5 완료 · tsc/build PASS · 격리 이탈 1건 BoardSidebar) |
| 선행 | R1 15/15 완료·커밋(`60d4298` + 일꾼 cs 3건) |

## 일꾼 진행 상태 (회수 검증)

| ID | 작업 | 상태 | handover | 검증 |
|---|---|---|---|---|
| R2-T01 | board-realdata | ✅ **DONE** | ✅ | board-queries.ts 446줄(fetch 10) + 3페이지 전환, BOARD_META 정적 보존 |
| R2-T02 | news-realdata | ✅ **DONE** | ✅ | /api/news 4호출 + 4차원 필터, 라벨 사전 보존 |
| R2-T03 | coin-realdata | ✅ **DONE** | ✅ | coin-queries.ts 444줄(fetch 6), mock import 0 |
| R2-T04 | chart-lightify | ✅ **DONE** (cs `1ae0cd6`) | ✅ | 차트 4종 getChartTheme/getCandleColors, 하드코딩 다크 0 |
| R2-T05 | infra-finish | ✅ **DONE** (cs `8fcadb3`) | ✅ | / 정적 ISR(ƒ→○), node:crypto 경고 0, Giscus light |

## 마커 상태

- `.dispatch/teams/R2-T01..R2-T05/workers/*.lock` 생성 완료 (processId=0 미바인딩)
- R1 마커 15팀 → `.dispatch/archive/R1-markers/` 이동 (R2 풀 정리)

## 상태 코드

`pending`(미발사) · `launched` · `in_progress` · `handover_written` · `verified` · `failed`

## 통합 메트릭 (최종)

- 완료율: **5 / 5 (100%)** ✅
- mock import 잔여: 정적 메타/타입만 (`BOARD_META`/`BoardSlug` ×3, `NEWS_CATEGORIES`/`COIN_FILTERS` ×1). 데이터 배열·getter·`mock-coins` 전부 unused
- tsc: 0 에러 · build: Compiled successfully (`/` ○ 정적 ISR, node:crypto 경고 0)
- 격리 위반: **1건** — `components/community/BoardSidebar.tsx`(T01이 allowed_dirs 밖에 생성). 신규·무충돌·소프트가드라 허용. R2 통합 커밋에 포함

## mock-* 정리 (회수 결과 → R3 이월)

- 잔여는 정적 메타/타입뿐 → 빌드 무해. 데이터부 트리밍은 코드 리팩토링이라 R3로 이월
- R3 계획: `mock-coins.ts` 삭제(참조 0) + `BOARD_META`→`lib/community/board-meta.ts`, `NEWS_CATEGORIES`/`COIN_FILTERS`→`lib/community/news-meta.ts` 이전 후 `mock-posts`/`mock-news` 데이터부 삭제

## 다음 라운드 결정 (Phase 5)

- [ ] 종료 (R2 완료 시 v2.0 실데이터 전환 일단락)
- [ ] R3 — mock-* 완전 삭제 + 관리자 라우트 / 댓글 추천 / dislikeCount 분리 등 (T12 §6 후보)
