# R14-T02 인수인계 — DEPLOYMENT_RUNBOOK 전면 정정

- **날짜**: 2026-05-30
- **라운드/터미널**: R14 (loose-ends) / T02 (Wave 1, 독립)
- **작업 범위**: `docs/DEPLOYMENT_RUNBOOK.md` 단일 파일 전면 재작성
- **`.github/workflows/`**: 읽기만 수행(T03 영역 — 수정 없음)

## 1. 무엇을 했나

stale했던 `docs/DEPLOYMENT_RUNBOOK.md`(Last Updated 2025-12-28, 영어, "ChartMaster" + GitHub Release 게이트 가정)를 **세션 40(R13)에서 확정된 실제 배포 구조**에 맞춰 한국어로 전면 재작성했다.

## 2. 정정 전후 핵심 차이

| 구분 | 이전 (stale) | 정정 후 (실제) |
|------|--------------|----------------|
| 프로젝트명 | ChartMaster | Crypto Chart Analysis / `coinchart.vercel.app` |
| Last Updated | 2025-12-28 | 2026-05-30 |
| 언어 | 영어 | 한국어 (코드/키 식별자는 원형 유지) |
| **배포 트리거** | GitHub Release publish → `release-deploy.yml` (유일 경로라 명시) | **`main` 브랜치 push → Vercel Git 자동배포** |
| 배포 주체 | GitHub Actions + Vercel CLI(`VERCEL_TOKEN` 등) | Vercel Git Integration (Actions 불개입) |
| 모니터링 | GitHub Actions 탭 | **Vercel Dashboard** (Actions 탭은 배포와 무관 명시) |
| 롤백 | 자동 rollback 파이프라인 | **Vercel Dashboard → Promote to Production (수동)**, 자동 롤백 없음 명시 |
| 품질 게이트 | KPI 게이트(`release_kpi.json`)로 다음 릴리스 차단 | 유물 — 작동 안 함 (트리거 없음) |
| CI/CD secret | `VERCEL_TOKEN`/`ORG_ID`/`PROJECT_ID` 필수 | **불필요** 명시 (데이터 동기화용 Supabase/TwelveData만) |

## 3. 보존한 항목 (Kill-Switch)

기존 런북의 **Kill-Switch 절차는 현 구조에서도 유효**하므로 보존했다(표현만 현 구조에 맞게 정리):

- `NEXT_PUBLIC_DISABLE_AUTOMATION=true` / `NEXT_PUBLIC_DISABLE_PRO_GATE=true` 를 Vercel Production env로 설정 후 **Redeploy**.
- "env는 빌드 타임 주입 → Redeploy 필수" 주의를 환경변수·Kill-Switch 양쪽에 명시.

## 4. 유물(Deprecated) 처리 방식

`release-deploy.yml` / `release-validate.yml` / `release-observe.yml` 3종을 **별도 "유물(Deprecated)" 섹션**으로 강등하여 다음 개발자 혼동을 차단:

- 표로 "원래 가정 → 현재 상태(`workflow_dispatch` 수동 전용 강등, 커밋 `b9fd654`)" 정리.
- **왜 유물인가**: `VERCEL_TOKEN` 등 secret 미등록 → release publish 시 항상 실패한 중복 파이프라인. 실제 배포는 처음부터 Vercel Git. private 시절 `release-observe`의 `*/15` schedule이 billing 압박 → 자동 트리거 전부 제거(삭제 아닌 보존).
- "더 이상 의존하지 말 것" + 정식 부활 시 절차(secret 등록 + 트리거 복구 + 중복 제거) 명시.

> 실제 워크플로우 파일 직접 확인 결과(읽기): release 3종 모두 `on: workflow_dispatch`만 남음. `daily-cron.yml`만 `schedule('0 21 * * *') + workflow_dispatch`로 살아있음(데이터 동기화 전용, 배포와 무관) → 런북에 별도 섹션으로 반영, 상세 검증은 R14-T03 링크.

## 5. 자가 검증 결과

```
ChartMaster 잔존        : 0건 ✅
VERCEL_TOKEN 언급       : 2건 (둘 다 "불필요"/"등록된 적 없다" 유물 설명 맥락) ✅
실제배포 키워드          : 8건 (Vercel Git/자동배포/coinchart) ✅
Kill-Switch/DISABLE_*  : 5건 보존 ✅
파일 존재               : True ✅
```

## 6. 후속/주의

- **`.github/workflows/` 미수정** — daily-cron 실제 동작 검증은 R14-T03 담당.
- 근거 SOT: `docs/solutions/2026-05-30-private-actions-billing-vercel-git-deploy.md`, `docs/handover/2026-05-30-session40-r13-display.md`.
- 환경변수 상세는 런북에서 `docs/ENV_REQUIRED.md` 링크로 위임(중복 관리 회피).
