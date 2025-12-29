# DATA_FLOW_QUESTIONS.md

## 1. 데이터 수집 (Data Ingestion)

**Q1. 실시간 캔들 데이터(Live Candle)의 처리 방식은?**
- [ ] (A) **Stream Processing**: WebSocket으로 들어오는 틱(Tick)/캔들(Candle)을 실시간으로 메모리에 업데이트하며 분석한다.
- [ ] (B) **Snapshot Polling**: 클라이언트 요청 시점(On-demand) 또는 일정 주기마다 REST API로 최신 캔들을 조회하여 분석한다.

**Q2. 시장 데이터의 저장(Persistance) 정책은?**
- [ ] (A) **All History**: 수집된 모든 캔들 데이터를 DB에 영구 저장한다 (자체 데이터 웨어하우스 구축).
- [ ] (B) **Rolling Window**: 분석에 필요한 최근 N개(예: 500개)만 유지하거나, 외부 거래소 API를 SSOT로 간주하고 로컬 저장을 최소화한다.

---

## 2. 분석 실행 (Analysis Execution)

**Q3. `performAnalysis` (오케스트레이터)의 실행 시점은?**
- [ ] (A) **On-Demand (Lazy)**: 유저가 페이지에 접속하거나 새로고침할 때마다 실행한다.
- [ ] (B) **Background Worker (Eager)**: 서버 백그라운드에서 주기적(예: 1분/1시간)으로 실행해두고, 유저는 캐시된 결과를 즉시 조회한다.

**Q4. 분석 결과(Grade, Probability)의 캐싱 정책은?**
- [ ] (A) **Real-time Calc**: 캐싱 없이 매 호출마다 최신 값으로 다시 계산한다 (항상 최신, 부하 높음).
- [ ] (B) **TTL Caching**: 계산된 결과를 일정 시간(예: 5분, 1시간) 동안 캐시하고, 해당 기간 내 요청은 동일한 값을 반환한다.

---

## 3. 백테스팅 (Backtesting)

**Q5. 백테스트 대상 데이터의 범위는?**
- [ ] (A) **Closed Candles Only**: 완전히 마감(Close)된 과거 캔들만 포함한다 (정확성 중시).
- [ ] (B) **Include Current**: 현재 진행 중인(Open) 캔들도 포함하여 실시간 변동성을 반영한다 (민감도 중시).

**Q6. 백테스트 실행 위치 및 주기?**
- [ ] (A) **Client-Side**: 브라우저에서 캔들 데이터를 받아 직접 JS로 계산한다 (서버 비용 절감).
- [ ] (B) **Server-Side**: 서버에서 계산 후 결과 요약(Metrics)만 클라이언트로 전송한다 (로직 보안, 일관성).

---

## 4. 주식 vs 코인 도메인 차이 (Domain Specifics)

**Q7. 시장 운영 시간(Market Hours) 처리?**
- [ ] (A) **Crypto Native (24/7)**: 휴장 없이 모든 시간대 데이터를 연속적인 것으로 간주한다.
- [ ] (B) **Session Aware**: 주식 시장(휴장, 장전/장후 시간) 개념을 도입하여, 데이터 끊김(Gap) 처리를 별도 로직으로 수행한다.

**Q8. 티어(Tier)별 데이터 차별화 정책?**
- [ ] (A) **Access Control**: Free 유저는 실시간보다 지연된(Delayed, 15분) 데이터로 분석한다.
- [ ] (B) **Feature Control**: 데이터 자체는 동일하게 최신이지만, 고급 분석 항목(예: 위험도, 상세 전략)만 가린다(Masking).
