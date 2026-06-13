# R-B 설계: 커뮤니티 인터랙션 완성 + 코인룸 시그널 실데이터화

> 작성: 2026-06-14 · 출처: 기능 완성도 점검 연구(`docs/handover/2026-06-13-functional-completeness-audit.md`) R-B
> 선행: R-A 보안 핫픽스(admin 인증 가드, `lib/supabase/admin-guard.ts` `requireAdmin()`) 완료

## 0. 목적과 범위

기능 완성도 점검에서 P1로 식별된 커뮤니티 인터랙션 미연결 + 코인룸 AI 시그널 하드코딩을 해소한다. 5개 기능을 한 라운드로 묶되, 구현은 검증 가능한 phase 단위로 진행한다.

**범위(전부 포함 — 사용자 확정)**:
1. 답글(대댓글) — 백엔드 완비, 프론트 결선
2. 게시글 수정 — 백엔드 완비(PATCH), edit 라우트 신설
3. 스크랩 — 회원전용, 신규 테이블 + 목록 페이지
4. 신고 — 회원+익명 접수, 신규 테이블 + 관리자 검토 목록
5. 코인룸 AI 시그널 — `lib/analysis` 재사용 실데이터화

**비범위(YAGNI)**: 무한 대댓글 중첩(1depth만), 익명 스크랩, 신고 자동 숨김/차단(접수+수동검토만), 스크랩 폴더/태그.

## 1. 현황(실현가능성 검증 완료)

| 기능 | 백엔드 상태 | 근거 |
|------|------------|------|
| 답글 | ✅ `POST /api/community/comment`가 `parentId` 수신·검증·INSERT | comment/route.ts:16,32,37,58 |
| 게시글 수정 | ✅ `PATCH /api/board/[slug]/[postId]` (title/content/category/tags/coinSymbol + 권한검증) | [postId]/route.ts:117-169 |
| 댓글 스키마 | ✅ `community_comments.parent_id` self-FK(ON DELETE CASCADE) | _SCHEMA §community_comments |
| 스크랩/신고 | ❌ 전용 테이블 없음 → 신규 마이그레이션 필요 | 마이그레이션 목록에 부재 |
| 코인룸 | 서버 컴포넌트, `fetchCoinRoomData`(anon Supabase, 5분 ISR, SSG 프리렌더) | coin/[symbol]/page.tsx:1-32 |

기존 dedup 템플릿: `community_post_likes`(id/post_id/user_id/ip_hash/value + UNIQUE 부분인덱스 2종 + CHECK `user_id OR ip_hash`). 스크랩/신고가 이 패턴을 차용한다.

## 2. DB 스키마

신규 마이그레이션 1파일: `supabase/migrations/20260614000001_create_scraps_reports.sql` (멱등 — `CREATE TABLE IF NOT EXISTS`, `CREATE POLICY` 전 `DROP POLICY IF EXISTS`).

### 2.1 community_post_scraps (회원전용)

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|---|---|---|---|---|
| `id` | UUID | N (PK) | `gen_random_uuid()` | |
| `user_id` | UUID | N (FK→auth.users, ON DELETE CASCADE) | - | 회원 |
| `post_id` | UUID | N (FK→community_posts, ON DELETE CASCADE) | - | |
| `created_at` | TIMESTAMPTZ | N | `now()` | |

- **UNIQUE**: `(user_id, post_id)` — 중복 스크랩 방지(토글의 기준)
- **인덱스**: `(user_id, created_at DESC)` — 내 스크랩 목록 정렬
- **RLS**: SELECT/INSERT/DELETE 모두 `user_id = auth.uid()` (본인만). 익명 없음.

### 2.2 community_reports (회원+익명)

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|---|---|---|---|---|
| `id` | UUID | N (PK) | `gen_random_uuid()` | |
| `target_type` | TEXT | N | - | CHECK in (`'post'`,`'comment'`) |
| `target_id` | UUID | N | - | 게시글/댓글 id (다형성 — FK 미설정, type+id로 식별) |
| `reason` | TEXT | N | - | CHECK in (`'spam'`,`'abuse'`,`'sexual'`,`'fraud'`,`'etc'`) |
| `detail` | TEXT | Y | - | 상세 사유 ≤500자 (CHECK 길이) |
| `reporter_user_id` | UUID | Y (FK→auth.users, ON DELETE SET NULL) | - | 회원 신고자 |
| `reporter_ip_hash` | TEXT | Y | - | 익명 dedup sha256(전체 IP) |
| `status` | TEXT | N | `'pending'` | CHECK in (`'pending'`,`'reviewed'`,`'dismissed'`) |
| `created_at` | TIMESTAMPTZ | N | `now()` | |

