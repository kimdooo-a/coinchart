# R12 / T-A — watchlist 구현 (일꾼 통합 프롬프트)

## 0. 정체성
- 너는 **R12 일꾼 T-A (4명 중 1)**. 역할은 watchlist 기능 구현. **지휘관 아님** — handover만 작성, cs/커밋/push 금지.
- 금지 어휘: "내가 지휘", "전체 통합", "다른 터미널 발사". 너는 watchlist 한 영역만.

## 1. 컨텍스트
- 프로젝트: 코인차트분석 (Next.js 16 App Router·TS strict·Tailwind v4·Supabase). v2.0 = 코인/주식 정보 공유 커뮤니티(익명 1급 시민).
- **쓰기 허용**: `app/watchlist/`, `components/Watchlist/`(신규), `components/hooks/` **만**. 그 외는 PreToolUse 가드가 차단.

## 2. 공통 SOT (읽기 전용 — 먼저 정독)
- `docs/design-brief/06-watchlist-settings.md` §2(watchlist 기획)·§5-1(W1)
- `docs/handover/2026-05-29-R11-T04-r12-kickoff.md` §1(taste)·§2(매트릭스)
- `docs/design-brief/00-overview.md` (색상·브랜드 그린·인터랙션 톤)
- `lib/supabase/crypto.ts`·`lib/supabase/stock.ts` (SSOT — 임포트 형식 확인)
- `app/api/coins/ticker`·`app/api/stock/quote` 핸들러 (시세 재사용 대상)

## 3. 작업 목표 + 산출물
1. **`useWatchlist` 훅** (`components/hooks/useWatchlist.ts`):
   - localStorage 영속(키 예: `cca:watchlist`). 항목 = `{assetType:'CRYPTO'|'STOCK', symbol, sortOrder, createdAt}`.
   - 심볼 형식: CRYPTO=`BTCUSDT`(Binance pair), STOCK=`AAPL`(티커) — 각 SSOT 입력과 일치.
   - 상한 가드: **익명 30 / 회원 100** (회원 판별은 기존 auth 훅/세션 사용. 회원 동기화 자체는 D3=후속이므로 T-A는 localStorage 소스만, 회원이면 상한만 100으로).
   - add/remove/toggle/reorder/clear API. 중복(assetType+symbol) 무시.
2. **표 UI** (`components/Watchlist/WatchlistTable.tsx` 등):
   - 1줄 = 1종목: 심볼 / 현재가 / 등락률 / 거래량 / 액션(별 해제). v2.0 네이버 증권 톤(보더 1px·`rounded-md`).
   - **등락 색상 한국식**: 상승=빨강·하락=파랑. (전환은 T-B Context 연동이나, T-A는 한국식 하드 기본으로 두고 S2에서 구독화 — kickoff 참조.)
   - 모바일: 거래량 생략·등락률 강조 1줄 축약.
   - 빈 상태: "⭐로 종목을 담아보세요" + 코인룸/차트분석 유도 링크.
3. **시세 폴링**:
   - CRYPTO: `/api/coins/ticker?symbols=...` 다건 1콜.
   - STOCK: `/api/stock/quote` **단건이므로 즐겨찾기 주식 N개를 `Promise.all` 병렬 호출** (taste #1 — 신규 배치 API 금지).
   - 폴링 주기 합리값(예: 10~15s), 언마운트 정리. 신규 시세 API 생성 금지.
4. **`app/watchlist/page.tsx`**: 기존 "준비 중" 스텁 → 위 컴포넌트로 교체.

## 4. 의존성
- 없음(익명 MVP, 서버 0). T-C(DB)·회원 동기화(D3)는 후속 — T-A는 localStorage 소스만 완성.

## 5. 검증
- `npm run lint` (자기 변경분 0 error). `npx tsc --noEmit` 타입 통과.
- 수동: 익명 상태로 종목 추가→새로고침 유지→상한 30 초과 차단→시세 갱신 확인.
- SSOT: crypto/stock 교차 임포트 0 (ESLint no-restricted-imports 통과).

## 6. 완료 신호
- `docs/handover/2026-05-29-R12-TA-watchlist.md` 작성: 산출 파일 표 / 핵심 결정 / 검증 PASS·FAIL / 미해결 TODO(특히 S2·D3 연동 지점) / 격리 준수 확인.
- **cs 금지** (통합 cs는 지휘관 R12 CEO 담당).

## 7. 안티패턴
신규 시세 API · SSOT 교차 임포트 · 그라디언트/블러/큰 라운드 · 다크모드 · 쓰기영역 밖 수정 · 지휘관 자칭.
