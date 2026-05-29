# R11-T01 — 라우트 레지스트리 전수 정합 (인수인계서)

- **날짜**: 2026-05-29
- **라운드/터미널**: R11-reconcile-refactor / T01 (Wave 1, 평면 4터미널 중 일꾼)
- **쓰기 영역(격리)**: `docs/references/_WEB_CONTRACT.md` 단독 — 코드·타 docs 미수정 준수 ✅
- **빌드 결과**: `npm run build` **green (exit 0)** — Next.js 16.0.7 (Turbopack), 정적 프리렌더 54/54

---

## 1. 작업 요약

`_WEB_CONTRACT.md` §2 라우트 레지스트리가 **R-001~R-030(30행)**으로 v2.0 커뮤니티 라우트를 누락하고 있었고, §8 연결성 카운트(23/19)·§3-3 Footer가 stale 상태였다. `npm run build` 출력을 진실의 원천으로 삼아 **빌드 페이지 라우트 35개 ↔ 레지스트리 35개 1:1 정합**을 완료했다.

---

## 2. 빌드 라우트 전수 목록 (Route(app) 표 = 71 엔트리)

| 분류 | 개수 | 비고 |
|------|------|------|
| **페이지 라우트** | **35** | 레지스트리(R-001~R-035) 추적 대상 |
| API 라우트 (`/api/*`) | 31 | 레지스트리 비등록 — 페이지 '동반 파일' 컬럼에서 추적 |
| 특수 (route handler/메타) | 4 | `/auth/callback`, `/feed.xml`, `/robots.txt`, `/sitemap.xml` |
| 내부 | 1 | `/_not-found` |
| **합계** | **71** | 빌드 Route(app) 표 행 |

> ⚠️ 지휘부 배경의 "54 라우트"는 빌드의 **정적 프리렌더 카운터(54/54)**였다. 실제 Route(app) 표는 71 엔트리를 출력하며, 그중 레지스트리 대상인 **페이지 라우트는 35개**다. 본 정합은 페이지 라우트 기준 1:1로 수행했다(기존 레지스트리 관례 = 페이지 전용, API는 동반 파일 컬럼).

**페이지 라우트 35 (빌드 표시):**
`/`(○), `/admin`(○), `/admin/blog`(○), `/admin/blog/edit/[id]`(ƒ), `/admin/blog/new`(○), `/admin/board`(○), `/analysis`(○), `/analysis/[symbol]`(ƒ), `/analysis/stock`(○), `/analysis/stock/[symbol]`(ƒ), `/auth/auth-code-error`(○), `/auth/login`(○), `/blog`(○), `/blog/[slug]`(ƒ), `/blog/category/[category]`(ƒ), `/blog/tag/[tag]`(ƒ), `/board/[slug]`(ƒ), `/board/[slug]/[postId]`(ƒ), `/board/[slug]/write`(ƒ), `/calendar`(○), `/coin/[symbol]`(● SSG: btc/eth/xrp/sol/altcoin/kimp 6종), `/contact`(○), `/history`(○), `/market`(○), `/news`(ƒ), `/portfolio`(○), `/pricing`(○), `/privacy`(○), `/secure-memo`(○), `/settings`(○), `/signal`(○), `/stock`(○), `/stock-market`(○), `/terms`(○), `/watchlist`(○)

---

## 3. 추가한 R-### 행 (미등록이었던 5건)

| ID | 경로 | 유형 | 인증 | 진입점 | 동반 파일 |
|----|------|------|------|--------|----------|
| R-031 | /admin/board | dashboard | 예(미들웨어 `/admin` + 이메일 게이트) | /admin 링크 `app/admin/page.tsx:219` | API(/api/admin/board) |
| R-032 | /board/[slug] | list | 아니오(익명 열람) | GNB 1차(자유게시판·시세토론·정보공유), Footer 커뮤니티 | API(/api/board/[slug]), meta |
| R-033 | /board/[slug]/write | form | 아니오(익명 작성: 게스트 닉/PW) | GNB 글쓰기 버튼(/board/free/write), 보드 글쓰기, 코인룸 히어로 | API(/api/board/[slug]) |
| R-034 | /board/[slug]/[postId] | detail | 아니오 | 보드 BoardRow, 이전/다음 | API(/api/board/[slug]/[postId], /api/community/comment, /api/community/like), meta |
| R-035 | /coin/[symbol] | detail | 아니오 | GNB 코인룸 드롭다운(6종) | meta(SSG generateStaticParams, dynamicParams=false) |

