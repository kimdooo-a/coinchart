# R4 E2E 시나리오 — 커뮤니티 (board/news/coin SSR + 추천·비추·댓글·관리자공지)

> 작성: 2026-05-25 / R4 (community-wiring) / T04
> 프레임워크: **@playwright/test** (본 라운드 신규 도입 — devDependency)
> 최종 실행: 2026-05-25 — **24 passed / 6 skipped / 0 failed** (chromium, dev 서버)

## 1. 개요

R3에서 SSR 전환된 board(`ƒ`)·news(`ƒ`)·coin(`● SSG+ISR 6종`)과 R4/T02에서 결선된
게시글 비추(dislikeCount 분리집계)·댓글 추천(PATCH) 흐름을 E2E로 고정한다.

운영 DB 상태(2026-05-25): **R1 `community_*` 테이블 미적용**
(`scripts/smoke/community-like-smoke.ts` FAIL — `community_posts`/`community_comments`/
`community_comment_likes` 전부 PGRST205 부재). 따라서 SSR/내비/필터는 **graceful 빈 목록**으로
검증하고, 추천·비추·댓글·관리자 토글은 **skip + "DB push 후 재실행"** 처리한다(hard-fail 금지).

## 2. 실행 방법

```bash
# (최초 1회) Playwright + 브라우저
npm i -D @playwright/test
npx playwright install chromium

# 전체 실행 (dev 서버는 e2e/playwright.config.ts 의 webServer가 자동 구동/재사용)
npx playwright test --config=e2e/playwright.config.ts

# 특정 스위트만
npx playwright test --config=e2e/playwright.config.ts e2e/community-coin.spec.ts

# DB 의존 시나리오까지 실행 (db push + seed 적용 후)
#   docs/db/R4-db-apply-runbook.md 의 supabase db push + npx tsx scripts/seed-community.ts 선행
$env:E2E_DB_READY="1"; npx playwright test --config=e2e/playwright.config.ts   # PowerShell
E2E_DB_READY=1 npx playwright test --config=e2e/playwright.config.ts           # bash

# HTML 리포트
npx playwright show-report e2e/playwright-report
```

## 3. 환경 전제

