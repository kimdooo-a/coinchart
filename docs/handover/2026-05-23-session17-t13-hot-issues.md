# 인수인계서 — 세션 17 (R1/T13 일꾼: hot-issues-rpc, 코드 사전 완료·handover 신규)

> 작성일: 2026-05-23
> 이전 세션: [session16 = R1/T02 일꾼](./2026-05-23-R1-T02-community-seed.md)
> 본 일꾼 산출 handover: [2026-05-23-R1-T13-hot-issues-rpc.md](./2026-05-23-R1-T13-hot-issues-rpc.md)
> 일꾼 작업 지시서: `docs/orchestration/2026-05-23-R1-mainpage/T13-hot-issues-rpc.md`
> 선행 의존: [R1/T01 community 마이그레이션](./2026-05-23-R1-T01-community-migrations.md)

---

## 작업 요약

사용자 T13 발사 명령 + SessionStart hook 마커 **T11**(시각 페이지 라이트화, `app/signal/`·`app/market/`·`app/stock-market/`·`components/Signal/`·`components/Market/`·`components/Stock/` 허용 경로) 충돌 → **사용자 명시 지시 우선** 채택 (CLAUDE.md 우선순위 1, 세션 9 T08 / 세션 14 T07 패턴). T13(hot-issues 집계 RPC + API 라우트) 진행 시도 → 사전 상태 점검에서 산출물 일체가 이미 워킹트리에 존재 발견(SQL 65줄 + 라우트 50줄 + `_API_REFERENCE.md` L645~681 append). **handover만 미작성** 상태 → 본 세션 책임: 코드 무변경 + handover 신규 작성(157줄) + cs 5종. 검증 본 일꾼 4종 PASS, `npm run build`는 다른 일꾼 미커밋 영향으로 본 일꾼 SKIP(사후 system reminder로 Compiled OK 인지).

본래 세션 16으로 시작 → cs 단계 진입 시 동일 날짜 다른 터미널(T02 일꾼)이 세션 16 슬롯 점유 발견 → **17로 정정** (세션 14 13→14 패턴 준용).

## 대화 다이제스트

### 토픽 1: 사용자 T13 vs hook T11 — 사용자 우선 채택

> **사용자**: "T13 — hot-issues 집계 RPC + API. `docs/orchestration/2026-05-23-R1-mainpage/T13-hot-issues-rpc.md` 정독·실행. 완료 시 `docs/handover/2026-05-23-R1-T13-hot-issues-rpc.md` 작성."

SessionStart hook payload 마커 = **T11**, 허용 경로 = `app/signal/;app/market/;app/stock-market/;components/Signal/;components/Market/;components/Stock/;docs/handover/`. T13 산출물 경로(`supabase/migrations/`, `app/api/coins/hot-issues/`, `docs/references/_API_REFERENCE.md`)와 **100% 불일치** → PreToolUse hook 차단 위험 인지. 그러나 사용자가 발사 프롬프트에서 명시적으로 T13을 지정하였고, CLAUDE.md 우선순위 1(사용자 명시 지시 > 스킬 > 기본 시스템) + 세션 9 T08(사용자 명시) / 세션 14 T07(사용자 명시) 패턴이 일관 → **T13 채택**.

**실제로는 hook 차단 미발생**: T13 산출물이 이미 워킹트리 untracked로 존재했고, 본 일꾼은 Write/Edit를 시도조차 하지 않았다(사전 완료 발견). handover 작성은 `docs/handover/` 허용 경로라 통과.

**결론**: T13 진행. 세션 10/11/12(hook 우선) vs 세션 9/14(사용자 우선) 분기에서 후자 패턴 재현.

### 토픽 2: T13 산출물 사전 완료 + handover만 신규 — 하이브리드 패턴

T13 작업 지시서 정독 + 본 일꾼 책임 경로 5종 사전 Read:

| 파일 | 사전 상태 | 비고 |
|---|---|---|
| `supabase/migrations/20260523_create_hot_issues_rpc.sql` | ✓ 존재 (65줄) | `community_hot_issues(hours_window int, result_limit int)` RPC, STABLE plpgsql, GRANT anon/authenticated, COMMENT ON FUNCTION 포함 |
| `app/api/coins/hot-issues/route.ts` | ✓ 존재 (50줄) | `GET /api/coins/hot-issues?hours=&limit=`, revalidate 300s, 입력 클램프(1~168/1~50), `await createClient()` 패턴 |
| `docs/references/_API_REFERENCE.md` L645~681 | ✓ append 완료 | T13 섹션. T12 미커밋 board/community 섹션(170줄)과 동일 파일 혼재 |
| `docs/handover/2026-05-23-R1-T13-hot-issues-rpc.md` | **미존재** | 본 일꾼 작성 책임 |
| 의존 SQL 객체 (T01) | ✓ 머지 완료 | `community_posts(coin_symbol, is_deleted, created_at)` + 부분 인덱스 |

