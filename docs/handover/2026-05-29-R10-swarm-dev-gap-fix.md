# R10 미완성 보완 — kdyswarm 병렬 개발 보고서

- **일자**: 2026-05-29
- **방식**: kdyswarm (3 에이전트 worktree 격리 병렬, 모델 sonnet ×3)
- **근거**: `docs/handover/2026-05-29-R9-T03-dev-gap-audit.md` (미완성 점검 보고서)
- **결과**: 3트랙 전부 성공, 충돌 0, `tsc --noEmit` exit 0

---

## 실행 요약

| 트랙 | 미션 | 결과 | 변경 |
|------|------|------|------|
| **T1** | `/signal` 백엔드 연결 | ✅ | `app/signal/page.tsx` 수정 + `components/Signal/SignalCard.tsx` 신규 (+189/-17) |
| **T2** | 데드코드 정리 | ✅ | 6개 파일 삭제(995줄) + `AnalysisPanel.tsx` 죽은 주석 1줄 제거 (-996) |
| **T3** | 데이터 정확도 | ✅ | `ChartAnalysisPanel.tsx` + `app/api/admin/market-data/route.ts` (+51/-10) |

---

## T1 — /signal 페이지 백엔드 연결
- **문제(R9 audit #1)**: `setSignals([])` 하드코딩 mock → 항상 "신호 없음". 백엔드(`/api/signals`+`signal_engine`)는 완성인데 프론트 미연결.
- **수정**:
  - 실제 `/api/signals` 응답 스키마 확인 후 `Signal` 타입 교정 (price/reason/strength → **type/title/description/score/timestamp/metrics**).
  - `useEffect` mock setTimeout → 실제 `fetch('/api/signals')`. 로딩/성공/에러/빈결과 + 언마운트 가드 처리.
  - `SignalCard` 신규: BUY/SELL/WARNING/INFO 색상 분리, score 기반 강도 뱃지, i18n(lang), Framer Motion staggered 진입.
  - 스캐닝 애니메이션·빈상태(🔭)·WhaleAlert 유지.

## T2 — 데드코드 6종 삭제
- **삭제(총 995줄)**: `TradingStrategyGuide.tsx`(372), `ErrorState.tsx`(65), `InsufficientData.tsx`(88), `Stock/StockSectorPerformance.tsx`(150), `hooks/useSubscription.ts`(52), `lib/economic_events.ts`(268).
- **추가**: `AnalysisPanel.tsx:9` 죽은 주석 제거.
- **⚠️ 제외**: `lib/config/gates.ts` — `scripts/preflight.ts`가 실제 import 중이므로 **삭제하지 않음**(R9 audit의 "preflight 의존성 확인" 단서 적중). 발사 전 Pre-Flight grep으로 확정.

## T3 — 데이터 정확도
- **(A) 볼린저밴드(R9 audit #6)**: `prob:50` 고정 더미 → `calculateBollingerBands`로 실제 밴드 산출 + **%B 공식** `(price-lower)/(upper-lower)`로 위치 비율 계산. %B≥0.8 과매수(SELL), ≤0.2 과매도(BUY), 상승확률 `(1-%B)*60+20`. 데이터 부족 시 0.5 중립 fallback.
- **(B) admin 주식 mock(R9 audit #5)**: `fetchStockPrices`(SSOT) 사용해 `stock_prices` 테이블 실데이터 조회로 교체. **보수적 fallback**: 빈결과/에러 시 기존 mock 유지(데이터 깨짐 방지). 운영 DB에 주식 데이터 적재돼야 실값 반영.

---

## 검증

| 항목 | 결과 |
|------|------|
| 머지 충돌 | 0 (파일 완전 분리, T2 AnalysisPanel ≠ T3 ChartAnalysisPanel) |
| `tsc --noEmit` (통합본) | **exit 0, 에러 없음** |
| 각 에이전트 자체 tsc | T1·T3 통과 보고 |

**정적 검증 한계(런타임 미검증)**:
- T1 signal 실제 fetch 동작 — `/api/signals`가 실신호 반환하는지는 런타임/DB 의존. 타입 연결만 확정.
- T3 admin 주식 실데이터 — `stock_prices` 테이블에 데이터 적재 여부에 따라 실값/mock fallback 분기.
- ⚠️ `ChartAnalysisPanel`에 `calculateRSI` 미사용 import 잔존(기존 이슈, lint warning, 빌드 무관) — 후속 정리 후보.

---

## git 상태
- 에이전트 작업 커밋 3개 + `--no-ff` 머지 커밋 3개 → main(`bec3ca0`).
- worktree 3개 제거, 브랜치 삭제, `.kdyswarm/lock.completed.json` 아카이브.

## 남은 R10+ 후보 (미완성 점검에서 이번 미처리)
1. `/watchlist`·`/settings` 신규 구현 — **기획(brainstorming) 선행 필요**, swarm 제외함.
2. `/pricing`·구독(`useSubscription` 삭제됨)·`alert_engine.ts` stub — 수익화/운영 트랙(커뮤니티 피벗상 보류).
3. `ChartAnalysisPanel` 미사용 import 등 lint 잔재.
4. R9 인계 후보였던 레퍼런스 라우트 레지스트리 정합·807줄 리팩토링.
