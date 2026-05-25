# T04 — 차트 방향색 KR 정렬 (볼륨·MACD 히스토그램 빨↑/파↓)

## 1. 컨텍스트
- 프로젝트: Crypto Chart Analysis — TradingView Lightweight Charts
- 작업 디렉토리: `F:\11_dev\260523 코인 차트분석`
- 본 터미널 역할: **T04 / 5** (R6-polish Wave 1) — 차트 보조 히스토그램 방향색 한국식 정렬
- 쓰기 영역(격리): `lib/chart/theme.ts`, `components/Chart/CryptoChart.tsx`, `components/Chart/StockChart.tsx`, `components/DetailedChart.tsx`, `components/hero-chart.tsx`

## 2. 배경
R2/T04에서 캔들 색은 한국식(상승 빨 `#ba1a1a` / 하락 파 `#0050cb`, `getCandleColors('kr')`)으로 통일됨. 그러나 **볼륨·MACD 히스토그램의 방향 색은 녹↑/빨↓(미국식)이 잔존**(R2/T04 handover가 "범위 밖 보존, 후속 권장"으로 명시). 본 작업은 이 히스토그램 방향색을 한국식 **빨↑/파↓**로 정렬한다.

## 3. 공통 SOT (읽기 전용)
- `lib/chart/theme.ts` — `KR_CANDLE_COLORS`(빨 `#ba1a1a`/파 `#0050cb`)·`getCandleColors` 기준 색 (현재 캔들만 정의)
- `docs/handover/2026-05-23-R2-T04-chart-lightify.md` — 캔들 라이트화 + 히스토그램 후속 권고 맥락
- `CLAUDE.md` — 한국식 빨/파 디자인 톤

## 4. 작업 목표

### Phase 1: 히스토그램 색 하드코딩 위치 탐색
대상 4파일 + lib에서 볼륨/MACD 히스토그램 방향색(녹/빨 hex) 하드코딩 검색:
```powershell
Select-String -Path components/Chart/*.tsx,components/DetailedChart.tsx,components/hero-chart.tsx,lib/chart/*.ts `
  -Pattern '#26a69a|#ef5350|#16a34a|#22c55e|#dc2626|#ef4444|green|red'
```
(녹↑ 계열: `#26a69a`·`#16a34a`·`#22c55e` / 빨↓ 계열: `#ef5350`·`#dc2626`·`#ef4444`)

### Phase 2: theme.ts에 히스토그램 색 헬퍼 추가
- `lib/chart/theme.ts`에 방향색 헬퍼 추가(예: `getHistogramColors(scheme)` 또는 `KR_DIRECTION_COLORS = { up:'#ba1a1a', down:'#0050cb' }`). 캔들 색(`KR_CANDLE_COLORS`)과 동일 hex 재사용으로 일관성 확보.

### Phase 3: 4컴포넌트 히스토그램 색 교체
- 볼륨 히스토그램: 상승봉(close≥open) → 빨 `#ba1a1a`, 하락봉 → 파 `#0050cb`.
- MACD 히스토그램: 양(+)/증가 → 빨, 음(-)/감소 → 파 (기존 녹/빨 의미를 빨/파로 매핑. 기존 양/음 분기 로직은 보존, 색만 교체).
- 하드코딩 hex를 theme.ts 헬퍼 참조로 교체.

### 범위 밖 (보존)
- RSI/MACD 라인·MA·BB 라인 색, CSS 오버레이는 **건드리지 말 것**(방향성 의미 히스토그램만).
- **className(토큰) 수정 금지** — T05 전담.

## 5. 도구 권장
- 직접 작성. lightweight-charts histogram series `color` 필드.

## 6. 의존성
- 독립. T05와 차트 컴포넌트 파일은 겹치나 다른 라인(차트 색 옵션 vs className).

## 7. 검증
```powershell
npx tsc --noEmit                       # 0
npm run build                          # green
# 녹색 방향색 잔존 0 확인 (히스토그램 영역)
Select-String -Path components/Chart/*.tsx,components/DetailedChart.tsx,components/hero-chart.tsx `
  -Pattern '#26a69a|#16a34a|#22c55e'   # 히스토그램 관련 0건 (라인/기타 의도 보존분은 handover에 구분 명시)
# KR 방향색 적용 확인
Select-String -Path lib/chart/theme.ts -Pattern '#ba1a1a|#0050cb'
```

## 8. 완료 신호
`docs/handover/2026-05-25-R6-T04-chart-colors.md` 작성. 포함: 히스토그램 색 before→after(파일·라인), theme.ts 헬퍼, 보존한 라인/오버레이 색 목록, tsc/build 결과, 4종 차트 모두 빨↑/파↓ 확인.

## 안티패턴
- ❌ 지정 5파일 밖 수정
- ❌ className/토큰 수정 (T05 침범)
- ❌ 방향성 의미 없는 라인·축·격자 색까지 무분별 교체 (히스토그램 방향색만)
- ❌ 한국어 주석 누락 / handover 누락
