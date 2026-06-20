# 인수인계서 — 세션 54 (에러 바운더리 3종 신규 도입)

> 작성일: 2026-06-21
> 이전 세션: [session53](./2026-06-20-session53-db-unblock-review-fixes.md)

---

## 작업 요약
App Router에 전혀 없던 전역 폴백 UI를 도입했다. `app/error.tsx`(클라이언트 에러 바운더리)·`app/loading.tsx`(서버 Suspense 폴백)·`app/not-found.tsx`(서버 404) 3종을 Material 3 라이트 토큰으로 일관 작성. 작업 중 contact 페이지의 미정의 토큰(`primary-foreground`) 잠재버그를 발견하고 신규 파일은 정의된 `on-primary`를 사용. test 아티팩트 2종을 `.gitignore`에 등록.

## 대화 다이제스트

### 토픽 1: 세션 시작 + "진행"
> **사용자**: (세션53 cs 완료 보고 paste 후) "진행"

세션 시작 프로토콜로 `current.md`·`next-dev-prompt.md`를 확인. 세션53 종료 시 명시된 다음 작업("에러 바운더리 3종 — `app/error.tsx`·`loading.tsx`·`not-found.tsx`")으로 진행. `Glob`로 `app/` 전역에 error/loading/not-found 바운더리가 **0건**임을 확인(전역·세그먼트 모두 부재).

**결론**: 세션53 인계 1순위 작업 착수.

