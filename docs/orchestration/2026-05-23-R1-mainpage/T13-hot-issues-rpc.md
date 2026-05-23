# T13 — hot-issues-rpc

> **본 터미널은 R1 일꾼(T13)**. T01 완료 후 발사.

## 정체성

- 역할: `worker` (T13), R1, mainpage
- 담당: 실시간 검색어/핫이슈 집계 RPC + `/api/coins/hot-issues` 라우트
- 의존: T01 (community_posts.coin_symbol)

## 컨텍스트

메인페이지 사이드바의 `HotIssueWidget`은 현재 `HOT_ISSUES` 더미. 실데이터로 채우려면 "최근 X시간 내 코인 태그·검색어 빈도 + 시간 감쇠" 집계가 필요. 본 일꾼이 Postgres 함수(RPC)로 집계 로직을 두고 API 라우트로 노출.

## 공통 SOT

```
CLAUDE.md
docs/orchestration/2026-05-23-R1-mainpage/T01-community-migrations.md
docs/handover/2026-05-23-R1-T01-community-migrations.md
supabase/migrations/20260523_create_community_tables.sql
lib/community/mock-coins.ts                ← HOT_ISSUES 인터페이스 추론
components/community/widgets/HotIssueWidget.tsx
```

## 작업 목표

1. `supabase/migrations/20260523_create_hot_issues_rpc.sql` — Postgres 함수
2. `app/api/coins/hot-issues/route.ts` — 라우트
3. references append

## 산출물

#### 1. `supabase/migrations/20260523_create_hot_issues_rpc.sql`

```sql
-- R1 (2026-05-23) — 핫이슈 집계 RPC
-- 최근 N시간 내 community_posts의 coin_symbol 빈도를 카운트하고 시간 감쇠 적용
-- 추가로 최근 N시간 대비 N*2시간 전 추세를 비교하여 "↑/↓/-/NEW" 트렌드 산출

CREATE OR REPLACE FUNCTION community_hot_issues(
  hours_window int DEFAULT 24,
  result_limit int DEFAULT 10
)
RETURNS TABLE (
  symbol text,
  recent_count bigint,
  prev_count bigint,
  trend text,    -- "UP" | "DOWN" | "FLAT" | "NEW"
  score numeric  -- 정렬용
) AS $$
BEGIN
  RETURN QUERY
  WITH recent AS (
    SELECT coin_symbol, COUNT(*) AS cnt
    FROM community_posts
    WHERE is_deleted = false
      AND coin_symbol IS NOT NULL
      AND created_at >= NOW() - (hours_window || ' hours')::interval
    GROUP BY coin_symbol
  ),
  prev AS (
    SELECT coin_symbol, COUNT(*) AS cnt
    FROM community_posts
    WHERE is_deleted = false
      AND coin_symbol IS NOT NULL
      AND created_at >= NOW() - (hours_window * 2 || ' hours')::interval
      AND created_at <  NOW() - (hours_window     || ' hours')::interval
    GROUP BY coin_symbol
  )
  SELECT
    r.coin_symbol AS symbol,
    r.cnt AS recent_count,
    COALESCE(p.cnt, 0) AS prev_count,
    CASE
      WHEN p.cnt IS NULL OR p.cnt = 0 THEN 'NEW'
      WHEN r.cnt::numeric / GREATEST(p.cnt, 1) > 1.2 THEN 'UP'
      WHEN r.cnt::numeric / GREATEST(p.cnt, 1) < 0.8 THEN 'DOWN'
      ELSE 'FLAT'
    END AS trend,
    r.cnt::numeric + COALESCE(p.cnt, 0)::numeric * 0.3 AS score
  FROM recent r
  LEFT JOIN prev p ON p.coin_symbol = r.coin_symbol
  ORDER BY score DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- 권한: anon · authenticated 모두 호출 가능
GRANT EXECUTE ON FUNCTION community_hot_issues(int, int) TO anon, authenticated;
```

#### 2. `app/api/coins/hot-issues/route.ts`

```ts
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const revalidate = 300;   // 5분

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const hours = Number(url.searchParams.get("hours") ?? "24");
    const limit = Math.min(Number(url.searchParams.get("limit") ?? "10"), 50);

    const supabase = createServerClient();
    const { data, error } = await supabase.rpc("community_hot_issues", {
      hours_window: hours,
      result_limit: limit,
    });
    if (error) throw error;

    return NextResponse.json({
      items: (data ?? []).map((r: { symbol: string; recent_count: number; prev_count: number; trend: string; score: number }, i: number) => ({
        rank: i + 1,
        symbol: r.symbol,
        count: Number(r.recent_count),
        trend: r.trend,
        score: Number(r.score),
      })),
      ts: Date.now(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "hot-issues failed" },
      { status: 500 }
    );
  }
}
```

#### 3. `docs/references/_API_REFERENCE.md` (append)

```markdown
### GET /api/coins/hot-issues

R1 (2026-05-23) 추가.

| 쿼리 | 기본값 | 설명 |
|---|---|---|
| hours | 24 | 집계 윈도우 (시간) |
| limit | 10 | 결과 개수 (최대 50) |

응답: `{ items: [{ rank, symbol, count, trend: "UP"|"DOWN"|"FLAT"|"NEW", score }], ts }`
캐시: 5분
```

## 작업 단계

1. SOT 읽기
2. SQL 작성
3. 라우트 작성
4. references append
5. 검증

## 검증

```bash
npx tsc --noEmit
npx eslint app/api/coins/hot-issues/route.ts 2>&1 | tail -5

# SQL 키워드 검증
grep -c "CREATE OR REPLACE FUNCTION\|GRANT EXECUTE" supabase/migrations/20260523_create_hot_issues_rpc.sql
# 기대: 2 이상

# 라우트 검증
grep -c "rpc(\"community_hot_issues\"" app/api/coins/hot-issues/route.ts
# 기대: 1

npm run build 2>&1 | tail -20
```

> 실제 RPC 호출 검증은 사용자가 마이그레이션 적용 후 별도 수행.

## 완료 신호

`docs/handover/2026-05-23-R1-T13-hot-issues-rpc.md` 작성.

명시:
- RPC 시그니처 (`community_hot_issues(hours_window int, result_limit int)`)
- API 응답 형식
- 트렌드 분류 임계값 (1.2배 이상 UP, 0.8배 미만 DOWN)
- T15에 안내: 캐시 5분이므로 메인 SSR/ISR에서 직접 호출 가능

## 안티패턴

- `community_*` 테이블 스키마 변경 금지 (T01)
- 다른 RPC 추가 금지 (hot_issues만)
- `mock-coins.ts` 수정 금지 (T15)
- `/api/coins/ticker` 수정 금지 (T03)
