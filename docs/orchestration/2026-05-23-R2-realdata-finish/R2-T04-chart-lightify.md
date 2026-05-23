# R2-T04 — chart-lightify

> **본 터미널은 R2 일꾼(R2-T04)**. 1차 발사. 동시 발사 그룹.

## 정체성

- 역할: `worker` (R2-T04), R2, realdata-finish
- 담당: TradingView Lightweight Charts 컴포넌트 4종을 **하드코딩 다크 → T08 라이트 테마** 로 전환
- 의존: R1/T08 (`lib/chart/theme.ts`의 `getChartTheme`/`getCandleColors`)

## 컨텍스트

R1/T10·T11이 분석·시그널·마켓 페이지의 **CSS 클래스**는 라이트화했으나, 페이지 내부 실제 차트(`createChart` 호출 컴포넌트)는 여전히 하드코딩 다크 색상(`#1E1E1E` 배경·`#D9D9D9` 텍스트·`#2B2B43` 그리드·`#26a69a`/`#ef5350` 캔들)을 쓴다. T08이 `lib/chart/theme.ts`에 라이트 테마 헬퍼를 만들어 두었으므로, 본 일꾼이 4개 차트 컴포넌트에 적용한다.

대상 (전부 `getChartTheme` 미적용 확인됨):
- `components/Chart/CryptoChart.tsx`
- `components/Chart/StockChart.tsx`
- `components/DetailedChart.tsx`
- `components/hero-chart.tsx`

## 공통 SOT (읽기 전용)

```
CLAUDE.md
lib/chart/theme.ts                                   ← getChartTheme/getCandleColors (적용할 SOT, 수정 금지)
docs/handover/2026-05-23-R1-T08-chart-theme-editor-tone.md  ← 테마 헬퍼 시그니처·KR(빨↑/파↓)/US(녹↑/빨↓) 규칙 (필독)
docs/handover/2026-05-23-R1-T11-signal-market-lightify.md   ← "차트 옵션 교체는 R2" 인계 (line 51-61, 115)
docs/solutions/2026-05-23-lightweight-charts-v5-colortype-enum.md  ← v5 ColorType enum 주의
app/globals.css                                      ← 라이트 토큰 (CSS 변수 참고)
```

## 작업 목표

각 차트의 하드코딩 `layout.background`/`textColor`/`grid` 색상을 `getChartTheme("light")` 결과로, 캔들 up/down/wick 색상을 `getCandleColors(market)`로 교체. 시장 구분: crypto 차트는 한국식(`"kr"`, 빨↑/파↓), 주식 차트(`StockChart`)는 프로젝트 규칙 확인 후 적용(T08 handover 기준).

### 산출물 (수정 4)

- `components/Chart/CryptoChart.tsx`: `colors` 기본값(#1E1E1E 등)·`createChart` layout/grid·candlestick up/down/wick·RSI/MACD 보조차트 layout/grid를 테마 헬퍼로 교체. (보조지표 라인 색 #9c27b0/#2962FF 등은 데이터 시각화 색이라 보존 가능 — handover 판단)
- `components/Chart/StockChart.tsx`: 동일 패턴, market 구분 적용
- `components/DetailedChart.tsx`: 동일
- `components/hero-chart.tsx`: 동일 (홈 히어로 차트)

### 보존 원칙

- 보조지표 라인 색(MA7/25/99, RSI, MACD signal 등)은 **데이터 식별 색**이라 라이트 배경에서 대비 충분하면 보존. 대비 부족 시만 조정.
- 캔들 up/down은 반드시 `getCandleColors`로 (한국식 빨↑/파↓ 규칙 일관성).

## 작업 단계

1. SOT 정독 (T08 handover + theme.ts 필독, v5 ColorType solution 확인)
2. `getChartTheme`/`getCandleColors` import + 시그니처 확인
3. CryptoChart부터 적용 → 나머지 3종
4. 보조차트(RSI/MACD) layout/grid도 동일 테마
5. 보조지표 라인 색 대비 점검
6. 검증 (빌드 + 시각)

## 검증

```bash
npx tsc --noEmit                                          # 0 error

# 4개 차트에서 getChartTheme/getCandleColors 적용
grep -rln "getChartTheme\|getCandleColors" components/Chart/ components/DetailedChart.tsx components/hero-chart.tsx
# 기대: 4개 파일 전부

# 하드코딩 다크 배경/그리드 잔여 (기대 0 또는 보존 사유 명시)
grep -rn "#1E1E1E\|#2B2B43\|#D9D9D9" components/Chart/ components/DetailedChart.tsx components/hero-chart.tsx

npm run build 2>&1 | tail -20                             # Compiled successfully
```

시각 검증(권장): `npm run dev` → `/`(히어로), `/analysis/btc`(상세), `/market`·`/stock` 차트가 흰 배경 + 짙은 텍스트 + 한국식 빨/파 캔들인지 확인.

## 완료 신호

`docs/handover/2026-05-23-R2-T04-chart-lightify.md` 작성. 명시: 수정 4파일·테마 헬퍼 적용 위치·캔들 색 규칙(market별)·보존한 보조지표 라인 색 사유·하드코딩 잔여(있다면)·시각 검증 방법.

## 안티패턴

- `lib/chart/theme.ts` **수정 금지** (T08 SOT — 헬퍼가 부족하면 handover에 기록 후 보존)
- `app/`, 다른 `components/*` (Chart/DetailedChart/hero-chart 외) **수정 금지**
- 차트 데이터 로직(시리즈 데이터 계산·indicators 호출) 변경 금지 (색상/테마만)
- 다크 모드 토글 추가 금지
- 새 패키지 설치 금지
