---
title: Tailwind v4 미정의 색 토큰은 조용히 무시되어 텍스트색 누락을 유발
date: 2026-06-21
session: 54
tags: [tailwind-v4, design-tokens, contrast, primary-foreground, on-primary, silent-bug]
category: bug-fix
confidence: high
---

## 문제
새 에러 바운더리를 작성하며 기존 contact 페이지 패턴을 차용하려다, contact의 제출 버튼이 `bg-primary`(파란 #0050cb) 위에 `text-primary-foreground`로 텍스트 색을 지정하는데도 흰 글씨가 보장되지 않는 구조임을 발견. `--color-primary-foreground`는 `app/globals.css`의 `@theme`에 **정의되지 않은 토큰**이다.

```
docs/references / globals.css 에 정의된 것: --color-on-primary: #ffffff
정의되지 않은 것: --color-primary-foreground  ← contact 등에서 사용 중
```

## 원인
Tailwind v4의 `@theme` 토큰 기반에서 **미정의 색 유틸리티(`text-primary-foreground`)는 에러를 내지 않고 조용히 무시(no-op)된다**. 빌드도 통과한다. 그 결과 버튼 텍스트는 색 지정이 없어 상속색(어두운 `on-surface`)으로 렌더 → 파란 배경 위 어두운 글씨로 대비가 떨어진다. shadcn 관례명(`*-foreground`)과 이 프로젝트의 Material 3 토큰명(`on-*`)이 혼재해 발생한 명명 불일치.

## 해결
신규 파일(`app/error.tsx`·`app/not-found.tsx`)의 primary 버튼은 정의된 토큰 `text-on-primary`(#ffffff)를 사용:

```tsx
// ❌ 미정의 — 조용히 무시됨
className="bg-primary text-primary-foreground"
// ✅ 정의됨 — 흰 텍스트 보장
className="bg-primary text-on-primary"
```

contact 페이지 자체 수정은 이번 범위 외(별도 후속). `primary-foreground` 사용처 전수 grep은 미실시 — R-D 정리 라운드에서 일괄 점검 권장.

## 교훈
- 이 프로젝트의 전경색 토큰은 **`on-*`**(Material 3)이 SSOT다. shadcn식 `*-foreground`는 globals.css `@theme`에 매핑된 별칭만 유효(`card-foreground`·`muted-foreground` 등은 정의됨, `primary-foreground`는 **미정의**).
- Tailwind v4 미정의 색 유틸은 빌드를 깨지 않고 무음 실패하므로, 새 색 클래스를 쓸 때는 globals.css에서 토큰 정의를 먼저 확인할 것.

## 관련 파일
- `app/globals.css` (`@theme` 토큰 정의)
- `app/error.tsx` · `app/not-found.tsx` (`on-primary` 사용)
- `app/contact/page.tsx` (`primary-foreground` 잠재버그 — 미수정)