| 항목 | 값 |
|------|-----|
| dev 서버 | `npm run dev` (http://localhost:3000) — config `webServer`가 자동 구동(reuseExistingServer) |
| env | `.env.local` 필요 (Supabase URL/anon/service_role — SSR·admin 인증 검증) |
| 브라우저 | chromium (headless, locale ko-KR) |
| 산출물 | `e2e/playwright-report/`, `e2e/test-results/` (e2e/.gitignore로 커밋 제외) |
| DB 토글 | `E2E_DB_READY=1` 이면 DB 의존 스위트 활성화 (기본 skip) |

## 4. 시나리오 현황 (30개)

### A. 게시판 SSR + 내비게이션 — `e2e/community-board.spec.ts`
| ID | 시나리오 | 상태 | 비고 |
|----|---------|------|------|
| S-B1 | `/board/{free,market,info}` 목록 SSR 렌더(h1·표헤더·글쓰기) | ✅ 통과 ×3 | graceful |
| N-B1 | 정렬 select → URL `?sort=views` 갱신 | ✅ 통과 | |
| N-B2 | 제목 검색 입력+Enter → URL `?search=` 갱신 | ✅ 통과 | |
| S-B2 | 글쓰기 링크 → 작성 페이지(h1 "새 게시글") 진입 | ✅ 통과 | |
| S-B3 | 잘못된 게시판 슬러그 → 404 | ✅ 통과 | |
| E-B1 | 존재하지 않는 게시글 → "게시글을 찾을 수 없습니다" 소프트 안내 | ✅ 통과 | 하드 404 아님 |
| N-B3 | 목록 글 클릭 → 상세 진입 | ⬜ 스킵 | 시드 없음(동적 skip) |

### B. 게시글 추천/비추 (DB 의존) — `e2e/community-board.spec.ts`
| ID | 시나리오 | 상태 | 비고 |
|----|---------|------|------|
| L-B1 | 추천 클릭 → likeCount 증가 | ⬜ 스킵 | RPC 미적용 |
| L-B2 | 비추 클릭 → dislikeCount **실값** 표시(T02 분리집계, 가짜 0/1 아님) | ⬜ 스킵 | RPC 미적용 |

### C. 댓글 (DB 의존) — `e2e/community-board.spec.ts`
| ID | 시나리오 | 상태 | 비고 |
|----|---------|------|------|
| L-B3 | 댓글 작성(익명 닉/비번) → 목록 반영 | ⬜ 스킵 | 테이블 미적용 |
| L-B4 | 댓글 ThumbsUp → likeCount 증가 + 추천순 정렬 | ⬜ 스킵 | comment_likes 미적용 |

### D. 뉴스 SSR + 4차원 필터 — `e2e/community-news.spec.ts`
| ID | 시나리오 | 상태 | 비고 |
|----|---------|------|------|
| S-N1 | `/news` 렌더(헤더·"뉴스 (N)"·필터 라벨 코인/분류/감정/정렬) | ✅ 통과 | |
| N-N1 | 감정 "🔴 호재" → URL `?sentiment=positive` | ✅ 통과 | |
| N-N2 | 정렬 "중요도순" → URL `?sort=importance` | ✅ 통과 | |
| N-N3 | 필터 조합 후 "필터 초기화" → `/news` 복귀 | ✅ 통과 | reset 링크 조건부 |
| S-N2 | 사이드바 위젯("📊 코인별 뉴스") 렌더 | ✅ 통과 | |

### E. 코인룸 SSG/ISR + 탭 — `e2e/community-coin.spec.ts`
| ID | 시나리오 | 상태 | 비고 |
|----|---------|------|------|
| S-C1 | `/coin/{btc,eth,xrp,sol,altcoin,kimp}` 렌더(탭리스트·핵심지표) | ✅ 통과 ×6 | |
| N-C1 | 탭 "📊 시세·분석" → 분석 안내 노출 | ✅ 통과 | |
| N-C2 | 탭 "📌 공지" → 공지 패널(빈 DB: 공지 없음) | ✅ 통과 | |
| N-C3 | 탭 "💬 토론" → aria-selected=true | ✅ 통과 | |
| S-C2 | 잘못된 코인 슬러그 → 404 (dynamicParams=false) | ✅ 통과 | |

### F. 관리자 공지 — `e2e/community-admin.spec.ts`
| ID | 시나리오 | 상태 | 비고 |
|----|---------|------|------|
| S-AD1 | 비로그인 `/admin/board` → `/auth/login` 보호 리다이렉트 | ✅ 통과 | 미들웨어 protectedPaths |
| AD1 | 관리자 is_notice 토글 → 목록 상단 공지 노출 | ⬜ 스킵 | 인증 storageState + DB 의존 |

## 5. 커버리지

| 카테고리 | 작성 | 통과 | 스킵 | 실패 |
|---------|------|------|------|------|
| 게시판 SSR/내비 (P0) | 9 | 8 | 1 | 0 |
| 추천/비추 (P0, DB) | 2 | 0 | 2 | 0 |
| 댓글 (P0, DB) | 2 | 0 | 2 | 0 |
| 뉴스 SSR/필터 (P0) | 5 | 5 | 0 | 0 |
| 코인룸 SSG/탭 (P0) | 10 | 10 | 0 | 0 |
| 관리자 공지 (P1) | 2 | 1 | 1 | 0 |
| **합계** | **30** | **24** | **6** | **0** |

## 6. DB/인증 적용 후 활성화

`docs/db/R4-db-apply-runbook.md` 의 `supabase db push`(마이그레이션 3종) +
`npx tsx scripts/seed-community.ts`(게시글 시드) 적용 후 `E2E_DB_READY=1` 로 재실행하면
6개 스킵 시나리오(N-B3·L-B1·L-B2·L-B3·L-B4·AD1)가 활성화된다.

- AD1(관리자 토글)은 추가로 **관리자 storageState**(로그인 세션 캡처)가 필요 → `e2e/auth.setup.ts`
  + `playwright.config` projects 분리가 R5 후보(미구현).
