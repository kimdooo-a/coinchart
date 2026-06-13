# API Reference

## 개요
총 31개 route.ts 엔드포인트 (`app/api/**/route.ts` 기준) + SEO 라우트 3종(`feed.xml`/`sitemap.xml`/`robots.txt`).

분류: 암호화폐 6 (`klines`/`price`/`kimchi`/`signals`/`coins/ticker`/`coins/hot-issues`) · 주식 3 (`stock/quote`/`stock/time-series`/`stock/history`) · 분석 2 (`analysis/[symbol]`/`analysis/stock/[symbol]`) · 뉴스·기타 3 (`news`/`contact`/`fng`) · 커뮤니티 5 (`board/[slug]`/`board/[slug]/[postId]`/`community/comment`/`community/like` + 관리자 `admin/board`) · 관리자 5 (`admin/users`/`admin/market-data`/`admin/news-crawl`/`admin/cleanup-data`/`admin/board`) · 블로그 10.

최종 업데이트: 2026-06-13 (R9 gap-verify / T09 — 실제 route.ts 31개 정합, T04 에러 핸들링 상태코드 반영)

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
- **에러 응답** (R9/T04 갱신 — "심볼 없음" vs "API 다운"을 상태코드로 구분):
  - `400`: `{ "error": "Symbol is required" }` (symbol 누락) / 그 외 잘못된 요청 시 TwelveData 원본 패스스루(`data.status==='error'`이고 심볼·5xx 케이스 아님)
  - `404`: 심볼 없음/잘못된 심볼 — TwelveData 원본 패스스루. 판별: `data.code === 404` 또는 `data.message`가 `/not found|symbol|no data/i` 매칭. (이전엔 400)
  - `500`: `{ "error": "Server configuration error" }` (`TWELVEDATA_API_KEY` 미설정)
  - `503`: API 다운/업스트림 5xx. 업스트림 HTTP 5xx(`res.status>=500`) → `{ "error": "Stock data service unavailable" }`; TwelveData 에러코드 5xx(`data.code>=500`) → 원본 패스스루; 네트워크 예외·타임아웃·JSON 파싱 실패(catch) → `{ "error": "Failed to fetch data" }`. (catch는 이전 500에서 503으로 변경)
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
- **에러 응답** (R9/T04 갱신):
  - 정상(결과 0건 포함): `200` `{ "items": [] }`
  - DB 오류: `503` `{ "items": [], "error": "<사유>" }` — `items`는 빈 배열로 유지(프론트가 `data.items` 안전 소비), `error`는 오류 시에만 추가되는 선택 필드(정상 200 응답에는 없음). 이전엔 DB 오류도 200으로 은폐했으나 R9/T04에서 503으로 명시.
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

### GET /api/admin/board (R3 2026-05-24, T06)
- **파일**: `app/api/admin/board/route.ts`
- **설명**: 보드별 공지(`is_notice=true`) 목록 + 최근 일반글 30개(공지 승격 후보) 조회. 관리자 공지 관리 UI(`/admin/board`) 전용.
- **쿼리 파라미터**: `slug` (필수, board API와 동일한 9종 화이트리스트)
- **응답 (200)**:
  ```json
  {
    "notices": [ /* community_posts row[] (is_notice=true) */ ],
    "posts":   [ /* community_posts row[] (is_notice=false, 최근 30) */ ]
  }
  ```
  각 행 필드는 `GET /api/board/[slug]`와 동일.
- **에러**: `401`(미인증) / `403`(비관리자) / `404`(slug) / `500`
- **인증**: Admin (`isAdminEmail` 서버 검증, `smartkdy7@gmail.com`)

### POST /api/admin/board (R3 2026-05-24, T06)
- **파일**: `app/api/admin/board/route.ts`
- **설명**: 새 공지 작성. 관리자 본인 `author_id`로 적재, `is_notice=true` 고정.
- **Body**: `{ slug: string, title: string(1~200), contentHtml: string, category?: string(기본 '공지') }`
- **응답 (201)**: `{ id: string }`
- **에러**: `400`(검증/JSON) / `401`(미인증) / `403`(비관리자) / `404`(slug) / `500`
- **인증**: Admin (서버 role 검증)

