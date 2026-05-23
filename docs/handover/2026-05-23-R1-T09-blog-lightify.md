# R1-T09 인수인계 — blog-lightify

- **날짜**: 2026-05-23
- **라운드/일꾼**: R1 / T09 (mainpage)
- **상태**: 완료
- **의존**: T08 (`BlogEditor`/`EditorToolbar`의 `tone?: 'light'|'dark'` prop, default `'light'`)
- **하류 의존자**: 없음 (블로그 페이지는 커뮤니티 진입 경로의 보조 콘텐츠)

## 작업 목표

세션 7 디자인 토큰 라이트 전환 이후 다크 톤으로 작성돼 색상 회귀가 있던 블로그 페이지 4종 + 블로그 컴포넌트(에디터 서브시스템 제외)를 라이트 토큰으로 통일. JSX 구조·로직·라우팅·SEO 메타는 변경 없이 **클래스만** 교체.

## 수정한 파일 목록 (전체 18개)

### 페이지 — `app/blog/` (4개)

> 참고: spec 예상 경로(`app/blog/page.tsx` 등)는 서버 컴포넌트 래퍼이며 다크 클래스 0건이라 미수정. 실제 다크 톤은 클라이언트 컴포넌트(`*Client.tsx`, `*Detail.tsx`)에 있었음.

| 파일 | 교체 내용 |
|------|----------|
| `app/blog/BlogPageClient.tsx` | 페이지 배경 `bg-black text-white`→라이트, 부제 `text-gray-400` |
| `app/blog/category/[category]/CategoryPageClient.tsx` | 배경 + 뒤로가기 링크 + 카운트 텍스트 |
| `app/blog/tag/[tag]/TagPageClient.tsx` | 배경 + 뒤로가기 링크 + 카운트 텍스트 |
| `app/blog/[slug]/BlogPostDetail.tsx` | 배경 + 뒤로가기 + 메타 `text-gray-500` + 이미지/태그/공유 구분선 `border-white/10` |

### 컴포넌트 — `components/Blog/` (11개, `editor/` 제외)

| 파일 | 교체 내용 |
|------|----------|
| `BlogCategoryFilter.tsx` | 선택 pill `bg-white text-black`→`bg-primary text-on-primary`, 비선택 텍스트/보더/hover |
| `BlogComments.tsx` | 구분선 2곳 `border-white/10`, 안내문 `text-gray-500` |
| `BlogPostCard.tsx` | 카드 보더/배경/그림자/hover, 제목 `text-white`, 요약/메타/태그 |
| `BlogPostContent.tsx` | `prose-invert` 제거 + prose-headings/p/strong/code/blockquote/img/hr/li/th/td 라이트화 (**코드블록 `prose-pre`는 의도적 다크 유지**) |
| `BlogPostList.tsx` | 스켈레톤 카드/바, 빈 상태, 페이지네이션 버튼·활성 페이지 |
| `BlogRelatedPosts.tsx` | 섹션 구분선/제목, 카드 보더/배경/그림자, 카드 제목/날짜 |
| `BlogSearchBar.tsx` | 검색 아이콘, 입력창 배경/보더/텍스트/placeholder, 클리어 버튼 |
| `BlogShareButtons.tsx` | "공유" 라벨, 복사/X 버튼 ×2 (보더/텍스트/hover) |
| `BlogSidebar.tsx` | 카드 3개 보더/배경, 헤딩 3개, 카테고리/태그/최근글 링크, 날짜 |
| `BlogTableOfContents.tsx` | 컨테이너 보더/배경, 헤딩, 비활성 항목 텍스트/hover |
| `BlogTagBadge.tsx` | 뱃지 보더/배경/텍스트/hover |

### BlogEditor 사용처 — `tone="light"` 명시 전달 (3개)

| 파일 | 변경 |
|------|------|
| `app/admin/blog/new/page.tsx` | `<BlogEditor ... tone="light" />` |
| `app/admin/blog/edit/[id]/page.tsx` | `<BlogEditor ... tone="light" />` |
| `app/board/[slug]/write/page.tsx` | `<BlogEditor ... tone="light" />` (커뮤니티 글쓰기, T12 인접 영역 — 에디터 prop 한 줄만 추가) |

> T08에서 `tone` 기본값이 `'light'`라 셋 다 동작은 동일하지만, 사용자 지시("BlogEditor 사용처엔 tone="light" 전달")에 따라 의도를 명시적으로 표기.

> **`components/Blog/editor/` 하위(BlogEditor·EditorToolbar·ColorPicker·EditorImageUpload·useAutoSave)는 T08 영역으로 미터치.** 에디터 톤은 `tone` prop으로 제어되며, 본 일꾼은 직접 클래스 교체하지 않음.

## 클래스 교체 매핑 표

