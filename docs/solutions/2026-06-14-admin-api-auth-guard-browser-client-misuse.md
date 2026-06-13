---
title: admin API 인증 가드 부재 + API 라우트의 브라우저 클라이언트 오용
date: 2026-06-14
session: 51
tags: [supabase, auth, next-api-route, rls, service-role, security]
category: bug-fix
confidence: high
---

## 문제

기능 완성도 점검에서 관리자 전용 API 라우트들의 인증 결함 발견:

1. `app/api/admin/users/route.ts` — GET/DELETE가 `createAdminClient()`(service_role)로 인증 검증 **0줄** 실행 → 익명 사용자가 전체 회원 조회 + 임의 삭제 가능 (운영 배포 중인 사이트의 실제 P0).
2. `app/api/admin/news-crawl/route.ts` — "In real app, verify user.ID or role" 주석만 있고 검증 없음.
3. `app/api/admin/market-data/route.ts` — `getUser()`를 호출하나 결과를 검사 안 함("Auth check omitted for demo"). 게다가 `@/lib/supabase/client`(브라우저 anon 클라이언트)를 import해 사용 → **API 라우트에서는 쿠키 세션을 읽지 못해** `getUser()`가 항상 null이고, anon 클라로 `market_prices` insert/delete는 RLS에 막힘(인증·DB write 동시 무력).

부수 발견(false positive): `admin/cleanup-data`는 에이전트가 P0로 보고했으나 실제로는 `user.email !== 'smartkdy7@gmail.com'`로 401 차단 중 — 보안 결함 아님, 하드코딩 스타일 이슈일 뿐.

## 원인

- admin 라우트가 시기별로 따로 작성되며 인증 패턴이 통일되지 않음(board는 로컬 `requireAdmin` 보유, 나머지는 누락/주석/하드코딩).
- Next.js App Router에서 **API 라우트는 서버 컨텍스트**다. 쿠키 기반 세션을 읽으려면 `@/lib/supabase/server`(`createClient`, cookies 바인딩)를 써야 한다. `@/lib/supabase/client`(브라우저용)는 쿠키를 못 읽어 `getUser()`가 무의미.

## 해결

공통 게이트를 SSOT로 추출하고 모든 admin 라우트에 적용:

```typescript
// lib/supabase/admin-guard.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/supabase/blog";

export async function requireAdmin(): Promise<
  { ok: true; userId: string } | { ok: false; res: NextResponse }
> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, res: NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 }) };
  if (!isAdminEmail(user.email)) return { ok: false, res: NextResponse.json({ error: "관리자 권한이 필요합니다" }, { status: 403 }) };
  return { ok: true, userId: user.id };
}
```

각 라우트 진입부:
```typescript
const gate = await requireAdmin();
if (!gate.ok) return gate.res;
const supabase = createAdminClient(); // 검증 후 service_role로 DB 작업
```

- market-data: `createClient`(브라우저)→`createAdminClient`(service_role)로 교체해 인증·write 둘 다 정상화.
- board: 로컬 requireAdmin 제거 후 공통 헬퍼 import(중복 제거).
- `eslint.config.mjs`의 `no-restricted-imports` 화이트리스트에 `!@/lib/supabase/admin-guard` 추가(supabase 폴더 직접 import 제한 규칙 때문 — watchlist 추가 선례와 동일).

검증: `tsc --noEmit` 0 / `eslint`(6파일) 0 / `npm run build` 0.

## 교훈

- **에이전트 점검 결과는 main loop에서 직접 검증한다** — P0 보고 4건 중 1건은 false positive였다(과대평가). 보안 판정은 코드 직접 확인 필수.
- **Next API 라우트에서 인증은 반드시 `@/lib/supabase/server`(쿠키 바인딩) 사용.** 브라우저 클라(`client`)는 서버에서 쿠키를 못 읽는다.
- 검증 후 DB 작업은 `createAdminClient`(service_role)로 — 인증 게이트와 RLS 우회를 분리.
- admin 가드는 라우트마다 인라인하지 말고 공통 헬퍼로 SSOT화(신규 admin 라우트가 가드를 빠뜨리는 회귀 방지).

## 관련 파일
- `lib/supabase/admin-guard.ts` (신규)
- `app/api/admin/{users,news-crawl,market-data,cleanup-data,board}/route.ts`
- `eslint.config.mjs`
- `docs/handover/2026-06-13-functional-completeness-audit.md` (점검 출처)
