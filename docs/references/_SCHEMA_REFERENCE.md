# Schema Reference (Supabase)

> 마지막 갱신: 2026-03-08
> 소스: `supabase/migrations/` SQL 파일 기반

## 테이블 목록

| 테이블 | 설명 | RLS | 마이그레이션 |
|--------|------|-----|-------------|
| `market_prices` | 시장 가격 (Crypto/Stock/Forex OHLCV) | O | 20241213_init |
| `stock_prices` | 주식 SSOT (TwelveData OHLCV) | O | 20251227 |
| `news` | 뉴스 아카이브 (15일) | O | 20241214 |
| `secure_memos` | 암호화 메모 | O | 20260114 |
| `profiles` | 사용자 프로필 | - | trigger |
| `blog_categories` | 블로그 카테고리 | O | 20260308 |
| `blog_posts` | 블로그 포스트 | O | 20260308 |
| `blog_tags` | 블로그 태그 | O | 20260308 |
| `blog_post_tags` | 포스트-태그 다대다 | O | 20260308 |

---

## market_prices

> 암호화폐/주식/외환 OHLCV 데이터 저장

| 컬럼 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| `id` | BIGINT (identity) | PK | auto | |
| `symbol` | TEXT | O | - | 종목 심볼 (예: BTCUSDT) |
| `date` | DATE | O | - | 거래일 |
| `open` | NUMERIC | - | - | 시가 |
| `high` | NUMERIC | - | - | 고가 |
| `low` | NUMERIC | - | - | 저가 |
| `close` | NUMERIC | - | - | 종가 |
| `volume` | NUMERIC | - | - | 거래량 |
| `type` | TEXT | - | - | `CRYPTO` / `STOCK` / `FOREX` |
| `price` | NUMERIC | - | 0 | 현재가 (스키마 수정으로 추가) |
| `asset_type` | TEXT | - | - | 자산 유형 (스키마 수정으로 추가) |
| `recorded_at` | TIMESTAMPTZ | - | NOW() | 기록 시점 |
| `created_at` | TIMESTAMPTZ | - | NOW() | |

**제약**: UNIQUE(symbol, date)
**인덱스**: `idx_market_prices_lookup` (symbol, date DESC), `idx_market_prices_recorded_at`, `idx_market_prices_symbol`
**RLS**: SELECT 공개, INSERT/UPDATE 인증 사용자

---

## stock_prices

> 미국 주식 OHLCV 데이터 (SSOT - market_prices와 혼용 금지)

| 컬럼 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| `id` | BIGSERIAL | PK | auto | |
| `symbol` | VARCHAR(10) | O | - | 종목 티커 (예: AAPL) |
| `time` | BIGINT | O | - | Unix timestamp (초) |
| `open` | NUMERIC(12,4) | O | - | 시가 |
| `high` | NUMERIC(12,4) | O | - | 고가 |
| `low` | NUMERIC(12,4) | O | - | 저가 |
| `close` | NUMERIC(12,4) | O | - | 종가 |
| `volume` | BIGINT | O | - | 거래량 |
| `currency` | VARCHAR(3) | - | `USD` | 통화 |
| `source` | VARCHAR(50) | - | `twelvedata` | 데이터 소스 |
| `created_at` | TIMESTAMP | - | NOW() | |
| `updated_at` | TIMESTAMP | - | NOW() | |

**제약**: UNIQUE(symbol, time)
**인덱스**: `idx_stock_prices_symbol_time` (symbol, time DESC), `idx_stock_prices_symbol`
**RLS**: SELECT 공개, INSERT/UPDATE 인증 사용자

---

## news

> 크립토 뉴스 아카이브 (RSS 수집)

| 컬럼 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| `id` | UUID | PK | gen_random_uuid() | |
| `title` | TEXT | O | - | 뉴스 제목 |
| `link` | TEXT | O (UNIQUE) | - | 원문 URL |
| `pub_date` | TIMESTAMPTZ | O | - | 발행일 |
| `source` | TEXT | - | - | 출처 |
| `sentiment` | TEXT | - | - | `positive` / `negative` / `neutral` / `mixed` |
| `snippet` | TEXT | - | - | 요약 |
| `symbol` | TEXT | - | `ALL` | 관련 종목 |
| `language` | VARCHAR(2) | - | `ko` | 언어 코드 |
| `category` | TEXT | - | `market` | R1/T06 확장. enum: `regulation` / `tech` / `exchange` / `onchain` / `etf` / `altcoin_news` / `macro` / `market` |
| `importance_score` | SMALLINT | - | `5` | R1/T06 확장. 1~10 정수 (CHECK 제약) |
| `sentiment_score` | INTEGER | - | `0` | R1/T06 확장. classifier 원점수 (디버그용) |
| `created_at` | TIMESTAMPTZ | - | NOW() | |

