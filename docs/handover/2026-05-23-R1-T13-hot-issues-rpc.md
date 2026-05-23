# 인수인계서 — R1 / T13 hot-issues-rpc

> 작성일: 2026-05-23
> 라운드: R1 (mainpage)
> 일꾼: T13
> 의존: T01 (`community_posts.coin_symbol` 컬럼)
> 산출물: 마이그레이션 1 + API 라우트 1 + `_API_REFERENCE.md` append

---

## 작업 요약

메인페이지 사이드바 `HotIssueWidget`의 실데이터 공급용 집계 RPC와 API 라우트를 작성. 더미 `HOT_ISSUES` 상수(`lib/community/mock-coins.ts`)를 대체할 백엔드 계약을 확정. 본 일꾼은 **데이터 공급선만** 만들고, 위젯 연동(props 매핑·로딩 상태·trend 라벨 변환)은 T15가 수행.

## 산출물

### 신규
- `supabase/migrations/20260523_create_hot_issues_rpc.sql` (65줄)
- `app/api/coins/hot-issues/route.ts` (50줄)

### 수정 (append-only)
- `docs/references/_API_REFERENCE.md` (`### GET /api/coins/hot-issues` 섹션, L645~681)

---

## RPC 시그니처 — `community_hot_issues(hours_window int, result_limit int)`

| 인자 | 타입 | 기본 | 비고 |
|---|---|---|---|
| `hours_window` | `int` | 24 | 집계 윈도우 (시간) |
| `result_limit` | `int` | 10 | 결과 행 수 상한 |

**반환** `TABLE`:

| 컬럼 | 타입 | 의미 |
|---|---|---|
| `symbol` | `text` | `community_posts.coin_symbol` 원본 (예: BTC/ETH/XRP/SOL/ALT/KIMP) |
| `recent_count` | `bigint` | 최근 N시간 내 글 수 |
| `prev_count` | `bigint` | 직전 N시간(=2N~N 시간 전) 내 글 수 (NULL 시 0) |
| `trend` | `text` | `"UP" | "DOWN" | "FLAT" | "NEW"` |
| `score` | `numeric` | 정렬 가중치 = `recent_count + prev_count * 0.3` |

**STABLE 함수** — 동일 트랜잭션 내 동일 결과 보장. 보안: `GRANT EXECUTE TO anon, authenticated` (RLS는 `community_posts` SELECT 정책으로 강제).

**의존 SQL 객체** (T01 산출):
- 테이블 `community_posts(coin_symbol text, is_deleted bool, created_at timestamptz)`
- 인덱스 `idx_community_posts_coin_created (coin_symbol, created_at DESC) WHERE is_deleted = false` — 본 RPC의 `recent` / `prev` CTE 양쪽이 이 인덱스를 그대로 활용. 추가 인덱스 불필요.

---

## API 응답 형식 — `GET /api/coins/hot-issues`

```json
{
  "items": [
    { "rank": 1, "symbol": "BTC", "count": 87, "trend": "UP",   "score": 91.6 },
    { "rank": 2, "symbol": "ETH", "count": 42, "trend": "FLAT", "score": 53.3 },
    { "rank": 3, "symbol": "SOL", "count": 18, "trend": "NEW",  "score": 18.0 }
  ],
  "ts": 1747958400000
}
```

**쿼리 파라미터** (모두 선택):
- `hours` — 기본 24, 서버 클램프 1~168
- `limit` — 기본 10, 서버 클램프 1~50

**캐시**: Next `revalidate = 300` (5분). RPC가 STABLE이라 캐시 안전.
**에러**: `500 { error: string }`.
**Supabase 호출**: `lib/supabase/server.ts`의 `createClient()` (async) 사용 — 명세서는 `createServerClient` 표기였으나 실제 export는 `createClient`. 프로젝트 기존 패턴(`app/api/news/route.ts`)과 일치하도록 보정.

---

