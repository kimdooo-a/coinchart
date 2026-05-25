# T03 — queries.ts SSOT 환원 (메인페이지 데이터 로더 단일화)

## 1. 컨텍스트
- 프로젝트: Crypto Chart Analysis — Next.js 16 App Router
- 작업 디렉토리: `F:\11_dev\260523 코인 차트분석`
- 본 터미널 역할: **T03 / 5** (R6-polish Wave 1) — 메인페이지 데이터 로더 이원화 해소
- 쓰기 영역(격리): `app/page.tsx`, `lib/community/queries.ts` **2파일만**

## 2. 배경
메인페이지 데이터 로딩 로직이 **이원화**되어 있다:
- `lib/community/queries.ts`의 `fetchMainPageData()` — R1/T15가 작성. `lib/supabase/server.ts`의 `createClient()`(**쿠키 의존**) 사용 → `/`를 동적(ƒ)으로 만듦.
- `app/page.tsx`의 `loadMainPageData()` — R2/T05가 `/`를 정적 ISR(○)로 만들려고 page.tsx에 **anon 클라이언트 자급 로더를 내장**. 그 결과 `queries.ts.fetchMainPageData()`가 **미사용(dead)** 상태가 됨.

`app/page.tsx`의 기존 주석(§124~128)이 후속 방향을 명시: *"queries.ts.fetchMainPageData()의 클라이언트만 anon으로 교체하면 page.tsx가 다시 SSOT를 재사용 가능"*.

## 3. 공통 SOT (읽기 전용)
- `app/page.tsx` (특히 §124~130 주석·`loadMainPageData`) — 현재 자급 로더
- `lib/community/queries.ts` (`fetchMainPageData`·`MainPageData` 타입·매퍼) — 미사용 SSOT
- `docs/handover/2026-05-23-session23-r2t05-infra.md` — R2/T05 anon 로더 자급 + `/` ○ ISR 전환 맥락(§6에 SSOT 환원 후속 권장)
- `docs/handover/2026-05-23-R1-T15-mainpage-realdata.md` — `fetchMainPageData` 원설계
- `CLAUDE.md` — SSOT 규칙

## 4. 작업 목표

### 방향 (권장): queries.ts를 anon 단일 SOT로
1. `lib/community/queries.ts`의 `fetchMainPageData()`를 **쿠키 비의존 anon 클라이언트**로 교체(R2/T05가 page.tsx에 쓴 패턴 — `@supabase/supabase-js` createClient + `global.fetch`에 `next: { revalidate: 300 }` 주입). page.tsx의 `loadMainPageData` 내부 로직·매퍼를 queries.ts로 흡수.
2. `app/page.tsx`는 `loadMainPageData` 제거하고 `fetchMainPageData()`를 import해 호출. **`/`의 정적 ISR(○) 렌더 모드를 반드시 유지**(revalidate=300, 쿠키·동적 API 미사용).
3. 매퍼·타입 중복 제거(page.tsx에 복제된 변환 헬퍼를 queries.ts SSOT로 일원화).

### 제약 (중요)
- **className(토큰)을 절대 건드리지 말 것** — `app/page.tsx`에 `on-surface-variant` 등 토큰이 있으나 이는 **T05 전담**. 본 작업은 데이터 로딩 로직만.
- 외부 API(.catch 격리)·revalidate=300·최소 revalidate(ticker 60s) 기존 동작 보존.

## 5. 도구 권장
- 직접 작성. Supabase anon 클라이언트 패턴은 R2/T05 page.tsx 코드가 레퍼런스.

## 6. 의존성
- 독립. T05와 page.tsx 파일은 겹치나 **다른 라인(로직 vs className)** — Wave1에서 본 작업이 먼저 커밋되고, T05는 Wave2에서 그 위에 토큰만 교체.

## 7. 검증
```powershell
npx tsc --noEmit                       # 0 에러
npm run build                          # ┌ ○ /  (정적 ISR 유지 — ƒ로 회귀 금지)
# fetchMainPageData가 실제 사용되는지 (dead 해소)
Select-String -Path app/page.tsx -Pattern 'fetchMainPageData'
# loadMainPageData 제거 확인
Select-String -Path app/page.tsx -Pattern 'loadMainPageData'   # 없어야 함
```
- 빌드 출력에서 `/`가 `○`(Static)인지 `ƒ`(Dynamic)로 회귀하지 않았는지 **반드시 확인**(쿠키 의존 복귀 = 실패).

## 8. 완료 신호
`docs/handover/2026-05-25-R6-T03-queries-ssot.md` 작성. 포함: 단일화 방향·옮긴 로직, `/` 렌더 모드 before/after(○ 유지 증거), 제거된 중복, tsc/build 결과.

## 안티패턴
- ❌ `app/page.tsx`·`lib/community/queries.ts` 밖 수정
- ❌ className/토큰 수정 (T05 침범)
- ❌ `/`를 동적(ƒ)으로 회귀시킴 (쿠키 의존 클라이언트 재도입)
- ❌ 한국어 주석 누락 / handover 누락