코드는 spec 1:1 복사가 아니라 **spec보다 우수한 보정** 포함:
- spec L97 `import { createServerClient } from "@/lib/supabase/server"` + 동기 호출 → 실제는 `await createClient()` (Next 16 async 패턴, `app/api/news/route.ts:3` 일치)
- 입력 클램프 강화(`Math.min(168, Math.max(1, hours))`)
- COMMENT ON FUNCTION 추가 (운영 가독성)

→ 덮어쓰면 손실 발생. **그대로 두고 handover만 작성**으로 결정. 세션 14/15(코드 0건 검증 전용)와 달리 본 세션은 **handover 신규 작성**까지 책임지는 하이브리드.

**결론**: 코드 0줄 추가 + handover 157줄 신규. handover에 spec 보정 경위 §"API 응답 형식"에 명시.

### 토픽 3: handover 신규 작성 — T15 인계 4종 + 알려진 이슈 5건

`docs/handover/2026-05-23-R1-T13-hot-issues-rpc.md` (157줄) 구성:

| 섹션 | 핵심 |
|---|---|
| 작업 요약 | 데이터 공급선 한정·위젯 연동은 T15 |
| RPC 시그니처 | 인자/반환 테이블 + STABLE + GRANT + 의존 SQL 객체(T01 인덱스 재활용 명시) |
| API 응답 형식 | JSON 예시 + 쿼리 파라미터 클램프 + 캐시 + `createClient` 보정 경위 |
| 트렌드 분류 임계값 | 1.2/0.8 대칭 + 임계 선정 근거 + score 가중치 |
| **T15에게 줄 메모** | (1) trend `UP/DOWN/NEW/FLAT` → 위젯 `up/down/new/same` 매핑 코드 스니펫 ②`symbol`만 반환·사람친화 keyword는 별도 사전 ③`delta`는 클라이언트 계산 ④ 502/빈 결과 graceful degrade |
| 검증 결과 | tsc/eslint/grep 2개 + npm run build Compiled OK 사후 갱신 인지 |
| 안티패턴 회피 체크 | 6항목 (T01 영역 무수정·추가 RPC 0·mock-coins 미수정·ticker 미수정·HotIssueWidget 미수정·SCHEMA 미수정) |
| 알려진 이슈 / 후속 결정 | 5건 (coin_symbol enum·keyword 사전·delta 계산·STABLE+NOW 경계·모니터링) |

**T15 핵심 코드 스니펫** (handover §"T15에게 줄 메모"에서 발췌):
```ts
const TREND_MAP = { UP: "up", DOWN: "down", NEW: "new", FLAT: "same" } as const;
```

**결론**: T15가 메인페이지 hydrate 시 즉시 사용 가능한 상태. mock fallback 패턴까지 명시.

### 토픽 4: 검증 — 본 일꾼 4종 PASS + `npm run build` 사후 갱신 인지

| 검증 | 결과 | 비고 |
|---|---|---|
| `grep -c "CREATE OR REPLACE FUNCTION\|GRANT EXECUTE"` (SQL) | **2** (기대 ≥2) ✓ | RPC 정의 + 권한 부여 모두 |
| `grep -c "rpc(\"community_hot_issues\""` (route) | **1** (기대 1) ✓ | Supabase RPC 호출 1회 |
| `npx tsc --noEmit` | 출력 없음 (전역 0 에러) ✓ | bcryptjs 해소 상태 유지 |
| `npx eslint app/api/coins/hot-issues/route.ts` | 0 errors ✓ | deprecated `.eslintignore` 경고만 |
| `npm run build` | **본 일꾼 SKIP** | 다른 일꾼(T10/T08/T14/T02/T12) 미커밋 다수로 본 산출물 단독 검증 불가. 사후 system reminder로 "Compiled successfully in 35.4s, `ƒ /api/coins/hot-issues` 동적 라우트 등록" 확인 |

**부수 경고**: `lib/community/ip-mask.ts:3:1 import crypto from "node:crypto"` 사전 존재 경고 — T07 영역, 본 작업 무관.

**결론**: T13 본 산출물 그린. 본 일꾼 책임 4종 PASS + 사후 빌드 갱신 인지.

### 토픽 5: /cs 슬롯 충돌 — 16→17 정정

cs 단계 진입 시 `docs/logs/journal-2026-05-23.md` Read 결과 동일 날짜 다른 터미널(T02 일꾼)이 세션 16을 이미 점유한 항목(`L400~L481, "세션 16 (R1/T02 일꾼 — community 시드 스크립트)"`) 발견. 본래 16으로 진행 의도였으나 세션 14의 13→14 정정 패턴 준용하여 **17로 정정**.

