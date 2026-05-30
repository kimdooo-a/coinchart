# 인수인계서 — 세션 41 (R14 지휘부 — loose-ends 마감)

> 작성일: 2026-05-30
> 이전 세션: [session40](./2026-05-30-session40-r13-display.md)
> 라운드 보고서: [R14_SUMMARY](./2026-05-30-R14-_SUMMARY.md)
> 저널: 없음(당일 저널 미생성, 대화 히스토리로 작성)

---

## 작업 요약

지휘부(CEO) 세션. R13이 인계한 후속 4종(R14 후보)을 kdydispatch **4 외부 터미널 평면 분산**으로 발사·회수·통합. T01(시세 구독 잔여)·T02(DEPLOYMENT_RUNBOOK 정정)·T03(daily-cron 확인)·T04(watchlist sync 스모크) 4/4 회수, 지휘부 독립검증 tsc/eslint/build 0·격리 0. **T03에서 daily-cron이 2026-05-25부터 GitHub 계정 결제 차단으로 전면 실패 중임을 발견**(코드 무결, 사용자 Billing 조치 필요).

## 대화 다이제스트

### 토픽 1: 세션 시작 + R14 방향 결정
> **사용자**: "이 터미널은 지휘관 터미널. 새로운 세션 시작"

current.md(세션 40까지)·next-dev·R13 handover를 파악. R13 후속(R14 후보) 4종 제시 → 사용자가 **"R14 분산 라운드 발사"** 선택 → kdydispatch 지휘자 모드 진입.

**결론**: R14를 4 외부 터미널 분산으로 진행.

### 토픽 2: 후보 정밀 분석 + 매트릭스 승인
4후보의 실제 상태를 파일로 확인. **(3) 시세 구독 잔여의 KimchiPremium·StockTicker는 R13 T-A2에서 결론 확정**(전자=단위고정·의미색 미적용, 후자=이미 전환) → 실제 잔여는 FngGauge·HotIssue 2위젯뿐임을 규명. (1) watchlist sync는 실 회원 자격증명 필요 → 외부 터미널 단독 수행 곤란.
> **사용자**(2질문 응답): 매트릭스 = "4터미널 그대로 승인" / T04 = "절차서+자동화 스크립트 작성"

**결론**: 4터미널 평면(전부 독립 Wave1). T04는 절차서+DB 스크립트, 실 로그인은 사용자 위임.

### 토픽 3: 발사 + 회수
CEO 마커 R14 reclaim(stale R13 PID 15500 갱신), 통합 프롬프트 4종+_INDEX+_CHECKPOINT 생성, 마커 4개 사전작성. 발사 → 4 터미널 부팅(마커 PID 바인딩 확인) → 작업 완료.
> **사용자**: "회수 확인"

**결론**: handover 4종 일괄 회수.

### 토픽 4: 지휘부 통합 검증 + T03 중대 발견
4 handover 회수. 격리 disjoint 확인 후 통합 tsc 0·eslint 0·build 0. 전역 스윕(`var(--color-kr-up/down)`)으로 잔여 2건(CoinHero·WatchlistAddBar) 발견했으나 모두 대상 외 확정.

**🔴 T03 핵심 발견**: daily-cron이 2026-05-25부터 5회 연속 실패. annotation "recent account payments have failed or your spending limit needs to be increased". job이 3~4초에 시작도 못 함 → **GitHub 계정 레벨 결제 차단**. 워크플로/스크립트/secret 3종 모두 정상(5-24까지 1분+ 성공이 증명). **레포 Public 전환만으로는 불충분** — 계정 결제 hold가 별도로 Public Actions까지 막음(R13 "Public=무료화" 전제 불완전).

**결론**: 커밋&push + cs. T03 billing·watchlist 실로그인은 사용자 PENDING.

## 의사결정 요약

