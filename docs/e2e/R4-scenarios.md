# R4 E2E 시나리오 — 커뮤니티 (board/news/coin SSR + 추천·비추·댓글·관리자공지)

> 작성: 2026-05-25 / R4 (community-wiring) / T04
> 갱신: 2026-05-25 / R5-#1 (지휘자 세션 30) — DB 적용 후 풀 검증 + L-B3/L-B4 spec 신뢰성 개선
> 프레임워크: **@playwright/test** (R4 신규 도입 — devDependency)
> 최종 실행: 2026-05-25 (R5) — **29 passed / 1 skipped(AD1) / 0 failed** (chromium, dev 서버 + `E2E_DB_READY=1`)
> 직전(R4): 24 passed / 6 skipped / 0 failed (DB 미적용 시점)

## 1. 개요

R3에서 SSR 전환된 board(`ƒ`)·news(`ƒ`)·coin(`● SSG+ISR 6종`)과 R4/T02에서 결선된
게시글 비추(dislikeCount 분리집계)·댓글 추천(PATCH) 흐름을 E2E로 고정한다.

운영 DB 상태(2026-05-25 R5): **커뮤니티 마이그레이션 5종 적용 완료 + 게시글 156행 시드**
(세션 29 Management API 적용, 런북 `docs/db/R4-db-apply-runbook.md` §8). 따라서 `E2E_DB_READY=1`로
추천·비추·댓글 시나리오(L-B1~L-B4·N-B3)를 **실 DB 기반으로 풀 검증**한다.
- **L-B3/L-B4 spec 개선(R5-#1)**: 시드는 게시글만 넣고 댓글은 없어 R4에서 L-B4가 추천 대상 부재로
  실패(앱 버그 아님, spec 신뢰성 이슈). R5에서 **각 테스트가 추천 대상 댓글을 자체 생성**하고
  POST 201·PATCH 응답을 `waitForResponse`로 확정하도록 수정 → L-B3/L-B4 독립·결정적 통과.
  E2E가 생성한 댓글(content `E2E ` prefix)은 실행 후 정리(자동 정리 로직은 spec 외부 — 본 라운드는
  Management API로 일괄 삭제, comment_likes는 CASCADE).
- **AD1(관리자 토글)만 잔여 skip**: 관리자 인증 storageState(로그인 세션 캡처) 미구성 — R5 후속.

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
| N-B3 | 목록 글 클릭 → 상세 진입 | ✅ 통과 | 시드 156행 적용 |

### B. 게시글 추천/비추 (DB 의존) — `e2e/community-board.spec.ts`
| ID | 시나리오 | 상태 | 비고 |
|----|---------|------|------|
| L-B1 | 추천 클릭 → likeCount 증가 | ✅ 통과 | RPC `community_toggle_post_like` 적용 |
| L-B2 | 비추 클릭 → dislikeCount **실값** 표시(T02 분리집계, 가짜 0/1 아님) | ✅ 통과 | 분리집계 응답 반영 |

### C. 댓글 (DB 의존) — `e2e/community-board.spec.ts`
| ID | 시나리오 | 상태 | 비고 |
|----|---------|------|------|
| L-B3 | 댓글 작성(익명 닉/비번) → 저장 확정(201) + 목록 반영 | ✅ 통과 | POST 201 `waitForResponse` 확정 |
| L-B4 | 댓글 ThumbsUp → likeCount 증가 + 추천순 정렬 | ✅ 통과 | 추천 대상 댓글 자체 생성(R5-#1) |

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
| AD1 | 관리자 is_notice 토글 → 목록 상단 공지 노출 | ⬜ 스킵 | 관리자 인증 storageState 미구성 (R5 후속) |

## 5. 커버리지

| 카테고리 | 작성 | 통과 | 스킵 | 실패 |
|---------|------|------|------|------|
| 게시판 SSR/내비 (P0) | 9 | 9 | 0 | 0 |
| 추천/비추 (P0, DB) | 2 | 2 | 0 | 0 |
| 댓글 (P0, DB) | 2 | 2 | 0 | 0 |
| 뉴스 SSR/필터 (P0) | 5 | 5 | 0 | 0 |
| 코인룸 SSG/탭 (P0) | 10 | 10 | 0 | 0 |
| 관리자 공지 (P1) | 2 | 1 | 1 | 0 |
| **합계** | **30** | **29** | **1** | **0** |

> R4(DB 미적용): 24 통과 / 6 스킵 → R5(DB 적용 + spec 개선): **29 통과 / 1 스킵(AD1)**.

## 6. DB 적용 현황 + 잔여(AD1)

✅ **R5-#1 완료**: 마이그레이션 5종 + 게시글 156행 시드 적용 상태에서 `E2E_DB_READY=1` 풀 실행 →
N-B3·L-B1·L-B2·L-B3·L-B4 **5건 활성·통과**. L-B3/L-B4는 추천 대상 댓글을 자체 생성하도록 개선해
시드 댓글 부재와 무관하게 결정적으로 통과한다.

⬜ **AD1만 잔여**: 관리자 `is_notice` 토글은 **관리자 storageState**(로그인 세션 캡처)가 필요하다.
`e2e/auth.setup.ts` + `playwright.config` projects 분리 + 관리자 계정 자격 구성이 선행돼야 활성화
가능 — **R5 후속**(자격증명 부재로 본 라운드 미구현).
