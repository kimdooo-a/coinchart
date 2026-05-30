---
title: 레포 Public 전환만으로는 GitHub Actions 무료화가 보장되지 않는다 — 계정 결제 hold가 Public Actions까지 차단
date: 2026-05-30
session: 41
tags: [github-actions, billing, daily-cron, public-repo, spending-limit, ci-cd]
category: tooling
confidence: high
---

## 문제

세션 40(R13)에서 private 레포 Actions billing 차단을 해소하려 레포를 **Public으로 전환**했다. "Public 레포는 Actions 분(minutes)이 무료"라는 일반 통념에 근거해, 이로써 `daily-cron.yml`(Daily Data Sync)이 다시 작동할 것으로 가정했다.

그러나 세션 41(R14-T03) 검증에서 daily-cron이 **2026-05-25부터 5회 연속 실패** 중임이 드러났다:

```
gh run list --workflow=daily-cron.yml
2026-05-29  ❌ failure  4s
2026-05-28  ❌ failure  4s
...
2026-05-24  ✅ success  1m24s   ← 5-24까지는 정상(1분+)
```

- 실패 run의 소요 시간이 **3~4초** — job이 `setup-node`·`npm ci`에 도달조차 못 하고 종료.
- run annotation: **"The job was not started because recent account payments have failed or your spending limit needs to be increased. Please check the 'Billing & plans' section in your settings."**
- 레포는 확인 결과 **PUBLIC**(`gh repo view` visibility=PUBLIC). secret 3종(`NEXT_PUBLIC_SUPABASE_URL`·`SUPABASE_SERVICE_ROLE_KEY`·`TWELVEDATA_API_KEY`)도 모두 등록됨. 워크플로 YAML·호출 스크립트도 정상(5-24 성공이 증명).

## 원인

GitHub Actions 청구는 **레포 가시성(Public/Private)과 계정 결제 상태(account billing)가 별개의 게이트**다.

- Public 레포는 표준 GitHub-hosted runner 사용 시 분(minutes) 과금이 면제된다 — 맞다.
- **그러나 계정에 결제 실패(payment failed)나 spending limit 초과 같은 "billing hold"가 걸려 있으면, GitHub는 그 계정 소유의 모든 Actions 실행을 차단**한다 — Public 레포의 무료 분까지 포함하여 job 시작 자체를 막는다.
- 즉 R13의 "Public 전환 = Actions 무료화" 전제는 **불완전**했다. 가시성 전환은 *분 과금*만 면제할 뿐, 기존 *계정 결제 hold*는 별도로 해소돼야 한다.

## 해결

**코드/설정으로 해결 불가 — 계정 소유자의 Billing 조치가 유일한 해결책.**

1. GitHub → **Settings → Billing & plans** (계정 `kimdooo-a`)
2. 실패한 결제 수단 갱신, 또는 spending limit 상향 (미납/한도 문제 해소)
3. 해소 후 수동 트리거로 검증:
   ```
   gh workflow run daily-cron.yml
   gh run list --workflow=daily-cron.yml --limit 1   # success(1분+ 실행) 확인
   ```
4. 데이터 동기화가 5-25부터 멈췄으므로, 첫 성공 run 후 `coinchart.vercel.app`의 뉴스/시세 갱신 시각 확인.

> 워크플로 측에서 R14-T03이 한 것은 `actions/setup-node@v3→v4` 노후 제거 1건뿐이며, 이는 **실패 원인과 무관**(향후 정상 재가동 시의 위생).

## 교훈

- **레포를 Public으로 바꿔도 Actions가 자동으로 살아나지 않는다.** "분 무료"와 "계정 결제 hold 해소"는 다른 차원 — billing hold가 있으면 Public Actions도 차단된다.
- **CI 실패를 코드/설정에서만 찾지 말 것.** job이 비정상적으로 짧게(3~4초) 끝나고 setup 단계 로그가 없으면 **계정/플랫폼 레벨 차단(billing·권한)**을 우선 의심하라. annotation 메시지가 단서다.
- 배포·운영 전제는 실제 run 이력(`gh run list`)으로 검증하라 — "전환했으니 됐겠지"는 가정이다. (메모리 `kdydispatch-rounds-2026-05-23`의 "Public 전환으로 무료화" 항목은 이 발견으로 보정됨.)

## 관련 파일

- `.github/workflows/daily-cron.yml`
- `docs/handover/2026-05-30-R14-T03-daily-cron-verify.md`
- `docs/solutions/2026-05-30-private-actions-billing-vercel-git-deploy.md` (R13 — 같은 billing 이슈의 전사)
