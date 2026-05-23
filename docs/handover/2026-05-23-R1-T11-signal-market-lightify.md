# R1-T11 인수인계 — signal-market-lightify

- **날짜**: 2026-05-23
- **라운드/일꾼**: R1 / T11 (mainpage)
- **상태**: 완료
- **의존**: T08 (`getChartTheme("light")`, `getCandleColors("kr")`, `lib/chart/theme.ts`) — 단, 차트 옵션 호출은 본 영역에 부재 (아래 "차트 옵션" 절 참조)
- **선행 참조**: T09(blog-lightify) 클래스 매핑 표, T10(analysis-lightify) 차트 패턴·핸드오버

## 수정 파일 (6개)

| 파일 | 변경 라인(+/-) | 비고 |
|------|---------------|------|
| `app/signal/page.tsx` | 5/5 | 시그널 스캔 상태·빈 상태·푸터 텍스트 |
| `app/market/page.tsx` | 15/15 | 게이지 라벨·기준 토글·코인 무드 그리드·AI 인사이트·히스토리 |
| `components/Signal/WhaleAlert.tsx` | 7/7 | 고래 경보 카드(중립 surface)·금액/주소/시각 텍스트 |
| `components/Market/KimchiPremium.tsx` | 13/13 | 컨테이너·테이블 헤더·스켈레톤·행 hover·셀 텍스트·각주 |
| `components/Market/RSIHeatmap.tsx` | 4/4 | 컨테이너·제목·스켈레톤·각주 (히트맵 셀 색상 보존) |
| `components/Stock/StockSectorPerformance.tsx` | 1/1 | RSI 프로그레스 바 트랙 |

`git diff --stat` 합계: **45/45 인서션·삭제** — 정확히 좌우 대칭. 순수 클래스 토큰 교체만 발생했음을 의미.

## 수정 불필요로 확정한 파일 (4개)

| 파일 | 사유 |
|------|------|
| `app/stock-market/page.tsx` | 다크 톤 부재. 색상은 `getColor(score)` 시맨틱 함수 사용 |
| `components/Stock/InvestmentQuotes.tsx` | 다크 톤 부재 |
| `components/Stock/StockAnalysisPanel.tsx` | 다크 톤 부재 |
| `components/Stock/StockRSIHeatmap.tsx` | 이미 shadcn 시맨틱 토큰(`bg-card`, `text-foreground`, `bg-muted`, `text-muted-foreground`, `bg-accent`)으로 라이트화 완료. 잔여 `text-white`(라인 73-74)는 강조 범례 뱃지(`bg-destructive`/`bg-green-600`) 위 보존 대상 |

## 클래스 교체 매핑 (T09/T10 베이스 동일)

| 다크 톤 | 라이트 토큰 |
|---|---|
| `bg-gray-900` | `bg-surface-container-lowest` |
| `bg-gray-800` | `bg-surface-container` |
| `bg-gray-800/40`, `bg-gray-800/50` | `bg-surface-container/40`, `bg-surface-container/50` |
| `bg-gray-700` (프로그레스 트랙) | `bg-surface-container-high` |
| `text-gray-200`, `text-gray-300` | `text-on-surface` |
| `text-gray-400`, `text-gray-500`, `text-gray-600` | `text-on-surface-variant` |
| `text-white` (다크 surface 위 텍스트) | `text-on-surface` |
| `hover:text-white` | `hover:text-on-surface` |
| `border-gray-700`, `border-gray-800` | `border-outline-variant` |
| `border-gray-800/50` | `border-outline-variant/50` |
| `hover:bg-white/5` (다크용 미세 hover) | `hover:bg-on-surface/5` |
| `bg-indigo-600/bg-rose-600 text-white` (선택 토글) | **보존** |
| `bg-red-900/20`, `bg-green-900/20` 등 정보 카드 강조 | **보존** |
| RSI 히트맵 셀 색상(`bg-red-600/orange-500/gray-600/teal-600/green-600` + `text-white`) | **보존** (의미론적 데이터 시각화) |
| 범례 뱃지 `bg-red-600/green-600/destructive text-white` | **보존** |

