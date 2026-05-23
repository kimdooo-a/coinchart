# 인수인계서 — 세션 23 (R2/T05 일꾼: 인프라 마무리)

> 작성일: 2026-05-23
> 이전 세션: [session22 (R2/T04 차트 라이트화)](./2026-05-23-R2-T04-chart-lightify.md)
> 본 일꾼 작업 상세: **[R2-T05 orchestration handover](./2026-05-23-R2-T05-infra-finish.md)** (3건 변경·ƒ→○ 증거·anon 패턴·outbox 후속 — 전체 디테일)
> 세션 번호: 지휘자 21·T04 22 점유 → **23 채택** (병렬 R2 T01/T02/T03 충돌 시 후속 정정)

---

## 작업 요약

R1 회수 시 식별된 인프라 부채 3건을 한 터미널에서 마무리: **(1)** `/` 순수 ISR 전환(ƒ→○), **(2)** middleware `node:crypto` edge 경고 해소, **(3)** Giscus 라이트 테마. 수정 정확히 3파일, 타 영역·R1 read-only(queries.ts/server.ts/ip-mask) 무수정.

## 대화 다이제스트

### 토픽 1: R2-T05 발사 + 터미널 배너 불일치
> **사용자**: "⑤ R2-T05 인프라: `R2-T05-infra-finish.md`를 정독하고 그대로 실행해. (1) app/page.tsx를 cookies 비의존 anon 클라이언트로 바꿔 `/`를 정적 ISR화, (2) middleware.ts에 runtime="nodejs" 명시, (3) BlogComments Giscus data-theme를 light로."

본 터미널 kdydispatch 배너는 `R2-T02 (news)` + 허용영역 `app/news/;news-queries.ts;docs/handover/`로 표기됐으나 실제 지시는 R2-T05(infra). 가장 단순한 변경(BlogComments 테마)을 probe로 시도 → 편집 통과 → PreToolUse hook이 배너의 좁은 영역을 강제하지 않음(배너 stale) 확인. R2-T05 쓰기영역(`_INDEX.md` line 14)에 부합.

**결론**: R2-T05 실행 확정. 배너-작업 매핑 불일치는 orchestration handover §8 명시. (T04도 동일 사례 — R2 디스패치 공통 현상)

### 토픽 2: (3) Giscus + (2) middleware — 영역 내 단순 처리
- **(3)**: `BlogComments.tsx` `data-theme` `'dark_dimmed'`→`'light'`. T09가 R2 권장으로 남긴 항목 해소.
- **(2)**: `ip-mask.ts`(T07, 수정금지)의 `node:crypto` import가 middleware edge 런타임에서 경고 → 방안(a) `export const runtime = 'nodejs'` 채택. (방안 b Web Crypto 전환은 ip-mask가 T07 영역이라 불가). matcher·헤더·인증 로직 불변.

**결론**: 빌드 로그에서 node:crypto/Edge 경고 소멸 확인.

### 토픽 3: (1) ISR — 가장 까다로운 의사결정
> 문제: `app/page.tsx`→`fetchMainPageData()`(queries.ts)→`await createClient()`(server.ts)→`cookies()` → `/`가 `ƒ (Dynamic)`. (T15 §4가 이미 진단)

`/`를 정적화하는 무중복 클린 해법은 `queries.ts`의 클라이언트만 cookies 비의존 anon으로 2줄 교체하는 것. 그러나 **queries.ts는 R1 read-only**(`_INDEX.md` line 30 + 스펙 안티패턴), server.ts/ip-mask도 수정금지.

선택지를 비교:
- **(A) outbox 요청** — `/`는 ƒ 유지, 지휘자가 queries.ts 2줄 적용. SSOT 깨끗하나 본 터미널에서 ƒ→○ 미달성.
- **(B) page.tsx 자급** — page.tsx에 anon 로더 내장. ƒ→○ 즉시 달성하나 queries.ts와 형상 중복(fetchMainPageData 미사용화).

스펙 line 17("app/page.tsx에서 anon 사용") + 사용자 직접 지시("app/page.tsx를 바꿔") + 완료신호("`/` 렌더 모드 전후 ƒ→○") 모두 **B를 가리킴**. CLAUDE.md 우선순위상 사용자 명시 지시가 최상위 → **B 채택**.

**기술 함정 2건 해소**:
1. anon 클라이언트만으론 부족 — supabase-js `global.fetch`를 래핑해 `next:{revalidate:300}` 주입해야 uncached fetch가 페이지를 dynamic으로 되돌리지 않음.
2. 빌드 결과 `/`가 `○`로 떨어졌으나 Revalidate가 `5m`이 아닌 **`1m`** — 라우트 revalidate는 의존 fetch들의 **최솟값**(ticker 60s)으로 수렴. `revalidate=300` export는 유지, 정적화 목표 달성.