- 유효 board slug = `free`/`market`/`info` (그 외 `notFound()`).
- `/coin/[symbol]`은 `revalidate=300`(5분 ISR) + `dynamicParams=false`로 6종 고정 프리렌더.
- 인증 근거: `middleware.ts:69` `protectedPaths=['/portfolio','/settings','/watchlist','/secure-memo','/admin']` — `/admin/board`는 `/admin` prefix로 보호.

---

## 4. §8 연결성 카운트 변경 (before → after)

| 항목 | before | after |
|------|--------|-------|
| 최종 검증일 | 2026-02-20 | 2026-05-29 (build green) |
| 등록 라우트(페이지) | 23 | **35** (R-001~R-035) |
| 활성 라우트 | 19 | **31** (개발중 4 제외) |
| 빌드 라우트 총계 | (미기재) | **71 엔트리** (페이지35+API31+특수4+_not-found1, 프리렌더 54/54) |
| 🔵 Minor | 0 | **2** (/settings·/stock-market nav 진입점 소실) |

- 변경이력 표(§8 최근 이슈)에 R11-T01 행 4건 추가, §9 계약 변경 이력에 **버전 5** 행 추가.

---

## 5. `/blog` 고아 아님 확정 근거

- `components/footer-section.tsx:35`: `<Link href="/blog">공식글</Link>` (커뮤니티 그룹) — Footer 진입점 실재.
- 레지스트리 R-024 진입점을 stale한 "GNB(정보>블로그)"(v2.0 GNB에 '정보' 그룹·/blog 없음) → **"Footer(커뮤니티>공식글) — footer-section.tsx:35 (고아 아님)"** 으로 정합.

---

## 6. Footer 레지스트리 실코드 대조 결과

- **§5 FooterSection 사용처 "6페이지 공용" 표기 = 정확**. grep 검증: `app/page.tsx`, `app/board/[slug]/page.tsx`, `app/board/[slug]/write/page.tsx`, `app/board/[slug]/[postId]/page.tsx`, `app/coin/[symbol]/page.tsx`, `app/news/page.tsx` — 6개 일치. **변경 불필요**.
- **§3-3 Footer 표 = stale → 정합**. 기존 '플랫폼 그룹(/market·/portfolio·/signal·/history)'은 코드에 없음. 실코드는 **커뮤니티 그룹 5**(/board/free·/board/market·/board/info·/news·/blog) + **정보 그룹 3**(/terms·/privacy·/contact) + 브랜드/소셜. 표를 8행으로 갱신.

---

## 7. 부수 발견 (코드 미수정, 기록만)

- **v2.0 GNB 피벗 부작용 — nav 진입점 소실 2건**:
  - `/settings`(R-020): 구 'GNB 서비스>설정' 제거 → 현 GNB(도구 8종)·Footer 어디에도 없음. 직접 URL/미들웨어만 도달.
  - `/stock-market`(R-011): 구 'GNB 주식>주식시장분위기' 제거 → 링크 없음(grep: app/components 전수 무매칭). 직접 URL만.
  - 두 페이지 모두 기능은 정상(빌드 ○), nav 도달성만 소실 → §8 🔵 Minor 등재. **후속 라운드에서 GNB/Footer 노출 여부 기획 판단 필요**.
- `/portfolio`(R-015)는 `components/AuthButton.tsx:63`에서 링크 → 고아 아님. 진입점을 "AuthButton(로그인 사용자 메뉴), 미들웨어"로 정합.
- 진입점 전수 정합: 구 GNB 그룹 라벨(코인>·주식>·정보>·서비스>)을 현 §3-1 실구조(1차/코인룸/도구)에 맞춰 R-004·R-008·R-009·R-010·R-012·R-013·R-014·R-016·R-021 등 갱신.

---

## 8. 검증

```
npm run build            # green (exit 0), Route(app) 71 엔트리 / 프리렌더 54/54
# 페이지 라우트 35 ↔ 레지스트리 R-001~R-035 = 1:1, 누락 0
# Select-String '^\| R-\d{3} \|' = 51 (§2 레지스트리 35 + §7 컴포넌트 매핑 16)
```

- 빌드 페이지 라우트 ↔ 레지스트리 누락 **0** ✅
- §8 카운트 실제 빌드 반영 ✅
- §8 이슈 이력 R11-T01 행 + §9 변경 이력 v5 행 추가 ✅

---

## 9. 무충돌 확인

- 본 터미널 변경 = `docs/references/_WEB_CONTRACT.md` 단독. 코드·타 docs 미수정.
- T02(코드 정리)·T03(리팩토링)·T04(기획) 산출물 미접촉. 임시 빌드 출력 파일(build-output-R11-T01.txt) 작업 후 삭제.
