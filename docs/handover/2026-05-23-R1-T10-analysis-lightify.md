# R1-T10 인수인계 — analysis-lightify

- **날짜**: 2026-05-23
- **라운드/일꾼**: R1 / T10 (mainpage)
- **상태**: 완료
- **의존**: T08 (`getChartTheme("light")`, `getCandleColors("kr")`) — 차트 옵션 호출은 본 영역에 부재 (아래 "차트 옵션" 절 참조)
- **선행 참조**: T09 (blog-lightify) 클래스 매핑 표

## 수정 파일 (8개)

| 파일 | 변경 라인(+/-) | 비고 |
|------|---------------|------|
| `app/analysis/page.tsx` | 6/6 | 코인 선택 버튼·차트 섹션 |
| `app/analysis/[symbol]/page.tsx` | 59/59 | 807줄 대형 파일, 클래스만 교체 (리팩토링 없음) |
| `app/analysis/stock/page.tsx` | 7/7 | 미국 주식 목록 |
| `app/analysis/stock/[symbol]/page.tsx` | 4/4 | 미국 주식 상세 |
| `components/Analysis/AnalysisPanel.tsx` | 28/28 | 확률·신뢰도·백테스트 패널 |
| `components/Analysis/ChartAnalysisPanel.tsx` | 32/32 | 지표·전략 가이드 패널 |
| `components/Analysis/StockPanel.tsx` | 27/27 | 주식 분석 패널 |
| `components/Analysis/TradingStrategyGuide.tsx` | 23/23 | 매매 전략 가이드 (legacy, 현재 import 주석처리됨) |

`git diff --stat` 합계: **186/186 인서션·삭제** — 정확히 좌우 대칭. 클래스 토큰 교체만 발생했음을 의미.

## 클래스 교체 매핑 (T09 베이스 + 본 영역 추가)

| 다크 톤 | 라이트 토큰 |
|---|---|
| `bg-black`, `bg-gray-950` | `bg-surface` |
| `bg-gray-900`, `bg-zinc-900`, `bg-slate-900` | `bg-surface-container-lowest` |
| `bg-gray-900/50`, `bg-gray-900/80` | `bg-surface-container-lowest/80` |
| `bg-gray-800`, `bg-zinc-800` | `bg-surface-container` |
| `bg-gray-800/50`, `bg-gray-800/80` | `bg-surface-container/80` |
| `bg-gray-700` | `bg-surface-container-high` |
| `bg-gray-600` | `bg-surface-container-highest` |
| `text-white`, `text-gray-100`, `text-gray-200`, `text-gray-300` | `text-on-surface` |
| `text-gray-400`, `text-gray-500`, `text-gray-600` | `text-on-surface-variant` |
| `border-gray-700`, `border-gray-800`, `border-zinc-700`, `border-zinc-800` | `border-outline-variant` |
| `border-gray-600` | `border-outline` |
| `hover:bg-gray-700`, `hover:bg-gray-800` | `hover:bg-surface-container-low` / `-high` (문맥) |
| `hover:text-white` | `hover:text-on-surface` |
| `bg-black/50` (오버레이) | `bg-on-surface/40` |
| `bg-blue-600 text-white` 등 강조 컬러 위 white | **보존** |
| `bg-indigo-500 text-white` BETA 뱃지 | **보존** |
| `bg-blue-900/20 border-blue-500/50` 강조 그라데이션 | **보존** |
| `bg-red-900/20 border-red-500/30` 위험 강조 | **보존** |
| `bg-card`, `bg-background`, `bg-muted`, `text-muted-foreground`, `text-foreground` 등 의미론 토큰 | **보존** (이미 라이트 친화 토큰) |

## 차트 옵션 교체 (T10 spec line 45-67)

**본 일꾼 영역(`app/analysis/`, `components/Analysis/`)에는 `createChart` / `addCandlestickSeries` / `addSeries` / `TradingView` / `lightweight-charts` 호출이 일절 존재하지 않습니다.**