**인덱스**: `idx_news_pub_date`, `idx_news_symbol`, `idx_news_language`, `idx_news_category_pubdate` (R1), `idx_news_importance` (R1)
**RLS**: SELECT 공개, INSERT/DELETE는 service_role

### news (R1 2026-05-23 확장)
- 마이그레이션: `supabase/migrations/20260523_alter_news_classify.sql`
- 신규 컬럼: `category`, `importance_score`, `sentiment_score`
- 인덱스: `idx_news_category_pubdate`, `idx_news_importance`
- 분류 라이브러리: `lib/news/classifier.ts` (T05)
- 통합 위치: `app/api/admin/news-crawl/route.ts` (RSS 파싱 직후 `classify()` 호출)
- API 노출: `app/api/news/route.ts` 응답 필드 `category` / `importance` / `sentimentScore` 추가, 쿼리 파라미터 `?category=` / `?minImportance=` 지원

---

## secure_memos

> 클라이언트 측 암호화 메모 (비밀번호는 저장하지 않음)

| 컬럼 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| `id` | UUID | PK | gen_random_uuid() | |
| `user_id` | UUID | O (FK → auth.users) | - | 소유자 |
| `title` | TEXT | O | - | 메모 제목 |
| `encrypted_content` | TEXT | O | - | Base64 AES-256-GCM 암호문 |
| `salt` | TEXT | O | - | Base64 PBKDF2 salt (16B) |
| `iv` | TEXT | O | - | Base64 AES-GCM IV (12B) |
| `created_at` | TIMESTAMPTZ | - | NOW() | |
| `updated_at` | TIMESTAMPTZ | - | NOW() | 자동 갱신 트리거 |

**인덱스**: `idx_secure_memos_user_id`, `idx_secure_memos_updated_at`
**RLS**: 본인 메모만 CRUD 가능
**트리거**: `update_secure_memos_updated_at` (UPDATE 시 자동 갱신)

---

## profiles

> 사용자 프로필 (auth.users 트리거로 자동 생성)

| 컬럼 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `id` | UUID | PK (FK → auth.users) | 사용자 ID |
| `display_name` | TEXT | - | 표시 이름 (Google full_name) |

**트리거**: `on_auth_user_created` → `handle_new_user()` (회원가입 시 자동 생성)

---

## blog_categories

> 블로그 카테고리

| 컬럼 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| `id` | UUID | PK | gen_random_uuid() | |
| `name_ko` | TEXT | O | - | 한국어 이름 |
| `name_en` | TEXT | O | - | 영어 이름 |
| `slug` | TEXT | O (UNIQUE) | - | URL slug |
| `color` | TEXT | - | `#6366f1` | 표시 색상 |
| `sort_order` | INTEGER | - | 0 | 정렬 순서 |
| `created_at` | TIMESTAMPTZ | - | NOW() | |

**RLS**: SELECT 공개, CUD는 service_role

---

## blog_posts

> 블로그 포스트 (TipTap JSON 기반)

| 컬럼 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| `id` | UUID | PK | gen_random_uuid() | |
| `author_id` | UUID | O (FK → auth.users) | - | 작성자 |
| `category_id` | UUID | FK → blog_categories | - | 카테고리 |
| `title` | TEXT | O | - | 제목 |
| `slug` | TEXT | O (UNIQUE) | - | URL slug |
| `content` | JSONB | O | `{}` | TipTap JSON |
| `excerpt` | TEXT | - | - | 요약 |
| `featured_image` | TEXT | - | - | 대표 이미지 URL |
| `status` | TEXT | O | `draft` | `draft` / `published` / `archived` |
| `language` | TEXT | O | `ko` | `ko` / `en` |
| `meta_title` | TEXT | - | - | SEO 타이틀 |
| `meta_description` | TEXT | - | - | SEO 설명 |
| `view_count` | INTEGER | - | 0 | 조회수 |
| `published_at` | TIMESTAMPTZ | - | - | 발행일시 |
| `created_at` | TIMESTAMPTZ | - | NOW() | |
| `updated_at` | TIMESTAMPTZ | - | NOW() | 자동 갱신 |
| `search_vector` | tsvector | - | - | 전문 검색 벡터 |

**인덱스**: status, slug, author, category, published_at DESC, search_vector (GIN)
**RLS**: published만 공개, author_id 기반 CUD
**트리거**: `updated_at` 자동 갱신, `search_vector` 자동 생성 (title + excerpt, simple 사전)

---

## blog_tags

