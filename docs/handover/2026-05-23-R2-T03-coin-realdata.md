# 인수인계서 — R2 / T03 coin-realdata

> 작성일: 2026-05-23
> 라운드/그룹: R2 (realdata-finish) / T03
> 일꾼: worker (R2-T03)
> 상태: **COMPLETED ✅**
> 의존: R1/T03(ticker SSOT) · R1/T12(coin-* board API) · R1/T06(news symbol 필터) · R1/T13(hot-issues RPC) · R1/T04(FNG) · R1/T15(COIN_META 패턴)

---

## ⚠️ 터미널 배정 메모 (지휘자 확인 필요)

본 작업은 디스패치상 **R2-T04(chart-lightify) 마커에 바인딩된 터미널**에서 실행됨. 사용자(지휘자)가 T03 프롬프트를 이 터미널에 투입했고, 명시적으로 **"T03 강행"**을 선택하여 진행. 따라서:

- `app/coin/` 영역은 본래 이 터미널의 allowed_dirs(`components/Chart/` 등)가 아님. PreToolUse write-guard는 `$env:DK_DISPATCH_ROLE` 미설정 상태(fresh PowerShell 프로세스에서 환경변수 휘발)라 실제 차단 없이 통과함.
- **별도의 R2-T03 전용 터미널(마커 PID 75996)이 존재**. 동일 작업 중복 실행 시 충돌 주의. 지휘자는 (a) 이 핸드오버를 R2-T03 산출물로 회수하고 T03 터미널을 유휴 처리하거나, (b) 이 터미널이 맡았어야 할 **R2-T04(chart-lightify)**를 별도 처리할지 결정 필요.

---

## 1. 작업 요약

코인룸 `/coin/[symbol]`(btc/eth/xrp/sol/altcoin/kimp 6종)을 `mock-coins`/`mock-posts`/`mock-news` 의존에서 **실데이터**로 전환. 페이지는 `"use client"` 구조를 유지하고, 신규 `lib/community/coin-queries.ts`의 클라이언트 fetch 래퍼 + 매퍼 + 정적 메타 사전을 통해 시세·게시글·뉴스·사이드바 위젯을 실데이터로 hydrate. 코인 정적 메타(이름·심볼·로고색·설명·태그·시총·도미넌스·7d/30d 등 실시간 단일 소스가 없는 표시값)는 coin-queries.ts의 정적 사전으로 보유하고, 시세(price/changePct/24h고저/거래량)만 `/api/coins/ticker` 실데이터로 덮어씀. JSX·디자인 회귀 없음(섹션·사이드바 구조 그대로, 빈/로딩 상태만 보강).

---

## 2. 산출물

### 신규 (1)
- `lib/community/coin-queries.ts` (약 450줄) — 정적 메타 사전(`COIN_META` 12종 + `COIN_ROOMS` 6종) + 표시 뷰 빌더(`buildCoinView`) + 클라 fetch 래퍼 7종 + 매퍼/헬퍼

### 수정 (1)
- `app/coin/[symbol]/page.tsx` — **전체 재작성**. mock import 제거, `getCoinRoomMeta`로 6종 검증(미존재 시 `notFound()`), `useEffect`에서 6개 API 병렬 fetch, 단일 `data` 상태 객체로 보관

### 미수정 (안티패턴 준수)
- `lib/community/mock-*.ts` **삭제/수정 안 함** (회수 후 지휘자 일괄 — 다른 페이지가 아직 사용)
- `app/board/`, `app/news/`, `app/page.tsx`, `app/api/`, `lib/community/queries.ts`, `lib/supabase/crypto.ts` **무수정** (각 영역 외)
- 새 패키지 0건

---

## 3. API 매핑표

