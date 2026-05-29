# R11-T03 — analysis/[symbol] 807줄 리팩토링 인수인계서

- **날짜**: 2026-05-29
- **터미널**: R11-reconcile-refactor / T03 (평면 4터미널, Wave 1, 독립)
- **작업**: `app/analysis/[symbol]/page.tsx` 807줄을 route-local 하위 파일로 점진 분해
- **원칙**: 동작·시각 보존(회귀 0). 순수 구조 재배치. `components/` 추출 금지(T02 영역).
- **결과**: ✅ 완료 — tsc 0 · build green · 라우트 불변 · 로직 불변 · 격리 준수

---

## 1. 분해 전후 구조

| | 분해 전 | 분해 후 |
|---|---|---|
| `page.tsx` | **807줄** (단일 거대 파일) | **78줄** (훅 호출 + 레이아웃 조합) — **90% 감소** |

`git diff --stat`: `page.tsx` 44 insertions / 773 deletions.

### 추출 파일 목록 (전부 `app/analysis/[symbol]/` 하위, route-local)

| 파일 | 줄 수 | 책임 |
|------|------|------|
| `_lib/badge-variants.ts` | 20 | `getProbabilityBadgeVariant`·`getConfidenceBadgeVariant` 순수 헬퍼 |
| `_lib/types.ts` | 7 | route-local 공유 타입(`Language`, `Translation = TRANSLATIONS['ko']`) |
| `_lib/useAnalysisData.ts` | 322 | 데이터 페칭·상태(8개)·지표 계산·프랙탈 분석·`getPriceColor` 커스텀 훅 |
| `_components/AnalysisHeader.tsx` | 85 | 네비게이션 + 언어 토글 + 심볼/현재가 헤더 |
| `_components/ChartSection.tsx` | 49 | 로딩 스피너 / DetailedChart / 미지원 안내 |
| `_components/AnalysisGrid.tsx` | 149 | uiState 분기(loading/error/insufficient/ok·pro-locked) + 카드 조합 |
| `_components/ProbabilityConfidenceCards.tsx` | 71 | 상승 확률 + 신뢰도 등급 2열 카드 |
| `_components/ExplanationCard.tsx` | 97 | 근거/위험/관찰 3열 설명 카드 |
| `_components/BacktestCard.tsx` | 115 | 백테스트 결과 카드(PRO 게이트/데이터 부족/전체 지표) |
| `_components/PositionStatusCard.tsx` | 48 | 평단가 대비 손익률 카드 |
| `_components/FractalCard.tsx` | 61 | 프랙탈 엔진 BETA 카드(유사도 + 예측) |

> Next.js App Router 관례: `_` 접두 폴더는 라우트로 취급되지 않음(co-location 안전). build 출력에 `_components`/`_lib` 라우트 미생성 확인.

---

## 2. 각 추출 파일의 책임 (상세)

### `_lib/useAnalysisData.ts` — 데이터 레이어 (가장 큰 덩어리)
- 입력: `(symbol: string, router)`. 반환: `{ historyData, avgPrice, loading, fractalResult, currentPrice, analysisResult, userTier, error, getPriceColor }`.
- 원본 `useEffect`(73~320줄) 전체를 **로직·의존성 배열 `[symbol, router]`·ref 가드 3종(`fetchInProgressRef`/`analysisExecutedRef`/`lastSymbolRef`) 그대로** 이전.
- 실시간 가격 폴링(5초 interval), `market_prices` 페칭, 9종 지표 계산(RSI/SMA/BB/MACD/Stoch/CCI/Williams/ATR/ADX), `IndicatorSignal` 조립, `trades` 평단가 계산, `performAnalysis` 호출, `analyzeFractalPattern` 호출 — 전부 불변.

### `_components/*` — 프레젠테이션 레이어
- 모두 `'use client'`. props로 데이터·`t`·`lang`만 받는 순수 표시 컴포넌트.
- 마크업·className·시각·조건 분기 **원본 그대로**. 콜백만 props화: `onBack={() => router.back()}`. `AnalysisGrid`는 `router`를 받아 `router.push('/analysis')`·`window.location.reload()` 원본 호출 유지.
- `BacktestCard`의 `analysisResult.backtest` 존재 가드는 원본대로 호출부(`AnalysisGrid`)에서 수행.

### `page.tsx` — 컴포지션 레이어 (78줄)
- `useLanguage`·`useParams`·`useRouter`·`TRANSLATIONS[lang]` → `useAnalysisData(symbol, router)` → `AnalysisHeader`/`ChartSection`/`AnalysisGrid` 조합. 최외곽 `div`·`max-w-6xl space-y-6` 래퍼 불변.

---

## 3. 동작 보존 근거 (회귀 0 입증)

- **tsc**: `npx tsc --noEmit` → exit 0 (분해 전 baseline도 0, 동일 유지).
- **build**: `npm run build` → green (exit 0).
- **라우트 불변**: build 출력에 `ƒ /analysis/[symbol]` (Dynamic) 정상 생성. 분해 전과 동일한 동적 라우트.
- **로직 불변**: 지표 계산·신호 조립·확률/백테스트/프랙탈 호출·평단가 계산식·ref 가드·useEffect 의존성 전부 원본 복사. props·렌더 결과·조건 분기 동일.
- **시각 불변**: 모든 className·레이아웃·텍스트·다국어 분기 원본 그대로 이전.

---

## 4. `components/` 미수정 확인 (격리 준수)

- T03이 **생성/수정한 파일은 `app/analysis/[symbol]/` 하위뿐**:
  - `M page.tsx`, `?? _components/`, `?? _lib/`
- git status에 보이는 `components/Analysis/AnalysisPanel.tsx`·`components/Analysis/ChartAnalysisPanel.tsx`·`components/Chart/CryptoChart.tsx` 변경은 **T03 소관 아님** — 공유 워킹트리의 병렬 터미널(T02 lint/deadcode: `git diff --stat` 기준 라인 삭제 위주, 1 insertion/5 deletions) 작업. T03은 해당 컴포넌트들을 **import만** 하고 수정하지 않음.
- `components/`로 컴포넌트를 추출하지 않음(안티패턴 회피, T02 영역 비침범).

---

## 5. 비고

- 미사용 분해 잔여물(`adxPlusDI`/`adxMinusDI`/`setUserTier`)은 **원본 그대로** 이전. baseline tsc 0이었으므로 동일 통과(회귀 0 우선, 정리는 본 라운드 범위 밖).
- 후속 정리 후보(별도 작업): `useAnalysisData`의 미사용 구조분해 변수 제거, `userTier` 실제 사용자 등급 연동(현재 항상 `'free'` 초기값).
