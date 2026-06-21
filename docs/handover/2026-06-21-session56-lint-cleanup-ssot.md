# 인수인계서 — 세션 56 (eslint baseline 정리 + SSOT 규칙↔문서 정합)

> 작성일: 2026-06-21
> 이전 세션: [session55](./2026-06-21-session55-rc-rd-audit-closure.md)

---

## 작업 요약
직전 터미널의 세션 55 cs(audit R-A~R-D 전량 마감) 완료 후, 이 터미널이 이어받아 **코드 품질 정리 트랙**을 완주했다. `npm run lint` error를 **52 → 8**로 줄였다. 기계적 28건은 kdyswarm 3트랙 병렬로, 핵심인 `no-restricted-imports` 16건은 **eslint 규칙과 SSOT 정책 문서의 모순을 발견·해소**하여 처리했다. 잔여 8건은 의도적 보류(회귀 위험·정당 사유). tsc 0·vitest 33/33·build EXIT 0.

## 대화 다이제스트

### 토픽 1: 세션 인계 + 방향 결정
> **사용자**: "이전 터미널 작업내용이고, 이전 터미널은 현재 세션종료 중. 넌 이어서 작업하면 되" — (이어서) "모두 진행하는데 충돌이 없다면 kdydispatch --kdyswarm 적극사용, 순서가 필요하다면 순서도 반영."

세션 시작 시 현황을 읽기 전용으로 파악(이전 터미널 cs 충돌 방지). audit R-A~R-D는 전량 마감 상태, 남은 백로그는 전부 외부/런타임/결정 의존(실환경 검증=prod 도메인 불명, 새 기능=구체 지시 필요)임을 확인. 4개 옵션(실환경 검증·코드 품질 정리·새 기능·현황) 중 **즉시 진행 가능한 것은 코드 품질 정리뿐**(나머지 2개는 블로커)으로 정리.

**결론**: lint baseline 정리를 kdyswarm으로 진행. 실환경 검증·새 기능은 사용자 입력 대기.

### 토픽 2: lint 현황 진단 + 트랙 설계
`npm run lint` 결과 **52 errors + 64 warnings**. 규칙별 집계 후 파일별 매핑(python 스크립트)으로 disjoint 트랙 설계. tsc는 이미 0, any 소스 잔여 3건뿐.

분류:
- **정리 대상 (24건)**: unescaped-entities 12·prefer-const 8·no-explicit-any 5·no-require-imports 3·use-before-declared 2 (일부 파일 중복)
- **보류 (회귀 위험)**: no-restricted-imports 16(SSOT)·set-state-in-effect 6(React 동작)

`secure-memo`의 use-before-declared는 실제 런타임 버그가 아님을 확인(`fetchMemos`를 effect 콜백=렌더 후 실행에서 부르므로 TDZ 미발생, lint 해소용 재배치만 필요).

**결론**: 규모 S라 워크트리 물리격리는 오버헤드 — 파일 disjoint 논리격리로 일반 병렬 에이전트 3트랙 발사.

### 토픽 3: kdyswarm 3트랙 병렬 실행
- **A1** (terms·InvestmentQuotes): unescaped-entities 12 (renders는 미터치)
- **A2** (portfolio·secure-memo·admin·api/analysis·StockPanel): any 5 + use-before-declared 2 + prefer-const 1 (restricted-imports 미터치)
- **A3** (lib×4·api/stock/history·Chart×2·scripts×2): prefer-const 7 + require-imports

A3가 `check_bch_cjs.js`(package.json `type` 없음=CJS 기본 + `.js` + ad-hoc 디버그)를 **CJS 의도적 유지로 보류**(ESM 전환 시 깨짐) — 정당 판단. A2/A3가 동시 편집한 portfolio/secure-memo의 중간 tsc 오류는 A2 완료 후 해소됨.

**결론**: 커밋 `546646e` — lint 52→24, tsc 0·vitest 33/33·build 0. push.

### 토픽 4: 보류 lint 검토 — SSOT 규칙↔문서 모순 발견 (핵심)
> **사용자**: (AskUserQuestion) "보류 lint 검토" + "no-restricted-imports를 규칙을 문서에 맞게 정정 (권장)"

`no-restricted-imports` 16건을 조사하던 중 **`eslint.config.mjs`와 `SSOT_SEPARATION_RULES.md`가 정면 충돌**함을 발견:
- 문서는 `generateSignals`(signals)·`generateStockSignals`(stock-signals)를 **명시적으로 허용**(✅ ALLOWED, 문서 12·19행)
- 정작 eslint 규칙은 `@/lib/analysis/*`에서 crypto·stock만 예외로 두고 signals·stock-signals·orchestrator·aggregation을 **전부 차단**

코드 실측으로 `orchestrator`(`performAnalysis`)·`signals`(`generateSignals`)·`aggregation`(`aggregateCandles`)·candlestick·divergence·mtf가 모두 **자산-중립 범용 모듈**임을 확인(crypto/stock 특정 아님). cross-asset 데이터 위반은 **발견되지 않음**. 즉 위반 16건은 정책 위반이 아니라 **규칙이 SSOT 의도를 과잉 구현**한 결과.

SSOT의 진짜 취지는 supabase 레이어의 crypto↔stock **데이터** 분리(`@/lib/supabase/*` 규칙이 담당)이며, analysis 레이어에서 막아야 할 것은 `@/lib/analysis` 부모 직접 import뿐.

**결론**: 규칙을 문서 의도에 맞게 화이트리스트로 정정. 정책 약화가 아닌 정합성 복원.