current.md / journal / 2026-05.md / next-dev-prompt 모두 17 기준으로 작성.

**결론**: 슬롯 정정 완료. R1 일꾼 누적 17세션.

### 토픽 6: cs 커밋 범위 — 본 일꾼 책임 한정 + `_API_REFERENCE.md` 컨덕터 위임

git status 결과 워킹트리에 R1 다른 일꾼·후속 라운드 산출물 다수 잔존:

- **수정 (M)**: `.gitignore`, `app/analysis/*` 5개 (T10), `components/Blog/editor/*` 2개 (T08 후속), `components/global-header.tsx` (T14 후속), `docs/references/_API_REFERENCE.md` (T12 170줄 + 본 세션 T13 38줄 혼재), `lib/translations.ts`, `package*.json`
- **untracked (??)**: `.claude/hooks/`, `.claude/settings.json`, `app/api/board/` (T12), `app/api/community/` (T12), R1 T08/T10/T12/T14 handover 4종, `docs/orchestration/`, `docs/solutions/2026-05-23-lightweight-charts-v5-colortype-enum.md`, `lib/chart/` (T08)

**`_API_REFERENCE.md` 분리 staging 불가** — T12(board/community) 누적 변경과 본 세션 T13(38줄)이 동일 파일 혼재. `git add -p`로 hunk 단위 분리 가능하지만 cs 컨벤션상 위험 → **컨덕터 통합 커밋에 위임**. 세션 12 T04 패턴 준용.

본 일꾼 staging 범위:
1. `supabase/migrations/20260523_create_hot_issues_rpc.sql` (T13 신규)
2. `app/api/coins/hot-issues/route.ts` (T13 신규)
3. `docs/handover/2026-05-23-R1-T13-hot-issues-rpc.md` (T13 신규)
4. `docs/handover/2026-05-23-session17-t13-hot-issues.md` (본 인수인계서 신규)
5. `docs/status/current.md` (세션 17 메타)
6. `docs/logs/2026-05.md` (세션 17 append)
7. `docs/handover/next-dev-prompt.md` (세션 17 항목 + T13 산출물 반영)
8. `docs/logs/journal-2026-05-23.md` (세션 17 저널 — 세션 15 패턴 준용)

**결론**: 본 일꾼 책임 한정 커밋 8건. `_API_REFERENCE.md` + 다른 일꾼 산출물은 컨덕터 영역.

## 의사결정 요약

| # | 결정 | 선택지 | 선택 이유 |
|---|------|--------|----------|
| 1 | 사용자 T13 vs hook T11 → T13 채택 | (a) 사용자 명시 (b) hook 마커 | CLAUDE.md 우선순위 1 + 세션 9/14 패턴 일관성. hook 허용 경로(`app/signal/` 등)와 T13 경로(`app/api/coins/hot-issues/` 등) 100% 불일치라 차단 위험 인지했으나 사용자 우선 |
| 2 | T13 산출물 사전 발견 → handover만 신규 | (a) 재작성 (b) 검증 전용 (c) handover 작성 | spec 100% + 우수 보정 상태로 덮어쓰면 손실. 세션 14/15(코드 0건 검증)와 달리 handover 미존재 → 신규 작성 책임 |
| 3 | `npm run build` 본 일꾼 SKIP | (a) 실행 (b) SKIP | 다른 일꾼 미커밋 변경 다수로 본 산출물 단독 검증 불가. 사후 system reminder로 Compiled OK 인지로 충족 |
| 4 | 세션 16 → 17 정정 | (a) 16 유지 (b) 17 정정 | T02 일꾼이 16 슬롯 점유. 세션 14의 13→14 정정 패턴 준용 |
| 5 | 커밋 범위 — 본 일꾼 8건 한정 | (a) 워킹트리 전체 (b) 본 책임만 | `_API_REFERENCE.md` T12 누적 혼재 + 다른 일꾼 산출물은 컨덕터 영역. 세션 10/12/14/15/16 일꾼 패턴 준용 |

## 수정/신규 파일 (본 일꾼 책임 8건)

| # | 파일 | 종류 | 변경 내용 |
|---|------|------|-----------|
| 1 | `supabase/migrations/20260523_create_hot_issues_rpc.sql` | 인수(untracked) | `community_hot_issues(int,int)` RPC + GRANT + COMMENT, 65줄 |
| 2 | `app/api/coins/hot-issues/route.ts` | 인수(untracked) | GET 라우트 + revalidate 300s + 입력 클램프, 50줄 |
| 3 | `docs/handover/2026-05-23-R1-T13-hot-issues-rpc.md` | 신규(본 세션) | T13 인수인계서 157줄 (T15 매핑 가이드 코드 스니펫 포함) |
| 4 | `docs/handover/2026-05-23-session17-t13-hot-issues.md` | 신규(본 세션) | 본 세션 메타 인수인계서 |
| 5 | `docs/status/current.md` | 수정 | 마지막 세션 메타 17, 작업 이력/세션 요약표 1행 추가 |
| 6 | `docs/logs/2026-05.md` | 수정 | 세션 17 항목 append (최상단) |
| 7 | `docs/handover/next-dev-prompt.md` | 수정 | "최근 완료된 작업" 세션 17 항목 + HotIssueWidget hydrate 안내 |
| 8 | `docs/logs/journal-2026-05-23.md` | 수정 | 세션 17 항목 append (T13 사후 검증·handover 작성 6 토픽) |

