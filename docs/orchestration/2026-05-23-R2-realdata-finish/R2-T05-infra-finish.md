# R2-T05 — infra-finish

> **본 터미널은 R2 일꾼(R2-T05)**. 1차 발사. 동시 발사 그룹.

## 정체성

- 역할: `worker` (R2-T05), R2, realdata-finish
- 담당: R1 잔여 인프라 3건 마무리 — (1) 메인 `/` 순수 ISR 전환, (2) middleware `node:crypto` edge 경고 해소, (3) Giscus 댓글 라이트 테마
- 의존: R1/T15 (`app/page.tsx`), R1/T07 (`middleware.ts`), R1/T09 (`BlogComments.tsx`)

## 컨텍스트

R1 회수 시 식별된 3개의 작은 인프라 부채. 각각 독립적이며 본 일꾼이 한 터미널에서 묶어 처리.

### (1) `/` 순수 ISR 전환
T15가 `export const revalidate = 300`을 설정했으나, `await createClient()`(lib/supabase/server.ts)가 내부에서 `cookies()`를 호출 → Next가 `/`를 **동적(ƒ) 렌더**로 처리(정적 ISR 비활성). 메인페이지는 익명 읽기 전용이므로 **cookies 비의존 anon 클라이언트**로 데이터를 읽으면 `/`가 정적 ISR(`○`/`●`)로 떨어진다.
- 방안: `lib/supabase/server.ts`를 수정하지 말고(T07/공용), `app/page.tsx`(또는 `lib/community/queries.ts`)에서 메인 전용 anon 클라이언트(`createClient` from `@supabase/supabase-js`, anon key, 쿠키 없음)를 사용. 인증이 필요 없는 공개 데이터만 읽으므로 RLS anon 정책으로 충분.
- **주의**: `lib/community/queries.ts`는 T15 산출물. 본 일꾼 allowed_dirs에 없음 → `app/page.tsx` 내부에서 처리하거나, queries.ts 변경이 꼭 필요하면 handover에 기록하고 지휘자에게 outbox 요청(직접 수정 금지).

### (2) middleware `node:crypto` edge 경고
`lib/community/ip-mask.ts:3 import crypto from "node:crypto"`를 middleware(edge runtime)가 사용 → 빌드 경고. 해소 방안 택1:
- (a) `middleware.ts`에 `export const runtime = "nodejs"` 명시 (가장 간단, 본 영역 내)
- (b) ip-mask의 해시를 Web Crypto(`crypto.subtle`)로 — **단 `ip-mask.ts`는 T07 영역이라 본 일꾼 수정 금지**. 따라서 (a) 우선.

### (3) Giscus 라이트 테마
`components/Blog/BlogComments.tsx`의 Giscus `data-theme`가 `'dark_dimmed'`(또는 유사) → 라이트 페이지와 불일치. `'light'`(또는 `'light_protanopia'`/프로젝트 톤 맞춤)로 전환.

## 공통 SOT (읽기 전용)

```
CLAUDE.md
docs/handover/2026-05-23-R1-T15-mainpage-realdata.md   ← §4 ISR/렌더 모드 분석 (필독)
docs/handover/2026-05-23-R1-T07-auth-middleware.md     ← middleware 구조·ip-mask node:crypto
docs/handover/2026-05-23-R1-T09-blog-lightify.md       ← §"의도적 다크" Giscus data-theme (line 79)
app/page.tsx                                            ← 수정 대상 (ISR)
middleware.ts                                           ← 수정 대상 (runtime)
components/Blog/BlogComments.tsx                        ← 수정 대상 (Giscus theme)
lib/supabase/server.ts                                  ← cookies 사용 확인 (수정 금지)
lib/community/ip-mask.ts                                ← node:crypto 확인 (수정 금지, T07)
```

## 작업 목표 / 산출물 (수정 3)

- **`app/page.tsx`**: 메인 데이터 읽기를 cookies 비의존 anon 클라이언트로 전환 → `/`가 정적 ISR(`○ (ISR)` 또는 `●`)로 빌드되도록. `revalidate=300` 유지. fallback 보존.
- **`middleware.ts`**: `export const runtime = "nodejs"` 추가(또는 동등 방안)로 `node:crypto` edge 경고 해소. matcher/헤더 주입 로직은 보존.
- **`components/Blog/BlogComments.tsx`**: Giscus `data-theme` → 라이트.

## 작업 단계

1. SOT 정독 (T15 §4 필독)
2. (1) `app/page.tsx` anon 클라이언트 전환 → 빌드에서 `/` 렌더 모드 확인 (`○`/`●` 목표)
3. (2) `middleware.ts` runtime 명시 → 빌드 경고 사라짐 확인
4. (3) BlogComments Giscus theme 교체
5. 검증 (빌드 출력에서 `/` 마크 + 경고 부재)

## 검증

```bash
npx tsc --noEmit                                          # 0 error

npm run build 2>&1 | tee /tmp/build.log | tail -40
# 확인:
#  - Route "/"가 ƒ(Dynamic)가 아닌 ○/●(Static/ISR)로 표기
#  - "node:crypto" Turbopack 경고 사라짐
#  - 전체 Compiled successfully

grep -n "runtime" middleware.ts                            # nodejs 명시 확인
grep -n "data-theme\|theme" components/Blog/BlogComments.tsx | head   # light 확인
```

시각 검증(권장): `/` 정상 렌더 + `/blog/[slug]` Giscus 댓글 라이트 테마.

## 완료 신호

`docs/handover/2026-05-23-R2-T05-infra-finish.md` 작성. 명시: 3건 각각 변경 내용·`/` 렌더 모드 전후(ƒ→○/●)·경고 해소 증거·anon 클라이언트 패턴·queries.ts 손대지 않았는지(또는 outbox 요청 여부).

## 안티패턴

- `lib/supabase/server.ts`, `lib/community/ip-mask.ts`, `lib/community/auth.ts` **수정 금지** (공용/T07)
- `lib/community/queries.ts` 직접 수정 금지 (T15 영역 — 필요 시 outbox 요청)
- `app/board/`, `app/news/`, `app/coin/`, `components/Chart/` **수정 금지** (R2 타 영역)
- middleware 인증/헤더 로직 변경 금지 (runtime 명시만)
- 새 패키지 설치 금지
