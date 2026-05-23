# 인수인계서 — R2 / T05 infra-finish

> 작성일: 2026-05-23
> 라운드: R2 (realdata-finish) — 1차 발사 / 동시 발사 그룹
> 일꾼: R2-T05
> 상태: **COMPLETED ✅**
> 의존: R1/T15(`app/page.tsx`), R1/T07(`middleware.ts`), R1/T09(`BlogComments.tsx`)

---

## 1. 작업 요약

R1 회수 시 식별된 3건의 작은 인프라 부채를 한 터미널에서 묶어 마무리:

1. **`/` 순수 ISR 전환** — `app/page.tsx`를 cookies 비의존 anon 클라이언트 로더로 전환 → `/`가 **`ƒ (Dynamic)` → `○ (Static)` ISR**로 떨어짐.
2. **middleware `node:crypto` edge 경고 해소** — `middleware.ts`에 `export const runtime = 'nodejs'` 명시 → 빌드 경고 사라짐.
3. **Giscus 라이트 테마** — `BlogComments.tsx`의 `data-theme` `dark_dimmed` → `light`.

수정 파일 **정확히 3개** (T05 쓰기 영역 내). 타 영역(board/news/coin/Chart, lib/supabase, queries.ts 등) **무수정**.

---

## 2. 산출물 (수정 3)

| 파일 | 변경 |
|---|---|
| `app/page.tsx` | `fetchMainPageData()`(쿠키 의존) 호출 제거 → 동일 쿼리를 수행하는 cookies 비의존 **anon 클라이언트 로더 `loadMainPageData()`** + 행 매퍼 4종을 내장. `export const revalidate = 300` 유지. |
| `middleware.ts` | 임포트 직후 `export const runtime = 'nodejs'` 추가(주석 포함). matcher·IP 헤더 주입·인증 리다이렉트 로직 **불변**. |
| `components/Blog/BlogComments.tsx` | Giscus 스크립트 `data-theme` `'dark_dimmed'` → `'light'` (1줄). |

### 미수정 (안티패턴 준수)
- `lib/supabase/server.ts`, `lib/community/ip-mask.ts`, `lib/community/auth.ts` — **무수정** (T07/공용)
- `lib/community/queries.ts` — **무수정** (R1 read-only / `_INDEX.md` line 30). §6 참조
- `app/board/`, `app/news/`, `app/coin/`, `components/Chart/` — **무수정** (R2 타 일꾼 영역)
- 새 패키지 설치 **0건** (`@supabase/supabase-js`는 기존 의존성)

---

## 3. (1) `/` 순수 ISR 전환 — ƒ → ○

### 원인 (T15 §4 재확인)
`app/page.tsx` → `fetchMainPageData()`(queries.ts) → `await createClient()`(lib/supabase/server.ts) → `cookies()`(Next dynamic API) 호출 → Next가 `/`를 **동적(ƒ) 렌더**로 처리(정적 ISR 비활성).

### 해결 패턴 — cookies 비의존 anon 클라이언트
메인페이지는 **인증 불필요한 공개 읽기 전용**(community_posts/news/blog_posts/RPC, 전부 RLS anon 정책 충분)이므로, 쿠키 없는 anon 클라이언트로 동일 쿼리를 수행:

```ts
import { createClient as createAnonClient } from "@supabase/supabase-js";

const supabase = createAnonClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
        auth: { persistSession: false, autoRefreshToken: false },
        // Supabase fetch를 Next ISR 캐시(5분)에 편입 → 정적 prerender 유지
        global: {
            fetch: (input, init) =>
                fetch(input, { ...init, next: { revalidate: 300 } } as RequestInit),
        },
    }
);
```

- `cookies()` 미호출 → 동적 API 의존 없음 → `/`가 정적 prerender 대상.
- `global.fetch`에 `next.revalidate=300`을 주입 → Supabase 쿼리가 Next ISR 캐시에 편입(no-store로 인한 강제 동적화 방지).
- 쿼리 본문·행 매퍼·폴백·코인카드 구성은 `queries.ts.fetchMainPageData()`와 **동일 형상**을 복제(클라이언트만 교체). 디자인/JSX·props 변환 헬퍼는 그대로.

