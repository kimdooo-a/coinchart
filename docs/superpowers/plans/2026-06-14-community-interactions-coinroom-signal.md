# 커뮤니티 인터랙션 완성 + 코인룸 시그널 실데이터화 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 커뮤니티 게시글/댓글 인터랙션(답글·수정·스크랩·신고)을 완성하고 코인룸 AI 시그널을 실데이터화한다.

**Architecture:** 신규 DB 2테이블(`community_post_scraps`·`community_reports`, 기존 `community_post_likes` dedup 패턴 차용) + API 4종 + 프론트 결선(백엔드 완비분) + 신규 페이지 2종 + 코인룸 서버 분석. 인증은 R-A의 `requireAdmin()`/기존 세션 가드 재사용.

**Tech Stack:** Next.js 16(App Router), Supabase(Postgres/RLS), TypeScript strict, TipTap, Management API(운영 DB 적용).

**검증 컨벤션(프로젝트):** 단위 TDD가 아니라 `tsc --noEmit` 0 + `eslint` 0 + `npm run build` 0, DB는 `scripts/smoke/` service_role 라운드트립, 런타임은 e2e(자격증명 미주입 시 graceful skip). 각 task 끝에 해당 검증.

**스펙:** `docs/superpowers/specs/2026-06-14-community-interactions-coinroom-signal-design.md`

**커밋 주의:** R-A 보안 핫픽스(admin 가드 6파일)가 미커밋 상태다. Task 0에서 R-A를 먼저 단독 커밋해 R-B와 이력을 분리한다.

---

## 파일 구조 (생성/수정)

**생성:**
- `supabase/migrations/20260614000001_create_scraps_reports.sql` — 2테이블
- `app/api/community/scrap/route.ts` — 스크랩 토글/목록
- `app/api/community/report/route.ts` — 신고 접수
- `app/api/admin/reports/route.ts` — 관리자 신고 목록/상태변경
- `lib/community/scrap-queries.ts` — 스크랩 클라 fetch 래퍼
- `lib/community/report-client.ts` — 신고 클라 fetch 래퍼
- `components/community/ReportModal.tsx` — 신고 사유 모달
- `app/board/[slug]/[postId]/edit/page.tsx` — 게시글 수정
- `app/scraps/page.tsx` — 내 스크랩 목록
- `app/admin/reports/page.tsx` — 신고 검토
- `scripts/smoke/scrap-report-smoke.ts` — DB 라운드트립 스모크

**수정:**
- `components/community/CommentSection.tsx` — 답글 폼 + 댓글 신고
- `components/community/PostVoteButtons.tsx` — 스크랩/신고 버튼 결선
- `components/community/PostActions.tsx` — 수정 버튼 → edit 라우트
- `lib/community/coin-server.ts` — 코인룸 분석 블록
- `app/coin/[symbol]/page.tsx:165-188` — 시그널 placeholder → 실데이터
- `app/api/board/[slug]/[postId]/route.ts` — 상세 응답에 `scrapped` 추가(회원)
- 레퍼런스 4종 + `eslint.config.mjs`(신규 SSOT 화이트리스트 시)

---

## Task 0: R-A 보안 핫픽스 선 커밋

**Files:** (변경 없음 — 기존 스테이징/커밋만)

- [ ] **Step 1: R-A 변경분 확인**

Run: `git status -s`
Expected: `lib/supabase/admin-guard.ts`(신규), `app/api/admin/{users,news-crawl,market-data,cleanup-data,board}/route.ts`, `eslint.config.mjs`, `docs/handover/2026-06-13-functional-completeness-audit.md` 등

- [ ] **Step 2: R-A만 스테이징 후 커밋** (audit 문서·R-B 스펙/플랜은 별도)

