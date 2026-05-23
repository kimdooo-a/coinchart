# 인수인계서 — R2 / T02 news-realdata

- 일시: 2026-05-23
- 라운드: R2 (realdata-finish)
- 일꾼: R2-T02 (worker)
- 의존: **R1/T06** (`news` 4차원 컬럼 + `/api/news` 필터), R1/T03(ticker)·R1/T04(fng)·R1/T13(hot-issues)
- 상태: **완료** — 검증 4/4 PASS (tsc 0 error, mock 라벨사전만, /api/news 연결, build 성공)

> ⚠️ **디스패치 메모**: 본 작업이 발사된 단말은 SessionStart hook상 **R2-T05**로 식별되었고(허용경로: app/page.tsx·middleware.ts·components/Blog/BlogComments.tsx·docs/handover/), R2-T02 마커는 별도 PID(20384)에 바인딩되어 있었다. 사용자 승인 하에 R2-T02 마커를 본 단말 PID(62144)로 **재바인딩 후 진행**. 기존 R2-T02 단말(20384)은 사용자가 종료/정리 필요(중복 방지). 또한 본 단말에는 R2-T05 영역인 `components/Blog/BlogComments.tsx`의 미커밋 1줄 변경이 남아 있음 — R2-T05 단말 또는 지휘자 회수 대상(본 작업과 무관, 손대지 않음).

---

## 1. 산출물

### 신규 (1)
| 파일 | LoC | 역할 |
|------|-----|------|
| `lib/community/news-queries.ts` | ~210 | 클라 fetch 래퍼 5종 + 매퍼 + **category 영문→한글 라벨 사전** |

### 수정 (1)
| 파일 | 변경 | 역할 |
|------|------|------|
| `app/news/page.tsx` | 데이터 소스 전면 교체 (JSX 골격·디자인 보존) | `MOCK_NEWS`/`getHeadlines`/mock-coins → `/api/*` 클라 fetch |

### 미수정 (안티패턴 준수)
- `lib/community/mock-news.ts` / `mock-coins.ts` **삭제 안 함** — 라벨 사전(`NEWS_CATEGORIES`/`COIN_FILTERS`)은 계속 사용, 데이터 export(MOCK_NEWS 등)는 미사용 잔존. 완전 삭제는 회수 후 지휘자 일괄.
- `app/api/news/route.ts`, `lib/news/classifier.ts`, `lib/community/queries.ts` **Read만**, 무수정.
- 새 패키지 0건.

---

## 2. 필터 → 파라미터 매핑표

| 필터 | UI 소스 | 처리 | 파라미터 / 로직 | 비고 |
|------|---------|------|-----------------|------|
| **코인** | `COIN_FILTERS` (ALL/BTC/ETH/XRP/SOL/ALT/STOCK) | **서버 위임** | `?query=<key>` (ALL=미전송) | `/api/news`가 `symbol.eq` OR `title/snippet ilike`로 매칭 |
| **분류** | `NEWS_CATEGORIES` (all/market/regulation/tech/exchange/etf/onchain/macro) | **서버 위임** | `?category=<key>` (all=미전송) | NEWS_CATEGORIES의 key가 **API 영문 enum과 1:1 일치** → 변환 불필요 |
| **감정** | `SENTIMENT_FILTERS` (all/positive/negative/mixed/neutral) | **클라 필터** | `news.filter(n => n.sentiment === f)` | `/api/news`에 sentiment 파라미터 없음 |
| **정렬** | `SORTS` (latest/importance/popular) | **클라 정렬** | latest=API순(pub_date desc) 유지 / importance·popular=`importance desc` | `/api/news`에 정렬 파라미터 없음 |

- 코인/분류 변경 → `useEffect([coinFilter, categoryFilter, reloadKey])`로 **서버 재조회** + page 1 리셋.
- 감정/정렬 변경 → `useMemo`로 **클라에서 재가공** (재조회 없음).

---

## 3. category 영문 enum → 한글 라벨 사전

