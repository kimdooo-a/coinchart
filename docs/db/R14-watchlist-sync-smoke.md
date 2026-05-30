# R14 watchlist 회원 sync 런타임 스모크 절차서

**작성**: 2026-05-30 / R14 (loose-ends) / T04
**대상 실행자**: 운영자 / 개발자 (테스트 회원 계정 + dev 서버 기동 가능자)
**소요**: 약 10~15분
**검증 대상(읽기 전용)**: R12에서 구축한 watchlist 익명→회원 동기화 흐름

> ⚠️ **자격증명·service_role 키를 이 문서나 어떤 스크립트에도 절대 기입하지 마세요.**
> service_role 키는 `.env.local` 참조로만 처리하며, 회원 로그인은 브라우저에서 직접 수행합니다.

---

## 1. 무엇을 / 왜

R12(세션 38·39)에서 watchlist 익명 우선 MVP + 회원 DB 동기화를 구현하고 운영 DB에
`user_watchlist`(RLS 4종)를 적용했으나, **회원 sync 런타임 검증은 PENDING**(정적 검증만 통과).

검증해야 할 실제 흐름:

```
[익명] localStorage(cca:watchlist) 에 관심종목 적재
   │  로그인
   ▼
[sync] POST /api/watchlist/sync — 로컬 우선 병합 업로드(로컬+DB 합집합)
   │
   ▼
[회원] user_watchlist 테이블에 user_id 단위로 영속
   │  다른 기기/시크릿 창에서 같은 계정 로그인
   ▼
[복원] GET 병합본을 localStorage 로 덮어써서 관심종목 복원
```

이 절차서는 **사람이 브라우저로 직접 따라 할 단계별 체크리스트**(§3·§5·§6)와,
**자격증명 없이 DB 측을 자동 검증하는 보조 스크립트**(§4) 두 축으로 구성된다.

### 검증 대상 코드(읽기 전용 — 본 작업에서 수정 금지)

| 파일 | 역할 |
|------|------|
| `components/hooks/useWatchlist.ts` | 익명 localStorage ↔ 회원 DB sync 로직 (모듈 전역 `moduleSynced` 1회 가드) |
| `lib/supabase/watchlist.ts` | watchlist SSOT (`syncWatchlist`·`addToWatchlist`·`reorderWatchlist`·`clearUserWatchlist`) |
| `app/api/watchlist/route.ts` | GET/POST/PATCH(reorder)/DELETE(?all) — 회원 전용(미회원 401) |
| `app/api/watchlist/sync/route.ts` | 로그인 시 localStorage→DB 병합 sync (회원 전용) |
| `lib/config/local-data.ts` | localStorage 키 SSOT (`cca:watchlist`) |

---

## 2. 사전 준비

1. **dev 서버 기동**
   ```powershell
   npm run dev
   ```
   기본 `http://localhost:3000`.

2. **테스트 회원 계정 1개 준비** — 이메일/OAuth 로그인 가능한 계정. (없으면 가입 먼저.)

