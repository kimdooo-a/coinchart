# 인수인계서 — R3 / T06 admin-board-route

> 작성일: 2026-05-24
> 라운드: R3 (community-finish)
> 일꾼: T06 / 12 (Wave 1, 독립)
> 상태: **PASS** (관리자 전용 공지 생성/토글 API + `/admin/board` UI 구현, board API 무파손)

---

## 1. 작업 요약

`community_posts.is_notice` 컬럼은 이미 존재(R1/T01)하나 **공지를 생성/토글하는 admin 경로가 부재**했다.
공개 board API를 **일절 수정하지 않고**(옵션 B), 관리자 전용 라우트(`/api/admin/board`)와 관리 UI(`/admin/board`)를 신설하여
보드별 공지 작성·승격·해제를 가능하게 했다. board 목록 API(`GET /api/board/[slug]`)는 이미 `notices`/`posts`를
분리 반환하므로, 본 작업으로 등록한 공지는 즉시 board 상단(`notices` 배열)에 노출된다.

## 2. 선택한 옵션: **B (admin 전용 신규 라우트)**

| | 옵션 A (board POST 확장) | **옵션 B (신규 admin 라우트)** ← 채택 |
|---|---|---|
| 위치 | `app/api/board/[slug]/route.ts` 수정 | `app/api/admin/board/route.ts` 신규 |
| board 계약 영향 | 파라미터 추가(수정 발생) | **board API 0줄 수정** |
| T02(board SSR) 리스크 | 회귀 가능성 존재 | **완전 격리** |

**채택 사유**:
1. 안티패턴 1순위(board 응답 필드·파라미터 제거 금지)를 **물리적으로 봉쇄** — board route를 건드리지 않으므로 회귀 0.
2. 기존 board POST(line 130) 주석이 이미 "공지는 service_role 어드민 별도 라우트로 (R1 범위 외)"로 본 라우트를 예고.
3. is_notice 토글은 board route에 없던 메서드(PATCH)가 필요 → admin CRUD를 한 파일에 응집하는 편이 깔끔.

## 3. 권한 검증 방식 (서버 role 검증 필수 — 클라 신뢰 금지)

- **단일 게이트** `requireAdmin()` (route 내부): `createClient()` 쿠키 세션 → `auth.getUser()` → `isAdminEmail(user.email)`(`lib/supabase/blog.ts`, `smartkdy7@gmail.com`).
- 응답 분기: **미인증 → 401** / **인증되었으나 비관리자 → 403**. GET·POST·PATCH 3개 메서드 모두 첫 줄에서 호출(누락 불가 구조).
- 쓰기는 `createAdminClient()`(service_role) 사용 — `community_posts` RLS의 update 정책이 author 본인으로 제한되므로, 공지 승격/해제는 service_role로 RLS 우회(공개 board POST의 admin 클라이언트 패턴과 동일).
- 클라 UI(`/admin/board`)의 이메일 체크는 **표시용 게이트일 뿐**, 실제 권한은 전적으로 서버가 강제.

```ts
// app/api/admin/board/route.ts
async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, res: 401 ... };
  if (!isAdminEmail(user.email)) return { ok: false, res: 403 ... };
  return { ok: true, userId: user.id };
}
```

## 4. 산출물

### 신규 파일 (2)
- **`app/api/admin/board/route.ts`** — admin 전용 공지 라우트.
  - `GET ?slug=` → `{ notices, posts }` (공지 전량 + 최근 일반글 30 = 승격 후보)
  - `POST` `{ slug, title, contentHtml, category? }` → `{ id }` (201). `author_id=관리자 uid`, `is_notice=true`. CHECK 제약(author XOR guest)을 author_id로 만족.
  - `PATCH` `{ postId, isNotice }` → `{ id, isNotice }`. 일반글↔공지 토글.
  - board route와 **동일한 `POST_SELECT_FIELDS`·`VALID_SLUGS`(9종)** 사용 → 응답 행 구조 일치.
- **`app/admin/board/page.tsx`** — 관리 UI(`"use client"`). 보드 선택(9종 셀렉트) + 공지 작성 폼(제목 + TipTap `BlogEditor` tone="light") + 현재 공지 목록("공지 해제") + 최근 글 목록("공지 등록"). v2.0 라이트 톤 토큰(`bg-surface-*`/`text-on-surface`/`border-outline-variant`) 사용. checking/authorized/denied 3분기는 기존 `app/admin` 패턴 따름.

