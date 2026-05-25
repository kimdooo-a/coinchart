# R6-T03 — queries.ts SSOT 환원 (메인페이지 데이터 로더 단일화)

- **일자**: 2026-05-25
- **라운드/터미널**: R6-polish Wave 1 / T03 (5)
- **쓰기 영역(격리)**: `app/page.tsx`, `lib/community/queries.ts` 2파일만
- **상태**: ✅ 완료 (tsc 0 / build EXIT=0 / `/` 정적 ISR ○ 유지)

---

## 1. 단일화 방향

메인페이지 데이터 로딩이 **이원화**되어 있던 것을 `lib/community/queries.ts`의 `fetchMainPageData()` **단일 SSOT로 환원**했다.

| | Before | After |
|---|---|---|
| `queries.ts.fetchMainPageData()` | `lib/supabase/server.ts`의 `createClient()`(**쿠키 의존**) 사용 → 호출 시 `/`를 동적(ƒ)화. **미사용(dead)** | **쿠키 비의존 anon 클라이언트**(`@supabase/supabase-js`)로 교체. page.tsx가 import·호출하는 **실사용 SSOT** |
| `app/page.tsx` | 자급 로더 `loadMainPageData()` 내장(anon 클라이언트) + 매퍼 4종 복제 | 로더·복제 매퍼 **전량 제거**, `fetchMainPageData()` import 호출 |

핵심 아이디어: R2/T05가 page.tsx에 임시로 내장했던 **anon + `global.fetch`에 `next.revalidate=300` 주입** 패턴을 queries.ts SSOT로 흡수. 메인페이지는 인증 불필요한 공개 읽기뿐이라 anon 키로 충분하며, 쿠키 비의존이므로 `/`가 정적 ISR(○)로 prerender된다.

## 2. 옮긴 로직 / queries.ts 변경

`lib/community/queries.ts`:
- import: `import { createClient } from "@/lib/supabase/server"` → `import { createClient as createAnonClient } from "@supabase/supabase-js"`
- 헤더 주석: anon 클라이언트 단일화 + 렌더 모드(정적 ISR) 근거 명시 (R6/T03)
- `fetchMainPageData()` 본문: `const supabase = await createClient();`(쿠키 의존) → anon 클라이언트 생성 블록으로 교체:
  ```ts
  const supabase = createAnonClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) =>
          fetch(input, { ...init, next: { revalidate: 300 } } as RequestInit),
      },
    }
  );
  ```
- 쿼리(베스트30·뉴스10·게시판3컬럼·핫이슈 RPC·공식글3)·코인카드 6장·외부 API(.catch 격리)·매퍼는 기존 형상 그대로 유지(이미 queries.ts에 존재).

## 3. 제거된 중복 (app/page.tsx)

- `loadMainPageData()` 함수 전체 (자급 anon 로더 ~140줄)
- 복제 매퍼 4종: `mapBestPost` · `mapNews` · `mapBoardPreview` · `mapOfficialPost` (queries.ts SSOT로 일원화)
- 미사용으로 전환된 import 정리: `createAnonClient`(`@supabase/supabase-js`), `fetchCommunityTickers`, `fetchFng`, 타입 `MainPageData` · `MainCoinCard`
- 추가 import: `fetchMainPageData`

**유지(미변경)**:
- presentation 헬퍼(`toTickerItem`/`toBoardPost`/`toNewsItem`/`toHotIssue`/`toOfficialPost`/`formatRelativeTime`), `COIN_META`·`HOT_TREND_MAP`·`BOARD_PREVIEW_META`
- **className/토큰 일절 미수정** (T05 전담 영역 — 안티패턴 회피). JSX 계약 그대로.
- `HomePage`는 `await loadMainPageData()` → `await fetchMainPageData()` 한 줄만 변경.

## 4. `/` 렌더 모드 before/after (○ 유지 증거)

```
Route (app)                       Revalidate  Expire
┌ ○ /                                     1m      1y
```

- **Before/After 모두 `○`(Static ISR)** — 동적(ƒ)으로 회귀하지 않음(쿠키 의존 클라이언트 미재도입).
- Revalidate `1m`은 **ticker fetch의 60s 최소 revalidate**가 route-level `revalidate=300`보다 작아 적용된 **기존 동작**(지시서 §4 제약: 최소 revalidate 보존). 페이지 export `revalidate = 300`은 그대로.

## 5. 검증 결과

| 검사 | 결과 |
|---|---|
| `npx tsc --noEmit` | ✅ 0 에러 (`TSC_OK`) |
| `npm run build` | ✅ `EXIT=0`, `Compiled successfully` |
| `/` 렌더 모드 | ✅ `┌ ○ /` (Static ISR, ƒ 회귀 없음) |
| `Select-String app/page.tsx 'fetchMainPageData'` | ✅ import + `await fetchMainPageData()` 2건 |
| `Select-String app/page.tsx 'loadMainPageData'` | ✅ (없음) — dead 해소 |

## 6. 안티패턴 회피 확인

- ✅ `app/page.tsx`·`lib/community/queries.ts` 밖 미수정
- ✅ className/토큰 미수정 (T05 침범 없음)
- ✅ `/` 동적(ƒ) 회귀 없음 (anon 클라이언트 유지)
- ✅ 한국어 주석 유지, handover 작성

## 7. 후속 메모

- 본 작업(T03)이 Wave1에서 먼저 커밋되면, T05(Wave2)는 이 위에서 page.tsx의 className 토큰만 교체하면 된다 — 데이터 로직과 라인 충돌 없음.
- `lib/supabase/server.ts`의 `createClient()`는 다른 인증 의존 경로에서 계속 사용되므로 제거 대상 아님(본 작업은 메인페이지 로더 한정).
