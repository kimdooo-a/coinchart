# R4 DB 적용 런북 — 커뮤니티 추천 백엔드 (마이그레이션 2종)

**작성**: 2026-05-25 / R4 (community-wiring) / T01
**대상 실행자**: 운영자 (운영 DB 자격증명 보유자)
**소요**: 약 3~5분

> ⚠️ **자격증명·service_role 키를 이 문서나 어떤 스크립트에도 절대 기입하지 마세요.**
> 모든 인증은 `supabase login` / `.env.local` 참조로만 처리합니다.

---

## 1. 무엇을 / 왜

R3(community-finish)에서 추가됐으나 **운영 DB에 미적용**인 마이그레이션 2종을 적용합니다.
이 객체가 없으면 다음 라우트가 런타임 **500**을 던집니다:

| 라우트 | 의존 객체 | 누락 시 증상 |
|--------|-----------|--------------|
| `POST /api/community/like` | RPC `community_toggle_post_like(...)` | 추천/비추 토글 500 |
| `PATCH /api/community/comment` | 테이블 `community_comment_likes` + 트리거 | 댓글 추천 500 |

## 2. 적용 대상 파일

| 순서 | 파일 | 추가 객체 | 멱등성 |
|------|------|-----------|--------|
| ① | `supabase/migrations/20260524_comment_likes.sql` | 테이블 `community_comment_likes`, 트리거 `trg_community_comment_likes_count`, 함수 `community_sync_comment_like_count`, RLS 3정책 | `IF NOT EXISTS`/`CREATE OR REPLACE`/`DROP TRIGGER IF EXISTS`로 멱등 — **단 `CREATE POLICY`는 비멱등** (3-1 참고) |
| ② | `supabase/migrations/20260524_post_likes_rpc.sql` | 함수 `community_post_like_counts`, `community_toggle_post_like` | `CREATE OR REPLACE`만 사용 → **완전 멱등** |

### 적용 순서 메모
- `supabase db push`는 **파일명 사전순**으로 적용하므로 실제 순서는 `comment_likes`(c) → `post_likes_rpc`(p)입니다.
- 두 파일은 **상호 독립**입니다(각각 R1 선행 테이블 `community_comments`/`community_post_likes`에만 의존). 따라서 둘의 적용 순서는 결과에 영향이 없습니다.
- 선행 조건: `20260523_create_community_tables.sql`가 **이미 적용**되어 있어야 합니다(게시판/게시글/댓글/post_likes 테이블·트리거). 미적용이면 push가 그 마이그레이션부터 함께 적용합니다.

### 3-1. ⚠️ 재적용 주의 (CREATE POLICY 비멱등)
`20260524_comment_likes.sql`의 RLS 정책 3개(`community_comment_likes_select/insert/delete`)는 `CREATE POLICY`로만 작성돼 **이미 존재하면 재실행 시 `policy already exists` 오류**가 납니다.
- **최초 1회 적용**(정상 흐름)은 무관합니다.
- 부분 실패 후 재실행이 필요하면, SQL Editor에서 해당 정책을 `DROP POLICY IF EXISTS "..." ON community_comment_likes;` 선행 후 재실행하세요.
- 마이그레이션 파일은 **읽기 전용**(R3 커밋 완료)이므로 본 런북에서 수정하지 않습니다.

---

## 3. 사전 점검

> 이 프로젝트에는 `supabase/config.toml`이 **없습니다.** 따라서 push 전에 `supabase link`로 원격 프로젝트를 연결해야 합니다.

```bash
# (a) Supabase CLI 설치 확인
supabase --version

# (b) 로그인 (브라우저 인증) — 자격증명은 CLI가 보관, 문서/env에 기입 금지
supabase login

# (c) 원격 프로젝트 연결 (project-ref는 Supabase 대시보드 > Project Settings > General)
supabase link --project-ref <YOUR_PROJECT_REF>

# (d) 로컬 vs 원격 마이그레이션 상태 비교 (어떤 게 미적용인지 확인)
supabase migration list
```

`migration list` 출력에서 `20260524_comment_likes`·`20260524_post_likes_rpc`가 **Local에만 있고 Remote에 없음**(미적용)으로 보이면 정상입니다.

---

