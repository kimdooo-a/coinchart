# 인수인계서 — R1 / T15 mainpage-realdata

> 작성일: 2026-05-23
> 라운드: R1 (mainpage) — **핵심 산출물 / 4차 발사 (의존 7종 완료 후)**
> 일꾼: T15
> 상태: **COMPLETED ✅**
> 의존: T01·T02·T03·T04·T06·T12·T13

---

## 1. 작업 요약

메인페이지(`app/page.tsx`)를 `"use client"` 더미 페이지에서 **async Server Component(SSR) + 실데이터**로 전환. 모든 mock-* import를 제거하고, 신규 `lib/community/queries.ts`의 단일 진입점 `fetchMainPageData()`로 community_posts·news·blog_posts·핫이슈 RPC·Binance ticker·FNG를 병렬 fetch. 기존 JSX 구조(시세 스트립·베스트·뉴스·게시판 3컬럼·코인룸·사이드바)는 **디자인 회귀 없이 그대로 보존**하고 데이터 소스만 교체했다.

---

## 2. 산출물

### 신규 (1)
- `lib/community/queries.ts` (약 320줄) — `fetchMainPageData()` + `Main*` 인터페이스 7종 + `COIN_META` 브랜드 사전 + 행 매퍼 4종

### 수정 (4)
- `app/page.tsx` — **전체 재작성**. `"use client"` 제거, async SSR, `export const revalidate = 300`, 컴포넌트 props 변환 헬퍼 5종
- `lib/community/mock-coins.ts` — `TICKER_LIST`/`HOT_ISSUES`/`OFFICIAL_POSTS`에 deprecated 주석(코드 보존)
- `lib/community/mock-posts.ts` — `getBestPosts`에 deprecated 주석(코드 보존)
- `docs/status/current.md` — 작업 이력 표에 T15 행 append

### 미수정 (안티패턴 준수)
- mock-* 파일 **완전 삭제 안 함** (`/news`·`/coin/[symbol]`·`/board/[slug]`·`/board/[slug]/[postId]` 4개 페이지가 사이드바 위젯에서 여전히 사용 중 — 아래 §6 참조)
- 다른 일꾼 산출물(`lib/supabase/crypto.ts`, `lib/community/fng.ts`, RPC, API 라우트, 위젯 컴포넌트) **Read만**, 무수정
- 새 패키지 설치 0건

---

## 3. mock import 0건 증거

```
$ grep -nE "from \"@/lib/community/mock-|from '@/lib/community/mock-|use client" app/page.tsx
(출력 없음 = 0건)

$ grep -nE "fetchMainPageData|export const revalidate" app/page.tsx
20:    fetchMainPageData,
31:export const revalidate = 300;
120:    const data = await fetchMainPageData();
```

| 검증 항목 | 기대 | 실제 | 결과 |
|---|---|---|---|
| `app/page.tsx`의 mock-* import | 0 | 0 | ✅ |
| `app/page.tsx`의 `"use client"` | 0 | 0 | ✅ |
| `fetchMainPageData` 참조 | ≥1 | 2 (import+호출) | ✅ |
| `export const revalidate` | 1 | 1 (=300) | ✅ |
| `npx tsc --noEmit` | 0 error | 0 error (출력 없음) | ✅ |
| `npm run build` | Compiled | ✓ Compiled successfully | ✅ |

---

## 4. ISR / 렌더링 모드 — ⚠️ 중요

- **`export const revalidate = 300` (5분)** 설정 완료.
- **단, 실제 빌드 결과 `/`는 `ƒ (Dynamic, server-rendered on demand)`** 로 등록됨.
  ```
  Route (app)
  ┌ ƒ /
  ```
- **원인**: 사용자 지시대로 `await createClient()`(lib/supabase/server.ts)를 사용하는데, 이 함수가 내부에서 `cookies()`(Next dynamic API)를 호출 → Next.js가 페이지를 정적 ISR이 아닌 **동적 렌더링**으로 처리한다. `revalidate=300`은 export되어 있으나 cookies 사용으로 page-level 정적 캐시는 비활성.
- **실질 캐시는 fetch 레이어가 담당**(전체 페이지 500 방지 + 외부 부하 완화):
  - Binance ticker: 60초 (`fetchBinanceTickers`의 `next.revalidate=60` + 메모리 Map 60초)
  - FNG: 1시간 (`fetchFng`의 모듈 메모리 + `next.revalidate=3600`)
  - community_posts/news/blog_posts: Supabase JS fetch (cookies 동적이라 매 요청 SSR, 단 동일 요청 내 1회)
  - hot-issues RPC: STABLE 함수
