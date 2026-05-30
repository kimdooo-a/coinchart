# T04 — `scripts/` any 타입 정리 (점진적 타입 강화)

## 1. 컨텍스트

- 프로젝트: Crypto Chart Analysis (코인 차트 분석)
- 작업 디렉토리(쓰기 허용): **`scripts/` 하위만**
- 본 터미널 역할: **T04 / 4** — 운영 스크립트의 `any` 타입을 구체 타입으로 점진 교체
- 라운드: **R15 (tech-debt)** / Wave 1 (독립)

## 2. 배경 (왜 이 작업인가)

`scripts/`에 `any` 사용이 **16개 파일 ~50건** 분포. (current.md 미해결사항: "any 타입 ... scripts/ 45개(낮은 우선순위)"의 그 부채.) 운영 스크립트라 런타임 위험은 낮지만, 타입 안전성·리팩토링 내성을 위해 정리한다.

분포(착수 전 직접 재확인):

```
scripts/alert_engine.ts          8건   (최다)
scripts/batch_orchestrator.ts    6건
scripts/preflight.ts             4건
scripts/batch_analysis.ts        4건
scripts/verify_explanation.ts    3건
scripts/update-market-data.ts    3건
scripts/seed_prices_v2.ts        3건
scripts/report_generator.ts      3건
scripts/seed_bch.ts              2건
scripts/release_quality_gate.ts  2건
scripts/healthcheck.ts           2건
scripts/{weekly_cron,seed_prices,migrate-blog-content-to-html,debug_analysis,daily_cron}.ts  각 1건
```

## 3. 작업 원칙 (중요 — 과욕 금지)

- **확실하게 타입을 알 수 있는 것만 교체**한다. 외부 API 응답 등 형태가 불명확한 곳은:
  - 가능하면 최소 인터페이스/`unknown` + 좁히기(narrowing)로 교체,
  - 정말 불확실하면 **`any`를 남기되 `// eslint-disable-next-line @typescript-eslint/no-explicit-any` 또는 사유 주석**으로 의도 명시.
- **동작(런타임 결과)은 절대 바꾸지 않는다.** 타입 표면만 정리.
- 한 파일이라도 `tsc` 에러를 새로 만들면 그 파일은 원복하고 handover에 "보류" 기록.

## 4. 작업 목표

1. 위 16파일을 **건수 많은 순서로**(alert_engine → batch_orchestrator → ...) 처리.
2. 각 `any`에 대해:
   - 명백한 경우(예: `parseFloat` 결과, 알려진 객체 shape, 배열 요소 타입) → 구체 타입.
   - 외부 fetch/JSON → 최소 인터페이스 또는 `unknown` + 가드.
   - 불명확 → 사유 주석 + (필요 시) eslint-disable.
3. 가능하면 공통 shape는 `types/`의 기존 타입 재사용(있으면). **단 `types/`는 읽기만**(쓰기는 본 라운드 범위 아님 — scripts/ 내에서 import만).

## 5. 도구 권장

- `npx eslint scripts/ --rule '@typescript-eslint/no-explicit-any: error'` 로 정확한 위치 수집(설정상 안 되면 `Grep`).
- 파일별 `Read` → `Edit`. 큰 파일은 부분 단위로.

## 6. 의존성

- **독립** (Wave 1). `scripts/` 외 수정 금지(`types/`는 읽기 전용 import만).

## 7. 검증 (자가)

```powershell
# 1) any 잔존 건수 (착수 전 대비 감소했는지 — 0이 목표는 아님, 정직하게 보고)
(Select-String -Path scripts/*.ts -Pattern ":\s*any\b|as any|<any>|any\[\]" | Measure-Object).Count

# 2) 타입체크 — 반드시 EXIT 0 (스크립트가 tsconfig include면)
npx tsc --noEmit

# 3) eslint scripts
npx eslint scripts/ --max-warnings=9999

# 4) 대표 스크립트 import/파싱 무결성 (실행 부작용 없는 것 위주, 가능 시)
#   예: npx tsx --check scripts/healthcheck.ts  (지원 시)
```

## 8. 완료 신호

`docs/handover/2026-05-30-R15-T04-scripts-any-cleanup.md` 작성 — 착수 전/후 any 건수, 파일별 처리 요약, **보류한 any와 사유**, tsc EXIT 0 확인, eslint 결과. (전건 제거가 아니라 "정직한 점진 정리"가 목표임을 명시.)

## 안티패턴

- ❌ `scripts/` 외 파일 수정 (`types/` 쓰기 포함 금지 — import만)
- ❌ 동작을 바꾸는 리팩토링 (타입 표면만 정리)
- ❌ 불확실한 곳을 억지 타입으로 단정 → 런타임 불일치 위험
- ❌ tsc 에러를 남긴 채 완료 보고
- ❌ "all any removed"를 무리하게 추구하다 가짜 타입 양산 (보류+주석이 정직)
- ❌ handover 누락