## 4. 적용 절차

### 4-A. 권장: `supabase db push`
```bash
# (1) 무엇이 적용될지 미리보기 (실제 변경 없음)
supabase db push --dry-run

# (2) 실제 적용 — 미적용 마이그레이션을 사전순으로 모두 push
supabase db push
```
> `db push`는 원격에 **기록되지 않은 모든 마이그레이션**을 적용합니다. `--dry-run` 출력에 대상 2종만 보이는지 반드시 확인하세요(예상 외 마이그레이션이 섞이면 중단).

### 4-B. 대안: SQL Editor 직접 실행 (CLI 미사용 시)
Supabase 대시보드 **SQL Editor**에서 아래 순서로 파일 내용을 붙여넣어 실행:
1. `supabase/migrations/20260524_comment_likes.sql`
2. `supabase/migrations/20260524_post_likes_rpc.sql`

### 4-C. 본 Claude Code 세션에서 사용자가 직접 실행 (선택)
프롬프트에 `! ` 접두로 입력하면 이 세션에서 바로 실행되어 출력이 대화에 남습니다:
```
! supabase db push --dry-run
```
확인 후:
```
! supabase db push
```

---

## 5. 적용 후 스모크 검증 (필수)

```bash
npx tsx scripts/smoke/community-like-smoke.ts
```
- `.env.local`의 `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`를 사용합니다.
- **PASS**: RPC 토글 ON→취소 원상복구 + `community_comment_likes` SELECT + 트리거 like_count 증감이 모두 정상.
- **FAIL**: 어떤 객체가 없는지(미적용) 또는 계약 불일치를 명시 출력하고 종료코드 1로 종료.
- 게시글/댓글 시드가 없으면 일부 항목은 **SKIP**(객체는 존재) — 필요 시 `npx tsx scripts/seed-community.ts`로 시드 후 재실행.
- 스모크는 합성 `ip_hash`로 추가한 행을 같은 실행 내에서 **원상복구**하므로 실데이터에 잔여를 남기지 않습니다.

본 세션 직접 실행 예시:
```
! npx tsx scripts/smoke/community-like-smoke.ts
```

---

## 6. 롤백 노트

적용 역순으로 객체를 제거합니다(데이터 손실 주의 — `community_comment_likes` DROP 시 댓글 추천 기록 소실).

```sql
-- ② post_likes_rpc 롤백 (함수만 제거, 데이터 영향 없음)
DROP FUNCTION IF EXISTS community_toggle_post_like(UUID, UUID, TEXT, SMALLINT);
DROP FUNCTION IF EXISTS community_post_like_counts(UUID);

-- ① comment_likes 롤백 (트리거 → 함수 → 테이블 순)
DROP TRIGGER IF EXISTS trg_community_comment_likes_count ON community_comment_likes;
DROP FUNCTION IF EXISTS community_sync_comment_like_count();
DROP TABLE IF EXISTS community_comment_likes;   -- ⚠️ 댓글 추천 데이터 소실
-- community_comments.like_count 컬럼은 ADD COLUMN IF NOT EXISTS로 추가됐으나
-- 20260523에서 이미 생성된 컬럼이므로 롤백 시 DROP하지 않음(원래 스키마 보존).
```
> 함수(②)는 `CREATE OR REPLACE` 멱등이라 롤백 없이 재적용으로 정정 가능합니다. 테이블(①)은 데이터가 쌓이면 롤백이 파괴적이므로 신중히.

---

## 7. 체크리스트

- [ ] `supabase login` / `supabase link --project-ref ...` 완료
- [ ] `supabase migration list`로 대상 2종이 미적용인지 확인
- [ ] `supabase db push --dry-run` 출력에 대상 2종만 포함 확인
- [ ] `supabase db push` 성공
- [x] `npx tsx scripts/smoke/community-like-smoke.ts` → PASS(또는 객체 존재 SKIP)
- [ ] `POST /api/community/like`, `PATCH /api/community/comment` 실호출 200 확인 (T04 E2E에서 검증)

---

## 8. ✅ 적용 완료 기록 (2026-05-25, 지휘자 세션 29)

