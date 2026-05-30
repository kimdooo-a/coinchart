# R15 (tech-debt) — 디스패치 인덱스

> 라운드: **R15** · 태그: `tech-debt` · 일자: 2026-05-30 · 구조: 평면(CEO + 일꾼 4) · 전부 Wave 1 독립
> 목적: R14 후속 잔여 기술부채 4종 정리 (사용자 조치 PENDING인 billing·watchlist 실로그인은 별개)

## 매트릭스

| T | 작업 | 쓰기 영역(격리) | Wave | SOT |
|---|------|----------------|------|-----|
| **T01** | node 18→20 EOL 상향 | `.github/workflows/` + `package.json` | 1 | `T01-node-version-bump.md` |
| **T02** | analysis 라우트 useAnalysisData 정리(실등급 보류) | `app/analysis/[symbol]/` | 1 | `T02-analysis-cleanup.md` |
| **T03** | `.eslintignore` deprecation → flat config 이관 | `.eslintignore` + `eslint.config.mjs` | 1 | `T03-eslintignore-migrate.md` |
| **T04** | `scripts/` any 타입 점진 정리 (16파일) | `scripts/` | 1 | `T04-scripts-any-cleanup.md` |

**격리 검증**: 4영역 disjoint (`.github/`+`package.json` · `app/analysis/[symbol]/` · 루트 eslint 2파일 · `scripts/`). 충돌 0.

## 발사 순서

```
1차 (즉시·전부 병렬):  T01  T02  T03  T04
2차/3차: 없음 (전부 독립)
```

## 회수 대상 handover

- `docs/handover/2026-05-30-R15-T01-node-version-bump.md`
- `docs/handover/2026-05-30-R15-T02-analysis-cleanup.md`
- `docs/handover/2026-05-30-R15-T03-eslintignore-migrate.md`
- `docs/handover/2026-05-30-R15-T04-scripts-any-cleanup.md`

## 통합 후 (CEO)

4종 회수 → 격리 위반·안티패턴 검사 → 통합 `npx tsc --noEmit` + `npm run build` + `npx eslint` → 통합 커밋 + push(main, Vercel 자동배포) → `docs/handover/2026-05-30-R15-_SUMMARY.md`.

## 공통 안티패턴 (전 터미널)

- ❌ 자기 쓰기 영역 밖 수정 (격리 위반)
- ❌ 동작 변경 (전 작업이 "정리/위생"이며 런타임 동작 보존이 원칙)
- ❌ 검증 없이 완료 보고 (tsc/eslint/build 증거 필수)
- ❌ handover 누락
- ❌ 영어로 handover 작성 (한국어 규약)
