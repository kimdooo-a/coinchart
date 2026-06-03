# 인수인계서 — 세션 49 (양평 통지 송신 + R17 잔여 마감: watchlist sync E2E 스모크)

> 작성일: 2026-06-03
> 이전 세션: [session48](./2026-06-03-session48-alert-pending-daily-candle.md)

---

## 작업 요약

세션48 인계 2건 중 ① 양평 통지(range=1y 변경+멘탈모델 정정+관측요청)를 송신하고, ② **R17의 실질 잔여인 watchlist 실로그인 sync 스모크**(R12부터 PENDING)를 **Playwright 자동화로 마감**했다. brainstorming→설계doc→구현→풀검증 전 과정 수행. 앱 코드 무수정(e2e/ 격리), magiclink fallback 세션 재사용, 합성 심볼로 운영 데이터 오염 0. R17 완전 마감.

## 대화 다이제스트

### 토픽 1: 세션 시작 + 양평 통지 송신
> **사용자**: (세션48 cs 보고 붙여넣기) "새로운 세션 시작 …"

current.md 직독으로 상태 점검(세션48 clean, 빌드 정상). 세션48 인계 미결 2건 확인 — ① 양평 통지 미송신(range=1y 변경+관측요청), ② 06-04 06:00 cron 관측(아직 발생 전). 사용자에게 무엇부터 할지 질문 → **"양평 통지 송신"** 선택.

`ypmsg_coinchart` 스킬로 진행. inbox 미읽음 0 확인 + DIRECT 방 직전 맥락 read에서 **양평이 §5에서 "5분봉 288개 기대"로 이해 중**임을 발견. 세션48이 그 §5를 처리하면서 "5min×288"이 환각 주석이고 실제 분석은 일봉임을 밝혔으므로, 양평의 멘탈모델 정정이 내일 관측 정확도에 필수라고 판단.

**결론**: 멘탈모델 정정('5min×288' 환각·분석=일봉) + range 5d→1y + **git pull 필요**(커밋 `3929e9b` 반영 조건, pull 안 하면 옛 코드로 미반영) + 06-04 관측요청 3항목을 묶어 송신(msgId `b0451b85`).

### 토픽 2: R17 잔여 정의 + §4 DB 레이어 재실증
> **사용자**: "R17 잔여"

next-dev-prompt 직독 → R17의 교차결합(batch_analysis↔report_generator)·PGRST205는 **세션47에서 이미 마감**. R17의 사용자조치 중 GitHub Billing은 세션44 자체호스팅 우회로 전환됨. **실질 잔여 = watchlist 실로그인 sync 스모크**(R12부터 PENDING, R14 T04에서 절차서+DB스크립트까지 작성됐으나 실 로그인 런타임 미검증).

절차서 `docs/db/R14-watchlist-sync-smoke.md` 직독으로 2축 구조 파악:
- **§4 DB 레이어**: Claude 직접 실행 가능(자격증명 불요). `scripts/smoke/watchlist-sync-smoke.ts` 재실행 → --dry-run PASS 3/0 + **--write PASS 4/0**(라운드트립 INSERT→UNIQUE충돌→reorder→DELETE, 잔여 0). user_watchlist 운영 계약 정상 재확인.
- **§3·§5·§6 실 브라우저**: 자격증명 필요. 사용자가 **"Playwright 자동화 구축"** 선택.

### 토픽 3: brainstorming — Playwright 스모크 설계
컨텍스트 탐색(auth.setup.ts·playwright.config·useWatchlist·sync route·community-admin-auth.spec):
- **magiclink fallback(경로 B)** 완전 구현 확인 — service_role `generateLink`→`verifyOtp`로 비번 없이 세션 쿠키 storageState 캡처. watchlist는 관리자/일반 구분이 없어 관리자 계정을 회원으로 재사용 가능.
- **핵심 발견**: `WatchlistView`(line 69) 구조분해에 `reorder`가 없음 = **UI 진입점 부재**. 절차서 §6-1의 "드래그" 가정은 stale → reorder는 PATCH API 직접검증으로 결정.
- sync 트리거 = `useWatchlist`가 마운트된 `/watchlist`에서 `getUser()`/`onAuthStateChange` → `runSync` → `POST /api/watchlist/sync`. `moduleSynced`는 컨텍스트당 1회라 §5는 새 컨텍스트로 자연 해결.

질문 4건(한 번에 하나씩):
1. **범위** → 전체(§3+§5+§6, reorder는 PATCH API)
2. **통합** → admin 패턴 답습 `watchlist-member` project 신규 + graceful skip
3. **테스트 계정** → `E2E_ADMIN_EMAIL` 재사용
4. **트리거 접근법** → A(addInitScript로 localStorage 선적재 + storageState 쿠키 → 페이지 로드 시 자동 runSync)

> **사용자**: "너의 권장대로 자율 주행"

접근법 A 확정. 설계 doc 작성·커밋(`89dae05`).

### 토픽 4: 구현 + 풀 검증
신규 `e2e/watchlist-member.spec.ts` + `playwright.config.ts` 수정. 합성 심볼 `SMOKEE2E*`(normalizeWatchlistInput 1~32자 허용)·afterAll service_role 정리. `--list`로 컴파일·수집 검증(4 tests).

> **사용자**: "실행 — smartkdy7@gmail.com" (운영DB 합성행 임시쓰기·자동정리 동의)

`.env.local` Supabase 키 셸 주입 + `E2E_DB_READY=1` + `E2E_ADMIN_EMAIL` 후 풀 실행:
- **4 passed** — setup(magiclink 2 cookies) + TC1(§3) + TC2(§5) + TC3(§6)
- 운영 DB **행 수 0**(§4 dry-run 재확인) — afterAll/clear 정리, 오염 0
- 자격증명 미주입 실행 → **3 skipped** + setup 1 passed (graceful skip, 기존 비인증 29건 회귀 0)
- eslint 0

