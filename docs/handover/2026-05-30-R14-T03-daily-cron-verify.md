# R14-T03 — daily-cron 정상작동 확인 + 경미 정비 (인수인계서)

- **작성일**: 2026-05-30
- **라운드/터미널**: R14 (loose-ends) / T03 (Wave 1, 독립)
- **작업 범위(쓰기)**: `.github/workflows/` 만
- **대상**: `.github/workflows/daily-cron.yml` (Daily Data Sync, schedule `0 21 * * *`)

---

## (a) 작동 상태 판정 — ❌ **실패 (작동 안 함)**

**근본 원인: GitHub 계정 결제 차단 (워크플로우/스크립트 결함 아님).**

`gh run list --workflow=daily-cron.yml` 최근 10건:

| 일시(UTC) | 결과 | 소요 | run id |
|-----------|------|------|--------|
| 2026-05-29 22:37 | ❌ failure | 4s | 26665745336 |
| 2026-05-28 22:40 | ❌ failure | 4s | 26606522576 |
| 2026-05-27 22:41 | ❌ failure | 4s | 26543035985 |
| 2026-05-26 22:20 | ❌ failure | 4s | 26478470526 |
| 2026-05-25 22:08 | ❌ failure | 3s | 26421696613 |
| 2026-05-24 21:57 | ✅ success | 1m24s | 26373840277 |
| 2026-05-23 21:57 | ✅ success | 1m38s | 26344587504 |
| 2026-05-22 22:09 | ✅ success | 1m36s | 26314375461 |
| 2026-05-21 22:20 | ✅ success | 1m23s | 26256482221 |
| 2026-05-20 22:24 | ✅ success | 1m40s | 26193474274 |

**5-24까지 정상(1분+ 실행), 5-25부터 5회 연속 실패(3~4초 조기 종료).** 실패 run 3건(26665745336·26606522576·26421696613) 모두 동일 annotation:

> ❌ **"The job was not started because recent account payments have failed or your spending limit needs to be increased. Please check the 'Billing & plans' section in your settings."**

- job이 **시작조차 못 함**(3~4초) → `setup-node`·`npm ci`·스크립트 실행 단계에 **도달하지 못함**. 즉 YAML/스크립트와 무관한 **계정 레벨 차단**.
- 레포 가시성: `kimdooo-a/coinchart` = **PUBLIC** (확인됨). Public 레포는 Actions 분(minutes)이 무료지만, **계정에 결제 실패/지출한도 문제가 있으면 Public 포함 모든 Actions 실행이 차단**된다. → memory의 "Public 전환으로 무료화" 전제는 **불완전**: 가시성 전환만으로는 부족하고, **기존 결제 실패 건이 별도로 해소돼야** 한다.

### 판정 요약
- 워크플로우 YAML: **정상** (5-24 성공이 증명)
- 호출 스크립트: **정상** (아래 (b))
- secret: **3종 모두 등록됨** (아래)
- **실패 원인 = 계정 결제 차단 (코드/설정으로 해결 불가, 사용자 조치 필요 — (d) 참조)**

---

## (b) 스크립트 정합 결과 — ✅ 정합 (수정 불필요)

`daily-cron.yml`이 호출하는 3개 스크립트 모두 실존·정합:

| 스크립트 | 실존 | 읽는 env | 워크플로우 주입 env | 정합 |
|----------|:----:|----------|---------------------|:----:|
| `scripts/update-news.ts` | ✅ | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`(fallback `NEXT_PUBLIC_SUPABASE_ANON_KEY`) | URL, SERVICE_ROLE | ✅ |
| `scripts/update-market-data.ts` | ✅ | 〃 | URL, SERVICE_ROLE | ✅ |
| `scripts/daily_cron.ts` | ✅ | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (→ `batch_orchestrator.ts` 위임) | URL, SERVICE_ROLE, TWELVEDATA_API_KEY(+NEXT_PUBLIC_) | ✅ |

- 세 스크립트 모두 `npx tsx scripts/*.ts`로 실행 가능한 형태(`import`/`dotenv.config` 정상). `dotenv`는 `.env.local`을 로드하나 CI엔 그 파일이 없고 secret이 process.env로 주입되므로 문제 없음(dotenv는 기존 env 미덮어씀).
- **참고(문제 아님)**: `daily_cron` step에 주입되는 `TWELVEDATA_API_KEY` / `NEXT_PUBLIC_TWELVEDATA_API_KEY`는 `daily_cron.ts` → `batch_orchestrator.ts` 체인에서 **실제로 읽지 않음**(코드베이스에서 `TWELVEDATA_API_KEY`를 읽는 곳은 `scripts/preflight.ts`·`app/api/stock/quote/route.ts` 뿐). YAML 주석도 *"Just in case script checks this"*로 이미 인지. **무해**하므로 제거하지 않음(불필요 변경 금지 원칙).
- secret 등록 상태(`gh secret list`, 값 비노출):
  - `NEXT_PUBLIC_SUPABASE_URL` (2025-12-13)
  - `SUPABASE_SERVICE_ROLE_KEY` (2025-12-13)
  - `TWELVEDATA_API_KEY` (2025-12-13)
  → cron이 쓰는 secret 3종 **모두 존재**. secret 누락은 실패 원인이 **아님**.

---

## (c) 정비한 항목 — 1건 (최소 변경)

`actions/setup-node@v3 → @v4` (작업 지시서 4-3이 명시 허용한 deprecation 정비):

```diff
     - name: Setup Node
-      uses: actions/setup-node@v3
+      uses: actions/setup-node@v4
       with:
         node-version: 18
```

- 근거: `setup-node@v3`는 GitHub가 deprecate한 Node16 런타임 기반 액션. `@v4`는 안정판이며 `node-version: 18`과 호환.
- YAML 파싱 검증 완료(`python yaml.safe_load` — jobs `run-sync` 1개, 들여쓰기 정상).
- **이 정비는 실패 원인과 무관**(실패는 결제 차단). 향후 정상 재가동 시의 노후 제거 차원.

### 정비하지 않은 항목 (근거 없어 보존)
- `node-version: 18` → 20 상향: **보존**. 5-24 성공이 node 18 정상 동작을 증명 → 실패 근거 없음. 단 Node 18은 EOL(2025-04 종료)이므로 **권고만**: 결제 정상화 후 여유 있을 때 `20`으로 상향 권장.
- `actions/checkout@v4`: 최신 → 유지.
- `release-*.yml` 3종: R14 범위 밖(T02 문서 처리) → 손대지 않음.

---

## (d) 사용자가 직접 확인/조치해야 할 항목

1. **[필수·차단 해소] GitHub 계정 결제 문제 해결** — `kimdooo-a` 계정
   - 위치: GitHub → Settings → **Billing & plans** (`kimdooo-a` 계정)
   - 조치: 실패한 결제 수단 갱신 또는 **spending limit 상향**. 이게 풀려야 daily-cron(및 모든 Actions)이 재가동됨.
   - ⚠️ 레포가 Public이어도 **계정 결제 hold가 걸려 있으면 Public Actions까지 차단**됨 — 가시성 전환만으로 해결 안 됨.
2. **[검증] 결제 정상화 후 수동 트리거 테스트**
   - `gh workflow run daily-cron.yml` 또는 GitHub Actions UI → "Daily Data Sync" → Run workflow
   - 이후 `gh run list --workflow=daily-cron.yml --limit 1`로 success(1분+ 실행) 확인.
   - 현재는 결제 차단 탓에 수동 트리거도 동일하게 실패하므로, **결제 해소가 선행**돼야 함.
3. **[데이터 간접 확인]** 5-25부터 동기화가 멈췄으므로 `coinchart.vercel.app`의 뉴스/시세 갱신 시각이 5-24에 머물러 있을 수 있음 — 결제 정상화 후 첫 성공 run 뒤 갱신 여부 확인.

---

## 검증 로그 (자가)

- `gh auth status`: 인증됨(`kimdooo-a`, scopes에 `workflow` 포함).
- `gh repo view`: `kimdooo-a/coinchart`, visibility=PUBLIC.
- `gh workflow list --all`: Daily Data Sync = **active**.
- `Test-Path` 등가: 3개 스크립트 모두 EXISTS.
- 변경 후 `daily-cron.yml` YAML 파싱 OK.

## 한 줄 결론
**daily-cron은 코드/설정상 건전하나 2026-05-25부터 계정 결제 차단으로 전면 실패 중. 유일한 해결책은 `kimdooo-a` 계정 Billing & plans에서 결제 문제를 사용자가 직접 해소하는 것.** 워크플로우 측 정비는 `setup-node@v3→v4` 1건(무관·노후 제거)만 수행.
