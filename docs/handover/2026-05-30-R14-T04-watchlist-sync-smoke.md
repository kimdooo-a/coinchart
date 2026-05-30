# R14 / T04 — watchlist 회원 sync 스모크 (절차서 + DB 라운드트립 스크립트)

**작성**: 2026-05-30 / R14 (loose-ends) / Wave 1 (독립) / T04
**역할**: R12 watchlist 익명→회원 동기화의 **런타임 검증 수단** 작성(절차서 + 자동 스크립트)
**쓰기 영역**: `scripts/smoke/` + `docs/db/` (지시서 준수, 검증 대상 코드는 읽기만)

---

## (a) 산출 경로

| 산출물 | 경로 | 내용 |
|--------|------|------|
| 스모크 절차서 | `docs/db/R14-watchlist-sync-smoke.md` | 사람이 브라우저로 따라 할 익명적재→로그인sync→복원→reorder/clear 단계별 체크리스트(기대결과·실패의심지점 포함) |
| DB 검증 스크립트 | `scripts/smoke/watchlist-sync-smoke.ts` | service_role로 DB 레이어(테이블·컬럼·UNIQUE·RLS·CRUD) 자동 검증. `--dry-run`(기본)·`--write`(라운드트립) |

> 기존 `scripts/smoke/community-like-smoke.ts` 패턴(dotenv `.env.local`·`record()`·종료코드·합성키 자정리)을 그대로 차용.

---

## (b) `--dry-run` / `--write` 실행 결과 — DB 레이어 정상

운영 DB(`enksnhshciyvllwfiwrm`) 대상 실측:

```
# --dry-run (읽기 전용)
✅ 테이블 user_watchlist (존재·컬럼)  — id·user_id·asset_type·symbol·sort_order·created_at SELECT 가능
✅ 행 수(head count)                  — 현재 0행
✅ RLS — anon 비로그인 SELECT 차단    — anon SELECT = 0행 (RLS가 타인 행 비노출)
결과: PASS 3 / SKIP 1(라운드트립) / FAIL 0

# --write (라운드트립, auth.users 첫 사용자 자동 선택)
✅ 라운드트립 INSERT→SELECT→중복충돌(UNIQUE)→reorder(0→99)→DELETE 정상, 잔여 0행
결과: PASS 4 / SKIP 0 / FAIL 0
```

**판정: DB 레이어 계약 정상.**
- 마이그레이션 `20260529000001_create_user_watchlist` 운영 DB 적용 확인(테이블·6컬럼).
- `UNIQUE(user_id, asset_type, symbol)` 제약 실측 — 중복 INSERT가 `23505`로 충돌(= `syncWatchlist`의 `ON CONFLICT DO NOTHING` 멱등 머지 계약 근거 검증).
- RLS SELECT 정책 작동 — anon 키 비로그인 SELECT 0행(타인 행 비노출).
- reorder UPDATE·DELETE 라운드트립 정상, 합성 심볼(`SMOKE…`) 행 잔여 0(운영 DB 무오염).
- `npx tsc --noEmit` 0 에러.

---

## (c) 사용자가 직접 수행해야 할 실 로그인 스모크 (자동화 불가 — 위임)

service_role로는 RLS를 우회하므로 **실 회원 흐름**은 브라우저 로그인이 필요. 절차서 §3·§5·§6 요약:

1. **익명 적재**: 비로그인 상태로 종목 2~3개 즐겨찾기 → DevTools `cca:watchlist` 적재 확인.
2. **로그인 sync**: 로그인 → `POST /api/watchlist/sync` **200** + 응답 `{items,added,skipped,limit:100}` + 로컬이 DB 병합본으로 갱신(익명 항목 손실 0).
3. **다른 기기 복원**(sync 핵심): 시크릿 창/다른 브라우저에서 같은 계정 로그인 → 관심종목 복원.
4. **reorder/clear**: `PATCH /api/watchlist` 200·순서 유지 / `DELETE ?all=true` 200·잔여 복원 없음.

각 단계 실패 시 의심 지점(401 세션·400 형식·500 DB·RLS 비노출)은 절차서 §8 빠른 참조 표 참고.

---

## (d) 발견한 코드 결함/의심

**기능 결함 없음.** 검증 대상 코드(`useWatchlist.ts`·`watchlist.ts`·API route)는 읽기만 수행했고
DB 계약과 1:1 일치함을 확인. 다만 **런타임 관찰 시 확인 권장 사항**(결함 아님, 절차서에 반영):

1. **sync 1회 가드의 실패 복구** — `useWatchlist.ts`의 모듈 전역 `moduleSynced`는 `apiSync` 실패 시 `false`로 되돌려 다음 auth 이벤트에 재시도. 단 성공 후 같은 세션 내 재로그인 없이 추가된 항목은 개별 POST 경로로만 DB 반영됨(설계 의도 — sync는 로그인 직후 1회). 절차서 §3 주석에 명시.
2. **clear 후 잔여행 복원 위험** — `clearUserWatchlist`는 전건 DELETE이나, best-effort 실패 시 다음 로그인 sync가 로컬 우선 병합으로 동작하므로 로컬이 비어있으면 DB 잔여행이 복원될 수 있음(코드 주석에도 언급된 알려진 수렴 동작). 절차서 §6-4에서 "다른 기기 로그인 시 잔여 복원 없음"을 명시 검증 항목으로 추가.

→ 둘 다 **설계상 의도된 동작**이며 결함 아님. 실 로그인 스모크(§3·§5·§6)에서 사용자가 최종 실증하면 PENDING 해소.

---

## 자가 검증 (지시서 §7)

```powershell
npx tsc --noEmit                                              # ✅ 0 에러
npx tsx scripts/smoke/watchlist-sync-smoke.ts --dry-run       # ✅ PASS 3/SKIP 1/FAIL 0
npx tsx scripts/smoke/watchlist-sync-smoke.ts --write         # ✅ PASS 4/SKIP 0/FAIL 0 (잔여 0)
Test-Path docs/db/R14-watchlist-sync-smoke.md, scripts/smoke/watchlist-sync-smoke.ts  # True True
```

## 안티패턴 준수

- ✅ `scripts/smoke/`·`docs/db/` 밖 쓰기 없음(검증 대상 코드 미수정).
- ✅ service_role 키·자격증명 로그/문서 미노출(user_id도 8자 마스킹).
- ✅ `--write` 후 합성 심볼 행 정리(잔여 0 실측).
- ✅ 실 로그인 sync는 "검증했다" 단정 없이 절차서로 위임(정직).
- ✅ 신규 watchlist API·테이블 생성 없음(기존 계약 검증만).

---

## 잔여 / 다음

- **PENDING → 사용자 위임**: 실 회원 로그인 스모크(절차서 §3·§5·§6). 자격증명 보유자가 수행하면 R12 watchlist sync 런타임 검증 PENDING 완전 해소.
- 본 터미널은 **일꾼(worker)** — 통합 cs는 R14 지휘자 터미널이 본 handover를 회수하여 수행(글로벌 규칙: 일꾼 cs 생략).
