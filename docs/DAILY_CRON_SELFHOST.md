# Daily Cron 자체 서버 운영 요청서 (Self-Hosted Runbook)

> 작성일: 2026-06-02 (세션 44)
> 개정: 2026-06-02 v2 — 양평 서버(stylelucky4u.com) Claude 교차 검토 반영(종료코드 유실·NODE_ENV/tsx·cd 가드·dotenv 경로 명확화·systemd Wants 등)
> 목적: GitHub Actions `daily-cron.yml`(Daily Data Sync)을 **운영자 직접 관리 서버**에서 대체 실행
> 배경: GitHub 계정 `kimdooo-a` Billing 차단으로 Actions가 2026-05-25부터 중단됨 → cron만 자체 서버로 이관
> 관련: `docs/solutions/2026-05-30-public-repo-not-enough-account-billing-blocks-actions.md`

---

## 0. 한눈에 보기

매일 1회, 코드 레포 안의 **TypeScript 스크립트 3개**를 정해진 순서로 실행하면 됩니다.
복잡한 서버·포트·웹서버 불필요 — **Node 20 + 레포 클론 + 환경변수 2개 + cron 등록**이 전부입니다.

| 단계 | 명령 | 하는 일 | 쓰는 테이블 |
|------|------|--------|------------|
| 1 | `npx tsx scripts/update-news.ts` | RSS 3종(CoinDesk·CoinTelegraph·Yahoo) 수집 | `news` |
| 2 | `npx tsx scripts/update-market-data.ts` | Yahoo Finance 일봉(코인+미국주식) 수집 | `market_prices`, `stock_prices` |
| 3 | `npx tsx scripts/daily_cron.ts` | 배치 분석(BTC 등 8종) → 리포트 → 알림 | `batch_runs`, `batch_analysis_results`, `alert_history` |

> ⚠️ **순서 중요**: 3단계(분석)는 2단계가 적재한 `market_prices`/`stock_prices`를 **읽어서** 동작합니다. 반드시 1 → 2 → 3 순서로 실행하세요. (1단계 news는 독립이라 순서 무관하지만 관례상 먼저)

---

## 1. 사전 요구사항

| 항목 | 요구 |
|------|------|
| **Node.js** | **20 이상** (`package.json` `engines.node >=20`. 18은 불가) |
| **패키지 매니저** | npm (레포에 `package-lock.json` 존재) |
| **네트워크 아웃바운드** | `*.supabase.co`(443), `query1.finance.yahoo.com`(443), RSS 3종 도메인(443) |
| **디스크** | `node_modules` 포함 약 1GB 여유 |
| **OS** | Linux / Windows / macOS 무관 (cron 등록 방식만 OS별 상이) |

별도 DB·웹서버·Vercel 토큰은 **불필요**합니다. 이 스크립트들은 Supabase에 직접 쓰는 독립 배치입니다.

---

## 2. 최초 1회 셋업

```bash
# 1) 레포 클론 (이미 있으면 git pull)
git clone <레포 URL> coinchart
cd coinchart

# 2) 의존성 설치 (CI 재현용 clean install)
#    ⚠️ tsx는 devDependency다. 운영 서버에 NODE_ENV=production이 잡혀 있으면
#       npm ci가 dev 의존성을 건너뛰어 tsx가 누락된다 → 반드시 --include=dev
npm ci --include=dev

# 3) 환경변수 파일 생성 (.env.local — git 미추적, 절대 커밋 금지)
#    아래 3장 참고하여 작성
```

> ⚠️ **NODE_ENV / tsx 함정 (양평 검토 ②)**: `tsx`는 `package.json`의 **devDependency**입니다. 운영 서버 셸에 `NODE_ENV=production`이 설정돼 있으면 일반 `npm ci`가 dev 의존성을 **건너뛰어** `npx tsx`가 실패하거나(command not found) npx가 레지스트리에서 임의 버전을 즉석 다운로드(공급망 리스크)합니다. 세 가지 중 하나를 택하세요:
> - **(권장)** `npm ci --include=dev` 사용 + cron 실행 시 `NODE_ENV`를 비우거나 `development`로, **또는**
> - `tsx`를 `dependencies`로 승격(코드 변경), **또는**
> - 사전 `tsc` 빌드 후 `node dist/...js` 실행(런타임 dev 의존성 제거 — 가장 견고).