`news-queries.ts`의 `NEWS_CATEGORY_LABEL` (NewsRow/HeadlineCard가 category 문자열을 그대로 표시 → 한글 매핑):

| enum (DB/API) | 한글 라벨 |
|---------------|-----------|
| `regulation` | 규제 |
| `tech` | 기술 |
| `exchange` | 거래소 |
| `onchain` | 온체인 |
| `etf` | ETF |
| `altcoin_news` | 알트코인 |
| `macro` | 매크로 |
| `market` | 시장동향 |

- `categoryLabel(cat)` 헬퍼: 미지정→undefined, 미등록 enum→원문 그대로(안전 폴백).
- **`altcoin_news` 주의**: 필터 탭(`NEWS_CATEGORIES`, mock-news 보존)에는 없어 *필터 선택*은 불가하지만, *표시 라벨*은 "알트코인"으로 커버 (T06 handover §7의 "UI 라벨 누락" 해소). 필터 탭 추가는 mock-news.ts 수정이 필요해 보류(안티패턴).

---

## 4. API 응답 → 컴포넌트 props 매핑

### 4-1. 뉴스 (`/api/news` → `NewsRow`/`NewsHeadlineCard`)
`mapApiNews(item, i)`:

| API 필드 | → props | 변환 |
|----------|---------|------|
| `title` | title | 그대로 |
| `snippet` | summary | null→"" |
| `sentiment` | sentiment | null→"neutral" |
| `category` (영문) | category | `categoryLabel()` 한글화 |
| `publisher` (=source) | source | null→"출처 미상" |
| `pubDate` (ISO) | timeLabel | `formatRelativeTime()` ("방금 전"/"N분 전"/…/"N주 전") |
| `importance` | importance | null→undefined |
| `link` | link | id 생성에도 사용 (`news-${i}-${link끝16자}`) |
| `symbol` | coinTag | `"ALL"`→undefined |
| `sentimentScore` | (보조) | NewsListItem에 보존(미사용) |

- **discussionHref/commentCount 생략**: 뉴스↔토론 연결 실데이터가 없음 → NewsRow가 토론칸을 "—"로 표시(거짓 0 표기 회피).

### 4-2. 사이드바 위젯
| 위젯 | API | 매핑 |
|------|-----|------|
| `PriceTickerWidget` | `GET /api/coins/ticker` | `baseSymbol`→symbol, `COIN_DISPLAY[base].nameKo`→name·href. `.slice(0,6)` |
| `HotIssueWidget` | `GET /api/coins/hot-issues` | `symbol`→keyword(한국어명), trend `UP/DOWN/FLAT/NEW`→`up/down/same/new`. delta는 API 부재→생략 |
| `FngGaugeWidget` | `GET /api/fng` | `value`/`prevValue` (기존 하드코딩 72/68 제거). label 생략→위젯 자체 한글 라벨 사용 |
| `OfficialPostsWidget` | `GET /api/blog?limit=3` | `slug`/`title`/`published_at??created_at`(YYYY-MM-DD) |

- `COIN_DISPLAY`: queries.ts의 `COIN_META`는 server-only 모듈이라 재사용 불가 → news-queries.ts에 클라용 심볼→한국어명·링크 사전 별도 보유(중복 최소화).

---

## 5. fallback / 상태 처리

| 시나리오 | 처리 |
|----------|------|
| 뉴스 로딩 중 | "뉴스를 불러오는 중…" |
| `/api/news` 실패(throw) | "뉴스를 불러오지 못했습니다. [다시 시도]" → `reloadKey++`로 재조회 |
| 필터 결과 0건 | "조건에 맞는 뉴스가 없습니다. [필터 초기화]" |
| 헤드라인 fetch 실패 | `.catch(()=>{})` → 헤드라인 섹션 미표시(length 0 가드) |
| 사이드바 각 fetch 실패 | 각 함수 내부 `try/catch`로 빈 배열/null 반환 → 위젯 빈 상태 |
| FNG null | `{fng && <FngGaugeWidget/>}` 가드로 게이지 미표시 |

→ 전체 페이지 크래시 없음. 외부 API/ DB 미가용 시 graceful degrade.