```bash
grep -rn "createChart\|addCandlestickSeries\|addSeries(\|TradingView\|lightweight-charts" app/analysis/ components/Analysis/
# → No matches
```

차트는 모두 `components/Chart/Ticker.tsx`, `components/DetailedChart.tsx`, `components/Stock/InvestmentQuotes.tsx` 같은 외부 컴포넌트로 위임됩니다. 본 영역 페이지는 `<Ticker symbol={symbol} lang={lang} />`, `<DetailedChart data={historyData} avgPrice={avgPrice} symbol={symbol} />` 식으로 prop만 전달.

따라서 `getChartTheme("light")` + `getCandleColors("kr")` 적용은 **본 일꾼 범위 밖**입니다. T08 handover line 94에 명시된 후속 작업(`components/Chart/CryptoChart.tsx`, `components/Chart/StockChart.tsx`, `components/DetailedChart.tsx`, `components/hero-chart.tsx`)은 다른 일꾼(T11 또는 별도 라운드) 영역. 본 일꾼은 `app/analysis/page.tsx:128`의 차트 *섹션 배경*만 라이트 토큰으로 교체 완료.

> 검증: `grep -rn "getChartTheme\|getCandleColors" app/analysis/ components/Analysis/` → 0건 (예상 동작, 영역 외).

## 분석 로직 무손상 확인

```bash
git diff --stat lib/analysis.ts lib/indicators.ts lib/fractal_engine.ts lib/signal_engine.ts lib/probability/ lib/backtest/
# → (출력 없음 = 0 변경)
```

T10 spec 안티패턴 line 115의 보호 대상 라이브러리 일체 **무변경**. 차트 분석·지표·확률·프랙탈·시그널·백테스트 엔진 모두 손대지 않음.

## 검증 결과

| 항목 | 결과 |
|------|------|
| `npx tsc --noEmit` (분석 영역) | **PASS** (본 영역 에러 0건. `lib/community/auth.ts:3` bcryptjs 미설치 1건은 T08 handover line 83에 명시된 본 작업 무관 사전 이슈) |
| 다크 톤 잔여 `grep -rn "bg-gray-\|bg-zinc-\|bg-slate-\|text-gray-\|text-zinc-\|border-gray-\|border-zinc-\|prose-invert\|bg-black\|text-slate-" app/analysis/ components/Analysis/` | **PASS** (0건) |
| 강조 컬러 `text-white` 보존 검사 (`bg-indigo-500\|bg-blue-600\|bg-gradient-to-br ... text-white`) | 3건 (의도적 보존) |
| 라이트 토큰 사용 `grep -rn "bg-surface\|text-on-surface\|border-outline" app/analysis/ components/Analysis/` | 다수 (50+ 매칭) |
| `git diff --stat lib/` (분석 로직 6개 경로) | **PASS** (0 변경) |
| `npm run build` | 본 영역 격리 검증 불가 (`bcryptjs` 사전 이슈로 빌드 자체가 실패. T08 handover line 84와 동일 사유) |

## 의도적으로 남긴 다크 톤 / 강조 색

| 위치 | 클래스 | 사유 |
|------|--------|------|
| `app/analysis/page.tsx:106` | `bg-gradient-to-br from-blue-600 to-indigo-600 ... text-white` | 선택된 코인 버튼의 강조 그라데이션, 흰 글씨는 짙은 그라데이션 위 가독성 의도 |
| `app/analysis/[symbol]/page.tsx:764` | `bg-indigo-500 text-white` | BETA 뱃지 (Fractal Engine), 짙은 인디고 위 흰 글씨 강조 |
| `components/Analysis/TradingStrategyGuide.tsx:269` | `bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/50` | 선택된 매매 스타일 버튼 강조 |
| 다양한 위치 | `bg-blue-900/20`, `bg-red-900/20`, `bg-green-900/20`, `border-blue-500/30`, `border-red-500/30` 등 | 정보 카드 강조 그라데이션 (관망/위험/매수 안내), 의미 컬러 시스템 일부로 보존 |
| 다양한 위치 | `text-red-400`, `text-red-500`, `text-green-400`, `text-blue-400`, `text-yellow-400`, `text-purple-400`, `text-indigo-400`, `text-orange-400` | 지표 상태·확률·신뢰도 등급 색상 (의미 컬러) |
| `app/analysis/stock/page.tsx:43` | `bg-green-500 text-black` | 미국 주식 선택 버튼 강조 (라이트 환경에서 green-500 위 black은 가독성 OK) |

