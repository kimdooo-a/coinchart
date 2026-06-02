---
title: kdydispatch 일꾼 환각(유령 파일 작업) 차단 게이트 패턴
date: 2026-06-02
session: 43
tags: [kdydispatch, hallucination, llm-guard, orchestration, scripts, any-types, ground-truth]
category: pattern
confidence: high
---

## 문제

R15-T04 일꾼(`scripts/` any 정리)이 **이 프로젝트에 존재하지 않는 유령 디렉토리**를 대상으로 작업했다고 보고했다:
- 보고: "any 11→0, 8파일 수정, tsc EXIT 0" — 수정 파일로 `scripts/batch/aggregate-daily.ts`·`scripts/cron/refresh-crypto.ts`·`scripts/diagnostics/`·`scripts/seed/`·`scripts/healthcheck/` 등 나열.
- 실제: `scripts/`는 **평면 구조**(하위 디렉토리는 `fixtures/`·`smoke/`뿐). 나열된 파일 전부 실존하지 않음. `git status`에 scripts 변경 **0건**.
- 다행히 디스크엔 쓰레기가 남지 않음(환각이 보고서에만 존재) — 하지만 라운드 1개를 통째로 날림.

## 원인

1. SOT가 실파일 목록을 제공하긴 했으나, 일꾼이 그것을 **무시하고 자기가 상상한 "전형적인 scripts 디렉토리 구조"**(batch/·cron/ 등 흔한 관례적 레이아웃)로 작업.
2. **착수 전 실존 확인 게이트가 약했음** — "착수 전 직접 재확인" 같은 문구만으로는 LLM이 파일시스템을 실제로 조회하지 않고 사전확률(prior)에 의존.
3. **변경 증거 요구가 없었음** — `git diff --stat` 같은 디스크 사실 대조 없이 자가 보고만으로 PASS 처리됨.

## 해결

R16 재수행 SOT에 **3중 환각 차단 게이트**를 박아 재발 0 달성:

### 1. 착수 전 게이트 (§1, 가장 먼저·통과 못 하면 중단)
```powershell
# (a) 평면 구조 자기검증 — 환각 디렉토리 보이면 중단
Get-ChildItem scripts -Directory | Select-Object Name
#   → fixtures, smoke 만 정상. batch/cron/seed 보이면 "그건 네 환각이다. 즉시 중단."
# (b) 대상 파일 실존 확인 (전부 True 여야)
'scripts/alert_engine.ts',... | ForEach-Object { "$_  $(Test-Path $_)" }
```

### 2. 실파일 목록을 SOT에 못박음 (지휘자가 직접 grep·ls 검증한 지상 진실)
- 추정 경로 금지. 명시된 파일만 작업. CEO가 `grep -c ':\s*any'`로 파일별 건수까지 SOT에 기재.

### 3. `git diff --stat` 실출력을 handover 필수 항목 (없으면 무효)
- 지휘부 회수 시 **디스크 실제 변경 ↔ handover diff 대조**로 환각 즉시 탐지.

### 결과
- T01·T02·T03 모두 착수 게이트 통과 보고 + diff 실출력 첨부.
- 지휘부 검증: 디스크 실변경 21파일이 handover와 1:1 일치. tsc 0·build 0·eslint 58→7(신규 0). **환각 재발 0**.

## 교훈

- **LLM 에이전트에게 "직접 확인하라"는 문구만으로는 부족**하다. 실제 조회 명령(`ls`/`Test-Path`)을 게이트로 강제하고, "환각이면 중단하라"는 탈출구를 명시해야 사전확률 의존을 끊는다.
- **자가 보고를 신뢰하지 말고 디스크 사실(`git diff --stat`)을 증거로 요구**하라. 환각은 보고서에만 존재하므로 디스크 대조가 유일한 탐지 수단.
- 같은 디렉토리를 여러 일ꓼ이 나눌 땐 **파일 단위 disjoint + 새 공유 타입 파일 신설 금지**(로컬 선언/기존 import만)로 충돌을 원천 차단.

## 관련 파일
- `docs/orchestration/2026-06-02-R16-type-cleanup/T01-scripts-any-engines.md` (게이트 SOT 예시)
- `docs/handover/2026-06-02-R16-_SUMMARY.md`
- `docs/handover/2026-05-30-R15-_SUMMARY.md` (환각 사고 원본)
