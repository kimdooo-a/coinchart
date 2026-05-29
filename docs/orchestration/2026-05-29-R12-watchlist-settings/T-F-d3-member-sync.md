# R12 / T-F — D3 회원 동기화 (일꾼 통합 프롬프트) · Wave 2

## 0. 정체성
- 너는 **R12 Wave 2 일꾼 T-F**. 역할은 watchlist 회원 동기화(D3): T-A 훅 ↔ T-C API 합류. 지휘관 아님 — handover만, cs 금지.

## 1. 컨텍스트
- 프로젝트: 코인차트분석. R12 Wave 1 PASS(미커밋, 같은 워킹트리). 익명=localStorage(`cca:watchlist`), 회원=DB 동기화.
- **쓰기 허용**: `components/hooks/` **만**. (동기화 로직을 훅 내부에 캡슐화 — 다른 영역 미접촉으로 T-E·T-D와 병렬 안전.)

## 2. 공통 SOT (읽기 전용 — 먼저 정독)
- `docs/handover/2026-05-29-R12-TC-db-api.md` **§3(엔드포인트) + §6(D3 연동 계약)** ← 핵심
- `docs/handover/2026-05-29-R12-TA-watchlist.md` §4(D3 지점)
- `components/hooks/useWatchlist.ts` (T-A 산출 — localStorage 소스·`onAuthStateChange` 이미 있음, 회원이면 상한만 100)
- `lib/supabase/watchlist.ts`(T-C SSOT, 형 참고)·`lib/supabase/client.ts`

## 3. 작업 목표 + 산출물
1. **로그인 직후 1회 sync**: 로컬(`cca:watchlist`) 목록을 `POST /api/watchlist/sync {items}`로 업로드 → **로컬 우선 병합**(taste #2). 응답 `items`로 로컬 갱신. `skipped>0`이면 상한 안내 노출 훅 제공.
2. **회원이면 DB 소스 전환**: 로그인 상태에서 add=`POST /api/watchlist`, remove=`DELETE /api/watchlist`, 목록=`GET /api/watchlist`. 익명은 기존 localStorage 그대로.
3. **구현 방식**: `useWatchlist.ts`의 `onAuthStateChange` 분기에 동기화 추가 또는 `components/hooks/useWatchlistSync.ts` 신설 후 `useWatchlist`가 내부 호출. **호출부(WatchlistView 등) 변경 없이** 훅 내부에서 완결(components/Watchlist/는 T-E 영역이라 미접촉).
4. **상한 409·심볼 표기**: POST 409(회원 100) UX 처리, CRYPTO=`BTCUSDT`/STOCK=`AAPL` 정규화 일치(T-C §6).

## 4. 의존성
- 선행: T-A(`useWatchlist`)·T-C(`/api/watchlist*`) 완료 — 충족됨.
- 병렬 안전: T-E(`app/layout.tsx`·`components/Watchlist/`)·T-D(`components/Common/`)와 파일 겹침 0.

## 5. 검증
- `npx tsc --noEmit`·`npx eslint components/hooks` 통과.
- 수동(가능 시): 익명 종목 담기 → 로그인 → sync 업로드 후 DB 반영·새 기기 로그인 시 목록 복원. 미실행이면 PENDING 명기(PASS 위장 금지).

## 6. 완료 신호
- `docs/handover/2026-05-30-R12-TF-d3-sync.md`: 산출 파일 / 동기화 흐름(로그인→sync→DB소스) / 409·충돌 처리 / 검증 / 격리 확인. **cs 금지**.

## 7. 안티패턴
- `components/Watchlist/`(T-E)·`app/`(T-E)·`lib/`(T-C 영역) 침범 · 신규 시세 API · DB 우선 병합(taste 위반 — 로컬 우선) · SSOT 교차 임포트 · 지휘관 자칭.
