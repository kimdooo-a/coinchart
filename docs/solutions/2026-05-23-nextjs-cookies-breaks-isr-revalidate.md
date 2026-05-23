---
title: Supabase createClient()의 cookies()가 페이지 ISR(revalidate)을 무효화하고 dynamic으로 강등시킴
date: 2026-05-23
session: 18, 22 (해결 확정)
tags: [nextjs, app-router, isr, revalidate, supabase, ssr, cookies, dynamic-rendering, anon-client, prerender]
category: pattern
confidence: high
---

> **상태**: 세션 18에서 문제 진단·후속안 제시 → **세션 22(R2/T05)에서 해결 확정** (`/`가 `ƒ`→`○`로 전환). 아래 "## 해결 확정" 참조.

## 문제

메인페이지(`app/page.tsx`)를 SSR로 전환하며 `export const revalidate = 300`(5분 ISR)을 선언했으나, `npm run build` 결과 `/`가 정적 ISR(`○`/`●`)이 아닌 **`ƒ (Dynamic, server-rendered on demand)`** 로 등록됨.

```
Route (app)
┌ ƒ /
```

즉 매 요청마다 서버 렌더링되어, 의도한 "5분마다 1회 재생성 + 캐시 서빙"이 동작하지 않음.

## 원인

페이지가 `lib/supabase/server.ts`의 `createClient()`를 호출하는데, 이 함수가 내부에서 **`await cookies()`**(`next/headers`)를 사용한다.

```ts
// lib/supabase/server.ts
export async function createClient() {
  const cookieStore = await cookies()   // ← 이 호출이 페이지를 dynamic으로 만든다
  return createServerClient(url, key, { cookies: { ... } })
}
```

Next.js App Router에서 `cookies()`/`headers()`/`searchParams` 등 **Dynamic API**를 (간접적으로라도) 호출하면 해당 라우트는 자동으로 dynamic rendering으로 전환된다. 이때 `export const revalidate`는 무시되어 정적 ISR 캐시가 형성되지 않는다. (auth가 필요한 SSR 페이지에서 흔히 발생하는, 의도와 설정이 어긋나는 케이스)

## 해결

이번 라운드는 사용자 명시 지시(`const supabase = await createClient()` 사용)를 우선하여 **dynamic 렌더링을 그대로 수용**하고, 캐시는 fetch 레이어로 분산:

- Binance ticker: `fetch(..., { next: { revalidate: 60 } })` + 모듈 메모리 Map 60초
- FNG: 모듈 메모리 1h + `next.revalidate=3600`
- hot-issues: STABLE RPC
- 외부 API는 `.catch(() => fallback)`으로 격리해 전체 페이지 500 방지

`revalidate=300` export는 유지(설정 의도 문서화 + cookies 제거 시 자동 ISR 폴백).

**순수 페이지 ISR이 필요하면** (후속 선택지): cookies가 불필요한 읽기 전용 경로는 anon key로 직접 클라이언트를 만들어 `cookies()` 호출을 피한다. 그러면 `/`가 정적 ISR(`○`/`●`)로 떨어진다.

```ts
// 예: cookies 없는 익명 읽기 전용 클라이언트
import { createClient as createSb } from "@supabase/supabase-js";
const supabase = createSb(URL, ANON_KEY); // cookies() 미사용 → ISR 유지
```

단, 이 경우 RLS가 cookie 세션에 의존하는 쿼리(로그인 사용자 전용 데이터)는 못 읽으므로, 공개 SELECT(`is_deleted=false` 등)만 있는 페이지에 한정해야 한다.

## 해결 확정 (세션 22, R2/T05)

`app/page.tsx`에 **cookies 비의존 anon 클라이언트 로더 `loadMainPageData()`**를 내장하여 `/`를 `ƒ`→`○`로 전환 완료. (`queries.ts`는 R1 read-only라 미수정 — page.tsx 내부 자급)

### 핵심: anon 클라이언트만으로는 부족하다 — `global.fetch`에 revalidate 주입 필수

