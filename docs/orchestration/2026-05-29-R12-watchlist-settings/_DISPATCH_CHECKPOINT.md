# Dispatch Checkpoint — R12 watchlist-settings

- round: R12
- tag: watchlist-settings
- started_at: 2026-05-29 (세션 37)
- terminals: 6 (평면 flat — Wave1 T-A/B/C + Wave2 T-D/E/F)
- hierarchy: flat (CEO + 일꾼 6)
- status: Wave1 회수·PASS·핫픽스 완료(190356e 세션38 커밋). **Wave2(T-D/E/F) 세션39에서 외부 3터미널 분산 발사** — 회수 대기.
- 선행: R11-T04 kickoff에서 taste 7확정. R11은 7e90bcc로 마감(committed+pushed).
- reclaimed: (R11→R12) R11 CEO(PID 49144 DEAD) archive 후 세션38이 R12 CEO 인수. (세션38→39) 세션38 CEO(PID 119980 DEAD) Wave1 마감 후 종료 → **세션39 지휘관이 R12 Wave2 인수**(이 터미널은 hook이 stale R12-TF에 오바인딩했으나 사용자 선언상 지휘자, CEO 마커 reclaim 완료).

## 매트릭스

- T-A: watchlist — `useWatchlist`+표UI+시세폴링(재사용). 쓰기 `app/watchlist/`·`components/Watchlist/`·`components/hooks/`. Wave 1. 독립.
- T-B: settings — 표시환경설정 Context+localStorage+초기화+계정. 쓰기 `app/settings/`·`components/Settings/`·`lib/config/`. Wave 1. 독립.
- T-C: db-api — `user_watchlist` 마이그레이션·RLS+API CRUD·sync. 쓰기 `supabase/`·`app/api/watchlist/`·`lib/supabase/`. Wave 1. 독립.
- T-D: nav — 진입점 2건(settings 둘다·watchlist). 쓰기 `components/Common/`. Wave 2(T-A·T-B 선행).

## Wave 진행 상태

| Wave | 터미널 | 상태 |
|------|--------|------|
| 1 | T-A | ✅ 회수·PASS (useWatchlist+표UI+병렬폴링, tsc/eslint 0) |
| 1 | T-B | ✅ 회수·PASS (표시설정 Context+초기화+계정, tsc/eslint 0) |
| 1 | T-C | ✅ 회수·PASS (user_watchlist 마이그레이션·RLS·API 4, tsc 0) |
| 2 | T-D | 🚀 발사(세션39) — nav 진입점 2건, `components/Common/`. 회수 대기 |
| 2 | T-E | 🚀 발사(세션39) — S2 표시설정 전역, `app/layout.tsx`+`components/Watchlist/`. 회수 대기 |
| 2 | T-F | 🚀 발사(세션39) — D3 회원 동기화, `components/hooks/`. 회수 대기 |

## taste 7확정
1 클라이언트병렬 · 2 로컬우선병합 · 3 익명30/회원100 · 4 한국식고정 · 5 진입점둘다 · 6 다크v2.1미룸 · 7 그린

## 통합 메모 (Phase 4 — 2026-05-30 회수 검증)

### 교차검증 발견 + 지휘관 핫픽스 (적용 완료)
1. **localStorage 키 불일치(blocking)**: T-A=`cca:watchlist` vs T-B=`cm.watchlist.v1`. → `cca:watchlist`로 통일(`lib/config/local-data.ts` 3곳 수정). T-B getWatchlistCount는 이미 `{items}` 포맷 호환이라 키만 정합.
2. **eslint no-restricted-imports(blocking)**: 신규 SSOT `watchlist` 화이트리스트 누락 → `eslint.config.mjs:34` group + 메시지에 `!@/lib/supabase/watchlist` 추가. API 2파일 error 해소.
- 재검증: `npx eslint`(R12 변경분) exit 0, `npx tsc --noEmit` exit 0.

### 격리 검증
- T-A/B/C 전부 자기 쓰기영역 내. 영역 밖 수정 0. SSOT 교차 임포트 0. 신규 시세 API 0.

### 지휘관 잔여 통합 작업 (커밋 전) — ✅ 전부 완료 (세션39, 2026-05-30)
- [x] 레퍼런스 갱신: `_SCHEMA_REFERENCE.md`(user_watchlist 행+섹션) + `_API_REFERENCE.md`(엔드포인트 4+목차+개요) — 완료 2026-05-30
- [x] `_WEB_CONTRACT.md`/라우트 레지스트리: R-020 settings·R-021 watchlist 인증'아니오'·활성화, GNB §3-1 설정 9번째 등재, 비인증 표/§8/이력 갱신 — 세션39
- [x] **S2 전역 적용**: Wave2 T-E 회수·PASS (DisplaySettingsProvider 루트 단일마운트 + WatchlistTable 구독)
- [x] **D3 회원 동기화**: Wave2 T-F 회수·PASS (useWatchlist 내부 sync·DB소스전환·409처리)
- [x] **Wave2 T-D(nav)** 회수·PASS (도구▼>설정 + AuthButton ⚙️ 2진입점)
- [x] **🔴 신규 블로커 해소**: middleware.ts가 /settings·/watchlist 인증보호 → 익명 우선 MVP 모순. protectedPaths에서 제거(사용자 승인). 익명 도달 가능화
- [x] settings 로컬 DisplaySettingsProvider 래퍼 제거(T-E 지적) + format.ts formatPrice dead export 제거 + AuthButton 기존 lint 2건(any 타입·deps) 수정
- [x] user_watchlist 운영 DB 적용(Management API database/query, `SUPABASE_ACCESS_TOKENS`): 테이블·인덱스·RLS4 검증 + schema_migrations 정합(20260529000001). memory `env-local-utf8-bom` 경로
- [x] 통합 검증: `npx tsc --noEmit` exit 0 · `npx eslint`(변경 8파일) error 0
- [ ] 통합 커밋(R12 마감) — 진행 중

### Wave 2 (2026-05-30 발사 준비 — 파일 영역 disjoint, 3개 동시 발사 가능)
| 코드 | 작업 | 쓰기 영역 | SOT |
|------|------|----------|-----|
| T-D | nav 진입점 2건 | `components/Common/` | T-D-nav.md |
| T-E | S2 표시설정 전역 적용 | `app/layout.tsx`·`components/Watchlist/` | T-E-s2-global-display.md |
| T-F | D3 회원 동기화 | `components/hooks/` | T-F-d3-member-sync.md |