> 블로그 태그

| 컬럼 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| `id` | UUID | PK | gen_random_uuid() | |
| `name` | TEXT | O (UNIQUE) | - | 태그 이름 |
| `slug` | TEXT | O (UNIQUE) | - | URL slug |
| `created_at` | TIMESTAMPTZ | - | NOW() | |

**RLS**: SELECT 공개, CUD는 service_role

---

## blog_post_tags

> 포스트-태그 다대다 연결

| 컬럼 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `post_id` | UUID | PK (FK → blog_posts) | |
| `tag_id` | UUID | PK (FK → blog_tags) | |

**RLS**: SELECT 공개, INSERT/DELETE는 포스트 작성자만

---

## RPC / 함수

| 함수 | 설명 | 스케줄 |
|------|------|--------|
| `delete_old_market_prices()` | 3년 이상 된 market_prices 삭제 | 매일 03:00 UTC (pg_cron) |
| `handle_new_user()` | 신규 사용자 프로필 자동 생성 | auth.users INSERT 트리거 |
| `update_secure_memos_updated_at()` | 메모 수정 시 updated_at 갱신 | secure_memos UPDATE 트리거 |
| `update_blog_posts_updated_at()` | 블로그 포스트 updated_at 갱신 | blog_posts UPDATE 트리거 |
| `update_blog_posts_search_vector()` | 검색 벡터 자동 생성 (title+excerpt) | blog_posts INSERT/UPDATE 트리거 |

---

## Extensions

| 확장 | 용도 |
|------|------|
| `pg_cron` | 정기 데이터 정리 스케줄링 |

---

## community_* (R1 2026-05-23 추가)

> v2.0 커뮤니티 피벗 — 익명+회원 혼용 작성 권한 모델.
> 마이그레이션: `supabase/migrations/20260523_create_community_tables.sql`

### community_boards

> 게시판 메타 (자유/시세/정보 + 코인룸 6종)

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|---|---|---|---|---|
| `slug` | TEXT | N (PK) | - | `free` / `market` / `info` / `coin-btc` / `coin-eth` / `coin-xrp` / `coin-sol` / `coin-altcoin` / `coin-kimp` |
| `name` | TEXT | N | - | 한국어 표시명 |
| `name_en` | TEXT | Y | - | 영어 표시명 |
| `emoji` | TEXT | Y | - | 게시판 아이콘 이모지 |
| `description` | TEXT | Y | - | 게시판 소개 한 줄 |
| `sort_order` | INTEGER | N | 0 | 메뉴 정렬 순서 |
| `created_at` | TIMESTAMPTZ | N | `now()` | |

**시드**: 위 9개 slug 모두 자동 삽입 (ON CONFLICT DO NOTHING).

### community_posts

> 게시글 (익명+회원 혼용)

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|---|---|---|---|---|
| `id` | UUID | N (PK) | `gen_random_uuid()` | |
| `board_slug` | TEXT | N (FK→community_boards) | - | 소속 게시판 |
| `title` | TEXT | N | - | 1~200자 (CHECK) |
| `content_html` | TEXT | N | - | TipTap 출력 HTML |
| `author_id` | UUID | Y (FK→auth.users, ON DELETE SET NULL) | - | 회원 작성 시 |
| `guest_nickname` | TEXT | Y | - | 익명 닉네임 2~12자 (CHECK) |
| `guest_password_hash` | TEXT | Y | - | bcrypt 해시 ≥60자 (CHECK) |
| `guest_ip_masked` | TEXT | Y | - | 표시용 IP 앞 2옥텟 `\d+\.\d+\.\*\.\*` (CHECK regex) |
| `category` | TEXT | N | `'전체'` | 게시판 내 카테고리 |
| `tags` | TEXT[] | N | `ARRAY[]` | 해시태그 배열 |
| `coin_symbol` | TEXT | Y | - | `BTC`/`ETH`/... — NULL은 **코인과 무관한 일반 글** |
| `view_count` | INTEGER | N | 0 | 조회수 |
| `like_count` | INTEGER | N | 0 | 추천 합(value 합산) |
| `comment_count` | INTEGER | N | 0 | 댓글 수(트리거 동기화) |
| `is_notice` | BOOLEAN | N | false | 공지 |
| `is_hot` | BOOLEAN | N | false | 베스트 진입 캐시 |
| `is_deleted` | BOOLEAN | N | false | soft delete |
| `created_at` | TIMESTAMPTZ | N | `now()` | |
| `updated_at` | TIMESTAMPTZ | N | `now()` | 트리거 자동 갱신 |

