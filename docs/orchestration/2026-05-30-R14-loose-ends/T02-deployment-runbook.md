# T02 — DEPLOYMENT_RUNBOOK 전면 정정 (Release 게이트 → Vercel Git 자동배포)

## 1. 컨텍스트

- 프로젝트: Crypto Chart Analysis (코인 차트 분석)
- 작업 디렉토리(쓰기 허용): **`docs/DEPLOYMENT_RUNBOOK.md` 단일 파일만**
- 본 터미널 역할: **T02 / 4** — 배포 런북을 실제 배포 구조와 일치시키는 문서 정정
- 라운드: **R14 (loose-ends)** / Wave 1 (독립)

## 2. 배경 (왜 이 작업인가)

현재 `docs/DEPLOYMENT_RUNBOOK.md`는 **완전히 stale**하다 (Last Updated 2025-12-28):

- 프로젝트명이 **"ChartMaster"** (현 프로젝트명과 불일치)
- 전체가 **"GitHub Release publish → `release-deploy.yml` 자동 배포 + KPI 품질 게이트"** 가정
- `VERCEL_TOKEN`/`VERCEL_ORG_ID`/`VERCEL_PROJECT_ID` secret 기반 GitHub Actions 배포 가정

**그러나 세션 40(R13)에서 실제 배포 구조가 다음으로 확정됐다**:

- **실제 배포 = Vercel Git 자동배포**: `main` 브랜치 push → Vercel이 자동 빌드·배포 (`coinchart.vercel.app`). GitHub Actions 불개입.
- 레포는 **Public** (private 레포 Actions billing 차단 → Public 전환으로 무료화).
- `release-deploy.yml`·`release-validate.yml`·`release-observe.yml`은 **VERCEL secret 미설정 중복 유물** → `workflow_dispatch`/schedule 트리거가 **비활성화**됨 (커밋 `b9fd654`). 더 이상 배포 경로가 아님.
- 살아있는 워크플로우는 **`daily-cron.yml`(Daily Data Sync, schedule)** 하나뿐.

## 3. 공통 SOT (읽기 전용 — 정정 근거)

```
docs/solutions/2026-05-30-private-actions-billing-vercel-git-deploy.md   배포 경로 정상화 전말 (1차 근거)
docs/status/current.md  →  "배포 구조 확정(세션40)" 섹션 + 미해결사항 R14 후보
.github/workflows/daily-cron.yml           유일하게 살아있는 워크플로우
.github/workflows/release-*.yml            비활성화된 유물 3종 (현 상태 직접 확인)
docs/handover/2026-05-30-session40-r13-display.md   세션 40 배포 경로 정상화 기록
```

## 4. 작업 목표 — `docs/DEPLOYMENT_RUNBOOK.md` 재작성

다음 구조로 **전면 재작성**(기존 KPI 게이트/Release publish 절차는 "유물(Deprecated)" 섹션으로 강등하거나 삭제):

1. **헤더**: Last Updated 2026-05-30, 프로젝트명 정정(ChartMaster → Crypto Chart Analysis / coinchart), 배포 방식 = Vercel Git Integration.
2. **🚀 배포 방법 (실제)**: `main` 브랜치에 commit & push → Vercel 자동 빌드·배포. 별도 트리거·승인 불필요. 프리뷰 배포(PR/브랜치)도 Vercel이 자동 생성하면 그 동작 명시.
3. **모니터링**: Vercel Dashboard(빌드 로그·배포 상태) + 라이브 헬스 확인(`coinchart.vercel.app`). GitHub Actions 탭은 배포와 무관(daily-cron 전용)임을 명시.
4. **롤백**: Vercel Dashboard → Deployments → 이전 배포 "Promote to Production"(수동). 자동 롤백 파이프라인은 없음을 분명히.
5. **Pre-push 체크리스트**: `npx tsc --noEmit` 0 · `npm run build` 통과 · (가능 시 `npm run preflight`) · Supabase 마이그레이션 적용 여부.
6. **환경변수(Vercel Production)**: 실제 필요한 것 — `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`/`SUPABASE_SERVICE_ROLE_KEY`/`NEXT_PUBLIC_APP_MODE`/`NEXT_PUBLIC_DISABLE_AUTOMATION`/`NEXT_PUBLIC_DISABLE_PRO_GATE` (상세는 `docs/ENV_REQUIRED.md` 참조 링크). **VERCEL_TOKEN 등 GitHub Actions 배포 secret은 불필요**임을 명시.
7. **Kill-Switch**: `NEXT_PUBLIC_DISABLE_AUTOMATION=true`/`NEXT_PUBLIC_DISABLE_PRO_GATE=true`를 Vercel env로 설정 후 Redeploy — 이 부분은 기존 런북에서 살아있는 유효 절차이므로 보존(단 표현을 현 구조에 맞게).
8. **daily-cron**: schedule 기반 데이터 동기화 워크플로우 존재(배포와 무관). 상세 검증은 R14-T03이 별도 수행 중임을 1줄 링크.
9. **유물 섹션(Deprecated)**: `release-*.yml` 3종은 미작동 유물이며 배포 경로가 아님을 1문단으로 남겨, 다음 개발자가 혼동하지 않게.

## 5. 도구 권장

- 직접 작성(Write/Edit). `/kdyrunbook` 스킬이 있으면 참고 가능하나 본 문서는 수동 정정이 정확.

## 6. 의존성

- **독립** (Wave 1). 다른 터미널 파일과 겹침 없음. `.github/workflows/`는 **읽기만**(T03이 수정 담당 — 충돌 금지).

## 7. 검증 (자가)

```powershell
# 1) stale 토큰 잔존 0 확인
Select-String -Path docs/DEPLOYMENT_RUNBOOK.md -Pattern 'ChartMaster|release-deploy\.yml.*ONLY|VERCEL_TOKEN'
# 2) 실제 배포 키워드 존재 확인
Select-String -Path docs/DEPLOYMENT_RUNBOOK.md -Pattern 'Vercel Git|자동배포|main.*push|coinchart'
# 3) 파일 존재
Test-Path docs/DEPLOYMENT_RUNBOOK.md
```

## 8. 완료 신호

`docs/handover/2026-05-30-R14-T02-deployment-runbook.md` 작성 — 정정 전후 핵심 차이(Release게이트→Vercel Git) + 보존 항목(Kill-Switch) + 유물 처리 방식 명시.

## 안티패턴

- ❌ `docs/DEPLOYMENT_RUNBOOK.md` 외 파일 수정 (특히 `.github/workflows/`는 T03 영역 — 읽기만)
- ❌ stale 정보를 일부만 고치고 GitHub Release 게이트 서술을 남겨두기 (혼동 유발 — 명확히 유물로 강등/삭제)
- ❌ 실제로 존재하지 않는 자동 롤백·KPI 게이트를 "작동하는 것처럼" 서술 (실제 코드 상태와 불일치)
- ❌ 영어 원문을 그대로 두기 — 본 프로젝트 문서 규약은 한국어(기존 영어 런북을 한국어로 재작성 권장, 단 코드/키 식별자는 원형 유지)
- ❌ handover 누락
