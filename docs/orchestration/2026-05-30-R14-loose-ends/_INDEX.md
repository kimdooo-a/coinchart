# R14 (loose-ends) — 디스패치 인덱스

> 라운드: **R14** · 태그: `loose-ends` · 시작: 2026-05-30 · CEO: 본 지휘 세션
> 목적: R13 후속 4종 마무리 (시세 잔여·배포 문서·cron 확인·watchlist 스모크)

## 매트릭스 (4 터미널, 평면 구조)

| 터미널 | 작업 | 쓰기 영역 (격리) | Wave | 의존성 |
|--------|------|-----------------|------|--------|
| **T01** | 시세 구독 잔여 롤아웃 (FngGauge·HotIssue 등락색 `useDisplaySettings` 구독) | `components/community/widgets/` | 1 | 독립 |
| **T02** | DEPLOYMENT_RUNBOOK 전면 정정 (Release게이트→Vercel Git 자동배포) | `docs/DEPLOYMENT_RUNBOOK.md` | 1 | 독립 |
| **T03** | daily-cron Public 전환 후 정상작동 확인 + 경미 정비 | `.github/workflows/` | 1 | 독립 |
| **T04** | watchlist 회원 sync 런타임 스모크 절차서 + 자동화 스크립트 | `scripts/smoke/` + `docs/db/` | 1 | 독립 |

## DAG

```
Wave 1 (전부 독립·동시 발사):  T01   T02   T03   T04
(의존성·파일 충돌 없음 → 통합 배리어 1회)
```

## 충돌 영역 분석 (disjoint 확인)

| 영역 | 소유 터미널 | 비고 |
|------|------------|------|
| `components/community/widgets/` | T01 | KimchiPremium·Ticker·StockTicker는 R13 결론 → 미접촉 |
| `docs/DEPLOYMENT_RUNBOOK.md` | T02 | `.github/workflows/`는 읽기만 |
| `.github/workflows/` | T03 | release-* 유물은 미수정(T02가 문서화) |
| `scripts/smoke/` · `docs/db/` | T04 | 검증 대상 코드는 읽기만 |

→ **쓰기 영역 교집합 0**. `docs/` 하위는 T02(`DEPLOYMENT_RUNBOOK.md`)와 T04(`docs/db/`)가 서로 다른 경로라 충돌 없음.

## 공통 SOT (전 터미널 읽기 전용)

- `CLAUDE.md` · `docs/status/current.md` · `docs/references/_*`
- `lib/config/display-settings.tsx` (T01)
- `docs/solutions/2026-05-30-private-actions-billing-vercel-git-deploy.md` (T02·T03)

## 발사 순서

**Wave 1**: T01 · T02 · T03 · T04 — **즉시 동시 발사** (4개 새 터미널에 각 발사 프롬프트 복붙).

각 터미널 완료 → `docs/handover/2026-05-30-R14-T0N-*.md` 작성 → 지휘 세션이 회수·통합 검증 → 통합 커밋.

## 안티패턴 (공통)

- ❌ 자기 쓰기 영역 밖 수정
- ❌ 공통 SOT(`CLAUDE.md`·`docs/references/*`·`lib/config/display-settings.tsx`) 수정
- ❌ 검증 미실행 상태로 handover PASS 주장
- ❌ `.env`·`.env.local`·`nul` 커밋 / 한국어 주석·커밋 규약 위반
- ❌ 일꾼이 직접 `git commit`/`cs` 수행 (통합·커밋은 CEO 몫)
