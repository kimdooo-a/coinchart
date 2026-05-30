# T03 — daily-cron Public 전환 후 정상작동 확인 + 경미 정비

## 1. 컨텍스트

- 프로젝트: Crypto Chart Analysis (코인 차트 분석)
- 작업 디렉토리(쓰기 허용): **`.github/workflows/` 만**
- 본 터미널 역할: **T03 / 4** — 레포 Public 전환(Actions 무료화) 후 `daily-cron.yml`이 정상 작동하는지 확인하고, 발견된 노후/오류를 경미하게 정비
- 라운드: **R14 (loose-ends)** / Wave 1 (독립)

## 2. 배경 (왜 이 작업인가)

세션 40(R13)에서 레포가 **Public으로 전환**되어 GitHub Actions가 무료화됐다(이전 private billing 차단). 살아있는 워크플로우는 **`daily-cron.yml`(Daily Data Sync, schedule `0 21 * * *`)** 하나뿐이며, 이것이 Public 전환 후 정상 작동하는지 **미확인** 상태다. `release-*.yml` 3종은 비활성화된 유물(배포 경로 아님 — R14-T02가 문서화 중).

## 3. 공통 SOT (읽기 전용)

```
.github/workflows/daily-cron.yml      검증·정비 대상
scripts/update-news.ts                cron이 호출하는 스크립트 (존재·시그니처 확인)
scripts/update-market-data.ts         〃
scripts/daily_cron.ts                 〃
docs/solutions/2026-05-30-private-actions-billing-vercel-git-deploy.md   Public 전환 배경
docs/ENV_REQUIRED.md                  cron이 쓰는 secret(SUPABASE_*·TWELVEDATA_API_KEY) 확인
```

## 4. 작업 목표

### 4-1. 실행 이력·설정 확인 (gh CLI — 자격 있으면)

```powershell
gh run list --workflow=daily-cron.yml --limit 10   # 최근 실행/성공·실패
gh workflow list                                    # 워크플로우 활성 상태
gh secret list                                      # 필요한 secret 등록 여부 (값은 안 보임)
```

- gh CLI 미인증/권한 부족이면 → 확인 불가 항목을 **handover에 "사용자 확인 필요"로 명시**(추측 금지). 라이브 데이터가 최근 갱신됐는지는 `coinchart.vercel.app`에서 간접 확인 가능.

### 4-2. 워크플로우·스크립트 정합 점검

- `daily-cron.yml`이 호출하는 3개 스크립트(`scripts/update-news.ts`·`update-market-data.ts`·`daily_cron.ts`)가 **실존**하고 `npx tsx`로 실행 가능한 형태인지 확인.
- env 매핑(`NEXT_PUBLIC_SUPABASE_URL`·`SUPABASE_SERVICE_ROLE_KEY`·`TWELVEDATA_API_KEY`)이 스크립트가 실제 읽는 변수명과 일치하는지 확인.

### 4-3. 경미 정비 (발견 시에만, 최소 변경)

다음은 노후 후보 — 실제로 문제를 일으키는 것만 정비(불필요한 변경 금지):

- **Node 버전**: 현재 `node-version: 18`. Next.js 16/현 의존성이 18에서 `npm ci` 또는 tsx 실행에 실패할 수 있으면 `20`으로 상향. (실패 근거 없으면 보존 — handover에 권고만)
- **actions 버전**: `actions/setup-node@v3` → `v4` (deprecation). `actions/checkout@v4`는 최신이라 유지.
- 변경은 **`daily-cron.yml`만**. 새 워크플로우 생성·release-* 수정 금지.

## 5. 도구 권장

- `gh` CLI(확인) + Edit(정비). `/kdycicd` 스킬 참고 가능.

## 6. 의존성

- **독립** (Wave 1). T02는 `.github/workflows/`를 **읽기만** 하므로 충돌 없음. 본 터미널이 `.github/workflows/`의 유일한 쓰기 주체.

## 7. 검증 (자가)

```powershell
# 워크플로우 YAML 문법 유효성 (gh 있으면)
gh workflow view daily-cron.yml
# 호출 스크립트 실존
Test-Path scripts/update-news.ts, scripts/update-market-data.ts, scripts/daily_cron.ts
# (정비했다면) YAML 파싱 확인 — 들여쓰기 깨짐 없는지
```

## 8. 완료 신호

`docs/handover/2026-05-30-R14-T03-daily-cron-verify.md` 작성 — **(a) 작동 상태 판정**(정상/실패/확인불가+사유) + (b) 스크립트 정합 결과 + (c) 정비한 항목(있으면 diff) + (d) **사용자가 직접 확인/조치해야 할 항목**(secret 등록·수동 트리거 테스트 등)을 분리 명시.

## 안티패턴

- ❌ `.github/workflows/` 밖 쓰기 (스크립트 `scripts/*.ts` 수정 금지 — 정합 점검만, 수정 필요 시 handover에 권고)
- ❌ `release-*.yml` 수정·삭제 (유물이지만 R14 범위 밖 — T02가 문서로 처리)
- ❌ 확인 불가한 것을 "정상 작동"으로 단정 (gh 권한 없으면 "확인 필요"로 정직하게)
- ❌ 근거 없는 버전 상향·구조 변경 (문제 일으키는 것만 최소 정비)
- ❌ secret 값을 로그·handover에 노출
- ❌ handover 누락 / 한국어 주석 규약 위반
