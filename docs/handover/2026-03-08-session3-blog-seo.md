# 인수인계서 — 세션 3 (블로그 SEO 최적화 + 디자인 강화)

> 작성일: 2026-03-08
> 이전 세션: [session2](./2026-03-08-session2-blog-extend.md)

---

## 작업 요약
블로그 SEO 성숙도를 30% → 80%로 끌어올리고 디자인/시인성을 개선. `@tailwindcss/typography` 활성화, 서버/클라이언트 분리로 메타데이터 생성, JSON-LD 구조화 데이터, robots.txt, sitemap 확장, 카드 깊이감, TOC 스크롤 하이라이팅, 코드 복사 버튼 구현.

## 수정 파일 (19개)

| # | 파일 | 변경 내용 |
|---|------|-----------|
| 1 | `app/globals.css` | `@plugin "@tailwindcss/typography"` 추가 |
| 2 | `app/layout.tsx` | metadataBase, title template, openGraph, WebSite JSON-LD |
| 3 | `app/robots.ts` | **신규** — robots.txt 자동 생성 |
| 4 | `app/sitemap.ts` | 카테고리/태그 페이지 URL 추가 |
| 5 | `app/blog/page.tsx` | 서버 컴포넌트로 변환 (metadata + 프리페치) |
| 6 | `app/blog/BlogPageClient.tsx` | **신규** — 클라이언트 로직 분리 |
| 7 | `app/blog/layout.tsx` | **신규** — 블로그 공통 OG 메타데이터 |
| 8 | `app/blog/[slug]/page.tsx` | canonical URL, Article + Breadcrumb JSON-LD |
| 9 | `app/blog/category/[category]/page.tsx` | 서버 컴포넌트 + generateMetadata |
| 10 | `app/blog/category/[category]/CategoryPageClient.tsx` | **신규** — 클라이언트 로직 |
| 11 | `app/blog/tag/[tag]/page.tsx` | 서버 컴포넌트 + generateMetadata |
| 12 | `app/blog/tag/[tag]/TagPageClient.tsx` | **신규** — 클라이언트 로직 |
| 13 | `lib/supabase/blog.ts` | fetchCategoryBySlug, fetchTagBySlug 헬퍼 추가 |
| 14 | `lib/seo/json-ld.ts` | **신규** — Article/BreadcrumbList/WebSite JSON-LD 생성 |
| 15 | `components/seo/JsonLd.tsx` | **신규** — JSON-LD 렌더 서버 컴포넌트 |
| 16 | `components/Blog/BlogPostCard.tsx` | 그림자 깊이감 + flex 레이아웃 |
| 17 | `components/Blog/BlogRelatedPosts.tsx` | 그림자/호버 효과 동일 적용 |
| 18 | `components/Blog/BlogPostContent.tsx` | 타이포그래피 강화, heading ID 부여, 코드 복사 버튼 |
| 19 | `components/Blog/BlogTableOfContents.tsx` | IntersectionObserver 스크롤 하이라이팅 |

## 상세 변경 사항

### 1. SEO 기초 인프라 (Phase 1)
- `@tailwindcss/typography` 플러그인: 패키지(v0.5.19)는 설치됐지만 Tailwind v4의 `@plugin` 선언이 누락 → `prose` 클래스 동작 안 함 → 수정
- `metadataBase`: 모든 OG/canonical URL이 자동 절대경로화
- title template: 하위 페이지에서 `title: '블로그'` 만 지정하면 `'블로그 | ChartMaster'`로 변환
- `robots.ts`: Next.js 컨벤션 파일로 `/api/`, `/admin/`, `/auth/` 크롤링 차단
- `sitemap.ts`: 기존 블로그 포스트 외 카테고리/태그 페이지 URL 추가

### 2. 서버/클라이언트 분리 (Phase 2)
- 기존 패턴: `app/blog/[slug]/page.tsx` (서버) + `BlogPostDetail.tsx` (클라이언트) → 동일 패턴을 3개 페이지에 적용
- 블로그 목록: 서버에서 초기 데이터 프리페치 → `BlogPageClient`에 props 전달 → 이후 페이지네이션/검색/필터는 클라이언트 fetch 유지
- 카테고리/태그: `generateMetadata()`로 동적 타이틀/OG + canonical URL 생성
- `lib/supabase/blog.ts`에 `fetchCategoryBySlug`, `fetchTagBySlug` 추가 (`.eq('slug', slug).single()`)

### 3. JSON-LD 구조화 데이터 (Phase 3)
- `lib/seo/json-ld.ts`: Article (포스트), BreadcrumbList (네비), WebSite (전역) 3종 스키마
- `components/seo/JsonLd.tsx`: `<script type="application/ld+json">` 렌더링 서버 컴포넌트
- 루트 레이아웃에 WebSite JSON-LD, 포스트 상세에 Article + Breadcrumb JSON-LD 적용

### 4. 디자인/시인성 (Phase 4)
- 카드: `shadow-[0_2px_8px_rgba(0,0,0,0.3)]` + 호버 시 `shadow-[0_8px_24px_rgba(0,0,0,0.4)]`
- 타이포그래피: `leading-[1.8]`, `prose-h2:text-2xl`, `prose-h3:text-xl`, `prose-headings:mt-8 mb-4`
- Heading ID: h2/h3에 `heading-0`, `heading-1`... 순차 부여 (TOC와 동일 카운팅)
- 코드 복사: `useEffect`로 `<pre>` 태그에 Copy 버튼 동적 삽입 → `navigator.clipboard` 사용
- TOC 하이라이팅: `IntersectionObserver` (`rootMargin: '-80px 0px -60% 0px'`)로 현재 heading 추적 → active 항목 `text-primary font-medium` + 왼쪽 border

## 검증 결과
- `npm run build` — ✅ 성공 (모든 페이지 빌드 통과)
- TypeScript — ✅ 에러 없음

## 터치하지 않은 영역
- 블로그 API 라우트 (변경 없음)
- TipTap 에디터 컴포넌트 (변경 없음)
- Supabase 스키마 (변경 없음)
- 기존 분석/차트/뉴스/시그널 모듈 (변경 없음)
- Admin 페이지 (변경 없음)

## 알려진 이슈
- Giscus 미설정 (댓글 비활성 상태)
- 테스트 프레임워크 미도입 (테스트 0개)
- any 타입 78회 사용
- `analysis/[symbol]/page.tsx` 807줄 (리팩토링 필요)
- 이전 세션의 미커밋 변경사항 다수 존재 (api/admin, contact, kimchi, market, SecureMemo, TradeModal, package.json 등)

## 다음 작업 제안
1. 미커밋 변경사항 정리 및 커밋
2. Giscus 댓글 활성화
3. 테스트 프레임워크 도입 (Vitest + Playwright)
4. any 타입 정리
5. 대형 파일 리팩토링
6. OG 이미지 자동 생성 (`app/blog/[slug]/opengraph-image.tsx`)

---
[← handover 목록](../handover/)
