# R6-polish T02 — 마이그레이션 파일명 14자리 정규화 + config.toml + backfill SQL (코드만)

- **작성**: 2026-05-25 / R6-polish Wave 1 / 터미널 **T02 / 5**
- **역할**: 마이그레이션 히스토리 정합 (코드 정규화까지 — 운영 DB 미적용)
- **사용자 결정**: **코드만**. 운영 DB(`enksnhshciyvllwfiwrm`)는 건드리지 않음(R5 "운영 DB 직접 변경 회피" 유지). backfill SQL은 **파일로 작성만** 하고 적용(`db push`/Management API) 미실행.
- **SOT**: `docs/db/R4-db-apply-runbook.md` §9-4 (그대로 이행).

---

## 1. Phase 1 — 파일명 14자리 timestamp 정규화 (git mv, 내용 변경 0)

14개 전부 `YYYYMMDD_name.sql` → `YYYYMMDDhhmmss_name.sql`. **`git mv`** 사용(히스토리 보존, `git status`에서 14건 모두 `renamed:`로 추적 확인). 같은 날짜 내 순서는 실제 적용 순서(논리 의존)를 `hhmmss`로 보존.

| # | before (8자리) | after (14자리) |
|---|------|------|
| 1 | `20241213_init_market_prices.sql` | `20241213000001_init_market_prices.sql` |
| 2 | `20241213_update_cleanup_and_forex.sql` | `20241213000002_update_cleanup_and_forex.sql` |
| 3 | `20241213_auto_cleanup.sql` | `20241213000003_auto_cleanup.sql` |
| 4 | `20241214_news_archive.sql` | `20241214000001_news_archive.sql` |
| 5 | `20241214_add_news_language.sql` | `20241214000002_add_news_language.sql` |
| 6 | `20251227_create_stock_prices.sql` | `20251227000001_create_stock_prices.sql` |
| 7 | `20260114_create_secure_memos.sql` | `20260114000001_create_secure_memos.sql` |
| 8 | `20260308_create_blog_tables.sql` | `20260308000001_create_blog_tables.sql` |
| 9 | `20260309_blog_content_to_html.sql` | `20260309000001_blog_content_to_html.sql` |
| 10 | `20260523_create_community_tables.sql` | `20260523000001_create_community_tables.sql` |
| 11 | `20260523_alter_news_classify.sql` | `20260523000002_alter_news_classify.sql` |
| 12 | `20260523_create_hot_issues_rpc.sql` | `20260523000003_create_hot_issues_rpc.sql` |
| 13 | `20260524_comment_likes.sql` | `20260524000001_comment_likes.sql` |
| 14 | `20260524_post_likes_rpc.sql` | `20260524000002_post_likes_rpc.sql` |

**순서 근거**
- `20241213` ×3: `init_market_prices`(market_prices 테이블 생성) → `update_cleanup_and_forex`(제약 변경 + 함수) → `auto_cleanup`(pg_cron 확장 + cron 스케줄). mtime(13:10→13:24→18:08)·논리 의존·운영 DB 마지막 기록(`auto_cleanup`, 런북 §9-2)과 모두 일치.
- `20241214` ×2: `news_archive`(news 테이블 생성) → `add_news_language`(language 컬럼 추가). mtime·논리·운영 DB 마지막 기록(`add_news_language`)과 일치.
- `20260523` ×3 / `20260524` ×2: 런북 §9-4 기존 매핑 + R4 적용 순서(§8) 그대로(`create_community_tables`→`alter_news_classify`→`create_hot_issues_rpc`, `comment_likes`→`post_likes_rpc`).
- 단독 날짜 4개(`20251227`/`20260114`/`20260308`/`20260309`)도 일관성 위해 `…000001`로 일괄 정규화(런북 권장).

---

## 2. Phase 2 — 코드 내 파일명 참조

- **동작(하드코딩) 참조: 0건.** 마이그레이션 디렉토리를 동적으로 읽는 스크립트(`readdir`/`glob` 등) 없음 → 정렬 의존 깨짐 없음.
- **주석 참조: 2건 갱신.** `scripts/smoke/community-like-smoke.ts` 상단 docstring의 설명용 파일명 2개를 새 14자리 이름으로 갱신(동작 영향 0):
  - `20260524_post_likes_rpc.sql` → `20260524000002_post_likes_rpc.sql`
  - `20260524_comment_likes.sql` → `20260524000001_comment_likes.sql`
