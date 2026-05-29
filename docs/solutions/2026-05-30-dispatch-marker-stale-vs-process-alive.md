---
title: kdydispatch 점유 판정은 마커 heartbeat가 아니라 실 프로세스 생존으로 / 회수 교차검증이 통합 결함을 잡는다
date: 2026-05-30
session: 38
tags: [kdydispatch, orchestration, marker, pid, heartbeat, integration-verification, ssot, localstorage]
category: workaround
confidence: high
---

## 문제

R12를 시작하려는데 `.dispatch/ceo/current.lock`이 존재(round=R11, PID 49144). 1차 판단에서 마커의 `last_heartbeat`(22:44)가 비교적 최근이고 워커 heartbeat(22:53)도 있어 **"활성 R11 CEO 터미널이 살아있다"**고 결론 → "이 워커 터미널에서 R12를 발사하면 이중 오케스트레이션"이라며 사용자에게 발사 불가를 보고했다.

그러나 사용자가 "여기는 지휘관 터미널이야"라고 정정. 실제로는 R11 CEO 터미널이 R11 마감 커밋 후 **이미 종료**된 상태였고, 마커만 stale하게 남아 있었다.

추가로, Wave1(T-A/B/C) 회수 시 각 워커 handover는 자체 `tsc/eslint PASS`를 보고했으나, 실제로는 워커 단독 검증으로는 보이지 않는 **교차(워커 간) 통합 결함 2건**이 있었다.

## 원인

1. **마커 heartbeat ≠ 프로세스 생존**: SessionEnd hook이 정상 종료 시 마커를 정리하지만, 비정상 종료·강제 종료·hook 미동작(soft-guard env 비전파 환경) 시 마커가 stale하게 잔존한다. `last_heartbeat` 타임스탬프는 "마지막으로 기록된 시각"일 뿐 현재 생존을 보장하지 않는다. heartbeat 신선도로 점유를 판정하면 **유령 점유**(dead PID를 살아있다고 오판)가 발생한다.

2. **워커 격리가 교차 계약을 검증할 수 없음**: 각 워커는 자기 쓰기 영역만 보고 tsc/eslint를 돌린다. 그래서 (a) 두 워커가 같은 자원(localStorage 키)을 **다른 이름**으로 가정해도, (b) 신규 SSOT 모듈이 **공용 config**(eslint 화이트리스트)에 등록돼야 하는데 그 config가 어느 워커 격리에도 안 속해도 — 워커 단독 검증은 전부 PASS로 통과한다. 결함은 **합류 지점**에만 존재한다.

## 해결

### 점유 판정 — 실 프로세스 생존 확인
마커의 `processId`를 OS에 질의하여 실제 생존을 확인한 뒤에만 인수/양보를 결정:

```bash
tasklist /FI "PID eq 49144" | grep -i 49144 || echo "DEAD"   # 기록 CEO
tasklist /FI "PID eq 47956" | grep -i 47956 || echo "DEAD"   # 기록 워커
# 둘 다 DEAD → 마커 stale 확정 → 안전하게 인수
```

DEAD 확인 후: stale 팀 마커를 `.dispatch/archive/`로 이동 + `ceo/current.lock`을 새 라운드·새 PID로 재작성 → 정당한 CEO 인수.

### 회수 단계 — handover 신뢰 대신 교차검증
워커 handover의 자가검증 결과를 **재현**하되, 반드시 **전 워커 변경분을 한 번에** 묶어 검증(합류 지점 노출):

```bash
# 워커별이 아니라 R12 전 변경분을 한꺼번에
npx eslint app/watchlist app/settings app/api/watchlist components/Watchlist components/Settings components/hooks lib/config lib/supabase/watchlist.ts
npx tsc --noEmit
# 공유 자원(키·config) 일치 직접 grep
grep -rn "cca:watchlist\|cm.watchlist" components/hooks lib/config
```

발견된 2건(둘 다 워커 격리 밖 → 지휘관 핫픽스):
1. localStorage 키 `cca:watchlist`(T-A) ↔ `cm.watchlist.v1`(T-B) → `cca:watchlist` 통일.
2. 신규 SSOT `watchlist`가 `eslint.config.mjs` no-restricted-imports 화이트리스트 누락 → `!@/lib/supabase/watchlist` 추가.

## 교훈
- **dispatch 점유는 PID 생존으로 판정한다.** heartbeat 타임스탬프는 보조 신호일 뿐 — stale 마커를 활성으로 오판하면 정당한 인수를 막거나(이번 케이스) 반대로 충돌을 일으킨다.
- **회수 검증은 전 워커 변경분을 묶어서 돌린다.** 워커 단독 PASS는 합류 결함을 못 본다. 공유 자원(localStorage 키·전역 config·SSOT 화이트리스트)은 회수 단계에서 직접 일치 검사할 것.
- SOT 작성 시 공유 자원 이름(키 등)을 **한 워커가 소유·정의**하고 다른 워커는 그것을 참조하게 명시하면 1번 결함을 예방할 수 있다. (이번엔 지휘관 SOT가 T-A에 `cca:watchlist` 예시, design-brief는 `cm.watchlist.v1`로 불일치 씨앗을 심었음 → SOT-기획 정합도 점검 대상.)

## 관련 파일
- `.dispatch/ceo/current.lock` · `.dispatch/teams/R12-T*/`
- `lib/config/local-data.ts` · `components/hooks/useWatchlist.ts`
- `eslint.config.mjs`
- `docs/orchestration/2026-05-29-R12-watchlist-settings/_DISPATCH_CHECKPOINT.md`
- 관련 memory: [[kdydispatch-write-guard-soft]] · [[cs-only-owning-terminal]]