```bash
git add lib/supabase/admin-guard.ts app/api/admin/users/route.ts app/api/admin/news-crawl/route.ts app/api/admin/market-data/route.ts app/api/admin/cleanup-data/route.ts app/api/admin/board/route.ts eslint.config.mjs
git commit -m "fix(security): admin API 인증 가드 일괄 추가 + 공통 requireAdmin 추출

- admin/users P0 해소(익명 회원 조회·삭제 차단)
- news-crawl·market-data 미인증 트리거 차단(market-data는 브라우저 클라→service_role 정상화)
- cleanup-data 하드코딩 이메일→공통 헬퍼 통일, board 로컬 requireAdmin→공통 추출
- eslint 화이트리스트에 admin-guard 추가

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 3: 연구/설계 문서 커밋**

```bash
git add docs/handover/2026-06-13-functional-completeness-audit.md docs/superpowers/specs/2026-06-14-community-interactions-coinroom-signal-design.md docs/superpowers/plans/2026-06-14-community-interactions-coinroom-signal.md
git commit -m "docs: 기능 완성도 점검 연구 + R-B 설계/구현 계획

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 1: DB 마이그레이션 파일 작성

**Files:**
- Create: `supabase/migrations/20260614000001_create_scraps_reports.sql`

- [ ] **Step 1: 마이그레이션 SQL 작성** (멱등 — IF NOT EXISTS / DROP POLICY IF EXISTS)

```sql
-- R-B 2026-06-14 — 스크랩(community_post_scraps) + 신고(community_reports)
-- 기존 community_post_likes dedup 패턴 차용(UNIQUE 부분인덱스 + CHECK).

-- 1. 스크랩 (회원전용)
CREATE TABLE IF NOT EXISTS community_post_scraps (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id    UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uniq_post_scraps_user_post UNIQUE (user_id, post_id)
);
CREATE INDEX IF NOT EXISTS idx_post_scraps_user_created
  ON community_post_scraps (user_id, created_at DESC);

ALTER TABLE community_post_scraps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS post_scraps_select_own ON community_post_scraps;
CREATE POLICY post_scraps_select_own ON community_post_scraps
  FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS post_scraps_insert_own ON community_post_scraps;
CREATE POLICY post_scraps_insert_own ON community_post_scraps
  FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS post_scraps_delete_own ON community_post_scraps;
CREATE POLICY post_scraps_delete_own ON community_post_scraps
  FOR DELETE USING (user_id = auth.uid());

-- 2. 신고 (회원+익명)
CREATE TABLE IF NOT EXISTS community_reports (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type      TEXT NOT NULL CHECK (target_type IN ('post','comment')),
  target_id        UUID NOT NULL,
  reason           TEXT NOT NULL CHECK (reason IN ('spam','abuse','sexual','fraud','etc')),
  detail           TEXT CHECK (detail IS NULL OR char_length(detail) <= 500),
  reporter_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reporter_ip_hash TEXT,
  status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewed','dismissed')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_reports_reporter CHECK (reporter_user_id IS NOT NULL OR reporter_ip_hash IS NOT NULL)
);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_reports_user
  ON community_reports (target_type, target_id, reporter_user_id)
  WHERE reporter_user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_reports_iphash
  ON community_reports (target_type, target_id, reporter_ip_hash)
  WHERE reporter_ip_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reports_status_created
  ON community_reports (status, created_at DESC);

ALTER TABLE community_reports ENABLE ROW LEVEL SECURITY;
-- INSERT만 공개(무결성은 CHECK가 강제), 조회·수정은 service_role(API)만.
DROP POLICY IF EXISTS reports_insert_any ON community_reports;
CREATE POLICY reports_insert_any ON community_reports
  FOR INSERT WITH CHECK (true);
-- service_role은 RLS 우회하므로 SELECT/UPDATE 정책 불필요(공개 정책 미부여 = anon/auth 차단).
```

- [ ] **Step 2: SQL 문법 자가 점검**

기존 마이그레이션(`20260524000001_comment_likes.sql`, `20260523000001_create_community_tables.sql`)과 패턴 대조: `gen_random_uuid()` 기본값, `ON DELETE CASCADE`, 부분 UNIQUE 인덱스, `ENABLE ROW LEVEL SECURITY`, `DROP POLICY IF EXISTS` 선행 일치 확인.

- [ ] **Step 3: 커밋**

