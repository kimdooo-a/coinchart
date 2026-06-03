# watchlist 회원 sync 런타임 스모크 자동화 (Playwright) — 설계

**작성**: 2026-06-03 / 세션 49 / R17 잔여 마감
**대상**: R12에서 구축한 watchlist 익명→회원 sync 흐름의 **실 브라우저 런타임 검증** 자동화
**선행 상태**: §4 DB 레이어 스모크(`scripts/smoke/watchlist-sync-smoke.ts`)는 본 세션 PASS 4/0 재실증 완료. 남은 잔여 = 실 로그인→sync→복원(절차서 §3·§5·§6, `docs/db/R14-watchlist-sync-smoke.md`).

---

## 1. 목적 / 성공 기준

R12(세션 38·39) watchlist 회원 sync는 **정적·DB 레이어만** 검증돼 있고 실 로그인 런타임이 PENDING이었다. 이를 `@playwright/test`로 자동화해 **재현 가능·CI 친화** 검증으로 전환한다.

**성공 기준**: opt-in 자격증명(`E2E_ADMIN_EMAIL`+`SUPABASE_SERVICE_ROLE_KEY`+`E2E_DB_READY=1`) 주입 시 다음이 전부 PASS, 미주입 시 graceful skip(기존 비인증 29건 불변):

1. (§3) 익명 localStorage 적재 → 로그인 → `POST /api/watchlist/sync` **200** + 로컬 손실 0 병합본 갱신
2. (§5) 빈 localStorage 새 컨텍스트 + 동일 세션 → sync로 DB 항목 **복원**
3. (§6) reorder `PATCH /api/watchlist` 200 + sort_order 반영 / clear `DELETE ?all` 200 + 잔여 복원 없음

---

## 2. 접근법 (확정: A)

`addInitScript`로 `cca:watchlist`를 컨텍스트 첫 로드 전 localStorage에 심고, magiclink fallback 세션 쿠키(`storageState`)를 주입한 채 `/watchlist`에 진입한다. `useWatchlist`의 `getUser()`가 회원을 감지해 `runSync`를 자동 발동시키므로 **실제 사용자 흐름(익명 항목 보유 채로 로그인 후 진입)에 가장 근접**하다. reorder는 UI 진입점이 없으므로(§3 참조) `page.request` PATCH로 보강한다.

기각: page.evaluate `setSession`(앱 내부 supabase 인스턴스 접근 까다로움) / sync API 직접 POST(§4와 중복, 브라우저·localStorage 검증 가치 없음).

---

## 3. 기존 코드 사실관계 (탐색 결과)

| 자산 | 사실 |
|------|------|
| `e2e/auth.setup.ts` | service_role `generateLink('magiclink')`→anon `verifyOtp` 로 **비번 없이 세션 쿠키 storageState 캡처**(경로 B, R7-2). `E2E_ADMIN_EMAIL` opt-in, 성공 시 `admin.json`+`admin.ready` 생성. 미주입 시 빈 상태·마커 미생성 → graceful skip. **그대로 재사용**(회원=관리자 계정, watchlist는 관리자/일반 구분 없음). |
| `e2e/playwright.config.ts` | projects: setup/chromium/admin. webServer 자동 구동(`reuseExistingServer`). storageState 패턴 확립. |
| `e2e/community-admin-auth.spec.ts` | **패턴 레퍼런스**: `runAd1()` 런타임 게이트(collection 함정 회피), `test.skip(!gate, REASON)`, beforeAll 생성/afterAll 정리, `waitForResponse`. |
| `components/hooks/useWatchlist.ts` | 로그인 감지(`getUser`/`onAuthStateChange`) → `runSync` → `POST /api/watchlist/sync`(로컬 업로드) → 응답 병합본을 `cca:watchlist`에 덮어씀. `moduleSynced` = **컨텍스트(JS 모듈)당 1회** → §5는 새 컨텍스트로 자연 해결. |
| `app/api/watchlist/sync/route.ts` | 회원 전용(미회원 401). 응답 `{items, added, skipped, limit:100}`. |
| `lib/supabase/watchlist.ts` | `normalizeWatchlistInput`: 심볼 **1~32자 임의 문자열**(대문자·trim) 허용 → **합성 심볼 통과**. assetType은 CRYPTO/STOCK만. |
| `components/Watchlist/WatchlistView.tsx` | clear = `handleClear`→`window.confirm`→`clear()` (**dialog 핸들러 필요**). **reorder는 구조분해 미포함 = UI 진입점 없음**(절차서 §6-1 "드래그" 가정은 stale) → PATCH API로 검증. |

---

## 4. 산출물

### 4-1. 신규 `e2e/watchlist-member.spec.ts`

단일 `describe`, 직렬(workers:1), 상태 공유(합성 심볼 2종). 게이트는 AD1과 동일 런타임 함수.

```
const SYNTH = [
  { assetType: 'CRYPTO', symbol: 'SMOKEE2EAAA', sortOrder: 0 },
  { assetType: 'CRYPTO', symbol: 'SMOKEE2EBBB', sortOrder: 1 },
];
const runSmoke = () =>
  process.env.E2E_DB_READY === '1' &&
  fs.existsSync(READY_FILE /* .auth/admin.ready */) &&
  !!SUPABASE_URL && !!SERVICE_ROLE;
```