## 검증 결과 (본 세션 코드 0건, T13 사후 검증)

- `grep -c "CREATE OR REPLACE FUNCTION\|GRANT EXECUTE" supabase/migrations/20260523_create_hot_issues_rpc.sql` → **2** ✓
- `grep -c "rpc(\"community_hot_issues\"" app/api/coins/hot-issues/route.ts` → **1** ✓
- `npx tsc --noEmit` → 전역 0 에러 ✓
- `npx eslint app/api/coins/hot-issues/route.ts` → 0 errors ✓ (deprecated `.eslintignore` 경고만)
- `npm run build` (사후 갱신) → Compiled successfully in 35.4s ✓ (`ƒ /api/coins/hot-issues` 동적 라우트 등록)

## 터치하지 않은 영역

- T13 코드 일체 (사전 완료 그대로 인수, 수정 0건)
- `lib/community/mock-coins.ts` `HOT_ISSUES` 상수 — T15 영역
- `components/community/widgets/HotIssueWidget.tsx` — T15 영역 (props 매핑은 T15가 처리)
- R1 다른 일꾼 산출물 (T08/T10/T12/T14, T02/T07 후속) — 컨덕터 통합 영역
- `_API_REFERENCE.md` (T12 누적 혼재 분리 staging 불가) — 컨덕터 영역
- `_SCHEMA_REFERENCE.md` (RPC는 API 레퍼런스에만 기록, SCHEMA는 T01 영역)
- `.claude/hooks/`, `.claude/settings.json` — 시스템 영역
- `docs/orchestration/` — dispatch 영역

## 알려진 이슈

- **컨덕터 통합 대기**: `_API_REFERENCE.md` T12 board/community 섹션(170줄) + 본 세션 T13 섹션(38줄) 혼재 → 컨덕터가 일괄 통합 커밋 예정. 다른 일꾼(T08/T10/T12/T14) 산출물도 동시 통합 대상.
- **T13 후속 결정 5건** (R1-T13 handover §"알려진 이슈 / 후속 결정 필요" 참조):
  1. `coin_symbol` enum 미강제 (T01 인계 §1 연결) → T15에서 화이트리스트 필터 권장
  2. 사람친화 keyword 미제공 → 별도 사전 또는 후속 RPC 컬럼 추가
  3. `delta` 미제공 → 클라이언트에서 `recent_count - prev_count` 계산 가능
  4. STABLE 캐싱과 NOW() 시계 경계 → 실용상 무시 가능, 정확성 필요 시 `now_ts` 인자화
  5. 모니터링 미부착 → 메인 SSR 핫경로화 시 관측성 부착
- **세션 번호 충돌 보정**: 본 세션 16→17 정정. 세션 14 13→14 패턴 재현.

## 다음 작업 제안

1. **컨덕터 통합 커밋** — R1 다른 일꾼(T08/T10/T12/T14) 산출물 + `_API_REFERENCE.md` T12 board/community 섹션 + 본 세션 T13 섹션 통합. `M package*.json`(bcryptjs 설치), `.gitignore`, `.claude/hooks/`, `.claude/settings.json`, `docs/orchestration/`, `docs/solutions/` 동시 포함.
2. **T15 메인페이지 hydrate** — T03 `/api/coins/ticker`, T04 `/api/fng`, T05/T06 분류 API, **T13 `/api/coins/hot-issues`(본 세션)** 모두 준비 완료. T15가 `app/page.tsx` 더미를 실데이터로 교체 가능. HotIssueWidget은 `TREND_MAP = { UP:"up", DOWN:"down", NEW:"new", FLAT:"same" }` + 빈 결과/502 graceful degrade 필요.
3. **T02 시드 적용 후 hot-issues 실데이터 확인** — `npx tsx scripts/seed-community.ts` 실행 → `SELECT * FROM community_hot_issues(24, 5)` smoke → 메인페이지 위젯 검증 순서.
4. **R2 라운드 진입 검토** — T09(signal-lightify), T11(market/stock-market-lightify), T15(메인 hydrate), EditorToolbar ToolButton tone-aware 색상(세션 9 T08 권고).

---
[← handover/_index.md](./_index.md)
