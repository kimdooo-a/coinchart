---
title: Supabase 테이블 "미존재" false negative — PostgREST 404 ≠ 실제 부재 + 토큰명 혼동
date: 2026-06-20
session: 53
tags: [supabase, postgrest, schema-cache, management-api, migration, false-negative, env]
category: workaround
confidence: high
---

## 문제

세션 52가 운영 DB에 커뮤니티 스크랩/신고 2테이블(`community_post_scraps`·`community_reports`)이 **"미적용"**이며 Management API **토큰이 부재**하다고 판단하고 🔴 최우선 블로커로 인계했다. 그러나 세션 53에서 확인하니 **둘 다 사실이 아니었다** — 테이블은 이미 적용+히스토리 기록까지 완료돼 있었고 토큰도 존재했다. 즉 배포된 스크랩/신고 기능은 사실 정상 작동 가능 상태였으나 한 세션 내내 "깨진 상태"로 오인됐다.

## 원인

두 개의 독립적 오진이 겹쳤다:

1. **환경변수명 혼동(단수 vs 복수)**: 실제 키는 `.env.local`의 `SUPABASE_ACCESS_TOKENS`(복수형, `sbp_` 접두 Management API PAT). 직전 세션은 `SUPABASE_ACCESS_TOKEN`(단수)으로 grep해 "부재"로 결론. 줄 시작 앵커(`^SUPABASE_ACCESS_TOKEN=`)는 복수형 키와 매칭 실패한다.

2. **PostgREST 404를 "테이블 부재"로 오독**: 직전 세션은 service_role + supabase-js(PostgREST)로 테이블을 조회해 404/PGRST205를 받고 "미존재"로 판단. 하지만 PostgREST의 404는 **스키마 캐시 미갱신**(테이블이 방금 생겼거나 reload 안 됨)에서도 발생한다. `information_schema.tables` **직접 조회**(Management API `database/query`)는 테이블 존재를 명확히 보여줬다. PostgREST 레이어의 부재 ≠ DB 레이어의 부재.

## 해결

운영 DB의 객체 존재 여부는 **PostgREST가 아니라 `information_schema`/`pg_catalog`를 Management API로 직접 조회**해 판정한다:

```bash
TOKEN=$(grep -E '^SUPABASE_ACCESS_TOKENS=' .env.local | head -1 | sed -E 's/^SUPABASE_ACCESS_TOKENS=//' | tr -d '"\r')
REF=enksnhshciyvllwfiwrm   # NEXT_PUBLIC_SUPABASE_URL 호스트의 첫 토큰
curl -s -X POST "https://api.supabase.com/v1/projects/$REF/database/query" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  --data-binary @- <<'JSON'
{"query":"SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('community_post_scraps','community_reports');"}
JSON
```

존재 확인 후 컬럼·인덱스·RLS·`schema_migrations` 정합까지 같은 경로로 검증하고, PostgREST 캐시는 `NOTIFY pgrst, 'reload schema';`로 갱신한 뒤 스모크(`scripts/smoke/scrap-report-smoke.ts --write`)로 런타임 라운드트립을 확정한다(6/6 PASS).

## 교훈

- **"테이블 없음" 판정은 PostgREST 404 단독으로 내리지 말 것.** `information_schema` 직접 조회로 교차검증. 404는 RLS 차단·스키마 캐시 미갱신일 수 있다.
- **env 키 부재 결론 전 정확한 키명을 확인.** 줄 시작 grep이 비면 키명 변형(복수형·접미사)도 확인. 이 프로젝트의 Management API 토큰은 `SUPABASE_ACCESS_TOKENS`(복수).
- 마이그레이션 적용 후엔 PostgREST `reload schema`를 습관적으로 트리거(앱이 supabase-js 경유일 때 캐시 신선도가 런타임에 직결).

## 관련 파일
- `.env.local` (`SUPABASE_ACCESS_TOKENS`)
- `supabase/migrations/20260614000001_create_scraps_reports.sql`
- `scripts/smoke/scrap-report-smoke.ts`
- `docs/db/R4-db-apply-runbook.md` (Management API `database/query` 패턴 §8·§10)
