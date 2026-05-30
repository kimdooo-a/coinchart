# T-A2 — 티커·김프 시세 전역 구독 (R13 / display-rollout / Wave1)

> 이 문서는 자기완결 통합 프롬프트다. 정독 후 그대로 실행하라.

## 0. 정체성

너는 R13의 **일꾼 터미널 T-A2**다. 지휘자가 아니다. 다른 일꾼(T-A1·T-B·T-C)의 작업을 건드리지 마라. 너의 쓰기 영역은 **`components/Chart/`·`components/Market/`** 뿐이다.

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
- `formatPrice(usdValue: number): string` — USD 기준 숫자를 현재 통화(USD/KRW)로 포맷
- `changeColorClass(changeValue: number): string` — 등락값 부호+색체계에 맞는 Tailwind 텍스트색 클래스
- `currency`·`changeColor`·`isHydrated`·`exchangeRate`

## 3. 작업 목표

너의 쓰기 영역에서 **시세(가격·등락)를 표시하는 부분**을 `useDisplaySettings()` 구독으로 전환한다.

### 대상 파일 (3종)

1. **`components/Chart/Ticker.tsx`** — 시세 티커 (crypto)
   - 가격 USD 하드코딩(`$`·`toLocaleString`) → `formatPrice()`
   - 등락 색 하드코딩 → `changeColorClass()`
   - 서버 컴포넌트면 `'use client'` 전환 필요(WatchlistTable·CoinHero 패턴 참고). 이미 `'use client'`면 훅만 추가.

2. **`components/Chart/StockTicker.tsx`** — 주식 티커
   - ⚠️ **주식 가격은 이미 원화(KRW)이거나 USD가 아닐 수 있다** — 현재 표시 단위를 먼저 확인하라. `formatPrice`는 USD 기준 입력을 가정한다.
   - 주식 가격이 KRW 네이티브면 통화 전환 대상이 아니다(이미 원화). 이 경우 **등락색만** `changeColorClass()` 구독으로 전환하고 가격 포맷은 기존 유지. 판단 근거를 handover에 명시.

3. **`components/Market/KimchiPremium.tsx`** — 김치 프리미엄
   - 김프는 한국 거래소 vs 글로벌 가격차(%) 표시. 가격 통화보다 **등락/프리미엄 색**이 핵심.
   - 프리미엄(+/-) 색을 `changeColorClass()` 구독으로 전환(현재 하드코딩 색이 있으면). 가격 표시가 있으면 통화 단위 확인 후 적절히.

### 원칙

- **시세(가격)만** 통화 전환. 단, 주식·김프는 단위(KRW 네이티브 여부)를 먼저 확인 — 잘못 환산하면 값이 1450배 틀어진다.
- 등락/프리미엄 **색**은 `changeColorClass` 구독(하드코딩 제거). 단 김프의 "김프=빨강/역프=파랑" 같은 의미색이 표시설정과 충돌하면 의미색 우선 보존하고 handover에 명시.
- `isHydrated` false 동안 기본값 렌더(깜빡임 방지) — WatchlistTable 패턴.

## 4. 검증

```
npx tsc --noEmit                         # exit 0
npx eslint components/Chart/Ticker.tsx components/Chart/StockTicker.tsx components/Market/KimchiPremium.tsx   # error 0
npm run build                            # 가능하면
```

## 5. 완료 신호

`docs/handover/2026-05-30-R13-T-A2-ticker-kimchi.md` 작성:
- 수정 파일 목록 + 각 변경 요약
- **StockTicker 가격 단위 판단**(KRW 네이티브 여부)과 그에 따른 처리 명시
- **KimchiPremium 의미색 vs 표시설정** 처리 명시
- 검증 결과(tsc/eslint/build PASS 증거)
- 미해결/후속 사항

## 6. 안티패턴

- `lib/config/display-settings.tsx` 수정 금지 (읽기 전용)
- `components/Chart/`·`components/Market/` 밖 수정 금지
- `lib/supabase/crypto.ts`↔`stock.ts` 교차 임포트 금지
- USD가 아닌 값에 `formatPrice` 적용하여 1450배 환산 오류 금지 — 단위 먼저 확인
- 신규 시세 fetch API 생성 금지
- 검증 미실행 PASS 주장 금지