### 토픽 5: SSOT 정합 수정 + 검증 + cs
세 곳 수정:
1. `eslint.config.mjs`: analysis patterns를 화이트리스트로 전환(범용 모듈 7종 예외 추가)
2. `lib/analysis/crypto.ts`: `AnalysisResult` 타입 re-export 추가(진입점 노출 보강)
3. `app/api/analysis/[symbol]/route.ts`: `@/lib/analysis` 부모 직접 import → `@/lib/analysis/crypto` 진입점 경유(문서상 진짜 위반 해소)
4. `SSOT_SEPARATION_RULES.md`: 범용 모듈 허용 명시(문서↔규칙 정합)

**결론**: 커밋 `15f2b48` — lint 24→8(no-restricted 0), tsc 0·vitest 33/33·build 0. push. set-state-in-effect 6·CJS 2는 의도적 보류.

## 의사결정 요약

| # | 결정 | 선택지 | 선택 이유 |
|---|------|--------|----------|
| 1 | lint 정리를 kdyswarm 병렬로 | swarm / 직접 순차 | 사용자 명시 + disjoint 트랙으로 충돌 0 |
| 2 | 워크트리 격리 생략, 일반 병렬 에이전트 | worktree / 논리격리 | 규모 S(24건)에 워크트리 오버헤드 과대, 파일 disjoint라 논리격리로 충분 |
| 3 | set-state-in-effect 6건 보류 | 수정 / 보류 | React19 성능 권고(버그 아님), 수정 시 동작 변경/회귀 위험 |
| 4 | no-restricted-imports를 **규칙 정정**으로 해소 | 규칙 정정 / baseline 유지 / 소비자 리팩토링 | 규칙↔문서 모순이 근본 원인, 규칙 정정이 1파일·저위험·정책 의도 복원 |
| 5 | `check_bch_cjs.js` CJS 유지 | ESM 전환 / 보류 | package.json type 없음+`.js`+ad-hoc, ESM 전환 시 실행 깨짐 |

## 수정 파일 (18개, 커밋 2개)

### 커밋 `546646e` — 기계적 lint 28건
| # | 파일 | 변경 내용 |
|---|------|-----------|
| 1 | `app/terms/page.tsx` | unescaped-entities 10 (JSX 텍스트 escape) |
| 2 | `components/Stock/InvestmentQuotes.tsx` | unescaped-entities 2 |
| 3 | `app/admin/page.tsx` | any → `AdminUser` interface |
| 4 | `app/api/analysis/[symbol]/route.ts` | `getCache<any>` → `<AnalysisResult>` |
| 5 | `components/Analysis/StockPanel.tsx` | any → `StockPriceData[]` |
| 6 | `app/secure-memo/page.tsx` | any → `User`, `fetchMemos` useCallback 재배치 |
| 7 | `app/portfolio/page.tsx` | any → `User`, useCallback 재배치, prefer-const |
| 8 | `app/api/stock/history/route.ts` | prefer-const(구조분해 분리) |
| 9 | `lib/analysis/orchestrator.ts` | prefer-const |
| 10 | `lib/backtest/metrics.ts` | prefer-const |
| 11 | `lib/explanation/generator.ts` | prefer-const |
| 12 | `lib/probability/confidence.ts` | prefer-const |
| 13 | `components/Chart/CryptoChart.tsx` | prefer-const(for-of) |
| 14 | `components/Chart/StockChart.tsx` | prefer-const(for-of) |
| 15 | `scripts/preflight.ts` | require → ESM import |

### 커밋 `15f2b48` — SSOT 규칙↔문서 정합
| # | 파일 | 변경 내용 |
|---|------|-----------|
| 16 | `eslint.config.mjs` | analysis patterns 화이트리스트 전환(범용 모듈 7종 예외) |
| 17 | `lib/analysis/crypto.ts` | `AnalysisResult` 타입 re-export 추가 |
| 18 | `app/api/analysis/[symbol]/route.ts` | `@/lib/analysis` → `@/lib/analysis/crypto` |
| 19 | `docs/SSOT_SEPARATION_RULES.md` | 범용 모듈 허용 명시 |

## 검증 결과
- `npx tsc --noEmit` — 0 errors (양 커밋)
- `npm run lint` — **52 → 24 → 8 errors** (no-restricted-imports 16 전부 해소)
- `npx vitest run` — 33/33 passed
- `npm run build` — EXIT 0 (전 라우트 프리렌더 정상)

## 터치하지 않은 영역
- **set-state-in-effect 6건** (blog 3 + analysis/stock page + WhaleAlert + InvestmentQuotes): React19 cascading-renders 성능 권고. 버그 아님, 빌드·런타임 정상. 케이스별 useEffect 재구성 필요 → 별도 신중 작업.
- **`scripts/check_bch_cjs.js`의 require-imports 2건**: CJS 의도적 유지.
- audit 백로그(실환경 검증·새 기능): 외부/결정 의존 블로커.

## 알려진 이슈
- ⚠️ **실환경 미검증**: prod URL `coinchart.vercel.app`이 무관한 CRA 서빙 → 실배포 도메인 불명 (세션 55 발견, [메모리 prod-url-coinchart-vercel-stale]).
- 잔여 lint 8 error는 전부 의도적 보류(회귀 아님, [메모리 eslint-baseline-discrepancy]).

## 다음 작업 제안
- **set-state-in-effect 6건 정리** (원하면): 각 useEffect를 React19 권고대로 재구성. blog 3건은 동일 패턴이라 일괄 가능. 동작 보존 신중 검증 필요.
- **실환경 검증**: 실제 Vercel prod 도메인 확인 시 스모크 가능.
- 그 외 audit 백로그(Giscus/이미지 E2E·양평 cron 관측·pricing)는 외부/결정 의존.

> 세션 저널: 없음(대화 히스토리로 작성)

---
[← handover/_index.md](./_index.md)
