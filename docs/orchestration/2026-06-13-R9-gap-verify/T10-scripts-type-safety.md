# R9 / T10 — scripts 디렉토리 타입 안전성 (any 제거)

> 일꾼용 자기완결 통합 프롬프트 (SOT). 이 문서 1개만 읽고 작업을 완수할 수 있도록 작성됨.
> 라운드: **R9 (gap-verify)** · 역할: **T10 / 10** · 도메인: TypeScript 타입 안전성

---

## 1. 컨텍스트

- **프로젝트**: 코인·주식 정보 공유 커뮤니티 웹 애플리케이션 (Next.js 16 App Router, Turbopack, TypeScript **Strict Mode**, Tailwind v4, Supabase)
- **루트**: `G:\11_dev\260601 코인 차트분석`
- **라운드 목적 (gap-verify)**: 코드베이스에 남은 품질 갭을 식별·검증·제거. T10은 그중 **`scripts/` 디렉토리의 `any` 타입 제거**를 전담한다.
- **배경 (실측)**: 코드베이스 전체 `any` 43건 중 **`scripts/`에 23건(약 53%)** 집중. 패턴 분포는 다음과 같다.
  - `catch (error: any)` 약 13건 (daily_cron, healthcheck, preflight, weekly_cron, release_quality_gate 등)
  - 콜백 시그니처 `any` 파라미터 (alert_engine 등)
  - `result?: any` (batch_analysis), `candles: any[]` (debug_analysis)
- **핵심 원칙**: 이번 작업은 **타입 주석만 변경**한다. 런타임 동작은 **절대 불변**이어야 한다.

## 2. 공통 SOT (읽기 전용 — 수정 금지)

작업 전 반드시 먼저 읽고 추측 없이 따른다.

- `CLAUDE.md` — 프로젝트 규칙·기술 스택·SSOT 규칙
- `tsconfig.json` — strict 옵션 확인 (`strict: true`, `noImplicitAny` 등)
- `docs/rules/*.md` — 코딩/모듈화 규칙
- 타입 재사용 참조 (읽기만): `types/` 디렉토리, `lib/` 내 기존 타입, `docs/references/_TYPE_REFERENCE.md`

> 위 파일들은 **참조용**이다. T10 쓰기 천장(아래 6절)을 벗어나 수정하지 않는다.

## 3. 공통 의무

- 주석·커밋 메시지는 **한국어**.
- `.env`, `.env.local`, `nul` 파일 **커밋 금지**.
- **SSOT 교차 import 금지**: crypto는 `lib/supabase/crypto.ts`, stock은 `lib/supabase/stock.ts` 단일 진실 공급원. 교차 import 추가 금지 (기존 코드 유지).
- 억지 단언(`as any`) 추가 **금지**, `@ts-ignore` / `@ts-expect-error` 추가 **금지**.
- 기존 코드 스타일(들여쓰기·따옴표·세미콜론)을 그대로 따른다.

## 4. 작업 목표

**`scripts/` 디렉토리에서 `any` 타입을 제거하여 타입 안전성을 확보한다. (런타임 동작 불변, 타입 주석만 변경)**

작업 항목:

1. **`catch (error: any)` → `catch (error: unknown)` + 타입 가드**
   - 표준 패턴: `error instanceof Error ? error.message : String(error)`
   - 대상(예시): `scripts/daily_cron.ts`, `scripts/healthcheck.ts`, `scripts/preflight.ts`, `scripts/weekly_cron.ts`, `scripts/release_quality_gate.ts` 등 `catch (error: any)`가 있는 모든 스크립트
   - `error.message` / `error.stack` / `error.code` 등에 직접 접근하던 코드는 가드 또는 `unknown` 좁히기로 안전하게 변환

2. **`scripts/alert_engine.ts`**: condition / message 콜백의 `any` 파라미터 → 구체 타입
   - 콜백이 받는 실제 데이터 형태를 호출부에서 역추적하여 적절한 인터페이스/타입으로 지정 (불명확하면 `types/`·`lib/` 기존 타입 재사용)

3. **`scripts/batch_analysis.ts`** (`result?: any`) → 분석 결과 타입으로 (기존 분석 반환 타입 재사용)

4. **`scripts/debug_analysis.ts`** (`candles: any[]`) → 캔들 타입 배열로 (`types/`·`lib/`의 기존 Candle/OHLCV 류 타입 재사용)

5. 그 외 `scripts/` 내 잔여 `any`(콜백 시그니처, 임시 변수 등)도 동일 원칙으로 정리.

