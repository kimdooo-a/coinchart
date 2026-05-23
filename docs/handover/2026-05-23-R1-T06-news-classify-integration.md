# 인수인계서 — R1 / T06 / news-classify-integration

- 일시: 2026-05-23
- 라운드: R1 (mainpage)
- 일꾼: T06 (worker)
- 의존: **T05** (`lib/news/classifier.ts`) — 완료 확인 후 발사
- 후속 소비자: **T15** (메인 NewsRow 표시 — `app/api/news` 응답 소비)
- 상태: **완료** (산출물 + 검증 5/5 PASS, news 영역 타입에러 0건)

---

## 1. 산출물 (Single Source of Truth)

| 파일 | 변경 | 역할 |
|------|------|------|
| `supabase/migrations/20260523_alter_news_classify.sql` | **신규** (20 LoC) | `news` 테이블 3컬럼 + 인덱스 2개 추가 |
| `app/api/admin/news-crawl/route.ts` | **수정** (+34/-12 LoC) | RSS 파싱 직후 `classify()` 호출, 분류 결과 4필드 적재 |
| `app/api/news/route.ts` | **수정** (+22/-3 LoC) | SELECT 컬럼 확장 + `?category=` / `?minImportance=` 필터 + 응답 필드 추가 |
| `docs/references/_SCHEMA_REFERENCE.md` | **append** (+11 LoC) | `news` R1 확장 컬럼·인덱스·통합 위치 명세 |

---

## 2. ALTER 컬럼 명세

```sql
ALTER TABLE news
  ADD COLUMN category text DEFAULT 'market'
    CHECK (category IN ('regulation','tech','exchange','onchain','etf','altcoin_news','macro','market'));

ALTER TABLE news
  ADD COLUMN importance_score smallint DEFAULT 5
    CHECK (importance_score BETWEEN 1 AND 10);

ALTER TABLE news
  ADD COLUMN sentiment_score integer DEFAULT 0;

CREATE INDEX idx_news_category_pubdate ON news(category, pub_date DESC);
CREATE INDEX idx_news_importance ON news(importance_score DESC, pub_date DESC);
```

| 컬럼 | 타입 | 기본값 | 제약 | 소비자 |
|------|------|--------|------|-------|
| `category` | text | `'market'` | 8값 enum CHECK | T15 카테고리 칩 |
| `importance_score` | smallint | `5` | 1~10 CHECK | T15 중요도 도트 (정렬·필터) |
| `sentiment_score` | integer | `0` | 없음 (디버그용) | (선택) 정렬 키 |

기존 컬럼(`sentiment`, `symbol` 등)은 **DROP 없이 유지** — 안티패턴 회피.

> **Supabase 적용**: 마이그레이션 파일은 빌드/검증만 완료된 상태. 실제 DB 적용은 `npx supabase db push` 또는 SQL 에디터에서 수동 실행 필요 (지휘자 결정).

---

## 3. crawler 통합 위치

**파일**: `app/api/admin/news-crawl/route.ts`

| 단계 | 라인 | 동작 |
|------|------|------|
| import | 2 | `import { classify } from '@/lib/news/classifier';` |
| items 타입 명시 | 31–43 | 4컬럼(sentiment / symbol / category / importance_score / sentiment_score) 정확한 타입 선언 |
| `classify()` 호출 | 64–69 | RSS item 1건 파싱 후 즉시 호출 (`title`, `snippet`, `source`, `pubDate` 전달) |
| 결과 적재 | 78–84 | `result.sentiment` / `result.coinTag` → `symbol` / `result.category` / `result.importance` → `importance_score` / `result.sentimentScore` → `sentiment_score` |

**제거된 로직**: 기존 `lowerTitle.includes('bitcoin') → 'BTC'` 등 7줄짜리 인라인 매칭 (라인 75–82) 삭제 → classifier가 빈도 우선 다중 매칭으로 대체. `'GENERAL'` 기본값은 classifier의 `'ALL'`로 자연스럽게 통합.

**enum 일치 보장**: classifier의 `NewsSentiment` (`positive`/`negative`/`neutral`/`mixed`) ↔ DB `sentiment` CHECK 제약 1:1 일치. enum 어긋남 위험 없음.

---

## 4. news API 신규 쿼리 파라미터