### `.env.local` 위치 (CWD와 무관)

`.env.local`은 레포 **루트**에 둡니다. 세 스크립트는 `dotenv.config({ path: path.resolve(__dirname, '../.env.local') })` — 즉 **스크립트 파일(`scripts/`) 기준 상위 = 레포 루트**를 로드합니다. **`__dirname` 기준이므로 어느 CWD에서 실행하든 항상 루트의 `.env.local`을 찾습니다**(CWD 상대경로가 아님 — cron이 임의 디렉토리에서 호출돼도 env 로딩은 안전).
(서버 환경변수로 직접 export 해도 동작합니다 — dotenv는 파일이 없으면 조용히 넘어가고 기존 `process.env`를 사용합니다.)

---

## 3. 환경변수 (필수 2 / 선택 1)

`.env.local` 내용:

```dotenv
# ===== 필수 (이 2개 없으면 daily_cron.ts가 즉시 종료) =====
NEXT_PUBLIC_SUPABASE_URL=https://<프로젝트>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role 키>

# ===== 선택 (없어도 cron 정상 동작) =====
# TWELVEDATA_API_KEY=<키>   # 아래 주의 참고 — 이 cron 경로에선 실제로 안 쓰임
```

### 환경변수 설명

| 변수 | 필수 | 비고 |
|------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | **필수** | Supabase 프로젝트 URL |
| `SUPABASE_SERVICE_ROLE_KEY` | **필수** | RLS 우회 쓰기에 필요. **서버 전용 비밀** — 절대 외부 노출 금지 |
| `TWELVEDATA_API_KEY` | 선택 | GitHub Actions YAML은 주입했으나, **이 3개 스크립트 코드 경로에선 실제 미사용**(주식 데이터는 Yahoo Finance에서 가져옴). 넣어도 무해 |

> 🔑 `SUPABASE_SERVICE_ROLE_KEY`는 기존 GitHub Secrets에 등록돼 있던 값과 **동일**합니다. Supabase 대시보드 → Project Settings → API → `service_role` 키에서도 확인 가능합니다.

> ℹ️ **SMTP/이메일 환경변수는 불필요합니다.** 알림 엔진(`alert_engine.ts`)의 발송부는 현재 stub(콘솔 출력만)이라 실제 메일을 보내지 않습니다.

---

## 4. 실행 (수동 검증)

cron 등록 전에 **반드시 수동으로 1회** 돌려 정상 동작을 확인하세요.

```bash
cd /path/to/coinchart

npx tsx scripts/update-news.ts
npx tsx scripts/update-market-data.ts
npx tsx scripts/daily_cron.ts
# (3단계는 npm run cron:daily 와 동일)
```

### 정상 동작 신호

- update-news: `--- News Update Completed. Inserted/Updated: N items ---`
- update-market-data: 각 심볼별 `✓ Updated BTCUSDT (Last date: ...)`
- daily_cron: `[COMPLETE] Daily batch workflow finished` + `Batch ID: batch_...` + 종료코드 `0`

### 종료코드

- `daily_cron.ts`는 성공 시 `0`, 실패 시 `1`로 종료합니다 → cron/모니터링에서 종료코드로 성공 판정 가능.
- update-news / update-market-data는 개별 피드·심볼 실패를 내부에서 삼키고(`catch`) 계속 진행하므로 부분 실패해도 0으로 끝날 수 있습니다. 로그 본문을 확인하세요.

---

## 5. cron 스케줄 등록

기존 GitHub Actions 스케줄은 **매일 UTC 21:00**(= 한국시간 **KST 06:00**)이었습니다. 동일하게 맞추는 것을 권장합니다.

### 5-A. Linux (crontab)

```bash
crontab -e
```
```cron
# 매일 KST 06:00 (= UTC 21:00) 실행. 로그는 파일로 리다이렉트 (아래 6장 참고)
0 21 * * * cd /path/to/coinchart && /usr/bin/npx tsx scripts/update-news.ts >> /var/log/coinchart/cron.log 2>&1 && /usr/bin/npx tsx scripts/update-market-data.ts >> /var/log/coinchart/cron.log 2>&1 && /usr/bin/npx tsx scripts/daily_cron.ts >> /var/log/coinchart/cron.log 2>&1
```

