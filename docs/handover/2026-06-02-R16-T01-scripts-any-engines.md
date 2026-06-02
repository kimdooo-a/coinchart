# R16-T01 인수인계 — `scripts/` any 정리 (엔진류 4파일)

- **날짜**: 2026-06-02
- **라운드/터미널**: R16 type-cleanup / T01 (Wave 1 독립)
- **대상(쓰기 허용 4파일)**: `scripts/alert_engine.ts`, `scripts/batch_orchestrator.ts`, `scripts/batch_analysis.ts`, `scripts/preflight.ts`
- **목표**: 위 4파일의 `any` 22건을 **동작 보존**하며 구체 타입으로 점진 교체. 전건 제거가 아니라 **정직한 점진 정리**.

## 0. 착수 전 게이트 통과 (환각 차단)

- `Get-ChildItem scripts -Directory` → **`fixtures`, `smoke`** 둘뿐 확인(유령 디렉토리 없음). R15-T04 환각(`scripts/batch/`·`scripts/cron/` 등) 재발 아님.
- 대상 4파일 전부 `Test-Path = True` 확인 후, 각 파일을 `Read`로 직접 열어 실제 라인을 보고 편집.

## 1. any 건수 (착수 전 → 후)

| 파일 | 착수 전 | 착수 후 | 비고 |
|------|--------:|--------:|------|
| `scripts/alert_engine.ts` | 8 | **0** | 전건 처리 |
| `scripts/batch_orchestrator.ts` | 6 | **0** | 전건 처리 |
| `scripts/batch_analysis.ts` | 4 | **1** | 1건 보류(아래 §3) |
| `scripts/preflight.ts` | 4 | **0** | 전건 처리 |
| **합계** | **22** | **1** | 21건 타입화 / 1건 정직 보류 |

> 측정 패턴: `:\s*any\b|as any|<any>|any\[\]` (라인 단위 카운트)

## 2. 파일별 처리 요약

### `scripts/alert_engine.ts` (8건 처리)
- **`condition`/`message` 콜백 시그니처**의 `current: any, previous?: any` (2라인, line 19·20) → 새 로컬 인터페이스 **`AlertSnapshot`** 도입.
  - `AnalysisRecord.result`는 `AnalysisResult | StockAnalysisResult`이나, 본 코드는 두 결과 타입에 **없는 최상위 `signals`**까지 참조하므로 결과 타입을 직접 붙이면 tsc 에러. → 런타임에서 실제 접근하는 필드만 담은 구조적 최소 타입을 로컬 선언(공유 타입 파일 신설 아님, §5 허용).
  - `AlertSnapshot = { probability: { probability: number }; confidence: { grade: string }; signals?: unknown[] }`.
  - `previous`는 `AlertSnapshot | null` 허용(현재 호출부가 항상 `null` 전달 — TODO 미구현 상태 보존). `message` 본문의 `previous.X` → `previous?.X` 옵셔널 체이닝(런타임 동작 불변: `previous`는 항상 존재하거나 condition이 먼저 차단). `trend_reversal` message의 `previous?.probability?.probability > 50` 비교는 `(... ?? 0) > 50`으로 — undefined→0이며 기존 `undefined > 50 === false`와 결과 동일(`'하락'`).
- **`evaluateConditions(current: any, previous: any, ...)`** (2라인, line 262·263) → `(current: AlertSnapshot, previous: AlertSnapshot | null, ...)`.
- **`catch (error: any)` 4건** (line 203·238·286·371) → `catch (error: unknown)` + `const err = error as { ... }` 캐스팅 후 `err.message`/`err.code` 접근. 캐스팅 방식 채택 이유: 기존이 `error.message`를 직접 접근(error를 객체로 가정)하던 동작을 100% 보존(`instanceof` 분기는 비-Error 입력 시 메시지가 달라져 동작 변경 위험).

### `scripts/batch_orchestrator.ts` (6건 처리)
- **`catch (error: any)` 6건** (daily/weekly 각 STEP2·STEP3·FATAL, line 69·82·96·156·168·181) → `catch (error: unknown)` + `const err = error as { message?: string; stack?: string }`(stack 쓰는 FATAL만 stack 포함). 본문 `error.X` → `err.X`.

### `scripts/batch_analysis.ts` (4건 중 3건 처리, 1건 보류)
- **`catch (error: any)` 3건** (line 229·308·447) → `unknown` + narrowing. line 447은 `recordBatchFailed(batchId, error: string)`에 메시지를 넘기므로 `err.message ?? ''`로 string 보장(정상 Error는 message 존재 → 완전 동일, 비정상만 빈 문자열).
- **`result?: any` 1건은 보류** (§3 참조).

