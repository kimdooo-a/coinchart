# T04 — watchlist 회원 sync 런타임 스모크 절차서 + 자동화 스크립트

## 1. 컨텍스트

- 프로젝트: Crypto Chart Analysis (코인 차트 분석)
- 작업 디렉토리(쓰기 허용): **`scripts/smoke/` (신규) + `docs/db/` 만**
- 본 터미널 역할: **T04 / 4** — R12에서 구축한 watchlist 회원 동기화(localStorage → 운영 DB `user_watchlist`)가 **런타임에 실제로 동작하는지** 검증할 수 있는 **재현 가능한 절차서 + 자동화 스크립트**를 작성
- 라운드: **R14 (loose-ends)** / Wave 1 (독립)

## 2. 배경 (왜 이 작업인가)

R12(세션 38·39)에서 watchlist 익명 우선 MVP + 회원 DB 동기화를 구현하고 운영 DB에 `user_watchlist`(RLS 4종)를 적용했으나, **회원 sync 런타임 검증은 PENDING**(정적 검증만 통과). 실제 흐름 — 익명 localStorage 관심종목 → 로그인 시 DB로 sync → 다른 기기에서 복원 — 이 동작하는지 확인하는 **절차와 자동 검증 수단**이 없다.

> ⚠️ 실 회원 브라우저 로그인은 **자격증명이 필요**해 본 터미널이 직접 수행할 수 없다. 따라서 본 작업은 **(a) 사람이 따라 할 절차서 + (b) 자격증명 없이 service_role로 DB 측을 검증하는 자동 스크립트**를 산출하는 것이다. 실 로그인 단계는 절차서로 사용자에게 위임.

## 3. 공통 SOT (읽기 전용 — 검증 대상 코드)

```
components/hooks/useWatchlist.ts        익명 localStorage ↔ 회원 DB sync 로직 (D3)
lib/supabase/watchlist.ts               watchlist SSOT (DB CRUD)
app/api/watchlist/route.ts              GET/POST/PATCH(reorder)/DELETE(?all) 엔드포인트
app/api/watchlist/sync/route.ts         로그인 시 localStorage→DB 병합 sync 엔드포인트
lib/config/local-data.ts                localStorage 키(cca:watchlist 계열) SSOT
docs/handover/2026-05-30-session39-r12-wave2.md   user_watchlist 운영 DB 적용 기록(RLS4·schema_migrations)
docs/handover/2026-05-30-R12-_SUMMARY.md          R12 전체 마감 요약
docs/references/_SCHEMA_REFERENCE.md              user_watchlist 테이블 스키마
docs/references/_API_REFERENCE.md                 watchlist API 스펙
```

운영 DB 접근 방식(이전 라운드 확립): `.env.local`의 `SUPABASE_SERVICE_ROLE_KEY` + Management API `database/query` 또는 supabase-js service_role 클라이언트. `.env.local`은 UTF-8 BOM이라 supabase CLI는 거부 → service_role 직접 쿼리 경로 사용. (참조: 메모리 `env-local-utf8-bom`)

## 4. 작업 목표

### 4-1. 스모크 절차서 — `docs/db/R14-watchlist-sync-smoke.md`

사람이 그대로 따라 실행할 수 있는 단계별 체크리스트:

1. **사전**: dev 서버 기동(`npm run dev`), 테스트 회원 계정 1개(이메일/OAuth) 준비.
2. **익명 단계**: 비로그인 상태로 `/watchlist`(또는 코인룸)에서 관심종목 2~3개 추가 → localStorage(`cca:watchlist`)에 적재 확인(DevTools).
3. **sync 트리거**: 로그인 → `useWatchlist`의 로그인 sync(`/api/watchlist/sync`)가 localStorage 항목을 `user_watchlist`로 병합하는지 확인.
4. **DB 반영 확인**: service_role로 `user_watchlist` 조회(아래 4-2 스크립트) → 추가한 심볼이 해당 user_id로 들어갔는지.
5. **복원 확인**: 다른 브라우저/시크릿 창에서 같은 계정 로그인 → 관심종목이 DB에서 복원되는지.
6. **reorder/clear**: 순서 변경(PATCH)·전체 삭제(DELETE ?all)가 DB에 반영되는지.
7. 각 단계에 **기대 결과 + 실패 시 의심 지점**(엔드포인트·RLS·키 불일치) 명시.

### 4-2. 자동 검증 스크립트 — `scripts/smoke/watchlist-sync-smoke.ts`

자격증명 불요 범위에서 service_role로 DB 측을 검증하는 `tsx` 스크립트:

- 운영 DB `user_watchlist` 테이블 **존재·컬럼·RLS** 확인(read).
- 인자로 받은 `userId`(또는 테스트용 시드 row)에 대해 **INSERT → SELECT → reorder UPDATE → DELETE** 라운드트립을 service_role로 수행하여 **DB 레이어가 정상인지** 검증(앱 UI 없이 DB 계약만).
- `--dry-run` 기본(읽기만) + `--write`(라운드트립) 가드. 테스트 후 자기 생성 row 정리(잔여 0).
- `.env.local`에서 `SUPABASE_SERVICE_ROLE_KEY`·`NEXT_PUBLIC_SUPABASE_URL` 로드. **자격증명·키를 로그에 출력 금지.**
- 실 로그인→sync(앱 경로)는 이 스크립트로 대체 불가임을 주석에 명시(절차서 §3·§5가 그 부분 담당).

## 5. 도구 권장

- `tsx`(스크립트) + service_role supabase-js. `/kdye2e` 패턴 참고 가능(단 본 작업은 절차서+DB 스크립트가 핵심, 풀 E2E 아님).

## 6. 의존성

- **독립** (Wave 1). 쓰기 영역 `scripts/smoke/`·`docs/db/`는 다른 터미널과 겹치지 않음(T02=DEPLOYMENT_RUNBOOK, T03=.github/workflows). 검증 대상 코드는 **읽기만**.

## 7. 검증 (자가)

```powershell
npx tsc --noEmit                                      # 스크립트 타입 0
npx tsx scripts/smoke/watchlist-sync-smoke.ts --dry-run   # 읽기 검증 동작(DB 연결·테이블 확인)
Test-Path docs/db/R14-watchlist-sync-smoke.md, scripts/smoke/watchlist-sync-smoke.ts
```

## 8. 완료 신호

`docs/handover/2026-05-30-R14-T04-watchlist-sync-smoke.md` 작성 — (a) 절차서·스크립트 산출 경로 + (b) `--dry-run` 실행 결과(DB 레이어 정상 여부) + (c) **사용자가 직접 수행해야 할 실 로그인 스모크 단계 요약** + (d) 발견한 코드 결함/의심(있으면).

## 안티패턴

- ❌ `scripts/smoke/`·`docs/db/` 밖 쓰기 (검증 대상 코드 `useWatchlist.ts`·`watchlist.ts`·API route 수정 금지 — 결함 발견 시 handover에 보고)
- ❌ service_role 키·자격증명을 로그·handover·스크립트 출력에 노출
- ❌ `--write` 라운드트립 후 테스트 row 미정리 (운영 DB 오염)
- ❌ 실 로그인 sync를 검증했다고 단정 (자격증명 없이 불가 — 절차서로 위임함을 정직하게)
- ❌ 신규 watchlist API·테이블 생성 (기존 계약 검증만)
- ❌ handover 누락 / `.env.local` 커밋 / 한국어 주석 규약 위반
