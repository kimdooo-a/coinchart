---
title: Tailwind v4 자동 content 감지가 docs/ 문서의 코드 예시 클래스를 추출해 dev CSS 파서를 깨뜨림
date: 2026-05-30
session: 40
tags: [tailwindcss-v4, turbopack, css-parser, content-detection, source-not, dispatch-integration-catch]
category: bug-fix
confidence: high
---

## 문제

R13 작업 중 일꾼(T-B)이 "dev 모드에서 전 페이지 500, Turbopack CSS 파서 `Unexpected token Delim('*')`"를 보고. T-B는 원인을 `app/globals.css:3960`의 `var(--color-kr-*)` 와일드카드로 진단했으나, **소스 `app/globals.css`는 274줄밖에 안 되고 와일드카드 패턴이 없었다**. `npm run build`(프로덕션)는 통과하고 dev만 깨지는 비대칭.

빌드 로그의 단서:
```
Found 1 warning while optimizing generated CSS:
.text-\[var\(--color-kr-\*\)\] {
  color: var(--color-kr-*);
}
```

## 원인

불량 유틸리티 클래스 `text-[var(--color-kr-*)]`(별표 `*` 포함)의 출처는 코드가 아니라 **R13 문서들**이었다:
- `docs/orchestration/2026-05-30-R13-display-rollout/T-A1-coinroom-sidebar.md` (지휘자 SOT)
- `docs/handover/2026-05-30-R13-T-A1-*.md`·`T-B-*.md` (일꾼 handover)

이 .md 파일들이 "등락색 하드코딩 `text-[var(--color-kr-*)]` 제거" 같은 **설명을 위해 별표를 와일드카드 자리표시자로** 사용했다. Tailwind v4의 `@import "tailwindcss"`는 **자동 content 감지**(`@source` 미지정 시 프로젝트 전체 .gitignore 존중 스캔)를 하는데, **docs/*.md까지 스캔**해 `text-[var(--color-kr-*)]`를 유효한 arbitrary-value 클래스 후보로 추출 → `color: var(--color-kr-*)` 불량 CSS 생성. 프로덕션 CSS 최적화 파이프라인은 경고로 흘리지만, Turbopack dev CSS 파서는 `*`를 Delim 토큰으로 만나 전체 스타일시트 파싱을 중단 → `layout.tsx`가 globals.css를 import하므로 전 페이지 500.

핵심: **워커 단독 검증으로는 안 잡힌다**(각 워커 영역 내 PASS, 빌드도 통과). 여러 문서가 같은 문자열을 쓰면서 누적된 오염을 **지휘자 통합 검증에서만 포착**됐다.

## 해결

`app/globals.css` 상단에 Tailwind v4 negative source 디렉티브 추가:
```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";

/* docs/ 문서의 코드 예시 클래스 문자열이 v4 content 스캐너에 오인 추출되어
   불량 유틸(text-[var(--color-kr-*)])을 생성 → dev CSS 파서를 깨뜨리는 것 방지 */
@source not "../docs";
```
(globals.css가 `app/`에 있으므로 프로젝트 루트 `docs`는 `../docs`)

검증: `.next` 클린 후 재빌드 → CSS 경고 **0**, dev 서버 `/`·`/watchlist`·`/coin/btc`·`/settings` 전부 **HTTP 200**, 파서 에러 0.

## 교훈

- Tailwind v4 자동 content 감지는 **문서(.md)까지 스캔**한다. 코드 예시에 클래스 같은 문자열(특히 `[...]` arbitrary value)을 쓰면 진짜 유틸로 추출될 수 있다. 프로젝트는 `@source not "<docs경로>"`로 문서 디렉토리를 항상 제외하는 게 안전.
- **"프로덕션 빌드 통과 ≠ dev 정상"**: CSS 최적화 단계는 경고로 흘리지만 Turbopack dev 파서는 더 엄격하다. dev 500 디버깅 시 빌드 로그의 `warning while optimizing generated CSS`를 먼저 보라 — 불량 클래스 실체가 거기 찍힌다.
- 워커가 보고한 줄번호(globals.css:3960)는 **빌드 산출물 기준 오진**이었다. 지휘자는 워커 진단을 그대로 믿지 말고 소스에서 grep으로 실체 확인할 것. (dispatch 통합 검증의 가치)

## 관련 파일
- `app/globals.css` (핫픽스)
- `docs/orchestration/2026-05-30-R13-display-rollout/T-A1-coinroom-sidebar.md` (오염원 문서)
