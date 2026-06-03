---
title: Playwright로 회원 localStorage↔DB sync 런타임 검증 (magiclink 세션 + addInitScript)
date: 2026-06-03
session: 49
tags: [playwright, e2e, supabase-auth, magiclink, localstorage, watchlist, sync, storageState]
category: pattern
confidence: high
---

## 문제

R12 watchlist 익명→회원 sync(localStorage `cca:watchlist` → `user_watchlist` DB)는 정적·DB 레이어만 검증돼 있고 **실 로그인→sync→복원** 런타임이 PENDING이었다. 로그인 폼이 Google OAuth 전용이라 UI 로그인이 불가능하고, "익명 localStorage 보유 → 로그인 → sync 자동 발동"이라는 클라이언트 흐름을 자동으로 재현할 방법이 자명하지 않았다.

추가로, 절차서(`docs/db/R14-watchlist-sync-smoke.md` §6-1)는 reorder를 "드래그/이동"으로 검증하라 했으나 **실제 UI에는 reorder 진입점이 없었다**(코드↔문서 불일치).

## 원인

- sync는 `useWatchlist` 훅이 마운트된 페이지에서 `supabase.auth.getUser()`/`onAuthStateChange`로 회원을 감지할 때 `runSync`(=`POST /api/watchlist/sync`)로 발동된다. 즉 **세션 쿠키 + localStorage 선적재 상태로 페이지를 로드하면 자동 트리거**된다.
- `WatchlistView`가 훅의 `reorder`를 구조분해에서 빼고 있어 UI 호출 경로가 없었다(절차서가 구현보다 앞서 작성돼 stale).

## 해결

`@playwright/test`로 다음 3요소를 조합(앱 코드 무수정, `e2e/` 격리):

1. **magiclink fallback 세션 재사용** — `e2e/auth.setup.ts`(경로 B)가 service_role `admin.generateLink({type:'magiclink'})` → anon `verifyOtp`로 비번 없이 세션 쿠키를 `storageState`(admin.json)에 캡처. watchlist는 관리자/일반 구분이 없어 그 세션을 회원으로 재사용.

2. **addInitScript로 localStorage 선적재** — 컨텍스트 첫 로드 전 `cca:watchlist`를 심어 "익명 항목 보유 채로 로그인" 상태를 만든다:
   ```ts
   const ctx = await browser.newContext({ storageState: AUTH_FILE });
   await ctx.addInitScript(([key, items]) => {
     window.localStorage.setItem(key, JSON.stringify({ version: 1, items }));
   }, [STORAGE_KEY, SYNTH] as const);
   ```
   `page.goto('/watchlist')` → `getUser()`가 회원 감지 → `runSync` 자동 발동 → `waitForResponse(POST /api/watchlist/sync, 200)`로 관찰.

3. **§5 타기기 복원** = 새 컨텍스트(빈 localStorage, addInitScript 없음) + 동일 storageState → sync가 DB 병합본을 localStorage로 복원. `moduleSynced`가 컨텍스트(JS 모듈)당 1회라 새 컨텍스트면 재트리거된다.

4. **reorder는 UI 부재이므로 `page.request.patch('/api/watchlist', {data:{order}})`로 직접 검증**, clear는 `page.on('dialog', d=>d.accept())` + 버튼 클릭(window.confirm 경유)으로 검증.

5. **graceful skip + 합성 데이터** — `test.skip(!runGate(), REASON)` 런타임 평가(collection 함정 회피, AD1 패턴), 합성 심볼 `SMOKEE2E*`만 적재 + afterAll service_role 정리 → 운영 데이터 오염 0.

결과: 풀 실행 4 passed, 운영 DB 잔여 0, 미주입 graceful skip 3 skipped(기존 비인증 29건 회귀 0).

## 교훈

- **클라이언트 자동 sync(onAuthStateChange 트리거)는 "storageState 쿠키 + addInitScript localStorage 선적재 + 페이지 로드"만으로 실제 사용자 흐름에 가장 가깝게 재현된다** — setSession 강제나 API 직접 호출보다 충실하고 안정적.
- magiclink fallback storageState는 관리자 전용이 아니라 **모든 회원 기능 스모크의 세션 소스로 재사용** 가능(관리자도 회원이므로).
- 검증 절차서가 구현보다 먼저 쓰이면 stale될 수 있다(reorder "드래그" 가정 vs UI 부재). **스모크 작성 전 실제 UI 진입점을 grep으로 확인**하고, 없으면 API 레이어로 검증하거나 범위에서 분리한다.

## 관련 파일
- `e2e/watchlist-member.spec.ts` (신규 — 본 패턴 구현)
- `e2e/auth.setup.ts` (magiclink fallback 경로 B — 재사용 소스)
- `e2e/playwright.config.ts` (`watchlist-member` project)
- `components/hooks/useWatchlist.ts` (sync 트리거 메커니즘)
- `docs/superpowers/specs/2026-06-03-watchlist-sync-e2e-smoke-design.md` (설계)