### PATCH /api/admin/board (R3 2026-05-24, T06)
- **파일**: `app/api/admin/board/route.ts`
- **설명**: 기존 글의 `is_notice` 토글(일반글↔공지 승격/해제). service_role로 RLS 우회.
- **Body**: `{ postId: string, isNotice: boolean }`
- **응답 (200)**: `{ id: string, isNotice: boolean }`
- **에러**: `400`(검증/JSON) / `401`(미인증) / `403`(비관리자) / `404`(글 없음)
- **인증**: Admin (서버 role 검증)
- **참고**: 공개 `board API`(`app/api/board/[slug]/route.ts`)는 **일절 미수정** — 본 admin 라우트만 추가하여 board 응답 계약(`notices/posts/total/page/limit`)을 하위호환 유지.

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
- **설명**: 동적 사이트맵. 정적 페이지 7개 + 발행 블로그 포스트 (최대 100개) + 카테고리 페이지 + 태그 페이지
- **응답**: `application/xml`
- **인증**: 불필요

### GET /robots.txt
- **파일**: `app/robots.ts`
- **설명**: 크롤러 접근 제어. `/api/`, `/admin/`, `/auth/` 차단, sitemap URL 명시
- **응답**: `text/plain`
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
| GET | `/api/admin/board` | 보드별 공지+최근글 조회 | Admin |
| POST | `/api/admin/board` | 공지 작성 (is_notice) | Admin |
| PATCH | `/api/admin/board` | is_notice 토글 (승격/해제) | Admin |
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
| GET | `/robots.txt` | 크롤러 접근 제어 | 불필요 |

## 환경변수 의존성

| 환경변수 | 사용 엔드포인트 | 필수 여부 |
|----------|-----------------|-----------|
| `TWELVEDATA_API_KEY` | `/api/stock/quote` | 필수 |
| `CONTACT_EMAIL_USER` | `/api/contact` | 필수 |
| `CONTACT_EMAIL_PASS` | `/api/contact` | 필수 |
| `CONTACT_EMAIL_TO` | `/api/contact` | 선택 |
| Supabase 환경변수 | 대부분의 엔드포인트 | 필수 |

---

### GET /api/coins/ticker

R1 (2026-05-23) 추가.

| 쿼리 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| symbols | string (CSV) | (기본 10개) | Binance pair (예: BTCUSDT,ETHUSDT) |

응답: `{ tickers: CoinTicker[], ts: number }` — `types/coins.ts#CoinTicker`
캐시: 60초 (Next revalidate + 메모리 Map)

---

### GET /api/fng

R1 (2026-05-23) 추가. Alternative.me Fear & Greed Index 프록시.

- **파일**: `app/api/fng/route.ts`
- **데이터 소스**: `https://api.alternative.me/fng/?limit=2&format=json` (무인증, 무료)
- **파라미터**: 없음
- **응답 (200)**: `FngSnapshot`
  ```json
  {
    "value": 72,
    "classification": "Greed",
    "prevValue": 68,
    "timestamp": 1747958400000
  }
  ```
  - `value`: 0~100 정수
  - `classification`: `"Extreme Fear" | "Fear" | "Neutral" | "Greed" | "Extreme Greed"`
  - `prevValue`: 어제 값 (없을 수도 있음)
  - `timestamp`: unix ms
- **에러 응답**:
  - `502`: `{ "error": "..." }` (외부 API 실패 / 빈 응답 / JSON 파싱 실패). R9/T04에서 `lib/community/fng.ts`가 JSON 파싱 실패 시 `throw new Error("[fng] invalid json")`로 명시 보강 → 이 catch로 흡수되어 502 반환(상태코드 불변).
- **캐시**: 1시간 (Next `revalidate = 3600` + 모듈 메모리)
- **인증**: 불필요
- **사용처**: 메인페이지 사이드바 `FngGaugeWidget` (T15)

---

## 커뮤니티 (R1 2026-05-23, T12)

