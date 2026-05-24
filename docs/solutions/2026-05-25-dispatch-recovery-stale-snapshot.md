---
title: 디스패치 회수 중 git/handover 스냅샷 stale — 미완 판정 전 재확인
date: 2026-05-25
session: 28
tags: [kdydispatch, conductor, phase4, recovery, git-status, race-condition]
category: workaround
confidence: high
---

## 문제

R3 (12 터미널) Phase 4 회수 중, 지휘자가 `app/coin/[symbol]/page.tsx`의 첫 2줄을 점검했을 때 `"use client"`가 보이고 git 변경분에 coin 파일이 없어 **T04(coin SSR)를 "미진행/터미널 스톨"로 판정**했다. 실제로는 T04 터미널이 점검 시점에 **작업 완료 직전**이었고, 수 분 내 handover(05-25 00:15) + coin page 전체 재작성(`export default async`·`generateMetadata`·`generateStaticParams`) + `coin-server.ts`·`CoinRoomTabs.tsx`를 커밋했다. 사용자가 "t04 다시확인해봐"로 지적하여 재점검 후 정정했다.

## 원인

- **외부 N-터미널 분산의 본질**: 각 일꾼은 독립 프로세스로 비동기 진행한다. 지휘자의 회수 시점과 일꾼의 파일 쓰기 시점이 겹치면, 한 번의 `git status`/`head` 스냅샷은 **그 순간의 부분 상태**만 포착한다.
- 마커 PID는 바인딩돼 있어도(터미널 살아있음) handover·git 변경이 아직 없을 수 있다 — 이는 "미진행"이 아니라 "**진행 중**"의 정상 신호일 수 있다.
- 세션 시작 시점의 git status 스냅샷(시스템 컨텍스트)은 이미 오래된 것일 수 있다.

## 해결

회수 시 터미널을 "미진행/실패"로 판정하기 **전에** 다음을 재확인한다:

1. **handover 재glob** — 점검 직전 도착했을 수 있음 (`docs/handover/{date}-R{N}-T*.md`).
2. **git status 재실행** — 세션 시작 스냅샷이 아닌 **지금** 상태.
3. **파일 내용 직접 확인** — 첫 2줄이 아닌 헤더 주석·핵심 마커(`export default async`·`generateMetadata` 등)까지.
4. 마커 `last_heartbeat`가 최근이면 **"진행 중"으로 분류하고 대기**, "미진행" 단정 금지.

판정 라벨: `verified`(handover+검증) / `코드완료·handover대기`(git 증거 있음, handover 없음) / `in_progress`(마커 살아있음, 증거 부족) / `미진행`(마커 미바인딩 또는 명시적 스톨). **"미진행"은 가장 보수적으로만** 부여.

## 교훈

- 동시 진행 라운드의 회수는 **단일 스냅샷이 아닌 시간차 재확인**이 필요하다. "git 변경 0 + use client 잔존"은 "안 함"이 아니라 "아직 안 끝남"일 수 있다.
- 사용자의 "다시 확인해봐"는 종종 옳다 — 지휘자가 부분 상태로 성급히 결론 낸 신호.
- 관련: [[kdydispatch-write-guard-soft]] (마커는 격리를 강제하지 않음 — 터미널↔작업 매핑도 handover 존재 여부로 사후 판정).

## 관련 파일

- `docs/orchestration/2026-05-24-R3-community-finish/_DISPATCH_CHECKPOINT.md`
- `docs/handover/2026-05-24-R3-T04-coin-ssr.md`
- `~/.claude/skills/kdydispatch/phases/handover-aggregation.md` (§2 회수 워크플로우)
