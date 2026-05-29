---
title: kdyswarm 워크트리 에이전트는 변경을 커밋하지 않는다 — 통합 시 수동 commit+merge 필요
date: 2026-05-29
session: 36
tags: [kdyswarm, git-worktree, parallel-agent, integration, merge]
category: tooling
confidence: high
---

## 문제

kdyswarm Phase 4에서 `isolation:worktree` + `run_in_background`로 발사한 에이전트 3개가 모두 "완료"를 보고했으나, Phase 5 통합 시 머지가 안 됐다.

```
git worktree list   # 모든 브랜치가 main과 동일 커밋(478f79c)을 가리킴
git diff --stat main worktree-agent-XXX   # 빈 출력 (HEAD 동일)
```

브랜치 HEAD가 main과 같아 `git merge`로 가져올 변경이 없는 것처럼 보였다.

## 원인

**워크트리 격리 서브에이전트는 자기 worktree에서 파일을 수정/생성/삭제하지만, 그 변경을 커밋하지 않는다.** 변경분이 워킹트리에 uncommitted 상태로만 남는다. 따라서 브랜치 HEAD는 분기 시점 그대로이고, 브랜치 기준 머지는 아무것도 가져오지 못한다.

```
git -C .claude/worktrees/agent-XXX status --porcelain
 M app/signal/page.tsx        # 수정은 있으나 커밋 안 됨
?? components/Signal/SignalCard.tsx
```

## 해결

통합 전에 **각 worktree에서 먼저 커밋**한 뒤 main에서 머지한다.

```bash
W=".claude/worktrees"
# 1) 각 worktree에서 변경 커밋
git -C "$W/agent-A" add -A && git -C "$W/agent-A" commit -q -m "feat: T1 ..."
git -C "$W/agent-B" add -A && git -C "$W/agent-B" commit -q -m "refactor: T2 ..."
# 2) main(현재 cwd)에서 --no-ff 순차 머지
git merge --no-ff -m "merge: T1" worktree-agent-A
git merge --no-ff -m "merge: T2" worktree-agent-B
# 3) tsc 통합 검증 후 worktree 정리(harness 잠금이면 -f -f)
git worktree remove -f -f "$W/agent-A"; git branch -d worktree-agent-A
```

트랙 간 파일이 분리돼 있으면 충돌 0. worktree가 harness 잠금("cannot remove a locked working tree") 상태면 `remove -f -f`로 강제 제거(머지 완료 후이므로 안전).

## 교훈

- kdyswarm worktree 에이전트의 "완료" = 워킹트리에 변경 존재이지 커밋이 아니다. 통합은 항상 `git -C <worktree> add+commit` → `git merge` 순.
- 머지 전 `git -C <worktree> status --porcelain`로 실제 변경을 확인하라 — `git diff main..branch`는 uncommitted를 못 본다.
- 통합 직후 전체 `tsc --noEmit`로 재검증(각 에이전트 자체 tsc 통과 ≠ 통합본 통과, 특히 삭제 트랙이 다른 트랙 참조를 깰 수 있음).

## 관련 파일
- `.kdyswarm/lock.completed.json` (세션 36 실행 기록)
- `docs/handover/2026-05-29-R10-swarm-dev-gap-fix.md`