## 차트 옵션 교체 (T11 spec line 47-49)

**본 일꾼 영역(`app/signal/`, `app/market/`, `app/stock-market/`, `components/Signal/`, `components/Market/`, `components/Stock/`)에는 `createChart` / `addCandlestickSeries` / `getChartTheme` / `getCandleColors` / `lightweight-charts` 호출이 일절 존재하지 않습니다.**

```bash
grep -rn "getChartTheme\|getCandleColors\|createChart\|addCandlestickSeries" \
  app/signal/ app/market/ app/stock-market/ components/Signal/ components/Market/ components/Stock/
# → No matches
```

T10과 동일하게 차트는 외부 컴포넌트(`components/Chart/*`, `components/DetailedChart.tsx` 등)로 위임됨. 따라서 `getChartTheme("light")` + `getCandleColors("kr")` 적용은 **본 일꾼 범위 밖**(검증 기대치 "1건 이상"은 영역 외 사유로 0건 — T10 핸드오버 line 50-61과 동일 구조). T08 handover line 94의 후속 작업(`components/Chart/CryptoChart.tsx`, `StockChart.tsx`, `DetailedChart.tsx`, `hero-chart.tsx`)이 별도 라운드에서 처리되어야 페이지 안의 실제 차트도 라이트 톤으로 완성됨.

## 시그널/분석 로직 무손상 확인

```bash
git diff --stat lib/signal_engine.ts lib/analysis.ts lib/probability/ lib/backtest/ lib/chart/theme.ts
# → (출력 없음 = 0 변경)
```

T11 spec 안티패턴 line 81의 보호 대상 일체 **무변경**. 시그널 엔진·분석 엔진·확률·백테스트·차트 테마(T08 산출물) 모두 손대지 않음.

## 검증 결과

| 항목 | 결과 |
|------|------|
| `npx tsc --noEmit` | **PASS** (에러 0건. T10 핸드오버에서 언급된 `bcryptjs` 사전 이슈는 후속 세션에서 해소되어 현재 클린) |
| 다크 톤 surface 잔여 (`bg-gray-9/8/700`, `text-gray-[1-6]`, `border-gray-`, `bg-zinc/slate`, `hover:text-white`, `prose-invert`) | **PASS** (0건) |
| 잔여 `text-white` (강조 bg 위 보존분만) | 9건 전부 강조 컬러 위 (indigo-600/rose-600 토글, red-600/green-600/destructive 범례, RSI 히트맵 셀) — 의도적 보존 |
| 라이트 토큰 사용 (`bg-surface\|text-on-surface\|border-outline`) | 6개 파일 다수 매칭 |
| 시그널/분석 로직 6개 경로 `git diff --stat` | **PASS** (0 변경) |
| 차트 옵션 호출 검사 | 0건 (영역 외, T10과 동일) |
| `git diff --stat` 본 영역 | 6 files, **45/45** (좌우 대칭) |
| `npm run build` | **PASS** (`/signal`, `/market`, `/stock-market` 모두 ○ 정적 프리렌더, 빌드 에러 0건) |

## 의도적으로 남긴 다크 톤 / 강조 색

