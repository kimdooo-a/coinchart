# R13 T-B — watchlist 후속 (notice·reorder·clear·스모크) 인수인계서

> 작성: 2026-05-30 / 일꾼 터미널 T-B / 라운드 R13 (display-rollout / Wave1)
> 지시서: `docs/orchestration/2026-05-30-R13-display-rollout/T-B-watchlist-followups.md`

## 요약

R12 watchlist MVP가 남긴 후속 4건(B-1~B-4) 마감. notice UX 배너 구독·reorder DB 영속화(PATCH 엔드포인트+훅)·clear 벌크삭제 엔드포인트(DELETE all=true)·런타임 스모크. `tsc` exit 0·`eslint` error 0·`npm run build` 성공. 신규 API 라우트는 dev 런타임에서 401 인증 가드 동작 확인. **회원 로그인 UI 전체 경로(sync→DB→복원)는 미검증** — 헤드리스 환경에서 실 OAuth 로그인 불가 + dev 모드 페이지 렌더가 **T-B와 무관한 기존 `app/globals.css` 파싱 에러**로 차단됨(프로덕션 빌드는 통과). 수동 스모크 절차서 첨부.

---

## B-1. notice UX 배너 구독 — 완료

- `useWatchlist()`의 `notice`/`dismissNotice` 신호를 `WatchlistView`에서 구독해 사용자에게 표시.
- 기존 토스트 컴포넌트가 프로젝트에 없어 `components/Watchlist/` 내 경량 인라인 배너 신설.
- 메시지(ko/en):
  - `type:'limit'` → "관심종목은 최대 {limit}개까지 등록할 수 있어요."
  - `type:'sync-skipped'` → "{count}개 항목이 상한({limit})을 넘어 동기화에서 제외됐어요."
- 닫기 버튼 → `dismissNotice()`. 톤: `surface-container`·`outline-variant` 네이버 톤. 접근성: `role="status"` + `aria-live="polite"`, 닫기 버튼 `aria-label`, 장식 아이콘 `aria-hidden`.
- 배치: 헤더 직하·추가 바 직상(상단 노출).

**참고**: 현재 `notice` 발신 트리거는 훅이 이미 제공하던 2개 — (a) 회원 POST 409(`limit`), (b) 로그인 sync 상한 초과(`sync-skipped`). 익명 로컬 상한 도달은 `WatchlistAddBar`의 `isFull` 표시로 처리되며 별도 notice 미발신(기존 설계 유지, 본 라운드 범위 밖).

**신규 파일**: `components/Watchlist/WatchlistNotice.tsx`
**수정 파일**: `components/Watchlist/WatchlistView.tsx` (import·구조분해·렌더 3곳)

## B-2. reorder DB 영속화 — 완료

- 신규 엔드포인트 **`PATCH /api/watchlist`** 추가. 회원 RLS 하 `user_watchlist.sort_order` 일괄 갱신.
- SSOT(`lib/supabase/watchlist.ts`)에 `reorderWatchlist(supabase, userId, order)` 추가:
  - 입력 키 중복 제거 후 각 `(asset_type, symbol)`의 `sort_order`를 **UPDATE**(존재하지 않는 키는 0행 영향·무시).
  - Supabase에 행별 상이값 단일 일괄 UPDATE 원시명령이 없어 병렬 UPDATE(최대 100건, round-trip 허용). **신규 행 삽입 없음**(reorder는 재배열 전용 → upsert로 인한 phantom row 위험 회피).
- `useWatchlist.reorder`: 낙관적 로컬 재할당(`writeAndEmit`) 후 회원이면 `apiReorder(next)` best-effort 전송. 실패해도 로컬 유지(다음 sync 수렴). 익명은 localStorage만(현행 유지).

**수정 파일**: `lib/supabase/watchlist.ts`·`app/api/watchlist/route.ts`·`components/hooks/useWatchlist.ts`