### 수정 파일 (1) — additive only
- **`app/admin/page.tsx`** — 관리자 대시보드에 "📌 공지 게시판 관리 → /admin/board" 바로가기 섹션 1개 추가(기존 "블로그 관리 바로가기" 패턴 복제). 기존 코드 **삭제 없음**(시각 검증 진입점 확보 목적).

### 레퍼런스 갱신 (1)
- **`docs/references/_API_REFERENCE.md`** — `/api/admin/board` GET/POST/PATCH 3개 엔드포인트 상세 + 요약표 3행 추가.

## 5. API 계약 (하위호환 유지 증거)

- **`git diff --stat -- app/api/board/[slug]/route.ts` = 빈 출력** → board API **0줄 수정 확인**.
- board `GET` 응답 `{ notices, posts, total, page, limit }`, `POST` `{ id }` 계약 **불변**. T02(board SSR)의 호출 무파손.
- 본 작업이 추가한 공지는 board `GET`의 기존 쿼리(`.eq("is_notice", true)`)에 그대로 잡혀 `notices` 배열로 노출 → 추가 연동 코드 불필요.

## 6. 검증 결과

| 게이트 | 결과 |
|---|---|
| `npx tsc --noEmit` (전체) | **0 error** |
| `Test-Path app/admin/board/page.tsx` | **True** |
| `grep is_notice\|isNotice app/api/admin/board app/admin/board` | route 11건 + UI 4건 ✓ |
| 비관리자 403 / 공지 생성 로직 | `requireAdmin()` 403 분기 + POST 핸들러 존재 ✓ |
| board route 무변경 | `git diff` 빈 출력 ✓ |
| `npm run build` | **Compiled successfully** — `/admin/board`(○ static), `/api/admin/board`(ƒ dynamic) 등록 확인 ✓ |

## 7. 시각 검증 방법 (권장)

```bash
npm run dev
```
1. admin 계정(`smartkdy7@gmail.com`)으로 로그인 → `/admin` 대시보드의 "📌 공지 게시판 관리" → `/admin/board` 이동.
2. 보드 셀렉트에서 `자유게시판` 선택 → "새 공지 작성"에 제목+본문 입력 → "공지 등록" → 상단 "현재 공지" 목록에 즉시 반영.
3. "최근 글" 목록의 임의 글 "공지 등록" 클릭 → 해당 글이 "현재 공지"로 이동(승격). 역으로 "공지 해제"로 일반글 복귀.
4. `/board/free` 방문 → 등록한 공지가 목록 **최상단(notices)**에 노출되는지 확인.
5. (선택) 비로그인/비관리자 상태로 `POST /api/admin/board` 호출 시 **401/403** 반환 확인.

## 8. 알려진 제약 / 후속 후보

1. **운영자 뱃지 미노출**: 공지는 `author_id`(관리자 uid)로 적재되나, board API(T12)가 프로필명을 join하지 않아 board에서 작성자는 `"회원"`으로 표시(`isAdmin` 항상 false — R2/T01 §9-3 동일 제약). 운영자 뱃지/닉(`"운영자"`) 노출은 board API 응답 확장 후속 라운드 사항.
2. **공지 본문 수정 라우트 부재**: 본 라운드는 작성·토글·해제만. 등록된 공지의 본문 수정은 board PATCH(`/api/board/[slug]/[postId]`, 회원 author 검증)로 가능하나 admin 전용 수정 UI는 미구현.
3. **BOARD_META는 3종(free/market/info)만 정의**: coin-* 6종은 `BOARD_META` 미정의이나 board API VALID_SLUGS엔 포함 → admin UI는 9종 전체를 자체 라벨(`BOARD_OPTIONS`)로 노출. coin 보드 공지도 정상 동작.
4. **공유 working tree 주의**: 본 검증 시점 다수 R3 일꾼이 동일 트리에서 작업 중(`app/api/community/*`, `lib/community/*` 등 타 일꾼 M 상태). 본 일꾼 산출물은 `app/api/admin/board/`·`app/admin/board/`(신규) + `app/admin/page.tsx`·`_API_REFERENCE.md`(additive)로 한정 — 지휘자 통합 시 충돌 없음(전부 additive/신규).

## 9. 참조

- 작업 명세: `docs/orchestration/2026-05-24-R3-community-finish/T06-admin-board-route.md`
- board API 계약: `docs/handover/2026-05-23-R2-T01-board-realdata.md` §3, `docs/references/_API_REFERENCE.md` "커뮤니티" 섹션
- community_posts 스키마(is_notice·CHECK·RLS): `docs/references/_SCHEMA_REFERENCE.md` §community_posts
- admin 인증 패턴 참고: `app/api/blog/route.ts`(isAdminEmail), `lib/supabase/blog.ts`
