# T03 — `.eslintignore` deprecation 해소 (flat config `ignores`로 이관)

## 1. 컨텍스트

- 프로젝트: Crypto Chart Analysis (코인 차트 분석)
- 작업 디렉토리(쓰기 허용): **`.eslintignore` + `eslint.config.mjs` 만** (루트 2파일)
- 본 터미널 역할: **T03 / 4** — ESLint flat config 환경에서 deprecated된 `.eslintignore`를 제거하고 ignore 규칙을 flat config로 이관
- 라운드: **R15 (tech-debt)** / Wave 1 (독립)

## 2. 배경 (왜 이 작업인가)

- 프로젝트는 ESLint **flat config**(`eslint.config.mjs`)를 사용.
- flat config 환경에서 별도 `.eslintignore` 파일은 **deprecated** → ESLint 실행 시 경고 출력:
  `The ".eslintignore" file is no longer supported. Switch to using the "ignores" property in "eslint.config.js"` (R14 통합 검증에서 관측된 deprecation 경고).
- 현재 `.eslintignore` 내용: `kdy-addon/**` (1줄).
- `eslint.config.mjs`에는 이미 `// Override default ignores of eslint-config-next.` 주석과 ignore 관련 섹션이 존재(line ~8) → 여기에 통합하면 됨.

## 3. 공통 SOT (읽기 전용 — 작업 대상은 §4)

```
.eslintignore        현재 내용: kdy-addon/**
eslint.config.mjs    flat config — line ~8 부근 ignore/override 섹션 존재
```

## 4. 작업 목표

1. **`eslint.config.mjs`에 ignore 규칙 추가** — flat config 규약대로, **`ignores`만 가진 객체를 배열 최상단 항목으로** 추가(또는 기존 ignore 섹션에 병합):
   ```js
   {
     ignores: ["kdy-addon/**"],
   },
   ```
   - 기존 `eslint-config-next` 기본 ignore·기타 설정은 **보존**. 현 파일 구조를 먼저 읽고 가장 자연스러운 위치에 병합.
   - flat config에서 `ignores`만 가진 객체는 **전역 ignore**로 동작(다른 키와 섞지 말 것).
2. **`.eslintignore` 파일 삭제** (이관 완료 후).
3. 다른 ESLint 규칙·플러그인 설정은 건드리지 않는다.

## 5. 도구 권장

- 먼저 `eslint.config.mjs` 전체 `Read` → 구조 파악 → `Edit`로 `ignores` 객체 삽입.
- `.eslintignore` 삭제는 `Remove-Item .eslintignore -Confirm:$false` (PowerShell) 또는 동등 수단.

## 6. 의존성

- **독립** (Wave 1). 다른 터미널과 겹침 0.
- ⚠️ T01·T02·T04가 각자 `npx eslint`를 자가검증에 쓰므로, 본 작업이 ignore 동작을 깨뜨리면 그들 검증에 영향. **`kdy-addon/**` 무시 동작이 정확히 보존되어야** 함(특히 kdy-addon 하위가 다시 lint 대상이 되어 에러 폭증하면 안 됨).

## 7. 검증 (자가)

```powershell
# 1) .eslintignore 삭제됨
Test-Path .eslintignore   # False 여야 PASS

# 2) eslint.config.mjs에 ignores 반영
Select-String -Path eslint.config.mjs -Pattern "kdy-addon"

# 3) deprecation 경고 사라졌는지 + kdy-addon 무시 동작 보존 확인
npx eslint . 2>&1 | Select-String -Pattern "eslintignore|kdy-addon"
#  → "no longer supported" 경고가 없어야 하고, kdy-addon 파일 에러가 새로 뜨면 안 됨

# 4) 기존 코드 lint 정상 (대표 경로)
npx eslint app components lib --max-warnings=9999
```

## 8. 완료 신호

`docs/handover/2026-05-30-R15-T03-eslintignore-migrate.md` 작성 — `eslint.config.mjs` 삽입 위치/내용·`.eslintignore` 삭제 확인·deprecation 경고 소멸 확인·`kdy-addon` 무시 동작 보존 근거(eslint 실행 시 kdy-addon 에러 0)·자가검증 결과.

## 안티패턴

- ❌ `.eslintignore`·`eslint.config.mjs` 외 파일 수정
- ❌ `ignores`를 다른 설정 키와 같은 객체에 넣기 (flat config에서 전역 ignore가 안 됨)
- ❌ 기존 `eslint-config-next` ignore·rules 제거/변형
- ❌ `.eslintignore`를 안 지우고 양쪽에 두기 (경고 잔존)
- ❌ kdy-addon 무시가 깨져 lint 에러 폭증한 채로 완료 보고
- ❌ handover 누락
