# 인수인계서 — 세션 40 (R13 display-rollout 마감 + 배포 경로 정상화)

> 작성일: 2026-05-30
> 이전 세션: [session39](./2026-05-30-session39-r12-wave2.md)
> 라운드 통합 보고서: [R13_SUMMARY](./2026-05-30-R13-_SUMMARY.md)
> 솔루션: [tailwind-v4-docs-content-pollution](../solutions/2026-05-30-tailwind-v4-docs-content-pollution.md) · [private-actions-billing-vercel-git-deploy](../solutions/2026-05-30-private-actions-billing-vercel-git-deploy.md)

---

## 작업 요약

R12 후속 4종을 R13(display-rollout) 라운드로 kdydispatch 4 외부 터미널 분산·회수·통합했다. 통합 검증 중 **R13 문서가 유발한 Tailwind content 오염(dev 500)을 규명·핫픽스**하고, R13 통합 커밋(`a90a059`)·push. 이어 배포를 진행하다 **GitHub Release 0개·Actions billing 차단·release 파이프라인 미설정**을 발견 → **레포 Public 전환으로 billing 해소 + 실제 배포는 Vercel Git 자동배포가 담당함을 확인 + 중복 release 워크플로우 비활성화**(`b9fd654`)했다.

## 대화 다이제스트

### 토픽 1: 세션 시작 — R12 상태 확인 후 R13 dispatch
세션 시작 시 current.md·session39 handover 확인 → R12(watchlist/settings) 완전 마감 상태. 사용자가 `/kdydispatch` 호출. R12 CEO 마커(PID 119732)가 stale(DEAD) 확인, R12 archive 완료 확인 → 이 세션을 **R13 신규 CEO**로 reclaim.

### 토픽 2: R13 작업영역 선택
> **사용자 선택(AskUserQuestion, 멀티)**: 전역 시세 롤아웃(S2확장) + watchlist 런타임 스모크+notice UX + AuthButton 계정 드롭다운 + 배포(Release 게이트) — **4개 전부**

R13 후보(session39 handover의 R13 제안) 전부 채택.

### 토픽 3: 매트릭스 분해 + T-A 분할
시세 컴포넌트 6종·WatchlistTable 패턴·CoinHero(서버 컴포넌트)·AuthButton 구조 파악 후 4작업 매트릭스 제시.
> **사용자 선택**: "T-A 분할 (4터미널)"

T-A를 둘로 분할 → 4 외부 터미널: **T-A1**(코인룸·사이드바 `components/community/`)·**T-A2**(티커·김프 `components/Chart/`·`Market/`)·**T-B**(watchlist 후속 `components/Watchlist/`·`hooks/`·`api/watchlist/`)·**T-C**(AuthButton 드롭다운 `AuthButton.tsx`·`account/`). 배포는 통합 후 지휘자 Wave2. 4영역 disjoint.

### 토픽 4: SOT·마커·발사
SOT 4종(자기완결)·`_INDEX`·`_DISPATCH_CHECKPOINT` 작성 + 워커 마커 4개 사전작성(PID 0) + 1줄 발사 프롬프트 4개 출력. 사용자가 4터미널 병렬 실행.

### 토픽 5: 회수 + 통합 검증
> **사용자**: "회수 확인"

handover 4/3 회수. 지휘자 독립 검증: 통합 tsc 0·build 0·eslint 0·파일 중복 0. 무변경(BoardSidebar·KimchiPremium)도 정당 근거 확인. **T-B `lib/supabase/watchlist.ts` 일탈은 지휘자 SOT의 "SSOT 경유" 지시 결과 → 정당 인정**.

### 토픽 6: 🔧 dev 500 블로커 규명 + 핫픽스
T-B가 "globals.css:3960 와일드카드 기존 이슈"로 보고했으나 **오진**. 실체: R13 문서(SOT·handover)에 적힌 `text-[var(--color-kr-*)]` 문자열을 **Tailwind v4 자동 content 감지가 docs/까지 스캔해 클래스로 추출** → dev CSS 파서 붕괴. globals.css는 R13 미변경(세션7 이후). 핫픽스: `app/globals.css`에 `@source not "../docs"`. 검증: 재빌드 CSS 경고 0 + dev `/`·`/watchlist`·`/coin/btc`·`/settings` HTTP 200. (solution 등재)

### 토픽 7: 통합 마감 + 통합 커밋
> **사용자 선택**: "통합마감 + 배포까지"

레퍼런스 갱신(_API_REFERENCE reorder/clear 2종 · _COMPONENT_MAP AccountMenu·WatchlistNotice·시세구독) + _SUMMARY + checkpoint. 통합 커밋 `a90a059`(코드 11+레퍼런스 2+docs 11) push.

### 토픽 8: 배포 시도 → billing 발견
v1.0.0 Release publish → release-deploy 8초 실패. 조사: **GitHub Release 0개·태그 0개**(정식 배포 0회), **Actions billing 차단**("payments have failed")이 observe·daily-cron 전부 실패의 근본 원인.
> **사용자 선택**: "첫 release v1.0.0 강행" → 실패(billing). 이후 "깃헙 사용량에 맞춰서 뭘하면 될까?"

### 토픽 9: Public 전환
진단: private 레포라 Actions 유료. 무료화 방법 제시(public 전환/Vercel 연동/결제).
> **사용자 선택**: "public으로 전환"

전환 전 secret 점검(.env 커밋 0·하드코딩 키 0) 후 `gh repo edit --visibility public`. billing 해소 → rerun 시 job 시작됨(Install까지 ✓).

