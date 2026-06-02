# T01 — `scripts/` any 정리 (엔진류 4파일 / 22건)

## 1. 🚨 착수 전 게이트 (환각 차단 — 반드시 먼저, 통과 못 하면 중단)

> 이 라운드는 **R15-T04 환각 사고**(이 프로젝트에 없는 `scripts/batch/`·`scripts/cron/` 등 유령 디렉토리를 대상으로 허위 작업)의 재수행이다. 같은 실수를 막기 위한 게이트:

```powershell
# (a) scripts/ 는 평면 구조다. 하위 디렉토리는 fixtures/·smoke/ 둘뿐임을 자기 눈으로 확인.
Get-ChildItem scripts -Directory | Select-Object Name
#   → fixtures, smoke 만 나와야 정상. batch/cron/diagnostics/seed/healthcheck 같은 게 보이면
#     그건 네 환각이다. 즉시 중단하고 handover에 "환각 감지·중단" 기록.

# (b) 본 작업 대상 4파일이 실존하는지 확인 (전부 True 여야 함)
'scripts/alert_engine.ts','scripts/batch_orchestrator.ts','scripts/batch_analysis.ts','scripts/preflight.ts' | ForEach-Object { "$_  $(Test-Path $_)" }
```

**대상 4파일을 각각 `Read`로 직접 열어 실제 라인을 본 뒤에만 `Edit`한다. 보지 않은 파일 수정 절대 금지.**

## 2. 컨텍스트

- 프로젝트: Crypto Chart Analysis (코인 차트 분석)
- 본 터미널 역할: **T01 / 3** (R16 type-cleanup, Wave 1 독립)
- 작업 디렉토리(쓰기 허용): **아래 명시된 scripts 4파일만**
  - `scripts/alert_engine.ts`
  - `scripts/batch_orchestrator.ts`
  - `scripts/batch_analysis.ts`
  - `scripts/preflight.ts`
- **다른 일꾼**: T02가 `scripts/`의 **나머지 12파일**을 동시 작업 중. 위 4파일 외 scripts 파일은 절대 건드리지 마라(격리 충돌).

## 3. 공통 SOT (읽기 전용)

- `CLAUDE.md`(루트) — 프로젝트 규약(한국어 주석/커밋)
- `types/` 하위 — 기존 타입 재사용 시 **import만**(쓰기 금지)
- `lib/` 하위 — 기존 타입/함수 재사용 시 **import만**(쓰기 금지)

## 4. 작업 목표

대상 4파일의 `any` 22건을 구체 타입으로 점진 교체. 분포(착수 후 grep로 재확인):
```
scripts/alert_engine.ts          8건
scripts/batch_orchestrator.ts    6건
scripts/batch_analysis.ts        4건
scripts/preflight.ts             4건
```

각 `any`에 대해:
1. **명백한 경우**(parseFloat 결과·알려진 객체 shape·배열 요소 타입·기존 `types/`·`lib/` 타입) → 구체 타입.
2. **외부 fetch/JSON·Supabase row** → 최소 인터페이스 또는 `unknown` + 좁히기(narrowing). 기존 `lib/supabase/crypto.ts`·`types/` 타입이 맞으면 import 재사용.
3. **불명확** → `any` 유지 + `// eslint-disable-next-line @typescript-eslint/no-explicit-any` + **사유 주석**(한국어). 보류는 정직, 가짜 타입은 금지.

## 5. 작업 원칙 (중요)

- **동작(런타임 결과)은 절대 바꾸지 않는다.** 타입 표면만 정리.
- **새 공유 타입 파일 신설 금지**(T02와 충돌 회피). 필요한 타입은 해당 파일 내 로컬 `interface`/`type`로 선언하거나 기존 것을 import.
- 한 파일이라도 `tsc` 에러를 새로 만들면 그 파일은 **원복**하고 handover에 "보류" 기록.

## 6. 의존성

- **독립** (Wave 1). 위 4파일 외 수정 금지(`types/`·`lib/`는 읽기전용 import만).

## 7. 검증 (자가 — handover에 실제 출력 첨부 필수)

```powershell
# 1) 대상 4파일 any 잔존 건수 (착수 전 22 → 감소 확인. 0이 목표는 아님, 정직 보고)
Select-String -Path scripts/alert_engine.ts,scripts/batch_orchestrator.ts,scripts/batch_analysis.ts,scripts/preflight.ts -Pattern ":\s*any\b|as any|<any>|any\[\]" | Measure-Object | Select-Object -ExpandProperty Count

# 2) 타입체크 — 반드시 EXIT 0
npx tsc --noEmit

# 3) eslint (대상 4파일)
npx eslint scripts/alert_engine.ts scripts/batch_orchestrator.ts scripts/batch_analysis.ts scripts/preflight.ts --max-warnings=9999

# 4) 변경 증거 (환각 차단 — 이 출력을 handover에 그대로 붙여라)
git diff --stat scripts/alert_engine.ts scripts/batch_orchestrator.ts scripts/batch_analysis.ts scripts/preflight.ts
```

## 8. 완료 신호

`docs/handover/2026-06-02-R16-T01-scripts-any-engines.md` 작성:
- 착수 전/후 any 건수(파일별), 파일별 처리 요약
- **보류한 any와 사유**(있으면)
- `npx tsc --noEmit` EXIT 0 확인
- **`git diff --stat` 실제 출력 붙여넣기**(변경 증거 — 없으면 무효)
- "전건 제거가 아니라 정직한 점진 정리"가 목표임을 명시

## 안티패턴

- ❌ **유령 경로 추정**(`scripts/batch/` 등 — R15-T04 재발). SOT 명시 4파일만.
- ❌ T02 영역(scripts 나머지 12파일) 수정 — 격리 위반.
- ❌ `types/`·`lib/` 쓰기(import만).
- ❌ 새 공유 타입 파일 신설(T02 충돌).
- ❌ 동작 변경 / tsc 에러 잔존 / 가짜 타입 단정.
- ❌ `git diff --stat` 없이 완료 보고(환각 차단 핵심) / handover 누락 / 영어 작성.
