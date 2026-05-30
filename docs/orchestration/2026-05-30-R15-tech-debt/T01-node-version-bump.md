# T01 — GitHub Actions node 18 → 20 EOL 상향

## 1. 컨텍스트

- 프로젝트: Crypto Chart Analysis (코인 차트 분석)
- 작업 디렉토리(쓰기 허용): **`.github/workflows/` + `package.json` 만**
- 본 터미널 역할: **T01 / 4** — CI 워크플로우의 Node 런타임을 EOL된 18에서 20(LTS)으로 상향
- 라운드: **R15 (tech-debt)** / Wave 1 (독립)

## 2. 배경 (왜 이 작업인가)

- Node 18은 2025-04-30 EOL. GitHub Actions의 `actions/setup-node`가 18을 경고/곧 제거 대상으로 다룸.
- 현재 워크플로우들이 `node-version: 18`(또는 `'18'`)로 고정되어 있음.
- 유일하게 살아있는 워크플로우는 `daily-cron.yml`(schedule). `release-*.yml` 3종은 **비활성화된 유물**(R14 확정)이나, **위생 차원에서 일괄 20으로 통일**한다 (다음 개발자 혼동 방지·재활성화 대비).
- ⚠️ daily-cron은 현재 **GitHub 계정 결제 차단**으로 실행 자체가 안 되는 상태(R14 T03 발견). 이는 **본 작업과 무관**(코드/버전 문제 아님). node 버전만 올리면 됨.

## 3. 대상 (현 상태 — 직접 재확인)

```
.github/workflows/daily-cron.yml        : line ~21  node-version: 18
.github/workflows/release-deploy.yml    : 3곳       node-version: '18'
.github/workflows/release-validate.yml  : 2곳       node-version: '18'
.github/workflows/release-observe.yml   : node-version 없음 (대상 외)
package.json                            : engines 필드 없음 → 추가
```

## 4. 작업 목표

1. **`.github/workflows/` 내 모든 `node-version: 18` / `node-version: '18'` → `20` / `'20'`** 로 변경 (따옴표 스타일은 각 파일의 기존 표기 유지).
   - daily-cron.yml, release-deploy.yml(3곳), release-validate.yml(2곳) 전부.
   - 변경 시 해당 step의 `actions/setup-node` 버전이 `v3`이면 `v4`로 함께 상향(R14 T03이 daily-cron은 이미 v4로 정비했을 수 있으니 현 상태 확인 후 v3만 v4로).
2. **`package.json`에 `engines` 추가**: `"engines": { "node": ">=20" }` (기존 키 보존, 적절한 위치에 삽입 — 보통 `"version"` 또는 `"private"` 근처 최상위).
3. 그 외 워크플로우 로직·트리거·step 순서는 **건드리지 않는다** (버전 토큰만 최소 변경).

## 5. 도구 권장

- `Grep`로 `node-version` 전수 확인 → `Edit`로 파일별 치환. `replace_all` 주의(따옴표 스타일 혼재 가능).

## 6. 의존성

- **독립** (Wave 1). 다른 터미널과 파일 겹침 0. `.github/workflows/`는 본 터미널 전용.

## 7. 검증 (자가)

```powershell
# 1) node-version 18 잔존 0 (대상 워크플로우)
Select-String -Path .github/workflows/*.yml -Pattern "node-version:\s*'?18'?"
# 위 결과가 비어야 PASS

# 2) node-version 20 존재 확인
Select-String -Path .github/workflows/*.yml -Pattern "node-version:\s*'?20'?"

# 3) package.json engines 확인
Select-String -Path package.json -Pattern '"engines"'

# 4) package.json JSON 유효성 (파싱 에러 없어야)
Get-Content package.json -Raw | ConvertFrom-Json | Out-Null; if ($?) { "package.json OK" }
```

## 8. 완료 신호

`docs/handover/2026-05-30-R15-T01-node-version-bump.md` 작성 — 변경한 파일·라인 수, setup-node 버전 동반 상향 여부, package.json engines 추가 내용, 자가 검증 결과(PASS/FAIL) 명시.

## 안티패턴

- ❌ `.github/workflows/`·`package.json` 외 파일 수정
- ❌ 워크플로우 트리거(`on:`)·job 로직 변경 (버전 토큰만 최소 변경)
- ❌ release-observe.yml에 없는 node-version을 억지로 추가
- ❌ daily-cron 결제 차단 문제를 "고치려" 시도 (계정 작업, 본 터미널 범위 외)
- ❌ handover 누락
