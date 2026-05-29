# R12 — watchlist/settings 구현 (오케스트레이션 인덱스)

> 라운드: R12 · tag: watchlist-settings · 시작: 2026-05-29 (세션 37)
> 지휘관(CEO): PID 119980 · 계층: flat (CEO + 일꾼 4)
> 선행 입력: `docs/handover/2026-05-29-R11-T04-r12-kickoff.md` (taste 7확정) + `docs/design-brief/06-watchlist-settings.md`

## 작업 매트릭스

| 코드 | 작업 | 쓰기 영역(격리) | Wave | 의존 |
|------|------|----------------|------|------|
| **T-A** | watchlist: `useWatchlist` 훅 + 표 UI + 시세 폴링(재사용) | `app/watchlist/`·`components/Watchlist/`·`components/hooks/` | 1 | 없음 |
| **T-B** | settings: 표시 환경설정 Context + localStorage + 데이터초기화 + 계정 | `app/settings/`·`components/Settings/`·`lib/config/` | 1 | 없음 |
| **T-C** | DB·API: `user_watchlist` 마이그레이션·RLS + `/api/watchlist` CRUD·sync | `supabase/`·`app/api/watchlist/`·`lib/supabase/` | 1 | 없음(D1 독립) |
| **T-D** | nav 진입점 2건: settings(드롭다운+도구▼) · watchlist | `components/Common/` | 2 | T-A·T-B 라우트 |

## 발사 순서

```
1차 (즉시 동시):  T-A  T-B  T-C
2차 (T-A·T-B 라우트 생성 후):  T-D
```

## taste 7확정 (전 워커 공통 전제)

1. 주식 다건 = **클라이언트 병렬**(신규 API 0) · 2. 충돌 = **로컬 우선 병합** · 3. 상한 = **익명30/회원100**
4. 색상 = **한국식 고정**(빨↑파↓, settings 전환) · 5. settings 진입 = **둘 다** · 6. 다크 = **v2.1 미룸** · 7. 브랜드 = **그린**

## 공통 SOT (전 워커 읽기 전용)

- `docs/design-brief/06-watchlist-settings.md` (기획 본체)
- `docs/handover/2026-05-29-R11-T04-r12-kickoff.md` (taste·매트릭스)
- `docs/design-brief/00-overview.md` (디자인 시스템·색상·브랜드 그린)
- `docs/references/_SCHEMA_REFERENCE.md`·`_API_REFERENCE.md`·`_WEB_CONTRACT.md`
- `CLAUDE.md` (SSOT 규칙·커밋 규칙)

## 안티패턴 (전 워커 금지)

- 자기 쓰기 영역 밖 수정 (PreToolUse 가드 — 위반 시 통합 검증서 HIGH)
- 신규 시세 API 생성 (coins/ticker·stock/quote 재사용)
- SSOT 교차 임포트 (crypto↔stock↔watchlist)
- 미구현 "구현 예정" 빈 카드 / 그라디언트·블러·큰 라운드(v1.0 잔재)
- 다크모드 구현 (R12 범위 외)
- "지휘관/CEO" 자칭 (각자 일꾼 — handover만 작성, cs 금지)
