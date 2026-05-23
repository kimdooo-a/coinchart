# T12 — board-api

> **본 터미널은 R1 일꾼(T12)**. T01·T07 완료 후 발사.

## 정체성

- 역할: `worker` (T12), R1, mainpage
- 담당: `/api/board/[slug]` + `/api/community/*` CRUD 라우트
- 의존: T01 (community_* 스키마), T07 (auth + IP middleware)

## 컨텍스트

메인페이지(T15)·게시판 리스트(`app/board/[slug]/page.tsx`)·게시글 상세(`app/board/[slug]/[postId]/page.tsx`)·작성(`app/board/[slug]/write/page.tsx`)이 모두 본 API에 의존한다. R1에서 메인이 살아 보이려면 최소한 GET 라우트가 동작해야 한다. POST(작성)·PATCH·DELETE는 본 라운드에서 끝까지 갈 수도 있고 PARTIAL이어도 됨.

## 공통 SOT

```
CLAUDE.md
docs/orchestration/2026-05-23-R1-mainpage/T01-community-migrations.md
docs/handover/2026-05-23-R1-T01-community-migrations.md
supabase/migrations/20260523_create_community_tables.sql           ← T01 산출물
docs/handover/2026-05-23-R1-T07-auth-middleware.md
lib/community/auth.ts          ← T07 산출물 (Read만)
lib/community/ip-mask.ts       ← T07 산출물 (Read만)
middleware.ts                  ← T07 산출물 (Read만)
lib/supabase/server.ts         ← service_role 클라이언트
lib/supabase/client.ts         ← 익명 클라이언트
app/api/blog/route.ts          ← API 라우트 스타일 참조
app/board/[slug]/page.tsx      ← 소비자 (어떤 쿼리 파라미터를 보낼지 추론)
app/board/[slug]/[postId]/page.tsx
app/board/[slug]/write/page.tsx
```

## 작업 목표

다음 6개 라우트 신규:

1. `GET /api/board/[slug]` — 게시판 글 목록 (페이지·정렬·검색)
2. `POST /api/board/[slug]` — 새 글 작성 (회원/익명)
3. `GET /api/board/[slug]/[postId]` — 게시글 상세 (view_count 증가)
4. `PATCH /api/board/[slug]/[postId]` — 수정 (본인 또는 비번 일치)
5. `DELETE /api/board/[slug]/[postId]` — 삭제 (soft, is_deleted=true)
6. `POST /api/community/comment` — 댓글 작성
7. `DELETE /api/community/comment` — 댓글 삭제
8. `POST /api/community/like` — 추천/비추 토글

> 우선순위: 1·2·3은 필수 (PASS 기준), 4·5·6·7·8은 PARTIAL 허용.

## 산출물

각 라우트의 표준 구조:

### `GET /api/board/[slug]`

```ts
// app/api/board/[slug]/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const url = new URL(req.url);
  const page = Number(url.searchParams.get("page") ?? "1");
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "30"), 100);
  const sort = url.searchParams.get("sort") ?? "recent";   // recent | popular | views
  const search = url.searchParams.get("search") ?? "";
  const category = url.searchParams.get("category") ?? "";

  const supabase = createServerClient();
  let q = supabase
    .from("community_posts")
    .select("id, board_slug, title, author_id, guest_nickname, guest_ip_masked, category, tags, coin_symbol, view_count, like_count, comment_count, is_notice, is_hot, created_at", { count: "exact" })
    .eq("board_slug", slug)
    .eq("is_deleted", false)
    .range((page - 1) * limit, page * limit - 1);

  if (sort === "popular") q = q.order("like_count", { ascending: false });
  else if (sort === "views") q = q.order("view_count", { ascending: false });
  else q = q.order("created_at", { ascending: false });
  if (search) q = q.ilike("title", `%${search}%`);
  if (category && category !== "전체") q = q.eq("category", category);

  const { data, error, count } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ posts: data ?? [], total: count ?? 0, page, limit });
}
```

