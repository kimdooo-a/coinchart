# 인수인계 — R16-T02: `scripts/` any 정리 (보조류 12파일 / 23건)

- **일자**: 2026-06-02
- **터미널**: T02 / 3 (R16 type-cleanup, Wave 1 독립)
- **대상**: SOT(`docs/orchestration/2026-06-02-R16-type-cleanup/T02-scripts-any-aux.md`) 명시 12파일의 `any` 23건
- **목표 성격**: 전건 제거가 목적이 아니라 **정직한 점진 타입 정리**. 결과적으로 본 라운드에선 23건 전부를 안전하게 구체화함(억지 단정 없음).

## 1. 착수 전 게이트 (환각 차단) — 통과

- **(a) `scripts/` 하위 디렉토리**: `fixtures`, `smoke` 둘뿐 확인. seed/cron/batch 등 유령 디렉토리 없음 → R15-T04 환각 미재발.
- **(b) 대상 12파일 실존**: 12파일 전부 `True` 확인.
- 12파일을 각각 `Read`로 직접 열어 실제 라인 확인 후에만 `Edit`함. 보지 않은 파일 수정 없음.

## 2. 파일별 처리 요약 (착수 전 → 후 any 건수)

| 파일 | 전 | 후 | 처리 방식 |
|------|----|----|-----------|
| `report_generator.ts` | 3 | 0 | `StateChange.from/to: any` → `string \| number`(지표 값). `catch (error: any)` → `unknown` + `instanceof Error` 좁히기 |
| `seed_prices_v2.ts` | 3 | 0 | 로컬 `interface YahooCandle` 신설(파일 내 선언), `.filter/.map`의 `d: any` → `d: YahooCandle` |
| `update-market-data.ts` | 3 | 0 | 동일 로컬 `YahooCandle` 도입, 3건 `any` → `YahooCandle` |
| `verify_explanation.ts` | 3 | 0 | `types/probability`에서 `MarketRegime`·`ConfidenceGrade` import. `regime: any`→`MarketRegime`, `grade: any`→`ConfidenceGrade`, `'A' as any`→`'A'`(불필요 단언 제거) |
| `healthcheck.ts` | 2 | 0 | `catch (error: any)` 2건 → `unknown` + `instanceof Error` 좁히기(`.message`/`.stack`) |
| `release_quality_gate.ts` | 2 | 0 | `catch (error: any)`→`unknown` + `(error as {stderr?: Buffer\|string})` 좁히기. `catch (e: any)`+`e.toString()`→`unknown`+`String(e)` |
| `seed_bch.ts` | 2 | 0 | Binance kline 튜플 `type BinanceKline = [number, string×5, ...unknown[]]` 로컬 선언. `any[]`/`k: any[]` 제거(map은 추론) |
| `daily_cron.ts` | 1 | 0 | `catch (error: any)` → `unknown` + `instanceof Error` 좁히기 |
| `debug_analysis.ts` | 1 | 0 | `const candles: any[]` → `CandleData[]`(`lib/api/binance` import, analyzeMarket 시그니처 일치) |
| `migrate-blog-content-to-html.ts` | 1 | 0 | `post.content as any` → `as Parameters<typeof generateHTML>[0]`, 불필요해진 `eslint-disable` 주석 제거 |
| `seed_prices.ts` | 1 | 0 | 로컬 `interface YahooPriceRow` 신설, `.filter((p: any))` → `p: YahooPriceRow` |
| `weekly_cron.ts` | 1 | 0 | `catch (error: any)` → `unknown` + `instanceof Error` 좁히기 |
| **합계** | **23** | **0** | |

### 작업 원칙 준수
- **런타임 동작 불변**: 타입 표면만 정리. `catch` 좁히기는 정상 경로(Error throw)에서 `.message` 동일, 비정상 throw 시 `undefined` 대신 `String(error)`로 오히려 개선(로그 메시지 한정, 분기/exit code 불변).
- **새 공유 타입 파일 신설 없음**: `YahooCandle`/`YahooPriceRow`/`BinanceKline`은 전부 **해당 파일 내 로컬 선언**. `MarketRegime`·`ConfidenceGrade`·`CandleData`는 기존 타입 **import만**.
- `types/`·`lib/` 쓰기 없음(읽기/ import만).

## 3. 보류한 any

