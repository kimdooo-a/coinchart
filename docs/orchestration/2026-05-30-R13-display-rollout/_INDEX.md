# R13 — display-rollout 라운드 인덱스

> 라운드: R13 · 태그: display-rollout · 작성: 2026-05-30 · 지휘자(CEO) 세션
> 선행: R12 watchlist/settings 마감(`2d6593e`). 본 라운드는 R12 후속 4종.

## 목적

R12에서 구축한 `DisplaySettingsProvider`(루트 마운트)·`useWatchlist`·watchlist API·AuthButton 기반 위에:
1. **전역 시세 표시 통일**(통화 USD↔KRW·등락색 KR↔GLOBAL) — watchlist 표만 구독 중인 것을 시세 컴포넌트 전역으로 확산
2. **watchlist 후속**(notice 토스트·reorder 영속화·clear 벌크삭제·런타임 스모크)
3. **AuthButton 계정 드롭다운 UX**

## 매트릭스

| 코드 | 작업 | 쓰기 영역 (격리 SOT) | Wave | 의존성 |
|------|------|---------------------|------|--------|
| **T-A1** | 코인룸·사이드바 시세 구독 (CoinHero·PriceTickerWidget·BoardSidebar) | `components/community/` | 1 | 독립 |
| **T-A2** | 티커·김프 시세 구독 (Ticker·StockTicker·KimchiPremium) | `components/Chart/`·`components/Market/` | 1 | 독립 |
| **T-B** | watchlist 후속 (notice·reorder·clear·스모크) | `components/Watchlist/`·`components/hooks/`·`app/api/watchlist/` | 1 | 독립 |
| **T-C** | AuthButton 계정 드롭다운 UX | `components/AuthButton.tsx`·`components/account/`(신규) | 1 | 독립 |
| **배포** | Release 게이트(R10~R13 누적) — 지휘자 단독 | — | 2 | T-A1/A2/B/C 통합·커밋 후 |

**4 영역 전부 disjoint → Wave1 동시 발사 안전.** 배포는 지휘자가 통합 커밋 후 처리.

## 발사 순서

```
1차 (즉시·동시):  T-A1  T-A2  T-B  T-C
2차 (통합·커밋 후): 배포 (지휘자 단독)
```

## 공통 규약 (전 일꾼)

- 한국식 빨↑/파↓, 네이버 증권 톤(흰 배경·보더 1px·정보 밀도). 의미색 보존.
- **표시설정 SSOT**: `lib/config/display-settings.tsx` (R12/T-B 산출, 수정 금지·읽기 전용)
  - `useDisplaySettings()` → `{ currency, changeColor, formatPrice(usdValue), changeColorClass(changeValue), isHydrated, exchangeRate, setCurrency, setChangeColor }`
  - 순수 헬퍼(비-컴포넌트용): `formatDisplayPrice(usd, currency, rate)`, `getChangeColorClass(change, mode)`
  - **레퍼런스 구현(정석)**: `components/Watchlist/WatchlistTable.tsx` — 이 파일의 구독 방식을 그대로 따른다.
- Provider는 이미 `app/layout.tsx` 루트에 마운트됨 → 클라이언트 컴포넌트면 어디서든 `useDisplaySettings()` 호출 가능.
- 검증: `npx tsc --noEmit`(exit 0) · `npx eslint <변경파일>`(error 0) · 가능 시 `npm run build`.
- 완료: `docs/handover/2026-05-30-R13-T<코드>-<name>.md` 작성.

## 안티패턴 (금지)

- 자기 쓰기 영역 밖 파일 수정 (SSOT 교차 임포트·다른 일꾼 영역 침범)
- `lib/config/display-settings.tsx` 수정 (읽기 전용 SSOT)
- `lib/supabase/crypto.ts`↔`stock.ts` 교차 임포트 (ESLint no-restricted-imports)
- 신규 시세 fetch API 생성 (기존 `/api/coins/ticker`·`/api/kimchi` 재사용)
- "PASS 위장" — 검증 명령 실제 실행 없이 통과 주장 금지
