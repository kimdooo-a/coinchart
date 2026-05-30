# R15-T02 — analysis 라우트 useAnalysisData 정리 (인수인계)

- **라운드/터미널**: R15 (tech-debt) / Wave 1 / T02 (독립)
- **작업일**: 2026-05-30
- **범위(쓰기)**: `app/analysis/[symbol]/` 하위만 — 실제 변경은 `_lib/useAnalysisData.ts` 1개 파일
- **요지**: 죽은 setter·미사용 구조분해 제거 + 의도 명시. **동작(렌더·tier 전달값) 보존**. 실등급 연동은 보류.

## 1. 택한 방안 — (A) setter 제거 + 상수화

지시서 권장안 **(A)** 채택. `setUserTier`는 선언(47행) 외 코드 전체에서 한 번도 호출되지 않음을 `grep -rn "setUserTier"`로 재확인(레포 내 잔존은 문서뿐). 죽은 setter 제거가 가장 정직.

```diff
- const [userTier, setUserTier] = useState<'free' | 'pro'>('free')
+ // TODO(R15+): 실등급 연동 보류 — gates.ts isDisabledProGate + Supabase 세션 기반 tier 해석 필요. 현재 free 고정(pro-gate 제품결정 대기).
+ const userTier: 'free' | 'pro' = 'free'
```

- `useState` import는 다른 state에서 여전히 사용 → 유지.
- `UseAnalysisData` 인터페이스의 `userTier: 'free' | 'pro'` 시그니처 불변 → 소비처(page.tsx → AnalysisGrid → BacktestCard) 영향 0.

## 2. 제거한 미사용 구조분해 변수

| 위치 | 변경 | 근거 |
|------|------|------|
| `useAnalysisData.ts` calculateADX 분해 | `const { adx, plusDI: adxPlusDI, minusDI: adxMinusDI } = ...` → `const { adx } = ...` | `adxPlusDI`/`adxMinusDI` 미사용(eslint `no-unused-vars` warning). `adx`만 215행에서 사용. R11-T03 handover에서 "원본 그대로 이전"된 잔여물. 함수 호출은 동일하므로 동작 불변. |

- **`page.tsx` 구조분해 9개(historyData·avgPrice·loading·fractalResult·currentPrice·analysisResult·userTier·error·getPriceColor)는 전부 사용 중** → 제거할 미사용 변수 **없음**(억지 제거 금지 원칙 준수).

## 3. any 정리 내역 — 보류(후보 기록)

`useAnalysisData.ts`의 `any`는 **보류**. 과욕 금지 원칙.

| 위치 | 현황 | 보류 사유 |
|------|------|-----------|
| 인터페이스 `historyData: any[]` (line 27) | `@typescript-eslint/no-explicit-any` error | `historyData`가 `ChartSection`·`AnalysisGrid`로 흐르며 각 컴포넌트 prop 타입과 정합 필요. 정확한 캔들 타입(`{time,open,high,low,close,volume}`) 신설 시 다운스트림 동시 수정이 필요해 단일 파일 범위를 벗어남 → 별도 작업 후보. |
| `useState<any[]>([])` (line 39) | 동일 error | 위와 동일(같은 historyData 소스). |

> 후보: route-local `Candle` 타입을 `_lib/`에 정의하고 historyData·ChartSection·AnalysisGrid를 일괄 정합화하는 별도 티켓(다운스트림 동시 변경 → 범위 분리 권장).

## 4. 동작 보존 근거 (tier 전달값 여전히 free)

- `userTier`는 상수 `'free'`로 고정 — 변경 전 `useState(...'free')`의 초기값과 동일(setter 미호출이었으므로 런타임상 항상 `'free'`였음).
- 사용처 동일: `performAnalysis({ ..., userTier })`(245행), 훅 반환(318행) → `AnalysisGrid` → `BacktestCard`의 `userTier === 'free'` 분기(BacktestCard 28·46행)에 **동일하게 `'free'` 전달**.
- 결론: 렌더 결과·tier 전달값 100% 보존. tier가 `'pro'`로 바뀌는 회귀 없음.

## 5. 검증 결과

| 항목 | 결과 |
|------|------|
| `setUserTier` 잔존 (코드) | **0건** (A안 충족) |
| `npx tsc --noEmit` | **EXIT 0** |
| eslint (`useAnalysisData.ts`) | 미사용 변수 경고 2건(adxPlusDI/adxMinusDI) **해소**. setUserTier 관련 경고 없음 |
| `npm run build` | **EXIT 0** (전역 영향 없음) |

### 남은 eslint 항목 (전부 선재·범위 외 — 동작 보존상 미변경)

- `no-restricted-imports`: `@/lib/analysis/orchestrator` (line 9) — SSOT 임포트 규칙 위반이나 orchestrator가 실제 사용 모듈. import 아키텍처 변경 필요 → R15-T02 범위 외.
- `no-explicit-any` ×2 (line 27·39) — 위 §3 보류 후보.
- `react-hooks/exhaustive-deps`: `supabase` 누락(line 305) — 의존성 배열 변경은 fetch 재실행 동작에 영향. R11에서 원본 보존된 항목 → 동작 보존 위해 미변경.

## 6. 실등급 연동 보류 이유 (1줄)

코드베이스에 실제 tier 소스가 없고(다른 패널도 하드코딩) Supabase 세션→tier 해석 + pro-gate 제품결정이 선행돼야 하는 별도 기능이라, 커뮤니티 피벗·`NEXT_PUBLIC_DISABLE_PRO_GATE` 상황에서 가치가 낮아 R15에서 보류.

## 7. 변경 파일

- `app/analysis/[symbol]/_lib/useAnalysisData.ts` (setter 제거+상수화+TODO, 미사용 ADX 분해 제거) — **유일 변경 파일**
