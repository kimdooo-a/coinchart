# T01 — community-migrations

> **본 터미널은 R1 일꾼(T01)**. CEO 지휘소(별도 터미널)가 본 작업의 발사·회수를 담당한다.
> 본 .md 1개로 작업이 자기완결되도록 작성됨. 외부 메모리에 의존하지 말 것.

## 정체성

- 역할: `worker` (T01)
- 라운드: R1, 태그: mainpage
- 본 터미널은 **community 게시판 DB 마이그레이션**만 담당
- 금지 어휘: "추가로", "겸사겸사", "함께", "이왕 하는 김에" — 자기 영역 밖 손대지 말 것
- SessionStart hook이 자동으로 환경변수(`DK_DISPATCH_ROLE=worker`, `DK_DISPATCH_GROUP=T01`, `DK_DISPATCH_ALLOWED=...`)를 주입하고 PreToolUse hook이 격리를 강제한다

## 컨텍스트

프로젝트는 **`F:\11_dev\260523 코인 차트분석`** (Next.js 16 + Supabase). v2.0 커뮤니티 피벗으로 `community_*` 테이블 4종이 필요한데 현재 0건. 메인페이지 베스트30·게시판 3컬럼·코인룸 게시글이 전부 `lib/community/mock-posts.ts` 더미에 의존하므로 DB 스키마 확정이 R1 전체의 임계 경로다.

## 공통 SOT (읽기 전용)

```
CLAUDE.md
docs/PROJECT_DIRECTION.md       (§3 — DB 스키마 초안)
docs/references/_SCHEMA_REFERENCE.md
docs/design-brief/00-overview.md
docs/handover/2026-05-10-session7-stitch-applied.md
supabase/migrations/20260308_create_blog_tables.sql    (스타일 참조)
supabase/migrations/20241214_news_archive.sql          (RLS 패턴 참조)
lib/community/mock-posts.ts                            (UI 컬럼 추론)
lib/community/mock-coins.ts                            (코인 태그 enum 추론)
components/community/BoardRow.tsx                      (BoardPost 인터페이스 추론)
```

## 작업 목표

`community_*` 4개 테이블 마이그레이션 SQL 1개 + `_SCHEMA_REFERENCE.md`에 신규 섹션 추가.

## 산출물

### 신규 파일

#### 1. `supabase/migrations/20260523_create_community_tables.sql`

다음 4개 테이블을 단일 파일로 작성:

**`community_boards`** (게시판 메타)
- `slug` text primary key — `free` / `market` / `info` / `coin-btc` / `coin-eth` / `coin-xrp` / `coin-sol` / `coin-altcoin` / `coin-kimp`
- `name` text not null, `name_en` text, `emoji` text, `description` text
- `sort_order` int default 0
- `created_at` timestamptz default now()
- 시드 행 9개 (`free`/`market`/`info` + 코인룸 6종)을 같은 SQL 안에서 `INSERT ... ON CONFLICT DO NOTHING`

**`community_posts`** (게시글)
- `id` uuid primary key default `gen_random_uuid()`
- `board_slug` text not null references community_boards(slug)
- `title` text not null check (length(title) between 1 and 200)
- `content_html` text not null
- `author_id` uuid references auth.users(id) on delete set null (회원)
- `guest_nickname` text check (length(guest_nickname) between 2 and 12) (익명)
- `guest_password_hash` text (bcrypt, 최소 60자) (익명)
- `guest_ip_masked` text check (guest_ip_masked ~ '^[0-9]+\.[0-9]+\.\*\.\*$') (익명, IP 앞 2옥텟만)
- `category` text default '전체'
- `tags` text[] default array[]::text[]
- `coin_symbol` text — BTC/ETH/... 또는 null
- `view_count` int default 0
- `like_count` int default 0
- `comment_count` int default 0
- `is_notice` boolean default false
- `is_hot` boolean default false (베스트 진입용 캐시 플래그)
- `is_deleted` boolean default false
- `created_at` timestamptz default now()
- `updated_at` timestamptz default now()
- CHECK 제약: author_id IS NOT NULL OR (guest_nickname IS NOT NULL AND guest_password_hash IS NOT NULL AND guest_ip_masked IS NOT NULL)

**`community_comments`** (댓글·대댓글)
- `id` uuid primary key default `gen_random_uuid()`
- `post_id` uuid not null references community_posts(id) on delete cascade
- `parent_id` uuid references community_comments(id) on delete cascade (대댓글)
- `content` text not null check (length(content) between 1 and 2000)
- `author_id` / `guest_nickname` / `guest_password_hash` / `guest_ip_masked` (posts와 동일 패턴)
- `like_count` int default 0
- `is_deleted` boolean default false
- `created_at` / `updated_at`