## B-3. clear 벌크삭제 엔드포인트 — 완료

- 신규 엔드포인트 **`DELETE /api/watchlist?all=true`** 추가. 회원 RLS 하 본인 전 행 단일 쿼리 삭제.
- SSOT에 `clearUserWatchlist(supabase, userId)` 추가: `.delete().eq('user_id', userId).select('id')` 단일 쿼리, 삭제 행 수 반환.
- `useWatchlist.clear`: 기존 항목별 `apiRemoveItem` 루프(N회) → 벌크 호출 1회로 교체. **실패 시 1회 재시도**(로컬은 이미 비워졌으므로 다음 로그인 sync 잔여행 복원 위험을 줄이기 위함). 재시도도 실패하면 로컬 우선 sync 설계상 결국 수렴.

**수정 파일**: `lib/supabase/watchlist.ts`·`app/api/watchlist/route.ts`·`components/hooks/useWatchlist.ts`

## B-4. 런타임 스모크 — 부분 검증 (UI 전체 경로 미검증)

### 실제 수행한 것 (PASS)
- `npm run dev`(Next.js 16 Turbopack) 기동 성공.
- 신규 API 라우트 런타임 응답 검증(curl, 비로그인):
  - `PATCH /api/watchlist` → **401** `{"error":"로그인이 필요합니다."}` ✅ (라우트 등록·인증 가드 우선 동작)
  - `DELETE /api/watchlist?all=true` → **401** ✅
- 라우트가 정상 컴파일·등록되었고 인증 가드가 본문 처리보다 먼저 동작함을 확인.

### 미검증 (정직 보고)
- **회원 로그인 UI 전체 경로(익명 추가→로그인→sync→DB 반영→reorder/clear DB 반영→타 세션 복원)는 런타임 미검증.** 사유:
  1. 헤드리스/CLI 환경에서 실제 Google OAuth 로그인 세션을 만들 수 없음(실계정 로그인 불가).
  2. dev 모드 페이지 렌더가 **T-B와 무관한 기존 이슈**로 500 — `app/globals.css:3960`의 `var(--color-kr-*)` 와일드카드를 Turbopack CSS 파서가 거부(`Unexpected token Delim('*')`). `layout.tsx`가 globals.css를 import하므로 `/`·`/market`·`/settings` 등 **모든 페이지가 동일 500**(전역 이슈 입증 완료). **`npm run build`(프로덕션 CSS 파이프라인)는 통과** → 프로덕션 렌더는 정상.
  - → 이 CSS 이슈는 T-B 쓰기 영역(`components/Watchlist/`·`components/hooks/`·`app/api/watchlist/`) 밖이라 **수정하지 않음**. 별도 일꾼/지휘자 처리 권장(후속 참조).

### 수동 스모크 절차서 (회원 경로 검증 — dev CSS 이슈 해소 후 또는 프로덕션에서)
1. 익명 상태로 `/watchlist`에서 코인·주식 몇 개 추가(localStorage `cca:watchlist` 확인).
2. Google 로그인 → 로그인 직후 1회 `POST /api/watchlist/sync` 발생 확인(Network 탭). DB `user_watchlist`에 행 삽입·`localStorage`가 DB 병합본으로 갱신되는지.
3. 표에서 reorder(드래그/이동) → `PATCH /api/watchlist` 200 + DB `sort_order` 반영 확인.
4. "전체 비우기" → `DELETE /api/watchlist?all=true` 200 + DB 전 행 삭제 확인.
5. 시크릿창에서 같은 계정 로그인 → sync로 DB 목록 복원(2의 잔여)·clear 후엔 빈 목록 확인.
6. 상한 초과 시나리오: 회원 100개 초과 추가 시도 → POST 409 → notice 배너 `limit` 노출 확인. 익명 31개 이상 로컬 보유 후 로그인 → sync `skipped>0` → notice 배너 `sync-skipped` 노출 확인.

