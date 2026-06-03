# 인수인계서 — 세션 48 (alert 'pending' 정리 + 일봉 적재 깊이 확대)

> 작성일: 2026-06-03
> 이전 세션: [session47](./2026-06-03-session47-batch-tables-r17.md)
> 저널: [journal-2026-06-03.md](../logs/journal-2026-06-03.md)
> 설계: [2026-06-03-alert-pending-daily-candle-design.md](../superpowers/specs/2026-06-03-alert-pending-daily-candle-design.md)

---

## 작업 요약
세션47이 인계한 잔존 #2(alert status 'pending' 불일치)·#3(5분봉/일봉 적재 구조)를 단독 세션에서
brainstorming→설계doc→구현으로 마감. **순수 코드 변경 4파일**(운영 DB 직접 적용 불요 — 양평 daily-cron이
자동 반영). tsc 0·eslint 0·vitest 27/27.

## 대화 다이제스트

### 토픽 1: 세션 시작 + 양평 inbox 확인
> **사용자**: "이 터미널은 일반 터미널이야 ... 새로운 세션 시작" + 세션47 cs 보고 붙여넣기

`current.md`+세션47 handover+next-dev로 상태 점검. 미해결 3건(①06-04 06:00 cron 관측 ②alert
'pending' ③5분봉/일봉) 확인. AskUserQuestion으로 방향 질의 → 사용자 **"양평 inbox 확인"** 선택.

`ypmsg_coinchart inbox` → **미읽음 0**. DIRECT 방 최근 메시지 = 우리가 보낸 "PGRST205 종료 알림"(06-03
02:31)이며 양평 회신 없음. 양평의 06-03 06:00 실행은 테이블 적용(02:31) 전이라 batch 미착지였을 것이고,
**첫 정상 실행은 06-04 06:00 KST** → 관측 시점 미도래, 추가 송신 불요.

**결론**: ①은 내일까지 대기 → 지금 가능한 #2·#3 진행. 사용자 **"#2, #3"** 선택.

### 토픽 2: 코드 정찰
`alert_engine.ts`·`update-market-data.ts`·`batch_analysis.ts`·마이그레이션·`lib/supabase/crypto.ts`·
`lib/analysis/signals.ts` 직독.

- **#2 진단**: `shouldSendAlert`(L201)가 `.in('status', ['sent','pending'])`로 조회하나
  `recordAlert`(L235)는 status를 `'sent'|'failed'|'skipped'`만 insert → **'pending'은 영구히
  매칭 안 되는 죽은 조건**. 추가로 `.single()`은 24h 내 동일 알림 2건 이상이면 에러→catch fail-open으로
  중복 발송될 잠재 버그.
- **#3 진단**: 분석 파이프라인 전체가 **일봉 가정**(`market_prices` symbol+date PK·
  `fetchCryptoMarketPrices`가 `date` 조회·`timeframe:'1d'`·VWAP `'daily'` 세션·최소 50봉).
  진짜 원인은 `update-market-data`가 Yahoo `range=5d`로 일봉 5봉만 적재 → 50봉 미달. "5min × 288"
  주석이 실동작과 불일치하는 **환각 주석**.

**결론**: #3는 "5분봉 필요"가 아니라 "일봉 적재 깊이 부족". 동작 변경이라 brainstorming으로 방향 확정.

### 토픽 3: brainstorming — 설계 확정
> **사용자**: #3 방향 "A" / #3 세부 "동의" / #2 방안 "A"

- **#3**: A(일봉 유지 + `range=5d`→`1y`, ~250봉). B(5분봉 전환=스키마 `date`→`time` PK·엔진·차트 전부
  재작업)는 YAGNI 기각. 세부: range=1y, limit 288 유지, crypto·stock 동일, 환각 주석 정정.
- **#2**: A(죽은 'pending' 제거 + `.single()`→`maybeSingle().order().limit(1)` 다중행 안전화 +
  마이그/`_SCHEMA` 주석 정합). B(pending 상태머신=비동기 발송 큐)는 `sendAlert`가 stub인 현 단계에서 과잉 기각.

설계 doc `docs/superpowers/specs/2026-06-03-alert-pending-daily-candle-design.md` 작성·자체리뷰 통과.

> **사용자**: "go"

### 토픽 4: 구현 + 검증
4파일 수정(아래 표). 검증: 전역 tsc 0·eslint(3 scripts) 0·vitest 27/27(회귀 0)·`git diff --stat`
4파일 일치(환각 0). 기존 테스트가 이 4파일을 미커버하여 신규 단위테스트는 가성비 낮다고 판단(쿼리 메서드/URL/주석
성격) → tsc/eslint/vitest 회귀 + 로직 리뷰로 검증.

**결론**: 구현 완료. cs 진행.

## 의사결정 요약