3. **service_role 보조 검증 준비**(선택) — `.env.local`에 다음이 있어야 §4 스크립트가 동작:
   - `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (필수)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (선택 — RLS 차단 검증용)

4. **DevTools** — Application ▸ Local Storage ▸ `localhost:3000` 패널을 열어 `cca:watchlist` 키를 관찰.

---

## 3. 절차 — 익명 적재 → 로그인 sync

| # | 단계 | 조작 | 기대 결과 | 실패 시 의심 지점 |
|---|------|------|-----------|-------------------|
| 3-1 | **익명 적재** | **비로그인** 상태로 코인룸/관심종목 화면에서 종목 2~3개를 즐겨찾기 추가 | DevTools `cca:watchlist` 값이 `{"version":1,"items":[...]}` 형태로 추가됨. items 길이 = 추가 수 | localStorage 비활성/쿼터 / `STORAGE_KEY` 불일치(`cca:watchlist` 확인) |
| 3-2 | **로그인** | 같은 브라우저에서 테스트 계정으로 로그인 | 로그인 직후 `useWatchlist`가 자동 1회 sync 트리거 (`onAuthStateChange` → `runSync`) | `createClient()` 세션 미감지 / Supabase Auth 설정 |
| 3-3 | **sync 요청 관찰** | DevTools ▸ Network 에서 `POST /api/watchlist/sync` 확인 | 상태 **200**, 응답 JSON `{ items, added, skipped, limit:100 }`. `added` = 신규 업로드 수 | 401=세션 누락 / 400=`items 배열` 형식 / 500=DB·RLS 오류(§4로 교차 확인) |
| 3-4 | **localStorage 갱신** | sync 응답 후 `cca:watchlist` 재확인 | DB 병합본(`createdAt`이 ISO→ms로 변환된 항목)으로 덮어써짐. 익명 항목 **손실 0**(로컬 우선 병합) | `writeAndEmit(result.items.map(serverToLocal))` 미동작 / 응답 `items` 비어있음 |
| 3-5 | **상한 안내**(선택) | 익명에서 30개 초과 시도 후 로그인 | 100 초과분만 `skipped`로 보고되고 `notice: sync-skipped` 노출 | 상한 계약: 익명 30(`WATCHLIST_LIMIT_ANON`)·회원 100(`MEMBER_WATCHLIST_LIMIT`) |

> sync는 **로그인 세션당 1회**(모듈 전역 `moduleSynced` 가드). 같은 탭에서 반복 로그인해도 중복 sync가 차단된다.
> 실패(`apiSync`가 null) 시 `moduleSynced=false`로 되돌려 다음 auth 이벤트에 재시도한다.

---

## 4. 보조 — service_role DB 레이어 자동 검증 (자격증명 불요)

브라우저 단계와 **별개로**, DB 계약(테이블·컬럼·제약·CRUD)이 정상인지 자동 확인한다.
이 스크립트는 **앱 경로(로그인·sync)를 대체하지 않는다** — DB 레이어만 본다.

```powershell
# (a) 읽기 전용(기본) — 테이블·컬럼·행 수·RLS(anon 차단) 확인
npx tsx scripts/smoke/watchlist-sync-smoke.ts --dry-run

# (b) 라운드트립 — INSERT→SELECT→중복충돌(UNIQUE)→reorder UPDATE→DELETE (auth.users 첫 사용자 자동 선택)
npx tsx scripts/smoke/watchlist-sync-smoke.ts --write