| 다크 톤 (실제 팔레트) | 라이트 토큰 | 비고 |
|---|---|---|
| `bg-black` (페이지 배경) | `bg-surface-container-lowest` | |
| `bg-white/5` (카드/입력 표면) | `bg-surface-container` | |
| `bg-white/10` (스켈레톤/hover/인라인코드) | `bg-surface-container-high` | |
| `hover:bg-white/5` | `hover:bg-surface-container-low` | |
| `hover:bg-white/10` | `hover:bg-surface-container` | |
| `text-white`, `text-gray-300` (본문) | `text-on-surface` | |
| `text-gray-400`, `text-gray-500`, `text-gray-600` | `text-on-surface-variant` | |
| `hover:text-white` | `hover:text-on-surface` | |
| `border-white/10` | `border-outline-variant` | |
| `border-white/20`, `border-white/30` (hover) | `border-outline` | |
| `bg-white text-black border-white` (선택 pill) | `bg-primary text-on-primary border-primary` | `components/community/Badge.tsx` 패턴 일치 |
| `bg-primary text-white` (활성 페이지) | `bg-primary text-on-primary` | |
| `shadow-[...rgba(0,0,0,0.3)]` / `0.4` | `...0.06` / `0.10` | 라이트 배경에 맞춰 그림자 농도 완화 |

> spec 매핑표는 `bg-zinc-*`/`bg-slate-*` 기준이었으나 실제 코드는 `bg-white/*`·`text-gray-*` 팔레트를 사용 → 의미적으로 동등 매핑. `components/community/Badge.tsx`(SOT)의 `bg-primary text-on-primary`, `border-outline-variant text-on-surface-variant` 패턴을 참고해 정렬.

## 의도적으로 남긴 다크 톤 (사유)

1. **`BlogPostContent.tsx` L69 — `prose-pre:bg-black/60 prose-pre:border-white/10`**: 코드 블록. `prose-invert` 제거 후 Tailwind Typography 기본값이 코드블록을 다크 배경+밝은 텍스트로 렌더하며, 코드 가독성을 위해 다크 유지가 표준(GitHub 등). T08이 에디터 textarea(`bg-black/60 text-green-400`)를 의도적으로 다크 보존한 결정과 일관.
2. **`BlogPostContent.tsx` L40 — 복사 버튼(`bg-white/10 ... text-gray-400`)**: 위 다크 코드블록 위에 떠 있는 버튼이므로 다크 표면용 스타일이 적절. `useEffect` 내 동적 생성 element(로직 영역)라 클래스 교체 대상에서 제외.
3. **`BlogShareButtons.tsx` L58 — `text-green-400`**: 복사 완료(Check) 표시용 시맨틱 성공 색상. 다크 톤이 아닌 액센트라 보존.
4. **`BlogComments.tsx` L48 — Giscus `data-theme: 'dark_dimmed'`**: Giscus iframe 위젯 설정(`setAttribute`, 로직 영역). 클래스가 아니며 외부 위젯 시각 동작 변경에 해당해 미변경. **후속 권장**: 라이트 페이지 전체 일관성을 위해 `'light'`로 전환 검토(R2).

## 검증 결과

| 항목 | 명령 | 결과 |
|------|------|------|
| 타입 체크 | `npx tsc --noEmit` | **PASS** (0 에러) |
| 잔여 다크 톤 | `grep "bg-zinc-\|bg-slate-\|text-white\|border-zinc-\|prose-invert" app/blog/ components/Blog/ \| grep -v BlogEditor \| grep -v editor/` | **0건** (기대 0) |
| 라이트 토큰 사용 | `grep "bg-surface-container\|text-on-surface\|border-outline-variant" app/blog/ components/Blog/ (editor 제외)` | **70건** (기대 10+) |
| 빌드 회귀 | `npm run build` | **Compiled successfully** — `/blog`, `/blog/[slug]`, `/blog/category/[category]`, `/blog/tag/[tag]` 4 라우트 정상 등록 |

> **빌드 주의**: 첫 시도 시 `.next\lock` 점유 에러 발생(병렬 터미널 추정). 락 해제(실행 중 `next` 프로세스 없음 확인) 후 재시도하여 `build-exit=0` 확보. 향후 병렬 빌드 충돌 시 다른 일꾼 프로세스를 죽이지 말고 락 해제 대기 후 재시도 권장.

## 시각 검증 방법 (PARTIAL — 권장)

자동 스크린샷 비교는 미수행(Playwright 미실행). 다음으로 수동 확인 권장:

```bash
npm run dev
# → http://localhost:3000/blog 진입
```

비교 기준: `docs/design-brief/stitch_attachment_file_checker/_*/screen.png` (라이트 톤 시안).
확인 포인트: 흰 배경 + 짙은 본문 텍스트, 카드/사이드바 회색 표면(`surface-container`), 카테고리 선택 pill 프라이머리 컬러, 코드블록만 다크 유지.

## 안티패턴 준수 확인

- ✅ `components/Blog/editor/BlogEditor.tsx` 등 에디터 서브시스템 미수정 (T08 영역)
- ✅ `app/analysis/`, `app/signal/`, `app/market/` 미터치 (T10·T11 영역)
- ✅ JSX 구조·로직·라우팅·SEO 메타 무변경 (클래스 + 에디터 prop 1개만)
- ✅ 새 패키지 설치 없음
- ✅ 다크 모드 토글 미추가

## 후속 권장 (R2)

- `BlogComments.tsx`의 Giscus `data-theme`를 `'light'`로 전환해 댓글 위젯까지 라이트 통일
- `components/Blog/editor/` 내부 ToolButton 색상 tone-aware 분기 (T08 handover 후속 권장과 동일)