> 서버 타임존이 KST면 `0 6 * * *`로, UTC면 `0 21 * * *`로 쓰세요. `date` 명령으로 서버 TZ를 먼저 확인하세요.
> 가독성을 위해 3줄을 묶은 래퍼 셸 스크립트(`run-daily.sh`)를 만들어 crontab에선 그 스크립트 한 줄만 호출하는 방식을 권장합니다.

권장 래퍼 `run-daily.sh`:
```bash
#!/usr/bin/env bash
set -uo pipefail   # -e는 쓰지 않음: 개별 단계 실패해도 다음 단계 진행 위해
                   # 단 -e를 끈 대신 성공/실패 신호를 끝에서 명시적으로 다시 만든다(아래 rc/exit)

# cd 실패 가드 (양평 검토 ③): -e를 껐으므로 경로 오타·미마운트 시
# 엉뚱한 CWD에서 계속 실행되는 것을 막는다
cd /path/to/coinchart || { echo "FATAL: cd /path/to/coinchart 실패"; exit 1; }

echo "===== $(date -u +%FT%TZ) daily cron start ====="
npx tsx scripts/update-news.ts
npx tsx scripts/update-market-data.ts
npx tsx scripts/daily_cron.ts
rc=$?   # ⚠️ daily_cron 종료코드를 즉시 캡처 (양평 검토 ①)
echo "===== $(date -u +%FT%TZ) daily cron end (daily_cron exit=$rc) ====="
exit $rc   # 스크립트 종료코드를 daily_cron의 것으로 전파 — 안 그러면 마지막 echo(=0)로 덮여 실패가 침묵
```

> 🔴 **종료코드 유실 주의 (양평 검토 ①, 필수)**: bash 스크립트의 최종 종료코드는 **마지막 실행 명령**의 것입니다. `echo`를 마지막에 두면 `daily_cron.ts`가 `exit 1`로 실패해도 래퍼는 **항상 0**으로 끝나, systemd `Type=oneshot`은 초록불·`OnFailure=` 미발동, crontab `MAILTO` 실패 메일 미발송이 됩니다. §3 알림 stub + §7.4 킬스위치 미연결과 겹치면 **실패가 무인 침묵**합니다. 반드시 `rc=$?` 캡처 후 `exit $rc`로 전파하세요.

crontab: `0 21 * * * /path/to/coinchart/run-daily.sh >> /var/log/coinchart/cron.log 2>&1`

### 5-B. Linux (systemd timer) — 권장(로그/재시도 관리 우수)

`/etc/systemd/system/coinchart-cron.service`:
```ini
[Unit]
Description=Coinchart daily data sync
After=network-online.target
Wants=network-online.target   # After만으론 타깃을 끌어오지 못함 — 부팅 직후 첫 실행 DNS 레이스 방지 (양평 검토 ⑥)

[Service]
Type=oneshot
WorkingDirectory=/path/to/coinchart
ExecStart=/path/to/coinchart/run-daily.sh
# ⚠️ EnvironmentFile은 dotenv 포맷과 호환되지 않을 수 있음 (양평 검토 ⑤):
#    systemd는 `export` 미지원, 따옴표 규칙 상이, `#` 주석은 줄 시작만 인식.
#    service_role 키는 보통 영숫자/._-라 대개 무해하나, 안전하게 가려면
#    cron 경로를 .env.local(dotenv) 한 가지로 통일하고 아래 줄은 쓰지 말 것.
# EnvironmentFile=/path/to/coinchart/.env.local
```
`/etc/systemd/system/coinchart-cron.timer`:
```ini
[Unit]
Description=Run coinchart daily sync at 21:00 UTC

[Timer]
OnCalendar=*-*-* 21:00:00 UTC
Persistent=true

[Install]
WantedBy=timers.target
```
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now coinchart-cron.timer
sudo systemctl list-timers | grep coinchart   # 다음 실행 시각 확인
journalctl -u coinchart-cron.service          # 로그 확인
```

