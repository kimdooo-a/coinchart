# T09 — blog-lightify

> **본 터미널은 R1 일꾼(T09)**. T08 완료 후 발사.

## 정체성

- 역할: `worker` (T09), R1, mainpage
- 담당: 블로그 페이지 4종 라이트화 (`/blog`, `/blog/[slug]`, `/blog/category/[category]`, `/blog/tag/[tag]`) + 블로그 컴포넌트 라이트화 (BlogEditor 제외)
- 의존: T08 (`tone="light"` prop)

## 컨텍스트

세션 7에서 디자인 토큰을 라이트로 전환했으나 블로그 페이지는 원래 다크 톤으로 작성되어 색상 회귀가 발생. 본 일꾼이 라이트 톤으로 통일하되, **시각 동작·라우팅·SEO 메타·SSR 구조는 절대 변경하지 말 것**.

## 공통 SOT

```
CLAUDE.md
app/globals.css                  ← 라이트 토큰 (text-on-surface, bg-surface-container 등)
components/community/Badge.tsx   ← 통합 뱃지 스타일 (참고)
components/community/BoardRow.tsx ← 라이트 톤 행 스타일 참고
docs/orchestration/2026-05-23-R1-mainpage/T08-chart-theme-editor-tone.md
docs/handover/2026-05-23-R1-T08-chart-theme-editor-tone.md
components/blog/BlogEditor.tsx   ← T08 산출물 (수정 금지!)
```

## 작업 목표

블로그 페이지 + 컴포넌트(BlogEditor 제외)의 다크 톤 클래스(`bg-zinc-900`, `text-white`, `border-zinc-800` 등)를 라이트 토큰으로 교체.

## 산출물 (수정)

대상 파일은 `Grep`으로 다음 패턴 검색하여 확정:
```
grep -rn "bg-zinc-\|bg-slate-\|bg-neutral-\|text-white\|prose-invert\|border-zinc-\|border-slate-" app/blog/ components/blog/
```

발견된 클래스를 다음 패턴으로 일괄 교체:

| 다크 톤 | 라이트 토큰 |
|---|---|
| `bg-zinc-900`, `bg-zinc-950`, `bg-slate-900` | `bg-surface-container-lowest` |
| `bg-zinc-800`, `bg-slate-800` | `bg-surface-container` |
| `bg-zinc-700` | `bg-surface-container-high` |
| `text-white`, `text-zinc-100` | `text-on-surface` |
| `text-zinc-400`, `text-zinc-500`, `text-slate-400` | `text-on-surface-variant` |
| `border-zinc-700`, `border-zinc-800`, `border-slate-700` | `border-outline-variant` |
| `prose-invert` (BlogEditor 외) | 제거 |
| `hover:bg-zinc-700` | `hover:bg-surface-container-low` |

**`components/blog/BlogEditor.tsx`는 절대 수정 금지** (T08 영역).

BlogEditor를 사용하는 페이지(예: `/blog/[slug]/edit`)에는 `<BlogEditor tone="light" .../>` 전달.

대상 페이지/컴포넌트 (예상):
- `app/blog/page.tsx`
- `app/blog/[slug]/page.tsx`
- `app/blog/category/[category]/page.tsx`
- `app/blog/tag/[tag]/page.tsx`
- `components/blog/BlogCard.tsx` (있다면)
- `components/blog/BlogList.tsx` (있다면)
- `components/blog/BlogHero.tsx` (있다면)
- `components/blog/BlogToc.tsx` (있다면)
- 기타 `components/blog/*.tsx` 모든 파일 (BlogEditor 제외)

## 작업 단계

1. `Grep`으로 다크 톤 클래스 사용 위치 전수 조사
2. 우선순위 (시각 영향 큰 순):
   - `app/blog/page.tsx` (리스트)
   - `app/blog/[slug]/page.tsx` (상세)
   - `app/blog/category/[category]/page.tsx`
   - `app/blog/tag/[tag]/page.tsx`
   - 카드/리스트 컴포넌트
   - 토크/사이드바 컴포넌트
3. 각 파일 minimal diff (클래스만 교체, JSX 구조 보존)
4. 검증

## 검증

```bash
npx tsc --noEmit

# 다크 톤 잔여 검증 (BlogEditor 제외)
grep -rn "bg-zinc-\|bg-slate-\|text-white\|border-zinc-\|prose-invert" app/blog/ components/blog/ | grep -v BlogEditor
# 기대: 0건

# 라이트 토큰 사용 검증
grep -rn "bg-surface-container\|text-on-surface\|border-outline-variant" app/blog/ components/blog/ | wc -l
# 기대: 10건 이상

# 빌드 회귀
npm run build 2>&1 | tail -20

# (선택) 시각 검증 — Playwright MCP가 가능하면
# 사용자에게 안내하는 식으로 handover에 명시
```

## 완료 신호

`docs/handover/2026-05-23-R1-T09-blog-lightify.md` 작성.

명시:
- 수정한 파일 목록 (전체)
- 클래스 교체 매핑 표
- `BlogEditor`에 `tone="light"` 전달 적용 위치
- 잔여 다크 톤 (그래도 의도적으로 남긴 부분 — 코드 블록 syntax highlight 등) 사유
- 시각 검증 방법: `npm run dev` 후 `/blog` 진입 → `docs/design-brief/stitch_attachment_file_checker/_*/screen.png`와 비교 권장 (PARTIAL 가능)

## 안티패턴

- `components/blog/BlogEditor.tsx` 수정 금지 (T08 영역)
- `app/analysis/`, `app/signal/`, `app/market/` 수정 금지 (T10·T11 영역)
- JSX 구조·로직·라우팅·SEO 메타 변경 금지 (클래스만)
- 새 패키지 설치 금지
- 다크 모드 토글 추가 금지 (v2.1)
