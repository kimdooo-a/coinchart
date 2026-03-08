# 인수인계서 — 세션 5 (블로그 에디터 강화 + HTML 전환)

> 작성일: 2026-03-08
> 이전 세션: [session4](./2026-03-08-session4-quality.md)

---

## 작업 요약

블로그 에디터를 티스토리급으로 확장(TipTap extension 10개 추가)하고, 저장 포맷을 TipTap JSON에서 HTML로 전환하여 소스 편집 모드와 직접 호환되게 함. 자동저장, 전체화면, DOMPurify 보안 적용.

## 수정 파일 (20개)

| # | 파일 | 변경 내용 |
|---|------|-----------|
| 1 | `types/blog.ts` | `BlogPost.content` 타입 string 전환 (레거시 JSON 호환 union) |
| 2 | `components/Blog/editor/BlogEditor.tsx` | 전면 재작성: HTML 저장, viewMode, D&D/paste, 전체화면 |
| 3 | `components/Blog/editor/EditorToolbar.tsx` | 28개 버튼 (Underline/Highlight/Color/Align/Table/YouTube) + 뷰모드 탭 |
| 4 | `components/Blog/editor/EditorImageUpload.tsx` | `uploadImage()` 함수 추출 |
| 5 | `components/Blog/editor/ColorPicker.tsx` | **신규** — 텍스트 색상 선택 팝업 |
| 6 | `components/Blog/editor/hooks/useAutoSave.ts` | **신규** — localStorage 자동저장 (3초 디바운스) |
| 7 | `components/Blog/BlogPostContent.tsx` | generateHTML 제거 → HTML 직접 렌더링 |
| 8 | `components/Blog/BlogTableOfContents.tsx` | JSON 파싱 → HTML 정규식 파싱 |
| 9 | `lib/blog-editor-extensions.ts` | **신규** — 15개 extension SSOT |
| 10 | `lib/blog-sanitize.ts` | **신규** — DOMPurify HTML 정제 |
| 11 | `lib/blog-html-utils.ts` | **신규** — heading 추출/ID 부여/텍스트 추출 유틸 |
| 12 | `lib/blog-utils.ts` | string-only + 레거시 호환 |
| 13 | `lib/supabase/blog.ts` | sanitizeHtml 적용 (create/update) |
| 14 | `app/admin/blog/new/page.tsx` | content string + useAutoSave |
| 15 | `app/admin/blog/edit/[id]/page.tsx` | content string + useAutoSave |
| 16 | `app/api/blog/route.ts` | content typeof string 검증 |
| 17 | `app/api/blog/[id]/route.ts` | content 검증 |
| 18 | `app/globals.css` | Table/YouTube/highlight CSS |
| 19 | `scripts/migrate-blog-content-to-html.ts` | **신규** — 마이그레이션 스크립트 |
| 20 | `supabase/migrations/20260309_blog_content_to_html.sql` | **신규** — DB 스키마 SQL |

## 상세 변경 사항

### 1. HTML 저장 전환
- 에디터: `editor.getJSON()` → `editor.getHTML()`
- 렌더러: `generateHTML()` 제거 → 전달받은 HTML 직접 렌더링
- TOC: TipTap JSON 재귀 파싱 → HTML 정규식 파싱
- API: content가 string인지 검증
- DB: 기존 데이터 이미 HTML 형식, 컬럼도 이미 text 타입

### 2. 에디터 기능 확장
- 밑줄(Underline), 형광펜(Highlight multicolor), 텍스트 색상(Color + TextStyle)
- 정렬(TextAlign: 왼쪽/가운데/오른쪽/양쪽)
- 표(Table + Row + Header + Cell, 리사이즈 가능)
- YouTube 임베드
- 이미지 드래그앤드롭 + 클립보드 붙여넣기

### 3. 뷰모드 (편집 / HTML / 미리보기)
- HTML 모드: textarea에서 소스 직접 편집
- 미리보기: BlogPostContent로 실제 발행 모습 렌더링
- 모드 전환 시 에디터 ↔ HTML 소스 자동 동기화

### 4. 자동저장 + 전체화면
- useAutoSave: localStorage 기반, 3초 디바운스, 24시간 복원 제안
- 전체화면: fixed inset-0 z-50, ESC 키 해제

### 5. 보안
- isomorphic-dompurify로 저장 시 HTML 정제
- `<script>`, 이벤트 핸들러 등 위험 요소 제거
- YouTube iframe만 허용

## 검증 결과
- `npx tsc --noEmit` — 에러 0개
- `npm run build` — 성공
- `npx vitest run` — 7/7 통과 (blog-utils)
- DB 마이그레이션 — 이미 적용 상태 확인

## 터치하지 않은 영역
- Phase 2 (예약 발행, 비공개글, 단축키 안내)
- Phase 3 (이미지 리사이즈/정렬, 글 복제, 파일 첨부)
- 기존 블로그 공개 페이지 레이아웃 (BlogPostCard 등)
- analysis, stock, signal 등 블로그 외 모듈

## 알려진 이슈
- `BlogPost.content` 타입이 `string | Record<string, any>` union — DB 마이그레이션 후 `string`으로 단순화 가능
- Supabase 마이그레이션 히스토리에서 동일 날짜 파일 중복 (20241213 ×3, 20241214 ×2) — 향후 리네이밍 권장

## 다음 작업 제안
1. Phase 2 구현 (예약 발행, 비공개/비밀번호 글, 단축키 안내)
2. Phase 3 구현 (이미지 리사이즈/정렬, 글 복제)
3. OG 이미지 자동 생성 (`opengraph-image.tsx`)
4. `BlogPost.content` 타입 `string` 단순화 (레거시 호환 제거)

---