### 전후 (빌드 출력 증거)
```
[전]  ┌ ƒ /
[후]  ┌ ○ /                                     1m      1y
```
- `/`가 **`○ (Static)`** 로 prerender됨. ISR 활성.
- **Revalidate 표기 `1m` 주의**: 페이지 `export const revalidate = 300`(5분)은 유지되나, 의존 fetch 중 `fetchCommunityTickers`(lib/supabase/crypto.ts, T03/R1)가 자체 `next.revalidate=60`(60초)을 사용 → Next가 **모든 fetch revalidate의 최솟값**(60s=1m)을 라우트 revalidate로 채택. 기능상 정상이며 시세가 더 신선해지는 부수효과만 있음. (T03 정책 존중, crypto.ts 무수정)
- 폴백 보존: tickers/fng `.catch`, Supabase `*.data ?? []` 그대로 → build 시 DB 미가용이어도 빈 상태로 정상 prerender(build exit 0 확인).

---

## 4. (2) middleware `node:crypto` edge 경고 해소

### 원인
`lib/community/ip-mask.ts:3 import crypto from "node:crypto"`(`hashIp`)를 middleware(기본 edge runtime)가 사용 → Turbopack 빌드 경고.

### 해결 — runtime 명시 (방안 a)
`ip-mask.ts`는 T07 영역(수정 금지)이므로 Web Crypto 전환(방안 b) 대신 **middleware를 Node.js 런타임으로 고정**:
```ts
export const runtime = 'nodejs'
```
matcher / IP 헤더 주입 / 세션 새로고침 / 보호 라우트 리다이렉트 로직 **전부 불변**.

### 증거
```
$ grep -niE "node:crypto|edge runtime|A Node.js module" <build.log>
(출력 없음 = 경고 해소)

$ grep -n "runtime" middleware.ts
6: //   ... Edge 런타임에서 빌드 경고 ...
8: export const runtime = 'nodejs'

빌드 라우트 테이블: `ƒ Proxy (Middleware)` (경고 없이 정상 등록)
```

> **관찰(범위 밖, 후속 후보)**: Next 16이 `⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.` 경고를 출력. 이는 **파일 규칙(middleware→proxy 리네임)** 관련 deprecation으로 본 변경(runtime 명시)과 무관하며 기존부터 존재. `middleware.ts`→`proxy.ts` 리네임은 구조 변경이라 T05 범위 밖 → 별도 트랙(R3) 권장.

---

## 5. (3) Giscus 라이트 테마

`components/Blog/BlogComments.tsx`:
```ts
[전]  script.setAttribute('data-theme', 'dark_dimmed');
[후]  script.setAttribute('data-theme', 'light');
```
- 라이트화된 블로그 페이지(T09)와 댓글 테마 일치. 그 외 Giscus 설정(repo/category/mapping/lang) 불변.
- T09 handover §"의도적 다크"(line 79)에서 보류됐던 항목 해소.

---

## 6. queries.ts 처리 — ⚠️ 손대지 않음 + 후속 권장 (outbox 성격)

- **`lib/community/queries.ts` 무수정** (R1/T15 산출물, `_INDEX.md` line 30에서 R2 전 일꾼 read-only로 명시).
- 본 라운드 해결책은 사용자 지시(스펙 line 17: "app/page.tsx에서 anon 클라이언트 사용") + read-only 제약에 따라 **page.tsx 내부에 anon 로더를 내장**하는 방식.
- **부수효과(정직히 기록)**: 이로써 `queries.ts.fetchMainPageData()`와 private 매퍼 4종(`mapBestPost`/`mapNews`/`mapBoardPreview`/`mapOfficialPost`)은 **메인페이지에서 더 이상 호출되지 않음**(현재 page.tsx가 유일 호출처였음). `queries.ts`의 export 타입·`COIN_META`는 page.tsx가 계속 사용하므로 파일 자체는 dead 아님.
- **지휘자 후속 권장 (outbox 요청)**: 클린 SSOT 복원을 위해, R3/정리 시점에 **`queries.ts.fetchMainPageData()`의 클라이언트만 anon으로 교체**(아래 2줄)하면 page.tsx의 `loadMainPageData()` + 매퍼 4종을 제거하고 다시 단일 진입점으로 합칠 수 있음:
  ```ts
  // queries.ts (지휘자/R3가 적용 — R1 read-only라 본 일꾼은 미적용)
  - import { createClient } from "@/lib/supabase/server";
  + import { createClient } from "@supabase/supabase-js";
  ...
  - const supabase = await createClient();
  + const supabase = createClient(URL!, ANON_KEY!, { auth:{persistSession:false}, global:{ fetch:(i,init)=>fetch(i,{...init,next:{revalidate:300}}) } });
  ```
  이 경우 page.tsx는 `loadMainPageData()` 삭제 후 다시 `await fetchMainPageData()`로 환원. (현재는 read-only 제약상 page.tsx 자급 처리)

