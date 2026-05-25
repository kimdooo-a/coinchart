# R7-3 / R7-4 — 차트 라인·오버레이 색 KR 정렬 + 토큰 bg-/border- 변형 점검

> 날짜: 2026-05-25 · 라운드: R7 후보 3·4번 · 역할: 일꾼

## 작업 범위

R6에서 차트 **히스토그램**(T04)·**텍스트 토큰**(T05)까지 정렬됐고, 그 잔여인 **라인 색**과 **bg-/border- 토큰 변형**을 마감.

- **3번**: 차트 지표 **라인** 색(RSI/MACD/MA/BB) + hero/차트 **CSS 오버레이** KR 라이트 정렬
- **4번**: 토큰 `bg-`/`border-` 변형 전수 점검 (T05는 `text-` 중심)

## R7-3 — 차트 라인/오버레이

### 결정: 식별색 보존 + SOT 이관 + 가독성 보강 (사용자 확정)

지표 라인(RSI/MACD/MA7·25·99/BB)은 **방향(상승/하락)이 아니라 지표를 서로 구분하는 식별색**이다(MA7·25·99 세 선을 빨/파로 통일하면 구분 불가). R6 T04도 "데이터 식별"로 의도 보존. → **색 의미는 유지**하되 (a) 중복 하드코딩을 `theme.ts` SSOT로 모으고, (b) 흰 배경에서 안 보이는 색만 가독성 교체.

### 변경

| 파일 | 변경 |
|------|------|
| `lib/chart/theme.ts` | **`INDICATOR_COLORS` + `getIndicatorColors()` 신규**. rsi `#9c27b0`·macd `#2962FF`·signal `#FF6D00`·ma7 `#E91E63`·ma25 `#2196F3`·**ma99 `#FFEA00`→`#c79100`**(노랑→진앰버, 흰 배경 대비 보강)·**bbBand `rgba(0,150,136,0.5→0.6)`**(가독 소폭 보강)·bbBasis `rgba(255,179,0,1)`·avgPrice `#0050cb`(brand primary 정렬) |
| `components/Chart/CryptoChart.tsx` | 라인색 9건 → `IND.*` 참조(`getIndicatorColors`). 로딩 오버레이 `bg-gray-900/80`+`text-blue-400`+`bg-red-900/50` → `bg-surface/70`+`text-primary`+`bg-error-container/text-on-error-container` |
| `components/Chart/StockChart.tsx` | 동일 (라인색 9건 + 로딩 오버레이 라이트화) |
| `components/DetailedChart.tsx` | 평단가 점선 `#2962FF`→`IND.avgPrice`. 라벨 오버레이 `bg-black/50 border-gray-700`+`text-white` → `bg-surface/80 border-outline-variant`+`text-on-surface` |
| `components/hero-chart.tsx` | **심볼 `text-white`→`text-on-surface`**(흰 차트 배경에서 안 보이던 핵심 버그). 코인 패널 `bg-black/40 border-white/10`→`bg-surface/80 border-outline-variant`. 선택 버튼 글로우 오렌지`rgba(255,87,51)`→primary`rgba(0,80,203)`. LIVE `text-green-400`→`text-green-600`(흰 배경 가독) |

**범위 밖 보존**: 라인 색 의미(식별)·캔들/히스토그램/볼륨(R6 T04 완료)·RSI 히트맵 셀 색(R1/T11 의미색).

## R7-4 — 토큰 bg-/border- 변형 점검

### 결론: 점검 결과 **정상**, 추가 치환 불요 (코드 변경 없음 — 차트 영역은 3번에 귀속)

| 점검 | 결과 |
|------|------|
| shadcn 별칭 매핑 | `--color-{background,card,popover,muted,accent,border,input,ring,...}`이 globals.css `@theme`에 **라이트 디자인 토큰으로 전부 매핑**(예 `--color-muted: var(--color-surface-container)`, `--color-border: var(--color-outline-variant)`). → `bg-muted`/`border-border` **172건 시각 정상**. 전면 치환은 diff 노이즈·시각 회귀만 유발하므로 불요(R6 T05 "별칭 보존" 정책 유지) |
| R6 T05 누락 | `text-muted-foreground` 잔여 **0건**(ui/ 밖) — T05 완결 |
| 비정상 변형 | `bg-/border-muted-foreground` **0건** |
| 깨진(미정의) 토큰 | 3번에서 사용한 `surface`/`error-container`/`on-error-container`/`outline-variant`/`on-surface`/`primary` 전부 `@theme` 정의 확인 |

### 후속 권장 (4번 범위 밖)

라이트 환경에서 깨지는 **다크 하드코딩**이 페이지 컴포넌트에 잔존(R1~R3 라이트화 누락분, 토큰 변형 아님):
`about-section`(`bg-black/50`·`text-white` — 배경 이미지 위 의도 여부 확인 필요), `AuthButton`(`bg-gray-900/80`), `Chart/StockTicker`·`Chart/Ticker`(`bg-gray-900/50 border-gray-800`), `InsufficientData`(`bg-gray-900`), `PremiumLock`(`bg-gray-900 bg-black/40`), `LanguageSwitcher`(`bg-gray-900/80`), `dashboard-grid`(`bg-black/20`·`text-white` 이미지 오버레이 — 의도 여부 확인). → **별도 라이트화 라운드**에서 라이트/다크 의도 판별 후 처리 권장.

## 검증

- `npx tsc --noEmit` **0 에러**
- `npm run build` **green** (`/coin/[symbol]` ● SSG 6종, `/board/*`·`/news` ƒ, 나머지 ○ Static, Middleware Proxy 정상)
- grep: 차트 잔여 하드코딩 라인색 **0**, `IND.` 참조 CryptoChart 9·StockChart 9·DetailedChart 1, 차트 다크 오버레이 잔여 **0**

## 주의 (커밋)

작업 시점 워킹트리에 **세션 32(R7 1·2번) 미커밋 산출물**이 공존:
`e2e/auth.setup.ts`·`e2e/community-admin-auth.spec.ts`·`supabase/backfill_schema_migrations.sql`·`docs/db/R4-db-apply-runbook.md`·`docs/handover/next-dev-prompt.md`.
→ R7-3/4 산출물(`lib/chart/theme.ts` + `components/Chart/{CryptoChart,StockChart}.tsx` + `components/{DetailedChart,hero-chart}.tsx` + 본 handover)과 **파일이 겹치지 않으므로** 분리 커밋 가능. 통합/커밋은 지휘자(또는 사용자) 판단.
