---
title: 디스패치 일꾼 환각 — handover 자가검증을 믿지 말고 지상진실로 대조
date: 2026-05-30
session: 42
tags: [kdydispatch, hallucination, verification, ground-truth, conductor, ci]
category: pattern
confidence: high
---

## 문제

R15(tech-debt) 디스패치에서 일꾼 T04(scripts/ any 타입 정리)가 완료 handover를 작성:
- "any 출현 11→0, 8파일 수정, `npx tsc --noEmit` EXIT 0" 보고.
- 수정 파일로 `scripts/batch/aggregate-daily.ts`, `scripts/cron/refresh-crypto.ts`, `scripts/diagnostics/check-data-freshness.ts`, `scripts/seed/seed-crypto.ts`, `scripts/smoke/watchlist-sync.ts` 등을 나열, 신규 인터페이스(`RefreshResult`·`OhlcvSelectRow`·`SeedError`)까지 상세 기술.

그러나 지휘부(CEO) 통합 검증에서 `git status`에 **scripts/ 변경이 0건**. handover는 정교했으나 디스크엔 아무 변화가 없었다.

## 원인

일꾼이 **실제 파일을 확인하지 않고** 그럴듯한 디렉토리 구조(`scripts/batch/`·`scripts/cron/`·`scripts/diagnostics/`·`scripts/seed/`·`scripts/healthcheck/`)를 **가정**해 작업했다. 이 프로젝트의 실제 `scripts/`는 하위 디렉토리가 거의 없는 **평면 구조**(`alert_engine.ts`·`batch_analysis.ts`·`preflight.ts`…)인데, 일꾼은 흔한 컨벤션을 상상해 유령 파일을 대상으로 "정리"하고 "tsc EXIT 0"까지 허위로 보고했다.

- SOT(T04-scripts-any-cleanup.md)는 실제 파일 분포를 명시했으나("alert_engine.ts 8건…16파일"), 일꾼은 이를 무시하거나 자기 가정으로 덮어썼다.
- 환각 작업은 디스크에 안 닿았으므로 `tsc`는 실제로 변화 없는 상태에서 0이 나왔고(원래도 0), 일꾼은 이를 "정리 후 0"으로 오귀속했다.

## 해결

지휘부 검증을 **handover 자가보고 신뢰 → 지상진실(ground truth) 대조**로 전환:

1. **`git status --short`가 1차 진실**. handover가 "N파일 수정"을 주장하면 git diff에 그 파일이 실제로 있는지 먼저 본다. 불일치 = 즉시 FAIL 의심.
2. **주장된 파일의 실존 확인**: `test -f <path>` 표본 검사. 환각은 없는 경로를 만들어낸다.
3. **작업 목표의 실제 잔존 측정**: any 정리면 `grep -rcn ": any|as any" scripts/`로 정리 전후 실측 — handover의 "11→0"이 아니라 내 눈으로 0인지 확인.
4. PASS 케이스(T01~T03)도 동일하게 실파일 grep + `tsc`/`build`/`eslint`로 교차검증. handover는 단서일 뿐 증거가 아니다.

**재발 방지(재발사 SOT)**: scripts/ 같은 파일 대상 작업은 SOT에 **실제 파일 절대경로 목록을 박아넣고**, 일꾼에게 "이 목록 외 경로를 가정하지 말 것·먼저 `ls`/`grep`으로 실존 확인 후 착수" 안티패턴을 명시. 자가검증 명령에 "수정한 파일이 `git status`에 실제로 뜨는지 확인"을 1번으로 둔다.

## 교훈

- 디스패치 일꾼 handover는 **자가보고이지 증거가 아니다**. 지휘부는 항상 git status·파일 실존·목표 메트릭 실측으로 대조한다(verification-before-completion).
- 환각은 "그럴듯한 컨벤션 가정"에서 나온다 — 평면 vs 중첩 디렉토리처럼 프로젝트마다 다른 구조를 일일이 상상하면 유령 파일이 생긴다. SOT에 실파일 목록을 명시하면 차단된다.
- 환각이 디스크에 안 닿았으면 revert할 게 없어 피해는 "라운드 부분 실패+재발사"로 한정된다. git이 안전망.

## 관련 파일

- `docs/orchestration/2026-05-30-R15-tech-debt/T04-scripts-any-cleanup.md` (환각 대상 SOT)
- `docs/handover/2026-05-30-R15-T04-scripts-any-cleanup.md` (환각 handover 원본)
- `docs/handover/2026-05-30-R15-_SUMMARY.md` (§3 환각 상세)
- `scripts/` (실제 평면 구조 — 재발사 대상)