- **순수 5분 ISR이 꼭 필요하면** (후속 결정): cookies 불필요한 익명 읽기 전용 클라이언트(anon key 직접 생성)로 교체하면 `/`가 정적 ISR(`○`/`●`)로 떨어진다. 단 본 라운드는 사용자 명시 지시(`await createClient()`)를 우선 준수.

---

## 5. 의존성 7종 산출물 사용 위치

| 일꾼 | 산출물 | T15 사용 위치 | 비고 |
|---|---|---|---|
| **T01** | `community_posts`/`blog_posts` 등 스키마·인덱스 | `queries.ts` 베스트30/게시판3컬럼/공식글 SELECT | `is_deleted`/`is_notice`/`coin_symbol` 필터 |
| **T02** | community 시드(156행 INSERT 준비) | 실DB 시드 후 베스트·게시판·핫이슈가 채워짐 | 시드 미적용 시 빈 상태 fallback 노출 |
| **T03** | `fetchCommunityTickers()` + `CoinTicker` | `queries.ts` 시세 스트립·코인카드·사이드바 시세 | symbol="BTCUSDT", baseSymbol="BTC" |
| **T04** | `fetchFng()` + `FngSnapshot` | `queries.ts` → `FngGaugeWidget value/prevValue` | 실패 시 `{value:50, Neutral}` 폴백 |
| **T06** | news 4차원 컬럼(`category`/`importance_score`/`sentiment`) | `queries.ts` 최신뉴스10 SELECT → `NewsRow` | `symbol="ALL"`은 coinTag null 처리 |
| **T12** | board/community CRUD API + 컬럼 계약 | (간접) `community_posts` 컬럼명·slug 화이트리스트 일치 확인 | 메인은 직접 fetch(SSR), API는 작성/상세에서 사용 |
| **T13** | `community_hot_issues(int,int)` RPC | `queries.ts` `supabase.rpc(...)` → `HotIssueWidget` | trend `UP/DOWN/FLAT/NEW` → `up/down/same/new` 매핑 |

> orchestration 명세는 "의존성 8개"로 표기했으나 실제 나열은 7종(T01·T02·T03·T04·T06·T12·T13). T07(auth/middleware)은 T12 API 경유 간접 의존.

---

## 6. 컴포넌트 계약 변환 (T13 인계 "위젯 변환 책임은 T15" 이행)

`queries.ts`의 `Main*` 도메인 타입과 실제 컴포넌트 props가 달라, `app/page.tsx` 내 변환 헬퍼 5종으로 매핑:

| 헬퍼 | 입력(Main*) | 출력(컴포넌트) | 핵심 변환 |
|---|---|---|---|
| `toTickerItem` | `CoinTicker` | `TickerItem` | `baseSymbol`→symbol, `COIN_META[base].nameKo`→name·href |
| `toBoardPost` | `MainBestPost` | `BoardPost` | id=index+1(UUID는 href로), `211.34.*.*`→`211.34`, ISO→상대시간 |
| `toNewsItem` | `MainNewsItem` | `NewsHeadlineItem & {coinTag}` | pubDate ISO→timeLabel, source null→"출처 미상" |
| `toHotIssue` | `MainHotIssue` | `HotIssue` | symbol→`COIN_META.nameKo` keyword, `TREND_MAP` 대문자→소문자 |
| `toOfficialPost` | `MainOfficialPost` | `OfficialPost` | created_at→`date`(YYYY-MM-DD), slug 유지 |

- `COIN_META`(queries.ts export): BTC~AVAX 10종 + altcoin/kimp 메타. 로고색·이모지·한국어명·코인룸 링크. **mock 아닌 정적 브랜드 사전**이라 page.tsx의 mock-import 0건과 무관.
- `formatRelativeTime(iso)`: "방금 전/N분전/N시간전/N일전/N주전". (동적 렌더라 매 요청 기준 시각)

---

## 7. fallback 처리 패턴

| 시나리오 | 처리 |
|---|---|
| Binance API 다운 | `fetchCommunityTickers().catch(()=>[])` → 시세 스트립/코인카드 가격 0, 페이지 정상 |
| FNG API 다운 | `fetchFng().catch(()=>null)` → `{value:50, Neutral}` 회색 게이지 |
| 핫이슈 RPC 에러 | `hotRes.data ?? []` → 빈 위젯 |
| 베스트 글 0건 | "아직 게시글이 없습니다. 첫 글을 작성해보세요!" 안내 |
| 뉴스 0건 | "표시할 뉴스가 없습니다." 안내 |
| 게시판 컬럼 0건 | 컬럼별 "아직 글이 없습니다" 안내 |
| Supabase 쿼리 에러 | `*.data ?? []` 빈 배열 — `Promise.all`이지만 Supabase는 throw 안 함({data,error}) |

