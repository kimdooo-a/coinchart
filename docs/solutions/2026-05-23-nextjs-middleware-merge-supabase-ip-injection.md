---
title: Next.js middleware에 Supabase 세션 로직과 커스텀 헤더 주입을 안전하게 머지하는 패턴
date: 2026-05-23
session: 10
tags: [nextjs, middleware, supabase-ssr, headers, edge-runtime]
category: pattern
confidence: high
---

## 문제

기존 `middleware.ts`가 Supabase 세션 새로고침 + 보호 경로 리다이렉트를 수행 중인 상황에서, 새로운 요구사항으로 **특정 경로에 커스텀 요청 헤더를 주입**해야 함. 단순 신규 작성이면 충돌이 없지만, 두 책임이 한 미들웨어에 공존하면 다음이 깨지기 쉬움:

1. `NextResponse.next({ request: { headers } })`의 `headers`가 supabase `setAll` 콜백에서 덮어쓰이면서 주입한 헤더가 사라짐
2. matcher가 한쪽 책임만 커버하여 새 경로에서 미들웨어가 아예 호출되지 않음 (`/api/*` 등)
3. 모든 경로에서 supabase getUser를 호출하면 API 라우트에서 불필요한 cookie/세션 검증 비용 발생

## 원인

- `NextResponse.next({ request })`는 요청을 다음 미들웨어/핸들러로 전달할 때 **`request.headers` 사본을 사용**함. supabase setAll에서 `request.cookies.set` 후 재호출하는 `NextResponse.next` 호출이 원본 `request.headers`를 다시 사용하면 직전에 주입한 커스텀 헤더가 유실됨.
- matcher는 단일 미들웨어 함수의 진입을 결정. 기존 `'/((?!_next/static|_next/image|favicon.ico|api/|auth/).*)'` 패턴은 `/api/` 전부를 배제하므로 `/api/board/*`에 헤더 주입 불가능.

## 해결

### 1) 커스텀 헤더 사본을 함수 스코프 상단에서 한 번 생성하고 끝까지 재사용

```ts
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // ⭐ 헤더 사본은 함수 진입 시 1회 생성. supabase setAll 콜백에서도 이것을 재사용
  const requestHeaders = new Headers(request.headers)

  if (NEEDS_HEADER_INJECTION(path)) {
    requestHeaders.set('x-client-ip-masked', maskIp(ip))
    // ...
  }

  let response = NextResponse.next({ request: { headers: requestHeaders } })
  // ...
}
```

### 2) supabase `setAll` 콜백 안에서도 같은 `requestHeaders`를 참조

```ts
const supabase = createServerClient(URL, KEY, {
  cookies: {
    getAll() { return request.cookies.getAll() },
    setAll(cookiesToSet) {
      cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
      response = NextResponse.next({
        request: { headers: requestHeaders },  // ⭐ request.headers가 아니라 사본
      })
      cookiesToSet.forEach(({ name, value, options }) =>
        response.cookies.set(name, value, options)
      )
    },
  },
})
```

### 3) API 경로는 supabase 호출 스킵 (성능 + 의도 분리)

API 라우트가 자체 인증을 사용한다면 미들웨어에서 getUser를 호출할 필요가 없음:

```ts
if (path.startsWith('/api/')) {
  return response   // 헤더 주입만 마치고 supabase 우회
}
```

### 4) matcher는 배열로 두 가지 패턴 병기

```ts
export const config = {
  matcher: [
    // 페이지 라우트 (기존 supabase 세션 + 보호 경로)
    '/((?!_next/static|_next/image|favicon.ico|api/|auth/).*)',
    // 헤더 주입 대상 API (신규)
    '/api/board/:path*',
    '/api/community/:path*',
  ],
}
```

## 교훈

- **Next.js middleware에서 `NextResponse.next({ request: { headers } })`로 헤더를 전달할 때, supabase-ssr의 setAll 콜백 안에서도 동일 `headers` 사본을 재참조해야 한다**. 원본 `request.headers`를 다시 쓰면 직전 변경이 사라진다.
- matcher 패턴은 "exclude 패턴 1개" 대신 **"용도별 패턴 배열"**로 표현하면 신규 책임을 추가하기 쉽다.
- 한 미들웨어가 여러 책임을 가질 때는 경로별로 **명시적 early return**(`if (path.startsWith('/api/')) return response`)으로 비용/의도를 분리한다.

## 관련 파일

- `middleware.ts` (R1 2026-05-23, T07 세션 10 머지)
- `lib/community/ip-mask.ts` — 헤더 값 생성기
- `docs/handover/2026-05-23-R1-T07-auth-middleware.md` — 머지 결정 사항
