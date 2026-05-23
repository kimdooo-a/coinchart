# R2 Dispatch Index — realdata-finish

> 라운드 R2. 태그 `realdata-finish`. 지휘자 + 일꾼 5 (평면). 동시 발사 허용.
> 주제: R1 잔여 과제 소진 — board/news/coin 실데이터 전환 + 차트 라이트화 + 인프라 마무리.

## 작업 매트릭스

| ID | 작업 | 쓰기 영역 (비충돌) | 의존 (R1) | 신규 query 파일 |
|----|------|------|------|------|
| R2-T01 | 게시판 3종 실데이터 (목록/상세/작성) | `app/board/**`, `lib/community/board-queries.ts` | T12·T01 | board-queries.ts (선택) |
| R2-T02 | 뉴스 실데이터 + 4차원 필터 | `app/news/**`, `lib/community/news-queries.ts` | T06 | news-queries.ts (선택) |
| R2-T03 | 코인룸 실데이터 (시세+글+뉴스) | `app/coin/**`, `lib/community/coin-queries.ts` | T03·T12·T06·T13 | coin-queries.ts (선택) |
| R2-T04 | 차트 4종 라이트화 | `components/Chart/*`, `DetailedChart.tsx`, `hero-chart.tsx` | T08 | — |
| R2-T05 | 인프라 마무리 (ISR + node:crypto + Giscus) | `app/page.tsx`, `middleware.ts`, `components/Blog/BlogComments.tsx` | T15·T07·T09 | — |

## DAG / 발사 순서

```
1차 (전부 동시 — 상호 의존 0, 쓰기 영역 비충돌):
   R2-T01  R2-T02  R2-T03  R2-T04  R2-T05
```

- 모든 task가 R1 산출물에만 의존(전부 완료) → **완전 병렬**.
- 쓰기 영역 비충돌: 각 페이지 그룹 분리, query 파일도 task별 분리(`board/news/coin-queries.ts`), 차트는 components/Chart 외 격리, 인프라는 page.tsx/middleware/BlogComments.
- 바인딩: write-guard가 소프트(env 비전파)이므로 동시 발사 시 마커가 어느 순서로 잡혀도 **실제 작업은 붙여넣은 프롬프트 파일이 결정** → 안전.

## 공통 안티패턴 (전 일꾼)

- `lib/community/mock-*.ts` **삭제 금지** — board/news/coin 전부 전환 완료 후 회수 시점에 지휘자가 unused 확인 후 일괄 삭제(또는 R3).
- 자기 allowed_dirs 외 수정 금지. 특히 `app/api/`·`middleware.ts`·`supabase/`·`lib/supabase/`·`lib/community/auth.ts`·`ip-mask.ts`·`queries.ts`·`lib/chart/theme.ts`는 R1 영역 (read-only).
- JSX 구조·디자인 토큰 대폭 변경 금지 (데이터 소스/테마만 교체).
- 새 패키지 설치 금지.
- 완료 시 `docs/handover/2026-05-23-R2-T0N-<name>.md` 작성.

## mock-* 정리 계획 (회수 후)

T01·T02·T03 완료 시 `mock-posts`/`mock-news`/`mock-coins`의 게시글·뉴스·시세 export는 전부 unused. 회수 시 지휘자가 `grep`으로 잔여 참조 확인 후:
- 참조 0 → 파일 삭제
- 정적 메타(COIN_META 등)만 잔존 → `lib/community/coin-meta.ts` 등으로 이전 (R3)

## 검증 메트릭 (회수 시 채움)

- 완료율: __ / 5
- mock import 잔여: __ (목표: 정적 메타만)
- tsc/build: __
- 격리 위반: __ (목표 0)