**CHECK 제약 (author XOR guest)**:
```
author_id IS NOT NULL
OR (guest_nickname IS NOT NULL
    AND guest_password_hash IS NOT NULL
    AND guest_ip_masked IS NOT NULL)
```
회원 식별이 없으면 익명 3요소(닉/비번/IP마스킹)가 전부 채워져야 INSERT 가능. UI/서버에서 익명 토글에 따라 적절히 매핑.

### community_comments

> 댓글·대댓글 (`parent_id`로 self-reference)

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|---|---|---|---|---|
| `id` | UUID | N (PK) | `gen_random_uuid()` | |
| `post_id` | UUID | N (FK→community_posts, ON DELETE CASCADE) | - | |
| `parent_id` | UUID | Y (FK→community_comments, ON DELETE CASCADE) | - | 대댓글이면 부모 댓글 |
| `content` | TEXT | N | - | 1~2000자 (CHECK) |
| `author_id` | UUID | Y (FK→auth.users) | - | 회원 작성 |
| `guest_nickname` | TEXT | Y | - | posts와 동일 패턴 |
| `guest_password_hash` | TEXT | Y | - | posts와 동일 패턴 |
| `guest_ip_masked` | TEXT | Y | - | posts와 동일 패턴 |
| `like_count` | INTEGER | N | 0 | |
| `is_deleted` | BOOLEAN | N | false | soft delete |
| `created_at` | TIMESTAMPTZ | N | `now()` | |
| `updated_at` | TIMESTAMPTZ | N | `now()` | 트리거 자동 갱신 |

**CHECK 제약**: posts와 동일 (author XOR guest 3요소).

### community_post_likes

> 추천/비추 토글 적재. **작성과 다른 식별 단위** — 익명은 IP의 sha256 해시(전체 IP, 마스킹 X)로 dedup.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|---|---|---|---|---|
| `id` | UUID | N (PK) | `gen_random_uuid()` | |
| `post_id` | UUID | N (FK→community_posts, ON DELETE CASCADE) | - | |
| `user_id` | UUID | Y (FK→auth.users, ON DELETE CASCADE) | - | 회원 dedup용 |
| `ip_hash` | TEXT | Y | - | 익명 dedup용 sha256(전체 IP) |
| `value` | SMALLINT | N | - | `1`=추천 / `-1`=비추 (CHECK) |
| `created_at` | TIMESTAMPTZ | N | `now()` | |

**UNIQUE 부분 인덱스** (NULL 안전):
- `uniq_community_post_likes_user (post_id, user_id) WHERE user_id IS NOT NULL`
- `uniq_community_post_likes_iphash (post_id, ip_hash) WHERE ip_hash IS NOT NULL`

**CHECK**: `user_id IS NOT NULL OR ip_hash IS NOT NULL`

### 인덱스 요약

| 인덱스 | 대상 | 필터 |
|---|---|---|
| `idx_community_posts_board_created` | (board_slug, created_at DESC) | is_deleted=false |
| `idx_community_posts_coin_created` | (coin_symbol, created_at DESC) | is_deleted=false |
| `idx_community_posts_hot` | (is_hot, created_at DESC) | is_deleted=false AND is_hot=true |
| `idx_community_comments_post` | (post_id, created_at) | is_deleted=false |

### RLS 요약

| 테이블 | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `community_boards` | 공개 | service_role | service_role | service_role |
| `community_posts` | `is_deleted=false` 공개 | 모두 허용 (CHECK가 강제) | 본인(`author_id=auth.uid()`) | 본인 |
| `community_comments` | `is_deleted=false` 공개 | 모두 허용 | 본인 | 본인 |
| `community_post_likes` | 공개 | 모두 허용 | (없음) | 본인 |

> **익명 글의 수정/삭제**는 RLS로 허용하지 않음. 서버 라우트(API)가 비밀번호 검증 후 service_role 키로 처리한다.

### 트리거 요약

| 트리거 | 대상 | 시점 | 함수 |
|---|---|---|---|
| `trg_community_posts_updated_at` | community_posts | BEFORE UPDATE | `community_touch_updated_at()` |
| `trg_community_comments_updated_at` | community_comments | BEFORE UPDATE | `community_touch_updated_at()` |
| `trg_community_comments_count` | community_comments | AFTER INSERT/UPDATE/DELETE | `community_sync_comment_count()` (soft-delete 토글 포함) |
| `trg_community_post_likes_count` | community_post_likes | AFTER INSERT/UPDATE/DELETE | `community_sync_like_count()` (value 부호 합산) |

> `like_count` = `SUM(value)` 누적. 비추(-1)도 합산되므로 음수 가능 — 화면에서 추천만 노출하려면 별도 집계 또는 컬럼 분리 검토(차후).