## 트렌드 분류 임계값

CTE `recent`(최근 N시간) vs `prev`(직전 N시간) 카운트 비교:

| 조건 | trend | 설명 |
|---|---|---|
| `prev IS NULL OR prev = 0` | `"NEW"` | 신규 등장 (직전 윈도우 0건) |
| `recent / prev > 1.2` | `"UP"` | 20% 이상 증가 |
| `recent / prev < 0.8` | `"DOWN"` | 20% 이상 감소 |
| 그 외 | `"FLAT"` | ±20% 이내 변동 |

**임계 선정 근거**: 1.2 / 0.8 대칭. 너무 좁으면 모두 UP/DOWN, 너무 넓으면 FLAT 일색. 초기값으로 1.2/0.8 채택, 운영 데이터 누적 후 조정 여지.

**정렬 score**: `recent + prev * 0.3`. 최근 활동 우위, 직전 활동도 가중치 30% 반영 → 일시적 급등(완전 신규)이 안정 지속 항목을 항상 밀어내지 않게 보정.

---

## T15(메인페이지 SSR/ISR)에게 줄 메모

- **캐시 5분이므로 직접 호출 가능**. 메인 페이지에서 `await fetch('/api/coins/hot-issues', { next: { revalidate: 300 } })` 또는 동일 도메인 fetch로 호출하면 Next 캐시가 RPC 결과를 5분 단위로 공유. SSR/ISR 어느 쪽이든 OK.
- **위젯 인터페이스 변환 책임은 T15**. 현 `HotIssueWidget` props (`components/community/widgets/HotIssueWidget.tsx`):
  - `rank: number` ← API `rank` 그대로
  - `keyword: string` ← API `symbol` (예: "BTC")을 그대로 쓸지, 라벨 매핑(예: "비트코인 ETF") 쓸지 결정 필요. 현 RPC는 **symbol만** 반환. 사람 친화 키워드가 필요하면 별도 디스플레이 사전(예: `COIN_LABEL[symbol]`) 또는 후속 트랙에서 RPC 확장.
  - `trend: "up" | "down" | "new" | "same"` ← API `"UP" | "DOWN" | "NEW" | "FLAT"` → **소문자 + "FLAT→same" 매핑** 필요:
    ```ts
    const TREND_MAP = { UP: "up", DOWN: "down", NEW: "new", FLAT: "same" } as const;
    ```
  - `delta?: number` ← 현 API 미반환. 필요 시 `recent_count - prev_count` 계산해 클라이언트에서 부여하거나, 후속 RPC 확장.
- **빈 결과(items.length === 0)**: 새 커뮤니티라 게시글이 적은 초기에는 빈 배열 가능. 위젯에 "아직 핫이슈가 없습니다" 빈 상태 디자인이 필요.
- **에러 응답**: API가 500 반환 시 위젯은 mock fallback(`HOT_ISSUES`) 또는 빈 상태로 graceful degrade 권장. 메인 페이지 전체를 깨지 않도록.
- **fetch 실패 격리**: 메인 SSR이 핫이슈 fetch에 의존하지 않도록 try/catch로 감싸고, 실패 시 빈 배열 또는 mock으로 폴백.

---

## 검증 결과

| 항목 | 결과 |
|---|---|
| `grep -c "CREATE OR REPLACE FUNCTION\|GRANT EXECUTE"` (SQL) | **2** (기대 ≥2) ✓ |
| `grep -c "rpc(\"community_hot_issues\""` (route) | **1** (기대 1) ✓ |
| `npx tsc --noEmit` | 출력 없음 (본 작업 신규 에러 0) ✓ |
| `npx eslint app/api/coins/hot-issues/route.ts` | 에러 0 (`.eslintignore` 폐기 경고만) ✓ |
| `npm run build` | **Compiled successfully in 35.4s** ✓ — `ƒ /api/coins/hot-issues` 동적 라우트로 등록됨. 사전 존재 경고 1건(`lib/community/ip-mask.ts:3:1` `import crypto from "node:crypto"`)은 T07 영역으로 본 작업과 무관. |