```bash
git add supabase/migrations/20260614000001_create_scraps_reports.sql
git commit -m "feat(db): 스크랩·신고 테이블 마이그레이션 (community_post_scraps, community_reports)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: 운영 DB 적용 + schema_migrations backfill

**Files:** (DB 작업 — 코드 변경 없음)

> 이전 세션 패턴(`docs/db/R4-db-apply-runbook.md`, 세션47 solution): Management API `database/query`. `.env.local`의 `SUPABASE_ACCESS_TOKENS` + 프로젝트 ref `enksnhshciyvllwfiwrm`. 한글 주석은 없으므로 인코딩 이슈 없음(영문 SQL).

- [ ] **Step 1: Management API로 마이그레이션 SQL 적용**

`scripts/`에 일회성 적용 스크립트가 없으면, 운영 적용은 Management API POST `/v1/projects/{ref}/database/query`에 위 SQL 본문을 전송. (기존 세션이 PowerShell `Invoke-RestMethod`로 수행한 패턴 재사용.)
Expected: HTTP 200/201, 에러 없음.

- [ ] **Step 2: 테이블·RLS 검증**

조회: `SELECT tablename FROM pg_tables WHERE tablename IN ('community_post_scraps','community_reports');` → 2행.
`SELECT polname FROM pg_policies WHERE tablename IN ('community_post_scraps','community_reports');` → scrap 3 + report 1(insert).

- [ ] **Step 3: PostgREST 스키마 리로드**

쿼리: `NOTIFY pgrst, 'reload schema';`

- [ ] **Step 4: schema_migrations backfill**

`INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES ('20260614000001','create_scraps_reports') ON CONFLICT DO NOTHING;` (기존 14자리 버전 정책 일치 — 세션32 런북 §10).

- [ ] **Step 5: 적용 결과 기록** (커밋 없음 — DB 상태)

`docs/db/`에 적용 로그 1줄 추가 또는 handover에 기록.

---

## Task 3: 스크랩 API (`/api/community/scrap`)

**Files:**
- Create: `app/api/community/scrap/route.ts`

> 패턴 참조: `app/api/community/comment/route.ts`(UUID 검증·createClient 세션). 스크랩은 회원전용이라 RLS가 본인 강제 → 사용자 세션 클라(`@/lib/supabase/server`)로 INSERT/DELETE/SELECT.

- [ ] **Step 1: POST(토글) + GET(목록) 작성**

```typescript
// 스크랩 토글/목록 — 회원전용 (RLS가 user_id=auth.uid() 강제)
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (s: string) => UUID_REGEX.test(s);

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });

  let postId = "";
  try {
    const body = (await req.json()) as { postId?: unknown };
    postId = typeof body.postId === "string" ? body.postId : "";
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!isUuid(postId)) return NextResponse.json({ error: "Invalid postId" }, { status: 400 });

  // 존재 여부 확인 → 토글
  const { data: existing } = await supabase
    .from("community_post_scraps")
    .select("id")
    .eq("user_id", user.id)
    .eq("post_id", postId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("community_post_scraps").delete().eq("id", existing.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ scrapped: false });
  }
  const { error } = await supabase
    .from("community_post_scraps")
    .insert({ user_id: user.id, post_id: postId });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ scrapped: true });
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });

  // 스크랩 → 게시글 조인 (최신순)
  const { data, error } = await supabase
    .from("community_post_scraps")
    .select("created_at, post:community_posts(id, board_slug, title, category, like_count, comment_count, view_count, created_at, is_deleted)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 삭제된 글 제외
  const posts = (data ?? [])
    .map((r) => r.post)
    .filter((p): p is NonNullable<typeof p> => !!p && !p.is_deleted);
  return NextResponse.json({ posts });
}
```

- [ ] **Step 2: 검증**

Run: `npx tsc --noEmit` → EXIT 0
Run: `npx eslint app/api/community/scrap/route.ts` → EXIT 0
(eslint `no-restricted-imports`: `@/lib/supabase/server`는 화이트리스트에 이미 존재.)

- [ ] **Step 3: 커밋**

```bash
git add app/api/community/scrap/route.ts
git commit -m "feat(api): 스크랩 토글/목록 라우트 (회원전용)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: 신고 API (`/api/community/report`)

**Files:**
- Create: `app/api/community/report/route.ts`