v2.0 커뮤니티 피벗(자유/시세/정보 + 코인룸 6종)을 위한 게시글·댓글·추천 CRUD.
공통 사항:
- **익명 작성**: `middleware.ts`가 `/api/board/*`, `/api/community/*`에 `x-client-ip-masked`, `x-client-ip-hash` 헤더 주입 (T07)
- **회원 식별**: `cookies()` 기반 supabase `auth.getUser()` — body의 `postAsAnonymous: true`로 회원이 익명 작성 가능
- **권한**: 회원은 `author_id == auth.uid()`, 익명은 `guestPassword` bcrypt 검증
- **유효 board slug**: `free`, `market`, `info`, `coin-btc`, `coin-eth`, `coin-xrp`, `coin-sol`, `coin-altcoin`, `coin-kimp` (9종)
- **DB**: `community_posts`, `community_comments`, `community_post_likes` (T01 마이그레이션)

---

### GET /api/board/[slug]

게시판 글 목록 조회.

- **파일**: `app/api/board/[slug]/route.ts`
- **경로 파라미터**: `slug` — 위 9종 중 하나
- **쿼리 파라미터**:
  | 이름 | 필수 | 타입 | 기본값 | 설명 |
  |------|------|------|--------|------|
  | page | X | number | `1` | 페이지 번호 (1-base) |
  | limit | X | number | `30` | 페이지당 항목 수 (max 100) |
  | sort | X | string | `recent` | `recent` / `popular` / `views` / `comments` |
  | search | X | string | - | 제목 부분 일치 (ilike) |
  | category | X | string | - | `'전체'`/빈문자열이면 필터 없음 |
- **응답 (200)**:
  ```json
  {
    "notices": [ /* community_posts row[] (is_notice=true) */ ],
    "posts":   [ /* community_posts row[] (is_notice=false) */ ],
    "total":   123,
    "page":    1,
    "limit":   30
  }
  ```
  각 행: `id, board_slug, title, author_id, guest_nickname, guest_ip_masked, category, tags, coin_symbol, view_count, like_count, comment_count, is_notice, is_hot, created_at, updated_at`
- **에러**: `404 Unknown board`, `500`
- **인증**: 불필요

---

### POST /api/board/[slug]

새 글 작성. 회원 또는 익명.

- **파일**: `app/api/board/[slug]/route.ts`
- **Body**:
  ```ts
  {
    title:           string,   // 1~200자
    contentHtml:     string,   // HTML
    category?:       string,   // 기본 '전체'
    tags?:           string[], // max 10
    coinSymbol?:     string,   // 자동 uppercase
    postAsAnonymous?: boolean, // 회원이 익명 작성 시 true
    guestNickname?:  string,   // 익명 필수 (2~12자)
    guestPassword?:  string    // 익명 필수 (≥4자, bcrypt 해시 저장)
  }
  ```
- **응답 (201)**: `{ id: string }`
- **에러**: `400`(검증) / `404`(slug) / `500`
- **헤더 사용**: `x-client-ip-masked` (익명 작성 시 `guest_ip_masked`로 저장)

---

### GET /api/board/[slug]/[postId]

게시글 상세 + 첫 페이지 댓글 + view_count +1.

- **파일**: `app/api/board/[slug]/[postId]/route.ts`
- **응답 (200)**:
  ```json
  {
    "post":     { /* community_posts row */ },
    "comments": [ /* community_comments row[] (max 100, created_at ASC) */ ]
  }
  ```
- **에러**: `400`(invalid uuid) / `404`(not found 또는 deleted)
- **부수 효과**: `view_count += 1` (비동기, 응답 차단 안 함)

---

### PATCH /api/board/[slug]/[postId]

게시글 수정.

- **Body**:
  ```ts
  {
    title?:        string,
    contentHtml?:  string,
    category?:     string,
    tags?:         string[],
    coinSymbol?:   string,
    guestPassword?: string  // 익명 글 수정 시 필수
  }
  ```
