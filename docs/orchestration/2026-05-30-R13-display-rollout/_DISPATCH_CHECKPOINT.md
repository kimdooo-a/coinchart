# Dispatch Checkpoint — R13 display-rollout

- round: R13
- tag: display-rollout
- started_at: 2026-05-30 (지휘자 새 세션)
- terminals: 4 (평면 flat — Wave1 T-A1/A2/B/C 동시) + 배포(지휘자 Wave2)
- hierarchy: flat (CEO + 일꾼 4)
- status: **Phase 4 완료 — 4종 회수·통합검증 PASS·dev500 핫픽스(@source not docs)·레퍼런스 갱신. 통합 커밋→배포(Wave2) 진행.**
- reclaimed: R12 CEO(PID 119732 DEAD) archive 후 새 세션이 R13 CEO 인수. R12는 `2d6593e`로 마감(pushed).

## 매트릭스

| 코드 | 작업 | 쓰기 영역 | Wave | 의존성 |
|------|------|----------|------|--------|
| T-A1 | 코인룸·사이드바 시세 구독 (CoinHero·PriceTickerWidget·BoardSidebar) | `components/community/` | 1 | 독립 |
| T-A2 | 티커·김프 시세 구독 (Ticker·StockTicker·KimchiPremium) | `components/Chart/`·`components/Market/` | 1 | 독립 |
| T-B | watchlist 후속 (notice·reorder DB·clear 벌크·스모크) | `components/Watchlist/`·`components/hooks/`·`app/api/watchlist/` | 1 | 독립 |
| T-C | AuthButton 계정 드롭다운 | `components/AuthButton.tsx`·`components/account/` | 1 | 독립 |
| 배포 | Release 게이트(R10~R13) | (지휘자) | 2 | T-A1/A2/B/C 통합·커밋 후 |

**4 영역 disjoint → 동시 발사 안전.** (T-C는 `components/AuthButton.tsx` 단일 파일+신규 `components/account/`; T-A1의 `components/community/`와 disjoint)

## Wave 진행 상태

| Wave | 터미널 | 상태 |
|------|--------|------|
| 1 | T-A1 | 🅿️ 마커·SOT 준비완료 — 발사 대기 |
| 1 | T-A2 | 🅿️ 마커·SOT 준비완료 — 발사 대기 |
| 1 | T-B | 🅿️ 마커·SOT 준비완료 — 발사 대기 |
| 1 | T-C | 🅿️ 마커·SOT 준비완료 — 발사 대기 |
| 2 | 배포 | ⏸️ T-A1/A2/B/C 통합·커밋 후 지휘자 단독 |

## 표시설정 SSOT (R12 산출, 읽기 전용)

- `lib/config/display-settings.tsx` — `useDisplaySettings()` → `formatPrice(usd)`·`changeColorClass(change)`·`currency`·`changeColor`·`isHydrated`·`exchangeRate`
- 순수헬퍼: `formatDisplayPrice`·`getChangeColorClass`
- 레퍼런스 구현: `components/Watchlist/WatchlistTable.tsx`
- Provider는 `app/layout.tsx` 루트 마운트됨

## 지휘자 통합 작업 (회수 후)

- [ ] handover 4종 회수 + 자가검증 PASS 확인
- [ ] 격리 검증(쓰기영역 disjoint·SSOT 교차임포트 0)
- [ ] 통합 tsc/eslint/build
- [ ] 레퍼런스 갱신: `_API_REFERENCE.md`(T-B 신규 reorder/clear 엔드포인트)·`_COMPONENT_MAP.md`(AccountMenu·CoinHero 클라전환)·`_WEB_CONTRACT.md`(필요시)
- [ ] 통합 커밋(R13 마감)
- [ ] **배포(Wave2)**: Release 게이트로 R10~R13 누적분 프로덕션 반영
