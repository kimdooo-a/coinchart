# T06 — news-classify-integration

> **본 터미널은 R1 일꾼(T06)**. T05 완료 후 발사.

## 정체성

- 역할: `worker` (T06), R1, mainpage
- 담당: news 테이블 컬럼 확장 + crawler·API에 분류 호출 통합
- 의존: T05 (`lib/news/classifier.ts`)

## 컨텍스트

기존 `news` 테이블(`20241214_news_archive.sql`)은 `sentiment` 컬럼만 가지고 있어 카테고리·중요도가 없다. 메인페이지 NewsRow는 카테고리 칩과 중요도 도트를 표시하지만 현재 더미. 본 일꾼이 ALTER + crawler 통합으로 실데이터 4차원을 채운다.

## 공통 SOT

```
CLAUDE.md
supabase/migrations/20241214_news_archive.sql          ← 기존 스키마
docs/orchestration/2026-05-23-R1-mainpage/T05-news-classifier.md
docs/handover/2026-05-23-R1-T05-news-classifier.md     ← T05 완료 후 생성됨
lib/news/classifier.ts                                  ← T05 산출물
app/api/admin/news-crawl/route.ts                       ← 크롤러 통합 대상
app/api/news/route.ts                                   ← 표시용 API
docs/references/_SCHEMA_REFERENCE.md
```

## 작업 목표

1. `supabase/migrations/20260523_alter_news_classify.sql` — 컬럼 추가
2. `app/api/admin/news-crawl/route.ts` — 분류 호출 통합
3. `app/api/news/route.ts` — 응답에 category·importance 노출
4. `_SCHEMA_REFERENCE.md` append

## 산출물

#### 1. `supabase/migrations/20260523_alter_news_classify.sql`

```sql
-- R1 (2026-05-23) — 뉴스 룰베이스 분류 컬럼 추가
ALTER TABLE news
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'market'
    CHECK (category IN ('regulation','tech','exchange','onchain','etf','altcoin_news','macro','market'));

ALTER TABLE news
  ADD COLUMN IF NOT EXISTS importance_score smallint DEFAULT 5
    CHECK (importance_score BETWEEN 1 AND 10);

ALTER TABLE news
  ADD COLUMN IF NOT EXISTS sentiment_score integer DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_news_category_pubdate ON news(category, pub_date DESC);
CREATE INDEX IF NOT EXISTS idx_news_importance ON news(importance_score DESC, pub_date DESC);
```

#### 2. `app/api/admin/news-crawl/route.ts` (수정)

기존 코드 흐름: RSS 크롤 → news 테이블 upsert.
- 각 뉴스 항목을 upsert 직전에 `classify({ title, snippet: description, source, pubDate })` 호출
- 반환된 `coinTag` → `symbol` 컬럼에 매핑
- `category` / `importance` / `sentimentScore` → 신규 컬럼에 매핑
- `sentiment`는 기존 컬럼 그대로 사용 (분류 결과를 덮어쓰기, 단 enum 'positive'/'negative'/'neutral'/'mixed' 일치)

기존 sentiment 채움 로직이 있다면 classifier 결과로 교체 (T05가 정의한 enum과 100% 일치).

#### 3. `app/api/news/route.ts` (수정)

```ts
// 기존 SELECT 컬럼에 category, importance_score, sentiment_score 추가
.select('id, title, link, pub_date, source, sentiment, snippet, symbol, category, importance_score, sentiment_score, created_at')
```

쿼리 파라미터 `?category=etf` 또는 `?minImportance=6` 등 필터 옵션 추가 (선택).

#### 4. `docs/references/_SCHEMA_REFERENCE.md` (append)

```markdown
### news (R1 2026-05-23 확장)
- 신규 컬럼: `category`, `importance_score`, `sentiment_score`
- 인덱스: `idx_news_category_pubdate`, `idx_news_importance`
- 분류 라이브러리: `lib/news/classifier.ts` (T05)
```

## 작업 단계

1. SOT 읽기
2. SQL 작성
3. news-crawl 통합 (기존 흐름 유지하며 분류 호출만 추가)
4. news API 응답 컬럼 확장
5. references append
6. 검증

## 검증

```bash
npx tsc --noEmit

# news-crawl 통합 검증 (분류 호출이 있는지 grep)
grep -c "classify(" app/api/admin/news-crawl/route.ts   # 1 이상 기대

# news API 응답 컬럼 검증
grep -c "category\|importance_score\|sentiment_score" app/api/news/route.ts   # 3 이상 기대

# SQL 키워드 검증
grep -c "ADD COLUMN" supabase/migrations/20260523_alter_news_classify.sql   # 3 기대
grep -c "CREATE INDEX" supabase/migrations/20260523_alter_news_classify.sql   # 2 기대

# ESLint
npx eslint app/api/admin/news-crawl/route.ts app/api/news/route.ts 2>&1 | tail -10
```

## 완료 신호

`docs/handover/2026-05-23-R1-T06-news-classify-integration.md` 작성.

명시:
- ALTER 컬럼 명세
- crawler 통합 위치 (라인 또는 함수 이름)
- news API 신규 쿼리 파라미터
- T15가 호출할 엔드포인트와 응답 형식

## 안티패턴

- `lib/news/classifier.ts` 수정 금지 (T05 영역)
- 새 마이그레이션 파일명에 다른 날짜·키워드 쓰지 말 것
- 기존 news 컬럼 DROP 금지 (오직 ADD COLUMN)
- `mock-news.ts` 수정 금지 (T15)