### 토픽 10: Vercel 자동배포 발견
rerun이 이번엔 `vercel --token=`(빈 값)으로 실패 → **VERCEL secret 미설정**. `.vercel/project.json`·`coinchart.vercel.app` HTTP 200·R12 라우트 반영 확인 → **실제 배포는 Vercel Git 자동배포**(main push 자동). Actions release 파이프라인은 미설정 중복.
> **사용자**: "버셀에 연결이 안되었어?" → 연결돼 라이브 동작 중임을 확인 보고.

### 토픽 11: 중복 워크플로우 비활성화
> **사용자**: "너의 권장대로 진행"

release-deploy/validate/observe 자동 트리거를 `workflow_dispatch`(수동 전용)로 변경(특히 observe `*/15` schedule 제거 — 사용량 낭비 주범). 커밋 `b9fd654` push. 실제 배포는 Vercel 자동배포 유지.

## 의사결정 요약

| # | 결정 | 선택지 | 선택 이유 |
|---|------|--------|----------|
| 1 | R13 작업 4종 전부 | 일부/전부 | R12 후속 일괄 마감 |
| 2 | T-A 분할 4터미널 | 3/4터미널/배포제외 | 시세 6종 부담 분산 |
| 3 | dev500 핫픽스 지휘자 단독 | 핫픽스/재발사 | 근본원인 규명된 1줄 수정 |
| 4 | 통합마감+배포 | 마감만/배포까지 | 라운드 완결 의지 |
| 5 | v1.0.0 강행 | 보류/진단/강행 | 사용자 시도 의지(결과 billing 실패) |
| 6 | Public 전환 | public/Vercel연동/결제 | Actions 무료화 가장 단순 |
| 7 | 중복 워크플로우 비활성화 | 정리/방치/확인 | 항상 실패·사용량 낭비 제거, Vercel 자동배포가 실제 담당 |

## 수정 파일

**R13 통합 커밋 `a90a059`** (코드 11 + 레퍼런스 2 + docs 11):
- 신규: `components/account/AccountMenu.tsx`·`components/Watchlist/WatchlistNotice.tsx`
- 수정(일꾼): `CoinHero`·`PriceTickerWidget`·`Chart/Ticker`·`Chart/StockTicker`·`WatchlistView`·`useWatchlist`·`api/watchlist/route`·`lib/supabase/watchlist`·`AuthButton`
- 수정(지휘자): `app/globals.css`(핫픽스)·`_API_REFERENCE`·`_COMPONENT_MAP`

**워크플로우 커밋 `b9fd654`**: `release-deploy.yml`·`release-validate.yml`·`release-observe.yml` (트리거 비활성화)

## 검증 결과
- 통합 `npx tsc --noEmit` exit 0 · `npm run build` exit 0 · `npx eslint`(11파일) error 0
- dev 서버(핫픽스 후) `/`·`/watchlist`·`/coin/btc`·`/settings` HTTP 200, CSS 파서 에러 0
- 라이브 `coinchart.vercel.app` HTTP 200 (Vercel Git 자동배포)

## 신규 API (R13)
- `PATCH /api/watchlist` — reorder 영속화 `{order:[{assetType,symbol,sortOrder}]}` → `{ok,updated}`
- `DELETE /api/watchlist?all=true` — 벌크 clear → `{ok,cleared}`

## 운영 변경 (outward-facing, 수행됨)
- **레포 Public 전환** (kimdooo-a/coinchart PRIVATE→PUBLIC)
- GitHub Release `v1.0.0` publish (첫 릴리스 기록, 트리거 비활성화돼 무해)
- Actions release-* 워크플로우 3종 자동 트리거 비활성화

## 터치하지 않은 영역
- 전역 시세 구독 범위 밖(의도): FngGaugeWidget·HotIssueWidget(심리/트렌드 색)·KimchiPremium(구간 의미색)·StockTicker 다통화(한국주식 확장 시 `currency` 필드)
- `daily-cron.yml` (데이터 동기화, secret 있음 — public 전환 후 작동 여부 다음 21:00 UTC 실행 시 확인 권장)
- `DEPLOYMENT_RUNBOOK.md` (release 게이트 가정이 실제 Vercel 자동배포와 불일치 — 정정 후보)
- 스킬/에이전트/규칙 변경 없음

## 알려진 이슈
- **watchlist 회원 sync 런타임 미검증(PENDING)**: 신규 API 401 가드만 검증. 실 OAuth 로그인 전체 경로(sync→DB→reorder/clear 반영→타세션 복원)는 미검증 — R13 T-B handover 수동 스모크 절차서 참조.
- **DEPLOYMENT_RUNBOOK ↔ 실제 배포 불일치**: 런북은 GitHub Release 게이트 가정이나 실제는 Vercel Git 자동배포. 후속 정정 권장.
- `/stock-market` nav 진입점 소실 잔존(Minor).

## 다음 작업 제안 (R14 후보)
1. **watchlist 회원 sync 런타임 스모크**(실 로그인 1회 — T-B 절차서).
2. **DEPLOYMENT_RUNBOOK 정정** (Vercel Git 자동배포 기준으로 재작성, release-* 워크플로우 처리 명문화).
3. 시세 구독 잔여(FngGauge·HotIssue 트렌드색 일관화 검토).
4. notice UX 실사용 검증 / reorder·clear 회원 DB 반영 런타임 확인.
5. `daily-cron` public 전환 후 정상 작동 확인.

---
> 세션 저널: 없음(대화 히스토리 기반). 라운드 맥락 메모리: [[kdydispatch-rounds-2026-05-23]]
