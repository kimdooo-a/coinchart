# R2-T04 인수인계 — chart-lightify

- **날짜**: 2026-05-23
- **라운드/일꾼**: R2 / T04 (realdata-finish)
- **상태**: 완료
- **의존**: R1/T08 (`lib/chart/theme.ts`의 `getChartTheme`/`getCandleColors`)
- **담당**: TradingView Lightweight Charts 컴포넌트 4종을 하드코딩 다크 → T08 라이트 테마로 전환

## 산출물 (수정 4파일)

| 파일 | 변경 요지 |
|------|-----------|
| `components/Chart/CryptoChart.tsx` | 메인/RSI/MACD 3개 차트 layout·grid·timeScale·crosshair를 `getChartTheme('light')`로, 캔들 up/down/wick를 `getCandleColors('kr')`로 교체. `colors` prop 다크 기본값(#1E1E1E/#D9D9D9) 제거. |
| `components/Chart/StockChart.tsx` | 동일 패턴. market `'kr'` 적용. |
| `components/DetailedChart.tsx` | 단일 차트 layout(#111/#DDD)·grid(#333)·border(#444) → 테마, 캔들 → `getCandleColors('kr')`. |
| `components/hero-chart.tsx` | 홈 히어로 차트. transparent/흰색 텍스트·그리드 → 라이트 테마, 캔들 → `getCandleColors('kr')`. CrosshairMode·height(400)는 테마와 머지하여 보존. |

## 적용 방식 (공통 패턴)

T08 handover line 95 권장(키 spread 대신 테마 객체 직접 전달)을 따라, 각 파일 **모듈 레벨 상수**로 헬퍼를 1회 평가하여 재사용:

```ts
import { getChartTheme, getCandleColors } from '@/lib/chart/theme';

// 라이트 테마 + 한국식(빨↑/파↓) 캔들 — lib/chart/theme.ts SSOT (R1/T08)
const CHART_THEME = getChartTheme('light');
const CANDLE_COLORS = getCandleColors('kr');
```

- `createChart(el, { ...CHART_THEME, width, height, timeScale: { ...CHART_THEME.timeScale, timeVisible: true, secondsVisible: false } })`
  - `CHART_THEME.timeScale`(borderColor)를 보존하면서 `timeVisible`/`secondsVisible`만 덮어씀.
  - hero-chart는 추가로 `crosshair: { ...CHART_THEME.crosshair, mode: CrosshairMode.Normal }`로 머지.
- `chart.addSeries(CandlestickSeries, { ...CANDLE_COLORS, borderVisible: false })`
- 모듈 레벨 상수라 `useEffect` 의존성 배열에 넣을 필요 없음 → 기존 `[colors.backgroundColor, colors.textColor]` / `[showRSI, colors]` / `[showMACD, colors]` 의존성에서 `colors` 제거(`[]` / `[showRSI]` / `[showMACD]`). exhaustive-deps 경고 미발생 확인.

### `ColorType` import 제거

4개 파일 모두 `ColorType.Solid` 직접 사용처가 사라져 `lightweight-charts` import에서 `ColorType` 제거(미사용 import 방지). 테마 객체 내부에서 `ColorType.Solid`를 이미 사용하므로 동작 동일. (`CrosshairMode`/`UTCTimestamp`는 hero-chart에서 계속 사용 → 유지)

### `colors` prop

- CryptoChart/StockChart의 `colors?: { backgroundColor?; lineColor?; textColor? }` **인터페이스는 유지**(호출처 하위호환). 다크 하드코딩 기본값만 제거하고 구현은 테마 기반으로 전환.
- 조사 결과 현재 어떤 호출처도 `colors=` prop을 전달하지 않음(`CryptoChart`는 analysis 페이지에서 SSOT 이유로 주석 처리되어 미사용). 따라서 기본값 제거로 인한 사이드이펙트 없음.

## 캔들 색 규칙 (market별)

| 컴포넌트 | scheme | 상승 | 하락 |
|----------|--------|------|------|
| CryptoChart | `kr` | 빨강 `#ba1a1a` | 파랑 `#0050cb` |
| StockChart | `kr` | 빨강 `#ba1a1a` | 파랑 `#0050cb` |
| DetailedChart | `kr` | 빨강 `#ba1a1a` | 파랑 `#0050cb` |
| hero-chart | `kr` | 빨강 `#ba1a1a` | 파랑 `#0050cb` |

**StockChart도 `kr` 선택 사유**: 지시서 line 34는 "주식 차트는 프로젝트 규칙 확인 후 적용"이라 했으나, (1) 사용자 발사 프롬프트가 "한국식 빨↑/파↓ 캔들"을 명시했고 (2) 본 앱은 한국 투자자 대상 커뮤니티이며 (3) T08 handover 외에 주식 캔들 색에 대한 별도 프로젝트 규칙 문서가 없음. 한국 트레이딩 앱 관례(빨↑/파↓)에 맞춰 `kr` 통일. **만약 US 종목에 미국식(녹↑/빨↓)이 필요하면** StockChart 상단 상수를 `getCandleColors('us')`로 바꾸거나 symbol 기반 분기를 추가하면 됨.

## 보존한 보조지표 색 (사유)

라이트 배경(#ffffff)에서 대비가 충분하여 **데이터 식별 색으로 보존** — 지시서 보존 원칙(line 45) 및 line 38 가이드 준수:

| 지표 | 색 | 대비 판단 |
|------|-----|-----------|
| RSI 라인 | `#9c27b0` (보라) | 충분 |
| MACD 라인 | `#2962FF` (파랑) | 충분 |
| MACD signal 라인 | `#FF6D00` (주황) | 충분 |
| MA7 | `#E91E63` (핑크) | 충분 |
| MA25 | `#2196F3` (파랑) | 충분 |
| MA99 | `#FFEA00` (노랑) | ⚠ 흰 배경 대비 약함 — 아래 잔여 참고 |
| BB 상/하단 | `rgba(0,150,136,0.5)` (청록) | 충분 |
| BB 중앙 | `rgba(255,179,0,1)` (앰버) | 충분 |
| DetailedChart 평단가 라인 | `#2962FF` (파랑 점선) | 충분 (단, KR 하락색 #0050cb과 색상이 비슷 — 라벨/점선으로 구분됨) |

## 하드코딩 잔여 (의도적 보존 — 후속 판단 필요)

지시서 산출물은 **캔들 up/down/wick + layout/grid/timeScale**만 명시했으므로 아래는 본 task 범위 밖으로 보존했으나, 한국식 캔들과의 일관성 관점에서 **후속 정렬 권장**:

1. **볼륨 막대 방향 색** (CryptoChart/StockChart 메인 차트)
   - 상승봉 `rgba(38,166,154,0.5)`(녹), 하락봉 `rgba(239,83,80,0.5)`(빨) — `close >= open` 기준.
   - ⚠ 캔들은 빨↑/파↓(한국식)인데 볼륨은 녹↑/빨↓(서양식)이라 **방향 색 불일치**. 한국식 통일 시 상승=`rgba(186,26,26,.5)`/하락=`rgba(0,80,203,.5)` 권장.
   - 위치: CryptoChart `data-fetch effect`의 volData color, StockChart 동일.
2. **MACD 히스토그램 +/− 색** (CryptoChart/StockChart MACD 차트)
   - 양봉 `#26a69a`(녹)/음봉 `#ef5350`(빨). MACD 모멘텀 색은 보편적으로 녹/빨을 쓰므로 보존 가능하나, 캔들과 통일하려면 KR 색으로 교체 검토.
   - 위치: `histogram[i] >= 0 ? '#26a69a' : '#ef5350'`. (series 생성 시 base `#26a69a`는 매 막대 explicit color로 덮여 화면에 안 나타남)
3. **로딩/오버레이 CSS 클래스** (HTML 오버레이, createChart 옵션 아님 → 본 task 색상 범위 밖)
   - CryptoChart/StockChart 로딩 오버레이 `bg-gray-900 bg-opacity-80`, `text-blue-400` — 라이트 차트 위 잠깐 노출되는 다크 로딩막.
   - hero-chart 오버레이: 심볼 텍스트 `text-white`(라이트 카드 위에서 가독성 ↓), `bg-black/40` 버튼 패널 — **R1 라이트화 이전부터 존재하던 잔재**(차트가 transparent였을 때부터 흰 텍스트가 라이트 `bg-card` 위에 있었음). 본 변경이 새로 깨뜨린 것 아님.
   - DetailedChart 오버레이 `bg-black/50 text-white`(반투명 검정 박스라 흰 텍스트 가독성 유지됨), `border-gray-700/800`.
   - → 이들 CSS 오버레이는 별도 라이트화 후속(다른 라운드/컴포넌트 CSS 작업)에서 처리 권장.

## 검증 결과

| 항목 | 명령 | 결과 |
|------|------|------|
| 타입 | `npx tsc --noEmit` | **에러 0** |
| 헬퍼 적용 | `grep getChartTheme\|getCandleColors components/` | **4/4 파일** (각 3행: import+상수2) |
| 다크 리터럴 잔여 | `grep '#1E1E1E\|#2B2B43\|#D9D9D9' components/` | **0** |
| ESLint (4파일) | `npx eslint <4파일>` | 신규 이슈 0. 보고된 2 errors(`prefer-const` on `entry`, 91/82행)·warnings(catch `e` 미사용, `lang` 의존성)는 모두 **수정 무관 기존 코드**(ResizeObserver 루프·data-fetch effect). |
| 빌드 | `npm run build` | **Compiled successfully** (전체 라우트 생성 완료. T08 시점 `bcryptjs` 미설치 이슈는 R1에서 해소됨) |

### 시각 검증 방법 (권장)

`npm run dev` 후:
- `/` (홈 히어로): 차트가 흰 배경 + 짙은 텍스트 + 빨↑/파↓ 캔들. ⚠ 단, 히어로 심볼 텍스트(`text-white`)는 위 잔여 #3 참고.
- `/analysis/[symbol]` (상세): DetailedChart 흰 배경 + 빨/파 캔들 + 파란 평단가 점선.
- `/market`, `/stock`: 차트 흰 배경 + 빨/파 캔들 (StockChart는 `/stock`).
- CryptoChart는 현재 analysis 페이지에서 주석 처리(SSOT)되어 라이브 미렌더 — 코드/타입 검증으로 갈음.

## 안티패턴 준수 확인

- ✅ `lib/chart/theme.ts` 미수정 (T08 SOT).
- ✅ `app/`, 기타 `components/*`(Chart/DetailedChart/hero-chart 외) 미수정.
- ✅ 차트 데이터 로직(시리즈 데이터 계산·indicators 호출) 불변 — 색상/테마만 변경.
- ✅ 다크 모드 토글 미추가.
- ✅ 새 패키지 미설치.

## 다음 일꾼/라운드 권장

1. (선택) 볼륨 막대·MACD 히스토그램 방향 색을 KR 스킴으로 정렬하여 캔들과 일관화.
2. (선택) hero-chart 오버레이 `text-white` 심볼·`bg-black/40` 버튼 패널, 로딩 오버레이 다크 클래스를 라이트 토큰으로 정리.
3. (선택) MA99 `#FFEA00`(노랑) 흰 배경 대비 보강 — 더 짙은 앰버 검토.