### `scripts/preflight.ts` (4건 처리)
- **`catch (error: any)` 4건** (line 117·143·171·221) → `unknown` + narrowing. line 221은 `err.stack`도 사용.

## 3. 보류한 any (1건) — 정직 보고

**`scripts/batch_analysis.ts` `AnalysisRecord.result?: any`**

- 1차 시도: `result?: ReturnType<typeof performAnalysis> | ReturnType<typeof analyzeStock>` (= `AnalysisResult | StockAnalysisResult`)로 구체화.
- 그 결과 **`scripts/report_generator.ts`(T02 영역, 본 터미널 쓰기 금지)** 에서 `record.result.signals` 직접 접근이 union 타입에 없어 **tsc 에러 3건 신규 발생**:
  ```
  scripts/report_generator.ts(107,24): error TS2339: Property 'signals' does not exist on type 'AnalysisResult | StockAnalysisResult'.
  scripts/report_generator.ts(108,45): error TS2339: ...
  scripts/report_generator.ts(185,35): error TS2339: ...
  ```
- 지침 §5("한 파일이라도 tsc 에러를 새로 만들면 그 파일은 원복하고 보류 기록") + 격리 원칙(T02 영역 수정 금지)에 따라 **구체화 원복, `any` 유지** + `// eslint-disable-next-line @typescript-eslint/no-explicit-any` + 한국어 사유 주석.
- **후속(T02/통합 시)**: report_generator 등 소비처의 `result.signals` 접근을 정리한 뒤 같은 union으로 좁히면 됨(교차 파일 결합 사안).

## 4. 검증 결과

### (1) tsc — **EXIT 0** ✅
```
npx tsc --noEmit  →  EXIT=0
```
> 1차 시도(result union화) 때 report_generator 에러 3건 발생 → 보류 처리 후 재실행하여 EXIT 0 확정.

### (2) eslint (대상 4파일)
```
npx eslint scripts/alert_engine.ts scripts/batch_orchestrator.ts scripts/batch_analysis.ts scripts/preflight.ts --max-warnings=9999
→ EXIT 1 (error 2, warning 1)
```
- 보고된 항목은 **전부 기존(pre-existing) 코드 문제이며 본 작업(any 정리)이 수정한 라인 밖** — `git diff`로 해당 라인 미변경 확인:
  - `batch_analysis.ts(374) prefer-const ('symbols')` — line 367 `let symbols`, 본 작업 미변경.
  - `preflight.ts(159) no-require-imports` — line 157 `require('child_process')`, 본 작업 미변경.
  - `preflight.ts(105) no-unused-vars ('data')` (warning) — 본 작업 미변경.
- any 정리 범위 밖이고 동작 변경/범위 일탈 위험이 있어 **미수정**(별도 정리 대상). 본 작업이 신규 lint 에러를 만들지는 않음.

### (3) git diff --stat (변경 증거 — 실제 출력)
```
 scripts/alert_engine.ts       | 58 +++++++++++++++++++++++++++----------------
 scripts/batch_analysis.ts     | 28 +++++++++++++--------
 scripts/batch_orchestrator.ts | 32 ++++++++++++++----------
 scripts/preflight.ts          | 22 +++++++++-------
 4 files changed, 87 insertions(+), 53 deletions(-)
```

## 5. 원칙 준수 확인

- ✅ **동작(런타임 결과) 보존** — 타입 표면만 정리. 캐스팅/옵셔널 체이닝/`?? 기본값` 모두 정상 경로에서 기존과 동일 결과.
- ✅ **새 공유 타입 파일 신설 없음** — `AlertSnapshot`은 `alert_engine.ts` 내부 로컬 선언.
- ✅ **`types/`·`lib/` 쓰기 없음** — 읽기 전용으로 타입 근거만 확인.
- ✅ **T02 영역(scripts 나머지 12파일) 미수정** — report_generator 결합 충돌은 보류로 회피.
- ✅ **유령 경로 추정 없음** — 게이트 통과, 4파일만 Read 후 편집.
- 🟡 **1건 보류**(batch_analysis `result`) — 가짜 타입 단정 대신 정직 보류.

**결론: 22건 중 21건 타입화, 1건 정직 보류. tsc EXIT 0. 전건 제거가 아닌 정직한 점진 정리 완료.**
