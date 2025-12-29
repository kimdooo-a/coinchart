# RESULT_PHASE4_STEP4-3B_VSCODE.md

## 네트워크 증거

### /analysis/BTC 네트워크 탭 관찰
- **(A) Supabase market_prices 조회**: 발생하지 않음 (990 rows 없음, 현재 trades: []로 Supabase 호출 없음).
- **(B) Binance /api/price 폴링**: 발생하지 않음 (표시용 가격 폴링 없음).
- **(C) Binance klines 호출**: 1회 발생 (분석 입력으로 사용, SSOT 위반).

### 캡처/로그 요약
- Supabase: 0 요청 (SSOT 미구현).
- Binance /api/price: 0 요청.
- Binance klines: 1 요청 (GET /api/v3/klines?symbol=BTCUSDT&interval=1d&limit=500).

## Binance klines 발생 시 원인 파일/라인
- **컴포넌트**: AnalysisPanel.tsx
- **파일**: f:\11 dev\251206 코인 차트분석\components\Analysis\AnalysisPanel.tsx
- **라인**: ~28 (useEffect에서 fetchAnalysisData -> getKlines 호출)
- **역추적**: /analysis 페이지 -> AnalysisPanel -> getKlines(symbol, interval, 500) -> Binance API 직접 호출.

## grep 2단 결과 + allowlist 제안

### (1) UI 표시 경로 (app/, components/, lib/translations.ts): 0 매치 ✅
- 검색어: 손실 없음|안정적|보장|예측|AI 예측
- 결과: 0 매치 (목표 달성).

### (2) scripts/history/kdy-addon 등 허용 경로 리스트 (allowlist)
- **포함 파일**:
  - scripts/verify_explanation.ts (AI 예측)
  - lib/history-data.ts (안정적, 보장, 예측)
  - kdy-addon/** (안정적, 보장, 예측 등)
- **총 매치**: 17개 (allowlist에서 17개).
- **CI 제외 결정안**:
  - Allowlist 경로를 CI grep 체크에서 제외.
  - 수동 검토 주기 설정 (월 1회).
  - UI 코드에만 엄격 적용, 기타는 허용.