**처리 원칙**:
- 적절한 구체 타입이 명확하면 그것을 사용 (기존 `types/`·`lib/` 타입 **재사용** 우선, 신규 타입 남발 금지).
- 적절한 타입이 **불명확하면 `unknown` + 타입 가드** 사용.
- **억지 단언(`as any`) 금지**, **`@ts-ignore` 추가 금지**.

## 5. 도구 권장

- **Grep**: `: any`, `catch (error: any)`, `result?: any`, `candles: any` 패턴으로 잔여 스캔 (output_mode `count`로 전후 비교)
- **Read**: 각 스크립트 + 재사용할 `types/`·`lib/` 타입 정의 확인
- **Edit**: 타입 주석만 정밀 치환 (replace_all은 동일 패턴 다건일 때만 신중히)
- **Bash/PowerShell**: `npx tsc --noEmit` 검증, 가능 시 스크립트 dry-run

## 6. 의존성 / 쓰기 천장

- **쓰기 천장**: `scripts/` (전체). 이 디렉토리 **밖의 파일은 절대 수정 금지**.
- `lib/`·`types/`·`docs/references/`는 **읽기만** (타입 재사용 참조용).
- 선행 의존성 없음 — T10은 독립 작업. 다른 역할(T01~T09)과 파일 충돌 없음 (scripts 전용 천장).
- 산출 handover만 `docs/handover/`에 작성 (아래 8절).

## 7. 검증 (완료 전 필수)

1. **`npx tsc --noEmit`** → 오류 **0 유지** (작업 전 0이면 작업 후도 0이어야 함). 신규 타입 오류가 나오면 그 스크립트를 다시 좁힌다.
2. **잔여 카운트**: `grep -rn ": any" scripts/` 실행하여 작업 전(약 23건) 대비 잔여 건수 기록. 목표는 0건 (정당한 사유로 남기는 경우 handover에 명시).
3. **dry-run (가능 시)**: 부수효과 없는 스크립트 1~2개 실행하여 런타임 동작 불변 확인 (예: healthcheck, preflight의 read-only 경로). 외부 API 키·DB 쓰기를 유발하는 스크립트는 실행하지 않는다.
4. ESLint가 있으면 `npx eslint scripts/` 로 `no-restricted-imports`·`no-explicit-any` 위반 없음 확인.

## 8. 완료 신호

- 산출물: `docs/handover/2026-06-13-R9-T10-scripts-type-safety.md`
- handover 필수 포함:
  - `any` 제거 **전/후 카운트** (파일별 표, 총합)
  - 파일별 변경 요약 (어떤 패턴을 어떤 타입으로 바꿨는지)
  - `unknown`+가드로 남긴 케이스 / 부득이하게 남긴 `any`(있다면 사유)
  - 검증 결과: `tsc --noEmit` 0 확인, dry-run 결과
- 지휘자에게 보고할 한 줄 요약 포함.

## 9. 내부 병렬 전략

- **권장 모드: mode 3 (worktree) 또는 mode 5 (Workflow)**
- `scripts/` 내 약 9개 핵심 파일(daily_cron, weekly_cron, healthcheck, preflight, release_quality_gate, alert_engine, batch_analysis, debug_analysis, + 잔여 seed/report 류)을 **독립 슬라이스**로 병렬 처리.
- **파일 충돌 방지를 위해 worktree 격리** 권장 — 각 슬라이스가 서로 다른 파일만 만지도록 분배.
- 모든 슬라이스 쓰기 천장은 동일하게 `scripts/`.
- 병합 후 단일 `tsc --noEmit`로 통합 검증.

---

## 안티패턴 (하지 말 것)

- ❌ `catch (error: any)`를 `catch (error)`로만 바꾸고 방치 (strict에서 `unknown`이 되어 `.message` 접근 시 타입 오류 발생) → 반드시 가드 추가.
- ❌ 타입 오류 회피용 `as any` / `as unknown as X` 억지 단언 추가.
- ❌ `@ts-ignore` / `@ts-expect-error` 주석 추가.
- ❌ 런타임 로직 변경 (조건문·반환값·부수효과 수정). **타입 주석만** 건드린다.
- ❌ `scripts/` 밖 파일(`lib/`, `types/`, app 등) 수정. 타입이 부족해도 그쪽을 고치지 말고 `unknown`+가드로 처리.
- ❌ SSOT 교차 import(crypto↔stock) 신규 추가.
- ❌ 신규 타입 파일 남발 — 기존 `types/`·`lib/` 타입 재사용 우선.
- ❌ 외부 API 호출·DB 쓰기를 유발하는 스크립트를 무분별하게 dry-run 실행.