→ **외부 API throw 가능 지점만 `.catch`로 격리**, Supabase는 `?? []`로 graceful degrade. 전체 페이지 500 위험 없음.

---

## 8. 검증 (재현 명령)

```bash
cd "F:/11_dev/260523 코인 차트분석"

npx tsc --noEmit                                  # 0 error

grep -cE 'from "@/lib/community/mock-' app/page.tsx   # 0
grep -c "use client" app/page.tsx                     # 0
grep -c "fetchMainPageData" app/page.tsx              # 2
grep -c "export const revalidate" app/page.tsx        # 1

npm run build                                     # ✓ Compiled successfully, ┌ ƒ /
```

- 사전 존재 경고 1건: `lib/community/ip-mask.ts:3 import crypto from "node:crypto"` (Edge Runtime) — **T07 영역**, T15 무관. T12/T13 handover에도 동일 기록.

### 시각 검증 권장 (사용자 단계)

```bash
# 1) 실DB에 community 시드 적용 (T02 산출물)
npx tsx scripts/seed-community.ts --force
# (news/blog_posts도 데이터가 있어야 해당 섹션이 채워짐)

# 2) 개발 서버 기동 후 메인 진입
npm run dev    # http://localhost:3000

# 3) 확인: 시세 스트립·베스트·최신뉴스·게시판3컬럼·코인룸·사이드바(시세/핫이슈/FNG/공식글)
#    모든 섹션이 비어있지 않은지, 시안(PNG) 대비 디자인 회귀 없는지 비교
```

- 시드 미적용 시: 베스트/게시판/핫이슈는 빈 상태 안내, ticker/FNG는 외부 실데이터로 정상 표시(네트워크 가용 시).

---

## 9. R2 후보 / 후속 결정

1. **`/board/*`·`/news`·`/coin/[symbol]` 실데이터 전환**: 이 4개 페이지가 아직 `TICKER_LIST`/`HOT_ISSUES`/`OFFICIAL_POSTS`(mock-coins) + `MOCK_POSTS`/`MOCK_NEWS`를 사용. 전환 완료 후 mock-* 파일 **완전 삭제** 가능.
2. **순수 ISR 전환 검토**(§4): cookies 비의존 anon 클라이언트로 `/`를 정적 ISR화 → 성능·캐시 효율.
3. **핫이슈 keyword 고도화**: 현재 코인 심볼→한국어명. mock의 "비트코인 ETF" 같은 이슈 키워드는 RPC 확장(tags/title n-gram) 필요(T13 인계 §2).
4. **뉴스 category 한글 라벨**: news.category는 영문 enum(`regulation`/`tech`...). NewsRow가 그대로 표시 중 → 라벨 매핑 사전 추가 권장.
5. **베스트 정렬 정교화**: 현재 `like_count desc, view_count desc`. mock은 `likes + views*0.01` 가중. 운영 데이터 후 `is_hot` 배치 플래그 활용 검토.
6. **edge runtime node:crypto 경고**(T07): middleware가 `lib/community/ip-mask.ts`의 `node:crypto` 사용 → `node:` prefix 제거 또는 middleware runtime `nodejs` 명시(후속 트랙).

---

## 10. 참조

- 작업 명세: `docs/orchestration/2026-05-23-R1-mainpage/T15-mainpage-realdata.md`
- 의존 handover: T01(`...-R1-T01-community-migrations.md`), T03(`...-T03-ticker-ssot.md`), T04(`...-T04-fng-proxy.md`), T06, T12(`...-T12-board-api.md`), T13(`...-T13-hot-issues-rpc.md`)
- 산출 코드: `lib/community/queries.ts`, `app/page.tsx`
- 데이터 소스: `lib/supabase/crypto.ts`(ticker), `lib/community/fng.ts`(FNG), `supabase/migrations/20260523_create_hot_issues_rpc.sql`(RPC)
- 컴포넌트 계약: `components/community/{BoardRow,NewsRow,NewsHeadlineCard}.tsx`, `components/community/widgets/{PriceTicker,HotIssue,FngGauge,OfficialPosts}Widget.tsx`
- 보존된 mock(R2 정리 대상): `lib/community/mock-{coins,posts,news}.ts`
