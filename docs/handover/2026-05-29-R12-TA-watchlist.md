# 인수인계 — R12 / T-A watchlist 구현 (W1)

> 작성일: 2026-05-29 (세션 38)
> 작성 터미널: **일꾼 R12 T-A** (watchlist 영역 전담)
> 성격: watchlist MVP(익명·서버 0) 구현 완료 보고 — **cs/커밋/push 미수행** (통합은 R12 지휘관 CEO 담당)
> 입력 SOT: `docs/orchestration/2026-05-29-R12-watchlist-settings/T-A-watchlist.md`, `docs/design-brief/06-watchlist-settings.md`(§2·§5-1 W1), `docs/handover/2026-05-29-R11-T04-r12-kickoff.md`(§1·§2)

---

## 1. 산출 파일

| 파일 | 신규/수정 | 역할 |
|------|----------|------|
| `components/hooks/useWatchlist.ts` | 신규 | localStorage 영속 훅. `useSyncExternalStore` 기반(SSR 안전·탭 간 동기화). add/remove/toggle/reorder/clear/has. 상한 가드(익명 30/회원 100). 중복(assetType+symbol) 무시 |
| `components/hooks/useWatchlistQuotes.ts` | 신규 | 시세 폴링 훅. 코인=`/api/coins/ticker` 다건 1콜 · 주식=`/api/stock/quote` 단건 `Promise.all` 병렬. 12초 폴링·언마운트 abort·머지(부분 실패 시 직전 시세 유지) |
| `components/Watchlist/format.ts` | 신규 | 표시 포맷 헬퍼(baseSymbol·slug·price·pct·volume) |
| `components/Watchlist/WatchlistTable.tsx` | 신규 | 표 UI. 1줄=1종목·네이버 톤(보더 1px·`rounded-md`·zebra)·한국식 색상(상승 빨강 `--color-kr-up`/하락 파랑 `--color-kr-down`)·모바일 거래량 생략 |
| `components/Watchlist/WatchlistAddBar.tsx` | 신규 | MVP 추가 동선(코인/주식 세그먼트 + 심볼 입력 + 빠른추가 칩). 브랜드 그린(`--color-new`) CTA |
| `components/Watchlist/WatchlistView.tsx` | 신규 | 본문 오케스트레이션(훅+폴링+탭 필터 ALL/CRYPTO/STOCK+정렬 추가/이름/등락률+빈 상태+전체비우기) |
| `app/watchlist/page.tsx` | 수정 | "준비 중" 스텁(그라디언트·블러·`rounded-3xl` v1.0 잔재) → `WatchlistView` 교체. 서버 컴포넌트화 + `metadata` 추가 |

---

## 2. 핵심 결정