- **UNIQUE 부분인덱스**(동일 대상 중복신고 방지):
  - `(target_type, target_id, reporter_user_id) WHERE reporter_user_id IS NOT NULL`
  - `(target_type, target_id, reporter_ip_hash) WHERE reporter_ip_hash IS NOT NULL`
- **CHECK**: `reporter_user_id IS NOT NULL OR reporter_ip_hash IS NOT NULL`
- **인덱스**: `(status, created_at DESC)` — 관리자 목록(미처리 우선)
- **RLS**: SELECT/UPDATE/DELETE `service_role`만(신고는 비공개), INSERT 허용(CHECK가 무결성 강제). → 쓰기/조회 모두 API가 `createAdminClient`로 처리.

### 2.3 운영 DB 적용

운영 DB(`enksnhshciyvllwfiwrm`)에 Management API `database/query`로 직접 적용(이전 세션 패턴: UTF-8 바이트 전송으로 한글 주석 보존) → 테이블/RLS 검증 → `NOTIFY pgrst, 'reload schema'` → `schema_migrations` backfill(`20260614000001`).

## 3. API

### 3.1 신규

| 라우트 | 메서드 | 동작 | 인증 |
|--------|--------|------|------|
| `/api/community/scrap` | POST | 토글: `(user_id, post_id)` 있으면 DELETE, 없으면 INSERT. 응답 `{scrapped:boolean}` | 회원전용(401) |
| `/api/community/scrap` | GET | 내 스크랩 목록(community_posts 조인, 최신순). 응답 `{posts:[...]}` | 회원전용 |
| `/api/community/report` | POST | 접수. body `{targetType, targetId, reason, detail?}`. 회원=`reporter_user_id`/익명=`x-client-ip-hash`. dedup UNIQUE 위반 시 409 "이미 신고함" | 회원/익명 |
| `/api/admin/reports` | GET | 신고 목록(status 필터, 최신순) + 대상 미리보기 | `requireAdmin()` |
| `/api/admin/reports` | PATCH | 상태 변경 `{reportId, status}` | `requireAdmin()` |

- 입력 검증: UUID 정규식(기존 `isUuid` 패턴), reason/status enum 화이트리스트, detail 길이.
- `community/report`·`admin/reports`는 `createAdminClient`(RLS service_role) 경유. `community/scrap`은 사용자 세션(`createClient` server) 기반 — RLS가 본인만 강제하므로 anon/auth 클라로 충분(단 일관성 위해 user 컨텍스트 사용).
- 신고 시 `x-client-ip-hash` 헤더는 middleware가 주입(기존 like 패턴 재사용).

### 3.2 기존 재사용 (변경 없음)

- 답글: `POST /api/community/comment` (parentId) — 그대로.
- 게시글 수정: `PATCH /api/board/[slug]/[postId]` — 그대로.

## 4. 프론트 결선

### 4.1 답글 (대댓글) — `components/community/CommentSection.tsx`

- "답글" 버튼 클릭 → 해당 댓글 하단에 인라인 답글 폼 토글(`replyingTo: commentId` 상태). 폼은 기존 댓글 작성 폼 재사용(회원/익명 분기 동일).
- 제출: `POST /api/community/comment` with `parentId`. 성공 시 목록 갱신.
- 렌더: 평면 댓글 배열을 `parent_id`로 그룹핑 → 부모 아래 자식 **1depth 들여쓰기**. 자식의 자식(2depth+)도 같은 부모 그룹에 1depth로 표시(중첩 깊이 제한).
- 댓글 "신고" 버튼(아래 4.4)도 이 컴포넌트에서 결선.

### 4.2 게시글 수정 — 신규 라우트 `/board/[slug]/[postId]/edit`

- write 페이지(`app/board/[slug]/write/page.tsx`)의 폼을 공용 컴포넌트로 추출하거나, edit 페이지에서 동일 폼 구조 + 초기값 prefill(GET으로 기존 글 로드).
- 회원 본인: 바로 폼. 익명: 비밀번호 입력 게이트(PATCH에 `guestPassword` 전달).
- 제출: `PATCH /api/board/[slug]/[postId]` → 성공 시 상세로 이동.
- `PostActions.tsx` "수정" 버튼 → edit 라우트 이동.

### 4.3 스크랩 버튼 — `components/community/PostVoteButtons.tsx`

- 스크랩 버튼 토글: `POST /api/community/scrap`. 비회원 클릭 시 로그인 유도(`/auth/login`).
- 초기 스크랩 상태는 상세 로드 시 함께 전달(서버에서 회원이면 `community_post_scraps` 조회 → `initialScrapped`).