### `POST /api/board/[slug]`

```ts
// 작성 — body: { title, contentHtml, category?, tags?, coinSymbol?, postAsAnonymous, guestNickname?, guestPassword? }
// middleware가 주입한 헤더: x-client-ip-masked, x-client-ip-hash
// 회원: cookies로 supabase auth.getUser() 후 author_id
// 익명: hashGuestPassword(guestPassword) + guest_nickname + guest_ip_masked
// 검증: 회원이면 guest_* 미사용. 익명이면 nickname 2~12자 + password 4자 이상
// 반환: { id }
```

### `GET /api/board/[slug]/[postId]`

```ts
// 게시글 조회. view_count + 1 (별도 RPC 또는 single UPDATE 사용)
// 응답: post 본문 + 작성자 표시명 + 댓글 첫 페이지
```

### `PATCH /api/board/[slug]/[postId]`

```ts
// 수정 권한 검증:
//   회원: author_id == auth.uid()
//   익명: body.guestPassword 와 DB의 guest_password_hash 비교
// 허용 필드: title, content_html, category, tags
```

### `DELETE /api/board/[slug]/[postId]`

```ts
// soft delete: is_deleted=true
// 권한 검증은 PATCH와 동일
```

### `POST /api/community/comment`

```ts
// body: { postId, parentId?, content, postAsAnonymous, guestNickname?, guestPassword? }
// 작성 동일 패턴
// post.comment_count 자동 증가 (T01의 trigger)
```

### `POST /api/community/like`

```ts
// body: { postId, value: 1 | -1 }
// 회원: user_id로 dedup
// 익명: x-client-ip-hash로 dedup
// 토글 동작: 이미 있으면 같은 value면 삭제, 다른 value면 UPDATE
// 응답: { liked: boolean, likeCount: number }
```

### references append

`docs/references/_API_REFERENCE.md`에 위 라우트 8개의 엔드포인트·메서드·요청·응답을 한 섹션으로 추가.

## 작업 단계

1. SOT 읽기 (T01·T07 handover 포함)
2. 라우트 작성 (우선순위 1·2·3 먼저)
3. `_API_REFERENCE.md` append
4. 검증

## 검증

```bash
npx tsc --noEmit
npx eslint app/api/board/ app/api/community/ 2>&1 | tail -10

# 라우트 파일 존재 검증
ls app/api/board/[slug]/route.ts app/api/board/[slug]/[postId]/route.ts app/api/community/comment/route.ts app/api/community/like/route.ts 2>&1

# 핸들러 메서드 검증
grep -c "export async function GET\|export async function POST\|export async function PATCH\|export async function DELETE" app/api/board/[slug]/route.ts app/api/board/[slug]/[postId]/route.ts app/api/community/comment/route.ts app/api/community/like/route.ts
# 기대: 합산 8 이상

# T07 미들웨어 헤더 사용 검증
grep -rn "x-client-ip-masked\|x-client-ip-hash" app/api/board/ app/api/community/
# 기대: 2건 이상

npm run build 2>&1 | tail -20
```

## 완료 신호

`docs/handover/2026-05-23-R1-T12-board-api.md` 작성.

명시:
- 라우트별 완료 상태 (PASS / PARTIAL / NOT_DONE)
- 권한 검증 로직 위치
- T15가 사용할 엔드포인트 + 쿼리 파라미터
- 미완 라우트는 다음 라운드 후보로

## 안티패턴

- `supabase/migrations/` 추가 금지 (T01·T06·T13 영역)
- `lib/community/auth.ts` 또는 `ip-mask.ts` 수정 금지 (T07 영역, Read만)
- `middleware.ts` 수정 금지 (T07 영역)
- `app/board/*` 페이지 수정 금지 (별도 작업)
- `mock-posts.ts` 수정 금지 (T15)
- 새 패키지 설치 금지