단순히 `createClient(URL, ANON_KEY)`만 쓰면 `cookies()`는 사라지지만, **supabase-js의 fetch가 Next 캐시에 편입되지 않아** 여전히 dynamic으로 떨어질 수 있다. supabase-js의 `global.fetch`를 래핑해 `next.revalidate`를 주입해야 페이지가 정적 prerender된다:

```ts
import { createClient as createAnonClient } from "@supabase/supabase-js";

const supabase = createAnonClient(URL!, ANON_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: {
    // 이 래핑이 없으면 supabase fetch가 uncached → 페이지가 dynamic 유지될 수 있음
    fetch: (input, init) =>
      fetch(input, { ...init, next: { revalidate: 300 } } as RequestInit),
  },
});
```

### 함정: 라우트 revalidate = 모든 fetch revalidate의 **최솟값**

빌드 출력에서 `/`가 `○`로 떨어졌으나 Revalidate가 `5m`이 아닌 **`1m`** 으로 표기됨:

```
┌ ○ /                                     1m      1y
```

- `export const revalidate = 300`(5분)을 선언했어도, 의존 fetch 중 가장 짧은 값이 라우트 revalidate를 지배한다. 여기선 `fetchCommunityTickers`가 자체 `next.revalidate=60`(60초)을 써서 라우트가 `1m`로 결정됨.
- 즉 **라우트 revalidate = min(segment revalidate, 모든 fetch revalidate)**. 더 신선한 데이터 소스가 있으면 페이지가 그 주기로 재생성된다(보통 의도에 부합 — 시세는 더 자주 갱신).
- "정확히 N분 ISR"이 필요하면 모든 의존 fetch의 revalidate를 ≥N으로 맞춰야 한다.

### 검증 (전후)
```
[전, 세션 18]  ┌ ƒ /
[후, 세션 22]  ┌ ○ /                                     1m      1y
```
build exit 0, 폴백(`.catch` / `?? []`) 보존 → DB 미가용 시에도 빈 상태로 정상 prerender.

### 클린 SSOT 후속 (지휘자/R3)
page.tsx 내장 로더는 `queries.ts.fetchMainPageData()`와 형상이 중복된다(메인페이지 데이터 SSOT 분기). R1 read-only 제약이 풀리면, **`queries.ts`의 클라이언트만 위 anon 패턴으로 교체**하고 page.tsx 로더를 제거해 단일 진입점으로 환원하는 것이 정석. (handover `2026-05-23-R2-T05-infra-finish.md` §6)

## 교훈

- App Router에서 `export const revalidate`를 적었다고 ISR이 보장되지 않는다. **빌드 출력의 `○`(static)/`●`(SSG)/`ƒ`(dynamic) 기호로 실제 렌더 모드를 반드시 확인**한다.
- `cookies()`/`headers()`를 (간접 포함) 쓰면 그 라우트는 dynamic이 된다. auth 기반 Supabase SSR 클라이언트(`createServerClient` + cookies)는 거의 항상 페이지를 dynamic으로 만든다.
- 공개 데이터만 읽는 SSR 페이지에서 ISR 성능이 필요하면, cookies 의존 클라이언트와 anon 읽기 전용 클라이언트를 분리하는 설계를 고려한다.
- **anon 클라이언트 전환 시 supabase-js `global.fetch`에 `next.revalidate`를 주입**해야 정적 prerender가 보장된다(미주입 시 uncached fetch가 페이지를 dynamic으로 되돌릴 수 있음).
- 라우트 revalidate는 **의존 fetch들의 최솟값**으로 수렴한다 — 빌드 테이블의 Revalidate 컬럼이 segment 선언값과 다르면 더 짧은 fetch가 원인.

## 관련 파일
- `app/page.tsx` (세션 22: anon 로더 `loadMainPageData` 내장 + `global.fetch` revalidate 주입 → `○`)
- `lib/supabase/server.ts` (createClient → cookies(), 미수정)
- `lib/community/queries.ts` (fetchMainPageData, R1 read-only — 미수정, SSOT 환원 후보)
- `docs/handover/2026-05-23-R1-T15-mainpage-realdata.md` (§4 ISR/렌더링 모드 — 문제 진단)
- `docs/handover/2026-05-23-R2-T05-infra-finish.md` (§3·§6 — 해결 확정)
