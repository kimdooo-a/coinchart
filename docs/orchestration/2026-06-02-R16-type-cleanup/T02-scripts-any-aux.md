# T02 — `scripts/` any 정리 (보조류 12파일 / 23건)

## 1. 🚨 착수 전 게이트 (환각 차단 — 반드시 먼저, 통과 못 하면 중단)

> 이 라운드는 **R15-T04 환각 사고**(이 프로젝트에 없는 `scripts/batch/`·`scripts/cron/`·`scripts/seed/` 등 유령 디렉토리를 대상으로 허위 작업)의 재수행이다. 같은 실수를 막기 위한 게이트:

```powershell
# (a) scripts/ 는 평면 구조다. 하위 디렉토리는 fixtures/·smoke/ 둘뿐임을 자기 눈으로 확인.
Get-ChildItem scripts -Directory | Select-Object Name
#   → fixtures, smoke 만 나와야 정상. seed/cron/batch 같은 디렉토리가 보이면 그건 네 환각이다.
#     즉시 중단하고 handover에 "환각 감지·중단" 기록.

# (b) 본 작업 대상 12파일이 실존하는지 확인 (전부 True 여야 함)
'scripts/report_generator.ts','scripts/seed_prices_v2.ts','scripts/update-market-data.ts','scripts/verify_explanation.ts','scripts/healthcheck.ts','scripts/release_quality_gate.ts','scripts/seed_bch.ts','scripts/daily_cron.ts','scripts/debug_analysis.ts','scripts/migrate-blog-content-to-html.ts','scripts/seed_prices.ts','scripts/weekly_cron.ts' | ForEach-Object { "$_  $(Test-Path $_)" }
```

**대상 파일을 각각 `Read`로 직접 열어 실제 라인을 본 뒤에만 `Edit`한다. 보지 않은 파일 수정 절대 금지.**

## 2. 컨텍스트

- 프로젝트: Crypto Chart Analysis (코인 차트 분석)
- 본 터미널 역할: **T02 / 3** (R16 type-cleanup, Wave 1 독립)
- 작업 디렉토리(쓰기 허용): **아래 명시된 scripts 12파일만**
  ```
  scripts/report_generator.ts          (3)
  scripts/seed_prices_v2.ts            (3)
  scripts/update-market-data.ts        (3)
  scripts/verify_explanation.ts        (3)
  scripts/healthcheck.ts               (2)
  scripts/release_quality_gate.ts      (2)
  scripts/seed_bch.ts                  (2)
  scripts/daily_cron.ts                (1)
  scripts/debug_analysis.ts            (1)
  scripts/migrate-blog-content-to-html.ts  (1)
  scripts/seed_prices.ts               (1)
  scripts/weekly_cron.ts               (1)
  ```
- **다른 일꾼**: T01이 `scripts/alert_engine.ts`·`batch_orchestrator.ts`·`batch_analysis.ts`·`preflight.ts` **4파일**을 동시 작업 중. **이 4파일은 절대 건드리지 마라**(격리 충돌).

## 3. 공통 SOT (읽기 전용)

- `CLAUDE.md`(루트) — 프로젝트 규약(한국어 주석/커밋)
- `types/`·`lib/` 하위 — 기존 타입 재사용 시 **import만**(쓰기 금지). 특히 `lib/supabase/crypto.ts`(시세 row 타입)·`types/` 가 seed/update 스크립트의 row 타입에 맞을 수 있음.

## 4. 작업 목표

대상 12파일의 `any` 23건을 구체 타입으로 점진 교체. 각 `any`에 대해:
1. **명백한 경우**(parseFloat·알려진 shape·기존 `types/`·`lib/` 타입) → 구체 타입.
2. **외부 fetch/JSON·Supabase row** → 최소 인터페이스 또는 `unknown` + 좁히기. seed/update 계열은 `lib/supabase/crypto.ts`·`types/` row 타입 재사용 우선.
3. **불명확** → `any` 유지 + `// eslint-disable-next-line @typescript-eslint/no-explicit-any` + **사유 주석**(한국어). 보류는 정직.

## 5. 작업 원칙 (중요)

- **동작(런타임 결과)은 절대 바꾸지 않는다.** 타입 표면만 정리.
- **새 공유 타입 파일 신설 금지**(T01과 충돌 회피). 필요한 타입은 해당 파일 내 로컬 선언 또는 기존 것 import.
- 한 파일이라도 `tsc` 에러를 새로 만들면 그 파일은 **원복**하고 handover에 "보류" 기록.

## 6. 의존성

- **독립** (Wave 1). 위 12파일 외 수정 금지(`types/`·`lib/`는 읽기전용 import만, T01의 4파일 금지).

## 7. 검증 (자가 — handover에 실제 출력 첨부 필수)

```powershell
# 1) 대상 12파일 any 잔존 건수 (착수 전 23 → 감소 확인. 0이 목표는 아님, 정직 보고)
Select-String -Path scripts/report_generator.ts,scripts/seed_prices_v2.ts,scripts/update-market-data.ts,scripts/verify_explanation.ts,scripts/healthcheck.ts,scripts/release_quality_gate.ts,scripts/seed_bch.ts,scripts/daily_cron.ts,scripts/debug_analysis.ts,scripts/migrate-blog-content-to-html.ts,scripts/seed_prices.ts,scripts/weekly_cron.ts -Pattern ":\s*any\b|as any|<any>|any\[\]" | Measure-Object | Select-Object -ExpandProperty Count

# 2) 타입체크 — 반드시 EXIT 0
npx tsc --noEmit

# 3) 변경 증거 (환각 차단 — 이 출력을 handover에 그대로 붙여라)
git diff --stat scripts/
#   → T01의 4파일(alert_engine·batch_orchestrator·batch_analysis·preflight)이 네 diff에 섞여있으면
#     격리 위반이다. 본인 12파일만 나와야 정상(T01 변경은 아직 네 워킹트리에 없음).
```

## 8. 완료 신호

`docs/handover/2026-06-02-R16-T02-scripts-any-aux.md` 작성:
- 착수 전/후 any 건수(파일별), 파일별 처리 요약
- **보류한 any와 사유**(있으면)
- `npx tsc --noEmit` EXIT 0 확인
- **`git diff --stat` 실제 출력 붙여넣기**(변경 증거 — 없으면 무효)
- "전건 제거가 아니라 정직한 점진 정리"가 목표임을 명시

## 안티패턴

- ❌ **유령 경로 추정**(`scripts/seed/`·`scripts/cron/` 등 — R15-T04 재발). SOT 명시 12파일만.
- ❌ T01 영역(alert_engine·batch_orchestrator·batch_analysis·preflight) 수정 — 격리 위반.
- ❌ `types/`·`lib/` 쓰기(import만).
- ❌ 새 공유 타입 파일 신설(T01 충돌).
- ❌ 동작 변경 / tsc 에러 잔존 / 가짜 타입 단정.
- ❌ `git diff --stat` 없이 완료 보고(환각 차단 핵심) / handover 누락 / 영어 작성.