> 패턴 참조: `comment/route.ts` PATCH(`x-client-ip-hash` 헤더 + createAdminClient). 신고는 RLS가 service_role만 SELECT/UPDATE 허용 → `createAdminClient`로 INSERT(dedup 위반 감지).

- [ ] **Step 1: POST(접수) 작성**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (s: string) => UUID_REGEX.test(s);
const REASONS = new Set(["spam", "abuse", "sexual", "fraud", "etc"]);

export async function POST(req: NextRequest) {
  let body: { targetType?: unknown; targetId?: unknown; reason?: unknown; detail?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const targetType = body.targetType === "post" || body.targetType === "comment" ? body.targetType : "";
  const targetId = typeof body.targetId === "string" ? body.targetId : "";
  const reason = typeof body.reason === "string" ? body.reason : "";
  const detail = typeof body.detail === "string" ? body.detail.trim().slice(0, 500) : null;

  if (!targetType) return NextResponse.json({ error: "Invalid targetType" }, { status: 400 });
  if (!isUuid(targetId)) return NextResponse.json({ error: "Invalid targetId" }, { status: 400 });
  if (!REASONS.has(reason)) return NextResponse.json({ error: "Invalid reason" }, { status: 400 });

  const supabaseUser = await createClient();
  const { data: { user } } = await supabaseUser.auth.getUser();

  const row: Record<string, unknown> = { target_type: targetType, target_id: targetId, reason, detail };
  if (user) {
    row.reporter_user_id = user.id;
  } else {
    const ipHash = req.headers.get("x-client-ip-hash");
    if (!ipHash) return NextResponse.json({ error: "신고 식별 헤더 없음" }, { status: 400 });
    row.reporter_ip_hash = ipHash;
  }

  const admin = createAdminClient();
  const { error } = await admin.from("community_reports").insert(row);
  if (error) {
    // dedup UNIQUE 위반 = 이미 신고
    if (error.code === "23505") return NextResponse.json({ error: "이미 신고한 콘텐츠입니다" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}
```

- [ ] **Step 2: 검증**

Run: `npx tsc --noEmit` → 0 / `npx eslint app/api/community/report/route.ts` → 0

- [ ] **Step 3: 커밋**

```bash
git add app/api/community/report/route.ts
git commit -m "feat(api): 신고 접수 라우트 (회원/익명 dedup)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: 관리자 신고 API (`/api/admin/reports`)

**Files:**
- Create: `app/api/admin/reports/route.ts`

> 패턴 참조: R-A `requireAdmin()` + `app/api/admin/board/route.ts`(createAdminClient).

- [ ] **Step 1: GET(목록) + PATCH(상태변경) 작성**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/admin-guard";

const STATUSES = new Set(["pending", "reviewed", "dismissed"]);
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.res;

  const status = new URL(req.url).searchParams.get("status") ?? "pending";
  const admin = createAdminClient();
  let q = admin
    .from("community_reports")
    .select("id, target_type, target_id, reason, detail, reporter_user_id, status, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (STATUSES.has(status)) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reports: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.res;

  let body: { reportId?: unknown; status?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const reportId = typeof body.reportId === "string" ? body.reportId : "";
  const status = typeof body.status === "string" ? body.status : "";
  if (!UUID_REGEX.test(reportId)) return NextResponse.json({ error: "Invalid reportId" }, { status: 400 });
  if (!STATUSES.has(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from("community_reports").update({ status }).eq("id", reportId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: 검증**

Run: `npx tsc --noEmit` → 0 / `npx eslint app/api/admin/reports/route.ts` → 0 (admin-guard 화이트리스트 R-A에서 등록됨)

- [ ] **Step 3: 커밋**

```bash
git add app/api/admin/reports/route.ts
git commit -m "feat(api): 관리자 신고 목록·상태변경 라우트 (requireAdmin)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: DB 스모크 스크립트

**Files:**
- Create: `scripts/smoke/scrap-report-smoke.ts`

> 패턴 참조: `scripts/smoke/watchlist-sync-smoke.ts`(service_role 라운드트립, `--dry-run`/`--write`, 합성 데이터 + afterAll 정리).

- [ ] **Step 1: 스모크 작성** (service_role로 scrap insert/delete + report insert/dedup/delete 검증)

핵심 검증 항목(각 PASS/FAIL 로그):
1. scrap: 합성 user_id(기존 테스트 회원)·기존 post_id로 insert → 동일 (user,post) 재insert UNIQUE 위반 확인 → delete 잔여 0
2. report: target('post', postId) reporter_ip_hash='SMOKE...' insert → 동일 재insert 23505 확인 → status update('reviewed') 확인 → delete 잔여 0
3. 미주입(env 부재) 시 graceful skip(watchlist-smoke 패턴)

```typescript
// 합성 식별자 접두사로 운영 데이터 오염 방지 + afterAll 전량 삭제
const IP = "SMOKE_REPORT_" + "test"; // reporter_ip_hash 합성
// ... createAdminClient 동등(서버 외부 스크립트는 @supabase/supabase-js service_role 직접 생성)
```

- [ ] **Step 2: 실행 검증** (자격증명 주입 시)

Run: `npx tsx scripts/smoke/scrap-report-smoke.ts --write`
Expected: 전 항목 PASS, 잔여 0. (env 미주입 시 graceful skip — 정상)

- [ ] **Step 3: 커밋**

```bash
git add scripts/smoke/scrap-report-smoke.ts
git commit -m "test(smoke): 스크랩·신고 DB 라운드트립 스모크

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: 답글(대댓글) 결선 — CommentSection

**Files:**
- Modify: `components/community/CommentSection.tsx`

> 먼저 파일 전체를 읽어 현재 댓글 작성 폼·목록 렌더·like 핸들러 패턴 파악. 답글 폼은 기존 작성 폼을 재사용(회원/익명 분기 동일).

- [ ] **Step 1: 답글 상태 + 폼 추가**

- `const [replyingTo, setReplyingTo] = useState<string | null>(null)` 추가.
- 각 댓글 "답글" 버튼 `onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)}`.
- `replyingTo === c.id`일 때 댓글 하단에 인라인 폼 렌더(기존 작성 폼 컴포넌트/마크업 재사용) → 제출 시 `POST /api/community/comment` with `parentId: c.id` → 성공 후 목록 갱신 + `setReplyingTo(null)`.

- [ ] **Step 2: 대댓글 1depth 그룹핑 렌더**

- 평면 `comments` 배열을 `parent_id === null` 부모 + 그 자식(`parent_id === parent.id`)으로 그룹핑.
- 자식의 자식(2depth+)도 같은 부모 그룹에 1depth로 표시(들여쓰기 깊이 고정).
- 렌더: 부모 created_at asc, 그룹 내 자식 created_at asc. 자식은 좌측 들여쓰기(예: `ml-6 border-l`).

- [ ] **Step 3: 댓글 신고 버튼 결선** (ReportModal은 Task 8에서 생성 — 이 step은 Task 8 이후 연결, 또는 버튼만 두고 핸들러 stub→Task 8에서 연결)

순서 의존: ReportModal(Task 8) 완료 후 댓글 "신고" 버튼 `onClick`으로 `ReportModal open(targetType='comment', targetId=c.id)` 호출.

- [ ] **Step 4: 검증**

Run: `npx tsc --noEmit` → 0 / `npx eslint components/community/CommentSection.tsx` → 0

- [ ] **Step 5: 커밋**

```bash
git add components/community/CommentSection.tsx
git commit -m "feat(community): 댓글 답글(대댓글 1depth) 결선

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: 신고 모달 + 게시글/댓글 신고 버튼

**Files:**
- Create: `components/community/ReportModal.tsx`
- Create: `lib/community/report-client.ts`
- Modify: `components/community/PostVoteButtons.tsx`, `components/community/CommentSection.tsx`

- [ ] **Step 1: report-client.ts 작성** (클라 fetch 래퍼)

```typescript
export type ReportReason = "spam" | "abuse" | "sexual" | "fraud" | "etc";
export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  spam: "스팸/광고", abuse: "욕설/비방", sexual: "음란물", fraud: "사기/허위", etc: "기타",
};
export async function submitReport(input: {
  targetType: "post" | "comment"; targetId: string; reason: ReportReason; detail?: string;
}): Promise<{ ok: boolean; status: number; error?: string }> {
  const res = await fetch("/api/community/report", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input),
  });
  if (res.ok) return { ok: true, status: res.status };
  const data = await res.json().catch(() => ({}));
  return { ok: false, status: res.status, error: data.error };
}
```

- [ ] **Step 2: ReportModal.tsx 작성** (사유 라디오 5종 + detail textarea + 제출)

- props: `{ open, targetType, targetId, onClose }`. 내부 reason 상태 + detail. 제출 → `submitReport` → 성공 토스트/닫기, 409 "이미 신고함" 안내.
- 접근성: `role="dialog"`, ESC 닫기, 라디오 그룹.

- [ ] **Step 3: PostVoteButtons에 신고 버튼 결선**

- 기존 "신고" 버튼(audit: line 92-94, onClick 없음) → `ReportModal` open(`targetType='post'`, `targetId={postUuid}`). postUuid는 상세 props로 이미 전달됨(확인).

- [ ] **Step 4: CommentSection 신고 버튼 연결** (Task 7 Step 3 완료)

- [ ] **Step 5: 검증**

Run: `npx tsc --noEmit` → 0 / `npx eslint components/community/ReportModal.tsx lib/community/report-client.ts components/community/PostVoteButtons.tsx` → 0

- [ ] **Step 6: 커밋**

```bash
git add components/community/ReportModal.tsx lib/community/report-client.ts components/community/PostVoteButtons.tsx components/community/CommentSection.tsx
git commit -m "feat(community): 신고 모달 + 게시글·댓글 신고 버튼 결선

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: 스크랩 버튼 결선 + 상세 initialScrapped

**Files:**
- Create: `lib/community/scrap-queries.ts`
- Modify: `components/community/PostVoteButtons.tsx`, `app/api/board/[slug]/[postId]/route.ts`, 상세 페이지(props 전달 지점)

- [ ] **Step 1: scrap-queries.ts 작성** (클라 토글 fetch)

```typescript
export async function toggleScrap(postId: string): Promise<{ scrapped: boolean } | { error: string; status: number }> {
  const res = await fetch("/api/community/scrap", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postId }),
  });
  if (res.ok) return (await res.json()) as { scrapped: boolean };
  const data = await res.json().catch(() => ({}));
  return { error: data.error ?? "오류", status: res.status };
}
```

- [ ] **Step 2: 상세 API에 회원 scrapped 추가**

`app/api/board/[slug]/[postId]/route.ts` GET: 로그인 사용자면 `community_post_scraps`에서 `(user_id, post_id)` 존재 조회 → 응답에 `scrapped: boolean` 추가(비회원 false). 기존 응답 계약(`{post, comments}`)에 필드 추가(additive, 기존 호출 무해).

- [ ] **Step 3: PostVoteButtons 스크랩 버튼 결선**

- 기존 스크랩 버튼(audit: line 89-91) → `initialScrapped` prop으로 초기 상태, `onClick` → `toggleScrap` → 상태 갱신. 비회원(401) 시 `/auth/login`으로 유도(toast 또는 confirm).
- 상세 페이지/컴포넌트에서 `scrapped`를 PostVoteButtons에 prop 전달.

- [ ] **Step 4: 검증**

Run: `npx tsc --noEmit` → 0 / `npx eslint lib/community/scrap-queries.ts components/community/PostVoteButtons.tsx app/api/board/[slug]/[postId]/route.ts` → 0

- [ ] **Step 5: 커밋**

```bash
git add lib/community/scrap-queries.ts components/community/PostVoteButtons.tsx "app/api/board/[slug]/[postId]/route.ts"
git commit -m "feat(community): 게시글 스크랩 토글 결선 + 상세 scrapped 상태

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: 게시글 수정 라우트 (`/board/[slug]/[postId]/edit`)

**Files:**
- Create: `app/board/[slug]/[postId]/edit/page.tsx`
- Modify: `components/community/PostActions.tsx`

> 먼저 `app/board/[slug]/write/page.tsx`를 읽어 폼 구조 파악. 폼 마크업이 페이지에 인라인이면, edit는 동일 구조 + 초기값 prefill로 별도 구현(공용 컴포넌트 추출은 규모 크면 보류, 동일 패턴 복제 허용).

- [ ] **Step 1: edit 페이지 작성**

- 마운트 시 `GET /api/board/[slug]/[postId]`로 기존 글 로드 → title/contentHtml/category/tags/coinSymbol prefill.
- 회원 본인: 바로 편집. 익명 글: 비밀번호 입력 게이트(PATCH에 `guestPassword`).
- 제출: `PATCH /api/board/[slug]/[postId]` → 성공 시 `router.push(상세)`.
- 권한 없음(403)/없음(404)/삭제(410) graceful.

- [ ] **Step 2: PostActions "수정" 버튼 결선**

- 기존 "수정" 버튼(audit: PostActions line 39-40) → `Link`/`router.push`로 `/board/${slug}/${postId}/edit` 이동.

- [ ] **Step 3: 검증**

Run: `npx tsc --noEmit` → 0 / `npx eslint "app/board/[slug]/[postId]/edit/page.tsx" components/community/PostActions.tsx` → 0

- [ ] **Step 4: 커밋**

```bash
git add "app/board/[slug]/[postId]/edit/page.tsx" components/community/PostActions.tsx
git commit -m "feat(community): 게시글 수정 라우트 + 수정 버튼 결선

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 11: 내 스크랩 목록 페이지 (`/scraps`)

**Files:**
- Create: `app/scraps/page.tsx`

> 패턴 참조: `app/watchlist/page.tsx`(회원/미로그인 분기) + BoardRow(`components/community/`)로 글 카드 재사용.

- [ ] **Step 1: 페이지 작성**

- 클라 컴포넌트 또는 서버에서 세션 확인. 미로그인 → 로그인 유도 UI. 로그인 → `GET /api/community/scrap` → 글 목록(BoardRow 재사용) + 빈 상태("스크랩한 글이 없습니다" + 게시판 링크).

- [ ] **Step 2: 검증**

Run: `npx tsc --noEmit` → 0 / `npx eslint app/scraps/page.tsx` → 0

- [ ] **Step 3: 커밋**

```bash
git add app/scraps/page.tsx
git commit -m "feat(community): 내 스크랩 목록 페이지 (/scraps)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 12: 관리자 신고 검토 페이지 (`/admin/reports`)

**Files:**
- Create: `app/admin/reports/page.tsx`

> 패턴 참조: `app/admin/board/page.tsx`(클라 admin 게이트 `ADMIN_EMAIL` 표시용 + 서버 API가 실검증). 목록은 `GET /api/admin/reports?status=`, 상태변경은 `PATCH`.

- [ ] **Step 1: 페이지 작성**

- status 탭(pending/reviewed/dismissed) + 신고 목록 테이블(대상 타입·사유·detail·시각) + 대상 링크(post→`/board/.../{id}`, comment→대상 게시글) + 상태변경 버튼(reviewed/dismissed).
- 대상 조회 실패(삭제됨) → "삭제된 콘텐츠" 표시.

- [ ] **Step 2: 검증**

Run: `npx tsc --noEmit` → 0 / `npx eslint app/admin/reports/page.tsx` → 0

- [ ] **Step 3: 커밋**

```bash
git add app/admin/reports/page.tsx
git commit -m "feat(admin): 신고 검토 페이지 (/admin/reports)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 13: 코인룸 AI 시그널 실데이터화

**Files:**
- Modify: `lib/community/coin-server.ts`, `app/coin/[symbol]/page.tsx:165-188`

> 먼저 `lib/community/coin-server.ts`(fetchCoinRoomData·buildCoinView)와 `lib/analysis` 진입점(`generateSignals`/`calculateProbability`/`performAnalysis` 또는 crypto SSOT 캔들 조회)을 읽어 호출 시그니처 확인. self-fetch 금지(서버 컴포넌트에서 lib 직접 호출).

- [ ] **Step 1: coin-server에 분석 블록 추가**

- 단일 심볼(btc/eth/xrp/sol): crypto SSOT(`lib/supabase/crypto.ts`)에서 캔들 조회 → `lib/analysis` 엔진 호출 → `{ signal: '매수'|'매도'|'중립', confidence: number, marketState: string }` 반환. `fetchCoinRoomData` 반환 타입에 `analysisSignal?: {...} | null` 추가.
- altcoin/kimp 집계형(buildCoinView 폴백 분기): `analysisSignal = null`.
- 캔들 부족/에러: `null`(graceful), 외부 호출은 `.catch`로 격리(기존 패턴).

- [ ] **Step 2: page.tsx 시그널 위젯 실데이터 결선**

- L165-188 placeholder 제거 → `analysisSignal`이 있으면 signal/confidence/marketState 표시, 없으면 "분석 데이터 준비 중" 또는 위젯 숨김. "상세 분석 보기" 링크 유지. 의미색(매수=positive/매도=negative) 유지.

- [ ] **Step 3: 검증**

Run: `npx tsc --noEmit` → 0 / `npx eslint lib/community/coin-server.ts "app/coin/[symbol]/page.tsx"` → 0
(SSOT: coin-server가 crypto 조회 → `@/lib/supabase/crypto` 화이트리스트 OK. analysis는 `@/lib/analysis/crypto` 경유 — `no-restricted-imports` 확인.)

- [ ] **Step 4: 커밋**

```bash
git add lib/community/coin-server.ts "app/coin/[symbol]/page.tsx"
git commit -m "feat(community): 코인룸 AI 시그널 실데이터화 (lib/analysis 직접 호출)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 14: 레퍼런스 갱신 + 최종 빌드 검증

**Files:**
- Modify: `docs/references/_SCHEMA_REFERENCE.md`, `_API_REFERENCE.md`, `_WEB_CONTRACT.md`, `_COMPONENT_MAP.md`

- [ ] **Step 1: 레퍼런스 갱신**

- `_SCHEMA`: community_post_scraps·community_reports 2테이블(컬럼/인덱스/RLS) + 운영 적용 기록.
- `_API`: scrap(POST/GET)·report(POST)·admin/reports(GET/PATCH) 항목.
- `_WEB_CONTRACT`: `/scraps`·`/board/[slug]/[postId]/edit`·`/admin/reports` 라우트 등록 + §8 카운트 갱신 + 계약 버전 +1.
- `_COMPONENT_MAP`: ReportModal·edit 페이지·신규 SSOT(scrap-queries/report-client) 등재.

- [ ] **Step 2: 최종 전체 빌드**

Run: `npm run build`
Expected: EXIT 0. Route 목록에 `○ /scraps`, `ƒ /board/[slug]/[postId]/edit`, `○ /admin/reports`, `/api/community/scrap`·`/api/community/report`·`/api/admin/reports` 등장. `● /coin/[symbol]` 유지.

- [ ] **Step 3: 커밋**

```bash
git add docs/references/_SCHEMA_REFERENCE.md docs/references/_API_REFERENCE.md docs/references/_WEB_CONTRACT.md docs/references/_COMPONENT_MAP.md
git commit -m "docs(ref): R-B 스크랩·신고·코인룸 시그널 레퍼런스 정합

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review (작성자 점검 완료)

**스펙 커버리지:** 스펙 §2(DB)→T1/T2, §3(API)→T3/T4/T5, §4(프론트)→T7/T8/T9/T10, §5(페이지)→T11/T12, §6(코인룸)→T13, §7(레퍼런스)→T14, §9(검증)→각 task + T6 스모크. 누락 없음.

**Placeholder 스캔:** 신규 코드(마이그레이션·4 API·2 클라래퍼)는 전체 코드 제시. UI 결선(T7~T13)은 기존 파일 의존이라 "먼저 읽고 패턴 따름"으로 명시 — 추측 코드 박지 않음(이 코드베이스는 기존 패턴 복사가 정확). 결선 지점은 audit의 file:line으로 특정.

**타입 일관성:** `scrapped:boolean`(API↔scrap-queries↔PostVoteButtons), `ReportReason` 5종(report-client↔ReportModal↔API REASONS), status 3종(API↔admin page), targetType('post'|'comment') 일관.

**위험:** T2(운영 DB)·T7~T13(기존 파일 선독 필요)이 불확실성 높음 → 각 task 착수 시 대상 파일 Read 선행 명시.