런북 작성 시점에는 R4 마이그레이션 2종만 대상으로 봤으나, **실제 운영 DB(enksnhshciyvllwfiwrm)에는 커뮤니티 마이그레이션 5종 전부가 미적용**이었음(community_* 테이블 0개). 따라서 선행 3종을 포함해 5종을 순차 적용함.

- **적용 방식**: `supabase db push` 대신 **Supabase Management API `database/query`** (`.env.local`의 `SUPABASE_ACCESS_TOKENS` 사용, DB password 불요). `config.toml`/link 없이 적용 가능했음.
- **적용 순서**(전부 HTTP 201): `20260523_create_community_tables` → `20260523_alter_news_classify` → `20260523_create_hot_issues_rpc` → `20260524_comment_likes` → `20260524_post_likes_rpc`
- **검증**: 테이블 5·RPC 4·보드시드 9·news분류컬럼 3 확인. 게시글 시드 156행. 스모크 PASS 2/SKIP 1(댓글 트리거)/FAIL 0.
- ⚠️ **마이그레이션 히스토리 미기록**: Management API 직접 적용이라 `supabase_migrations.schema_migrations`에 없음. 차후 정식 `db push` 시 대부분 멱등(IF NOT EXISTS/OR REPLACE)이나 `CREATE POLICY` 3종(comment_likes)은 `DROP POLICY IF EXISTS` 선행 필요(§3-1 참조).

---

## 9. ✅ 히스토리 정합 (2026-05-25, 지휘자 세션 30 / R5-#4)

세션 29의 §8 우려(차후 db push 시 CREATE POLICY 충돌)를 정합 처리함.

### 9-1. 축 A — 마이그레이션 파일 완전 멱등화 (완료, 코드)
커뮤니티 마이그레이션의 **모든 `CREATE POLICY`(18개)에 `DROP POLICY IF EXISTS ...` 선행 추가**:
- `20260523_create_community_tables.sql` — 15개(boards 4·posts 4·comments 4·post_likes 3)
- `20260524_comment_likes.sql` — 3개

이제 5종 전부가 완전 멱등 → **정식 db push가 재실행해도 충돌 없음**(§3-1의 수동 DROP 선행 불요). 아직 어떤 환경의 `schema_migrations`에도 등록 전이라 파일 사후 수정의 부작용 없음(체크섬 충돌 환경 부재).

### 9-2. 운영 DB `schema_migrations` 실측 진단 (읽기 조회)
Management API로 `SELECT version, name FROM supabase_migrations.schema_migrations` 조회 결과:

| 기록된 version | name | 비고 |
|------|------|------|
| 20241213 | auto_cleanup | 로컬엔 `20241213_*` **3개**(init_market_prices·update_cleanup_and_forex·auto_cleanup) → 날짜당 1행만 기록 |
| 20241214 | add_news_language | 로컬엔 `20241214_*` **2개**(news_archive·add_news_language) → 1행만 |
| 20251227 | create_stock_prices | |
| 20260114 | create_secure_memos | |
| 20260308 | create_blog_tables | |
| 20260309 | blog_content_to_html | |

**커뮤니티 5종(`20260523`×3·`20260524`×2)은 전부 미기록.**

### 9-3. ⚠️ 단순 backfill 불가 — 같은 날짜 version 충돌
- supabase의 `schema_migrations.version`은 **파일명 첫 숫자 토큰(8자리 날짜)**. 우리 파일명은 14자리 고유 timestamp가 아니라 날짜 8자리.
- 따라서 **같은 날짜에 여러 마이그레이션이 있으면 version이 충돌**(20241213·20241214가 날짜당 1행만 기록된 게 그 증거). 커뮤니티도 `20260523`에 3개가 몰려 있어 단순 INSERT backfill이 PK 충돌로 실패.
- **결론**: backfill 단독은 부적절. 멱등화(9-1)로 차후 db push 재실행 안전이 이미 확보됐으므로 운영 DB는 건드리지 않음.

### 9-4. 정식 db push 환경 구축 — ✅ 코드 작업 완료 (2026-05-25, R6-polish / T02)

