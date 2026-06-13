# T01 — 분석/확률/백테스트 엔진 단위 테스트 (R9 gap-verify)

> 본 .md는 **일꾼 터미널**이 새 Claude Code 세션의 첫 메시지로 정독·실행하는 **자기완결 통합 프롬프트**다.
> 너는 R9 라운드 **T01 / 10** 일꾼이다. 코드 엔진은 **수정하지 말고**, 신규 **Vitest 단위 테스트**만 작성한다.

---

## 1. 컨텍스트

- **프로젝트**: 코인·주식 정보 공유 커뮤니티 (Next.js 16 App Router, TypeScript Strict, Tailwind v4, Supabase, Vitest + Playwright)
- **작업 루트**: `G:\11_dev\260601 코인 차트분석`
- **라운드**: R9 (gap-verify) — R1~R8 마감(빌드 green) 이후 "부족한 모든 내용"을 포괄 검증·보강하는 라운드
- **역할**: **T01 / 10** (Wave 1, 독립 작업 — 다른 터미널과 의존성 없음)
- **문제**: 핵심 분석 엔진 5종(`lib/fractal_engine.ts`, `lib/signal_engine.ts`, `lib/analysis.ts`, `lib/probability/engine.ts`, `lib/backtest/engine.ts`)의 **단위 테스트 커버리지가 0%**다. 회귀 안전망이 없어 R9에서 신규 작성한다.
- **목표 한 줄**: 위 5개 엔진의 핵심 함수·엣지케이스를 커버하는 Vitest 테스트를 `__tests__/lib/` 하위에 신규 작성하고, `npx vitest run __tests__/lib` + `npx tsc --noEmit` green 달성.

---

## 2. 공통 SOT (읽기 전용 — 절대 수정 금지)

작업 전 **반드시 정독**한다. 추측 금지.

- `CLAUDE.md` — 프로젝트 개요·핵심 모듈·SSOT 규칙
- `docs/status/current.md` — 현재 상태
- `docs/references/_TYPE_REFERENCE.md` — `CandleData`, `Signal`, `AnalysisResult`, `EngineInput`, `ProbabilityResult`, `Trade` 등 타입 인덱스 (테스트 픽스처·import 타입 확인용)
- `docs/rules/*.md` — 개발 규칙
- 라운드 인덱스: `docs/orchestration/2026-06-13-R9-gap-verify/_INDEX.md`

**대상 엔진 소스도 읽기 전용**으로 정독한다 (시그니처·반환형·엣지 경로 파악용, 수정 금지):
`lib/fractal_engine.ts`, `lib/signal_engine.ts`, `lib/analysis.ts`, `lib/probability/engine.ts`, `lib/backtest/engine.ts`.

---

## 3. 공통 의무 (전 터미널 공통)

- 주석·테스트 설명(`describe`/`it`) **한국어**
- `.env`·`.env.local`·`nul` 커밋 금지
- **SSOT 규칙**: `lib/supabase/crypto.ts` ↔ `lib/supabase/stock.ts` 교차 import 금지 (테스트에서도 한쪽만 import)
- **쓰기 천장**: `__tests__/lib/` **밖에는 쓰지 않는다** (PreToolUse `dispatch-write-guard` hook이 exit 2로 차단). 엔진 소스·레퍼런스·current.md 수정 금지.
- 코드(엔진) 수정 금지 — **실제 엔진 버그를 발견하면 고치지 말고 handover에 보고만** 한다.

---

## 4. 작업 목표 (Phase별 구체 항목)

### Phase 0 — 정독·파악 (10분)
- §2 공통 SOT + 5개 엔진 소스 정독, 각 함수 시그니처·반환형 확인
- 기존 테스트 패턴 학습: `__tests__/lib/indicators.test.ts`, `__tests__/lib/news-classifier.test.ts`
  (`import { describe, it, expect } from 'vitest'`, `@/lib/...` 절대 import, 픽스처 배열, `toBeCloseTo` 수치 비교)

### Phase 1 — 5개 테스트 파일 신규 작성 (병렬 가능 — §9 참조)