**Supabase 마이그레이션 적용 검증 (사용자/배포 단계)**:
```bash
# 로컬
supabase db push   # 또는 psql -f supabase/migrations/20260523_create_hot_issues_rpc.sql

# RPC 호출 smoke
psql -c "SELECT * FROM community_hot_issues(24, 5);"
# 기대: 0~5 행 (게시글 데이터 유무에 따라)
```

---

## 안티패턴 회피 체크

- ✅ `community_*` 테이블 스키마 변경 0건 (T01 영역)
- ✅ 추가 RPC 0건 (hot_issues 단독)
- ✅ `lib/community/mock-coins.ts` 미수정 (T15 영역) — `HOT_ISSUES` 상수는 그대로 둠
- ✅ `/api/coins/ticker/route.ts` 미수정 (T03 영역)
- ✅ `HotIssueWidget.tsx` 미수정 (T15 영역) — props 매핑은 T15가 처리
- ✅ `_SCHEMA_REFERENCE.md` 미수정 (RPC는 `_API_REFERENCE.md`에만 기록)

## 알려진 이슈 / 후속 결정 필요

1. **`coin_symbol` enum 미강제**(T01 인계 사항 1번과 연결): RPC가 받는 `symbol`은 자유 텍스트라, 예기치 못한 값(예: 오타로 "BTV")이 결과에 섞일 수 있음. 표시 단계에서 화이트리스트(`mock-coins.ts`의 6종)로 필터 권장 — **T15에서 처리**.
2. **사람 친화 keyword 미제공**: 현 RPC는 `symbol`만. UI가 "비트코인 ETF" 같은 키워드를 원하면 별도 사전 또는 후속 트랙에서 RPC 컬럼 추가(예: 게시글 `tags[]` 또는 `title` n-gram).
3. **`delta` 미제공**: `HotIssueWidget`의 `delta?: number`는 순위 변동치를 의미하지만 현 RPC는 "전 순위" 개념이 없다. 의도가 "전 윈도우 순위 대비 변동"이라면 별도 윈도우 함수 추가 필요. 의도가 단순 카운트 차이라면 `recent_count - prev_count`로 클라이언트 계산 가능.
4. **STABLE 캐싱과 시계 경계**: `NOW()` 기반이라 동일 트랜잭션은 STABLE이지만, Next revalidate(5분)와 DB time 경계가 어긋날 수 있음. 실용상 무시 가능, 정확성이 중요해지면 함수 인자로 `now_ts` 받기.
5. **모니터링 미부착**: 호출 빈도/지연 측정 없음. 메인 페이지 SSR 의존이 생기면 핫경로이므로, 후속에서 `app/api/coins/hot-issues/route.ts`에 `console.timeEnd` 또는 관측성 트랙 부착 고려.

## 참조

- 작업 명세: `docs/orchestration/2026-05-23-R1-mainpage/T13-hot-issues-rpc.md`
- 선행 인수인계: `docs/handover/2026-05-23-R1-T01-community-migrations.md` (특히 §"T13에게 줄 메모")
- 선행 마이그레이션: `supabase/migrations/20260523_create_community_tables.sql`
- 위젯 인터페이스: `components/community/widgets/HotIssueWidget.tsx`
- mock 데이터 (대체 대상): `lib/community/mock-coins.ts` (`HOT_ISSUES` 상수)
- Supabase 서버 클라이언트 패턴: `lib/supabase/server.ts` / `app/api/news/route.ts`
- 산출 SQL: `supabase/migrations/20260523_create_hot_issues_rpc.sql`
- 산출 라우트: `app/api/coins/hot-issues/route.ts`
- 갱신된 레퍼런스: `docs/references/_API_REFERENCE.md` (§ `GET /api/coins/hot-issues`)
