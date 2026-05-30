# R15 T03 — `.eslintignore` deprecation 해소 (flat config `ignores`로 이관)

- **라운드/태스크**: R15 (tech-debt) / T03 (Wave 1, 독립)
- **작업일**: 2026-05-30
- **작업 디렉토리(쓰기 허용)**: `eslint.config.mjs` + `.eslintignore` (루트 2파일)
- **결과**: ✅ 완료

## 1. 작업 요약

ESLint flat config(`eslint.config.mjs`) 환경에서 deprecated된 `.eslintignore`(내용: `kdy-addon/**` 1줄)를 제거하고, ignore 규칙을 flat config로 이관했다.

## 2. 변경 내용

### `eslint.config.mjs` (삽입 위치/내용)

기존에 `globalIgnores([...])` 헬퍼로 전역 ignore 섹션(line 9~15)이 이미 존재 → **여기에 `kdy-addon/**` 항목을 병합**(지시서 §4-1의 "기존 ignore 섹션에 병합" 경로). flat config에서 `globalIgnores()`는 `ignores`만 가진 객체와 동등한 전역 ignore로 동작한다.

```js
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // .eslintignore에서 이관 (flat config에서 .eslintignore는 deprecated):
    "kdy-addon/**",
  ]),
```

- `eslint-config-next` 기본 ignore(`.next/**`, `out/**`, `build/**`, `next-env.d.ts`) 및 SSOT `no-restricted-imports` rules 섹션은 **그대로 보존**.
- 별도 `{ ignores: [...] }` 객체를 신설하지 않고 기존 `globalIgnores`에 병합 → 전역 ignore 의미 동일, 파일 구조상 가장 자연스러움.

### `.eslintignore`

- **삭제 완료** (`Remove-Item .eslintignore -Confirm:$false`).

## 3. 자가검증 결과

| 검증 항목 | 명령 | 결과 |
|---|---|---|
| `.eslintignore` 삭제됨 | `Test-Path .eslintignore` | `False` ✅ |
| config에 `kdy-addon` 반영 | `Select-String eslint.config.mjs kdy-addon` | `eslint.config.mjs:16: "kdy-addon/**"` ✅ |
| deprecation 경고 소멸 | `npx eslint .` stderr에서 `no longer supported` 검색 | **WARN-ABSENT** ✅ (이관 전 R14에서 관측되던 `The ".eslintignore" file is no longer supported` 경고 사라짐) |
| `kdy-addon` 무시 동작 보존 | `npx eslint .` 출력에서 `kdy-addon` 등장 여부 | **IGNORED** ✅ (kdy-addon 폴더 존재하나 lint 출력에 미등장 = 무시 정상 동작, 에러 폭증 없음) |

### `npx eslint .` exit code 비고

- exit code `1` 관측됨 — 그러나 이는 **프로젝트 다른 경로의 기존(pre-existing) lint 에러**에 의한 것. 본 작업의 변경은 ignore 항목 1개 추가 + 파일 1개 삭제뿐이므로 **신규 lint 에러를 유발할 수 없음**.
- 근거: kdy-addon 관련 출력 0건, deprecation 경고 0건 → ignore 동작이 정확히 보존되어 kdy-addon 하위가 다시 lint 대상이 되지 않음(에러 폭증 없음).

## 4. 후속 영향 (의존성)

- T01·T02·T04가 각자 `npx eslint`를 자가검증에 사용 → 본 작업의 `kdy-addon/**` 무시 동작이 정확히 보존되어 **그들 검증에 영향 없음**.
- deprecation 경고가 사라져 ESLint 출력이 깨끗해짐.

## 5. 변경 파일

- `eslint.config.mjs` (수정: `globalIgnores`에 `kdy-addon/**` 1줄 + 주석 추가)
- `.eslintignore` (삭제)
