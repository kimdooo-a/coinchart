✅ PROMPT → ALL AGENTS (공통)

목표: “내가 던진 프롬프트 + 너의 결과물”을 매번 자동으로 저장해서, 사용자가 복붙/추적하는 번거로움을 없앤다.

지시:

아래 경로에 폴더 생성
F:\11 dev\251206 코인 차트분석\communication\Report\<AGENT_NAME>\YYYY-MM-DD\

파일 2개를 항상 저장

PROMPT.md : 사용자가 너에게 준 원문 프롬프트 그대로

RESULT.md : 네가 수행한 결과(요약 + 변경파일 목록 + 결정사항 + 다음 액션)

파일 규칙

RESULT.md 맨 위에 “결과 요약(5줄)”

그 다음 “변경한 파일 목록(경로 포함)”

그 다음 “리스크/보류(있으면)”

파일 규칙

RESULT.md 맨 위에 “결과 요약(5줄)”

그 다음 “변경한 파일 목록(경로 포함)”

그 다음 “리스크/보류(있으면)”

마지막 “다음에 할 일(체크리스트)”

---

# [TASK] Phase 3-1 Scaffold & Types

[GLOBAL RULES]
- SSOT: /mnt/data/RESULT.md (Phase 2 Step 4) 내용을 Ground Truth로 삼는다.
- 코드 변경은 Phase 3에서만 진행한다. 설계 변경 금지(필요 시 CHANGELOG+승인 요청).
- "AI 예측" 표현 금지. 반드시 "통계적 패턴 분석"으로 표기 강제.
- Watcher/유료 API 호출 금지. (로컬 계산/기존 데이터만)
- Free/PRO 분기 규칙을 UI/응답 모두에 적용한다.
- 작업마다 Report 작성: communication/Report/Antigravity/YYYY-MM-DD/ 에 PROMPT.md + RESULT.md


[TASK] Phase 3-1 Scaffold & Types
1) 아래 폴더/파일 구조 생성(없으면 생성, 있으면 유지/정리)
- lib/probability/{engine.ts,confidence.ts,regime.ts,weights.ts}
- lib/backtest/{metrics.ts,equity.ts,drawdown.ts,risk.ts,trade.ts}
- lib/explanation/{templates.ts,renderer.ts,validator.ts,generator.ts}
- types/{probability.ts,backtest.ts,explanation.ts}

2) types 정의
- ProbabilityResult, ConfidenceResult, MarketRegime, IndicatorSignal 등
- BacktestMetrics(12개 지표 + status:'ok'|'insufficient')
- ExplanationOutput(Free/PRO 필드 포함)

3) 빌드/린트 오류 0개 만들기
- 아직 로직 미구현이면 TODO/throw 금지
- 최소 더미 구현으로 컴파일 통과 (예: return status:'insufficient')
OUTPUT:
- 변경 파일 목록
- 빌드/린트 결과 로그 요약

---

# [TASK] Phase 3-2 Probability Engine Implementation
SSOT: RESULT.md의 확률 산식/가중치 매트릭스/15-85% clamp 준수

1) market regime 분류 구현
- STRONG_TREND / RANGING / HIGH_VOLATILITY
- 입력: ADX, ATR(또는 변동성 proxy), BB width 등 (프로젝트에 있는 값으로 맵핑)
- 기준이 애매하면 기본값 RANGING, 그리고 reason을 반환

2) weights.ts
- WEIGHT_MATRIX를 코드로 상수화
- 누락 지표는 weight=1.0 기본 처리

3) engine.ts
- indicatorScore: -100~+100 규칙 (SSOT의 예시 방식 따라)
- weightedScore 계산
- normalized → riseProb 변환
- clamp 15~85 적용
- dropProb=100-riseProb
- 반환에 reasoning(주요 기여 지표 top3) 포함

4) 단위 테스트(가능하면) 또는 최소 검증 스크립트
- 극단값 방지(0/100 금지)
- regime별 weight 적용 확인
OUTPUT:
- 구현 상세
- 샘플 입력/출력 예시 3개

---

# [TASK] Phase 3-3 Confidence Implementation
SSOT: 지표합의도(30)+추세정합성(25)+거래량확인(20)+과거정확도(15)+변동성감점(-10)

1) confidence.ts 구현
- signals 배열을 받아 agreementRatio 계산
- adx/di 기반 trendScore
- volume confirm 로직 (프로젝트 existing volume ratio/OBV 등으로 대체 가능)
- historical accuracy: 없으면 0으로 두되 status:'insufficient_history'와 함께 반환
- volatility penalty: ATR 기반 high/extreme 판정

2) 데이터 품질 보정
- sampleSize<30 → ×0.7
- dataAge>60s → ×0.8
- volumeRatio<0.3 → ×0.85
(프로젝트에 dataAge/volumeRatio 없으면 파라미터 optional로 받고 없으면 보정 생략 + reason 남김)

3) scoreToGrade 구현(A,B,C,D,F)
OUTPUT:
- confidence 산출 예시 3개
- 부족 데이터 처리 방식 명시

---

# [TASK] Phase 3-4 Backtest Metrics Implementation
SSOT: /mnt/data/RESULT.md 설계 준수.
1) lib/backtest/metrics.ts "단일 진입점" 완성
- input: trades[] (필수), equityCurve? (선택)
- output: BacktestMetrics { status:'ok'|'insufficient', sampleSize, metrics... }

2) 지표 12개 구현
- Free: WinRate, TotalReturn
- PRO: MDD, Sharpe, Sortino, Calmar, ProfitFactor, RiskReward, Expectancy, MaxConsecutive, RecoveryFactor, DrawdownDuration

3) 최소 데이터/안전장치
- trades < 30 → status:'insufficient'
- Division by zero 방지 (Infinity → 999 or 0)

4) scripts/verify_backtest.ts
- (A) 승/패 섞인 기본
- (B) 손실 0 케이스
- (C) 수익률 변동 0 케이스

OUTPUT (RESULT_PHASE3-4.md):
- 요약(5줄)
- 변경 파일 목록
- verify 3개 입력/출력 스냅샷
- edge case 처리 정책
- 다음 체크리스트

---

# [TASK] Phase 3-5 Explainability System
SSOT: /mnt/data/RESULT.md 설계 준수.
Goal: 관망/분할/손절 3단 구조 설명 생성. 금지표현 자동 정리. Free/Pro 차등.

Implement:
1) lib/explanation/templates.ts
- 3단 구조 템플릿 (Evidence/Risk/Watch)

2) lib/explanation/renderer.ts
- 변수 치환 및 섹션 구성

3) lib/explanation/validator.ts
- AI 예측 -> 통계적 패턴 분석 치환 등 금지어 처리

4) lib/explanation/generator.ts
- Action 결정 규칙 (Grade A/B + Strong Trend -> Partial, etc)
- Free vs Pro 콘텐츠 차등 (백테스트 정보 포함 여부)

5) scripts/verify_explanation.ts
- 3케이스 (PARTIAL/HOLD/STOP_LOSS) 및 금지어 검증

OUTPUT (RESULT_PHASE3-5.md):
- 요약
- 변경 파일
- 3케이스 출력
- 다음 체크리스트
