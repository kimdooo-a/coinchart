# T04 — 코인룸 SSR 전환 + 새 메타 적용

> **본 터미널은 R3 일꾼(T04 / 12)**. Wave 2 (T01 메타 SSOT 후 발사 권장. 미완 시 mock re-export로 lazy 진행).

## 1. 컨텍스트

- 프로젝트: Crypto Chart Analysis (v2.0 커뮤니티 — 네이버 톤, 빨↑/파↓)
- 작업 디렉토리: `F:\11_dev\260523 코인 차트분석`
- 본 터미널 역할: **T04 / 12** — `/coin/[symbol]` 6종(btc/eth/xrp/sol/altcoin/kimp)을 **`"use client"` 클라 fetch → SSR**로 전환하고 `coin-queries.ts`의 mock import를 제거
- 라운드: R3 (community-finish)

배경: R2-T03에서 `/coin/[symbol]`은 `"use client"` + `coin-queries.ts` 클라 fetch(시세 `/api/coins/ticker`·게시글 `/api/board/coin-{slug}`·뉴스 `/api/news?query=`·사이드바)로 실데이터화됐다. `coin-queries.ts`에 정적 사전 `COIN_ROOMS`/`COIN_META`가 있고 **mock-coins/mock-posts/mock-news를 일부 import**(grep 확인됨)한다. R3는 **SSR 전환 + mock import 완전 제거**. **참고: R1/T15 SSR 패턴**.

## 2. 공통 SOT (읽기 전용)

```
CLAUDE.md  ·  docs/PROJECT_DIRECTION.md
docs/handover/2026-05-23-R1-T15-mainpage-realdata.md   ← SSR + 서버 fetch 패턴 (필독)
docs/handover/2026-05-23-R2-T03-coin-realdata.md       ← 현 클라 fetch + COIN_ROOMS/COIN_META 구조 (필독)
docs/references/_API_REFERENCE.md
lib/community/coin-queries.ts     ← COIN_ROOMS/COIN_META + fetch 래퍼 (수정 대상, mock import 제거)
app/coin/[symbol]/page.tsx        ← 수정 대상
lib/community/board-meta.ts·news-meta.ts ← T01 산출 (coin이 메타 필요 시 여기서)
```

## 3. 작업 목표

### Phase 1: coin-queries.ts mock import 제거
- `coin-queries.ts`가 import하는 `mock-coins`/`mock-posts`/`mock-news`를 제거. 필요한 정적 값은 `COIN_META`로 자체 보유(이미 복사돼 있으면 import만 삭제) 또는 `board-meta`/`news-meta`에서 가져옴.
- 서버 사이드 fetch 함수 추가/조정 (서버 클라이언트 또는 절대 URL + `next.revalidate`).

### Phase 2: 코인룸 SSR (`/coin/[symbol]`)
- 서버 컴포넌트로 전환: `params.symbol`로 서버에서 시세·게시글·뉴스 초기 fetch → 렌더
- 인터랙션(탭/더보기 등)은 클라 하위 컴포넌트. JSX·디자인 보존
- altcoin/kimp는 `isAggregate` 정적 폴백 설명형(R2-T03 패턴) 유지
- `generateMetadata`로 코인별 메타 (SEO)

## 4. 도구 권장
- 직접 작성. Next.js 16 App Router 서버/클라 경계.

## 5. 의존성
- **dep T01** (필요 시 board-meta/news-meta). coin은 대부분 자체 `COIN_META` 보유라 약한 의존.
- 후행 T05가 mock 참조 0 확인 후 삭제 → **coin-queries에서 mock import 0** 필수 (T05 진행의 핵심 차단점).

## 6. 검증

```powershell
npx tsc --noEmit
Select-String -Path app/coin/**/*.tsx,lib/community/coin-queries.ts -Pattern "lib/community/mock-"  # 기대: 0건
npm run build 2>&1 | Select-Object -Last 25
```

```bash
npx tsc --noEmit
grep -rn "lib/community/mock-" app/coin/ lib/community/coin-queries.ts   # 기대: 0건
npm run build 2>&1 | tail -25
```

시각 검증(권장): `npm run dev` → `/coin/btc`·`/coin/altcoin`·`/coin/kimp`.

## 7. 완료 신호
`docs/handover/2026-05-24-R3-T04-coin-ssr.md` 작성. 명시: SSR 전환 범위·서버/클라 경계·coin-queries mock import 제거(T05 차단점 해소)·`generateMetadata`·렌더 모드.

## 8. 안티패턴
- ❌ `app/board/`·`app/news/`·`app/page.tsx` 수정 (T02·T03 영역)
- ❌ `app/api/` 수정 (기존 API 호출만)
- ❌ `lib/community/mock-*.ts` 삭제 (T05). coin에서 **import만 제거**
- ❌ JSX/디자인 무차별 변경 / altcoin·kimp 폴백 회귀
- ❌ 새 패키지 무단 설치 / 한국어 주석 누락