| UI 영역 | mock(이전) | 실데이터(현재) | 매퍼/위젯 |
|---|---|---|---|
| CoinHero 시세 | `getCoin().price/changePct/...` | `GET /api/coins/ticker` → `findTicker(base)` | `buildCoinView(meta, ticker)` |
| 사이드바 핵심지표 | `getCoin()` 전체 | price/changePct/24h고저=ticker, 그 외=정적 메타 | `buildCoinView` |
| 인기글/최신 토론/토론 탭 | `getPostsForCoin(tag)` | `GET /api/board/coin-{symbol}?limit=30&sort=recent` | `fetchCoinPosts`→`mapBoardRow`→`BoardRow` |
| 공지 탭 | (상시 "공지 없음") | 동 board API의 `notices[]` | `fetchCoinPosts.notices` |
| 코인 뉴스(섹션/뉴스 탭) | `getNewsForCoin(tag)` | `GET /api/news?query={tag}` (tag=ALL이면 필터 없음) | `fetchCoinNews`→`mapNewsItem`→`NewsRow` |
| 사이드바 실시간 시세 | `TICKER_LIST.slice(0,6)` | `GET /api/coins/ticker` | `toTickerItems`→`PriceTickerWidget` |
| 사이드바 핫이슈 | `HOT_ISSUES.slice(0,5)` | `GET /api/coins/hot-issues` | `fetchHotIssues`(symbol→nameKo, UP/DOWN/NEW/FLAT→up/down/new/same)→`HotIssueWidget` |
| 사이드바 FNG | `value={72} prevValue={68}` (하드코딩) | `GET /api/fng` | `fetchFng`→`FngGaugeWidget` |
| 사이드바 공식글 | `OFFICIAL_POSTS` | `GET /api/blog?limit=3` | `fetchOfficialPosts`→`OfficialPostsWidget` |

> **검증 grep 위치 보정**: 지시서 검증 `grep ".../api/..." app/coin/`은 inline fetch를 가정. 본 구현은 fetch 래퍼를 (지시서가 "(선택) 신규"로 제시한) `lib/community/coin-queries.ts`에 집약했으므로 API 호출은 그 파일에 다수 존재(`grep "/api/" lib/community/coin-queries.ts`). 페이지는 래퍼만 import. **클라 컴포넌트가 `lib/community/queries.ts`(서버 전용, cookies 의존)를 import하면 클라 번들 오염/빌드 실패**하므로 의도적으로 분리했고, `COIN_META`도 queries.ts에서 import하지 않고 재정의함.

---

## 4. 정적 메타 사전 출처

- `COIN_ROOMS`(6종): `lib/community/mock-coins.ts`의 `COINS[*]` 값을 **복사**(import 아님)하여 coin-queries.ts에 상수로 보유. 이름/심볼/로고색/이모지/설명/태그/sparkline + 정적 표시값(marketCapUsd/marketCapRank/change7d/change30d/dominance/circulatingSupply) + 시세 폴백값(staticPrice 등).
- `COIN_META`(12종, 사이드바 ticker/hot-issues 라벨용): R1/T15 `lib/community/queries.ts`의 동명 사전과 동일 데이터를 재정의(서버 모듈 import 회피). BTC~AVAX 10종 + ALT/KIMP 2종.
- **실데이터로 덮어쓰는 필드**: price, changePct(24h), volume24hUsd, high24h, low24h (ticker가 있을 때).
- **정적 유지 필드(실시간 소스 부재)**: marketCapUsd, marketCapRank, change7d, change30d, dominance, circulatingSupply, tags, sparkline, description. → 사이드바 핵심지표의 7d/30d/시총/도미넌스/유통량은 정적 표시값임을 유의. (후속: 시총=실시세×유통량 계산, 7d/30d 별도 소스 연동 검토 — §7)

---

## 5. altcoin / kimp 특수 처리

- 둘 다 `isAggregate: true`, `binanceSymbol: null` → `fetchTickers()` 결과에서 매칭 ticker 없음 → `buildCoinView`가 정적 폴백값 사용(T15 패턴: 단일 코인 실시세 없는 종합 지표).
- **altcoin**: staticPrice 0, 설명형 카드. 게시글=`coin-altcoin`, 뉴스=`?query=ALT`(classifier가 symbol="ALT" 적재).
- **kimp**: staticPrice 5.2(프리미엄 % 표시), 설명형 카드. 게시글=`coin-kimp`, 뉴스 coinTagFilter="ALL" → query 미지정 → 최신 전체 뉴스.
- 실데이터 김프 소스 `GET /api/kimchi`(Bithumb×Binance×환율 프리미엄)가 존재하나, 지시서 "kimp 설명형 카드 유지" 준수를 위해 **본 라운드 미연동**. 후속 enhancement 후보(§7).

---

## 6. fallback 처리

- 모든 fetch 래퍼는 try/catch로 격리하여 실패 시 안전값(`[]` / `null` / `{notices:[],posts:[]}`) 반환 → 페이지 전체 크래시 없음.
- 사이드바 위젯은 데이터 있을 때만 렌더(`tickerItems.length>0 && ...`, `fng && ...`, `hotIssues.length>0 && ...`, `officialPosts.length>0 && ...`) → 빈 데이터 시 위젯 미노출(깨짐 방지).
- 핵심지표/CoinHero는 ticker 실패 시 정적 폴백값으로 항상 표시.
- 로딩 상태: 단일 `data` 상태객체에 fetch 시점 `symbol` 동봉 → `data.symbol === meta.slug`일 때만 사용. 심볼 전환 시 이전 코인 데이터 노출 방지 + "불러오는 중…" 표시. (effect 내 동기 setState 회피 → `react-hooks/set-state-in-effect` 린트 통과)
- 게시글/뉴스 0건: 기존 빈 상태 안내 메시지 유지("아직 ~ 글이 없습니다 / 첫 글을 작성해보세요", "관련 뉴스가 없습니다").