| # | 결정 | 선택지 | 선택 이유 |
|---|------|--------|----------|
| 1 | #3 일봉 유지 + 적재 깊이 확대 | A 일봉 range 확대 / B 5분봉 전환 | 분석 엔진 전체가 일봉 가정·"5min" 주석은 환각. range만 1y로 늘리면 근본 해소. B는 스키마/엔진/차트 대공사 YAGNI |
| 2 | #3 range=1y (2y 아님) | 1y / 2y | limit 288에서 2y는 어차피 잘리고 Yahoo 페이로드만 커짐. 1y ~250봉이면 50봉+지표 워밍업 충분 |
| 3 | #2 코드 정합 정리 | A 코드 정리 / B pending 상태머신 | 'pending'은 미래 비동기 큐 흔적이나 sendAlert stub이라 현재 없음. 죽은 조건 제거 + 다중행 안전화가 정확. B는 YAGNI |
| 4 | 운영 DB 직접 적용 안 함 | 지금 적용 / cron 위임 | #3는 양평 cron `upsert`가 자동 백필, #2는 스키마 무변경. 직접 적용 불요 |

## 수정 파일 (4개 + 문서)

| # | 파일 | 변경 내용 | 과제 |
|---|------|-----------|------|
| 1 | `scripts/alert_engine.ts` | `shouldSendAlert`: `.in('status',['sent','pending'])`→`.eq('status','sent')` + `.single()`→`.order('triggered_at',desc).limit(1).maybeSingle()` | #2 |
| 2 | `supabase/migrations/20260603000001_create_batch_tables.sql` | alert_history status 주석 정정(SQL 객체 무변경) | #2 |
| 3 | `scripts/update-market-data.ts` | Yahoo `range=5d`→`range=1y` + 주석 정정 | #3 |
| 4 | `scripts/batch_analysis.ts` | "5min × 288" 환각 주석 → "최근 288 거래일(일봉)" ×2 | #3 |
| 5 | `docs/references/_SCHEMA_REFERENCE.md` | alert_history 설명 stale 정정 | #2 |
| 6 | `docs/superpowers/specs/2026-06-03-...-design.md` | 설계 문서 신규 | - |

## 상세 변경 사항

### 1. alert_engine.ts — 중복방지 정확화
`shouldSendAlert`의 쿼리 체인을 교체:
```
.eq('status', 'sent')                          // 죽은 'pending' 제거
.order('triggered_at', { ascending: false })   // 최신순
.limit(1)                                       // 다중행 방지
.maybeSingle()                                  // 0건=null, 다중행 에러 회피
```
`result.data.sent_at` 참조는 유지(status='sent' 행은 sent_at 항상 존재). catch fail-open 유지.

### 2~4. #3 적재 깊이 + 주석
- `update-market-data.ts` `fetchYahooData`는 crypto·stock 공용 함수이므로 한 곳(`range=1y`) 변경으로 양쪽 적용.
- `batch_analysis.ts` 주석은 동작에 영향 없는 정정(오해 유발 차단).

## 검증 결과
- `npx tsc --noEmit` — **exit 0**
- `npx eslint scripts/alert_engine.ts scripts/update-market-data.ts scripts/batch_analysis.ts` — **exit 0**
- `npx vitest run` — **27/27 passed** (3 files, 회귀 0)
- `git diff --stat` — 4파일(설계 doc untracked), 변경 통계 설계와 일치(환각 0)

## 터치하지 않은 영역
- 분석 엔진(`lib/analysis/*`)·지표(`lib/indicators.ts`)·`generateSignals` — 일봉 가정 그대로 정상 동작
- `market_prices`/`stock_prices` 스키마 — 무변경(일봉 date/time PK 유지)
- `sendAlert` 실제 채널 구현(여전히 stub) — 비목표
- 운영 DB — 직접 적용 없음(양평 cron 자동 반영)

## 알려진 이슈
- 🟡 **2026-06-04 06:00 KST cron 관측 (양평)** — `range=1y` 적용 후 (1) `update-market-data`가
  일봉 ~250봉 적재하는지, (2) ADA/AVAX/DOT 포함 Insufficient data 해소되는지, (3)
  `batch_analysis_results` 저장 성공([CRITICAL] 미발생) 확인. **양평에 관측 요청 송신 권장**(미송신 상태).
- 🟡 5분봉 인트라데이 적재는 **비목표(YAGNI)**로 명시 기각 — 일봉 기반 분석으로 충분.

## 다음 작업 제안
- 양평에 #3 변경(`range=1y`) 통지 + 06-04 cron 관측 요청 메시지 송신.
- 06-04 cron 관측 회신 확인 후 일봉 적재량·Insufficient 해소·batch 저장 검증.
- (관측에서 추가 이슈 없으면) batch/alert 파이프라인 안정화 일단락.

## Compound Knowledge
- [2026-06-03 잘못된(환각) 코드 주석이 오진을 유발 — 코드 실측 우선](../solutions/2026-06-03-hallucinated-comment-misdiagnosis.md)

---
[← handover/_index.md](./_index.md)
