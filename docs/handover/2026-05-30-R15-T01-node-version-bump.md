# R15-T01 인수인계 — GitHub Actions Node 18 → 20 EOL 상향

- 날짜: 2026-05-30
- 라운드/터미널: R15 (tech-debt) / T01 (Wave 1, 독립)
- 작업 범위(쓰기 허용): `.github/workflows/` + `package.json`
- 상태: **완료 (자가 검증 4/4 PASS)**

## 1. 작업 요약

CI 워크플로우의 Node 런타임을 EOL된 18에서 LTS 20으로 일괄 상향하고, `package.json`에 `engines` 필드를 추가했다.

## 2. 변경 내역

### `.github/workflows/` — `node-version` 18 → 20 (총 6곳, 3개 파일)

| 파일 | 라인 | 변경 전 → 후 | 따옴표 스타일 |
|------|------|-------------|--------------|
| `daily-cron.yml` | 21 | `node-version: 18` → `20` | 따옴표 없음 (기존 유지) |
| `release-validate.yml` | 27, 66 | `node-version: '18'` → `'20'` | 작은따옴표 (기존 유지) |
| `release-deploy.yml` | 33, 168, 242 | `node-version: '18'` → `'20'` | 작은따옴표 (기존 유지) |

- 각 파일의 기존 따옴표 표기 스타일을 그대로 유지함.
- `release-observe.yml`: `node-version` 항목 없음 → 대상 외 (지시대로 미수정).

### `actions/setup-node` 버전

- **동반 상향 없음.** 전수 확인 결과 6개 step 모두 **이미 `actions/setup-node@v4`** 사용 중 (`v3` 잔존 0). 추가 조치 불필요.

### `package.json` — `engines` 추가

`"private": true` 바로 아래(최상위)에 삽입:

```json
"engines": {
  "node": ">=20"
},
```

- 기존 키(`name`, `version`, `private`, `scripts` 등) 전부 보존. JSON 유효성 확인 완료.

## 3. 자가 검증 결과 (PASS/FAIL)

| # | 검증 항목 | 결과 |
|---|----------|------|
| 1 | `node-version` 18 잔존 (비어야 PASS) | **PASS** (잔존 0) |
| 2 | `node-version` 20 존재 | **PASS** (6곳 확인) |
| 3 | `package.json` `"engines"` 존재 | **PASS** (line 5) |
| 4 | `package.json` JSON 파싱 유효성 | **PASS** (`package.json OK`) |

검증 명령(PowerShell): 지시서 §7 그대로 실행.

## 4. 범위 외 / 미조치 (의도적)

- daily-cron의 **GitHub 계정 결제 차단**으로 인한 실행 불가(R14 T03 발견)는 **본 작업과 무관**한 계정 이슈 — 코드/버전 문제 아니므로 손대지 않음.
- 워크플로우 트리거(`on:`)·job 로직·step 순서 등은 일절 미변경 (버전 토큰만 최소 변경).
- `release-*.yml` 3종은 비활성화된 유물이나 위생 차원에서 함께 20으로 통일함(재활성화 대비·다음 개발자 혼동 방지).

## 5. 후속 권장

- daily-cron 실제 실행 복구는 GitHub 계정 Billing 해소(사용자 조치) 선행 필요 — R15 사용자 조치 항목과 연계.
