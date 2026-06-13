# R9 / T05 — Dead Code 검증 후 안전 삭제 (통합 프롬프트 SOT)

> 이 문서는 **자기완결 일꾼 프롬프트**다. 일꾼은 이 파일만 읽고도 작업을 완수할 수 있어야 한다.
> 역할: **T05 / 10** · 라운드: **R9 (gap-verify)** · 도메인: 코드(검증 후 삭제)

---

## 1. 컨텍스트

- **프로젝트**: 코인·주식 정보 공유 커뮤니티 웹앱 (Next.js 16 App Router, TypeScript Strict, Tailwind v4, Supabase)
- **루트**: `G:\11_dev\260601 코인 차트분석`
- **이번 라운드(R9)의 성격**: gap-verify — 이전 라운드들에서 남은 갭을 **검증 기반으로** 마감한다. T05는 그중 **미사용/고아 코드의 안전 삭제** 담당.
- **핵심 원칙**: R9는 "추측 금지, 증거 우선" 라운드다. T05의 모든 삭제는 **import·참조 0건이 grep/Glob로 증명된 경우에만** 수행한다. 애매하면 삭제하지 말고 **보존 + 보고**.
- **왜 T05가 분리되었나**: dead code는 잘못 지우면 빌드/런타임이 깨진다. 그래서 후보를 좁게 한정하고(주로 `lib/` 천장), SSOT·타 일꾼 영역은 손대지 않도록 경계를 명확히 그었다.

## 2. 공통 SOT (읽기 전용 — 절대 수정 금지)

작업 전 아래를 먼저 읽고 시작한다. 추측으로 진행하지 않는다.

- `CLAUDE.md` — 프로젝트 개요·폴더 구조·SSOT 규칙·커밋 규칙
- `docs/references/_COMPONENT_MAP.md` — 컴포넌트/모듈 의존성 맵 (삭제 후보의 사용처 1차 단서)
- `docs/SSOT_SEPARATION_RULES.md` — Crypto/Stock SSOT 분리 규칙 (위반 시 빌드 차단)
- `docs/rules/*.md` — 프로젝트 코딩 규칙 (현재 `docs/rules/community-like-dedup.md` 등)
- (있으면) `docs/MODULE_OWNERSHIP.md` — 모듈 소유권 경계

## 3. 공통 의무

- 주석·커밋 메시지는 **한국어**
- `.env`, `.env.local`, `nul` 파일 **커밋 금지**
- **SSOT 교차 import 금지**: Crypto는 `lib/supabase/crypto.ts`, Stock은 `lib/supabase/stock.ts`만이 단일 진실 공급원. ESLint `no-restricted-imports`가 강제.
- 코드 수정 범위는 아래 "쓰기 천장"을 절대 넘지 않는다.
- 모든 결정(삭제/보존)은 **근거와 함께** handover에 기록한다.

## 4. 작업 목표

미사용/고아 코드를 **검증 후 안전 삭제**한다. 각 삭제는 다음 3단계를 **순서대로** 거친다.

**(a) 증명** → `grep -r` / Glob로 해당 심볼·파일의 import·참조가 **0건**임을 확인 (증거를 handover에 붙여넣기)
**(b) 삭제** → `git rm <파일>` 또는 파일 삭제 / export 단위 제거
**(c) 검증** → `npx tsc --noEmit` + `npm run build` green 확인

### 쓰기 천장

- 쓰기 허용: **`lib/`** 하위 (단 아래 제외 영역 엄수)
- **절대 손대지 말 것**:
  - `lib/supabase/crypto.ts`, `lib/supabase/stock.ts` — **SSOT, 삭제·수정 금지**
  - `lib/community/fng.ts` — **T04 영역**, 본 일꾼 제외
- `components/`, `app/`, `scripts/` 등 `lib/` 밖은 **읽기만** (사용처 확인용). 수정 금지.

### 삭제 후보 (각각 사용처 0건 grep 증거 확보가 선행 조건)

| # | 대상 | 삭제 단위 | 검증 포인트 |
|---|------|-----------|-------------|
| C1 | `lib/logger.ts` | 파일 전체 | `createLogger()` import 0건이면 파일 삭제 |
| C2 | `lib/economic_events.ts` | 파일 전체 | `ECONOMIC_EVENTS` / `EconomicEvent` import 0건 확인. **단** `/calendar`·`/history` 라우트 향후 연계 가능성을 grep으로 점검 — 라우트나 미완성 컴포넌트가 참조 의도를 남겼으면 **보존+보고** |
| C3 | `lib/config/gates.ts` 미사용 export | `getFeatureGates()`, `resetFeatureGatesCache()` 만 제거 | **`getFeatureGatesCached()`는 보존**(사용 함수). 제거 전 두 함수 각각 import 0건 확인. `getFeatureGatesCached`가 내부에서 `getFeatureGates`를 호출하면 **보존** |
| C4 | `lib/analysis/stock/fetchStockSSOT.ts` 미사용 helper | `fetchStockSSOTByDays()`, `fetchStockSSOTLatest()` 만 제거 | **`fetchStockSSOT()`는 보존**(사용 함수). 제거 전 두 helper 각각 import 0건 확인. 동일 파일의 `interface`(StockCandleData 등)는 `fetchStockSSOT`가 쓰므로 보존 |

