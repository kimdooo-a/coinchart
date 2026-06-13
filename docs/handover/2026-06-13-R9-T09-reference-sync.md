# R9 / T09 — 코드↔레퍼런스 정합 갱신 (인수인계)

> 라운드 **R9 (gap-verify)** · 역할 **T09 / 10**
> 작성일 2026-06-13 · 프로젝트 루트 `G:\11_dev\260601 코인 차트분석`
> SOT: `docs/orchestration/2026-06-13-R9-gap-verify/T09-reference-sync.md`

## 1. 요약

R1~R8 누적 변경분과 `docs/references/` 레퍼런스 간 드리프트를 실제 코드를 SSOT로 삼아 메웠다. 쓰기 천장(`docs/references/` 3종) 준수, 코드·`current.md` 미변경.

- 실제 `app/api/**/route.ts` **31개** ↔ `_API_REFERENCE.md` 등재 **누락·과잉 0건**
- 실제 `components/community/*` **15개 + widgets 5개** ↔ `_COMPONENT_MAP.md` "Community" 섹션 **누락 0건**
- T03 신규 RPC `community_toggle_comment_like` 시그니처/의존 `_SCHEMA_REFERENCE.md` 반영 완료
- T04 에러 핸들링 상태코드 매핑(news 503 / stock-quote 404·503 / board PATCH·DELETE 403) `_API_REFERENCE.md` 반영 완료

## 2. 갱신 파일 · 항목 표

| 파일 | 갱신 항목 | 근거(SSOT) |
|------|-----------|------------|
| `_API_REFERENCE.md` | 개요 총 개수 `29→31` + 분류 재집계, 최종 업데이트 `2026-03-08→2026-06-13` | `find app/api -name route.ts` (31) |
| `_API_REFERENCE.md` | `/api/news` 에러: DB 오류 시 `503 { items:[], error }`(이전 200 은폐) | `app/api/news/route.ts:78-82` + T04 §3 4-A |
| `_API_REFERENCE.md` | `/api/stock/quote` 에러: 심볼없음 `404`, API다운/업스트림5xx/catch `503`(이전 400·500) | `app/api/stock/quote/route.ts:28-60` + T04 §3 4-C |
| `_API_REFERENCE.md` | `/api/board/[slug]/[postId]` PATCH·DELETE 최종 update: RLS(`PGRST301`)·권한부족(`42501`) `403 {error:"권한이 없습니다"}`(이전 500) | T04 §3 4-D (`mapUpdateError()`) |
| `_API_REFERENCE.md` | `/api/fng` 에러주석: 라이브러리 JSON 파싱 실패 throw → catch 흡수해 `502`(상태코드 불변) | `app/api/fng/route.ts:11-16` + T04 §3 4-B |
| `_COMPONENT_MAP.md` | 최종 업데이트 `2026-03-08→2026-06-13` | — |
| `_COMPONENT_MAP.md` | "Community" 섹션 신규(15개 + widgets 5개): 사용 페이지·lib·컴포넌트 의존 기재 | `components/community/*` import grep |
| `_COMPONENT_MAP.md` | R8 삭제 3종(about-section/dashboard-grid/LanguageSwitcher) 부재 재확인(이미 반영, 추가 안 함) | `ls` 결과 부재 확인 |
| `_SCHEMA_REFERENCE.md` | `community_toggle_comment_like` RPC 신규 항목(`community_comment_likes` 섹션 내, 카운터 주석 보정 포함) | `supabase/migrations/20260613000001_create_comment_likes_rpc.sql` + T03 §2 |

## 3. 검증 결과 (읽기 명령 자가 검증)

| # | 항목 | 결과 |
|---|------|------|
| 1 | API diff: 실제 31 route.ts ↔ `_API_REFERENCE.md` | **누락 0** (스크립트 `for r in $(find ...)` grep, MISSING 0건) |
| 2 | 개요 정합 | 총 31개 명기, 최종 업데이트 `2026-06-13` |
| 3 | 컴포넌트 diff: `components/community/` 15 + widgets 5 ↔ `_COMPONENT_MAP.md` | **누락 0** (MISSING 0건) |
| 4 | R8 삭제 3종 부재 | `ls` → No such file (3종 모두 부재 확인) |
| 5 | 신규 엔드포인트 HTTP 메서드 표기 | board/community/admin-board/coins/fng 전부 GET/POST/PATCH/DELETE 명기(기존 등재분 유지) |
| 6 | 스키마 RPC 시그니처 | 마이그 실제 `RETURNS TABLE(liked BOOLEAN, like_count BIGINT, dislike_count BIGINT)`와 일치, 의존(`20260524000001` 테이블/트리거/인덱스) 명기 |
| 7 | 쓰기 천장 | `git status` 상 T09 변경은 `docs/references/` 3종 한정. 코드·`current.md` 미변경(타 modified는 형제 태스크 T01~T10 산출) |

## 4. pending / 미반영 (없음 + 비고)

- **T03·T04 모두 완료 상태로 회수** → pending 없음. 두 handover의 매핑표/시그니처를 전량 반영.
- **비고(범위 외, 손대지 않음)**: `_SCHEMA_REFERENCE.md` 기존 라인의 마이그 파일명 표기가 축약형(`20260524_post_likes_rpc.sql`, `20260524_comment_likes.sql`)이나 실제 파일은 `20260524000002_*`·`20260524000001_*`. T09 신규 추가분은 정식 풀네임 사용. 기존 축약 표기 정정은 본 태스크 천장 밖 항목이라 후속 권고로 분리.

## 5. 다음 라운드 후속 권고

1. (선택) `_SCHEMA_REFERENCE.md` 기존 post_likes/comment_likes 마이그 파일명 축약 표기를 풀네임(`20260524000001_*`/`20260524000002_*`)으로 정정.
2. (T03 §4 연계) `app/api/community/like/route.ts`의 인라인 `ToggleLikeRow`를 `types/community.ts` import로 치환 시 `_TYPE_REFERENCE.md` 동반 갱신 필요.
3. 댓글 비추 수 노출(`dislikeCount`) 확장 시 `/api/community/comment` PATCH 응답 계약 + 본 레퍼런스 동반 갱신.

---

**지휘자 보고**: `R9-T09 완료 — 레퍼런스 3종(_API/_COMPONENT/_SCHEMA) 정합 갱신, API diff 0·컴포넌트 diff 0, T03/T04 전량 반영, handover 작성`
