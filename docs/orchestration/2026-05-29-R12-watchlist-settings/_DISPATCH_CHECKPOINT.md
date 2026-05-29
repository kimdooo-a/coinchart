# Dispatch Checkpoint — R12 watchlist-settings

- round: R12
- tag: watchlist-settings
- started_at: 2026-05-29 (세션 37)
- terminals: 4 (평면 flat)
- hierarchy: flat (CEO PID 119980 + 일꾼 4)
- status: Wave1 회수·검증 완료 (T-A·T-B·T-C 3/3 PASS, 통합 핫픽스 2건 적용) — Wave2(T-D) 미발사
- 선행: R11-T04 kickoff에서 taste 7확정. R11은 7e90bcc로 마감(committed+pushed).
- reclaimed: R11 CEO(PID 49144 DEAD) stale 마커 archive 후 본 세션이 R12 CEO 인수.

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
| 2 | T-D | ⏳ 선행(T-A·T-B 라우트 완료) 충족 — 발사 가능 |

## taste 7확정
1 클라이언트병렬 · 2 로컬우선병합 · 3 익명30/회원100 · 4 한국식고정 · 5 진입점둘다 · 6 다크v2.1미룸 · 7 그린

## 통합 메모 (Phase 4 — 2026-05-30 회수 검증)

### 교차검증 발견 + 지휘관 핫픽스 (적용 완료)
1. **localStorage 키 불일치(blocking)**: T-A=`cca:watchlist` vs T-B=`cm.watchlist.v1`. → `cca:watchlist`로 통일(`lib/config/local-data.ts` 3곳 수정). T-B getWatchlistCount는 이미 `{items}` 포맷 호환이라 키만 정합.
2. **eslint no-restricted-imports(blocking)**: 신규 SSOT `watchlist` 화이트리스트 누락 → `eslint.config.mjs:34` group + 메시지에 `!@/lib/supabase/watchlist` 추가. API 2파일 error 해소.
- 재검증: `npx eslint`(R12 변경분) exit 0, `npx tsc --noEmit` exit 0.

### 격리 검증
- T-A/B/C 전부 자기 쓰기영역 내. 영역 밖 수정 0. SSOT 교차 임포트 0. 신규 시세 API 0.

### 지휘관 잔여 통합 작업 (커밋 전)
- [x] 레퍼런스 갱신: `_SCHEMA_REFERENCE.md`(user_watchlist 행+섹션) + `_API_REFERENCE.md`(엔드포인트 4+목차+개요) — 완료 2026-05-30
- [ ] `_WEB_CONTRACT.md`/라우트 레지스트리(watchlist·settings 실페이지화) — T-D nav 회수 후 일괄
- [→] **S2 전역 적용** → Wave 2 T-E로 외부 발사(SOT `T-E-s2-global-display.md`)
- [→] **D3 회원 동기화** → Wave 2 T-F로 외부 발사(SOT `T-F-d3-member-sync.md`)
- [ ] user_watchlist 마이그레이션 운영 DB 적용(Management API database/query — BOM 이슈로 supabase CLI 미사용, memory `env-local-utf8-bom`) ※outward-facing, 사용자 승인 후
- [→] Wave 2 T-D(nav 진입점 2건) 발사(SOT `T-D-nav.md`)
- [ ] 통합 커밋(R12 마감)

### Wave 2 (2026-05-30 발사 준비 — 파일 영역 disjoint, 3개 동시 발사 가능)
| 코드 | 작업 | 쓰기 영역 | SOT |
|------|------|----------|-----|
| T-D | nav 진입점 2건 | `components/Common/` | T-D-nav.md |
| T-E | S2 표시설정 전역 적용 | `app/layout.tsx`·`components/Watchlist/` | T-E-s2-global-display.md |
| T-F | D3 회원 동기화 | `components/hooks/` | T-F-d3-member-sync.md |
