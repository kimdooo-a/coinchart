---
title: 병렬 dispatch 터미널에서 npm run build의 .next\lock 점유 충돌
date: 2026-05-23
session: 20
tags: [nextjs, build, dispatch, parallel, lock, turbopack]
category: workaround
confidence: high
---

## 문제

여러 dispatch 일꾼 터미널이 같은 워킹트리에서 동시에 작업할 때, 한 터미널에서 `npm run build`를 실행하면 다음 에러로 실패한다:

```
⨯ Unable to acquire lock at F:\...\.next\lock, is another instance of next build running?
   Suggestion: If you intended to restart next build, terminate the other process, and then try again.
build-exit=1
```

`next build`는 `.next/lock` 파일로 단일 빌드를 강제하는데, 동일 디렉토리에서 다른 일꾼이 `npm run build` 또는 `next dev`를 돌리고 있으면 락 획득에 실패한다.

## 원인

- kdydispatch 류 멀티터미널 오케스트레이션에서 N개 일꾼이 **동일한 워킹트리**를 공유 (워크트리 격리 없음)
- `.next/`는 프로젝트 루트 단일 디렉토리 → 빌드 락도 단일
- 검증 단계에서 여러 일꾼이 거의 동시에 `npm run build`를 호출하면 충돌
- 또는 이전 빌드가 비정상 종료되어 **stale lock**이 잔존

## 해결

다른 일꾼의 프로세스를 **죽이지 말 것**. 락 점유가 실제 실행 중인 빌드인지 stale인지 먼저 판별한다:

```powershell
# 1) 락 파일 존재·나이 확인
$lock = ".next\lock"
if (Test-Path $lock) { (Get-Item $lock).LastWriteTime }

# 2) 실제 실행 중인 next 프로세스 확인 (MCP 서버 node와 구분)
Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
  Select-Object ProcessId, CommandLine |
  Where-Object { $_.CommandLine -match 'next (build|dev)' }
```

- **실행 중인 `next build/dev` 프로세스 있음** → 그 일꾼의 빌드가 끝날 때까지 대기 후 재시도 (락 해제 대기). 절대 강제 종료 금지.
- **실행 중인 next 프로세스 없음 (stale lock)** → 첫 `npm run build` 실패가 락을 해제했을 수 있으니 그대로 재시도. 여전히 잔존하면 `.next\lock`만 안전하게 제거 후 재시도.

세션 20(T09)에서는 첫 시도 실패 → MCP 서버 node만 떠 있고 `next` 프로세스 부재 확인 → 재시도하여 `build-exit=0` 확보.

## 교훈

- 멀티터미널 dispatch의 빌드 검증은 직렬화가 안전 — 동시 `npm run build` 회피. 가능하면 `tsc --noEmit`로 빠른 검증 후 빌드는 한 번만.
- 클래스/토큰 교체처럼 타입·로직 무변경 작업은 `tsc` PASS로 회귀 위험이 사실상 0 → 빌드 락 충돌 시 무리한 재시도보다 tsc 결과 + 락 해제 후 1회 재시도로 충분.
- 근본 해결은 워크트리 격리(`git worktree` per 일꾼) 또는 `.next` 디렉토리 분리지만, dispatch가 단일 트리를 쓰는 한 락 대기·재시도가 현실적 워크어라운드.

## 관련 파일

- `docs/orchestration/2026-05-23-R1-mainpage/` (dispatch 일꾼 정의)
- `docs/handover/2026-05-23-R1-T09-blog-lightify.md`
