---
title: private 레포 Actions billing 차단 — 실제 배포는 Vercel Git 자동배포, release-* 워크플로우는 미설정 중복
date: 2026-05-30
session: 40
tags: [github-actions, billing, vercel, git-auto-deploy, release-pipeline, repo-visibility]
category: tooling
confidence: high
---

## 문제

R13 통합 커밋 후 "배포까지" 진행하려 했으나, GitHub Release `v1.0.0` publish → `release-deploy.yml` 워크플로우가 **8초 만에 실패**. 또한 스케줄 워크플로우(observe·daily-cron)가 **장기간 전부 failure** 상태. handover/메모리에는 "라이브 배포됨(Release 게이트)"이라 기록돼 있었으나 실제 `gh release list`는 **비어있고 태그도 0개**(정식 release 배포 0회).

## 원인

두 겹의 사실이 겹쳐 있었다:

1. **billing 차단**: 레포가 PRIVATE이라 GitHub Actions가 유료 사용량을 소모. 결제 실패/한도 초과로 job이 **시작조차 안 됨**:
   > "The job was not started because recent account payments have failed or your spending limit needs to be increased."
   이게 observe·daily-cron·validate가 **전부 실패하던 진짜 원인**(코드/secret 아님). 특히 `release-observe.yml`은 `schedule: */15 * * * *`(15분마다)라 사용량을 빠르게 소진.

2. **release-deploy 파이프라인은 애초에 미완성**: public 전환으로 billing을 풀고 rerun하니 job은 시작됐으나, 이번엔 `vercel list --prod --token= --scope=`(빈 값)으로 실패. **`VERCEL_TOKEN`/`VERCEL_ORG_ID`/`VERCEL_PROJECT_ID` secret이 등록된 적이 없다**(가이드 문서에도 데이터 동기화용 3개만 안내). 이 Actions 배포는 **한 번도 작동한 적 없는 중복 파이프라인**이었다.

3. **실제 배포 주체 = Vercel Git 자동배포**: `.vercel/project.json`(gitignore, 로컬만)에 `projectName: coin-index`·`orgId: team_...`·`projectId: prj_...` 존재. 라이브 확인 결과 **`coinchart.vercel.app` HTTP 200**, `/watchlist`·`/settings`(R12 신규 라우트) 모두 반영. 즉 **Vercel이 GitHub 레포를 Git 연동해 main push마다 자동 빌드·배포**하고 있었다. "라이브 배포됨"은 GitHub Release 게이트가 아니라 이것을 가리킨 것.

## 해결

1. **레포 Public 전환**(`gh repo edit --visibility public --accept-visibility-change-consequences`) → Actions 무제한 무료. 전환 전 secret 점검: `.env*` 커밋 이력 0·.gitignore 정상·하드코딩 JWT/service_role/API키 0(서버 secret은 GitHub Secrets 관리, 코드엔 `NEXT_PUBLIC_*`만) 확인 후 진행.
2. **중복 release 워크플로우 자동 트리거 제거**(삭제 대신 `workflow_dispatch` 수동 전용으로 보존):
   - `release-deploy`: `release:published` → `workflow_dispatch`
   - `release-validate`: `push: tags v*.*.*` → `workflow_dispatch`
   - `release-observe`: `workflow_run` + `schedule */15` → `workflow_dispatch`
3. 실제 배포는 **Vercel Git 자동배포가 계속 담당** — main push만으로 배포됨.

## 교훈

- **배포 경로를 먼저 확인하라**: "release-deploy.yml이 있다 = 그걸로 배포된다"가 아니다. `.vercel/project.json` 존재 + 라이브 도메인 응답으로 **Vercel Git 자동배포가 실제 주체**임을 먼저 확인했어야 했다. Actions 배포 파이프라인은 미설정 유물이었다.
- **private 레포 Actions는 유료**. 스케줄 워크플로우(특히 `*/15`)가 사용량을 빠르게 먹는다. OSS로 공개 가능하면 **public 전환이 billing을 완전 무료화**하는 가장 단순한 해법.
- billing 차단과 secret 미설정은 **증상이 같다(job 실패)** — 실패 로그의 ANNOTATIONS("payments failed" vs "`--token=` 빈 값")로 구분하라.
- Vercel Git 자동배포를 쓰는데 Actions Vercel CLI 배포까지 두면 **중복·항상 실패**. 하나만 쓰고 나머지는 `workflow_dispatch`로 비활성화(복구 여지 보존).

## 관련 파일
- `.github/workflows/release-{deploy,validate,observe}.yml` (트리거 비활성화)
- `.vercel/project.json` (Vercel 링크 흔적, gitignore)
- `docs/DEPLOYMENT_RUNBOOK.md` (release 게이트 가정 — 실제와 불일치, 후속 정정 후보)
