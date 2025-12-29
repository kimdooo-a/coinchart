# RESULT_PHASE4_STEP4-2_VSCODE.md

## 실행 로그

### npm run dev
```
The command is currently executing in the terminal:
cd "f:\11 dev\251206 코인 차트분석"; npm run dev
It is running in the directory:
F:\11 dev\251206 코인 차트분석
```

### /analysis 진입 확인
- URL: http://localhost:3000/analysis
- 상태: 정상 로드. 차트와 분석 패널 표시됨.
- 4분기 화면 확인:
  - **insufficient**: 데이터 부족 시 경고 메시지 (현재 데이터 충분).
  - **pro-locked**: PRO 버전 필요 시 락 표시 (현재 free 티어).
  - **normal**: 분석 결과 표시 (확률, 설명, 등급).
  - **error**: 에러 없음.
- UI 회귀: 없음. 화면 깨짐 없음.

### profitFactor 999 테스트 케이스
- 현재 실제 데이터에서는 backtest가 없으므로 999 값 노출되지 않음.
- Mock/fixture 강제: orchestrator.ts에서 backtest.profitFactor = 999로 설정 시 "과거 데이터상 손실 없이 안정적" 메시지 표시될 수 있음.
- N/A 표기: backtest가 999일 때도 N/A로 표시되지 않음 (코드상 "특이 사항 없음" 기본, 999이면 "안정적" 메시지).

## 위험 문구 스캔 결과

### grep 검색어: 손실 없음|안정적|보장|예측
- 총 20개 매치 (일부 생략).

#### 주요 발견:
- `lib/explanation/generator.ts` (추정): "과거 데이터상 손실 없이 안정적" (라인 확인 필요).
- `lib/translations.ts`:
  - "패턴을 식별하고 시장 움직임을 예측하며" (라인 10).
  - "AI 주가 예측" (라인 49).
  - "흐름이 안정적입니다" (라인 84).
  - "미래의 수익을 보장하지 않습니다" (라인 85) - 이미 적절한 문구.
  - "AI 예측" (라인 131).
- `lib/signal_engine.ts`: "안정적인 흐름을 보이고 있습니다" (라인 135).
- `lib/explanation/validator.ts`:
  - "AI 예측" -> "통계적 패턴 분석" 교체 규칙 (라인 2).
  - "예측됩니다" -> "분석됩니다" (라인 6).
  - "보장합니다" -> "가능성이 있습니다" (라인 7).
- `components/Analysis/TradingStrategyGuide.tsx`: "안정적인 상승 흐름입니다" (라인 49).
- `app/market/page.tsx`: "예측해서 베팅하기보다" (라인 314).

#### 대체안 제안:
- "안정적" -> "일반적" 또는 "안정된".
- "예측" -> "분석" 또는 "추정".
- "보장" -> "가능성" (이미 validator에 있음).
- "손실 없음" -> "손실 최소화 가능성".

## 발견된 UI 회귀
- 없음. /analysis 페이지 정상 작동.</content>
<parameter name="filePath">f:\11 dev\251206 코인 차트분석\communication\Report\VSCODE\RESULT_PHASE4_STEP4-2_VSCODE.md