- **localStorage 키 = `cca:watchlist`** (지시서 명시). 저장 형태 `{ version:1, items:[...] }`, 항목 `{ assetType, symbol, sortOrder, createdAt }` — `user_watchlist` DB 컬럼과 1:1 대응(D3 머지 단순화).
- **심볼 형식**: CRYPTO=Binance pair `BTCUSDT`(입력 `BTC` → 자동 `USDT` 부착), STOCK=티커 `AAPL`. 각 SSOT 입력과 일치.
- **시세 SSOT 준수**: crypto/stock SSOT 모듈을 **직접 import하지 않고** 기존 API 라우트를 `fetch`로 재사용 → SSOT 교차 임포트 0, 신규 시세 API 0.
- **주식 다건 = 클라이언트 병렬**(taste #1): `/api/stock/quote` 단건을 `Promise.all`. 신규 배치 API 미신설.
- **상한 = 익명 30 / 회원 100**(taste #3): `useWatchlist`에서 `add` 시 가드. 회원 판별은 `supabase.auth.getUser()` + `onAuthStateChange`로 상한만 결정(동기화는 D3).
- **등락 색상 = 한국식 하드 기본**(taste #4): 상승 빨강 / 하락 파랑. settings Context 구독화(S2)는 후속 — 현재는 `--color-kr-up`/`--color-kr-down` CSS 변수 직접 사용.
- **브랜드 그린**(taste #7): ⭐(관심해제 버튼)·추가 CTA·빠른추가 칩 강조 = `--color-new`(#03c75a).
- **하이드레이션 안전**: `useSyncExternalStore`로 localStorage 구독 → `react-hooks/set-state-in-effect`·`react-hooks/refs` 규칙 위반 0(기존 `LanguageContext`의 미해결 baseline 회피). 빈 상태 깜빡임은 `useSyncExternalStore(()=>()=>{}, ()=>true, ()=>false)` 마운트 플래그로 차단.
- **추가 동선 보강**: 현장 ⭐ 토글(W2)이 아직 없어 T-A 단독 테스트가 불가능해지는 것을 막기 위해 `WatchlistAddBar`(인라인 추가 + 빠른추가 칩)를 포함. 풀 자동완성 검색 모달(design-brief §2-5)은 W2 범위로 남김.
- **행 액션 라우트**: 코인 차트 `/analysis/{base소문자}`(코인룸 기존 컨벤션), 주식 차트 `/analysis/stock/{TICKER}`(실제 라우트 — brief의 `/stock/{symbol}`는 미존재라 정정), 코인룸 `/coin/{base소문자}`(코인만).

---

## 3. 검증

| 항목 | 결과 |
|------|------|
| `npx tsc --noEmit` (전체) | **PASS** — error 0 |
| `npx eslint` (자기 변경분 7파일) | **PASS** — error 0 (no-restricted-imports 포함 통과) |
| SSOT 교차 임포트 (crypto/stock 직접 import) | **PASS** — 0건 |
| 쓰기 격리 (`app/watchlist/`·`components/Watchlist/`·`components/hooks/`만) | **PASS** — 영역 밖 변경 0 |
| 수동 브라우저 테스트(추가→새로고침 유지→상한 30 차단→시세 갱신) | **미실행(FAIL이 아니라 PENDING)** — 정적 검증만 수행. dev 서버+브라우저 상호작용 필요(아래 §5) |

> 정적 검증(tsc/eslint)은 JSX·타입·import 해석을 모두 컴파일 단위로 확인하므로 빌드 차원 신뢰도는 확보. 단, 실제 localStorage 영속·시세 표시·상한 차단의 **런타임 동작 확인은 통합 시 브라우저로 1회 수행 권장**(미수행을 PASS로 위장하지 않음).

---

## 4. 미해결 TODO (후속 연동 지점)

- **S2 (T-B 합류)**: 등락 색상이 현재 한국식 하드코딩(`--color-kr-up`/`--color-kr-down`). T-B의 표시설정 Context(통화·등락색상) 완성 시 `WatchlistTable`이 Context를 구독해 글로벌(녹↑빨↓) 전환·USD/KRW 통화 표시를 지원해야 함. 현재 가격은 USD 고정(`$`).
- **D3 (T-C 합류)**: 회원 로그인 시 로컬 우선 병합 업로드 + 회원이면 DB 소스로 전환. 현재 `useWatchlist`는 회원이어도 **상한만 100**으로 올리고 소스는 localStorage 고정. T-C의 `lib/supabase/watchlist.ts`·`/api/watchlist*` 완성 후 훅에 동기화 분기 추가 필요(항목 스키마가 DB 컬럼과 1:1이라 머지 단순).
- **W2**: 현장 추가 ⭐ 토글 공용 컴포넌트 → 코인룸 히어로·`/analysis/[symbol]`·`/analysis/stock/[symbol]`·시세 스트립 4곳 삽입. `useWatchlist().toggle/has`를 그대로 재사용 가능. 완성 시 `WatchlistAddBar`는 보조 동선으로 유지하거나 design-brief §2-5 검색 모달로 대체 검토.
- **T-D (nav)**: 헤더 "도구 ▼"의 "워치리스트" 링크가 이제 실페이지로 연결되는지 확인(라우트는 기존 `/watchlist` 유지).
- **정렬 영속화(선택)**: `reorder`(드래그 순서) API는 구현했으나 표 UI에 드래그 핸들은 미연결(현재 정렬은 추가/이름/등락률 표시 정렬). 필요 시 후속.

---

## 5. 통합 시 런타임 확인 절차 (권장)

1. `npm run dev` → `/watchlist` 접속.
2. 빠른추가 칩으로 BTC·ETH·AAPL 추가 → 표에 시세(현재가/등락률/거래량) 표시 확인(최대 12초 내 갱신).
3. 새로고침 → 목록 유지(localStorage `cca:watchlist`) 확인.
4. 익명 상태로 31번째 추가 시도 → 상한 30 차단 메시지 확인.
5. 등락 색상 한국식(상승 빨강/하락 파랑) 확인.

---

## 6. 격리 준수 확인

- 쓰기: `app/watchlist/page.tsx`, `components/Watchlist/*`(신규 6), `components/hooks/useWatchlist.ts`·`useWatchlistQuotes.ts`(신규 2) — **전부 허용 영역 내**.
- 영역 밖 수정 0. 신규 시세 API 0. SSOT 교차 임포트 0. 그라디언트/블러/큰 라운드/다크모드 0(스텁 v1.0 잔재 폐기).
- 동일 워킹트리에 T-C(`app/api/watchlist/`·`lib/supabase/watchlist.ts`·`supabase/migrations/`)·지휘관(`docs/orchestration/`) 산출물이 함께 보이나 **본 워커가 작성하지 않음**(병렬 워커 동시 산출).
- **cs/커밋/push 미수행** — 통합 cs는 R12 지휘관 CEO 담당.
