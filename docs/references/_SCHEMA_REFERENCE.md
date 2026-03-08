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
| `created_at` | TIMESTAMPTZ | - | NOW() | |

**인덱스**: `idx_news_pub_date`, `idx_news_symbol`, `idx_news_language`
**RLS**: SELECT 공개, INSERT/DELETE는 service_role

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