---

## 6. mock import 잔여 사유

`grep -rn "@/lib/community/mock-" app/news/` → **1건**:
```
app/news/page.tsx:14: import { NEWS_CATEGORIES, COIN_FILTERS } from "@/lib/community/mock-news";
```
- 이는 **데이터가 아닌 필터 탭 라벨 사전**. 지시서 검증 기준 "기대: 라벨 사전만 (또는 0)"을 충족.
- `MOCK_NEWS`/`getHeadlines`/`mock-coins`(TICKER_LIST/HOT_ISSUES/OFFICIAL_POSTS) import는 **완전 제거**됨.

---

## 7. 검증 결과 (재현 명령)

```bash
cd "F:/11_dev/260523 코인 차트분석"
npx tsc --noEmit                              # 0 error (출력 없음)
grep -rn "@/lib/community/mock-" app/news/    # 1건 (NEWS_CATEGORIES/COIN_FILTERS 라벨 사전)
grep -rn "/api/news" app/news/                # ≥1 (fetchNews 래퍼 경유)
npm run build                                 # ✓ Compiled, /news → ○ (Static)
```

| 항목 | 기대 | 실제 | 결과 |
|------|------|------|------|
| tsc | 0 | 0 | ✅ |
| mock- grep | 라벨 사전만 | 1 (라벨 사전) | ✅ |
| /api/news grep | ≥1 | 4 (주석+래퍼 호출 경유) | ✅ |
| build | Compiled | ✓ `/news` ○ Static | ✅ |

### 시각 검증 (사용자 단계, 권장)
- T06 마이그레이션(`20260523_alter_news_classify.sql`)·뉴스 크롤 데이터가 실DB에 적용돼야 목록/헤드라인이 채워짐 (미적용 시 빈 상태 안내가 정상 동작).
- `npm run dev` → `/news` 진입 → 코인/분류/감정/정렬 4필터 동작, 사이드바(시세/핫이슈/FNG/공식글) 채워짐 확인.

---

## 8. 후속 / 미해결

1. **사이드바 "코인별 뉴스 (오늘)" 위젯**: 집계 소스(코인별 뉴스 count) API 부재 → 정적 데모(BTC 124 등) 유지. 집계 RPC 추가 시 실데이터화 가능 (R2 후속).
2. **정렬 "토론많은순"**: 뉴스↔토론 실데이터가 없어 *중요도순으로 대체* 중. 뉴스-게시판 연결 스키마 도입 후 정교화.
3. **분류 필터에 `altcoin_news` 탭 부재**: 표시 라벨은 커버하나 필터 선택 불가. `NEWS_CATEGORIES`(mock-news) 확장 또는 라벨 사전 SSOT 분리 필요 (mock-news 정리 시 함께).
4. **mock-news.ts / mock-coins.ts 완전 삭제**: `/news`는 데이터 의존을 끊었으나 라벨 사전(`NEWS_CATEGORIES`/`COIN_FILTERS`)을 아직 참조. 다른 페이지(`/coin/[symbol]`, `/board/*`) 전환 완료 + 라벨 사전 이전 후 삭제 가능.

---

## 9. 참조
- 작업 명세: `docs/orchestration/2026-05-23-R2-realdata-finish/R2-T02-news-realdata.md`
- 의존 handover: `2026-05-23-R1-T06-news-classify-integration.md`(API 계약), `2026-05-23-R1-T15-mainpage-realdata.md`(매퍼·COIN_META·formatRelativeTime 패턴 참고)
- 산출 코드: `lib/community/news-queries.ts`, `app/news/page.tsx`
- 데이터 소스: `app/api/news/route.ts`, `app/api/coins/ticker/route.ts`, `app/api/coins/hot-issues/route.ts`, `app/api/fng/route.ts`, `app/api/blog/route.ts`
- 컴포넌트 계약: `components/community/{NewsRow,NewsHeadlineCard}.tsx`, `components/community/widgets/{PriceTicker,HotIssue,FngGauge,OfficialPosts}Widget.tsx`

— EOF —
