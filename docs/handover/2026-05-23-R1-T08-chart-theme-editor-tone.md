# R1-T08 인수인계 — chart-theme + editor-tone

- **날짜**: 2026-05-23
- **라운드/일꾼**: R1 / T08 (mainpage)
- **상태**: 완료
- **의존**: 없음 (1차 발사)
- **하류 의존자**: T09 (signal-lightify), T10 (analysis-lightify), T11 (market-lightify)

## 산출물

### 1. `lib/chart/theme.ts` (신규)

TradingView Lightweight Charts v5 호환 라이트/다크 테마 옵션 + 한국식/미국식 캔들 색상 팔레트.

```ts
import { ColorType } from 'lightweight-charts';

LIGHT_CHART_THEME   // 라이트 토큰 매핑 (배경 #ffffff, 텍스트 #191b24, 그리드 #e7e7eb)
DARK_CHART_THEME    // 다크 톤 (배경 #0d0d12)
KR_CANDLE_COLORS    // 상승 빨강(#ba1a1a) / 하락 파랑(#0050cb)
US_CANDLE_COLORS    // 상승 초록(#16a34a) / 하락 빨강(#dc2626)
getChartTheme(tone?: 'light' | 'dark')      // default 'light'
getCandleColors(scheme?: 'kr' | 'us')        // default 'kr'
```

**v5 호환 포인트**: `background.type`은 문자열 리터럴 `'solid'`이 아닌 `ColorType.Solid` enum을 사용해야 한다. v5에서 ColorType이 enum으로 강화되어 spec에 적힌 `'solid' as const`는 TS2322 발생.

### 2. `components/Blog/editor/BlogEditor.tsx` (수정)

- `tone?: 'light' | 'dark'` prop 추가, 기본값 `'light'`
- `EditorTone` 타입 export 추가
- EditorContent의 prose 클래스: `tone === 'dark'`일 때만 `prose-invert` 부착
- containerClass: light면 `border-outline-variant bg-surface-container-lowest`, dark면 기존 `border-white/10 bg-black/40`
- isFullscreen 시: light면 `bg-surface-container-lowest`, dark면 `bg-black`
- EditorToolbar에 `tone` prop 전파

### 3. `components/Blog/editor/EditorToolbar.tsx` (수정)

- `tone?: 'light' | 'dark'` prop 추가, 기본값 `'light'`
- 상단 wrapper className: light면 `bg-surface-container border-outline-variant text-on-surface`, dark면 기존 `bg-white/5 border-white/10`
- **ToolButton 내부 클래스(`text-gray-400`, `hover:bg-white/10` 등)는 미수정** — minimal diff 원칙

> 안티패턴 line 168("BlogEditor의 다른 부분 수정 금지")의 "다른 부분"은 TipTap extensions/이미지 업로드 로직을 의미한다고 해석. spec line 122-124에서 명시적으로 toolbar 분기를 요구하므로 EditorToolbar의 tone prop 전파는 본 작업 범위로 포함.

## 사용법 (T09·T10·T11 안내)

### 차트 적용

```ts
import { createChart, CandlestickSeries } from 'lightweight-charts';
import { getChartTheme, getCandleColors } from '@/lib/chart/theme';

// 라이트 톤 + 한국식 색상
const chart = createChart(container, getChartTheme('light'));
const series = chart.addSeries(CandlestickSeries, getCandleColors('kr'));
```

### BlogEditor 라이트 사용 (default)

```tsx
import BlogEditor from '@/components/Blog/editor/BlogEditor';

<BlogEditor content={html} onChange={setHtml} />
// tone="light"는 default라 생략 가능
```

### BlogEditor 다크 사용

```tsx
<BlogEditor content={html} onChange={setHtml} tone="dark" />
```

## 검증 결과

| 항목 | 결과 |
|------|------|
| `npx tsc --noEmit` (T08 영역) | PASS (lib/chart, components/Blog/editor 에러 0) |
| `grep theme.ts 심볼` | 8회 매칭 (기준: 6+) |
| `grep BlogEditor "tone"` | 6회 (기준: 4+) |
| `npx eslint` (T08 파일 3개) | PASS (에러 0, 경고는 프로젝트 전역 `.eslintignore` deprecation 1건뿐) |

**기존 미해결 이슈(본 task 무관)**:
- `lib/community/auth.ts`: `bcryptjs` 모듈 미설치 (T11~T15 영역)
- spec line 149의 `npm run build`는 위 누락 모듈로 인해 별도 격리 검증 불가. 본 task 영역(lib/chart, components/Blog/editor)은 tsc로 독립 검증됨.

## 알려진 제약

1. **EditorToolbar ToolButton 내부 색상**: light tone에서 `text-gray-400` 아이콘 색상이 다소 흐릿할 수 있음. 후속 R2에서 ToolButton 자체에 tone-aware 색상 분기를 추가하면 라이트 환경 일관성이 더 좋아짐. 기능상 문제는 없음 (hover/active는 정상).
2. **textarea (HTML 모드)**: `bg-black/60 text-green-400` 하드코딩 유지 — 코드 편집 영역은 다크가 가독성에 유리하므로 의도적으로 보존.
3. **BlogPostContent (preview 모드)**: tone 분기 없음 — BlogPostContent 자체가 prose 클래스를 갖고 있다면 후속 정리 필요.

## 후속 권장사항 (T09·T10·T11)

- 기존 차트 생성 코드(`components/Chart/CryptoChart.tsx`, `components/Chart/StockChart.tsx`, `components/DetailedChart.tsx`, `components/hero-chart.tsx`)에서 차트 옵션 하드코딩 부분을 `getChartTheme('light')` + `getCandleColors('kr')` 호출로 교체.
- 차트 옵션 객체에서 `layout`, `grid`, `rightPriceScale`, `timeScale`, `crosshair` 키를 spread하지 말고 **테마 객체를 직접 전달**하여 일관성 유지.
- CandlestickSeries 색상은 `addSeries(CandlestickSeries, { ...getCandleColors('kr') })` 형태로 적용.