---

## 신규/변경 API 엔드포인트 (지휘자 `_API_REFERENCE.md` 갱신용)

| 메서드·경로 | body | 응답 | 비고 |
|---|---|---|---|
| `PATCH /api/watchlist` | `{ order: [{ assetType:'CRYPTO'\|'STOCK', symbol, sortOrder }] }` | 200 `{ ok:true, updated:number }` / 400 `{error}`(order 배열 아님·500개 초과) / 401 / 500 | 표시 순서 일괄 영속화. 회원 전용·RLS. 미존재 키 무시. 최대 500건 |
| `DELETE /api/watchlist?all=true` | (없음) | 200 `{ ok:true, cleared:number }` / 401 / 500 | 본인 전건 삭제(벌크 clear). `all=true` 없으면 기존 단건 삭제 분기 유지 |

기존(R12, 변경 없음): `GET`/`POST`/`DELETE(단건)` `/api/watchlist`, `POST /api/watchlist/sync`.

---

## 수정/신규 파일 목록

**신규**
- `components/Watchlist/WatchlistNotice.tsx`

**수정**
- `components/Watchlist/WatchlistView.tsx` — notice 구독·배너 렌더
- `components/hooks/useWatchlist.ts` — `apiReorder`·`apiClearAll` 헬퍼, `reorder`/`clear` DB 영속화
- `app/api/watchlist/route.ts` — `PATCH`(reorder)·`DELETE ?all=true`(벌크 clear)
- `lib/supabase/watchlist.ts` — `reorderWatchlist`·`clearUserWatchlist` SSOT 함수

### 쓰기 영역 관련 메모 (지휘자 확인 요망)
지시서 §6은 쓰기 영역을 `components/Watchlist/`·`components/hooks/`·`app/api/watchlist/` 3곳으로 한정하나, B-2/B-3은 "RLS 우회 금지 + `lib/supabase/` SSOT 경유"를 동시 요구. DB 영속화 엔드포인트는 신규 SSOT 함수 없이는 구현 불가하므로 **watchlist 전용 SSOT인 `lib/supabase/watchlist.ts`를 확장**(다른 일꾼 T-A1/T-A2/T-C 영역과 무충돌·watchlist 단일 도메인). RLS-scoped 사용자 세션 클라이언트(`@/lib/supabase/server`) 경유로 service_role 우회 없음.

---

## 검증 결과

```
npx tsc --noEmit                                          → exit 0 ✅
npx eslint components/Watchlist/ components/hooks/useWatchlist.ts \
          app/api/watchlist/ lib/supabase/watchlist.ts    → error 0 ✅
npm run build                                             → 성공(/watchlist 포함 전 라우트 컴파일) ✅
런타임(dev): PATCH·DELETE?all=true → 401 가드 ✅ / UI 전체 경로 → 미검증(상기 사유)
```

---

## 미해결 / 후속

1. **[T-B 외부·우선] `app/globals.css:3960` dev 모드 CSS 파싱 에러** — `var(--color-kr-*)` 와일드카드를 Turbopack CSS 파서가 거부 → dev 모드 전 페이지 500. 프로덕션 빌드는 통과하나 **로컬 dev 개발이 막힘**. 지휘자가 별도 일꾼에 배정 권장.
2. **회원 경로 런타임 검증** — 상기 수동 스모크 절차서로 실 로그인 환경(또는 dev CSS 이슈 해소 후)에서 확인 필요.
3. **reorder 부분 실패 처리** — 병렬 UPDATE 중 일부만 실패 시 첫 에러로 throw(클라 best-effort라 로컬 유지·다음 sync 수렴). 전부-또는-전무 트랜잭션이 필요하면 RPC 함수로 전환 검토(현재 불필요).
4. **clear 벌크삭제 동시성** — 익명 항목이 없는 상태에서 호출 시 `cleared:0` 정상. 재시도 1회로 대부분 커버.
