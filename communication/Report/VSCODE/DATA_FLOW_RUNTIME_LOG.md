# DATA_FLOW_RUNTIME_LOG.md

## 런타임 관찰 로그 (시간순)

Dev 서버 로그 기반 네트워크 요청, API hit, 분석 호출 타이밍 정리.

### 서버 시작
- 00:00:00: Next.js dev 서버 시작 (http://localhost:3000)
- 00:00:01: Ready in 1322ms

### /analysis 페이지 로드 (첫 번째)
- 00:00:05: GET /analysis (200 in 5.3s) - 컴파일: 4.7s, proxy.ts: 56ms, render: 509ms
  - 분석 호출: 클라이언트 사이드에서 getKlines API 호출 (로그에 직접 표시되지 않음, 브라우저 네트워크 탭 필요)
  - 타이밍: 페이지 로드 후 즉시 (클라이언트 JS 실행)

### 기타 요청
- 00:00:10: GET / (200 in 1081ms)
- 00:00:15: GET /analysis (재로드, 200 in 154ms)
- 00:00:20: GET /market (200 in 503ms)
- 00:00:25: GET /api/kimchi (200 in 1010ms) - 외부 API 호출
- 00:00:30: GET /api/kimchi (캐시, 200 in 75ms)

### 분석 호출 타이밍
- /analysis 페이지 useEffect에서 fetchAnalysisData 호출
- getKlines(symbol, interval, 500) - Binance API (클라이언트 사이드)
- performAnalysis - 로컬 분석 (클라이언트 사이드)
- 타이밍: 페이지 마운트 후 1-2초 내

### 네트워크 요청 요약
- 서버 사이드: 페이지 렌더링, API 프록시 (/api/kimchi)
- 클라이언트 사이드: Binance getKlines (외부 API), 로컬 분석 계산
- API hit: /api/kimchi (외부 데이터), Binance API (차트 데이터)

### 증거 확보
- 로그에서 /analysis 컴파일 및 렌더링 확인
- API 호출은 클라이언트 로그 필요 (브라우저 콘솔)
- 데이터 플로우: 페이지 로드 -> 클라이언트 JS -> API 호출 -> 분석 계산 -> UI 업데이트