**파일**: `app/api/news/route.ts`

| 파라미터 | 타입 | 동작 | 무시 조건 |
|---------|------|------|----------|
| `?category=<enum>` | string | `category` 컬럼 정확 일치 (`.eq()`) | `'ALL'` 또는 미지정 |
| `?minImportance=<1~10>` | int | `importance_score >= N` (`.gte()`) | 정수 아님 or 범위 밖 |

기존 파라미터(`query`, `lang`, `page`)는 그대로 호환.

---

## 5. 응답 형식 (T15 가 소비)

```ts
// GET /api/news?category=etf&minImportance=6
{
  items: Array<{
    title: string;
    link: string;
    pubDate: string;        // ISO 8601
    publisher: string;      // == DB.source
    sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
    snippet: string;
    symbol: string;         // 'BTC' | 'ETH' | ... | 'ALL'
    category: 'regulation' | 'tech' | 'exchange' | 'onchain' | 'etf' | 'altcoin_news' | 'macro' | 'market';
    importance: number;     // 1~10 (DB.importance_score를 이 이름으로 노출)
    sentimentScore: number; // DB.sentiment_score
  }>;
}
```

**필드명 매핑 주의 (DB ↔ API 응답)**:
- `pub_date` → `pubDate`
- `source` → `publisher`
- `importance_score` → `importance`
- `sentiment_score` → `sentimentScore`

T15 가 메인 NewsRow 에 직접 바인딩할 수 있는 camelCase 형태로 정규화.

---

## 6. 검증 결과 (5/5 PASS)

| 항목 | 명령 | 결과 | 기대값 |
|------|------|------|--------|
| 타입체크 | `npx tsc --noEmit` | news 영역 에러 **0건** | 0 |
| classify 호출 | `grep -c "classify(" app/api/admin/news-crawl/route.ts` | **2** (import + 호출) | ≥1 |
| API 컬럼 | `grep -c "category\|importance_score\|sentiment_score" app/api/news/route.ts` | **9** | ≥3 |
| ADD COLUMN | `grep -c "ADD COLUMN" supabase/migrations/20260523_*.sql` | **3** | 3 |
| CREATE INDEX | `grep -c "CREATE INDEX" supabase/migrations/20260523_*.sql` | **2** | 2 |
| ESLint | `npx eslint <2개 파일>` | 에러 0건 (deprecated 경고만 — 전역 설정 이슈) | clean |

**잔존 tsc 에러** (T06 영역 밖):
- `lib/community/auth.ts(3,20): Cannot find module 'bcryptjs'` — 다른 일꾼 영역 (community auth), T06과 무관.

---

## 7. T15 (메인 NewsRow) 호출 예시

```ts
// 메인페이지 — 중요도 6 이상 ETF 카테고리 뉴스
const res = await fetch('/api/news?category=etf&minImportance=6&page=0');
const { items } = await res.json();

// items[0].category, items[0].importance, items[0].sentiment 직접 바인딩 가능
```

`NewsCategory` enum (8값) ↔ T15 가 사용하는 `NEWS_CATEGORIES` UI 라벨 매핑은 T05 handover §7 표 참조. `altcoin_news` 는 UI 라벨 누락 — T15 가 `market` 으로 합칠지 UI 에 추가할지 결정.

---

## 8. 안티패턴 준수 체크

- [x] `lib/news/classifier.ts` **수정 안 함** (T05 영역)
- [x] 마이그레이션 파일명 `20260523_alter_news_classify.sql` — 지시서 그대로 사용
- [x] 기존 `news` 컬럼 **DROP 없음** — 오직 `ADD COLUMN IF NOT EXISTS`
- [x] `mock-news.ts` **수정 안 함** (T15 영역)
- [x] `IF NOT EXISTS` 보호로 재실행 안전 (idempotent)

---

## 9. 핵심 통계

- **신규 SQL LoC**: 20
- **수정 TS LoC**: 약 +56/-15 (2개 파일)
- **신규 DB 컬럼**: 3개 (`category`, `importance_score`, `sentiment_score`)
- **신규 인덱스**: 2개
- **신규 API 쿼리 파라미터**: 2개 (`category`, `minImportance`)
- **외부 의존성 추가**: **0개** (classifier는 순수 함수, 추가 패키지 없음)

— EOF —
