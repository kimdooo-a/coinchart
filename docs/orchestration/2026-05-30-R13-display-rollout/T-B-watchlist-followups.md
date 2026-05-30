# T-B — watchlist 후속 (notice·reorder·clear·스모크) (R13 / display-rollout / Wave1)

> 이 문서는 자기완결 통합 프롬프트다. 정독 후 그대로 실행하라.

## 0. 정체성

너는 R13의 **일꾼 터미널 T-B**다. 지휘자가 아니다. 다른 일꾼(T-A1·T-A2·T-C)의 작업을 건드리지 마라. 너의 쓰기 영역은 **`components/Watchlist/`·`components/hooks/`·`app/api/watchlist/`** 뿐이다.

## 1. 컨텍스트

- 프로젝트: `F:\11_dev\260523 코인 차트분석` (Next.js 16 App Router·TS strict·Tailwind v4·Supabase)
- R12에서 watchlist 익명 우선 MVP를 완성했다(`useWatchlist` 훅·`WatchlistTable`·`WatchlistView`·`user_watchlist` DB·API). **운영 DB에 `user_watchlist` 테이블·RLS 적용 완료.**
- 본 라운드는 R12 handover가 남긴 후속 4건을 마감한다.

## 2. 현재 구현 상태 (정확히 파악하고 시작)

`components/hooks/useWatchlist.ts`(392줄)를 정독하라. 핵심:
- **notice/dismissNotice**: 이미 제공됨(`UseWatchlist.notice`·`dismissNotice`, 209~235·247~248줄). `WatchlistNotice = {type:'limit',limit} | {type:'sync-skipped',count,limit}`. **그러나 `WatchlistView`가 이 신호를 구독해 사용자에게 표시하는 UI가 없다.**
- **reorder**(359~365줄): localStorage sortOrder만 재할당. **회원이어도 DB에 순서가 반영되지 않는다**(DB 영속화 누락).
- **clear**(367~375줄): 회원이면 항목별 `apiRemoveItem` 루프(best-effort). 주석에 "벌크 삭제 엔드포인트 없음" 명시 — **누락 시 다음 로그인 sync가 잔여 DB 행을 복원할 위험.**
- API 현황: `app/api/watchlist/route.ts`(POST add·DELETE 단건 remove), `app/api/watchlist/sync/route.ts`(로컬 우선 병합). 너의 영역이므로 정독하라.

## 3. 작업 목표 (4건)

### B-1. notice UX 토스트/배너 구독
- `components/Watchlist/WatchlistView.tsx`(244줄)에서 `useWatchlist()`의 `notice`/`dismissNotice`를 구독해 사용자에게 표시.
- `type:'limit'` → "관심종목은 최대 {limit}개까지 등록할 수 있어요." / `type:'sync-skipped'` → "{count}개 항목이 상한({limit})을 넘어 동기화에서 제외됐어요."
- 토스트 또는 상단 배너(네이버 톤·`surface-container`·`outline-variant`). 닫기 버튼 → `dismissNotice()`. 한국식 톤·접근성(role/aria) 고려.
- 기존 토스트 컴포넌트가 프로젝트에 있으면 재사용, 없으면 `components/Watchlist/` 내 경량 인라인 배너로.

### B-2. reorder DB 영속화
- `app/api/watchlist/`에 **순서 변경 엔드포인트** 추가(예: `PATCH /api/watchlist/reorder` 또는 기존 route에 PATCH 메서드 — 너의 판단). body=정렬된 `[{assetType,symbol,sortOrder}]` 또는 `{order:[key...]}`. 회원 RLS 하에 `user_watchlist.sort_order` 일괄 UPDATE.
- `useWatchlist.reorder`에서 회원(`isMemberRef.current`)이면 낙관적 로컬 재할당 후 새 순서를 위 엔드포인트로 best-effort 전송. 실패해도 로컬은 유지(다음 sync에서 수렴). 익명은 localStorage만(현행 유지).
- `user_watchlist` 컬럼명은 `docs/references/_SCHEMA_REFERENCE.md`에서 확인(sort_order 등 snake_case). `lib/supabase/` SSOT 경유.

### B-3. clear 벌크삭제 엔드포인트
- `app/api/watchlist/`에 **전건 삭제 엔드포인트**(예: `DELETE /api/watchlist?all=true` 또는 `DELETE /api/watchlist/all`). 회원 RLS 하 `user_watchlist`에서 해당 user 전 행 삭제(단일 쿼리).
- `useWatchlist.clear`(367~375줄)의 항목별 루프를 이 벌크 호출 1회로 교체. 실패 시 로컬은 이미 비워졌으므로, 다음 로그인 sync 복원 위험을 줄이려면 벌크 삭제 성공 보장이 중요 — 실패 로깅/재시도 여지 handover에 명시.

### B-4. 런타임 스모크 (회원 sync 검증)
- R12에서 **회원 경로(sync→DB반영→새기기 복원)가 정적 검증만 됐다**(PENDING). 가능하면 `npm run dev`로 서버 띄우고 회원 로그인 후:
  1. 익명 상태로 watchlist 몇 개 추가 → 로그인 → sync로 DB 반영되는지
  2. reorder/clear가 DB에 반영되는지(B-2·B-3 검증 겸)
  3. 다른 세션(시크릿창)에서 같은 계정 로그인 시 복원되는지
- dev 서버·실계정 로그인이 불가하면 **정적 검증 + 수동 스모크 절차서**를 handover에 남겨라(PASS 위장 금지 — "런타임 미검증, 절차 문서화"로 정직하게).

## 4. 검증

```
npx tsc --noEmit          # exit 0
npx eslint components/Watchlist/ components/hooks/useWatchlist.ts app/api/watchlist/   # error 0 (실제 변경 파일)
npm run build             # 가능하면
```

## 5. 완료 신호

`docs/handover/2026-05-30-R13-T-B-watchlist-followups.md` 작성:
- B-1~B-4 각 결과 + 수정/신규 파일 목록
- 신규 API 엔드포인트 시그니처(메서드·경로·body·응답) — 지휘자가 `_API_REFERENCE.md` 갱신에 사용
- 런타임 스모크: 실제 수행 여부 + 결과(또는 절차서)
- 미해결/후속

## 6. 안티패턴

- `components/Watchlist/`·`components/hooks/`·`app/api/watchlist/` 밖 수정 금지
- `lib/config/display-settings.tsx`·다른 일꾼 영역 수정 금지
- `lib/supabase/crypto.ts`↔`stock.ts` 교차 임포트 금지 (watchlist는 `lib/supabase/watchlist.ts` SSOT 경유 — eslint 화이트리스트 등재됨)
- RLS 우회(service_role 클라이언트로 사용자 데이터 접근) 금지 — 사용자 세션 클라이언트 사용
- 런타임 미검증을 검증된 것처럼 보고 금지