| 위치 | 클래스 | 사유 |
|------|--------|------|
| `app/market/page.tsx:392,398` | `bg-indigo-600 text-white`, `bg-rose-600 text-white` | 일간/실시간 기준 토글 선택 상태 강조 — 짙은 강조 컬러 위 흰 글씨 가독성 |
| `components/Signal/WhaleAlert.tsx:92-93` | `bg-red-900/20 border-red-900/50`, `bg-green-900/20 border-green-900/50` | INFLOW/OUTFLOW 정보 카드 의미 컬러 시스템 (T10과 동일 보존 원칙) |
| `components/Signal/WhaleAlert.tsx:98-100` | `bg-red-500/20 text-red-400` 등 아이콘 뱃지 | 거래 방향 의미 컬러 |
| `components/Market/KimchiPremium.tsx:92-95` | `bg-red-900/50`, `bg-orange-900/50`, `bg-blue-900/50`, `bg-green-900/50` | 김프 등급 뱃지 의미 컬러 |
| `components/Market/RSIHeatmap.tsx:55-59` | `getRSIColor`의 `bg-red-600/orange-500/gray-600/teal-600/green-600` | **RSI 히트맵 셀 색상** — 채도 높은 데이터 시각화. 셀 위 `text-white`(라인 91-92)와 `text-white/70 bg-black/20`(라인 93)도 채색 셀 위 가독성 위해 보존. 중립값 `bg-gray-600`도 다른 셀과 동일 채도 체계로 유지 |
| `components/Market/RSIHeatmap.tsx:73-74` | `bg-red-600 text-white`, `bg-green-600 text-white` | Hot/Cold 범례 뱃지 강조 |
| `components/Stock/StockSectorPerformance.tsx:135` | `bg-red-500/green-500/blue-500` (프로그레스 채움) | RSI 상태 의미 컬러 (트랙 `bg-gray-700`만 라이트화) |

## 시각 회귀 검증 안내 (PARTIAL)

`npm run build` 성공 확인. 시각 회귀는 dev 서버에서 수동 확인 권장:

```bash
npm run dev
```

확인 페이지:
- `/signal` — 헤더 라이브 인디케이터, 스캔 애니메이션 + 텍스트(`text-on-surface-variant`), 빈 상태 카드(`bg-card/50`), WhaleAlert 카드(중립 카드 `bg-surface-container/40`, 금액/주소 `text-on-surface`) 가독성
- `/market` — 게이지 2개(`bg-card`), 일간/실시간 토글(선택 강조 보존), 코인 무드 그리드(심볼 `text-on-surface`), AI 인사이트 카드(`bg-surface-container/50`), 김프(`KimchiPremium`)·RSI 히트맵(`RSIHeatmap`) 컴포넌트
- `/stock-market` — 본래 다크 톤 부재(시맨틱 토큰 기반)이므로 회귀 없음. `StockRSIHeatmap`/`StockSectorPerformance` 트랙 라이트 톤 확인

영역 외 의존:
- `KimchiPremium`/`RSIHeatmap`은 `/market` 페이지에서만, `StockRSIHeatmap`/`StockSectorPerformance`는 `/stock-market`에서 렌더. 페이지 자체가 라이트 친화 토큰을 쓰므로 컴포넌트 라이트화로 톤 통일 완료.

## 알려진 제약

1. **차트 라이트 옵션 교체 미수행** — 본 일꾼 범위 밖. 위 "차트 옵션 교체" 절 참조. `components/Chart/*`, `components/DetailedChart.tsx` 등에 `getChartTheme("light")` + `getCandleColors("kr")` 적용은 후속 라운드 과제 (T08 handover line 94 후속 목록).
2. **RSI 히트맵 셀 채도 보존** — `bg-gray-600`(중립)을 라이트 surface로 바꾸지 않음. 셀 위 흰 글씨 가독성과 데이터 시각화 일관성을 위해 채도 높은 색상 체계 유지가 옳다고 판단(red/orange/teal/green-600과 동일 레벨).
3. **`StockRSIHeatmap.tsx`의 두 토큰계 공존** — 이 파일은 shadcn 시맨틱 토큰을, 본 일꾼이 교체한 파일들은 `bg-surface-container-*`/`text-on-surface*` 토큰을 사용. T10 핸드오버 line 123과 동일하게 R2에서 한 시스템으로 통일 검토 권장.

## 후속 권장사항

- (R2) `components/Chart/Ticker.tsx`, `components/DetailedChart.tsx`, `components/hero-chart.tsx`에 `getChartTheme("light")` + `getCandleColors("kr")` 적용 → `/analysis/*`·`/coin/*`·홈 차트까지 라이트화 완성.
- (R2) `bg-surface-container-*` 토큰과 shadcn `bg-card`/`bg-muted` 토큰의 시각 일관성 검토 및 단일 시스템 통일.
