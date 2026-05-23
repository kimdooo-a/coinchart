---
title: Supabase createClient()의 cookies()가 페이지 ISR(revalidate)을 무효화하고 dynamic으로 강등시킴
date: 2026-05-23
session: 18
tags: [nextjs, app-router, isr, revalidate, supabase, ssr, cookies, dynamic-rendering]
category: pattern
confidence: high
---

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

## 교훈

- App Router에서 `export const revalidate`를 적었다고 ISR이 보장되지 않는다. **빌드 출력의 `○`(static)/`●`(SSG)/`ƒ`(dynamic) 기호로 실제 렌더 모드를 반드시 확인**한다.
- `cookies()`/`headers()`를 (간접 포함) 쓰면 그 라우트는 dynamic이 된다. auth 기반 Supabase SSR 클라이언트(`createServerClient` + cookies)는 거의 항상 페이지를 dynamic으로 만든다.
- 공개 데이터만 읽는 SSR 페이지에서 ISR 성능이 필요하면, cookies 의존 클라이언트와 anon 읽기 전용 클라이언트를 분리하는 설계를 고려한다.

## 관련 파일
- `app/page.tsx` (revalidate=300 + await createClient)
- `lib/supabase/server.ts` (createClient → cookies())
- `lib/community/queries.ts` (fetchMainPageData)
- `docs/handover/2026-05-23-R1-T15-mainpage-realdata.md` (§4 ISR/렌더링 모드)