---

## 7. mock import 잔여 사유 & 후속 후보

- **app/coin/ 및 coin-queries.ts의 mock-* import: 0건** (검증 통과). 정적 메타는 복사본이라 mock 의존 없음.
- `lib/community/mock-*.ts`는 여전히 `/board/[slug]`·`/board/[slug]/[postId]` 등 다른 페이지가 사용 가능 → 본 T03에서 삭제 금지(지휘자 일괄 정리 대상).
- **후속 enhancement**:
  1. kimp 룸에 `GET /api/kimchi` 실데이터(프리미엄 %) 연동.
  2. 핵심지표 7d/30d·시총: 실시세×유통량 계산 또는 별도 소스(예: CoinGecko) 도입.
  3. AI 차트 시그널 위젯: 현재 정적 placeholder("매수 권장/75%/강한 상승추세"). `GET /api/signals` 또는 `/api/analysis/[symbol]` 연동 검토(지시서 데이터 소스 목록 외라 본 라운드 미연동).
  4. 게시글 작성자: 회원 글은 `guest_nickname` 없으면 "회원" 고정 표시(닉네임/프로필 join 미구현).

---

## 8. 검증 결과 (재현 명령)

```bash
cd "F:/11_dev/260523 코인 차트분석"

npx tsc --noEmit                                              # 0 error ✅
npx eslint "app/coin/[symbol]/page.tsx" "lib/community/coin-queries.ts"  # 0 error ✅
grep -rn "@/lib/community/mock-" app/coin/                   # 0건 ✅ (정적 메타 자체보유)
grep -n "/api/" lib/community/coin-queries.ts                # 시세/게시글/뉴스/핫이슈/FNG/공식글 다수 ✅
npm run build                                                # Compiled, ƒ /coin/[symbol] ✅
```

| 항목 | 기대 | 실제 |
|---|---|---|
| tsc | 0 error | 0 error ✅ |
| eslint(2파일) | 0 error | 0 error ✅ |
| app/coin/ mock import | 정적 메타만/0 | 0건 ✅ |
| API 매핑(coin-queries.ts) | 다수 | ticker/board/news/hot-issues/fng/blog 6종 ✅ |
| build | Compiled | ✅ `ƒ /coin/[symbol]` 동적 라우트 등록 |

- 사전 존재 경고 1건: `lib/community/ip-mask.ts:3 node:crypto`(Edge Runtime, T07 영역) — 본 작업 무관.

### 시각 검증 (사용자/지휘자 단계 — 권장)

```bash
npx tsx scripts/seed-community.ts --force   # community 시드(T02) 적용 시 게시글 채워짐
npm run dev                                  # http://localhost:3000/coin/btc
# 확인: CoinHero 실시세, 인기글/최신토론(coin-btc 게시글), BTC 뉴스, 사이드바(시세/핫이슈/FNG/공식글)
#       altcoin/kimp는 설명형 카드 + 게시글/뉴스만
```

- 시드 미적용 시: 게시글/핫이슈는 빈 상태, ticker/FNG/뉴스는 외부·DB 실데이터로 정상.

---

## 9. 참조

- 작업 명세: `docs/orchestration/2026-05-23-R2-realdata-finish/R2-T03-coin-realdata.md`
- 의존 handover: R1-T03(ticker-ssot), R1-T12(board-api), R1-T06(news-classify-integration), R1-T13(hot-issues-rpc), R1-T15(mainpage-realdata)
- 산출 코드: `lib/community/coin-queries.ts`, `app/coin/[symbol]/page.tsx`
- 데이터 소스 라우트: `app/api/coins/ticker`·`app/api/board/[slug]`·`app/api/news`·`app/api/coins/hot-issues`·`app/api/fng`·`app/api/blog`
- 컴포넌트 계약: `components/community/{CoinHero,BoardRow,NewsRow}.tsx`, `components/community/widgets/{PriceTicker,HotIssue,FngGauge,OfficialPosts}Widget.tsx`
- 보존된 mock(R2 정리 대상): `lib/community/mock-{coins,posts,news}.ts`
