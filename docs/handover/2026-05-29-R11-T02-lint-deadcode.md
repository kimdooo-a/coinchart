# 인수인계서 — R11-T02 (lint/데드코드 잔여 정리)

> 작성일: 2026-05-29
> 라운드: R11-reconcile-refactor / Wave 1 / **T02 일꾼**
> 지시서: `docs/orchestration/2026-05-29-R11-reconcile-refactor/T02-lint-deadcode.md`
> 쓰기 영역(격리): `components/Analysis/`·`components/Chart/` (미사용 import·죽은 주석만)

---

## 작업 요약

`components/Analysis/`·`components/Chart/` 7개 파일 전수 스캔 → **미사용 import 1건 + 주석처리 dead 코드 4줄**을 사용처 확정(grep+eslint) 후 순수 제거. **로직·동작·구조·export 시그니처 변경 0**. tsc 0 · build green.

## 스캔 대상 (7개 파일)

| 파일 | 결과 |
|------|------|
| `components/Analysis/ChartAnalysisPanel.tsx` | 미사용 import 1건 제거 |
| `components/Analysis/AnalysisPanel.tsx` | 주석처리 dead import 3줄 제거 |
| `components/Analysis/StockPanel.tsx` | clean (전 import 사용·주석처리 코드 없음) |
| `components/Chart/CryptoChart.tsx` | 잔존 placeholder 주석 1줄 제거 |
| `components/Chart/StockChart.tsx` | clean (전 import 사용·주석처리 코드 없음) |
| `components/Chart/Ticker.tsx` | clean |
| `components/Chart/StockTicker.tsx` | clean |

## 제거한 미사용 import

| 파일 | 심볼 | 근거 (사용처 0건) |
|------|------|-------------------|
| `ChartAnalysisPanel.tsx` (line 6) | `calculateRSI` | grep 결과 파일 내 import 라인에만 존재(RSI 표시는 `generateSignals`의 `raw.RSI` 사용, `calculateRSI` 직접 호출 없음). eslint `@typescript-eslint/no-unused-vars` "defined but never used" 확정. 같은 import 라인의 `calculateBollingerBands`는 line 137에서 실사용 → 보존. |

R10 known issue("`ChartAnalysisPanel`의 `calculateRSI` 미사용 import — 후속 정리 후보")를 해소.

## 삭제한 죽은 주석 (주석처리된 dead 코드)

| 파일 | 삭제 라인(원본) | 내용 |
|------|------|------|
| `AnalysisPanel.tsx` | 5 | `// import { CandleData, getKlines } from '@/lib/api/binance'; // REMOVED for SSOT` |
| `AnalysisPanel.tsx` | 6 | `// import { analyzeMarket } from '@/lib/analysis'; // Legacy` |
| `AnalysisPanel.tsx` | 9 | `// import { PremiumLock } from '@/components/PremiumLock'; // Removed as Backtest is now free for all` |
| `CryptoChart.tsx` | 232 | `// ... (clear all refs logic) ...` (Data Fetching useEffect 내 잔존 placeholder) |

- AnalysisPanel 3줄: 전부 주석처리된 import 문(dead code in comment form). R10이 이미 동일 파일 죽은 주석 1줄을 제거한 흐름의 잔재.
- CryptoChart 1줄: 형제 컴포넌트 `StockChart.tsx`의 동일한 Data Fetching useEffect에는 이 placeholder가 없음(이미 정돈됨) → CryptoChart에만 남은 스캐폴딩 잔재. R10 handover가 지목한 "`Chart/CryptoChart`(주석처리 잔존 후보)"에 해당. 바로 아래 실제 ref clear 코드(`rsiSeriesRef.current.setData([])` 등)는 그대로 보존.

## 보존한 항목 (의도 주석 — 삭제 안 함)

- `AnalysisPanel.tsx:3` `// CRYPTO ANALYSIS ONLY - DO NOT ADD STOCK IMPORTS` (SSOT 가드 주석)
- `AnalysisPanel.tsx` SSOT/타임프레임 설명 주석(`// SSOT Limitation...`, `// Type definition for local use...` 등)
- `CryptoChart.tsx`/`StockChart.tsx` 라이트테마·한국식 캔들·보조지표 색 SSOT 설명 주석(line 8~16 등)
- `ChartAnalysisPanel.tsx` 볼린저밴드 %B 산식 한국어 설명 주석(line 133~136)
- `AnalysisPanel.tsx:355` `{/* Premium Modal Overlay - Removed */}` (주석처리 코드가 아닌 단순 마커 — 보수적으로 보존)

## 범위 밖으로 남겨둔 eslint 잔여 (의도적 미접촉)

본 작업은 **미사용 import·죽은 주석 순수 정리**만 수행. 아래는 import도 주석도 아니거나 구조/로직 변경에 해당하여 미접촉:
- `no-restricted-imports`(SSOT 아키텍처 규칙) — 실사용 import이며 규칙 자체는 별도 사안
- 미사용 *지역변수/state* (`isGuideOpen`·`error`·`showUpgradeModal`·`isPro`·`rawIndicators`·`isLocked`·`setPeriod` 등) — import 아님, 제거 시 구조 변경 위험
- `prefer-const`·`no-explicit-any`·`react-hooks/exhaustive-deps`·미사용 catch 파라미터 `e` — 로직/구조 변경 영역

## 검증 결과

- `npx tsc --noEmit` — **exit 0**
- `npm run build` — **exit 0, green** (전 라우트 정상 컴파일)
- `npx eslint` — 편집 3파일에서 `calculateRSI` "defined but never used" 경고 소멸 확인(전체 26→18 problems)
- **export 시그니처 불변 확인**: `ChartAnalysisPanel`/`AnalysisPanel`의 `export const ...: React.FC<Props>` 및 `export type CandleData` 동일, `CryptoChart`의 `export const CryptoChart` 동일 — import 라인·주석만 변경. T03(`app/analysis/[symbol]/`)의 컴포넌트 의존 인터페이스 영향 없음.

## 터치하지 않은 영역 (안티패턴 준수)

- `app/analysis/[symbol]/`(T03 전담) — 미접촉
- 기존 `docs/` 문서 — 미수정 (본 handover 신규 작성만)
- `_COMPONENT_MAP.md` 등 레퍼런스 — 미수정

---
저널: 없음 (단일 일꾼 작업, 대화 히스토리로 작성)
