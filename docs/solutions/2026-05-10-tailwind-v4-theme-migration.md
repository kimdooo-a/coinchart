---
title: Tailwind v4 @theme 디렉티브로 디자인 토큰 전면 교체 (다크 → 라이트)
date: 2026-05-10
session: 7
tags: [tailwind-v4, design-tokens, material-3, css-variables, korean-finance]
category: pattern
confidence: high
---

## 문제

기존 사이트(다크 프리미엄 톤, `--brand-main` 오렌지 + monet/vangogh/davinci 레거시 토큰)에서 Stitch가 반환한 Material 3 라이트 토큰 시스템으로 전환해야 했다. 추가로:
- 시안 HTML이 사용한 클래스(`text-primary`, `bg-surface-container-lowest`, `font-h1 text-h1`, `text-on-surface-variant`)를 그대로 React 컴포넌트에서 쓸 수 있게 매핑
- 시안의 미국식 색상(녹=Bullish, 빨=Bearish)을 한국식(빨=상승, 파=하락)으로 강제 재배치
- 기존 25페이지가 빌드 시점에 깨지지 않도록 호환 alias 유지

## 원인

1. **Tailwind v4의 `@theme` 디렉티브** — v3의 `tailwind.config.ts`와 다른 방식. CSS 안에서 `--color-*`, `--text-*`, `--spacing-*`, `--radius-*` 같은 토큰을 정의하면 자동으로 유틸리티 클래스가 생성된다.
2. **Material 3 토큰 명세** — surface 8단계, on-surface variants, primary/secondary fixed 변형 등 표준화된 명명이 있음. Stitch DESIGN.md가 이 명명을 그대로 따랐음.
3. **타이포 토큰의 메타데이터** — Tailwind v4는 `--text-{name}` + `--text-{name}--line-height` + `--text-{name}--font-weight` 형식을 지원해 `text-{name}` 클래스 적용 시 세 속성이 한 번에 적용된다.
4. **shadcn-ui 호환** — 기존 컴포넌트가 `bg-card`, `text-foreground`, `border-border` 등 alias를 쓰는데 새 토큰 그룹과 매핑 안 하면 빌드는 통과해도 시각이 깨진다.

## 해결

`app/globals.css`를 8개 토큰 그룹으로 재구성:

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";

@theme {
  /* 1. Surface (배경 8단계) */
  --color-surface-container-lowest: #ffffff;     /* 메인 콘텐츠 */
  --color-surface-container-low: #f2f3ff;        /* 보더 영역 */
  --color-surface-container: #ecedfa;            /* 사이드바 */
  --color-surface-container-high: #e6e7f4;
  --color-surface-container-highest: #e1e2ee;

  /* 2. On-surface (텍스트) */
  --color-on-surface: #191b24;
  --color-on-surface-variant: #424656;

  /* 3. Outline (보더) */
  --color-outline: #727687;
  --color-outline-variant: #c2c6d8;

  /* 4. Primary + 5. Secondary + 6. Tertiary/Error */
  --color-primary: #0050cb;          /* Fintech Blue */
  --color-secondary: #006e2e;        /* Naver Green */

  /* 7. 한국식 시맨틱 (글로벌 미국식 반대) */
  --color-positive: #ba1a1a;         /* 호재·상승 = 빨강 */
  --color-negative: #0050cb;         /* 악재·하락 = 파랑 */
  --color-kr-up: #ba1a1a;            /* 시안 호환 alias */
  --color-kr-down: #0050cb;

  /* 8. shadcn-ui 호환 alias (기존 페이지 보호) */
  --color-background: var(--color-surface-container-lowest);
  --color-foreground: var(--color-on-surface);
  --color-card: var(--color-surface-container-lowest);
  --color-border: var(--color-outline-variant);
  --color-ring: var(--color-primary);

  /* 폰트 (next/font/google에서 주입한 변수 + Noto Sans KR fallback) */
  --font-sans: var(--font-noto-sans-kr), 'Noto Sans KR', system-ui, sans-serif;

  /* 타이포 스케일 — 메타데이터 형식 */
  --text-h1: 28px;
  --text-h1--line-height: 1.2;
  --text-h1--font-weight: 700;
  --text-body-base: 14px;
  --text-body-base--line-height: 1.5;
  --text-body-base--font-weight: 400;
  --text-meta: 12px;
  --text-meta--line-height: 1.2;
  --text-meta--font-weight: 400;
}
```

이후 컴포넌트에서 `<h1 className="text-h1">`만 써도 28px/700/1.2가 한 번에 적용된다.

**한국식 색상 강제 패턴** (시안이 미국식이라도 우리 컴포넌트에서 강제 재배치):

```tsx
// NewsHeadlineCard.tsx
const SENTIMENT_STYLE: Record<NewsSentiment, {...}> = {
  positive: { badgeClass: "bg-[var(--color-positive)] text-white", ... },  // 빨강
  negative: { badgeClass: "bg-[var(--color-negative)] text-white", ... },  // 파랑
  ...
};
```

`bg-[var(--color-positive)]` 임의값 문법으로 토큰을 직접 호출 → 시안 클래스명에 영향 받지 않음.

## 교훈

1. **Tailwind v4의 `@theme`는 단일 SoT**: `tailwind.config.ts` 없어도 작동. CSS 안에서 모든 토큰 + 메타데이터 정의 가능. v3에서 마이그레이션 시 큰 차이.
2. **타이포 메타데이터 활용하면 클래스 1개로 3속성 해결**: `text-h1`만 쓰면 `font-h1`은 무시됨(중복) — 시안 HTML의 `font-h1 text-h1` 패턴은 잉여이지만 무해.
3. **shadcn alias 유지가 중요**: 기존 페이지의 `bg-card`/`text-foreground`가 깨지면 빌드 통과해도 시각 회귀 발생. alias로 새 토큰을 가리키게 하면 점진 마이그레이션 가능.
4. **시맨틱 컬러는 절대 글로벌 가정 하지 말 것**: 색상 해석은 문화권별로 다름 (미국 녹=상승, 한국 빨=상승, EU 일부도 다름). Stitch 같은 AI 생성 도구는 미국식 기본값을 가짐 → 컴포넌트 단에서 토큰으로 강제 재배치해야 안전.
5. **Material 3 토큰 명명을 따르면 디자인 도구와 호환성 ↑**: `surface-container-lowest`, `on-surface-variant` 같은 명명이 처음엔 길어 보이지만 디자인 도구·Figma 플러그인·다른 디자인 시스템과의 호환성이 압도적.

## 관련 파일

- `app/globals.css` — 토큰 정의
- `app/layout.tsx` — Noto Sans KR 폰트 변수 주입
- `components/community/NewsHeadlineCard.tsx` — 한국식 색상 강제 패턴 예시
- `docs/design-brief/stitch_attachment_file_checker/data_dense_utility/DESIGN.md` — 토큰 명세 원본
