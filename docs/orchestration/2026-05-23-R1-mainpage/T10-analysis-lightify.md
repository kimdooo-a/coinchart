# T10 — analysis-lightify

> **본 터미널은 R1 일꾼(T10)**. T08 완료 후 발사.

## 정체성

- 역할: `worker` (T10), R1, mainpage
- 담당: AI 분석 페이지 라이트화 (`app/analysis/*`) + analysis 컴포넌트
- 의존: T08 (`getChartTheme("light")`, `getCandleColors("kr")`)

## 컨텍스트

AI 분석 페이지는 v2.0에서 "도구" 메뉴로 격리되었지만 URL은 유지된다. 메인페이지에서 도구 드롭다운 또는 코인룸의 "차트 분석 보기" 링크로 진입할 때 다크 톤이 갑작스러우면 사용자 인지 부조화. 라이트 톤으로 통일하되, **TradingView 차트 자체와 분석 로직은 절대 손대지 말 것**.

## 공통 SOT

```
CLAUDE.md
app/globals.css
docs/orchestration/2026-05-23-R1-mainpage/T08-chart-theme-editor-tone.md
docs/handover/2026-05-23-R1-T08-chart-theme-editor-tone.md
lib/chart/theme.ts                ← T08 산출물 (수정 금지)
components/community/Badge.tsx    ← 통합 뱃지
```

## 작업 목표

`app/analysis/*` + `components/analysis/*`의 다크 톤 클래스를 라이트 토큰으로 교체 + TradingView 차트 옵션을 `getChartTheme("light")` + `getCandleColors("kr")`로 교체.

## 산출물

대상 (예상):
- `app/analysis/page.tsx`
- `app/analysis/[symbol]/page.tsx` (807줄 대형 파일 — 라이트화만, 리팩토링 절대 금지)
- `app/analysis/stock/page.tsx`
- `app/analysis/stock/[symbol]/page.tsx`
- `components/analysis/*.tsx` (모두)

### 클래스 교체 매핑

T09와 동일 매핑 (`bg-zinc-900` → `bg-surface-container-lowest` 등). T09 참조.

### 차트 옵션 교체

`Grep`으로 `createChart\|addCandlestickSeries\|TradingView` 검색하여 차트 생성 위치 파악. 발견된 옵션 객체에서:

기존:
```ts
const chart = createChart(container, {
  layout: { background: { color: "#0d0d12" }, textColor: "#e5e7eb" },
  ...
});
const series = chart.addCandlestickSeries({
  upColor: "#16a34a", downColor: "#dc2626", ...
});
```

교체:
```ts
import { getChartTheme, getCandleColors } from "@/lib/chart/theme";

const chart = createChart(container, {
  ...getChartTheme("light"),
  width: ..., height: ...,   // 기존 동적 값 보존
});
const series = chart.addCandlestickSeries(getCandleColors("kr"));
```

차트 외 분석 로직(`lib/analysis.ts`, `lib/indicators.ts`, `lib/probability/*`)은 절대 손대지 말 것.

## 작업 단계

1. `Grep`으로 다크 톤 클래스 + 차트 옵션 위치 전수 조사
2. 우선순위:
   - `app/analysis/page.tsx` (목록)
   - `app/analysis/[symbol]/page.tsx` (상세 차트)
   - `app/analysis/stock/*`
   - `components/analysis/*`
3. minimal diff
4. 검증

## 검증

```bash
npx tsc --noEmit

# 다크 톤 잔여
grep -rn "bg-zinc-\|bg-slate-\|text-white\|border-zinc-" app/analysis/ components/analysis/ 2>&1
# 기대: 0건

# 차트 테마 적용 검증
grep -rn "getChartTheme\|getCandleColors" app/analysis/ components/analysis/ 2>&1
# 기대: 1건 이상

# 분석 로직 무손상 검증
git diff --stat lib/analysis.ts lib/indicators.ts lib/probability/ 2>&1
# 기대: 0 (변경 없음)

npm run build 2>&1 | tail -20
```

## 완료 신호

`docs/handover/2026-05-23-R1-T10-analysis-lightify.md` 작성.

명시:
- 수정 파일 목록
- 차트 옵션 교체 위치 (파일:라인)
- 분석 로직(`lib/`) 무손상 확인
- 잔여 다크 톤 의도적 부분
- 시각 회귀 검증 안내 (PARTIAL 가능)

## 안티패턴

- `lib/analysis.ts`, `lib/indicators.ts`, `lib/fractal_engine.ts`, `lib/signal_engine.ts`, `lib/probability/`, `lib/backtest/` 절대 수정 금지
- `app/analysis/[symbol]/page.tsx` 리팩토링 금지 (807줄 그대로, 클래스만 교체)
- `lib/chart/theme.ts` 수정 금지 (T08 영역)
- `app/signal/`, `app/market/`, `app/blog/` 수정 금지 (T09·T11 영역)
- JSX 구조·라우팅 변경 금지