# (c) 특정 사용자 지정 라운드트립
npx tsx scripts/smoke/watchlist-sync-smoke.ts --write --user-id=<uuid>
```

- `.env.local`의 `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`를 사용(키는 출력하지 않음).
- **PASS**: 테이블·컬럼 계약 일치 + RLS anon SELECT 0행 + (`--write` 시) 라운드트립 정상·잔여 0행.
- **FAIL**: 마이그레이션(`20260529000001`) 미적용 또는 UNIQUE/RLS 계약 불일치를 명시 출력하고 종료코드 1.
- **SKIP**: anon 키 미설정(RLS 검증), auth.users에 사용자 없음(라운드트립) 등 — 객체는 존재.
- `--write`는 합성 심볼(`SMOKE…`) 행만 생성하고 같은 실행 내에서 정리하므로 운영 데이터에 잔여를 남기지 않음.

본 세션 직접 실행 예시(`!` 접두로 출력이 대화에 남음):
```
! npx tsx scripts/smoke/watchlist-sync-smoke.ts --dry-run
```

### user_watchlist DB 계약 (검증 기준)

| 항목 | 값 |
|------|-----|
| 컬럼 | `id`(UUID PK)·`user_id`(FK auth.users CASCADE)·`asset_type`(CHECK CRYPTO/STOCK)·`symbol`·`sort_order`(int)·`created_at` |
| 제약 | `UNIQUE (user_id, asset_type, symbol)` — 머지 시 `ON CONFLICT DO NOTHING` 근거 |
| 인덱스 | `idx_user_watchlist_user (user_id, sort_order)` |
| RLS | 본인(`auth.uid() = user_id`)만 SELECT/INSERT/UPDATE/DELETE (4정책) |
| 상한 | 회원 100 (API 가드) / 익명 30 (클라이언트 localStorage) |

---

## 5. 절차 — 다른 기기 복원 (sync의 핵심 가치)

| # | 단계 | 조작 | 기대 결과 | 실패 시 의심 지점 |
|---|------|------|-----------|-------------------|
| 5-1 | **새 환경** | **시크릿 창** 또는 다른 브라우저(=빈 localStorage)에서 dev 서버 접속 | `cca:watchlist` 없음(빈 목록) | — |
| 5-2 | **동일 계정 로그인** | 같은 테스트 계정으로 로그인 | 로그인 직후 sync 1회 → 빈 로컬 + DB = DB 항목 복원 | `runSync`가 빈 로컬을 업로드 후 DB 병합본 수신 |
| 5-3 | **복원 확인** | 관심종목 화면 + `cca:watchlist` 확인 | §3에서 추가했던 종목이 **그대로 복원**됨 | GET/sync 응답 `items` 비어있음 / RLS가 본인 행 미노출(§4 RLS 검증과 교차) |

> 이 단계가 sync의 본질(기기 간 동기화)을 증명한다. 5-3이 통과해야 "회원 sync 동작"이 실증된다.

---

## 6. 절차 — reorder / clear DB 반영

| # | 단계 | 조작 | 기대 결과 | 실패 시 의심 지점 |
|---|------|------|-----------|-------------------|
| 6-1 | **reorder** | 회원 상태에서 관심종목 순서를 드래그/이동 | `PATCH /api/watchlist` 200, `{ ok:true, updated:N }`. 새로고침 후 순서 유지 | `apiReorder` best-effort / `reorderWatchlist` 병렬 UPDATE 실패 |
| 6-2 | **reorder 영속 확인** | §4 `--write`가 아닌, GET으로 확인하거나 다른 기기 로그인 | 변경된 `sort_order`가 DB에 반영 | sort_order UPDATE 누락 |
| 6-3 | **clear** | 관심종목 전체 삭제(clear) | `DELETE /api/watchlist?all=true` 200, `{ ok:true, cleared:N }`. 로컬·DB 모두 비워짐 | `apiClearAll` 실패 시 1회 재시도(코드상) / 다음 로그인 sync가 잔여 복원하면 clear 미반영 |
| 6-4 | **clear 후 복원 없음 확인** | 다른 기기 로그인 | 관심종목이 비어있어야 함(잔여행 복원 X) | `clearUserWatchlist` 전건 DELETE 누락 → 잔여행 sync 복원 |

---

## 7. 체크리스트

- [ ] `npm run dev` 기동
- [ ] (§3) 익명 localStorage 적재 → 로그인 → `POST /api/watchlist/sync` 200 + 로컬 병합본 갱신
- [ ] (§4) `npx tsx scripts/smoke/watchlist-sync-smoke.ts --dry-run` → PASS (테이블·컬럼·RLS)
- [ ] (§4) `npx tsx scripts/smoke/watchlist-sync-smoke.ts --write` → PASS (DB 라운드트립·잔여 0)
- [ ] (§5) 시크릿 창 동일 계정 로그인 → 관심종목 복원 확인
- [ ] (§6) reorder PATCH 200 + 다른 기기 순서 유지 / clear DELETE?all 200 + 잔여 복원 없음

---

## 8. 실패 분류 빠른 참조

| 증상 | 1차 의심 | 확인 수단 |
|------|----------|-----------|
| sync 401 | 세션 미감지 | 로그인 상태·쿠키 / `supabase.auth.getUser()` |
| sync 400 | 요청 형식 | body `{ items:[...] }` 형식 / `MAX_SYNC_ITEMS=500` 초과 |
| sync 500 | DB·RLS·테이블 | §4 스크립트 FAIL 여부로 DB 레이어 격리 |
| 복원 안 됨(§5) | RLS 본인 행 비노출 / GET 빈 응답 | §4 RLS 검증 + GET 응답 items |
| reorder 미반영 | UPDATE 실패(best-effort) | §4 `--write` reorder 항목 / 새로고침 |
| clear 후 잔여 복원 | 전건 DELETE 누락 | §6-4 / `clearUserWatchlist` |

---

## 9. 한계 (정직한 범위 선언)

- 본 절차서 §4 스크립트는 **DB 레이어 계약만** 검증한다. **실 회원 로그인→sync→복원**(앱 경로, §3·§5·§6)은
  브라우저 자격증명이 필요해 자동화하지 않았고, **사람이 직접 수행해야 한다.**
- service_role는 RLS를 우회하므로, §4의 라운드트립은 "RLS 강제"가 아니라 "DB CRUD·제약"을 검증한다.
  RLS 강제(타인 행 비노출)는 §4의 **anon SELECT 0행** 검증 + §5의 **본인 행 복원**으로 간접 확인한다.