- **권한**: 회원=`auth.uid() === post.author_id` / 익명=`bcrypt.compare(guestPassword, guest_password_hash)`
- **응답 (200)**: `{ ok: true }`
- **에러**: `401`(비번 누락) / `403`(권한/비번 불일치) / `404`(없음) / `410`(이미 삭제)
- **에러 (R9/T04 갱신 — 최종 update 단계)**: RLS 거부(`error.code === 'PGRST301'`) 또는 Postgres 권한 부족(`error.code === '42501'`) → `403` `{ "error": "권한이 없습니다" }`. 그 외 DB 오류 → `500` `{ "error": "<message>" }`. (RLS/권한 케이스는 이전 500에서 403으로 변경. `verifyEditPermission`이 반환하는 위 401/403/404/410 흐름은 불변.)

---

### DELETE /api/board/[slug]/[postId]

게시글 soft delete (`is_deleted=true`).

- **권한**: PATCH와 동일
- **`guestPassword` 전달**: query `?guestPassword=` 또는 body JSON (DELETE에 body 허용)
- **응답 (200)**: `{ ok: true }`
- **에러 (R9/T04 갱신 — 최종 update 단계)**: PATCH와 동일 정책(공통 helper `mapUpdateError()`). RLS 거부(`PGRST301`)·Postgres 권한 부족(`42501`) → `403` `{ "error": "권한이 없습니다" }`, 그 외 DB 오류 → `500`.

---

### POST /api/community/comment

댓글/대댓글 작성.

- **파일**: `app/api/community/comment/route.ts`
- **Body**:
  ```ts
  {
    postId:           string,   // uuid
    parentId?:        string,   // 대댓글이면 부모 댓글 uuid
    content:          string,   // 1~2000자
    postAsAnonymous?: boolean,
    guestNickname?:   string,   // 익명 필수
    guestPassword?:   string    // 익명 필수
  }
  ```
- **응답 (201)**: `{ comment: { id, post_id, parent_id, content, author_id, guest_nickname, guest_ip_masked, like_count, created_at } }`
- **부수 효과**: `community_posts.comment_count += 1` (DB 트리거)
- **에러**: `400`(검증) / `404`(게시글 없음 또는 삭제)

---

### DELETE /api/community/comment

댓글 soft delete.

- **쿼리 또는 body**: `commentId` (필수), `guestPassword` (익명 댓글이면 필수)
- **권한**: 회원=`auth.uid() === comment.author_id` / 익명=bcrypt 검증
- **응답 (200)**: `{ ok: true }` (이미 삭제된 경우도 `ok: true`)

---

### PATCH /api/community/comment (R3 2026-05-24, T08)

댓글 추천/비추 토글. `community_comment_likes` 테이블 기반 (post_like 패턴 차용).

- **파일**: `app/api/community/comment/route.ts` (POST/DELETE와 충돌 없이 PATCH 메서드 추가)
- **Body**: `{ commentId: string, value?: 1 | -1 }` — `value` 생략/잘못된 값 → `1`(추천) 기본
- **헤더**: 익명일 경우 `x-client-ip-hash: <hashIp(전체 IP)>` 필수 (게시글 추천과 동일 dedup)
- **dedup**:
  - 회원: `(comment_id, user_id)` UNIQUE 부분 인덱스
  - 익명: `(comment_id, ip_hash)` UNIQUE 부분 인덱스
- **토글 로직** (post_like와 동일):
  - 기존 행 없음 → INSERT
  - 기존 행 value === 요청 value → DELETE (토글 OFF)
  - 기존 행 value ≠ 요청 value → UPDATE (전환)
- **응답 (200)**: `{ liked: boolean, likeCount: number }`
  - `liked`: 추천(value=1) 현재 활성 여부
  - `likeCount`: 트리거 반영 후 `community_comments.like_count` (부호 합산 = 순추천수)
- **에러**: `400`(invalid JSON/commentId, 또는 익명인데 ip_hash 헤더 없음) / `404`(댓글 없음) / `500`(DB 오류)

---

### POST /api/community/like

추천/비추 토글. **(R3 2026-05-24, T07)** — 원자적 토글 RPC + 회원전이 dedup으로 전환.

