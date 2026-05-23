# R2-T03 — coin-realdata

> **본 터미널은 R2 일꾼(R2-T03)**. 1차 발사. 동시 발사 그룹.

## 정체성

- 역할: `worker` (R2-T03), R2, realdata-finish
- 담당: 코인룸 페이지(`/coin/[symbol]`, btc/eth/xrp/sol/altcoin/kimp 6종)를 **mock → 실데이터** 로 전환
- 의존: R1/T03 (ticker SSOT), R1/T12 (coin-* 게시판 API), R1/T06 (news), R1/T13 (hot-issues)

## 컨텍스트

`app/coin/[symbol]/page.tsx`(`"use client"`)는 `mock-coins.ts`(getCoin/COINS/TICKER_LIST/HOT_ISSUES/OFFICIAL_POSTS) + `mock-posts.ts`(getPostsForCoin) + `mock-news.ts`(getNewsForCoin)를 사용. 코인룸은 시세 + 코인별 게시글 + 코인별 뉴스 + 사이드바를 보여준다. 실데이터 소스:
- 시세/코인 메타: `GET /api/coins/ticker` + 정적 코인 메타(이름·로고·설명)
- 코인별 게시글: `GET /api/board/coin-{symbol}` (T12 slug 화이트리스트의 coin-* 6종)
- 코인별 뉴스: `GET /api/news?coin={symbol}` (또는 symbol 필터)
- 사이드바: `/api/coins/hot-issues`·`/api/fng`

## 공통 SOT (읽기 전용)

```
CLAUDE.md
docs/handover/2026-05-23-R1-T03-ticker-ssot.md       ← fetchCommunityTickers/CoinTicker, /api/coins/ticker
docs/handover/2026-05-23-R1-T12-board-api.md         ← coin-* slug 6종 (coin-btc/eth/xrp/sol/altcoin/kimp)
docs/handover/2026-05-23-R1-T06-news-classify-integration.md ← /api/news symbol 필터
docs/handover/2026-05-23-R1-T13-hot-issues-rpc.md    ← /api/coins/hot-issues
docs/handover/2026-05-23-R1-T15-mainpage-realdata.md ← COIN_META 브랜드 사전(이름/로고/설명) 참고
app/coin/[symbol]/page.tsx                           ← 수정 대상
components/community/CoinHero.tsx                     ← CoinHeroData props 계약
lib/community/mock-coins.ts                           ← CoinDetail/COINS 메타(정적 브랜드 정보) 참고
```

## 작업 목표

코인룸을 실시세 + 코인별 실게시글/실뉴스로 전환. 코인 정적 메타(이름·심볼·로고색·설명)는 mock의 COINS 또는 T15 `COIN_META`를 정적 사전으로 활용(시세는 실데이터).

### 산출물

- **수정** `app/coin/[symbol]/page.tsx`: `getCoin`→정적 메타 사전 + `GET /api/coins/ticker`로 가격/변동. `getPostsForCoin`→`GET /api/board/coin-{symbol}`. `getNewsForCoin`→`GET /api/news?coin={symbol}`. 6종 symbol 검증(btc/eth/xrp/sol/altcoin/kimp), 미존재 시 `notFound()`.
- **(선택) 신규** `lib/community/coin-queries.ts`: 클라 fetch 래퍼 + 매퍼 + 코인 정적 메타 사전(T15 COIN_META 재사용 또는 import).
- **사이드바 위젯**: `/api/coins/ticker`·`/api/coins/hot-issues`·`/api/fng` 실데이터화.
- altcoin/kimp는 단일 코인 가격이 없으므로 설명형 카드 유지(T15 패턴 참고).

## 작업 단계

1. SOT 정독 (T03·T12 handover 우선)
2. coin-queries.ts 또는 페이지 내부 fetch 헬퍼 + 정적 메타 사전 작성
3. CoinHero(시세) 실데이터 연결
4. 코인별 게시글 표 → `/api/board/coin-{symbol}`
5. 코인별 뉴스 → `/api/news?coin={symbol}`
6. 사이드바 위젯 실데이터화
7. altcoin/kimp 특수 처리 + fallback
8. 검증

## 검증

```bash
npx tsc --noEmit                                          # 0 error
grep -rn "@/lib/community/mock-" app/coin/                # 기대: 정적 메타만 (또는 0)
grep -rn "/api/coins/ticker\|/api/board/coin-\|/api/news" app/coin/   # 기대: 다수
npm run build 2>&1 | tail -20                             # Compiled successfully
```

시각 검증(권장): `npm run dev` → `/coin/btc` 시세·게시글·뉴스 채워짐 확인.

## 완료 신호

`docs/handover/2026-05-23-R2-T03-coin-realdata.md` 작성. 명시: 수정 파일·API 매핑표·정적 메타 사전 출처·altcoin/kimp 처리·fallback·mock import 잔여 사유.

## 안티패턴

- `lib/community/mock-*.ts` 삭제 금지 (회수 후 지휘자 일괄)
- `app/board/`, `app/news/`, `app/page.tsx`, `app/api/`, `lib/community/queries.ts` **수정 금지** (각 영역 외)
- `lib/supabase/crypto.ts` 수정 금지 (T03 SSOT)
- JSX·디자인 대폭 변경 금지
- 새 패키지 설치 금지