### 5-C. Windows (작업 스케줄러)

`run-daily.ps1`:
```powershell
# SYSTEM/서비스 계정으로 돌면 node/npx가 PATH에 없을 수 있음 (양평 검토 ⑦)
# → node 설치 경로를 PATH에 보강하거나 절대경로 사용
$env:Path = "C:\Program Files\nodejs;" + $env:Path

Set-Location "C:\path\to\coinchart"
if (-not $?) { Write-Error "cd 실패"; exit 1 }

& npx tsx scripts/update-news.ts
& npx tsx scripts/update-market-data.ts
& npx tsx scripts/daily_cron.ts
$rc = $LASTEXITCODE   # daily_cron 종료코드 캡처
"===== $(Get-Date -Format o) daily cron end (exit=$rc) ====="
exit $rc              # 종료코드 전파 (①과 동일 원칙)
```
작업 스케줄러에서 매일 06:00(KST) 트리거 → 동작: `powershell.exe -ExecutionPolicy Bypass -File C:\path\to\coinchart\run-daily.ps1`.
로그를 남기려면 작업 동작을 `cmd /c "powershell ... >> C:\logs\coinchart\cron.log 2>&1"` 형태로 감싸세요(PS 래퍼 자체엔 리다이렉트가 없음).

---

## 6. 로그

> ⚠️ **스크립트는 로그 파일을 직접 만들지 않습니다.** 내부 `createLogger`는 이름표만 붙여 `console.log/error`로 출력합니다(예: `[daily_cron.log] ...`는 **접두사 라벨**일 뿐 실제 파일 아님). 따라서 **운영자가 stdout/stderr를 파일로 리다이렉트**해야 기록이 남습니다(위 예시의 `>> cron.log 2>&1`).

권장:
- 로그 디렉토리 미리 생성 + 소유권 부여(`/var/log` 하위는 root 소유라 일반 사용자 crontab은 쓰기 실패 — 양평 검토 A-3):
  ```bash
  sudo mkdir -p /var/log/coinchart && sudo chown "$USER" /var/log/coinchart
  ```
  (권한 문제를 피하려면 홈 디렉토리 하위 `~/coinchart-logs/`를 써도 됩니다.)
- logrotate 또는 systemd-journald로 보관 주기 관리(일 1회·소량이라 부담 작음)

---

## 7. 주의사항 · 함정 (반드시 읽기)

1. **멱등(idempotent) — 하루 1회만 의미**
   `daily_cron.ts`(배치 분석)는 같은 날짜에 `batch_runs`에 `completed` 기록이 있으면 **자동 skip**합니다. 같은 날 두 번 돌려도 분석은 재실행되지 않습니다(정상). 강제 재실행 옵션은 현재 스크립트에서 노출돼 있지 않으니, 하루 1회 스케줄이면 충분합니다.
   (단 1·2단계 update-news/market-data는 매번 upsert하므로 여러 번 돌려도 안전하게 갱신됩니다.)

2. **분석 단계의 데이터 요구량 — "Insufficient data" 경고 가능성** ⚠️
   3단계 배치 분석은 심볼당 **충분한 캔들(50개 이상, 코드상 24시간×5분봉 288개 기대)** 을 `market_prices`에서 읽으려 합니다. 그런데 2단계 update-market-data는 **일봉 5일치**만 적재합니다. 따라서 `market_prices`를 채우는 **다른 경로(실시간 5분봉 수집 등)가 없으면** 분석이 대부분 `Insufficient market data`로 스킵될 수 있습니다.
   → 이는 자체 서버 이관과 무관하게 **기존 GitHub Actions에서도 동일했던 구조**입니다. cron 이관 자체는 "기존 동작 그대로"가 목표이므로 그대로 두되, 분석 결과가 비어 보이면 이 미스매치가 원인입니다(별도 과제로 분리 권장).

3. **알림은 현재 발송되지 않음**
   `alert_engine`의 발송부는 stub(콘솔 출력)입니다. `alert_history` 테이블에는 기록되지만 실제 메일/디스코드 알림은 가지 않습니다. 알림이 필요하면 별도 구현 과제입니다.

