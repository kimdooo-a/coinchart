---
title: kdydispatch PID 격리의 휘발성 환경변수 한계와 마커 재바인딩 절차
date: 2026-05-23
session: 25
tags: [kdydispatch, hooks, powershell, env-var, pid-binding, write-guard, orchestration]
category: workaround
confidence: high
---

## 문제

R2 라운드 병렬 디스패치에서 SessionStart 배너가 단말 역할을 **실제 발사된 작업과 다르게** 표기하는 현상이 반복됨 (세션 22 T04, 23 T05, 25 T02 모두). 본 세션(R2-T02)에서는:

- 배너: "단말 R2-T05" + 허용경로 `app/page.tsx;middleware.ts;components/Blog/BlogComments.tsx;docs/handover/`
- 실제 지시: R2-T02 (수정 대상 `app/news/`·`lib/community/news-queries.ts`)
- 두 경로가 불일치 → PreToolUse write-guard가 차단할 것으로 우려됨

또한 R2-T02 마커는 다른 PID(20384)에 바인딩되어 있어, 같은 작업을 두 단말이 중복 수행할 위험이 있었다.

## 원인

`.claude/hooks/`의 kdydispatch 격리 메커니즘 구조적 한계 2가지:

1. **환경변수 휘발성** — `dispatch-role-injector.ps1`(SessionStart)이 `$env:DK_DISPATCH_ROLE`/`DK_DISPATCH_ALLOWED`를 설정하지만, 주석 line 13 그대로 "환경변수는 이 PowerShell 프로세스 한정(휘발성)". hook은 매 호출마다 **새 PowerShell 프로세스**로 실행되므로, role-injector가 설정한 환경변수가 후속 `dispatch-write-guard.ps1`(PreToolUse) 프로세스로 **전파되지 않는다**. write-guard 첫 줄 `if (-not $env:DK_DISPATCH_ROLE) { exit 0 }` → 환경변수가 항상 비어 있어 **무조건 pass**. 즉 격리가 물리적으로 작동하지 않는다. (검증: 작업 셸에서 `$env:DK_DISPATCH_ROLE` 출력 → 빈 문자열)

2. **PID 매칭 불안정** — `Find-MarkerByPid`가 `$PID`(현재 PowerShell 프로세스)로 마커를 매칭하는데, hook은 일회성 PS 프로세스라 호출마다 PID가 다르다. 지속되는 Claude 세션의 안정적 식별자가 아니므로, 배너가 표기한 역할과 실제 단말이 어긋난다. (registry의 session_start PID와 작업 셸 PID가 불일치하는 것으로 확인)

## 해결

배너 불일치 + 마커 중복 바인딩을 발견하면 **무작정 진행하지 말고 사용자에게 확인**한 뒤, 승인 시 마커를 현재 단말로 재바인딩한다:

```powershell
# .claude/hooks/_helpers/dispatch-lib.ps1의 Set-MarkerPid 재사용
. ".claude\hooks\_helpers\dispatch-lib.ps1"
$marker = ".dispatch\teams\R2-T02\workers\R2-T02.lock"
Set-MarkerPid -MarkerPath $marker -NewPid <현재단말PID>   # processId + last_heartbeat 갱신
```

핵심 판단 기준:
- write-guard가 물리적으로 차단하지 못하므로, 위험은 **물리적**이 아니라 **논리적**(중복 작업)이다.
- 따라서 "다른 PID가 같은 마커를 점유 중인가?"를 먼저 확인 (`.dispatch/teams/*/workers/*.lock`의 `processId` + registry). 점유 중이면 그 단말 종료를 사용자에게 요청.
- 마커 재바인딩은 격리 강제가 아니라 **소유권 표시**(다른 단말/지휘자가 중복을 피하도록).

## 교훈

- kdydispatch 격리는 "안내"이지 "강제"가 아니다 — 환경변수 휘발성 때문에 write-guard는 사실상 no-op. 배너를 신뢰하되 실제 작업은 **사용자 명시 지시 우선**(CLAUDE.md 최상위), 충돌 시 마커/registry로 교차 확인.
- 병렬 디스패치에서 배너 불일치는 정상 현상으로 간주하고, 마커 `processId`/`last_heartbeat` + `_registry.jsonl`로 실제 점유 상태를 판단한다.
- 근본 해결책(후속): hook이 PID 대신 안정적 단말 식별자(예: 터미널 세션 ID 환경변수)로 마커를 매칭하거나, write-guard가 환경변수 대신 마커 파일을 직접 읽도록 개선 필요. (지휘자/인프라 트랙)

## 관련 파일
- `.claude/hooks/dispatch-role-injector.ps1` (SessionStart, 환경변수 주입)
- `.claude/hooks/dispatch-write-guard.ps1` (PreToolUse, 환경변수 의존 격리)
- `.claude/hooks/_helpers/dispatch-lib.ps1` (`Set-MarkerPid`, `Find-MarkerByPid`)
- `.dispatch/teams/R2-T02/workers/R2-T02.lock` (재바인딩 대상 마커)
- 관련 솔루션: `docs/solutions/2026-05-23-r1-dispatch-duplicate-worker-relaunch.md` (중복 발사 — 다른 측면)