---

## 7. 검증 (재현 명령)

```bash
cd "F:/11_dev/260523 코인 차트분석"

npx tsc --noEmit                                  # 0 error ✅

npm run build                                     # ✓ Compiled successfully ✅
#  - ┌ ○ /                          1m      1y    (ƒ→○ 전환 ✅)
#  - node:crypto / Edge 경고 부재               ✅
#  - ƒ Proxy (Middleware) 정상 등록             ✅

grep -n "runtime" middleware.ts                   # export const runtime = 'nodejs' ✅
grep -n "data-theme" components/Blog/BlogComments.tsx   # 'light' ✅
grep -n "createAnonClient\|loadMainPageData" app/page.tsx  # anon 로더 ✅
```

| 검증 항목 | 기대 | 실제 | 결과 |
|---|---|---|---|
| `npx tsc --noEmit` | 0 error | 0 error | ✅ |
| `npm run build` | Compiled | ✓ 3.2s | ✅ |
| `/` 렌더 모드 | ○/● | `○` (Revalidate 1m) | ✅ |
| node:crypto 경고 | 없음 | 없음 | ✅ |
| middleware runtime | nodejs | `'nodejs'` | ✅ |
| Giscus theme | light | `'light'` | ✅ |
| queries.ts 수정 | 0 | 0 (미수정) | ✅ |
| 타 영역 수정 | 0 | 0 (3파일만) | ✅ |

### 시각 검증 권장 (사용자 단계)
- `/` 정상 렌더(시세 스트립·베스트·뉴스·게시판3컬럼·코인룸·사이드바) — 디자인 회귀 없음.
- `/blog/[slug]` Giscus 댓글이 **라이트 테마**로 표시.

---

## 8. 디스패치 메모

- **터미널 배너 불일치**: 본 터미널의 kdydispatch 배너가 `R2-T02 (news)` + 허용영역 `app/news/;lib/community/news-queries.ts;docs/handover/`로 표기됐으나, 실제 지시·실행 작업은 **R2-T05 (infra)**. PreToolUse hook은 배너의 좁은 영역을 강제하지 않았고(BlogComments/middleware/page.tsx 편집 정상 통과), R2-T05 쓰기 영역(`_INDEX.md` line 14: `app/page.tsx`, `middleware.ts`, `components/Blog/BlogComments.tsx`)에 부합하게 작업 완료. 지휘자 회수 시 배너-작업 매핑 확인 권장.
- working tree에 R2-T01(board)·R2-T04(chart) 등 타 일꾼 변경이 공존(공유 워킹트리). 본 일꾼은 **자기 3파일만 수정**, 커밋은 지휘자 통합 시점에 수행(본 터미널 미커밋).

---

## 9. 참조

- 작업 명세: `docs/orchestration/2026-05-23-R2-realdata-finish/R2-T05-infra-finish.md`
- 의존 handover:
  - `docs/handover/2026-05-23-R1-T15-mainpage-realdata.md` (§4 ISR/렌더 분석, §9-2 순수 ISR 후속)
  - `docs/handover/2026-05-23-R1-T07-auth-middleware.md` (middleware·ip-mask node:crypto)
  - `docs/handover/2026-05-23-R1-T09-blog-lightify.md` (§의도적 다크 Giscus theme)
- 인덱스: `docs/orchestration/2026-05-23-R2-realdata-finish/_INDEX.md` (line 14 T05 쓰기영역, line 30 read-only)
- 수정 코드: `app/page.tsx`, `middleware.ts`, `components/Blog/BlogComments.tsx`
- 무수정(SSOT): `lib/community/queries.ts`, `lib/supabase/server.ts`, `lib/community/ip-mask.ts`