**`community_post_likes`** (추천 토글 단위 적재. 회원=user_id, 익명=ip_hash로 dedup)
- `id` uuid primary key default `gen_random_uuid()`
- `post_id` uuid not null references community_posts(id) on delete cascade
- `user_id` uuid references auth.users(id) on delete cascade
- `ip_hash` text — 익명일 때 IP의 sha256 해시 (전체 IP, 마스킹 X) — 작성과 다른 식별 단위
- `value` smallint not null check (value in (-1, 1)) — 비추/추천
- `created_at` timestamptz default now()
- UNIQUE (post_id, user_id) — 회원 dedup
- UNIQUE (post_id, ip_hash) — 익명 dedup
- CHECK: user_id IS NOT NULL OR ip_hash IS NOT NULL

#### 인덱스

```sql
create index if not exists idx_community_posts_board_created on community_posts(board_slug, created_at desc) where is_deleted = false;
create index if not exists idx_community_posts_coin_created on community_posts(coin_symbol, created_at desc) where is_deleted = false;
create index if not exists idx_community_posts_hot on community_posts(is_hot, created_at desc) where is_deleted = false and is_hot = true;
create index if not exists idx_community_comments_post on community_comments(post_id, created_at) where is_deleted = false;
```

#### RLS 정책

- 모든 테이블에서 `enable row level security`
- `community_boards`: 공개 SELECT
- `community_posts`:
  - 공개 SELECT (is_deleted=false)
  - 익명+회원 모두 INSERT 가능 (체크 제약은 SQL이 강제)
  - UPDATE/DELETE는 service_role 또는 본인(author_id=auth.uid())만 — 익명은 서버 라우트에서 비번 검증 후 service_role로 처리하므로 RLS 비허용
- `community_comments`: posts와 동일 패턴
- `community_post_likes`:
  - 공개 SELECT
  - INSERT 허용 (서버에서 검증)
  - DELETE는 본인(user_id=auth.uid()) 또는 service_role

#### 트리거 (선택)

- `community_posts.updated_at` 자동 갱신 (`BEFORE UPDATE`)
- `community_comments` 작성/삭제 시 `community_posts.comment_count` 동기화 (`AFTER INSERT/DELETE` trigger function)
- `community_post_likes` 변동 시 `community_posts.like_count` 동기화

### 수정 파일

#### 2. `docs/references/_SCHEMA_REFERENCE.md`

기존 내용을 보존하고, **마지막에** 다음 형식의 섹션 추가:

```markdown
---

## community_* (R1 2026-05-23 추가)

### community_boards
| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|---|---|---|---|---|
| slug | text PK | N | - | 게시판 slug (free/market/info/coin-btc 등) |
| ... |

### community_posts
| 컬럼 | 타입 | NULL | 기본값 | 설명 |
... 위 SQL 그대로 표로 변환

### community_comments
...

### community_post_likes
...

### RLS 요약
- ...

### 트리거 요약
- ...
```

기존 줄은 절대 수정하지 말 것 (append-only).

## 작업 단계

1. 위 SOT 6개 읽기 (`Read` × 6 병렬)
2. `supabase/migrations/20260523_create_community_tables.sql` 작성
3. `_SCHEMA_REFERENCE.md` 끝부분 append
4. 검증: 아래 명령 실행

## 검증

```bash
# 1. SQL 문법 검증 (실제 DB 적용은 사용자가 별도로)
psql --no-psqlrc -c "$(cat supabase/migrations/20260523_create_community_tables.sql)" --set ON_ERROR_STOP=1 \
  postgresql://postgres:postgres@localhost:54322/postgres 2>&1 | head -50
# Supabase CLI가 로컬에 없으면 위 명령은 건너뛰고 다음 dry-run만 수행

# 2. dry-run: SQL 키워드 카운트
grep -c "CREATE TABLE" supabase/migrations/20260523_create_community_tables.sql   # 4 기대
grep -c "CREATE INDEX" supabase/migrations/20260523_create_community_tables.sql   # 4 이상 기대
grep -c "CREATE POLICY" supabase/migrations/20260523_create_community_tables.sql  # 8 이상 기대

# 3. TypeScript 빌드 무영향 확인
npx tsc --noEmit
```

`tsc` 통과 + grep 카운트 ≥ 기대치이면 PASS.

## 완료 신호

`docs/handover/2026-05-23-R1-T01-community-migrations.md` 작성. _INDEX.md §5 양식 준수.

본문에 다음 명시:
- 4개 테이블 컬럼·CHECK·인덱스·RLS 요약 표 1개
- 트리거 사용 여부와 이유
- 익명 게시글 정합성을 위한 CHECK 제약 의도 (author_id XOR guest_*)
- 다음 일꾼(T02·T12·T13)에게 줄 메모: 시드 시 `board_slug` enum 값, `community_post_likes` UNIQUE 조합, `coin_symbol` null 의미

## 안티패턴

- `mock-posts.ts`를 본 작업에서 수정하지 말 것 (T15 영역)
- `news` 테이블 변경 금지 (T06 영역)
- `_SCHEMA_REFERENCE.md`의 기존 줄 수정 금지 (append-only)
- 시드 데이터는 board 메타 9행만. 게시글 더미는 T02 영역
- 마이그레이션 파일명에 다른 날짜·접두어 쓰지 말 것 (`20260523_create_community_tables.sql` 고정)