- **파일**: `app/api/community/like/route.ts`
- **Body**: `{ postId: string, value: 1 | -1 }`
- **dedup**:
  - 회원: `(post_id, user_id)` UNIQUE 부분 인덱스
  - 익명: `(post_id, ip_hash)` UNIQUE 부분 인덱스 (`x-client-ip-hash` 헤더)
  - **회원전이**: 회원 요청 + ip_hash 보유 시, 토글 전에 본인 익명 추천 행을 승계(회원행 부재) 또는 삭제(중복 정리). 정책: `docs/rules/community-like-dedup.md`
- **토글 로직** (단일 plpgsql RPC `community_toggle_post_like`로 원자 처리):
  - 기존 레코드 없음 → INSERT
  - 기존 레코드의 `value`가 같음 → DELETE (취소)
  - 기존 레코드의 `value`가 다름 → UPDATE (추천↔비추 전환)
- **응답 (200)**: `{ liked: boolean, likeCount: number, dislikeCount: number }`
  - `liked`: 최종 상태가 추천(value=1)이면 true (취소/비추는 false)
  - `likeCount`: **추천 수**(value=1 합, ≥0). ⚠️ 이전 의미(`community_posts.like_count` 순합산, 음수 가능)에서 **추천 수로 변경**. 필드명·타입 동일 → 기존 소비처(`togglePostLike`/UI) 무파손
  - `dislikeCount`: **(신규)** 비추 수(value=-1 합, ≥0)
  - 분리 집계는 RPC `community_post_like_counts(p_post_id)`가 제공. `community_posts.like_count` 컬럼(순합산)은 인기순 정렬용으로 유지
- **에러**: `400`(invalid postId/value, 또는 익명인데 ip_hash 헤더 없음) / `404`(게시글 없음)

---

### GET /api/coins/hot-issues

R1 (2026-05-23) 추가. 메인페이지 사이드바 `HotIssueWidget` 실데이터 공급용.

- **파일**: `app/api/coins/hot-issues/route.ts`
- **데이터 소스**: Supabase RPC `community_hot_issues(hours_window int, result_limit int)`
- **파라미터** (query)

  | 쿼리 | 기본값 | 유효 범위 | 설명 |
  |---|---|---|---|
  | `hours` | 24 | 1~168 (서버 클램프) | 집계 윈도우 (시간) |
  | `limit` | 10 | 1~50 (서버 클램프) | 결과 개수 |

- **응답 (200)**:
  ```json
  {
    "items": [
      { "rank": 1, "symbol": "BTC", "count": 87, "trend": "UP",   "score": 91.6 },
      { "rank": 2, "symbol": "ETH", "count": 42, "trend": "FLAT", "score": 53.3 },
      { "rank": 3, "symbol": "SOL", "count": 18, "trend": "NEW",  "score": 18.0 }
    ],
    "ts": 1747958400000
  }
  ```
  - `rank`: 1-based 정렬 순위 (score 내림차순)
  - `symbol`: `community_posts.coin_symbol` 원본 값 (예: BTC/ETH/XRP/SOL/ALT/KIMP)
  - `count`: 최근 `hours`시간 내 게시글 수
  - `trend`: `"UP" | "DOWN" | "FLAT" | "NEW"`
    - 임계: 최근/직전 비율 > 1.2 → `UP`, < 0.8 → `DOWN`, 그 외 → `FLAT`. 직전 윈도우 0건 → `NEW`.
  - `score`: 정렬 가중치 `recent + prev * 0.3`
  - `ts`: 응답 생성 unix ms
- **에러 응답**:
  - `500`: `{ "error": "..." }` (RPC 실패 / Supabase 연결 오류)
- **캐시**: 5분 (Next `revalidate = 300`)
- **인증**: 불필요 (RPC는 `anon` / `authenticated` 모두 EXECUTE 가능)
- **사용처**: 메인페이지 사이드바 `HotIssueWidget` (T15에서 연동)
- **의존 마이그레이션**: `supabase/migrations/20260523_create_hot_issues_rpc.sql` (`community_posts` 선행)
