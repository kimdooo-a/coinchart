# 배포 런북 (Deployment Runbook)

**Last Updated**: 2026-05-30
**프로젝트**: Crypto Chart Analysis (코인 차트 분석) — 라이브 `coinchart.vercel.app`
**배포 방식**: **Vercel Git Integration (자동배포)**

> [!IMPORTANT]
> 이 문서는 세션 40(R13)에서 확정된 **실제 배포 구조**를 기준으로 한다.
> 과거 런북이 가정하던 "GitHub Release publish → `release-deploy.yml` 자동 배포 + KPI 품질 게이트"는
> **한 번도 작동한 적 없는 미설정 유물**이다. 상세는 본문 맨 아래 [유물(Deprecated)](#유물-deprecated--release-yml-3종) 섹션 참조.
> 근거: `docs/solutions/2026-05-30-private-actions-billing-vercel-git-deploy.md`

---

## 🚀 배포 방법 (실제)

배포는 **GitHub `main` 브랜치 push 한 번으로 끝난다.** 별도 트리거·승인·릴리스 발행 절차가 없다.

```powershell
git checkout main
git pull
# (작업/머지)
git push origin main
```

- `main`에 commit이 push되면 **Vercel이 GitHub 레포를 Git 연동**하여 자동으로 빌드·배포한다.
- 빌드 성공 시 곧바로 Production(`coinchart.vercel.app`)에 반영된다.
- **GitHub Actions는 배포에 개입하지 않는다** (아래 [모니터링](#-모니터링) 참조).

### 프리뷰 배포 (PR / 기능 브랜치)

- `main`이 아닌 브랜치를 push하거나 PR을 올리면 Vercel이 **프리뷰 배포(Preview Deployment)** 를 자동 생성한다.
- 프리뷰 URL은 PR 코멘트 또는 Vercel Dashboard의 해당 Deployment에서 확인한다.
- 프리뷰는 Production에 영향을 주지 않으므로, 머지 전 실배포 검증 용도로 사용한다.

---

## 👁️ 모니터링

| 무엇을 | 어디서 | 비고 |
|--------|--------|------|
| 빌드 로그·배포 상태·배포 이력 | **Vercel Dashboard → Deployments** | 배포의 단일 진실 공급원 |
| 라이브 헬스 | `https://coinchart.vercel.app` 직접 접속 | 200 응답·핵심 라우트(`/watchlist`, `/settings`) 확인 |
| 인프라 상태 | `status.vercel.com` | Vercel 장애 여부 |
| DB 상태 | Supabase Dashboard | `app.supabase.com/project/[id]` |

> [!NOTE]
> **GitHub Actions 탭은 배포 상태와 무관하다.** Actions에서 살아있는 워크플로우는 데이터 동기화용
> `daily-cron.yml` 하나뿐이며(아래 [daily-cron](#-daily-cron-데이터-동기화--배포와-무관) 참조), 배포 결과를 여기서 찾지 말 것.
> 배포 성공/실패는 항상 **Vercel Dashboard**에서 확인한다.

---

## 🔄 롤백

자동 롤백 파이프라인은 **없다.** 롤백은 Vercel Dashboard에서 **수동**으로 수행한다.

1. **Vercel Dashboard → Deployments** 진입.
2. 정상 동작하던 **이전 배포**를 찾는다(이력에서 직전 Production 배포).
3. 해당 배포의 `⋯`(more) 메뉴 → **Promote to Production**.
4. 라이브(`coinchart.vercel.app`)에서 복구 확인.

> 즉시 무력화가 필요한 비상 상황(서비스 자체를 멈추진 않되 자동화/유료기능만 끄는 경우)에는
> 아래 [Kill-Switch](#-kill-switch-비상-차단) 절차를 병행한다.

---

## 🔍 Pre-push 체크리스트

`main`에 push하기 전(= 배포 직전) 로컬에서 확인한다:

- [ ] `npx tsc --noEmit` → 타입 에러 **0**
- [ ] `npm run build` → 빌드 통과
- [ ] (가능 시) `npm run preflight` 통과
- [ ] Supabase 마이그레이션이 운영 DB에 적용되어 있는지 확인
- [ ] `.env` / `.env.local` 가 커밋에 포함되지 않았는지 확인

> Vercel은 push 즉시 빌드를 시작하므로, 빌드 실패는 곧 배포 실패다.
> 로컬 빌드를 먼저 통과시키는 것이 가장 확실한 사전 게이트다.

---

## 🛠️ 환경변수 (Vercel Production)

배포에 필요한 환경변수는 **Vercel Dashboard → Settings → Environment Variables (Production)** 에 설정한다.

| 변수 | 용도 |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon 키 (클라이언트) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role 키 (서버 전용) |
| `NEXT_PUBLIC_APP_MODE` | 앱 모드 |
| `NEXT_PUBLIC_DISABLE_AUTOMATION` | 자동화 차단 스위치 (Kill-Switch) |
| `NEXT_PUBLIC_DISABLE_PRO_GATE` | Pro 게이트 차단 스위치 (Kill-Switch) |

- 상세 목록·필수/선택 구분은 `docs/ENV_REQUIRED.md` 참조.
- 환경변수 변경 후에는 **Redeploy** 해야 반영된다(빌드 타임에 주입되므로).

> [!IMPORTANT]
> **`VERCEL_TOKEN` / `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` 같은 GitHub Actions 배포용 secret은 불필요하다.**
> 배포는 Vercel Git 연동이 담당하므로 GitHub Actions에서 Vercel CLI로 배포하지 않는다.
> (GitHub Secrets에는 데이터 동기화용 Supabase·TwelveData 키만 있으면 된다 — `daily-cron` 용도.)

---

## 🛑 Kill-Switch (비상 차단)

서비스가 불안정할 때 **자동화 및 유료기능을 즉시 끄는** 유효 절차다. (배포 구조가 바뀌어도 이 절차는 그대로 유효하다.)

1. **Vercel Dashboard** 로그인 → 프로젝트 선택.
2. **Settings → Environment Variables** 진입.
3. **Production** 환경에 다음을 설정:
   - `NEXT_PUBLIC_DISABLE_AUTOMATION` = `true`
   - `NEXT_PUBLIC_DISABLE_PRO_GATE` = `true` (불안정 구간에 사용자를 유료 기능으로부터 보호)
4. **Redeploy** 로 env를 반영:
   - **Deployments** → 현재 Production 배포의 `⋯` 메뉴 → **Redeploy**.

> 환경변수는 빌드 타임에 주입되므로, 값만 바꾸고 Redeploy하지 않으면 적용되지 않는다.

---

## ⏰ daily-cron (데이터 동기화 — 배포와 무관)

- `.github/workflows/daily-cron.yml` ("Daily Data Sync")는 **schedule(`0 21 * * *`, 매일 21:00 UTC) + 수동(`workflow_dispatch`)** 으로 동작하는 **유일하게 살아있는** GitHub Actions 워크플로우다.
- 역할: 뉴스 업데이트 / 마켓 데이터 업데이트 / 일일 동기화 스크립트 실행 (`scripts/update-news.ts`, `scripts/update-market-data.ts`, `scripts/daily_cron.ts`).
- **배포와 전혀 무관하다.** Supabase·TwelveData secret을 사용해 운영 DB를 갱신할 뿐이다.
- cron 동작·검증 상세는 R14-T03(daily-cron 점검)에서 별도 다룬다.

---

## 유물 (Deprecated) — `release-*.yml` 3종

다음 3개 워크플로우는 **미작동 유물이며 배포 경로가 아니다.** 다음 개발자의 혼동을 막기 위해 명시한다.

| 워크플로우 | 원래 가정 | 현재 상태 |
|------------|-----------|-----------|
| `release-deploy.yml` | `release:published` → Vercel CLI 배포 + healthcheck + 자동 rollback | `workflow_dispatch` 수동 전용으로 강등 (커밋 `b9fd654`) |
| `release-validate.yml` | `push: tags v*` → 이전 릴리스 KPI 품질 게이트 | `workflow_dispatch` 수동 전용으로 강등 |
| `release-observe.yml` | `schedule */15` + `workflow_run` → KPI 수집·관측 | `workflow_dispatch` 수동 전용으로 강등 |

**왜 유물인가:**

- 이 파이프라인은 `VERCEL_TOKEN` / `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` secret을 전제하지만, 해당 secret은 **등록된 적이 없다.** 그래서 release publish 시 `vercel ... --token=`(빈 값)으로 **항상 실패**했다 — 한 번도 정상 배포를 수행한 적 없는 중복 파이프라인이다.
- 실제 배포는 처음부터 **Vercel Git 자동배포**가 담당해 왔다(`coinchart.vercel.app` 라이브).
- private 레포 시절 `release-observe`의 `*/15` schedule이 Actions 사용량을 빠르게 소진해 billing을 압박하기도 했다. 그래서 자동 트리거를 모두 제거하고 `workflow_dispatch`(수동) 전용으로 보존(삭제 아님 — 추후 정식 사용 시 복구 여지 유지)했다.

**여기에 더 이상 의존하지 말 것:**
- ❌ GitHub Release를 발행해도 배포되지 않는다.
- ❌ "KPI 품질 게이트 / 자동 rollback / release_kpi.json"은 작동하지 않는다 (코드는 남아있으나 트리거가 없다).
- ✅ 배포가 필요하면 **`main`에 push**하라.

> Vercel CLI 기반 Actions 배포를 정식으로 되살리려면: 위 3개 secret을 GitHub Secrets에 등록하고 각 워크플로우의 `on:` 트리거를 원래대로(`release:published` 등) 복구한 뒤, **Vercel Git 자동배포와 중복되지 않도록 하나만 남겨야** 한다.
