# R3 Dispatch Checkpoint — community-finish

> SOT 파일. 지휘자(CEO)가 갱신. 재개 시 P1 컨텍스트로 적재.

## 라운드 메타

| 항목 | 값 |
|---|---|
| 라운드 | R3 |
| 시작일 | 2026-05-24 |
| 태그 | community-finish |
| 터미널 수 | 12 (평면) |
| 발사 방식 | Wave 1 동시 9개 → Wave 2 (T01 후) 3개 → Wave 3 (T02~T04 후) 1개 |
| 상태 | **round-3-committed** — 12/12 verified. 통합커밋 `30cdbd5`(79 files, +5953/−2102). SOT 갱신완료. 후속: 실 DB push + UI wiring(R4) |
| 선행 | R2 5/5 완료(`81b9624`), R1 15/15 완료(`60d4298`) |

## 일꾼 진행 상태 (3차 회수 검증 — 2026-05-25)

| ID | 작업 | 상태 | handover | 검증 |
|---|---|---|---|---|
| T01 | meta-ssot | ✅ **verified** | ✅ | board-meta.ts·news-meta.ts 신규 + mock re-export(하위호환). tsc 0·build PASS. **Wave2 선행 충족** |
| T02 | board-ssr | ✅ **verified** | ✅ | board 목록·상세 SSR + generateMetadata(React cache 조회수중복방지) + board-server.ts + 클라컴포넌트 4종. mock import 0. ⚠️seed-community.ts MOCK_POSTS 잔존(T05 처리대상 명시). T07/T08 경계 자진인계. ƒ 렌더 |
| T03 | news-ssr | ✅ **verified** | ✅ | /news SSR 전환 + news-server.ts·NewsFilters.tsx 신규 + 4차원 searchParams + generateMetadata. mock import 0. ⚠️설계상 `/api/news` 대신 직접 Supabase 쿼리(근거 명시·sentiment/sort 미지원 회피) |
| T04 | coin-ssr | ✅ **verified** | ✅ | coin룸 6종 SSR + generateStaticParams(● SSG+ISR 6종 프리렌더) + coin-server.ts + CoinRoomTabs. altcoin/kimp 폴백 보존. coin mock import 이미 0(R2/T03)이라 재확인·고착 |
| T05 | mock-purge | ✅ **verified** | ✅ | mock-coins/posts/news.ts 3종 삭제 + 시드데이터 `scripts/fixtures/community-posts.ts` 이관(unused 함수 드롭) + BoardSidebar 주석정리. 전역 mock import 0. tsc/build PASS. ⚠️board-meta/news-meta stale 주석(T05 §6, 지휘자 1줄 정정 권장) |
| T06 | admin-board-route | ✅ **verified** | ✅ | admin/board route+UI 신규. ⚠️격리 2건(아래) |
| T07 | post-dislike-rpc | ✅ **verified** | ✅ | post_likes 분리집계+토글 RPC + dedup 정책문서 + dislikeCount(하위호환). likeCount 의미변경(순합산→추천수) |
| T08 | comment-likes | ✅ **verified** | ✅ | comment_likes 신규 DDL + comment PATCH 토글. UI 가이드 인계 |
| T09 | lightify-analysis-stock | ✅ **verified** | ✅ | analysis 계열은 R1/T10·T11에서 이미 라이트화 완료 → stock 1줄(text-gray-500→muted-foreground)만 교체, diff 1/1. 의미컬러 6건 보존. ⚠️터미널이 R3-T10으로 발사됐으나 handover 부재 판정 후 T09 수행(자진보고) |
| T10 | lightify-admin | ✅ **verified** | ✅ | admin page+blog 4파일 라이트화, 다크 0(보존 text-white 6건). diff 대칭 |
| T11 | lightify-account-util | ✅ **verified** | ✅ | 8파일 라이트화, diff 71/71 대칭, 보안/시세 의미컬러 보존 |
| T12 | lightify-static-auth | ✅ **verified** | ✅ | 7파일 라이트화, diff 47/47 대칭, 인증에러/CTA 보존 |

## 통합 검증 (3차 — 11/12 완료분)

- `npx tsc --noEmit` → **0 error** ✅
- `npm run build` → **✓ Compiled successfully** ✅
  - `/board/[slug]`·`[postId]`·`write` → **ƒ** (Dynamic SSR)
  - `/coin/[symbol]` → **●** (SSG+ISR, btc/eth/xrp/sol/altcoin/kimp 6종 프리렌더)
  - `/news` → **ƒ** (Dynamic SSR)
- 완료율: **11 / 12 verified (91.7%)** · 자가검증 PASS율: **11/11 (100%)**
- 잔여: **T05(mock-purge) 발사 대기** — 선행 전부 충족, 실제 차단점 거의 해소(seed만 처리)

## 격리 위반 (2건 — 둘 다 T06, additive·무충돌 → 허용 권고)

1. **T06 → `app/admin/page.tsx`**(T10 영역): "📌 공지 게시판 관리" 바로가기 섹션 1개 additive 추가. 양측 handover 자진 보고. T10 라이트화에 자연 흡수. **충돌 0** → 허용 (R2 BoardSidebar 선례).
2. **T06 → `docs/references/_API_REFERENCE.md`**(공통 SOT 읽기전용): admin/board 엔드포인트 3종 additive 추가. 규칙상 "SOT는 지휘자만" 위반이나 additive·무해. T07/T08은 SOT 미수정(컨덕터 반영 위임)이라 **일관성 위해 지휘자 통합 시 T07/T08분도 함께 반영** 필요.

## SOT 갱신 후속 (지휘자 통합 커밋 시 반영)

- `_API_REFERENCE.md`: T06(완료) + **T07 `POST /api/community/like` dislikeCount·likeCount 의미변경** + **T08 `PATCH /api/community/comment` 토글** 추가
- `_SCHEMA_REFERENCE.md`: **T08 `community_comment_likes` 테이블** 추가
- 실 DB 적용: `20260524_post_likes_rpc.sql`·`20260524_comment_likes.sql` (운영자 `supabase db push` 별도)

## 마커 상태

- `.dispatch/teams/R3-T01..R3-T12/workers/*.lock` — **전 마커 PID 바인딩 완료**(T01~T12)
- ⚠️ 터미널↔작업 매핑 불일치 관측: T09 터미널이 R3-T10 마커로 발사됨(handover 부재 기준 자동 분기). T04 마커(pid=81664)는 바인딩됐으나 coin SSR 미착수 — 터미널이 다른 작업 수행했거나 스톨 가능성
- R1·R2 마커는 `.dispatch/archive/`

## 다음 액션 (Phase 5)

- [x] T01~T12 회수·검증 완료 (12/12)
- [x] `_SUMMARY.md` 통합 보고서 작성
- [x] SOT 갱신: `_API_REFERENCE.md`(T07 like dislikeCount·T08 comment PATCH), `_SCHEMA_REFERENCE.md`(community_comment_likes·RPC·트리거·RLS), board-meta/news-meta stale 주석 정정
- [x] **통합 커밋 `30cdbd5`** (main, 79 files)
- [ ] R3 마커 `.dispatch/archive/`로 이동 (라운드 종료 정리)
- [ ] 운영자: `supabase db push` — `20260524_post_likes_rpc.sql`·`20260524_comment_likes.sql`
- [ ] **R4 후보**: UI wiring 결선(비추 placeholder↔T07 RPC, 댓글추천 미연결↔T08 PATCH) + E2E(kdye2e) + dead code 정리(news-queries 클라 fetch)