### 토픽 2: 디자인 언어 파악
layout.tsx(GlobalHeader 고정 마운트 + `DisplaySettingsProvider` 루트), contact 페이지(둥근 풀 버튼·아이콘 칩·`min-h`+헤더 공간 `h-24` spacer 패턴), globals.css 토큰(Material 3 라이트: `--color-surface-*`·`--color-on-surface(-variant)`·`--color-primary` #0050cb·`--color-error` #ba1a1a·`--color-on-primary` #ffffff)을 확인.

**결론**: contact 패턴을 차용하되 헤더가 layout에 고정이므로 `min-h-[70vh] py-24` 중앙 정렬로 통일.

### 토픽 3: 3종 작성 + 컴포넌트 유형 결정
- `error.tsx`: `reset()` 호출 때문에 `'use client'` **필수**. `useEffect`에서 `console.error('[route-error]', error)` 기록(텔레메트리 미연결, digest로 서버 로그 대조). 재시도/홈 2버튼.
- `loading.tsx`·`not-found.tsx`: 서버 컴포넌트 유지(의존성 최소·resilience). not-found는 `next/link`로 홈 이동.

**결론**: 3파일 작성 완료.

### 토픽 4: 토큰 검증 → 잠재버그 발견
사용한 토큰(`primary-foreground`·`surface-container-high`)을 globals.css에서 검증하던 중 **`--color-primary-foreground`가 미정의**임을 발견. contact 페이지(`text-primary-foreground` 사용)는 Tailwind v4에서 미정의 유틸이 무시되어 파란 `bg-primary` 버튼 위 텍스트 색이 누락(대비 저하)되는 잠재버그가 있음. 신규 파일은 정의된 `text-on-primary`(#ffffff)로 교체.

**결론**: 신규 3파일은 `on-primary` 사용. contact 자체 수정은 범위 외(별도 후속). solution 기록.

### 토픽 5: 검증
`tsc --noEmit` 0, `eslint`(3파일) 0, `npm run build` EXIT 0(58/58 정적, `/_not-found` ○로 커스텀 등록 확인), `vitest run` 33/33. (build 1차에서 PowerShell `Select-Object -First`가 파이프 조기 종료로 exit 255 표시 → `*> $null; $LASTEXITCODE`로 실제 0 재확인.)

**결론**: 전 게이트 통과.

## 의사결정 요약

| # | 결정 | 선택지 | 선택 이유 |
|---|------|--------|----------|
| 1 | `error.tsx`만 클라이언트, 나머지 서버 | 전부 클라 / 혼합 | `reset()` 핸들러만 클라 필요. resilience·의존성 최소화 위해 loading/not-found는 서버 유지 |
| 2 | `on-primary` 사용(미정의 `primary-foreground` 회피) | contact처럼 `primary-foreground` 따라쓰기 | 미정의 토큰은 텍스트색 누락 → 대비 저하. 정의된 `on-primary`(#fff)로 올바른 흰 텍스트 보장 |
| 3 | `global-error.tsx` 미포함 | 함께 추가 | 세션53 계획 범위 3종. global-error는 별도 후속(루트 layout 크래시 담당) |
| 4 | test 아티팩트 `.gitignore` 등록 | 방치 | 세션53에서 정리 제안했던 항목. 커밋 위생 |

## 수정 파일 (4개 + 문서)

| # | 파일 | 변경 내용 |
|---|------|-----------|
| 1 | `app/error.tsx` | 신규 — 클라 에러 바운더리(reset+홈+digest+console.error) |
| 2 | `app/loading.tsx` | 신규 — 서버 Suspense 폴백(Loader2 스피너+aria) |
| 3 | `app/not-found.tsx` | 신규 — 서버 404 폴백(Compass+홈 Link) |
| 4 | `.gitignore` | `/playwright-report`·`/test-results` 등록 |

## 상세 변경 사항
### 1. app/error.tsx — 라우트 에러 폴백
- `'use client'`, props `{ error: Error & { digest? }, reset }`. `useEffect`로 콘솔 기록, `error.digest` 조건부 노출. AlertTriangle(error 토큰) 칩 + "다시 시도"(`reset()`, primary 버튼)·"홈으로"(outline 버튼).

### 2. app/loading.tsx — Suspense 스피너
- 서버 컴포넌트. Loader2 `animate-spin`(primary), "불러오는 중…", `role="status"`·`aria-live="polite"`·sr-only 보강.

### 3. app/not-found.tsx — 404
- 서버 컴포넌트. Compass(primary 칩) + `404` + 안내문 + 홈 Link(primary 풀 버튼, `text-on-primary`).

## 검증 결과
- `npx tsc --noEmit` — 에러 0개
- `npx eslint app/error.tsx app/loading.tsx app/not-found.tsx` — 0
- `npm run build` — EXIT 0 (58/58 정적, `/_not-found` ○ 커스텀 등록)
- `npx vitest run` — 33/33 passed (회귀 0)

## 터치하지 않은 영역
- `app/global-error.tsx`(루트 layout 자체 크래시 담당) 미작성 — 후속 후보.
- 세그먼트별 error/loading 바운더리(예: `app/analysis/[symbol]/`) 미작성 — 전역만 도입.
- contact 페이지 `text-primary-foreground` 잠재버그는 **미수정**(범위 외, solution에 기록 — 후속 일괄 정리 권장).

## 알려진 이슈
- 미정의 토큰 `primary-foreground` 사용처가 contact 외에도 있을 수 있음(전수 grep 미실시) → 후속 일괄 점검 권장. solution `2026-06-21-undefined-tailwind-token-silent-noop.md`.

## 다음 작업 제안
- 배포 후 실환경 e2e(코인룸 시그널·익명글 수정게이트·스크랩/신고 UI 흐름) — 세션53 인계 잔여.
- R-C(데이터): 캘린더 실데이터화·뉴스 사이드바 코인별 집계·상승확률 엔진 연결.
- R-D(정리): blog/search 고아 API·`/api/price` SSOT·DetailedChart 오버레이·kimchi 환율 폴백·contact 입력 검증. + `primary-foreground` 미정의 토큰 전수 정리.
- (선택) `global-error.tsx` 추가.

---
[← handover/_index.md](./_index.md) · [세션 저널 없음 — 단발 세션, 대화 히스토리 기반 작성]