### 4.4 신고 버튼 — PostVoteButtons(게시글) + CommentSection(댓글)

- "신고" 버튼 → 사유 선택 모달(`ReportModal` 신규): reason 라디오(5종) + detail textarea(선택) → `POST /api/community/report`.
- 결과 토스트/알림: 성공/이미신고(409) 구분.

## 5. 신규 페이지

### 5.1 `/scraps` — 내 스크랩 목록

- 회원전용. 미로그인 → 로그인 유도. `GET /api/community/scrap` → 게시글 카드 목록(기존 BoardRow 재사용). 빈 상태 처리.

### 5.2 `/admin/reports` — 신고 검토

- `requireAdmin` 게이트(서버). `GET /api/admin/reports`로 목록(status 탭) → 각 행에 대상 링크 + 상태 변경 버튼(`PATCH`).

## 6. 코인룸 AI 시그널 실데이터화

- `lib/community/coin-server.ts` `fetchCoinRoomData`에 분석 블록 추가:
  - 단일 심볼 코인(btc/eth/xrp/sol): `market_prices`(또는 crypto SSOT)에서 캔들 조회 → `lib/analysis` 엔진(`generateSignals` + `calculateProbability`/`performAnalysis`) 직접 호출 → `{ signal: '매수'|'매도'|'중립', confidence: number, marketState: string }`.
  - **self-fetch 회피**: `/api/analysis` HTTP 호출 대신 lib 함수 직접 사용(서버 컴포넌트 + SSG/ISR 컨텍스트).
  - **altcoin/kimp 집계형**: 단일 심볼 분석 불가 → 시그널 블록 미표시 or 정적 안내(기존 `buildCoinView` 폴백 패턴 유지).
  - 데이터 부족(캔들 < 최소봉): "분석 데이터 부족" graceful 표시.
- `app/coin/[symbol]/page.tsx` L165-188 placeholder → props 기반 실데이터 표시. "상세 분석 보기" 링크는 유지.

## 7. 레퍼런스 갱신

- `_SCHEMA_REFERENCE.md`: community_post_scraps, community_reports 2테이블 + RLS/인덱스
- `_API_REFERENCE.md`: scrap/report/admin-reports 라우트
- `_WEB_CONTRACT.md`: `/scraps`, `/board/[slug]/[postId]/edit`, `/admin/reports` 라우트 등록 + 카운트
- `_COMPONENT_MAP.md`: ReportModal 등 신규 컴포넌트

## 8. 구현 순서 (phase)

검증 가능한 단위로 분할. 각 phase 끝에 tsc/eslint 확인, 마지막에 build.

1. **DB**: 마이그레이션 작성 + 운영 DB 적용 + schema_migrations backfill
2. **API**: scrap(POST/GET) + report(POST) + admin/reports(GET/PATCH)
3. **프론트 결선**: 답글 + 게시글 수정(edit 라우트) + 스크랩 버튼 + 신고 모달
4. **신규 페이지**: /scraps + /admin/reports
5. **코인룸 시그널**: coin-server 분석 + page 결선
6. **검증 + 레퍼런스**: build + 레퍼런스 4종 갱신

## 9. 검증 전략

- 정적: tsc 0, eslint 0, build 0(라우트 컴파일 — `/scraps`·`/admin/reports`·`edit` 등장 확인).
- 런타임: 401/403/409 응답 및 정상 토글은 **운영 자격증명 필요로 본 세션 미검증** 가능성 명시. 가능하면 DB 라운드트립 스모크(service_role) 또는 Playmemo 자동화는 후속.
- 신규 SSOT 모듈(scrap/report 쿼리)이 생길 경우 eslint `no-restricted-imports` 화이트리스트 영향 확인(R-A에서 admin-guard 추가한 선례).

## 10. 위험 및 주의

- **운영 DB 작업**: 신규 2테이블을 운영 DB에 적용. 멱등 마이그레이션 + 트랜잭션 + 적용 후 검증으로 위험 최소화. 양평 cron과 무관(DB는 Supabase).
- **스크랩 초기 상태 N+1**: 게시판 목록에서 글별 스크랩 여부 조회는 회원 1회 IN 쿼리로 일괄(목록은 우선 상세에서만 표시, 목록 배지는 YAGNI 후속).
- **신고 다형성 무결성**: target_id에 FK가 없어 대상 삭제 후 dangling 가능 → 관리자 목록에서 대상 조회 실패 시 "삭제된 콘텐츠" graceful.
- **대댓글 1depth 그룹핑**: 기존 평면 댓글과 호환. 정렬은 부모 created_at asc, 자식 created_at asc.
