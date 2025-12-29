# RESULT_PHASE4_STEP4-3_VSCODE.md

## Network 관찰 요약

### 브라우저 Network 탭 관찰 (/analysis/BTC)
- **Supabase 쿼리 요청**: 없음 (현재 trades: []로 설정, Supabase 호출 없음).
- **Binance /api/price 폴링**: 없음 (price 표시용 API 호출 없음, 현재 가격 표시 안 함).
- **Binance klines 호출**: 1회 (분석 입력용, getKlines(symbol, '1d', 500) - 차트 및 분석 데이터).
- **기타 호출**: 없음 (외부 API 최소화).

### SSOT 회귀 테스트 결과
- **Supabase 호출만으로 분석**: 현재 구현에서 Supabase 호출 없음 (trades 빈 배열), signals 기반 분석.
- **Binance currentPrice만 호출**: currentPrice 호출 없음, klines만 호출.
- **회귀/이슈**: Supabase 통합 미흡, Binance klines 분석 입력으로 사용 중 (SSOT 위반 가능성).

## grep 결과

### 검색어: 손실 없음|안정적|보장|예측|AI 예측
- **총 매치**: 17개 (0 아님, validator 규칙 있지만 코드 잔존).
- **손실 없음**: 0 매치.
- **안정적**: 3 매치 (history-data.ts, kdy-addon).
- **보장**: 5 매치 (translations.ts "보장하지 않습니다" - 적절, validator 규칙, kdy-addon).
- **예측**: 8 매치 (scripts, history-data, validator 규칙, kdy-addon).
- **AI 예측**: 1 매치 (scripts/verify_explanation.ts).

### 0 매치 아님 이유
- Validator에 교체 규칙 있지만, 원본 코드에 표현 잔존.
- UI 코드 외부 (kdy-addon, history) 포함.

## 회귀/이슈
- **SSOT 회귀**: Supabase 통합 부족, Binance 데이터 직접 사용.
- **금지표현**: 0 아님, validator 적용 필요.
- **재현 절차**: /analysis 로드, Network 탭 확인, grep 실행.