**결론**: R17 완전 마감. 커밋 `8200e6a`(spec+config). push는 main=Vercel 배포 트리거라 cs 일괄로 보류.

## 의사결정 요약

| # | 결정 | 선택지 | 선택 이유 |
|---|------|--------|----------|
| 1 | 양평 통지에 멘탈모델 정정 포함 | 단순 range 변경 통보 / 정정+pull조건 포함 | 양평이 "5분봉 288개 기대"로 오해 중 → 정정 없이는 내일 관측이 잘못된 가정으로 진행 |
| 2 | 스모크 범위 = 전체(reorder PATCH 포함) | §3+§5만 / +§6 clear / +reorder API | 사용자 선택. reorder는 UI 부재로 PATCH API로만 검증 |
| 3 | 트리거 = 접근법 A | A(addInitScript+storageState) / B(setSession) / C(API직접) | 실제 사용자 흐름(익명 localStorage 보유 채 로그인)에 가장 근접. C는 §4와 중복 |
| 4 | 테스트 계정 = E2E_ADMIN_EMAIL 재사용 | 재사용 / 별도 E2E_MEMBER_EMAIL | watchlist는 관리자/일반 구분 없음, magiclink fallback이 이미 그 이메일로 동작·추가 설정 0 |
| 5 | reorder는 PATCH API로만 검증 | UI 드래그 / PATCH API | WatchlistView가 reorder 미사용 = UI 진입점 없음(절차서 §6-1 stale) |

## 수정 파일 (5개)

| # | 파일 | 변경 내용 |
|---|------|-----------|
| 1 | `e2e/watchlist-member.spec.ts` (신규) | TC1 §3·TC2 §5·TC3 §6 스모크 + 런타임 게이트 + afterAll 정리 |
| 2 | `e2e/playwright.config.ts` | `watchlist-member` project 추가 + chromium testIgnore에 spec 제외 |
| 3 | `docs/superpowers/specs/2026-06-03-watchlist-sync-e2e-smoke-design.md` (신규) | 설계 doc |
| 4 | `docs/solutions/2026-06-03-watchlist-sync-playwright-smoke.md` (신규) | 패턴 솔루션 |
| 5 | (cs 산출물) current.md·logs·handover·next-dev·journal | 세션 기록 |

## 상세 변경 사항

### 1. `e2e/watchlist-member.spec.ts` — 회원 sync 런타임 스모크
- 게이트 `runSmoke()` = `E2E_DB_READY=1` + `admin.ready` 마커 + URL/service_role/email (AD1과 동일 런타임 평가로 collection 함정 회피).
- `memberContext(browser, seed?)` 헬퍼: `storageState=admin.json` + (선택) `addInitScript`로 `cca:watchlist` 선적재.
- TC1: 익명 적재 → `waitForResponse(POST /sync, 200)` → `added>=2`·`limit=100`·로컬 손실 0.
- TC2: 빈 컨텍스트 → sync 200 → DB 항목 복원.
- TC3: `page.request.patch` reorder → GET 역순 확인 / `page.on('dialog', accept)` + "전체 비우기" 클릭 → `DELETE ?all=true` 200 / 새 컨텍스트 잔여 복원 0.
- afterAll: `generateLink`로 user_id 확보 → `user_watchlist` `SMOKEE2E%` 행만 삭제.

### 2. `e2e/playwright.config.ts` — project 추가
- `watchlist-member` project(`dependencies:['setup']`, `storageState=admin.json`).
- chromium testIgnore에 `watchlist-member.spec.ts` 추가(비인증 스위트 분리).

## 검증 결과
- `--list` 컴파일·수집: 4 tests(setup 1 + TC 3)
- 풀 실행(자격증명 주입): **4 passed** (15.0s)
- 운영 DB 잔여: **행 수 0** (§4 dry-run 재확인)
- graceful skip(미주입): **3 skipped** + setup 1 passed
- eslint(신규 2파일): 0

## 터치하지 않은 영역
- 앱 코드(`app/`·`components/`·`lib/`) 전체 무수정 — e2e/ 격리.
- watchlist API/스키마 무변경(읽기만) → 레퍼런스(_SCHEMA/_API/_TYPE) 동기화 불요.
- WatchlistTable UI 드래그 reorder 구현(현재 UI 부재 — 별도 기능 과제).

## 알려진 이슈
- 🟡 **2026-06-04 06:00 KST cron 관측**: range=1y 일봉 ~250봉 적재 + ADA/AVAX/DOT Insufficient 해소 + batch 저장 성공 여부. **양평 git pull 선행 필수**(커밋 `3929e9b` 반영 조건). 양평 회신 대기.
- watchlist **reorder UI 부재**: 절차서 §6-1 "드래그" 가정이 stale. 본 스모크는 PATCH API로만 검증. UI 드래그 reorder는 별도 기능 과제.

## 다음 작업 제안
- **내일 06:00 cron 관측 회신 확인**(양평 inbox) — git pull 반영 + 일봉 적재 + Insufficient 해소 + batch 저장.
- (선택) watchlist reorder UI 구현(드래그/순서이동 버튼) — 현재 훅에는 reorder 함수 존재, UI 진입점만 부재.
- (선택) watchlist 상한 경계(익명 30/회원 100) 스모크 — 핵심 흐름 아님.

---
[← handover/_index.md](./_index.md) · [이전 세션 session48](./2026-06-03-session48-alert-pending-daily-candle.md)
