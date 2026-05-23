# R2-T02 — news-realdata

> **본 터미널은 R2 일꾼(R2-T02)**. 1차 발사. 동시 발사 그룹.

## 정체성

- 역할: `worker` (R2-T02), R2, realdata-finish
- 담당: 뉴스 페이지(`/news`)를 **mock → 실데이터(`/api/news`)** 로 전환 + 4차원 필터(코인·분류·감정·정렬) 실연결
- 의존: R1/T06 (news 4차원 컬럼 `category`/`importance_score`/`sentiment_score` + `/api/news` 필터)

## 컨텍스트

`app/news/page.tsx`(`"use client"`)는 `lib/community/mock-news.ts`(MOCK_NEWS/NEWS_CATEGORIES/COIN_FILTERS/getHeadlines) + `mock-coins.ts`(사이드바)를 사용 중. T06이 `news` 테이블에 4차원 컬럼을 추가하고 `/api/news`에 `?category=`·`?minImportance=` 필터를 구현해 두었다. 본 일꾼은 페이지를 `/api/news` 호출로 연결하고 4차원 필터를 서버/클라에 연결한다. JSX·디자인 보존.

## 공통 SOT (읽기 전용)

```
CLAUDE.md
docs/handover/2026-05-23-R1-T06-news-classify-integration.md  ← news 컬럼·/api/news 필터 (필독)
docs/handover/2026-05-23-R1-T05-news-classifier.md            ← 분류 4차원 의미·키워드
docs/handover/2026-05-23-R1-T15-mainpage-realdata.md          ← MainNewsItem 매핑·NewsRow 변환 패턴 참고
docs/references/_API_REFERENCE.md                              ← GET /api/news 명세
app/news/page.tsx                                              ← 수정 대상
components/community/NewsRow.tsx / NewsHeadlineCard.tsx        ← props 계약
lib/community/mock-news.ts                                     ← NEWS_CATEGORIES/COIN_FILTERS 라벨 사전 참고 (수정 금지)
```

## 데이터 계약 (handover 필독)

- `news` 컬럼: `id, title, link, source, pub_date, sentiment, category, importance_score, symbol`
- `GET /api/news?category=&minImportance=&...` → 4차원 필드 포함 응답
- 매핑 주의: `sentiment` enum, `category` 영문 enum(`regulation`/`tech`/...) → 한글 라벨 매핑 필요(`NEWS_CATEGORIES` 라벨 사전 참고), `symbol === "ALL"`은 coinTag null

## 작업 목표

`/api/news` 실데이터로 헤드라인 카드 + 4차원 필터 표를 채운다.

### 산출물

- **수정** `app/news/page.tsx`: `MOCK_NEWS`/`getHeadlines`/클라 필터 → `GET /api/news` 호출. 코인 필터(`COIN_FILTERS`)·분류 탭(`NEWS_CATEGORIES`)·감정·정렬은 쿼리 파라미터로 서버 위임(또는 응답 후 클라 필터). 로딩·빈·에러 처리.
- **(선택) 신규** `lib/community/news-queries.ts`: 클라 fetch 래퍼 + row→`NewsRow`/`NewsHeadlineCard` props 매퍼 + category 영문→한글 라벨 사전.
- **사이드바 위젯**: `TICKER_LIST`/`HOT_ISSUES`/`OFFICIAL_POSTS` → `GET /api/coins/ticker`·`/api/coins/hot-issues`·`/api/fng` 클라 fetch.
- 헤드라인 3종: `importance_score` 상위 또는 최신 기준 선별(handover 권고 따름).

## 작업 단계

1. SOT 정독 (T06 handover 우선)
2. fetch 헬퍼 + 매퍼(category 라벨 사전 포함) 작성
3. 4차원 필터 → 쿼리 파라미터 매핑 (코인/분류/감정/정렬)
4. 헤드라인 카드 + 표 실데이터 렌더
5. 사이드바 위젯 실데이터화
6. fallback (뉴스 0건 안내 등)
7. 검증

## 검증

```bash
npx tsc --noEmit                                              # 0 error
grep -rn "@/lib/community/mock-" app/news/                    # 기대: 라벨 사전만 (또는 0)
grep -rn "/api/news" app/news/                                # 기대: ≥1
npm run build 2>&1 | tail -20                                 # Compiled successfully
```

시각 검증(권장): `npm run dev` → `/news` 진입, 4차원 필터 동작 + 헤드라인/표 채워짐 확인.

## 완료 신호

`docs/handover/2026-05-23-R2-T02-news-realdata.md` 작성. 명시: 수정 파일·필터→파라미터 매핑표·category 라벨 사전·fallback·mock import 잔여 사유.

## 안티패턴

- `lib/community/mock-*.ts` 삭제 금지 (회수 후 지휘자 일괄)
- `app/board/`, `app/coin/`, `app/page.tsx`, `app/api/news/` **수정 금지** (각 영역 외)
- 분류 로직(`lib/news/classifier.ts`·`keyword-dict.ts`) 수정 금지 (T05 영역)
- JSX·디자인 대폭 변경 금지
- 새 패키지 설치 금지
