# 개발 미완성 점검 보고서 (Dev Gap Audit)

- **일자**: 2026-05-29
- **세션/역할**: R9-T03 일꾼 (kdynext --scan-only, 코드 수정 없음)
- **범위**: app/ 217개 소스, 15개 API 라우트, lib/ 핵심 엔진, components/
- **점검 초점**: 스텁 / 미완성 / TODO / 데이터 연결 누락 / 데드코드

---

## 종합 등급

| 영역 | 등급 | 비고 |
|------|------|------|
| 페이지 완성도 | B+ | 33개 중 약 22개 실연동 완성. 미완성 5개 |
| API ↔ 프론트 연결 | A- | 암호화폐/뉴스/FNG 100% 실데이터. 주식 일부 mock |
| lib 엔진 연결 | A | 핵심 6엔진(analysis/indicators/fractal/signal/probability/backtest) 모두 정상 연결 |
| 데드코드/정리 | B | 고아 모듈 6개 잔존 (R8 hero 삭제 이후 추가분) |

---

## A. 사용자 대면 기능 미완성 (우선순위)

### 1. `/signal` — ⭐ 최우선: 백엔드 완성, 프론트 미연결
- **현상**: `app/signal/page.tsx:26-30`에서 3초 mock 스캔 후 `setSignals([])` 하드코딩 → 항상 "신호 없음" 표시.
- **아이러니**: `app/api/signals/route.ts` + `lib/signal_engine.ts`는 **실제 동작**(Supabase market_prices 기반 Pump/Dump 감지)하는데, 페이지가 이 API를 **호출조차 안 함**.
- **실동작 부분**: `<WhaleAlert />` 컴포넌트만 실데이터.
- **조치**: page에서 `/api/signals` fetch → `signals` state 연결 + 신호 카드 리스트 렌더(현재 `line 72` 주석만 있음). 백엔드가 이미 있어 **노력 대비 효과 가장 큼**.

### 2. `/watchlist` — 준비 중 플레이스홀더
- `app/watchlist/page.tsx:45` "관심종목 기능 준비 중". UI 셸만 존재, 저장/불러오기 CRUD 없음.
- **조치**: Supabase 테이블 + 클라 상태관리 신규 구현 필요.

### 3. `/settings` — 구현 예정
- `app/settings/page.tsx:61` "구현 예정입니다". 알림/보안/테마 3개 섹션 전부 콘텐츠 없음.
- **조치**: 섹션별 설정 로직 신규 구현.

### 4. `/pricing` — 준비 중 (의도적)
- `app/pricing/page.tsx:25,36` Pro/Premium "준비 중·Coming Soon", 결제 로직 없음.
- **판정**: SEO/마케팅용 의도적 플레이스홀더. v2.0 커뮤니티 피벗 방향상 **후순위 정상**.

---

## B. 데이터 연결 미완성

### 5. `admin/market-data` 주식 데이터 mock
- `app/api/admin/market-data/route.ts:50-73` — 암호화폐는 실데이터(Binance), **주식은 모의 데이터 함수** 반환.
- **조치**: stock_prices 테이블 실데이터 수집 배치 필요(현재 TwelveData는 quote만).

### 6. `ChartAnalysisPanel` 볼린저밴드 가짜값
- `components/Analysis/ChartAnalysisPanel.tsx:139` — `// Placeholder logic for band pos`, Bollinger 항목이 `prob: 50` 고정 더미.
- **조치**: BB 밴드 위치 기반 실제 확률 계산 연결.

### 7. `useSubscription` 구독 정보 미연동
- `components/hooks/useSubscription.ts:24` — `// TODO: Supabase에서 실제 구독 정보 가져오기`. 게다가 **어디서도 import 안 되는 고아**(아래 C와 중복). pricing 미구현과 동일 맥락.

### 8. `scripts/alert_engine.ts` 스텁
- `:244 stub`, `:251 TODO: Implement actual alert sending`, `:312 TODO: Load previous results`. 운영 알림 발송 미구현(scripts 영역, 사용자 대면 아님).

---

## C. 데드코드 / 고아 파일 (정리 대상)

R8에서 hero-* 컴포넌트 삭제 후 추가로 발견된 고아:

| 파일 | 상태 | 권장 |
|------|------|------|
| `components/Stock/StockSectorPerformance.tsx` | 고아 (import 0) | 삭제 또는 stock 페이지 통합 |
| `components/hooks/useSubscription.ts` | 고아 + 미구현 | 삭제 또는 구독기능과 함께 구현 |
| `components/ErrorState.tsx` | 고아 (import 0) | 삭제 또는 공통 에러 UI로 채택 |
| `components/InsufficientData.tsx` | 고아 (import 0) | 삭제 또는 채택 |
| `lib/economic_events.ts` | 고아 (calendar는 하드코딩 EVENTS 사용) | 삭제 또는 calendar 데이터소스로 연결 |
| `components/Analysis/TradingStrategyGuide.tsx` | 고아 (주석으로 제거됨) | 삭제(git history 보존) |
| `lib/config/gates.ts` | preflight에서만 사용, 라우트 gate 미구현 | feature flag 인프라 완성 or 정리 |

> 참고: `AnalysisPanel.tsx`의 `// Legacy` 주석 import들은 orchestrator 마이그레이션 완료에 따른 **의도적 제거**로 정상.

---

## 권장 실행 순서 (다음 라운드 후보)

1. **R10-A `/signal` 프론트 연결** — 백엔드 완성 상태라 ROI 최고. (코드 수정 소)
2. **R10-B 데드코드 7종 정리** — kdyclean. 리스크 낮음, 코드베이스 청결.
3. **R10-C `ChartAnalysisPanel` BB 확률 + admin 주식 mock** — 데이터 정확도.
4. **R10-D `/watchlist`·`/settings` 신규 구현** — 노력 큼, 기획 선행 필요.
5. `/pricing`·구독·alert_engine — 수익화/운영 트랙, 커뮤니티 피벗 우선순위상 보류.

---

## 점검 방법 메모
- kdynext `--scan-only` 모드 (Phase 0~2). 코드 변경 없음.
- Explore 서브에이전트 3종 병렬(페이지/API/데드코드) + 핵심 의심 페이지 직접 Read 검증.
- `placeholder` grep 결과 다수는 input 속성 노이즈로 제외, 실제 미완성 신호만 선별.