## 시각 회귀 검증 안내 (PARTIAL)

`npm run build`가 사전 이슈로 실행 불가하므로 본 작업 후 시각 회귀는 **수동 검증 권장**:

```bash
# 사전 작업: bcryptjs 설치 (T11~T15 영역) 후
npm run dev
```

확인 페이지:
- `/analysis` — 코인 선택 바, 차트 섹션 배경 (`bg-surface-container-lowest/80`), Ticker/DetailedChart는 외부 컴포넌트
- `/analysis/BTCUSDT` — 헤더, 확률/신뢰도 카드(`bg-surface-container-lowest border-outline-variant`), explanation 3-column, 백테스트, position, fractal 카드, PRO 락 오버레이(`bg-on-surface/40`) 가독성
- `/analysis/stock` — 종목 버튼 grid (선택/미선택 대비), 안내 섹션
- `/analysis/stock/AAPL` — 헤더 + StockPanel (skeleton, evidence/risk/watch 카드, premium lock 백드롭)

영역 외 의존:
- `components/Chart/Ticker.tsx`, `components/DetailedChart.tsx`, `components/Stock/InvestmentQuotes.tsx`, `components/Common/Disclaimer.tsx`, `components/PremiumLock.tsx`, `components/community/Badge.tsx` 등은 본 일꾼 영역 외. 이들이 라이트화되어 있지 않으면 분석 페이지 안에서도 다크 톤이 잔존할 수 있음 — **본 일꾼은 자기 영역만 라이트화**.

## 알려진 제약

1. **TradingStrategyGuide.tsx** — `AnalysisPanel.tsx` line 9의 import가 주석처리되어 현재 미사용 (legacy hidden). 그러나 본 일꾼 영역에 포함되므로 동일하게 라이트화. 향후 재활성화 시 즉시 라이트 톤으로 동작.
2. **AnalysisPanel.tsx의 `bg-card`, `bg-muted`, `text-muted-foreground` 등** — Tailwind preset / shadcn 토큰이 이미 적용된 영역. 이들은 라이트 환경 호환이므로 손대지 않음. minimal-diff.
3. **차트 라이트 옵션 교체 미수행** — 본 일꾼 범위 밖. 위 "차트 옵션 교체" 절 참조. 후속 일꾼이 `components/Chart/*`, `components/DetailedChart.tsx`에 `getChartTheme("light")`, `getCandleColors("kr")`을 적용해야 페이지 안의 실제 차트도 라이트 톤이 됨.
4. **빌드 회귀 검증 불완전** — `bcryptjs` 모듈 미설치 사전 이슈로 `npm run build`가 본 영역과 무관한 사유로 실패. T08과 동일한 격리 검증(`npx tsc --noEmit` + grep + git diff)으로 갈음.

## 후속 권장사항

- (T11 또는 R2) `components/Chart/Ticker.tsx`, `components/DetailedChart.tsx`, `components/hero-chart.tsx`에 `getChartTheme("light")` + `getCandleColors("kr")` 적용. 그러면 `/analysis/*` 페이지의 실제 차트도 라이트화 완성.
- (별도 일꾼) `components/Stock/InvestmentQuotes.tsx`, `components/PremiumLock.tsx`, `components/Common/Disclaimer.tsx` 라이트화 필요 시 점검.
- (R2) AnalysisPanel.tsx에서 `bg-card`/`bg-muted` 같은 shadcn 토큰과 새로 도입된 `bg-surface-container-*` 토큰의 시각 일관성 검토. 가능하면 한 시스템으로 통일 권장 (현재는 두 토큰계가 공존).