| # | 결정 | 선택지 | 선택 이유 |
|---|------|--------|----------|
| 1 | R14 분산 라운드 발사 | 분산 / 단독 / 문서만 | 4도메인 독립·디렉토리 격리 명확 → 외부 1M 병렬 효율 |
| 2 | 4터미널 평면(T04 포함) | 4 / T04제외 3 | T04를 절차서+스크립트로 재정의해 자격증명 의존 우회 |
| 3 | T04 절차서+DB 스크립트 | 절차서+스크립트 / 실계정 / service_role | 자격증명 불요 범위(DB 계약)는 자동검증, 실 로그인만 위임 |

## 수정 파일 (코드 3 + 문서/스크립트)

| # | 파일 | 변경 | 터미널 |
|---|------|------|--------|
| 1 | `components/community/widgets/FngGaugeWidget.tsx` | `'use client'`+changeColorClass 구독(delta 색), 게이지 의미색 보존 | T01 |
| 2 | `components/community/widgets/HotIssueWidget.tsx` | `'use client'`+changeColorClass 구독(trend up/down), new/same 보존 | T01 |
| 3 | `docs/DEPLOYMENT_RUNBOOK.md` | 전면 재작성(Release게이트→Vercel Git 자동배포, Kill-Switch 보존, 유물 분리) | T02 |
| 4 | `.github/workflows/daily-cron.yml` | `actions/setup-node@v3→v4` | T03 |
| 5 | `docs/db/R14-watchlist-sync-smoke.md` (신규) | watchlist sync 스모크 절차서 | T04 |
| 6 | `scripts/smoke/watchlist-sync-smoke.ts` (신규) | service_role DB 라운드트립 검증(`--dry-run`/`--write`) | T04 |

+ 지휘자 산출: `docs/handover/2026-05-30-R14-T0{1..4}-*.md`·`-_SUMMARY.md`, `docs/orchestration/2026-05-30-R14-loose-ends/`, solution 1종.

## 검증 결과

- `npx tsc --noEmit` — ✅ 0
- `npx eslint`(T01 2파일 + T04 스크립트) — ✅ 0 (`.eslintignore` deprecation 경고만)
- `npm run build` — ✅ 0 (전 라우트 정상)
- 격리 위반 — ✅ 0 (4영역 disjoint)
- 전역 스윕 — CoinHero·WatchlistAddBar 2건 잔여는 대상 외 확정

## 터치하지 않은 영역

- `lib/config/display-settings.tsx`(SOT, 읽기 전용)·KimchiPremium·StockTicker·Ticker(R13 결론)·CoinHero(R13 구독 완료)
- 검증 대상 코드(`useWatchlist.ts`·`watchlist.ts`·watchlist API route) — T04는 읽기만
- `release-*.yml`(유물, T02가 문서로만 처리)
- 레퍼런스(`_COMPONENT_MAP` 등) — T01 props 무변경·T04 신규 스크립트라 계약 변경 0 → 갱신 불요

## 알려진 이슈 / 🔴 사용자 조치 PENDING

1. **GitHub `kimdooo-a` 계정 Billing 결제 차단** — daily-cron(및 모든 Actions) 2026-05-25부터 전면 실패. Settings>Billing & plans에서 결제 갱신/한도 상향 → `gh workflow run daily-cron.yml`로 success 확인. ⚠️ 레포 Public이어도 계정 hold면 차단됨.
2. **watchlist 실 로그인 sync 스모크** — `docs/db/R14-watchlist-sync-smoke.md` §3·§5·§6 절차로 자격증명 보유자가 실증 시 R12 런타임 PENDING 완전 해소. DB 레이어는 이미 정상 검증됨.
3. (선택) `daily-cron.yml` node-version 18→20 상향(Node 18 EOL).

## 다음 작업 제안 (R15 후보)

- billing 해소 후 daily-cron 재가동 확인(사용자 조치 선행)
- watchlist 실 로그인 스모크 실증 후 PENDING 클로즈
- `/analysis/[symbol]` userTier 실등급 연동 등 잔여 기술부채

---
[← handover/_index.md](./_index.md)
