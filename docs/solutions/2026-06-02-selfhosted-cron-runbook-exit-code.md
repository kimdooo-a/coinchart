---
title: GitHub Actions cron을 자체 서버로 이관할 때의 함정 — 래퍼 종료코드 유실·NODE_ENV/tsx·로그 리다이렉트
date: 2026-06-02
session: 44
tags: [cron, self-hosting, bash, exit-code, systemd, npm-ci, node-env, tsx, github-actions, runbook]
category: tooling
confidence: high
---

## 문제

GitHub Actions billing 차단으로 멈춘 daily-cron을 운영자 자체 서버에서 직접 돌리는 런북을 작성했다. 처음 작성한 권장 래퍼가 다음과 같았다:

```bash
#!/usr/bin/env bash
set -uo pipefail
cd /path/to/coinchart
npx tsx scripts/update-news.ts
npx tsx scripts/update-market-data.ts
npx tsx scripts/daily_cron.ts
echo "===== $(date -u +%FT%TZ) daily cron end (daily_cron exit=$?) ====="
```

이 래퍼는 cron 실패를 **전혀 감지하지 못한다**. 알림이 stub이고 킬스위치가 미연결인 시스템과 겹치면 실패가 며칠간 무인 침묵한다.

## 원인

1. **종료코드 유실 (가장 위험)**: bash 스크립트의 최종 종료코드 = **마지막으로 실행된 명령**의 종료코드. 마지막이 `echo`라 `daily_cron.ts`가 `exit 1`로 실패해도 래퍼는 **항상 0**으로 끝난다. `$?`는 echo 문자열 *안*에서 코드를 출력할 뿐, 스크립트 종료코드를 0으로 덮는다. 결과: systemd `Type=oneshot`은 항상 success(`OnFailure=` 미발동), crontab `MAILTO` 실패 메일 미발송.
   - `set -e`를 의도적으로 뺐다면(단계 실패해도 다음 진행) 에러 전파가 꺼진 것이므로 **성공/실패 신호를 끝에서 명시적으로 재생성**해야 한다.

2. **NODE_ENV=production → npm ci가 devDependency 누락**: 실행기(`tsx`)가 devDependency인데 운영 서버에 `NODE_ENV=production`이 잡혀 있으면 `npm ci`가 dev 의존성을 건너뛴다 → `npx tsx`가 command not found거나 npx가 레지스트리에서 임의 버전을 즉석 다운로드(공급망 리스크).

3. **로그 리다이렉트 누락**: 로거가 `console.*`만 호출하면(`createLogger`가 파일을 안 만듦) 운영자가 `>> log 2>&1`로 직접 리다이렉트하지 않는 한 기록이 남지 않는다. cron job 이름에 `.log`가 붙어 있어도 그건 접두사 라벨일 뿐 파일이 아니다.

4. **cd 가드 부재**: `set -e`를 끈 상태에서 `cd` 실패(경로 오타·미마운트) 시 엉뚱한 CWD에서 계속 실행된다.

## 해결

```bash
#!/usr/bin/env bash
set -uo pipefail
cd /path/to/coinchart || { echo "FATAL: cd 실패"; exit 1; }   # 가드
npx tsx scripts/update-news.ts
npx tsx scripts/update-market-data.ts
npx tsx scripts/daily_cron.ts
rc=$?                                                          # 즉시 캡처
echo "===== $(date -u +%FT%TZ) daily cron end (exit=$rc) ====="
exit $rc                                                       # 전파
```

- 의존성: `npm ci --include=dev` (또는 tsx를 deps 승격, 또는 사전 `tsc` 빌드 후 `node dist/...js`).
- 로그: crontab/systemd에서 `>> /var/log/app/cron.log 2>&1`. `/var/log` 하위는 root 소유라 `chown` 필요.
- systemd: `[Unit] After=network-online.target` 뒤에 `Wants=network-online.target`도 필수(After만으론 타깃을 끌어오지 못함).
- Windows PS 래퍼도 동일 원칙: `$rc=$LASTEXITCODE; exit $rc`, PATH에 node 보강.

## 교훈

- **`-e`를 끄면 성공/실패 신호를 끝에서 직접 만들어야 한다** — `rc=$?` + `exit $rc`. "마지막 명령이 종료코드"라는 bash 규칙이 echo 한 줄로 실패를 침묵시킨다.
- **CI에서 자체 서버로 이관할 때 환경 가정이 깨진다**: CI는 dev 의존성을 깔지만 운영 서버는 `NODE_ENV=production`일 수 있다. tsx 같은 런타임 실행기가 devDep이면 폭발한다.
- **실패가 침묵하는 조합을 경계하라**: 알림 stub + 킬스위치 미연결 + 종료코드 유실 = 무인 침묵. 셋 중 하나만 있어도 위험.
- **외부 Claude(에이전트)의 교차 검토가 실효적이었다** — 이 종료코드 버그는 양평 서버 Claude의 리뷰로 잡혔다. 코드가 없는 상대도 bash 의미론 같은 보편 결함은 잡아낸다.

## 관련 파일
- `docs/DAILY_CRON_SELFHOST.md` (런북 v2)
- `.github/workflows/daily-cron.yml`
- `scripts/daily_cron.ts`·`update-news.ts`·`update-market-data.ts`·`lib/logger.ts`
- `docs/solutions/2026-05-30-public-repo-not-enough-account-billing-blocks-actions.md` (billing 차단 — 이 이관의 배경)
