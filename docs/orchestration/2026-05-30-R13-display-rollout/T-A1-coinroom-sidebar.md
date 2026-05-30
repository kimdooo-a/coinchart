# T-A1 — 코인룸·사이드바 시세 전역 구독 (R13 / display-rollout / Wave1)

> 이 문서는 자기완결 통합 프롬프트다. 정독 후 그대로 실행하라.

## 0. 정체성

너는 R13의 **일꾼 터미널 T-A1**이다. 지휘자가 아니다. 다른 일꾼(T-A2·T-B·T-C)의 작업을 건드리지 마라. 너의 쓰기 영역은 **`components/community/`** 뿐이다.

## 1. 컨텍스트

- 프로젝트: `F:\11_dev\260523 코인 차트분석` (Next.js 16 App Router·TS strict·Tailwind v4)
- v2.0 커뮤니티 피벗. 한국식 빨↑/파↓, 네이버 증권 톤(흰 배경).
- R12에서 표시 환경설정(통화 USD↔KRW·등락색 KR↔GLOBAL) Context를 구축하고 `app/layout.tsx` 루트에 `DisplaySettingsProvider`를 마운트했다. 현재 `WatchlistTable`만 구독 중. **이 라운드는 시세 표시 컴포넌트로 구독을 확산한다.**

## 2. 공통 SOT (읽기 전용 — 수정 금지)

| 파일 | 용도 |
|------|------|
| `lib/config/display-settings.tsx` | 표시설정 SSOT. `useDisplaySettings()` 훅 + 순수헬퍼 |
| `components/Watchlist/WatchlistTable.tsx` | **레퍼런스 구현(정석)** — 구독 방식을 그대로 따라라 |
| `docs/orchestration/2026-05-30-R13-display-rollout/_INDEX.md` | 라운드 인덱스·공통 규약 |

`useDisplaySettings()` 제공 값:
- `formatPrice(usdValue: number): string` — USD 기준 숫자를 현재 통화(USD/KRW)로 포맷 (`$1,234.56` 또는 `₩1,790,000`)
- `changeColorClass(changeValue: number): string` — 등락값 부호+색체계에 맞는 Tailwind 텍스트색 클래스
- `currency`·`changeColor`·`isHydrated`·`exchangeRate`

## 3. 작업 목표

너의 쓰기 영역 `components/community/`에서 **시세(가격·등락)를 표시하는 부분**을 `useDisplaySettings()` 구독으로 전환한다.

### 대상 파일 (3종)

1. **`components/community/CoinHero.tsx`** ⚠️ **현재 서버 컴포넌트** (`'use client'` 없음)
   - 현재: `$${data.price.toLocaleString()}` (USD 하드코딩), `trendColor = isUp ? "text-[var(--color-kr-up)]" : "text-[var(--color-kr-down)]"` (한국식 하드코딩)
   - **클라이언트 훅(`useDisplaySettings`)을 쓰려면 `'use client'` 전환이 필요**. 방법 2택:
     - (A) 파일 상단에 `'use client'` 추가 후 직접 구독. CoinHero는 props만 받는 순수 표시 컴포넌트라 'use client' 전환해도 무방(부모가 데이터 fetch).
     - (B) 가격/등락 표시 블록만 작은 클라이언트 하위 컴포넌트로 분리.
   - **권장: (A)** — 가장 단순. 전환 후 가격은 `formatPrice(data.price)`, 등락색은 `changeColorClass(data.changePct)`로 교체. sparkColor(SVG stroke hex)는 등락색과 정합되게 유지하되, KR/GLOBAL 모드에 따라 색이 바뀌도록 `changeColor` 분기 가능(선택).
   - `isHydrated`가 false인 동안(SSR/하이드레이션)은 기본값(USD·KR)으로 렌더되어 깜빡임 없음 — WatchlistTable과 동일 패턴.

2. **`components/community/widgets/PriceTickerWidget.tsx`** — 시세 스트립 위젯
   - 가격·등락 표시 부분을 `formatPrice`·`changeColorClass` 구독으로 전환. 이미 `'use client'`면 훅만 추가.

3. **`components/community/BoardSidebar.tsx`** — 사이드바 (PriceTickerWidget 등 포함)
   - 자체적으로 가격/등락을 직접 렌더하는 부분이 있으면 구독 전환. 단순 컨테이너면 하위 위젯이 구독하므로 변경 불필요할 수 있음 — 실제 코드 확인 후 판단.

### 원칙

- **시세(가격)만** 통화 전환 대상. 거래량(volume)·시총(marketCap)은 USD 표기 유지 가능(통화 전환 대상 아님 — 단, 일관성 위해 `formatPrice` 적용 여부는 표시 의미에 따라 판단. 거래량/시총은 기존 `formatUsd` 약식표기 유지 권장).
- 등락 **색**은 전부 `changeColorClass` 구독으로(하드코딩 `text-[var(--color-kr-*)]` 제거).
- 등락 **부호/화살표**(▲▼·+)는 값 기반이라 그대로.
- 서버 컴포넌트를 클라이언트로 전환할 때 부모(페이지)에서 직렬화 불가 prop을 넘기지 않는지 확인(현재 props는 전부 직렬화 가능 — 안전).

## 4. 검증

```
npx tsc --noEmit                         # exit 0
npx eslint components/community/CoinHero.tsx components/community/widgets/PriceTickerWidget.tsx components/community/BoardSidebar.tsx   # error 0
npm run build                            # 가능하면. 코인룸/홈 라우트 green 확인
```

grep로 잔재 확인: `components/community/` 내 시세 표시부에 `\$\$\{` USD 하드코딩·`text-\[var\(--color-kr-` 등락색 하드코딩이 남지 않았는지(거래량/시총 약식표기는 예외).

## 5. 완료 신호

`docs/handover/2026-05-30-R13-T-A1-coinroom-sidebar.md` 작성:
- 수정 파일 목록 + 각 변경 요약 (서버→클라 전환 여부 명시)
- 검증 결과(tsc/eslint/build PASS 증거)
- CoinHero 'use client' 전환 시 부모 페이지 영향 여부
- 미해결/후속 사항

## 6. 안티패턴

- `lib/config/display-settings.tsx` 수정 금지 (읽기 전용)
- `components/community/` 밖 수정 금지 (다른 일꾼 영역)
- 신규 시세 fetch API 생성 금지
- 거래량/시총까지 무리하게 통화 전환하여 표가 깨지지 않게 — 가격 우선
- 검증 미실행 PASS 주장 금지
