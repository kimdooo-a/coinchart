# API Reference

## 개요
총 37개 엔드포인트 (공개 9개 + 블로그 6개 + SEO 3개, 관리자 5개 + 블로그 5개, 주식 분석 2개, 사용자 데이터 4개 포함, R-B 스크랩·신고 3개 추가)

최종 업데이트: 2026-06-20 (R-B — scrap POST/GET·report POST·admin/reports GET/PATCH·board scrapped 필드 추가)

---

## 목차
1. [암호화폐 관련](#암호화폐-관련)
2. [주식 관련](#주식-관련)
3. [분석 관련](#분석-관련)
4. [뉴스/기타](#뉴스기타)
5. [사용자 데이터](#사용자-데이터)
6. [관리자 전용](#관리자-전용)
7. [커뮤니티 스크랩·신고 (R-B)](#커뮤니티-스크랩신고-r-b)

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
  - 지원 코인: BTC, ETH, SOL, XRP, BCH, DOGE (route.ts 하드코딩 6종)
  - `exchangeRate`: USD/KRW. exchangerate-api 실패 시 **마지막 성공값(모듈 캐시) 폴백**, 콜드스타트 전 무캐시 시에만 1450 기본값 (R-D)
- **에러 응답**:
  - `500`: `{ "error": "Failed to fetch data", "details": "..." }`
- **인증**: 불필요
- **데이터 소스**: Binance API + Bithumb API + ExchangeRate API
- **비고**: 환율 API 실패 시 마지막 성공값(모듈 캐시) 폴백, 무캐시 시에만 1450 기본값 (R-D)

---

### GET /api/calendar
- **파일**: `app/api/calendar/route.ts`
- **설명**: 경제 일정 크롤링 API. faireconomy(ForexFactory 호환) 공개 JSON 피드(this/next week)를 fetch·매핑하여 캘린더 페이지에 실데이터 제공. ISR 1시간 캐시.
- **파라미터**: 없음
- **응답 (200)**:
  ```json
  { "events": [ { "date": "2026-06-22", "titleEn": "FOMC Statement", "titleKo": "FOMC Statement", "impact": "high", "country": "USD" } ] }
  ```
  - `impact`: high/medium/low (피드 High/Medium/Low/Holiday 매핑, 빈 영향도 제외)
  - `titleKo`: 크롤 소스에 한글 번역 없어 영문 제목 재사용
- **에러 응답**:
  - `502`: `{ "events": [], "error": "Feed unavailable" }` (양 피드 모두 실패)
  - `500`: `{ "events": [], "error": "Failed to fetch calendar" }`
- **인증**: 불필요
- **데이터 소스**: `nfs.faireconomy.media/ff_calendar_{thisweek,nextweek}.json`

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
  - 모든 필드 필수. 서버 검증(R-C/R-D): 필드별 최대 길이(name 100·email 254·subject 200·message 5000), 이메일 형식 정규식, 이메일/제목/발신표시명 개행 제거(헤더 인젝션 차단). HTML 본문은 사용자 입력 escape(메일 인젝션 차단).
- **응답 (200)**:
  ```json
  { "message": "Email sent successfully" }
  ```
- **에러 응답**:
  - `400`: `{ "message": "Missing required fields" }` (필수값 누락)
  - `400`: `{ "message": "Input exceeds allowed length" }` (길이 초과)
  - `400`: `{ "message": "Invalid email format" }` (이메일 형식 오류)
  - `500`: `{ "message": "Failed to send email", "error": "..." }`
- **인증**: 불필요
- **환경변수**:
  - `CONTACT_EMAIL_USER` (필수): Gmail 발신 계정
  - `CONTACT_EMAIL_PASS` (필수): Gmail 앱 비밀번호
  - `CONTACT_EMAIL_TO` (선택): 수신 이메일 (기본값: `smartkdy7@gmail.com`)

---

## 사용자 데이터

> watchlist(즐겨찾기) 회원 동기화 (R12). 모든 라우트 **회원 전용** — 미회원 `401 {error:"로그인이 필요합니다."}`. 인증=`lib/supabase/server.ts` 쿠키 세션(`auth.getUser()`) + RLS 이중 가드. `dynamic = 'force-dynamic'`. 접근 SSOT=`lib/supabase/watchlist.ts`. 익명은 API 없이 localStorage(`cca:watchlist`).
> `WatchlistItem = { assetType: 'CRYPTO'|'STOCK', symbol, sortOrder, createdAt }`

### GET /api/watchlist
- **파일**: `app/api/watchlist/route.ts`
- **설명**: 본인 즐겨찾기 목록.
- **응답 (200)**: `{ items: WatchlistItem[], limit: 100 }`

### POST /api/watchlist
- **파일**: `app/api/watchlist/route.ts`
- **요청 바디**: `{ assetType, symbol, sortOrder? }` (symbol 서버 trim·대문자 정규화, 최대 32자)
- **설명**: 추가(멱등). 이미 존재 시 기존 행 반환.
- **응답**: `201 { item, alreadyExists:false }` (신규) / `200 { item, alreadyExists:true }` (기존)
- **에러**: `400` 입력 오류 / `409 { error, limit:100 }` 상한 초과(회원 100)

### DELETE /api/watchlist
- **파일**: `app/api/watchlist/route.ts`
- **요청(단건)**: 바디 `{ assetType, symbol }` 또는 쿼리 `?assetType=&symbol=`
- **요청(벌크 clear, R13)**: 쿼리 `?all=true` (바디 없음) — 본인 전 행 단일 쿼리 삭제
- **설명**: 삭제(멱등 — 없어도 ok). `all=true` 분기는 전건 비우기(clear).
- **응답**: `200 { ok:true }`(단건) / `200 { ok:true, cleared:number }`(벌크) / `400` 입력 오류

### PATCH /api/watchlist (R13)
- **파일**: `app/api/watchlist/route.ts`
- **요청 바디**: `{ order: [{ assetType:'CRYPTO'|'STOCK', symbol, sortOrder }, ...] }` (최대 500건)
- **설명**: 표시 순서 일괄 영속화(reorder). 회원 RLS 하 `user_watchlist.sort_order` 일괄 UPDATE(미존재 키 무시·신규 삽입 없음). SSOT `reorderWatchlist()`.
- **응답**: `200 { ok:true, updated:number }` / `400`(order 배열 아님·500 초과) / `401` / `500`

### POST /api/watchlist/sync
- **파일**: `app/api/watchlist/sync/route.ts`
- **요청 바디**: `{ items: [{assetType, symbol, sortOrder?}, ...] }` (단일 호출 입력 상한 500)
- **설명**: **로컬 우선 병합** — 로컬+DB 합집합 업로드, 중복(UNIQUE) DB 기존 유지(로컬 손실 0). 합집합 100 초과 시 신규분 입력 순서로 잘라냄. 로그인 직후 1회(D3).
- **응답 (200)**: `{ items: WatchlistItem[], added, skipped, limit:100 }`

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
| GET | `/api/calendar` | 경제 일정 크롤링 조회 (faireconomy) | 불필요 |
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
| GET | `/api/admin/reports` | 신고 목록 조회 (status 필터) | Admin |
| PATCH | `/api/admin/reports` | 신고 상태 변경 (reviewed/dismissed) | Admin |
| POST | `/api/community/scrap` | 스크랩 토글 (추가/취소) | 회원 전용 |
| GET | `/api/community/scrap` | 내 스크랩 목록 조회 | 회원 전용 |
| POST | `/api/community/report` | 게시글·댓글 신고 접수 | 불필요 (회원/익명) |
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
  - `502`: `{ "error": "..." }` (외부 API 실패 / 빈 응답)
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
    "post":     { /* community_posts row, scrapped: boolean (R-B 추가) */ },
    "comments": [ /* community_comments row[] (max 100, created_at ASC) */ ]
  }
  ```
  - `scrapped`: 현재 로그인 회원이 이 게시글을 스크랩했는지 여부 (미로그인=false)
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

---

### DELETE /api/board/[slug]/[postId]

게시글 soft delete (`is_deleted=true`).

- **권한**: PATCH와 동일
- **`guestPassword` 전달**: **body JSON 전용** (`{ guestPassword?: string }`) — query string은 평문 로깅 위험으로 제거(H-2 2026-06-20). 클라 `deleteBoardPost`는 `DELETE` + `Content-Type: application/json` + body 전송
- **응답 (200)**: `{ ok: true }`

---

### POST /api/board/[slug]/[postId]/verify-edit (HIGH-1 2026-06-20)

게시글 수정 권한 **사전 검증**. 수정 페이지의 익명 비밀번호 게이트가 편집기 진입 전 호출해 비번을 서버에서 확인한다(게이트가 진실해짐 — 검증 없이 통과하던 정합성 결함 해소).

- **파일**: `app/api/board/[slug]/[postId]/verify-edit/route.ts`
- **Body**: `{ guestPassword?: string }`
- **권한·검증 로직**: PATCH/DELETE와 동일한 `verifyEditPermission()`(`lib/community/post-edit-auth.ts` SSOT) — 회원=세션 author_id 일치 / 익명=bcrypt 비번 일치
- **응답 (200)**: `{ ok: true }`
- **에러**: `401`(비번 누락) / `403`(권한/비번 불일치) / `404`(없음) / `410`(이미 삭제)
- **클라**: `verifyPostEditAccess(slug, postId, guestPassword?)` (`lib/community/board-queries.ts`)

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

---

## 커뮤니티 스크랩·신고 (R-B)

> R-B 2026-06-14 추가. 스크랩(북마크)·신고 기능 API.
> DB: `community_post_scraps` / `community_reports` (`supabase/migrations/20260614000001_create_scraps_reports.sql`)

---

### POST /api/community/scrap

게시글 스크랩 토글 (추가/취소).

- **파일**: `app/api/community/scrap/route.ts`
- **인증**: 회원 전용 (`auth.getUser()` — 미인증 401)
- **Body**: `{ postId: string }` (uuid)
- **동작**: `community_post_scraps`에 행 있으면 DELETE(취소), 없으면 INSERT(추가). 원자적 토글.
- **응답 (200)**: `{ scrapped: boolean }` — 최종 상태 (true=스크랩됨, false=취소됨)
- **에러**: `400`(invalid postId) / `401`(미인증) / `404`(게시글 없음) / `500`

---

### GET /api/community/scrap

내 스크랩 목록 조회.

- **파일**: `app/api/community/scrap/route.ts`
- **인증**: 회원 전용
- **쿼리 파라미터**: `page`(기본 1), `limit`(기본 30, max 100)
- **응답 (200)**:
  ```json
  {
    "scraps": [ /* community_posts row[] — 스크랩한 게시글 */ ],
    "total": 42,
    "page": 1,
    "limit": 30
  }
  ```
- **에러**: `401`(미인증) / `500`

---

### POST /api/community/report

게시글·댓글 신고 접수.

- **파일**: `app/api/community/report/route.ts`
- **인증**: 불필요 (회원·익명 모두 신고 가능). 회원이면 `reporter_user_id`, 익명이면 `reporter_ip_hash`로 적재.
- **Body**:
  ```ts
  {
    targetType: 'post' | 'comment',
    targetId:   string,   // uuid
    reason:     'spam' | 'abuse' | 'sexual' | 'fraud' | 'etc',
    detail?:    string    // max 500자
  }
  ```
- **응답 (201)**: `{ ok: true }`
- **에러**: `400`(검증) / `409`(이미 신고함 — dedup) / `500`
- **dedup**: `reporter_user_id` 또는 `reporter_ip_hash` 기준 동일 대상 중복 신고 방지 (부분 UNIQUE 인덱스)
- **헤더 사용**: `x-client-ip-hash` (middleware 주입, 익명 신고 dedup용)

---

### GET /api/admin/reports

신고 목록 조회 (관리자 전용).

- **파일**: `app/api/admin/reports/route.ts`
- **인증**: Admin (`requireAdmin` — `smartkdy7@gmail.com`)
- **쿼리 파라미터**: `status`(`pending`|`reviewed`|`dismissed`, 기본 전체)
- **응답 (200)**:
  ```json
  {
    "reports": [ /* community_reports row[] */ ],
    "total": 5
  }
  ```
- **에러**: `401`(미인증) / `403`(비관리자) / `500`
- **정렬**: `created_at DESC` (인덱스 `idx_reports_status_created` 활용)

---

### PATCH /api/admin/reports

신고 상태 변경 (관리자 전용).

- **파일**: `app/api/admin/reports/route.ts`
- **인증**: Admin
- **Body**: `{ reportId: string, status: 'reviewed' | 'dismissed' }`
- **응답 (200)**: `{ ok: true, status: string }`
- **에러**: `400`(검증) / `401`(미인증) / `403`(비관리자) / `404`(없음) / `500`
