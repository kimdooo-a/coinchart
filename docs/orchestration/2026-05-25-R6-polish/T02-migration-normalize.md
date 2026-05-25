# T02 — 마이그레이션 파일명 14자리 정규화 + config.toml + backfill SQL (코드만)

## 1. 컨텍스트
- 프로젝트: Crypto Chart Analysis — Supabase 마이그레이션
- 작업 디렉토리: `F:\11_dev\260523 코인 차트분석`
- 본 터미널 역할: **T02 / 5** (R6-polish Wave 1) — 마이그레이션 히스토리 정합 (코드 정규화까지)
- 쓰기 영역(격리): `supabase/migrations/*`(rename), `supabase/config.toml`(신규), `supabase/*.sql`(backfill 스크립트), `docs/db/R4-db-apply-runbook.md`

## 2. 배경
운영 DB `schema_migrations.version`은 **파일명 첫 숫자 토큰(8자리 날짜)**. 우리 파일명은 14자리 고유 timestamp가 아니라 8자리 날짜라, 같은 날짜 다수 파일이 version 충돌 → 단순 backfill 불가(R5-#4 진단). 런북 §9-4가 정합 가이드를 이미 제시함.

> **중요(사용자 결정)**: **코드 정규화까지만**. 운영 DB는 건드리지 않는다(R5 "운영 DB 직접 변경 회피" 유지). backfill SQL은 **파일로 작성만** 하고 적용(db push / Management API)은 하지 않는다.

## 3. 공통 SOT (읽기 전용)
- `docs/db/R4-db-apply-runbook.md` **§9 전체(특히 §9-4)** — 정규화 예시·backfill SQL·project-ref·검증 절차가 이미 기술됨. **이 가이드를 그대로 이행**.
- `CLAUDE.md` — 규약
- `docs/handover/2026-05-25-session30-r5.md` — R5-#4 멱등화·진단 맥락

## 4. 작업 목표

### Phase 1: 파일명 14자리 timestamp 정규화 (git mv)
런북 §9-4의 매핑대로 `supabase/migrations/`의 같은 날짜 충돌 파일을 14자리로 정규화. 정규화 대상(같은 날짜 ≥2개):
- `20241213_*` ×3 (init_market_prices·update_cleanup_and_forex·auto_cleanup)
- `20241214_*` ×2 (news_archive·add_news_language)
- `20260523_*` ×3 (create_community_tables·alter_news_classify·create_hot_issues_rpc)
- `20260524_*` ×2 (comment_likes·post_likes_rpc)

규칙: `YYYYMMDD_name.sql` → `YYYYMMDDhhmmss_name.sql`. **적용 순서를 보존**하도록 hhmmss를 부여(런북 §9-4 예: `000001`·`000002`…). 같은 날짜 내 순서는 기존 db push 사전순/논리 의존(예: comment_likes → post_likes_rpc) 유지. 단독 날짜 파일(20251227·20260114·20260308·20260309)도 일관성을 위해 일괄 정규화 권장(런북이 권장).
- **반드시 `git mv`** 사용(히스토리 보존). 파일 내용은 변경 없음.

### Phase 2: 코드 내 파일명 참조 확인
- 마이그 파일명을 하드코딩으로 참조하는 코드/스크립트가 있는지 검색(`scripts/`·`docs/`). 있으면 갱신, 없으면 handover에 "참조 0건" 명시.

### Phase 3: supabase/config.toml 생성
- 런북 §9-4 (2)대로 `supabase/config.toml` 생성. `project_id`/링크 정보 포함(project-ref `enksnhshciyvllwfiwrm`). `supabase link` 실제 실행은 사용자 몫(자격 필요) — config 파일만 작성.

### Phase 4: backfill SQL 파일 작성 (적용 X)
- 런북 §9-4 (3)의 INSERT SQL을 **정규화된 14자리 version 기준**으로 `supabase/backfill_schema_migrations.sql`에 작성. `ON CONFLICT (version) DO NOTHING` 포함. 파일 상단 주석에 "적용은 사용자가 `supabase db push` 정합 환경에서 수동 실행" 명시.

### Phase 5: 런북 §9 갱신
- §9-4를 "정규화 완료(파일명 14자리)·config.toml 생성·backfill SQL 작성됨, 운영 DB 적용은 미실행" 상태로 갱신. 새 파일명 목록 반영.

## 5. 도구 권장
- `/kdydb` 스킬(마이그레이션 관리) 참고 가능. SQL 작성은 직접.

## 6. 의존성
- 독립. 운영 DB·Management API 호출 금지(코드만).

## 7. 검증
```powershell
# 14자리 정규화 확인 — 8자리 날짜만인 파일이 없어야 함
Get-ChildItem supabase/migrations/*.sql | Where-Object { $_.Name -match '^\d{8}_' }   # 출력 0
# 정규화 후 파일 14자리 prefix 확인
Get-ChildItem supabase/migrations/*.sql | Where-Object { $_.Name -match '^\d{14}_' } | Measure-Object   # 14개
# config.toml·backfill 존재
Test-Path supabase/config.toml; Test-Path supabase/backfill_schema_migrations.sql
# git mv 추적 확인 (rename으로 잡혀야 함)
git status
# 앱 빌드 영향 없음(SQL/toml만)
npx tsc --noEmit
```

## 8. 완료 신호
`docs/handover/2026-05-25-R6-T02-migration-normalize.md` 작성. 포함: 파일명 before→after 매핑 표, 코드 참조 검색 결과, config.toml·backfill SQL 경로, **운영 DB 미적용 명시**, 사용자가 정합 완료하려면 실행할 명령(`supabase link`·`db push`·backfill).

## 안티패턴
- ❌ 운영 DB schema_migrations 직접 INSERT/Management API 호출 (사용자 결정: 코드만)
- ❌ 파일 내용 변경 (rename만 — 내용은 멱등화 완료 상태 보존)
- ❌ `git mv` 대신 삭제+생성 (히스토리 소실)
- ❌ 공통 SOT(`docs/references/*`) 수정 / 한국어 주석·커밋 누락 / handover 누락
