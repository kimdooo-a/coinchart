# 설계 — alert 'pending' 정리 + 일봉 적재 깊이 확대

> 작성일: 2026-06-03 (세션 48)
> 관련 인계: 세션 47 handover #2(alert status 'pending' 불일치)·#3(5분봉/일봉 적재 구조)
> 성격: 순수 코드 변경 (운영 DB 직접 적용 불요 — 양평 daily-cron이 자동 반영)

## 배경

세션 47에서 PGRST205(batch 3테이블 부재)를 종료하면서, 다음 두 잔존 과제를 인계했다.

- **#2** `alert_engine.shouldSendAlert`가 `.in('status', ['sent', 'pending'])`로 중복 알림을
  조회하지만, `recordAlert`는 status를 `'sent' | 'failed' | 'skipped'`만 insert한다.
  → `'pending'`은 DB에 절대 생성되지 않는 **죽은 조건**이다.
- **#3** `batch_analysis`가 `fetchCryptoMarketPrices(symbol, 288)` "5min × 288"을 기대하나,
  `update-market-data`는 Yahoo `range=5d`로 **일봉 5개**만 적재 → `generateSignals`의
  최소 50봉 요건에 영구 미달 → ADA/AVAX/DOT 외에도 Insufficient data 위험.

## 코드 실측 진단

분석 파이프라인 전체가 **일봉(daily)을 가정**한다. "5min" 주석이 실제 동작과 불일치하는
환각성 주석일 뿐, 설계는 일관되게 일봉이다.

| 근거 | 위치 |
|------|------|
| `market_prices`는 `symbol+date` PK 일봉 테이블 | `update-market-data.ts` upsert `onConflict: 'symbol,date'` |
| `fetchCryptoMarketPrices`가 `date` 컬럼으로 조회 | `lib/supabase/crypto.ts` `.select('date, ...')` |
| 분석 타임프레임 `'1d'`, VWAP `'daily'` 세션 | `batch_analysis.ts` L219, `signals.ts` L190 |
| 최소 50봉 미만 시 빈 신호 | `signals.ts` L52 `candles.length < 50` |

➡️ 진짜 원인은 "5분봉이 필요"가 아니라 **"일봉 기반 분석인데 적재 깊이(5일)가 50봉 최소요건에
미달"**이다. 적재 깊이만 5일→1년으로 늘리면 구조 미스매치가 근본 해소된다.

## 결정

- **#3**: 일봉 유지 + 적재 깊이 확대 (range 5d→1y). 분석 엔진·스키마 무변경.
  - 5분봉 전환(스키마/엔진 대공사)은 YAGNI — 일봉 기반 차트/페이지와의 정합성까지 재검토해야
    하므로 기각.
- **#2**: 코드 정합으로 정리 (죽은 'pending' 조건 제거 + 다중행 안전화).
  - 스키마에 'pending' 의미 부여(비동기 발송 큐)는 `sendAlert`가 stub인 현 단계에서 과잉 — 기각.

## 변경 단위 (4파일)

### ① `scripts/alert_engine.ts` — 중복방지 정확화
`shouldSendAlert`:
- `.in('status', ['sent', 'pending'])` → `.eq('status', 'sent')` (죽은 'pending' 제거)
- `.single()` → `.order('triggered_at', { ascending: false }).limit(1).maybeSingle()`
  - 24h 내 동일 (symbol, alert_id) 'sent' 행이 2건 이상이면 현재 `.single()`이 에러를 던져
    catch의 fail-open으로 **중복 발송**되던 잠재 버그 차단
  - 0건도 `maybeSingle()`은 에러 아닌 `null` 반환 → 정상 송신 경로
- `result.data.sent_at` 참조 유지 (status='sent' 행은 sent_at 항상 존재)

### ② `supabase/migrations/20260603000001_create_batch_tables.sql` — 주석 정합
- L63-64 주석에서 "shouldSendAlert가 'pending'을 필터로 사용(fail-open)" 설명 정정 →
  "status는 sent/failed/skipped만 기록, 중복방지는 sent만 조회" 취지로.
- **SQL 객체(테이블/제약)는 변경하지 않는다.** 이미 운영 DB에 적용된 마이그레이션이며,
  status CHECK는 향후 확장 여지 보존을 위해 계속 미적용. 주석(문서)만 수정.

### ③ `scripts/update-market-data.ts` — 적재 깊이
- `fetchYahooData`의 Yahoo URL `range=5d` → `range=1y` (crypto·stock 공용 함수 1곳)
- L38 주석 "Fetch last 5 days..." → 1년 일봉 취지로 정정
- 일봉 ~250봉 적재 → `generateSignals` 50봉 + 지표 워밍업(ADX/ATR 14, BB 20, S/R 50봉) 충분

### ④ `scripts/batch_analysis.ts` — 환각 주석 정정
- L191 `// Last 24 hours (5min * 288)` → `// 최근 288 거래일(일봉, ~1년)`
- L271 stock `fetchStockPrices(symbol, 288)` 측에 동일 취지 주석 명시

## 데이터/운영 영향

- **운영 DB 직접 적용 없음.** #3는 코드만 변경 → 양평 다음 06:00 cron의 `update-market-data`가
  `range=1y` 일봉을 `upsert`로 자동 백필. #2는 스키마 무변경, 쿼리 로직만 정정.
- handover로 양평에 "다음 cron부터 일봉 ~250봉 적재 + Insufficient 해소" 관측 요청.

## 검증

- `npx tsc --noEmit` exit 0
- `npx eslint scripts/alert_engine.ts scripts/update-market-data.ts scripts/batch_analysis.ts` exit 0
- 기존 vitest 스위트 회귀 (해당 파일 커버리지 점검 후)
- 로직 리뷰: `shouldSendAlert` 체인이 `maybeSingle()`로 0/1/다중행 모두 graceful
- ⚠️ `update-market-data` 로컬 강제 실행은 운영 DB 쓰기라 미수행 — 양평 cron 자동 백필 위임

## 비목표 (YAGNI)

- 5분봉/인트라데이 적재 인프라
- alert 비동기 발송 큐 + pending 상태 머신
- alert_history status CHECK 제약 추가
- `sendAlert` 실제 채널(Discord/Email) 구현