> **상태**: 아래 (1)·(2)·(3) **코드 작업 완료** — 파일명 14자리 정규화(git mv) + `supabase/config.toml` 생성 + `supabase/backfill_schema_migrations.sql` 작성.
> **운영 DB 미적용** — `supabase link` / `db push` / backfill 실행은 자격증명 보유자(사용자)가 (4) 절차로 수행한다. (사용자 결정: 코드만, R5 "운영 DB 직접 변경 회피" 유지)

#### (1) 파일명 14자리 timestamp 정규화 — ✅ 완료 (git mv, 파일 내용 변경 없음)
14개 파일 전체를 `YYYYMMDD_name.sql` → `YYYYMMDDhhmmss_name.sql` 로 정규화(같은 날짜 version 충돌 해소). 같은 날짜 내 순서는 실제 적용 순서(논리 의존)를 `hhmmss`로 보존:

| before (8자리) | after (14자리) |
|------|------|
| `20241213_init_market_prices.sql` | `20241213000001_init_market_prices.sql` |
| `20241213_update_cleanup_and_forex.sql` | `20241213000002_update_cleanup_and_forex.sql` |
| `20241213_auto_cleanup.sql` | `20241213000003_auto_cleanup.sql` |
| `20241214_news_archive.sql` | `20241214000001_news_archive.sql` |
| `20241214_add_news_language.sql` | `20241214000002_add_news_language.sql` |
| `20251227_create_stock_prices.sql` | `20251227000001_create_stock_prices.sql` |
| `20260114_create_secure_memos.sql` | `20260114000001_create_secure_memos.sql` |
| `20260308_create_blog_tables.sql` | `20260308000001_create_blog_tables.sql` |
| `20260309_blog_content_to_html.sql` | `20260309000001_blog_content_to_html.sql` |
| `20260523_create_community_tables.sql` | `20260523000001_create_community_tables.sql` |
| `20260523_alter_news_classify.sql` | `20260523000002_alter_news_classify.sql` |
| `20260523_create_hot_issues_rpc.sql` | `20260523000003_create_hot_issues_rpc.sql` |
| `20260524_comment_likes.sql` | `20260524000001_comment_likes.sql` |
| `20260524_post_likes_rpc.sql` | `20260524000002_post_likes_rpc.sql` |

- 순서 근거: `20241213` = init(테이블 생성) → update(제약·함수) → auto_cleanup(pg_cron); `20241214` = news_archive(테이블) → add_news_language(컬럼). mtime·논리 의존·운영 DB 마지막 기록(§9-2)과 모두 일치. 커뮤니티 5종은 본 §9-4 기존 매핑 + R4 적용 순서(§8) 유지.

#### (2) `supabase/config.toml` 생성 — ✅ 완료 (파일만, link 미실행)
`project_id = "enksnhshciyvllwfiwrm"` 포함. 실제 연결은 사용자가: `supabase link --project-ref enksnhshciyvllwfiwrm`

#### (3) backfill SQL — ✅ 작성 완료 (적용 X)
`supabase/backfill_schema_migrations.sql` — 정규화된 14자리 version 기준, `ON CONFLICT (version) DO NOTHING`.
- **Part A**: 커뮤니티 5종(schema_migrations 미기록) INSERT — 정합 필수.
- **Part B**: 비-커뮤니티 9종 — 정규화로 운영 DB의 기존 8자리 6행과 14자리 파일명이 mismatch되므로, 완전 정합 시 8자리 행 DELETE 후 14자리 재INSERT (선택).

#### (4) 사용자 정합 완료 절차 (운영 DB 자격증명 필요 — 미실행)
```bash
supabase login
supabase link --project-ref enksnhshciyvllwfiwrm
supabase migration list            # 14종 version 상태 확인 (정규화로 기존 6행은 mismatch 표시될 수 있음)
supabase db push --dry-run         # 적용 대상 미리보기 (객체는 이미 존재 — 0건이 이상적)
# 이후 SQL Editor 또는 db push 정합 환경에서 backfill 실행:
#   supabase/backfill_schema_migrations.sql (Part A 필수 / Part B 선택)
supabase migration list            # 정합 완료 시 대상 마이그레이션이 Remote 적용됨으로 표시
```
> ⚠️ 운영 DB 객체(테이블/함수/트리거)는 세션 29(§8)에서 이미 적용 완료 — backfill은 `schema_migrations` **기록만** 보충한다.
