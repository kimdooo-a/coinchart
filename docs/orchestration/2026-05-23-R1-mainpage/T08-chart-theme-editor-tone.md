# T08 — chart-theme + editor-tone

> **본 터미널은 R1 일꾼(T08)**. 1차 발사 (의존 없음). T09·T10·T11이 본 산출물에 의존.

## 정체성

- 역할: `worker` (T08), R1, mainpage
- 담당: TradingView Lightweight Charts 라이트 테마 + BlogEditor 라이트 톤 props

## 컨텍스트

세션 7에서 디자인 토큰을 라이트 통일했으나, TradingView 차트는 다크 배경 옵션이 고정되어 라이트 환경에 어울리지 않는다. BlogEditor도 `prose-invert` 클래스를 사용 중이라 입력 텍스트가 흰 배경에서 잘 안 보인다.

본 일꾼이 차트 라이트 옵션 모듈을 분리하고, BlogEditor에 `tone` prop을 추가해 라이트/다크 양쪽 지원을 갖춘다. **실제 페이지 적용은 T09·T10·T11이 담당** — 본 일꾼은 인프라만.

## 공통 SOT

```
CLAUDE.md
app/globals.css                                   ← 라이트 토큰
components/chart/ (있다면)                         ← 기존 차트 설정 위치
app/analysis/[symbol]/page.tsx                    ← 차트 옵션 사용 위치 (Read만)
components/blog/BlogEditor.tsx                    ← 수정 대상
```

`Grep`으로 `createChart\|TradingView` 검색하여 기존 차트 옵션 위치 파악.

## 작업 목표

1. `lib/chart/theme.ts` 신규 — light/dark 양쪽 옵션 객체
2. `components/blog/BlogEditor.tsx` — `tone?: "light" | "dark"` prop 추가, 기본 light

## 산출물

#### 1. `lib/chart/theme.ts`

```ts
import type { DeepPartial, ChartOptions } from "lightweight-charts";

// 디자인 토큰 (app/globals.css의 라이트 테마)와 매핑
export const LIGHT_CHART_THEME: DeepPartial<ChartOptions> = {
  layout: {
    background: { type: "solid" as const, color: "#ffffff" },
    textColor: "#191b24",
    fontFamily: "Noto Sans KR, sans-serif",
  },
  grid: {
    vertLines: { color: "#e7e7eb" },
    horzLines: { color: "#e7e7eb" },
  },
  rightPriceScale: { borderColor: "#cfd1d8" },
  timeScale: { borderColor: "#cfd1d8" },
  crosshair: {
    vertLine: { color: "#0050cb", labelBackgroundColor: "#0050cb" },
    horzLine: { color: "#0050cb", labelBackgroundColor: "#0050cb" },
  },
};

export const DARK_CHART_THEME: DeepPartial<ChartOptions> = {
  layout: {
    background: { type: "solid" as const, color: "#0d0d12" },
    textColor: "#e5e7eb",
    fontFamily: "Noto Sans KR, sans-serif",
  },
  grid: {
    vertLines: { color: "#2a2c35" },
    horzLines: { color: "#2a2c35" },
  },
  rightPriceScale: { borderColor: "#3a3c46" },
  timeScale: { borderColor: "#3a3c46" },
};

// 한국식 색상 (캔들·라인)
export const KR_CANDLE_COLORS = {
  upColor: "#ba1a1a",       // 빨 (상승)
  downColor: "#0050cb",     // 파 (하락)
  borderUpColor: "#ba1a1a",
  borderDownColor: "#0050cb",
  wickUpColor: "#ba1a1a",
  wickDownColor: "#0050cb",
};

export const US_CANDLE_COLORS = {
  upColor: "#16a34a",
  downColor: "#dc2626",
  borderUpColor: "#16a34a",
  borderDownColor: "#dc2626",
  wickUpColor: "#16a34a",
  wickDownColor: "#dc2626",
};

export type ChartTone = "light" | "dark";
export type CandleScheme = "kr" | "us";

export function getChartTheme(tone: ChartTone = "light"): DeepPartial<ChartOptions> {
  return tone === "light" ? LIGHT_CHART_THEME : DARK_CHART_THEME;
}

export function getCandleColors(scheme: CandleScheme = "kr") {
  return scheme === "kr" ? KR_CANDLE_COLORS : US_CANDLE_COLORS;
}
```

#### 2. `components/blog/BlogEditor.tsx` (수정)

기존 props 인터페이스에 다음 추가:
```ts
tone?: "light" | "dark";   // default "light"
```

`prose-invert` 클래스를 다음으로 교체:
```tsx
className={cn(
  "prose prose-sm sm:prose-base focus:outline-none max-w-none",
  tone === "dark" && "prose-invert",
  // 기존 다른 클래스...
)}
```

TipTap toolbar 배경·텍스트 색상도 tone에 따라 분기:
- light: `bg-surface-container border-outline-variant text-on-surface`
- dark: 기존 다크 톤 유지

> 기존 다른 props/함수는 절대 손대지 말 것. tone props 추가 + 클래스 분기 2가지만.

## 작업 단계

1. SOT 읽기 (`BlogEditor.tsx` 전체, lightweight-charts import 위치 grep)
2. `lib/chart/theme.ts` 작성
3. `BlogEditor.tsx` 수정 (minimal diff)
4. 검증

## 검증

```bash
npx tsc --noEmit

# theme.ts 키 검증
grep -c "LIGHT_CHART_THEME\|DARK_CHART_THEME\|KR_CANDLE_COLORS\|US_CANDLE_COLORS\|getChartTheme\|getCandleColors" lib/chart/theme.ts
# 기대: 6 이상

# BlogEditor tone prop 추가 검증
grep -c "tone" components/blog/BlogEditor.tsx
# 기대: 4 이상 (prop 정의·기본값·className 분기 등)

# ESLint
npx eslint lib/chart/theme.ts components/blog/BlogEditor.tsx 2>&1 | tail -10

# 빌드 회귀 검증
npm run build 2>&1 | tail -20
```

## 완료 신호

`docs/handover/2026-05-23-R1-T08-chart-theme-editor-tone.md` 작성.

명시:
- `getChartTheme("light")` 사용법
- `getCandleColors("kr")` (한국식 빨/파)
- BlogEditor의 `tone="light"` 사용법
- T09·T10·T11에게 안내: 차트 생성 시 `getChartTheme("light")` + `getCandleColors("kr")` 적용

## 안티패턴

- `app/blog/`, `app/analysis/`, `app/signal/`, `app/market/` 페이지 수정 금지 (T09·T10·T11 영역)
- 디자인 토큰(`globals.css`) 수정 금지 (세션 7에서 확정)
- 새 lucide-react 아이콘이나 외부 패키지 추가 금지
- BlogEditor의 다른 부분(TipTap extensions, 이미지 업로드 등) 수정 금지