작성 파일 (모두 `__tests__/lib/` 하위, `probability/`·`backtest/` 서브폴더 생성):

1. **`__tests__/lib/fractal_engine.test.ts`** ← `lib/fractal_engine.ts` (167줄)
   - `analyzeFractalPattern()` (export, async): candle 입력 → 패턴 매칭 결과
   - 내부 헬퍼 `calculateCorrelation()`, `normalizePattern()`이 **export되지 않았으면** `analyzeFractalPattern()`를 통해 간접 검증 (또는 export 여부 소스 확인 후 결정)
   - **엣지**: 데이터 부족(빈 배열·최소 길이 미만), 상관계수 경계값(-1~1 범위 clamp), 동일값 시퀀스(분모 0 → NaN/Infinity 방어)

2. **`__tests__/lib/signal_engine.test.ts`** ← `lib/signal_engine.ts` (149줄)
   - `scanMarket()` (export, async): RSI 과매수/과매도·펌프덤프 신호 생성
   - **`fetchCandles()`는 `vi.mock`으로 모킹** — 네트워크 호출 금지. 결정론적 candle 픽스처를 주입해 신호 종류·임계 동작 검증
   - **엣지**: 신호 없는 평탄 구간, 급등(펌프)·급락(덤프) 구간

3. **`__tests__/lib/analysis.test.ts`** ← `lib/analysis.ts` (508줄)
   - `analyzeMarket(candles, options?)` (export): candle 배열 → `AnalysisResult` 종합
   - 반환 객체 핵심 필드 존재·타입 검증 (시장상태 Trend/Range 분류, 지표 묶음)
   - **엣지**: 최소 candle 수 미만, 상승추세/하락추세/횡보 각 픽스처

4. **`__tests__/lib/probability/engine.test.ts`** ← `lib/probability/engine.ts` (95줄)
   - `calculateProbability(input)` (export): 신호조합·가중치·MTF 멀티플라이어 적용
   - **확률은 반드시 0~1로 clamp**됨을 검증 (`>=0 && <=1`)
   - **엣지**: 신호 0개, 신호 전부 동일방향(최대 확률), 상충 신호, MTF 멀티플라이어 경계

5. **`__tests__/lib/backtest/engine.test.ts`** ← `lib/backtest/engine.ts` (149줄)
   - `generateHistoricalTrades(candles)` (export): candle → `Trade[]`
   - `analyzeRollingWindow(trades)` (export): 롤링 윈도우 메트릭
   - 메트릭 계산 검증: 총수익, MDD(최대낙폭), 승률 (수동 계산 가능한 작은 픽스처로 `toBeCloseTo`)
   - **엣지**: 거래 0건(승률 0·MDD 0), 전승·전패

### Phase 2 — 자체 검증·정리
- §7 검증 명령 전체 green 확인
- 발견한 엔진 버그·미흡 시그니처가 있으면 handover "발견 사항"에 기록

### Phase 3 — handover 작성 (§8)

---

## 5. 도구 권장

- **Read**: 엔진 소스·기존 테스트 패턴·`_TYPE_REFERENCE.md` 정독
- **Grep**: 함수 export 여부·반환 타입·`vi.mock` 대상(`fetchCandles`) 위치 확인
- **Write/Edit**: `__tests__/lib/` 하위 테스트 파일 작성
- **Bash/PowerShell**: §7 검증 명령 실행
- **Agent (kdyswarm Workflow)**: §9 내부 병렬 팬아웃

---

## 6. 의존성

- **독립** (Wave 1). 다른 T0N 터미널과 파일 충돌 없음 — 천장 `__tests__/lib/`는 T01 전용.
- 단, **T02도 `__tests__/lib/community/` 하위**를 쓴다. T01은 `__tests__/lib/` **직속 5파일 + `probability/`·`backtest/` 서브폴더만** 다루고 `community/` 폴더는 절대 건드리지 않는다.
- 선행 작업 없음 — 즉시 시작 가능.

---

## 7. 검증 (PowerShell + bash)