> 주의: C3/C4는 **파일 삭제가 아니라 export 함수 단위 삭제**다. 보존 대상 함수/타입은 남긴다.

### 보고만 (직접 수정 금지)

- `lib/backtest/`의 `generateHistoricalTrades()` / `analyzeRollingWindow()`가 **컴포넌트 측에서 미사용 import**되어 있다면, 그 import 제거 대상은 `components/Analysis` · `components/Stock` 으로 **T07 영역**이다. 본 일꾼은 **handover에 "이런 미사용 import가 있다"고 보고만** 하고 직접 손대지 않는다. (lib 측 함수 정의 자체는 다른 곳에서 쓰일 수 있으니 삭제하지 않는다.)

## 5. 도구 권장

- **사용처 탐색**: Grep(`output_mode: content`, `-n`)으로 심볼명 전역 검색. 파일 단위는 Glob 병행.
  - 예: `createLogger` / `ECONOMIC_EVENTS` / `getFeatureGates\b` / `fetchStockSSOTByDays` 각각 전역 grep
  - 정규식 경계(`\b`)로 부분일치 오탐 방지. import 문(`from '.*logger'`)도 별도 확인.
- **삭제**: `git rm` 우선(추적 파일). export 단위는 Edit로 해당 함수 블록만 제거.
- **검증**: `npx tsc --noEmit` → `npm run build`. ESLint도 통과해야 한다.
- 재확인: 삭제 후 동일 grep을 한 번 더 돌려 잔존 참조 0건을 못박는다.

## 6. 의존성

- **선행 의존 없음** — T05는 독립 실행 가능. 단 동시 라운드에서:
  - `lib/community/fng.ts`는 **T04**가 만지므로 충돌 회피 위해 **건드리지 않는다**.
  - `components/Analysis·Stock`은 **T07**이 만지므로 T05는 보고만.
- 같은 `lib/` 안에서도 SSOT 두 파일은 누구도 못 만진다(전역 불변식).

## 7. 검증 (완료 전 필수 통과)

1. `npx tsc --noEmit` — 타입 에러 0
2. `npm run build` — 빌드 green
3. (있으면) `npm run lint` — `no-restricted-imports` 등 위반 0
4. 삭제 후보별 **삭제 후 재-grep** 0건 (잔존 참조로 인한 깨짐 없음 증명)
5. SSOT 두 파일(`crypto.ts`/`stock.ts`) 무변경 확인 (`git diff --stat`에 등장하지 않아야 함)

> 위 중 하나라도 실패하면 **해당 삭제를 되돌리고**(git checkout) 보존으로 전환, handover에 사유 기록.

## 8. 완료 신호

- 산출 handover: `docs/handover/2026-06-13-R9-T05-dead-code-cleanup.md`
- handover 필수 포함:
  - **결정 표**: 후보(C1~C4 + 보고 항목)별 `삭제 / 보존 / 보고` 판정 + **근거(grep 결과 요약)**
  - 삭제한 파일·함수 목록과 라인 수
  - 보존한 항목과 보존 사유(향후 연계 가능성 등)
  - 검증 결과(tsc/build/lint green 여부)
  - T07에 넘길 "미사용 import 보고" 항목
- 커밋: 한국어 메시지(예: `chore: R9-T05 미사용 코드 안전 삭제 (logger 등)`). SSOT·`.env`·`nul` 미포함 확인.

## 9. 내부 병렬 (mode 2)

- **mode 2 = 후보별 사용처 탐색을 병렬 팬아웃(read 위주), 삭제 판정은 종합 후 순차.**
- 권장 흐름:
  1. C1~C4 각 심볼의 전역 grep을 **한 번에 병렬**로 발사(읽기 전용 fan-out). Explore 서브에이전트 활용 가능.
  2. 결과를 모아 후보별 0건 여부 판정.
  3. 삭제는 **순차**로(한 건 삭제 → tsc 빠른 확인 → 다음). 동시 삭제로 인한 원인 추적 곤란 방지.
- 천장은 항상 `lib/`. 병렬 read는 전역 가능하나 write는 천장 안에서만.

---

## 안티패턴 (하지 말 것)

- ❌ grep 증거 없이 "안 쓰일 것 같아서" 삭제 — **금지**. 0건 증명이 없으면 보존.
- ❌ `lib/supabase/crypto.ts` / `stock.ts` (SSOT) 수정·삭제 — **절대 금지**.
- ❌ `lib/community/fng.ts`(T04) 또는 `components/Analysis·Stock`(T07) 직접 수정.
- ❌ 파일 단위 삭제로 보존 대상 함수까지 날리기 (C3/C4는 **export 함수 단위** 삭제).
- ❌ `getFeatureGatesCached`·`fetchStockSSOT`·관련 타입 등 **사용 중 심볼** 제거.
- ❌ tsc/build 실패를 무시하고 완료 선언. 실패 시 되돌리고 보존.
- ❌ 후보를 임의로 확장(목록 밖 파일 삭제). 새 후보 발견 시 삭제 말고 handover에 제안만.
- ❌ 여러 삭제를 한꺼번에 묶어 검증 — 원인 추적 불가. 순차 삭제·중간 검증.
