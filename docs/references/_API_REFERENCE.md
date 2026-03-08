# API Reference

## 개요
총 28개 엔드포인트 (공개 9개 + 블로그 6개 + SEO 2개, 관리자 4개 + 블로그 5개, 주식 분석 2개 포함)

최종 업데이트: 2026-03-08

---

## 목차
1. [암호화폐 관련](#암호화폐-관련)
2. [주식 관련](#주식-관련)
3. [분석 관련](#분석-관련)
4. [뉴스/기타](#뉴스기타)
5. [관리자 전용](#관리자-전용)

---

## 암호화폐 관련

### GET /api/klines
- **파일**: `app/api/klines/route.ts`
- **설명**: Supabase `market_prices` 테이블에서 캔들스틱(OHLCV) 데이터를 조회하는 프록시 API. 프론트엔드 차트 렌더링에 사용.
- **파라미터**:
  | 이름 | 필수 | 타입 | 기본값 | 설명 |
  |------|------|------|--------|------|
  | symbol | O | string | - | 심볼명 (예: BTCUSDT) |
  | interval | X | string | `1d` | 캔들 간격 (현재 사용되지 않음, DB 조회에 영향 없음) |
  | limit | X | number | `990` | 조회할 최대 캔들 수 |
- **응답 (200)**:
  ```json
  [
    {
      "time": 1700000000,
      "open": 35000.5,
      "high": 36000.0,
      "low": 34500.0,
      "close": 35800.0,
      "volume": 12345.67
    }
  ]
  ```
  - `time`: Unix timestamp (초 단위), 오름차순 정렬
- **에러 응답**:
  - `400`: `{ "error": "Symbol is required" }`
  - `500`: `{ "error": "Failed to fetch klines" }`
- **캐시**: `Cache-Control: public, s-maxage=10, stale-while-revalidate=59`
- **인증**: 불필요
- **데이터 소스**: Supabase `market_prices` 테이블

---

### GET /api/price
- **파일**: `app/api/price/route.ts`
- **설명**: Binance API를 프록시하여 특정 코인의 현재 가격(USDT 기준)을 반환.
- **파라미터**:
  | 이름 | 필수 | 타입 | 기본값 | 설명 |
  |------|------|------|--------|------|
  | symbol | O | string | - | 코인 심볼 (예: BTC). 내부에서 `{symbol}USDT`로 변환 |
- **응답 (200)**:
  ```json
  {
    "symbol": "BTCUSDT",
    "price": "95000.00"
  }
  ```
- **에러 응답**:
  - `400`: `{ "error": "Symbol is required" }`
  - `500`: `{ "error": "Failed to fetch price" }`
- **인증**: 불필요
- **데이터 소스**: Binance REST API (`/api/v3/ticker/price`)

---

### GET /api/kimchi
- **파일**: `app/api/kimchi/route.ts`
- **설명**: 김치 프리미엄 계산 API. 빗썸(KRW)과 바이낸스(USDT) 가격 차이를 기반으로 프리미엄 비율 산출.
- **파라미터**: 없음
- **응답 (200)**:
  ```json
  {
    "data": [
      {
        "symbol": "BTC",
        "krwPrice": 130000000,
        "usdPrice": 95000.00,
        "premium": 2.35,
        "exchangeRate": 1450
      }
    ],
    "timestamp": "2026-02-28T12:00:00.000Z",
    "exchangeRate": 1450
  }
  ```
  - `premium`: 김치 프리미엄 비율 (%, 소수점 2자리)
  - 지원 코인: BTC, ETH, SOL, XRP, BCH, DOGE
- **에러 응답**:
  - `500`: `{ "error": "Failed to fetch data", "details": "..." }`
- **인증**: 불필요
- **데이터 소스**: Binance API + Bithumb API + ExchangeRate API
- **비고**: 환율 API 실패 시 기본 환율 1450원/USD 사용 (fallback)

---

### GET /api/signals
- **파일**: `app/api/signals/route.ts`
- **설명**: 전체 시장 스캔을 실행하여 매매 시그널을 반환.
- **파라미터**: 없음
- **응답 (200)**:
  ```json
  {
    "signals": [ ... ]
  }
  ```
  - 시그널 배열 구조는 `lib/signal_engine`의 `scanMarket()` 반환값에 의존
- **에러 응답**:
  - `500`: `{ "signals": [] }`
- **인증**: 불필요
- **데이터 소스**: `lib/signal_engine` 내부 로직

---

## 주식 관련

### GET /api/stock/quote
- **파일**: `app/api/stock/quote/route.ts`
- **설명**: Twelve Data API를 프록시하여 주식 실시간 시세 정보를 반환.
- **파라미터**:
  | 이름 | 필수 | 타입 | 기본값 | 설명 |
  |------|------|------|--------|------|
  | symbol | O | string | - | 주식 심볼 (예: AAPL). BRK-B는 BRK.B로 자동 변환 |
- **응답 (200)**: Twelve Data `/quote` 응답 그대로 패스스루
  ```json
  {
    "symbol": "AAPL",
    "name": "Apple Inc",
    "exchange": "NASDAQ",
    "close": "170.50",
    "volume": "50000000",
    ...
  }
  ```
- **에러 응답**:
  - `400`: `{ "error": "Symbol is required" }` 또는 Twelve Data 에러 패스스루
  - `500`: `{ "error": "Server configuration error" }` (API 키 미설정) / `{ "error": "Failed to fetch data" }`
- **캐시**: Next.js fetch 캐시 60초 (`revalidate: 60`)
- **인증**: 불필요
- **환경변수**: `TWELVEDATA_API_KEY` (필수)
- **데이터 소스**: Twelve Data REST API (`/quote`)

---

### GET /api/stock/time-series
- **파일**: `app/api/stock/time-series/route.ts`
- **설명**: Supabase `stock_candles` 테이블에서 주식 시계열 데이터를 Twelve Data 형식으로 반환.
- **파라미터**:
  | 이름 | 필수 | 타입 | 기본값 | 설명 |
  |------|------|------|--------|------|
  | symbol | O | string | - | 주식 심볼. BRK-B는 BRK.B로 자동 변환 |
  | interval | X | string | `1day` | 캔들 간격. `1day`/`1d` 또는 `1week`/`1w` 지원. 분/시간 단위는 빈 배열 반환 |
  | outputsize | X | number | `365` | 조회할 캔들 수 |
- **응답 (200)**:
  ```json
  {
    "meta": {
      "symbol": "AAPL",
      "interval": "1day",
      "currency": "USD",
      "timezone": "America/New_York",
      "type": "Common Stock"
    },
    "values": [
      {
        "datetime": "2026-02-28",
        "open": "170.00",
        "high": "172.00",
        "low": "169.00",
        "close": "171.50",
        "volume": "50000000"
      }
    ],
    "status": "ok"
  }
  ```
  - 모든 가격/거래량 값은 문자열 (Twelve Data 호환 형식)
  - 내림차순 정렬 (최신 데이터 먼저)
- **에러 응답**:
  - `400`: `{ "error": "Symbol is required" }`
  - `500`: `{ "error": "Failed to fetch data" }`
- **인증**: 불필요
- **데이터 소스**: Supabase `stock_candles` 테이블

---

### GET /api/stock/history
- **파일**: `app/api/stock/history/route.ts`
- **설명**: Supabase에서 주식 가격 이력을 조회. `stock_prices` 테이블을 우선 조회하고, 데이터가 없으면 `market_prices` 테이블에서 fallback 조회.
- **파라미터**:
  | 이름 | 필수 | 타입 | 기본값 | 설명 |
  |------|------|------|--------|------|
  | symbol | O | string | - | 주식 심볼 (대소문자 무관, 내부에서 대문자 변환) |
  | limit | X | number | `365` | 조회할 최대 레코드 수 |
- **응답 (200)**:
  ```json
  [
    {
      "time": 1700000000,
      "open": 170.0,
      "high": 172.0,
      "low": 169.0,
      "close": 171.5,
      "volume": 50000000
    }
  ]
  ```
  - `time`: Unix timestamp (초 단위), 오름차순 정렬
- **에러 응답**:
  - `400`: `{ "error": "Symbol is required" }`
  - `500`: `{ "error": "Failed to fetch stock history" }`
- **캐시**: `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`
- **인증**: 불필요
- **데이터 소스**: Supabase `stock_prices` 테이블 (1차) -> `market_prices` 테이블 (fallback)

---

## 분석 관련

### GET /api/analysis/[symbol]
- **파일**: `app/api/analysis/[symbol]/route.ts`
- **설명**: 서버 사이드 암호화폐 기술적 분석 API. Supabase에서 가격 데이터를 로드하고 `analyzeMarket()` 함수로 기술 지표를 계산하여 반환. Supabase KV 캐시 적용 (TTL: 5분).
- **파라미터**:
  | 이름 | 필수 | 타입 | 기본값 | 설명 |
  |------|------|------|--------|------|
  | symbol | O | string (path) | - | URL 경로 파라미터. 심볼명 (예: BTCUSDT) |
  | interval | X | string (query) | `1d` | 캔들 간격 |
  | lang | X | string (query) | `ko` | 분석 결과 언어 (`ko` 또는 `en`) |
- **응답 (200)**:
  ```json
  {
    "...분석 결과 필드들",
    "fromCache": true
  }
  ```
  - `fromCache`: 캐시 히트 여부
  - 분석 결과 구조는 `lib/analysis`의 `analyzeMarket()` 반환값에 의존
- **에러 응답**:
  - `400`: `{ "error": "Insufficient data" }` (60개 미만 캔들)
  - `500`: `{ "error": "Failed to fetch market data" }` 또는 `{ "error": "Internal server error" }`
- **캐시**:
  - Supabase KV 캐시 (TTL: 300초)
  - `Cache-Control: public, s-maxage=300, stale-while-revalidate=600`
- **인증**: 불필요
- **데이터 소스**: Supabase `market_prices` 테이블

---

### GET /api/analysis/stock/[symbol]
- **파일**: `app/api/analysis/stock/[symbol]/route.ts`
- **설명**: 주식 전용 기술적 분석 API. Supabase `stock_prices`에서 데이터를 로드하고 시그널 생성 및 분석 실행. 외부 API 호출 없이 Supabase SSOT 데이터만 사용.
- **파라미터**:
  | 이름 | 필수 | 타입 | 기본값 | 설명 |
  |------|------|------|--------|------|
  | symbol | O | string (path) | - | URL 경로 파라미터. 주식 심볼 (대문자 변환) |
  | period | X | string (query) | `1d` | 분석 기간 |
  | tier | X | string (query) | `free` | 사용자 티어 (`free` 또는 `pro`) |
- **응답 (200)**:
  ```json
  {
    "success": true,
    "symbol": "AAPL",
    "period": "1d",
    "data": { "...분석 결과" },
    "dataPoints": 365,
    "timestamp": "2026-02-28T12:00:00.000Z"
  }
  ```
- **에러 응답**:
  - `400`: `{ "error": "Failed to fetch stock data" | "Insufficient stock price data", "symbol": "...", "dataPoints": 0 }` (50개 미만 데이터)
  - `500`: `{ "error": "Analysis failed", "symbol": "..." }`
- **캐시**: `Cache-Control: public, s-maxage=60, stale-while-revalidate=120`
- **인증**: 불필요
- **데이터 소스**: Supabase `stock_prices` 테이블 (via `fetchStockSSOT`)

---

## 뉴스/기타

### GET /api/news
- **파일**: `app/api/news/route.ts`
- **설명**: Supabase `news` 테이블에서 뉴스 목록을 조회. 언어, 심볼 필터링 및 페이지네이션 지원.
- **파라미터**:
  | 이름 | 필수 | 타입 | 기본값 | 설명 |
  |------|------|------|--------|------|
  | query | X | string | - | 심볼 필터 (예: BTC, AAPL). `ALL`이면 필터 미적용. 제목/스니펫에 대한 ilike 검색도 수행 |
  | lang | X | string | - | 언어 필터 (`ko`, `en`, 또는 `ko,en` 쉼표 구분). `ALL`이면 필터 미적용 |
  | page | X | number | `0` | 페이지 번호 (0부터 시작, 페이지당 20건) |
- **응답 (200)**:
  ```json
  {
    "items": [
      {
        "title": "비트코인 신고가 경신",
        "link": "https://...",
        "pubDate": "2026-02-28T12:00:00.000Z",
        "publisher": "Google News",
        "sentiment": "neutral",
        "snippet": "..."
      }
    ]
  }
  ```
- **에러 응답**: 에러 시에도 `{ "items": [] }` 반환 (200)
- **인증**: 불필요
- **데이터 소스**: Supabase `news` 테이블

---

### POST /api/contact
- **파일**: `app/api/contact/route.ts`
- **설명**: 문의 양식 이메일 전송 API. Nodemailer를 통해 Gmail SMTP로 이메일 발송.
- **요청 바디**:
  ```json
  {
    "name": "홍길동",
    "email": "user@example.com",
    "subject": "문의 제목",
    "message": "문의 내용"
  }
  ```
  - 모든 필드 필수
- **응답 (200)**:
  ```json
  { "message": "Email sent successfully" }
  ```
- **에러 응답**:
  - `400`: `{ "message": "Missing required fields" }`
  - `500`: `{ "message": "Failed to send email", "error": "..." }`
- **인증**: 불필요
- **환경변수**:
  - `CONTACT_EMAIL_USER` (필수): Gmail 발신 계정
  - `CONTACT_EMAIL_PASS` (필수): Gmail 앱 비밀번호
  - `CONTACT_EMAIL_TO` (선택): 수신 이메일 (기본값: `smartkdy7@gmail.com`)

---

## 관리자 전용

### GET /api/admin/users
- **파일**: `app/api/admin/users/route.ts`
- **설명**: Supabase Auth를 통해 전체 사용자 목록을 조회.
- **파라미터**: 없음
- **응답 (200)**:
  ```json
  {
    "users": [ { "id": "...", "email": "...", ... } ]
  }
  ```
- **에러 응답**:
  - `500`: `{ "error": "..." }`
- **인증**: 필요 (Supabase Admin Client 사용, 코드 내 별도 인증 체크 없음 - 주의)
- **데이터 소스**: Supabase Auth Admin API

### DELETE /api/admin/users
- **파일**: `app/api/admin/users/route.ts`
- **설명**: 특정 사용자를 삭제.
- **요청 바디**:
  ```json
  { "userId": "uuid-string" }
  ```
- **응답 (200)**:
  ```json
  { "success": true }
  ```
- **에러 응답**:
  - `500`: `{ "error": "..." }`
- **인증**: 필요 (Supabase Admin Client 사용, 코드 내 별도 인증 체크 없음 - 주의)

---

### GET /api/admin/market-data
- **파일**: `app/api/admin/market-data/route.ts`
- **설명**: 시장 데이터 일괄 수집 API. Binance에서 암호화폐 가격을, Mock 데이터로 주식 가격을 생성하여 `market_prices` 테이블에 삽입. 2000일 초과 오래된 데이터 자동 정리.
- **파라미터**: 없음
- **응답 (200)**:
  ```json
  {
    "success": true,
    "data": [
      { "symbol": "BTC", "price": 95000.0, "asset_type": "CRYPTO", "recorded_at": "..." },
      { "symbol": "AAPL", "price": 170.5, "asset_type": "STOCK", "recorded_at": "..." }
    ],
    "report": {
      "deleted": 0,
      "inserted": 10,
      "errors": []
    }
  }
  ```
  - 지원 암호화폐: `SUPPORTED_COINS` 상수 기반
  - 지원 주식: `TOP_US_STOCKS` 상수 기반 (Mock 데이터: AAPL, MSFT, NVDA, GOOGL, AMZN, META, TSLA, BRK-B, LLY, AVGO)
- **에러 응답**:
  - `500`: `{ "success": false, "error": "..." }`
- **인증**: 필요 (코드 내 `supabase.auth.getUser()` 호출하나 실제 체크 로직은 생략됨 - 주의)
- **데이터 소스**: Binance API (암호화폐) + Mock Generator (주식)

---

### GET /api/admin/news-crawl
- **파일**: `app/api/admin/news-crawl/route.ts`
- **설명**: Google News RSS를 크롤링하여 뉴스를 수집하고 Supabase `news` 테이블에 저장. 중복 체크(link 기준) 수행. 제목 기반 심볼 자동 태깅.
- **파라미터**:
  | 이름 | 필수 | 타입 | 기본값 | 설명 |
  |------|------|------|--------|------|
  | lang | X | string | `ko` | 크롤링 언어 (`ko` 또는 `en`) |
- **응답 (200)**:
  ```json
  {
    "success": true,
    "report": {
      "total_fetched": 50,
      "inserted": 30,
      "errors": []
    },
    "sample_items": [ { "title": "...", "link": "...", ... } ]
  }
  ```
  - 자동 태깅 심볼: BTC, ETH, XRP, SOL, STOCK, GENERAL
- **에러 응답**:
  - `500`: `{ "success": false, "error": "..." }`
- **인증**: 필요 (Supabase Admin Client 사용)
- **데이터 소스**: Google News RSS

---

### POST /api/admin/cleanup-data
- **파일**: `app/api/admin/cleanup-data/route.ts`
- **설명**: 데이터 정리 API. 심볼별로 최신 N개 레코드만 유지하고 나머지 삭제. 암호화폐(`market_prices`), 주식(`stock_prices`), 뉴스(`news`) 테이블 대상.
- **요청 바디**:
  ```json
  {
    "limit": 2000,
    "target": "all"
  }
  ```
  | 이름 | 필수 | 타입 | 기본값 | 설명 |
  |------|------|------|--------|------|
  | limit | X | number | `2000` | 심볼당 유지할 최대 레코드 수 (뉴스는 전역 1000개 고정) |
  | target | X | string | `all` | 정리 대상. `all`, `crypto`, `stock`, `news` 중 택1 |
- **응답 (200)**:
  ```json
  {
    "success": true,
    "results": {
      "crypto": { "status": "success", "deleted": 150 },
      "stock": { "status": "success", "deleted": 50 },
      "news": { "status": "success", "deleted": 200 }
    }
  }
  ```
  - `status`: `success` 또는 `skipped` (target에 포함되지 않은 경우)
- **에러 응답**:
  - `401`: `{ "error": "Unauthorized" }` (인증 실패 또는 권한 없음)
  - `500`: `{ "error": "..." }`
- **인증**: 필요 (이메일 기반 인증: `smartkdy7@gmail.com`만 허용)
- **데이터 소스**: Supabase `market_prices`, `stock_prices`, `news` 테이블

---

## 블로그 관련

### GET /api/blog
- **파일**: `app/api/blog/route.ts`
- **설명**: 발행된 블로그 포스트 목록 조회 (페이지네이션, 카테고리/태그/언어 필터)
- **파라미터**: `page`, `limit`, `category` (slug), `tag` (slug), `lang`
- **인증**: 불필요
- **캐시**: `s-maxage=30`

### POST /api/blog
- **파일**: `app/api/blog/route.ts`
- **설명**: 블로그 포스트 생성
- **인증**: Admin (`smartkdy7@gmail.com`)

### GET /api/blog/[id]
- **파일**: `app/api/blog/[id]/route.ts`
- **설명**: 포스트 상세 조회 (draft 포함, 관리자용)
- **인증**: Admin

### PUT /api/blog/[id]
- **파일**: `app/api/blog/[id]/route.ts`
- **설명**: 포스트 수정
- **인증**: Admin

### DELETE /api/blog/[id]
- **파일**: `app/api/blog/[id]/route.ts`
- **설명**: 포스트 삭제
- **인증**: Admin

### GET /api/blog/slug/[slug]
- **파일**: `app/api/blog/slug/[slug]/route.ts`
- **설명**: slug로 발행 포스트 조회
- **인증**: 불필요
- **캐시**: `s-maxage=60`

### GET /api/blog/categories
- **파일**: `app/api/blog/categories/route.ts`
- **설명**: 카테고리 목록 조회
- **인증**: 불필요
- **캐시**: `s-maxage=300`

### GET /api/blog/tags
- **파일**: `app/api/blog/tags/route.ts`
- **설명**: 태그 목록 조회
- **인증**: 불필요
- **캐시**: `s-maxage=300`

### POST /api/blog/upload
- **파일**: `app/api/blog/upload/route.ts`
- **설명**: 이미지 업로드 (Supabase Storage `blog-images` 버킷)
- **인증**: Admin

### GET /api/blog/search
- **파일**: `app/api/blog/search/route.ts`
- **설명**: 전문 검색 (tsvector 기반, ILIKE 폴백)
- **파라미터**: `q`, `page`, `limit`
- **인증**: 불필요

### POST /api/blog/view/[id]
- **파일**: `app/api/blog/view/[id]/route.ts`
- **설명**: 조회수 증가
- **인증**: 불필요

---

## SEO 관련

### GET /feed.xml
- **파일**: `app/feed.xml/route.ts`
- **설명**: RSS 2.0 피드. 최근 발행 블로그 포스트 50개를 XML로 제공.
- **응답**: `application/rss+xml`
- **캐시**: `s-maxage=3600`
- **인증**: 불필요

### GET /sitemap.xml
- **파일**: `app/sitemap.ts`
- **설명**: 동적 사이트맵. 정적 페이지 7개 + 발행 블로그 포스트 (최대 100개)
- **응답**: `application/xml`
- **인증**: 불필요

---

## 요약 테이블

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| GET | `/api/klines` | 암호화폐 캔들스틱 데이터 조회 | 불필요 |
| GET | `/api/price` | 암호화폐 현재가 조회 (Binance) | 불필요 |
| GET | `/api/kimchi` | 김치 프리미엄 조회 | 불필요 |
| GET | `/api/signals` | 시장 매매 시그널 스캔 | 불필요 |
| GET | `/api/news` | 뉴스 목록 조회 | 불필요 |
| POST | `/api/contact` | 문의 이메일 전송 | 불필요 |
| GET | `/api/analysis/[symbol]` | 암호화폐 기술적 분석 | 불필요 |
| GET | `/api/analysis/stock/[symbol]` | 주식 기술적 분석 | 불필요 |
| GET | `/api/stock/quote` | 주식 실시간 시세 (Twelve Data) | 불필요 |
| GET | `/api/stock/time-series` | 주식 시계열 데이터 조회 | 불필요 |
| GET | `/api/stock/history` | 주식 가격 이력 조회 | 불필요 |
| GET | `/api/admin/users` | 사용자 목록 조회 | 필요 |
| DELETE | `/api/admin/users` | 사용자 삭제 | 필요 |
| GET | `/api/admin/market-data` | 시장 데이터 수집 실행 | 필요 |
| GET | `/api/admin/news-crawl` | 뉴스 크롤링 실행 | 필요 |
| POST | `/api/admin/cleanup-data` | 데이터 정리 실행 | 필요 |
| GET | `/api/blog` | 블로그 포스트 목록 | 불필요 |
| POST | `/api/blog` | 블로그 포스트 생성 | Admin |
| GET | `/api/blog/[id]` | 포스트 상세 (관리자) | Admin |
| PUT | `/api/blog/[id]` | 포스트 수정 | Admin |
| DELETE | `/api/blog/[id]` | 포스트 삭제 | Admin |
| GET | `/api/blog/slug/[slug]` | slug로 포스트 조회 | 불필요 |
| GET | `/api/blog/categories` | 카테고리 목록 | 불필요 |
| GET | `/api/blog/tags` | 태그 목록 | 불필요 |
| POST | `/api/blog/upload` | 이미지 업로드 | Admin |
| GET | `/api/blog/search` | 블로그 검색 | 불필요 |
| POST | `/api/blog/view/[id]` | 조회수 증가 | 불필요 |
| GET | `/feed.xml` | RSS 피드 | 불필요 |
| GET | `/sitemap.xml` | 동적 사이트맵 | 불필요 |

## 환경변수 의존성

| 환경변수 | 사용 엔드포인트 | 필수 여부 |
|----------|-----------------|-----------|
| `TWELVEDATA_API_KEY` | `/api/stock/quote` | 필수 |
| `CONTACT_EMAIL_USER` | `/api/contact` | 필수 |
| `CONTACT_EMAIL_PASS` | `/api/contact` | 필수 |
| `CONTACT_EMAIL_TO` | `/api/contact` | 선택 |
| Supabase 환경변수 | 대부분의 엔드포인트 | 필수 |
