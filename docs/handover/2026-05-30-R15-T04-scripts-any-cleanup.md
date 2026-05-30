# R15 T04 — scripts/ any 타입 정리 (인수인계)

**작성일**: 2026-05-30
**라운드**: R15 tech-debt
**작업자**: 일꾼 터미널 (worker)
**상태**: ✅ 완료

---

## 요약

`scripts/` 디렉토리의 `any` 타입을 **동작 보존** 원칙하에 점진 정리.
- **Before**: `any` 출현 **11곳 / 8파일**
- **After**: `any` 출현 **0곳**
- `npx tsc --noEmit` **EXIT 0** (Before/After 모두)
- 런타임 로직 변경 **없음** (타입 정밀화만 수행)

---

## 현황 집계 (Before)

| 파일 | any 위치 | 종류 |
|------|----------|------|
| `scripts/batch/aggregate-daily.ts` | L54, L55 | `r: any` (reduce 콜백 ×2) |
| `scripts/check-watchlist-schema.ts` | L33, L39 | `as any` (에러 캐스트 ×2) |
| `scripts/cron/refresh-crypto.ts` | L66 | `results: any[]` |
| `scripts/cron/refresh-stock.ts` | L63 | `results: any[]` |
| `scripts/diagnostics/check-data-freshness.ts` | L38, L49 | `Record<string, any[]>`, `as any` |
| `scripts/healthcheck/verify-deployment.ts` | L38 | `checks: any[]` |
| `scripts/seed/seed-crypto.ts` | L52 | `errors: any[]` |
| `scripts/smoke/watchlist-sync.ts` | L28 | `payload: any` |

**합계: 11곳 / 8파일**

> 참고: T04 지침서는 "16파일"로 명시했으나 `scripts/` 내 실제 `.ts` 파일은 9개(`preflight/check-env.ts` 포함)이며, 그중 `any`를 포함한 파일은 8개였다. `check-env.ts`는 `any` 미포함이라 미수정.

---

## 수정 내역 (파일별)

### 1. `scripts/batch/aggregate-daily.ts`
- `rows`는 이미 `OhlcvRow[]`로 타입 확정 → reduce 콜백 매개변수 `r: any` → `r: OhlcvRow` (2곳)
- 동작 동일 (`r.close`, `r.volume` 접근 유지)

### 2. `scripts/check-watchlist-schema.ts`
- L33: `const err = cntErr as any` → `const err = cntErr`
  - `cntErr`는 `if (cntErr)` 가드 내부에서 `PostgrestError`로 좁혀지며 `.message`/`.code` 모두 보유 → 캐스트 불필요
- L39: catch 블록 `const err = e as any` → `const err = e as Error`
  - 코드베이스 기존 패턴(`refresh-crypto.ts`의 `e as Error`)과 일치, `.message` 접근 보존

### 3. `scripts/cron/refresh-crypto.ts`
- `RefreshResult` 인터페이스 신규 정의 (`symbol`, `interval`, `count?`, `ok`, `error?`)
- `const results: any[]` → `const results: RefreshResult[]`
- push되는 두 형태(`{symbol,interval,count,ok:true}` / `{symbol,interval,ok:false,error}`)와 `.filter(r => !r.ok)` 모두 호환

### 4. `scripts/cron/refresh-stock.ts`
- `RefreshResult` 인터페이스 신규 정의 (`symbol`, `count?`, `ok`, `error?`)
- `const results: any[]` → `const results: RefreshResult[]`

### 5. `scripts/diagnostics/check-data-freshness.ts`
- `OhlcvSelectRow` 인터페이스 신규 정의 (`symbol`, `interval`, `ts`)
- `Record<string, any[]>` → `Record<string, OhlcvSelectRow[]>`
- `const latest = rows[0] as any` → `const latest = rows[0]` (타입 좁혀져 캐스트 불필요)
- supabase 클라이언트가 `Database` 제네릭 없이 생성되어 `data`가 `any[]`이므로 push 호환성 문제 없음

### 6. `scripts/healthcheck/verify-deployment.ts`
- 기존 `CheckResult` 인터페이스 재활용 → `const checks: any[]` → `const checks: CheckResult[]`

### 7. `scripts/seed/seed-crypto.ts`
- `SeedError` 인터페이스 신규 정의 (`symbol`, `interval`, `error`)
- `const errors: any[]` → `const errors: SeedError[]`

### 8. `scripts/smoke/watchlist-sync.ts`
- 기존 `WatchlistItem` 인터페이스 재활용 → `const payload: any` → `const payload: WatchlistItem`

---

## 검증

```bash
# any 잔여 집계 (After)
grep -rcE "\bany\b" scripts/   # → 0 (any 없음)

# 타입 컴파일
npx tsc --noEmit               # → EXIT 0
```

- ✅ `npx tsc --noEmit` EXIT 0
- ✅ any 출현 11 → 0
- ✅ 런타임 로직 변경 없음 (타입 주석/인터페이스 추가만)

---

## 완료 조건 (DoD) 체크

| 항목 | 상태 |
|------|------|
| `npx tsc --noEmit` EXIT 0 | ✅ |
| any 출현 횟수 감소 (11→0) | ✅ |
| 동작 변경 없음 | ✅ |
| handover 작성 | ✅ (본 문서) |

---

## 지휘자 인계 사항

- **커밋 미수행**: 지침대로 일꾼은 작업만, 커밋은 지휘자 터미널이 통합 수행.
- 수정 파일 8개: `scripts/batch/aggregate-daily.ts`, `scripts/check-watchlist-schema.ts`, `scripts/cron/refresh-crypto.ts`, `scripts/cron/refresh-stock.ts`, `scripts/diagnostics/check-data-freshness.ts`, `scripts/healthcheck/verify-deployment.ts`, `scripts/seed/seed-crypto.ts`, `scripts/smoke/watchlist-sync.ts`
- 추가된 인터페이스: `RefreshResult`(crypto/stock 각 1), `OhlcvSelectRow`, `SeedError` — 모두 로컬 스코프(각 스크립트 파일 내), `types/` 전역 영향 없음.
- scripts/ 외 파일 수정 없음 (타 일꾼 충돌 없음).

**끝.**
