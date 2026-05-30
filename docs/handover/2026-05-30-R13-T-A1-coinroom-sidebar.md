# R13 / T-A1 — 코인룸·사이드바 시세 전역 구독 (인수인계)

> 일꾼 터미널 T-A1. 쓰기 영역: `components/community/`. 2026-05-30.
> 목표: 코인룸·사이드바 시세(가격·등락) 표시를 `useDisplaySettings()` 구독으로 전환(통화 USD↔KRW·등락색 KR↔GLOBAL 전역 적용).

## 1. 수정 파일 목록

| 파일 | 서버→클라 전환 | 변경 요약 |
|------|:---:|------|
| `components/community/CoinHero.tsx` | **예** (`'use client'` 신규) | 가격 `$${price.toLocaleString()}`→`formatPrice(data.price)`, 등락색 하드코딩→`changeColorClass(data.changePct)`, badge tint·sparkline stroke를 `changeColor` 모드(KR/GLOBAL) 분기로 정합 |
| `components/community/widgets/PriceTickerWidget.tsx` | **예** (`'use client'` 신규) | 로컬 `formatPrice`(통화 무시) 삭제→훅 `formatPrice` 사용(통화기호 포함, 앞 `$` 리터럴 제거), 등락색 하드코딩→`changeColorClass(it.changePct)` |
| `components/community/BoardSidebar.tsx` | — | **변경 없음**. 가격/등락 직접 렌더 없음 — PriceTickerWidget에 위임하는 단순 컨테이너(이미 `'use client'`). 하위 위젯 구독으로 자동 적용 |

## 2. 핵심 구현 노트

- **레퍼런스 준수**: `components/Watchlist/WatchlistTable.tsx`의 구독 패턴 그대로. `const { formatPrice, changeColorClass } = useDisplaySettings();` → 가격은 `formatPrice(usd)`, 등락색은 `changeColorClass(값)`.
- **하이드레이션 깜빡임 없음**: 서버 스냅샷=기본값(USD·KR)이라 SSR↔초기 클라 렌더 일치. `isHydrated` 게이팅 불필요(WatchlistTable과 동일).
- **CoinHero badge tint** (`trendBg`): Tailwind JIT가 정적 스캔하도록 **리터럴 클래스 4종**으로 분기(`bg-[var(--color-new)]/10`·`bg-[var(--color-kr-up)]/10`·`bg-[var(--color-positive)]/10`·`bg-[var(--color-kr-down)]/10`). 템플릿 문자열 동적 생성 금지(JIT 미탐지).
- **CoinHero sparkline stroke** (`sparkColor`): SVG 속성값이라 CSS 변수 직접 참조 가능 → 하드코딩 hex(`#BA1A1A`/`#0050CB`) 제거하고 `var(--color-*)` 런타임 해석으로 모드 정합.
- **색 토큰**(app/globals.css): KR 상승=`--color-kr-up`(#ba1a1a 빨)·하락=`--color-kr-down`(#0050cb 파) / GLOBAL 상승=`--color-new`(#03c75a 녹)·하락=`--color-positive`(#ba1a1a 빨).
- **거래량/시총**: CoinHero `formatUsd` 약식표기($T/$B/$M) **유지**(과제 명시 예외 — 통화 전환 대상 아님).

## 3. 부모 페이지 영향 (서버→클라 전환)

- `app/coin/[symbol]/page.tsx`(서버): `<CoinHero data={coin} analysisHref writeHref className />` — props 전부 직렬화 가능(plain 객체/문자열). 안전.
- `app/page.tsx`·`app/coin/[symbol]/page.tsx`: `<PriceTickerWidget items={...} />` — items는 plain 객체 배열. 안전.
- 두 페이지 모두 루트 `app/layout.tsx`의 `DisplaySettingsProvider` 하위 → `useDisplaySettings()` 정상 동작.
- **빌드 결과 코인룸 `/coin/[symbol]`은 여전히 ● SSG 프리렌더 유지** — 클라이언트 컴포넌트 전환이 SSG를 깨지 않음.

## 4. 검증 결과 (전부 PASS)

| 검증 | 결과 |
|------|------|
| `npx tsc --noEmit` | **exit 0** |
| `npx eslint <3파일>` | **exit 0** (`.eslintignore` deprecation 경고만, 에러 0) |
| `npm run build` | **exit 0** — `/`(홈)·`/coin/[symbol]`(코인룸) green |
| grep 잔재 확인 | 대상 3파일 시세 표시부에 `$$` USD 하드코딩·`text-[var(--color-kr-*)]` 등락색 하드코딩 **없음** |

> 빌드 1차 시도는 다른 일꾼 터미널의 동시 `next build`로 `.next\lock` 충돌(코드 무관) → 재시도 시 exit 0.

## 5. 미해결 / 후속 사항

- **범위 밖(의도적 제외)**: `components/community/widgets/FngGaugeWidget.tsx`(FNG 지수 delta 색)·`HotIssueWidget.tsx`(핫이슈 up/down 트렌드 색)에 `text-[var(--color-kr-*)]` 하드코딩 잔존. T-A1 선언 대상 3종이 아니며 코인 **시세(가격)** 표시부도 아님(FNG=심리지수, 핫이슈=트렌드). 색 체계 일관성 차원에서 `changeColorClass` 구독 후보지만 별도 태스크에서 판단 권장.
- CoinHero `formatUsd`(거래량/시총 약식)는 통화 전환 미적용 — 의도된 예외. KRW 모드에서 시총/거래량을 ₩ 환산하려면 후속 합의 필요(표 폭/약식표기 영향 검토 동반).
