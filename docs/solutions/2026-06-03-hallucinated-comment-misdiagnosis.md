---
title: 잘못된(환각) 코드 주석이 오진을 유발 — 동작 진단은 코드 실측으로
date: 2026-06-03
session: 48
tags: [comment-drift, misdiagnosis, daily-candle, batch-analysis, ground-truth, yahoo-finance]
category: pattern
confidence: high
---

## 문제
세션47이 잔존 과제 #3을 "5분봉 288개 기대 vs update-market-data 일봉 적재 구조 미스매치"로
인계했고, 양평 서버도 §5에서 동일하게 "5분봉 부족"으로 진단했다. 이 진단대로라면 해법은
"5분봉 인트라데이 적재 인프라 구축"(스키마 `date`→`time` PK 변경, Binance klines 5m 적재,
분석 timeframe·VWAP 세션 전환, 일봉 기반 차트/페이지 정합성 재검토)이라는 **대규모 작업**이 된다.

진단의 근거는 `scripts/batch_analysis.ts`의 주석이었다:
```ts
const prices = await fetchCryptoMarketPrices(symbol, 288);  // Last 24 hours (5min * 288)
```

## 원인
**주석이 실제 동작과 불일치하는 환각이었다.** 코드를 실측하니 분석 파이프라인 전체가 일관되게
**일봉(daily)을 가정**하고 있었다:

| 근거 | 위치 |
|------|------|
| `market_prices`가 `symbol+date` PK 일봉 테이블 | `update-market-data.ts` `onConflict: 'symbol,date'` |
| `fetchCryptoMarketPrices`가 `date` 컬럼으로 조회·정렬 | `lib/supabase/crypto.ts` `.select('date, ...')` |
| 분석 타임프레임 `'1d'`, VWAP `'daily'` 세션 | `batch_analysis.ts`, `lib/analysis/signals.ts` |

즉 "5min"은 주석에만 존재하는 환각이고, `288`은 그냥 "최근 288 거래일"이었다. 진짜 원인은
타임프레임 불일치가 아니라 **적재 깊이 부족** — `update-market-data`가 Yahoo `range=5d`로
일봉 5봉만 적재해 `generateSignals`의 최소 50봉 요건에 영구 미달한 것뿐이었다.

## 해결
주석이 아닌 코드 실측에 근거해 **최소 침습 해법**을 택했다: 일봉 유지 + 적재 깊이만 확대.
```ts
// scripts/update-market-data.ts — fetchYahooData
// range=5d → range=1y (일봉 ~250봉, generateSignals 50봉 + 지표 워밍업 충분)
const url = `...chart/${symbol}?interval=1d&range=1y`;
```
+ `batch_analysis.ts`의 환각 주석을 "최근 288 거래일(일봉, ~1년)"으로 정정. 스키마·분석 엔진
무변경. 5분봉 전환(대공사)은 불필요했다.

## 교훈
- **인계서·외부 진단·코드 주석이 일치해도 그것이 곧 동작의 근거는 아니다.** 동작을 바꾸는 결정
  전에는 데이터 경로를 코드로 직접 추적하라(테이블 PK, 조회 컬럼, 타임프레임 인자까지).
- 환각 주석 하나가 두 세션과 외부 서버의 진단을 같은 방향으로 오도했다. "정설"이 여러 곳에서
  반복돼도 1차 소스(코드)와 대조하면 비용 큰 오작업을 피할 수 있다.
- 정정한 주석은 다음 사람의 진단을 다시 오도하지 않도록 동작과 일치시킨다.

## 관련 파일
- `scripts/batch_analysis.ts`
- `scripts/update-market-data.ts`
- `lib/supabase/crypto.ts`
- `lib/analysis/signals.ts`