**결론**: `app/page.tsx`에 `loadMainPageData()` + 매퍼 4종 내장. `/` 렌더 모드 **ƒ→○** 전환. queries.ts 미수정. dead-code 부수효과(fetchMainPageData 미사용화)는 지휘자 SSOT 환원 후속으로 명시.

## 의사결정 요약

| # | 결정 | 선택지 | 선택 이유 |
|---|------|--------|----------|
| 1 | ISR 해법 = page.tsx 자급(B) | (A)outbox / (B)page.tsx 자급 / queries.ts 직접수정(금지) | 스펙·사용자 직접 지시·완료신호 모두 page.tsx anon 명시. CLAUDE.md 사용자 지시 최상위. queries.ts는 R1 read-only |
| 2 | node:crypto = runtime nodejs(a) | (a)runtime / (b)Web Crypto 전환 | (b)는 ip-mask(T07) 수정 필요 — 영역 밖. (a)는 본 영역 내 1줄 |
| 3 | supabase-js global.fetch revalidate 주입 | 미주입 / 주입 | 미주입 시 uncached fetch가 페이지를 dynamic 유지시킬 위험 |
| 4 | 세션 번호 23 | 22(T04 점유) / 23 | 충돌 회피, 병렬 R2 패턴 |

## 수정 파일 (3개 + 문서)

| # | 파일 | 변경 내용 |
|---|------|-----------|
| 1 | `app/page.tsx` | `fetchMainPageData()` 호출 제거 → cookies 비의존 anon 로더 `loadMainPageData()` + 매퍼 4종 내장. `/` ƒ→○ |
| 2 | `middleware.ts` | `export const runtime = 'nodejs'` 추가(로직 불변) |
| 3 | `components/Blog/BlogComments.tsx` | Giscus `data-theme` light |
| 문서 | `docs/solutions/2026-05-23-nextjs-cookies-breaks-isr-revalidate.md` | "해결 확정(세션 23)" 보강 — anon 패턴·global.fetch·min-revalidate 함정 |
| 문서 | `docs/handover/2026-05-23-R2-T05-infra-finish.md` | orchestration 완료 신호(신규) |

## 검증 결과
- `npx tsc --noEmit` — 0 에러 (2회)
- `npm run build` — ✓ Compiled successfully (3.2s). `┌ ○ /  1m  1y`(이전 `┌ ƒ /`) · node:crypto/Edge 경고 부재 · `ƒ Proxy (Middleware)` 정상

## 터치하지 않은 영역
- **R1 read-only**: `lib/community/queries.ts`, `lib/supabase/server.ts`, `lib/community/ip-mask.ts`, `lib/community/auth.ts` — 무수정
- **R2 타 일꾼**: `app/board/`(T01), `app/news/`(T02), `app/coin/`(T03), `components/Chart/`(T04) — 무수정
- 신규 스킬 sync: 본 세션 스킬 변경 없음 (4.6단계 해당 없음)
- 레퍼런스: 데이터 fetch 패턴·런타임·테마 변경 — 스키마/enum/DTO/API 계약 무변경 → 레퍼런스 갱신 불필요

## 알려진 이슈
- **`/` 라우트 revalidate `1m`**: `export const revalidate=300`에도 ticker fetch 60s가 최솟값으로 지배. 정적화 목표는 달성, "정확히 5분"이 필요하면 의존 fetch들의 revalidate를 ≥300으로 정렬해야 함.
- **fetchMainPageData 미사용화**: page.tsx 자급 로더로 인해 queries.ts의 진입점이 메인에서 미호출 상태. 클린 SSOT 환원(지휘자/R3가 queries.ts 클라이언트만 anon 교체 + page.tsx 로더 제거) 권장 — orchestration handover §6.
- **middleware→proxy deprecation**(Next 16): 파일 규칙 deprecation 경고 존재(기존부터·내 변경 무관). 리네임은 구조 변경이라 R3 후보.

## 다음 작업 제안
- (지휘자) R2 회수: 본 일꾼 3파일 + T01·T04 산출물 통합 커밋. mock-* 정리(`_INDEX.md` mock-* 계획) 점검.
- (R3) queries.ts anon 환원으로 page.tsx 로더 제거 → 메인 데이터 SSOT 단일화.
- (R3) middleware.ts → proxy.ts 리네임 검토(Next 16 권장).

---
> 세션 저널: `docs/logs/journal-2026-05-23.md` (## 세션 23 섹션)