**PowerShell**:
```powershell
npx vitest run __tests__/lib            # T01 테스트만 실행 (전부 pass 목표)
npx tsc --noEmit                        # 타입 에러 0
```

**bash** (Git Bash):
```bash
cd "G:/11_dev/260601 코인 차트분석"
npx vitest run __tests__/lib && echo "VITEST_OK"
npx tsc --noEmit && echo "TSC_OK"
# 신규 5파일 존재 확인
ls __tests__/lib/fractal_engine.test.ts __tests__/lib/signal_engine.test.ts __tests__/lib/analysis.test.ts __tests__/lib/probability/engine.test.ts __tests__/lib/backtest/engine.test.ts
```

**합격 기준**: `npx vitest run __tests__/lib` 전 테스트 pass, `npx tsc --noEmit` 에러 0, 5개 파일 모두 존재. 모킹 누락으로 인한 실제 네트워크 호출이 없어야 한다(테스트가 오프라인에서 결정론적으로 통과).

---

## 8. 완료 신호

- 산출: **`docs/handover/2026-06-13-R9-T01-analysis-engine-tests.md`** (1개)
- 포함 내용:
  - 작성 파일 5개 목록 + 각 파일 테스트 케이스 수
  - 검증 결과(§7 명령 출력 요약: vitest pass 수 / tsc 결과)
  - **발견 사항**: 엔진 버그·미흡 시그니처(예: clamp 누락, NaN 미방어)를 수정하지 않고 보고
  - **내부 병렬 사용 내역**: 사용 모드(5/2)·subagent 수·각 sub 산출·특이사항 (§9)
- 작업 완료 후 cs(세션 종료)는 **하지 않는다** — 통합·마감은 지휘자 터미널이 수행한다.

---

## 9. 내부 병렬 전략

- **권장: mode 5 (Workflow) 또는 mode 2** — 5개 엔진 모듈은 서로 독립이므로 **각 sub-agent가 1엔진 테스트 1파일**을 병렬 작성하는 팬아웃이 최적. Workflow는 **사전 승인됨**.
- **천장 강제**: 모든 sub-agent의 쓰기를 `__tests__/lib/` 하위로 제한. 천장 밖 쓰기 시 hook이 차단(exit 2)된다.
- **분담 예시** (5 sub-agent):
  | sub | 작성 파일 | 모킹 |
  |-----|-----------|------|
  | A | `fractal_engine.test.ts` | 불필요 |
  | B | `signal_engine.test.ts` | `vi.mock('fetchCandles')` 필수 |
  | C | `analysis.test.ts` | 불필요 |
  | D | `probability/engine.test.ts` | 불필요 |
  | E | `backtest/engine.test.ts` | 불필요 |
- **수렴**: 메인이 5파일 회수 후 §7 검증을 **1회 통합 실행**하고 handover 작성. 각 sub는 자기 파일만 vitest로 빠르게 자가검증 권장.
- 병렬 부담 시 직렬 폴백 허용(A→E 순차). 결과물 동일.

---

## 안티패턴 (하지 말 것)

- ❌ **엔진 소스 수정** — 테스트가 안 맞으면 테스트를 고친다. 엔진 버그는 handover 보고만.
- ❌ **`__tests__/lib/` 밖 쓰기** (특히 엔진 소스·레퍼런스·`__tests__/lib/community/`[T02 영역])
- ❌ **실 네트워크 호출** — `signal_engine`의 `fetchCandles()` 등 외부 API는 반드시 `vi.mock`. 모킹 없는 통합 호출 금지.
- ❌ **부동소수 직접 등치** — `expect(x).toBe(0.3)` 대신 `toBeCloseTo` 사용.
- ❌ **NaN/Infinity 엣지 누락** — 데이터 부족·분모 0·빈 배열·전동일값 케이스를 빼먹지 말 것.
- ❌ **export 안 된 내부 함수를 강제 import** — export 여부를 소스로 확인하고, 비공개면 공개 함수 통해 간접 검증.
- ❌ **handover 누락 / 내부 병렬 사용 내역 미기록**.
