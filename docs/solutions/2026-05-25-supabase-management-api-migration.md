---
title: Supabase 운영 DB에 access token(Management API)만으로 마이그레이션 적용 + 동기화 갭 진단
date: 2026-05-25
session: 29
tags: [supabase, migration, management-api, db-sync, access-token, e2e-false-positive]
category: workaround
confidence: high
---

## 문제

R4에서 추천/댓글 백엔드 마이그레이션 2종을 운영 DB에 적용하려 했으나:
1. `.env.local`에 **`NEXT_PUBLIC_SUPABASE_URL`·DB password 부재** (ANON_KEY·SERVICE_ROLE_KEY·`SUPABASE_ACCESS_TOKENS`만). `supabase/config.toml`도 없음 → 정식 `supabase db push`(link + DB 직접 연결)가 비대화형에서 막힘.
2. 적용 시도 중 `relation "community_comments" does not exist` → 점검 결과 **커뮤니티 마이그레이션 5종 전부 운영 DB 미적용**이었음. 코드(SSR·API·UI)는 R1~R4로 진행됐는데 **운영 DB는 한 번도 동기화된 적 없음** — news/blog_posts만 존재. 즉 커뮤니티 기능이 운영에서 동작한 적이 없었음(로컬 빌드는 graceful degrade로 통과해 은폐됨).

## 원인

- 마이그레이션 파일은 작성·커밋만 됐고 운영 DB 적용은 "운영자 별도 작업"으로 미뤄져 왔음. handover마다 "실 DB 적용은 컨덕터/운영자 별도"로 이월되며 **아무도 실제 적용을 안 함**.
- 로컬 `npm run build`가 통과해 문제가 드러나지 않음 — supabase fetch 실패를 `?? []`·`.catch`로 graceful degrade하도록 설계돼 있어 **DB 부재가 빌드/렌더 단계에서 무증상**.

## 해결

### 1. access token으로 Management API 직접 적용 (DB password 불요)

```bash
# 토큰을 출력에 노출하지 않고 env 주입 (.env.local에서 읽기)
export SUPABASE_ACCESS_TOKEN="$(grep '^SUPABASE_ACCESS_TOKENS=' .env.local | cut -d= -f2- | tr -d '"'\''' | tr -d '\r')"

# 인증 확인 + project ref 조회 (URL 없어도 됨)
npx --no-install supabase projects list      # → REFERENCE ID 컬럼에서 ref 확인

# 마이그레이션 .sql을 JSON payload로 변환 후 Management API query 엔드포인트로 POST
node -e 'const fs=require("fs");process.stdout.write(JSON.stringify({query:fs.readFileSync(process.argv[1],"utf8")}))' "supabase/migrations/<file>.sql" > payload.json
curl -s -w "\nHTTP %{http_code}\n" -X POST \
  "https://api.supabase.com/v1/projects/<REF>/database/query" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" --data @payload.json
# 성공 시 HTTP 201 + [] (DDL은 행 반환 없음)
```

- **git bash `/tmp` ≠ node(Windows) `/tmp`** — payload는 프로젝트 내 gitignore된 경로(`.dispatch/`)에 생성.
- SQL에 작은따옴표가 많으면 bash 변수(`SQL="..."`)에 담아 `node -e '...' "$SQL"`로 전달(JSON.stringify가 escaping).
- **적용 전 사전 점검** 필수: `to_regclass('public.<table>')` + `pg_proc`/`pg_policies` count로 멱등성/중복 확인. `CREATE POLICY`는 비멱등이라 재적용 시 `DROP POLICY IF EXISTS` 선행.

### 2. 적용 후 검증
- 객체 존재 재조회(테이블·RPC·시드·컬럼) → 스모크 스크립트(`npx tsx scripts/smoke/...`, URL은 ref로 `NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co` env 주입) → 토글 RPC 라운드트립.
- dev 서버 실행 시에도 URL을 env 주입: `NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co npm run dev`.

### 3. E2E false positive 함정 (부수 교훈)
- E2E(L-B3 댓글 작성)가 "댓글 visible"로 통과했으나 DB엔 0행 → **낙관적 UI 또는 셀렉터 오판으로 false positive**. 직접 `curl`로 API(작성 201·추천 PATCH like 0→1→0)를 호출해 백엔드 정상을 확정하고, 실패의 귀속(앱 vs 테스트)을 분리.

## 교훈

- **운영 DB 동기화는 명시적 게이트가 필요** — 마이그레이션 커밋 ≠ 적용. graceful degrade는 DB 부재를 은폐하므로 "운영자 별도"로 이월하면 영영 안 됨. 라운드 종료 시 운영 DB 객체 존재를 실제 쿼리로 확인할 것.
- `SUPABASE_ACCESS_TOKEN`만 있으면 **DB password·link·config.toml 없이** Management API `database/query`로 DDL 적용 가능 (단 `schema_migrations` 히스토리는 미기록 — 차후 정식 db push 시 멱등 충돌 주의).
- E2E 실패는 **앱 버그와 테스트 신뢰성 문제를 분리**해서 진단 — 직접 API 호출이 가장 빠른 귀속 판정.

## 관련 파일
- `docs/db/R4-db-apply-runbook.md` (§8 적용 기록)
- `scripts/smoke/community-like-smoke.ts`
- `supabase/migrations/20260523_create_community_tables.sql` 외 4종
- `docs/handover/2026-05-25-session29-r4-conductor.md`
