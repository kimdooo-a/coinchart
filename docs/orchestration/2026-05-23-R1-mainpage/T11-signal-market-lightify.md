# T11 — signal-market-lightify

> **본 터미널은 R1 일꾼(T11)**. T08 완료 후 발사.

## 정체성

- 역할: `worker` (T11), R1, mainpage
- 담당: 시그널·마켓·주식 마켓 페이지 라이트화 (`app/signal/`, `app/market/`, `app/stock-market/`)
- 의존: T08

## 컨텍스트

T09(블로그), T10(analysis)과 동일한 라이트화 작업. 본 일꾼은 도구 메뉴의 나머지 3개 페이지 그룹을 처리한다. 시그널/마켓 페이지는 실시간 데이터 + 차트가 핵심이므로 차트 옵션 교체는 동일하게 T08 산출물 사용.

## 공통 SOT

```
CLAUDE.md
app/globals.css
docs/orchestration/2026-05-23-R1-mainpage/T08-chart-theme-editor-tone.md
docs/handover/2026-05-23-R1-T08-chart-theme-editor-tone.md
lib/chart/theme.ts                 ← T08 산출물 (수정 금지)
docs/orchestration/2026-05-23-R1-mainpage/T09-blog-lightify.md   (매핑 표 참고)
docs/orchestration/2026-05-23-R1-mainpage/T10-analysis-lightify.md
```

## 작업 목표

`app/signal/*`, `app/market/*`, `app/stock-market/*`의 다크 톤 클래스를 라이트 토큰으로 교체 + 차트 옵션을 `getChartTheme("light")` + `getCandleColors("kr")`로 교체.

## 산출물

대상:
- `app/signal/page.tsx`
- `app/signal/[symbol]/page.tsx` (있다면)
- `app/market/page.tsx`
- `app/market/[symbol]/page.tsx` (있다면)
- `app/stock-market/page.tsx`
- `components/Signal/*.tsx` (있다면)
- `components/Market/*.tsx` (있다면)
- `components/Stock/*.tsx` (있다면)

### 클래스 교체 매핑

T09와 동일.

### 차트 옵션 교체

T10과 동일 패턴. `getChartTheme("light")` + `getCandleColors("kr")` 적용.

## 작업 단계

1. `Grep`으로 다크 톤 + 차트 옵션 위치 조사
2. minimal diff
3. 검증

## 검증

```bash
npx tsc --noEmit

grep -rn "bg-zinc-\|bg-slate-\|text-white\|border-zinc-" app/signal/ app/market/ app/stock-market/ 2>&1
# 기대: 0건

grep -rn "getChartTheme\|getCandleColors" app/signal/ app/market/ app/stock-market/ components/Signal/ components/Market/ components/Stock/ 2>&1
# 기대: 1건 이상

# signal/market 로직 무손상
git diff --stat lib/signal_engine.ts lib/analysis.ts 2>&1
# 기대: 0

npm run build 2>&1 | tail -20
```

## 완료 신호

`docs/handover/2026-05-23-R1-T11-signal-market-lightify.md` 작성.

## 안티패턴

- `lib/signal_engine.ts`, `lib/analysis.ts`, `lib/probability/`, `lib/backtest/` 수정 금지
- `lib/chart/theme.ts` 수정 금지 (T08)
- `app/blog/`, `app/analysis/` 수정 금지 (T09·T10)
- JSX 구조·라우팅 변경 금지