- **없음.** 23건 전부 구체 타입화. 억지 단정(가짜 타입)으로 처리한 건 없음 — Yahoo/Binance 외부 JSON은 결측 가능성을 반영해 `number | null` 또는 튜플로 표현, 캐치 절은 표준 `unknown` 좁히기 사용.

## 4. 검증 결과

### (1) 대상 12파일 any 잔존 건수: **0** (착수 전 23)
```
패턴 ':\s*any\b|as any|<any>|any\[\]' 매칭 → 전 파일 0건
```

### (2) `npx tsc --noEmit`
- **전체 트리 직접 실행 시 EXIT=2** — 단, **에러 12건 전부 `scripts/alert_engine.ts`(T01 영역)** 에서 발생. 본 터미널 대상 12파일에서는 에러 0건.
- 본 작업트리는 **공유 트리**(kdydispatch soft write-guard, 동시 발사 안전)로, T01의 `alert_engine.ts`·T03의 `app/...` 변경이 이미 워킹트리에 존재함(SOT가 가정한 "T01 변경은 아직 네 워킹트리에 없음"과 실제 상이).
- **격리 검증**: T01의 `alert_engine.ts`만 `git stash` 후 tsc 재실행 → **`TSC_EXIT=0`** (내 12파일 + T03 app 모두 클린). 이후 `git stash pop`으로 T01 변경 무손실 복원 확인.
  ```
  === T01 alert_engine.ts만 임시 stash ===
  Saved working directory and index state WIP on main: 8c7dad0 ...
  === 남은 트리(내 12파일 + T03 app) tsc ===
  TSC_EXIT=0
  === T01 변경 복원 ===
  Dropped refs/stash@{0} (6121f3f2...)
  ```
- 결론: **내 12파일은 tsc EXIT 0 충족**. 글로벌 EXIT=2의 유일 원인은 T01의 in-progress `alert_engine.ts`(possibly-undefined 12건)이며, 이는 격리 영역이라 수정 금지 → T01이 마감.

### (3) `git diff --stat scripts/` 실제 출력
```
 scripts/alert_engine.ts                 | 16 ++++++++++++++--
 scripts/daily_cron.ts                   |  6 +++---
 scripts/debug_analysis.ts               |  3 ++-
 scripts/healthcheck.ts                  | 10 +++++-----
 scripts/migrate-blog-content-to-html.ts |  5 ++---
 scripts/release_quality_gate.ts         | 12 +++++++-----
 scripts/report_generator.ts             |  9 +++++----
 scripts/seed_bch.ts                     |  8 ++++++--
 scripts/seed_prices.ts                  | 14 +++++++++++++-
 scripts/seed_prices_v2.ts               | 17 ++++++++++++++---
 scripts/update-market-data.ts           | 17 ++++++++++++++---
 scripts/verify_explanation.ts           |  8 ++++----
 scripts/weekly_cron.ts                  |  6 +++---
 13 files changed, 92 insertions(+), 39 deletions(-)
```

#### diff 격리 분석 (중요)
- **내 대상 12파일이 정확히 전부** 나타남(daily_cron·debug_analysis·healthcheck·migrate-blog·release_quality_gate·report_generator·seed_bch·seed_prices·seed_prices_v2·update-market-data·verify_explanation·weekly_cron).
- `scripts/alert_engine.ts`(16줄)는 **T01이 공유 트리에 이미 변경한 것**으로, 본 터미널은 이 파일을 `Edit`하지 않음(편집 이력상 단 한 번도 손대지 않음). T01의 나머지 3파일(`batch_orchestrator.ts`·`batch_analysis.ts`·`preflight.ts`)은 diff에 **없음** → 본 작업은 T01 영역을 건드리지 않음(격리 준수).
- 즉 `alert_engine.ts`가 diff에 보이는 것은 "본 터미널의 격리 위반"이 아니라 "공유 작업트리에 선존(先存)한 T01 변경"임.

## 5. 후속/주의

- **커밋 주체**: 공유 트리에 T01·T03 변경이 섞여 있으므로 본 터미널이 단독 커밋하지 않음(이중/혼합 커밋 방지). 통합 커밋은 라운드 마감 지휘자(conductor)가 일꾼 산출물을 회수·통합하여 수행 — 글로벌 규칙(일꾼 cs 생략) 준수.
- 지휘자 통합 시 **T01의 `alert_engine.ts` possibly-undefined 12건이 해소되어야 글로벌 `tsc --noEmit` EXIT 0** 달성. 이는 T01 책임 영역.