- docs(handover/status/logs 등) 내 과거 서술 참조는 역사적 기록이라 보존(미수정). 런북 §9-4만 Phase 5에서 갱신.

---

## 3. Phase 3 — `supabase/config.toml` 생성 (신규)

- 경로: `supabase/config.toml`
- 핵심: `project_id = "enksnhshciyvllwfiwrm"` (project-ref). `[db]` port·major_version 포함. CLI 기준 v2.101.0(`supabase/.temp/cli-latest`).
- **`supabase link` 실제 실행은 사용자 몫**(자격증명 필요) — config 파일만 작성.

---

## 4. Phase 4 — `supabase/backfill_schema_migrations.sql` 작성 (적용 X)

- 경로: `supabase/backfill_schema_migrations.sql`
- 정규화된 14자리 version 기준, `ON CONFLICT (version) DO NOTHING`. 상단 주석에 "적용은 사용자가 정합 환경에서 수동 실행" 명시.
- **Part A** (필수): 커뮤니티 5종(`20260523000001`~`20260524000002`) — 운영 DB schema_migrations 미기록분 INSERT. (객체는 세션 29 §8에서 이미 적용됨, 기록만 보충)
- **Part B** (선택, 완전 정합 시): 비-커뮤니티 9종 — T02 정규화로 운영 DB의 기존 **8자리 6행**(`20241213`/`20241214`/`20251227`/`20260114`/`20260308`/`20260309`, 런북 §9-2)과 14자리 파일명이 mismatch됨. 8자리 6행 DELETE 후 14자리 9종 재INSERT.

---

## 5. Phase 5 — 런북 §9-4 갱신

`docs/db/R4-db-apply-runbook.md` §9-4를 "정규화 완료·config.toml 생성·backfill 작성됨, 운영 DB 미적용" 상태로 갱신. 14개 전체 before→after 매핑표 + 사용자 정합 완료 절차(4) 반영.

---

## 6. 검증 결과 (§7 전 항목 통과)

| 항목 | 명령 | 결과 |
|------|------|------|
| 8자리 파일 0건 | `gci supabase/migrations/*.sql \| ? Name -match '^\d{8}_'` | **0** ✅ |
| 14자리 파일 14개 | `… -match '^\d{14}_'` | **14** ✅ |
| config.toml 존재 | `Test-Path supabase/config.toml` | **True** ✅ |
| backfill 존재 | `Test-Path supabase/backfill_schema_migrations.sql` | **True** ✅ |
| git rename 추적 | `git status` | 14건 모두 `renamed:` ✅ |
| 빌드 영향 없음 | `npx tsc --noEmit` | **PASS** (타입 에러 0) ✅ |

---

## 7. ⚠️ 운영 DB 미적용 — 사용자 정합 완료 명령

아래는 **사용자(운영 DB 자격증명 보유자)** 가 정합을 마무리하려면 실행할 순서. T02는 어떤 것도 실행하지 않음(코드만).

```bash
supabase login
supabase link --project-ref enksnhshciyvllwfiwrm
supabase migration list            # 14종 version 상태 확인 (기존 6행은 mismatch로 보일 수 있음)
supabase db push --dry-run         # 적용 대상 미리보기 (객체 이미 존재 → 0건이 이상적)
# 이후 SQL Editor 또는 정합 환경에서 backfill 실행:
#   supabase/backfill_schema_migrations.sql   (Part A 필수 / Part B는 완전 정합 시 선택)
supabase migration list            # 정합 완료 시 대상이 Remote 적용됨으로 표시
```

> 운영 DB 객체(테이블/함수/트리거)는 세션 29(런북 §8)에서 Management API로 이미 적용 완료. backfill은 `supabase_migrations.schema_migrations` **기록만** 보충함.

---

## 8. 변경 파일 요약 (T02 격리 영역)

- `supabase/migrations/*` — 14건 `git mv` (rename, 내용 0)
- `supabase/config.toml` — 신규
- `supabase/backfill_schema_migrations.sql` — 신규
- `docs/db/R4-db-apply-runbook.md` — §9-4 갱신
- `scripts/smoke/community-like-smoke.ts` — 주석 2건 갱신(동작 영향 0)

> 안티패턴 준수: 운영 DB 직접 INSERT/Management API 호출 0 · 마이그 파일 내용 변경 0 · `git mv`로 히스토리 보존 · 공통 SOT(`docs/references/*`) 미수정 · 한국어 주석/문서.