4. **킬스위치 미연결**
   `NEXT_PUBLIC_DISABLE_AUTOMATION` 환경변수는 `lib/config/gates.ts`에 정의만 돼 있고, 이 cron 스크립트 경로에서는 **호출하지 않습니다**. 즉 이 변수로는 cron이 멈추지 않습니다. cron을 끄려면 스케줄(crontab/timer)을 비활성화하세요.

5. **TwelveData 키 혼동 주의**
   GitHub Actions YAML이 `TWELVEDATA_API_KEY`를 주입했다고 해서 cron에 필수인 것은 아닙니다. 위 3개 스크립트는 주식 데이터를 Yahoo Finance(무인증)에서 가져오므로 이 키 없이 동작합니다.

6. **비밀 키 취급**
   `SUPABASE_SERVICE_ROLE_KEY`는 RLS를 우회하는 최상위 권한 키입니다. `.env.local` 파일 권한을 `600`으로 제한하고, 로그·에러 메시지에 노출되지 않도록 주의하세요. 절대 커밋 금지(`.gitignore`에 `.env.local` 포함 확인).

---

## 8. 검증 체크리스트 (이관 완료 판정)

- [ ] `node -v` ≥ 20
- [ ] `npm ci` 성공 (`node_modules` 생성)
- [ ] `.env.local`에 필수 2개 설정 + 파일 권한 600
- [ ] 수동 3단계 실행 — daily_cron 종료코드 0 확인
- [ ] Supabase 대시보드에서 `news`·`market_prices`·`batch_runs` 테이블에 신규 행 확인
      (⚠️ 실행이 UTC 21:00이라 스크립트가 UTC로 날짜를 찍으면 KST 기준 "어제" 날짜로 보일 수 있음 — TZ 기준을 정해두고 확인. 양평 검토 A-3. 멱등 "같은 날짜" 판정의 TZ도 동일 이슈로, 자정 부근 중복/스킵 가능성 인지)
- [ ] cron/timer 등록 후 `systemctl list-timers`(또는 `crontab -l`)로 다음 실행 시각 확인
- [ ] 다음 날 로그 파일에 실행 흔적 + 종료코드 0 확인
- [ ] (선택) `coinchart.vercel.app` 뉴스/시세 갱신 시각이 최신으로 바뀌는지 확인

---

## 9. 문제 해결 (Troubleshooting)

| 증상 | 원인 / 조치 |
|------|------------|
| `❌ Missing Supabase Credentials` 후 즉시 종료 | `.env.local` 미로드 또는 변수 오타. 레포 루트에 파일 있는지, 키 이름 정확한지 확인 |
| `Missing Supabase credentials in .env.local` | 위와 동일(update-news/market 측 메시지) |
| 분석 결과가 비어 있음 / `Insufficient market data` | 7장 2번 참고 — `market_prices` 5분봉 데이터 부족(구조적, 별도 과제) |
| `tsx: command not found` | `tsx`는 devDependency. 서버 `NODE_ENV=production`이면 `npm ci`가 건너뜀 → `npm ci --include=dev`로 재설치(§2 NODE_ENV 함정 참고) |
| Yahoo/RSS 간헐 실패 | 외부 소스 일시 장애. 스크립트가 개별 실패를 흡수하고 계속함. 다음 날 자동 복구 |
| cron이 안 돎 | 서버 타임존(`date`) 확인 — UTC/KST 혼동이 가장 흔한 원인. systemd는 `OnCalendar`에 `UTC` 명시 권장 |

---

## 부록: 참조 소스 파일

- `.github/workflows/daily-cron.yml` — 기존 GitHub Actions 정의(스케줄·env 주입 참고)
- `scripts/daily_cron.ts` → `scripts/batch_orchestrator.ts` → `batch_analysis.ts`·`report_generator.ts`·`alert_engine.ts`
- `scripts/update-news.ts`, `scripts/update-market-data.ts`
- `lib/config/gates.ts` — 킬스위치 정의(배치 미연결)
- `lib/logger.ts` — 콘솔 전용 로거(파일 미생성)
- `docs/references/_ENV_REFERENCE.md` — 환경변수 전체 인덱스