**TC1 (§3) 익명 적재 → 로그인 sync**
- `browser.newContext({ storageState: admin.json })` + `context.addInitScript`로 `cca:watchlist={version:1,items:SYNTH}` 주입
- 시작 클린: `page.request.delete('/api/watchlist?all=true')` (이전 잔여 0 보장)
- `page.goto('/watchlist')` → `waitForResponse(POST /api/watchlist/sync, 200)`
- 응답 JSON `added >= 2`, `limit === 100` 검증
- `localStorage['cca:watchlist']` 파싱 → 합성 2종 **손실 0** 확인

**TC2 (§5) 타기기 복원**
- **새** `browser.newContext({ storageState: admin.json })` (빈 localStorage, addInitScript 없음)
- `page.goto('/watchlist')` → `waitForResponse(POST sync, 200)` (빈 로컬 업로드 → DB 병합본)
- `localStorage['cca:watchlist']`에 TC1 합성 2종 **복원** 확인

**TC3 (§6) reorder + clear**
- reorder: `page.request.patch('/api/watchlist', { data:{ order: SYNTH 역순 sortOrder } })` → 200 `{ok, updated>=2}`
- `page.request.get('/api/watchlist')` → 역순 sort_order 반영 확인
- clear: `/watchlist` 진입, `page.on('dialog', d=>d.accept())` 등록 후 clear 버튼 클릭 → `waitForResponse(DELETE /api/watchlist?all=true, 200)`
- 새 컨텍스트 로그인(§6-4) → `localStorage` 빈 목록 = 잔여 복원 없음 확인

**afterAll**: service_role로 해당 user_id의 합성 심볼 행 정리(잔여 0). user_id는 `admin.auth.admin.generateLink` 응답 또는 email 조회로 확보. (clear가 이미 비웠어도 멱등 방어.)

### 4-2. 수정 `e2e/playwright.config.ts`

```
// projects[] 에 추가
{
  name: 'watchlist-member',
  testMatch: /watchlist-member\.spec\.ts$/,
  dependencies: ['setup'],
  use: { ...devices['Desktop Chrome'], storageState: ADMIN_AUTH_FILE },
}
// chromium.testIgnore 에 watchlist-member.spec.ts 추가(비인증 스위트서 제외)
```

---

## 5. 데이터 흐름

```
auth.setup(magiclink) ──> admin.json(쿠키) + admin.ready(마커)
        │ dependencies:['setup']
        ▼
watchlist-member project (storageState=admin.json)
  TC1: addInitScript(localStorage=SYNTH) + goto /watchlist
        └> useWatchlist.getUser()=member ──> runSync ──> POST /sync 200 ──> localStorage 병합본
  TC2: newContext(빈 localStorage) + goto ──> runSync(빈 업로드) ──> DB 복원 ──> localStorage
  TC3: PATCH reorder / dialog+버튼 clear DELETE?all
  afterAll: service_role 합성행 정리
```

---

## 6. 에러 처리 / 격리

- **graceful skip**: 자격증명/마커 미주입 → `test.skip(!runSmoke(), REASON)` 런타임 평가(collection 함정 회피). 기존 비인증 29건·admin 1건 불변.
- **격리**: 변경은 `e2e/` 안만(신규 spec 1 + config projects 1줄). 앱 코드 `app/`·`components/`·`lib/` **무수정**.
- **운영 데이터 오염 방지**: 합성 심볼(`SMOKEE2E*`)만 사용 + 시작 클린 + afterAll 정리. E2E_ADMIN_EMAIL 계정 실데이터는 현재 0행(본 세션 §4 확인)이나, 정리는 합성 심볼만 타겟.
- **sync 미응답**: `waitForResponse` 10s timeout(config expect timeout) 초과 시 명시적 fail.

---

## 7. 검증

```powershell
# opt-in 실행 (셸에 자격증명 주입)
$env:E2E_DB_READY='1'; $env:E2E_ADMIN_EMAIL='<관리자>'; # SUPABASE_* 는 .env 경유
npx playwright test --config=e2e/playwright.config.ts --project=watchlist-member

# 미주입 graceful skip 확인 (기존 스위트 회귀 0)
npx playwright test --config=e2e/playwright.config.ts --project=chromium
```

기대: 자격 주입 시 watchlist-member 3 passed, 미주입 시 graceful skip + chromium 29 불변. tsc 0(e2e는 별도 tsconfig).

---

## 8. 범위 밖 (YAGNI)

- WatchlistTable UI 드래그 reorder 구현(현재 UI 부재 — 별도 기능 과제, 본 스모크는 PATCH API로만).
- 익명 30/회원 100 상한 경계(§3-5 선택 항목) — 핵심 흐름 아님, 필요 시 후속.
- 시세 조인 렌더 검증 — 합성 심볼은 시세 없음, localStorage 직접 파싱으로 UI 렌더 무관하게 안정 검증.
