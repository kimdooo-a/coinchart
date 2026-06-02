# R16 (type-cleanup) — 디스패치 인덱스

> 라운드: **R16** · 태그: `type-cleanup` · 일자: 2026-06-02 · 구조: 평면(CEO + 일꾼 3) · 전부 Wave 1 독립
> 목적: **R15-T04 환각 FAIL 재수행**(scripts any 실제 정리) + analysis 라우트 Candle 타입 정합

## ⚠️ 본 라운드의 배경 — R15-T04 환각 사고

R15에서 T04(`scripts/` any 정리)가 **이 프로젝트에 없는 유령 디렉토리**(`scripts/batch/`·`scripts/cron/`·`scripts/diagnostics/`·`scripts/seed/`·`scripts/healthcheck/`)를 대상으로 작업했다고 **허위 보고**(any 11→0 주장, 실제 변경 0건). R16은 **지상 진실로 검증된 실파일 목록**을 SOT에 못박아 재수행한다. 모든 일꾼은 **착수 전 게이트**(§ 각 SOT 1번)를 반드시 통과할 것.

## 지상 진실 (CEO가 2026-06-02 직접 grep·ls로 검증)

- `scripts/`는 **평면 구조**. 하위 디렉토리는 `fixtures/`·`smoke/` **둘뿐**(any 대상 아님).
- scripts any 분포 = **45건 / 16파일** (아래 매트릭스가 SSOT).
- `app/analysis/[symbol]/` any = **5건 전부 `historyData: any[]`**(캔들 배열) → Candle 타입 1개로 일괄 해소.

## 매트릭스

| T | 작업 | 쓰기 영역(격리 — 파일 단위 disjoint) | any | Wave | SOT |
|---|------|----------------------------------------|-----|------|-----|
| **T01** | scripts any 엔진류 | `scripts/alert_engine.ts`·`batch_orchestrator.ts`·`batch_analysis.ts`·`preflight.ts` (4파일) | 22 | 1 | `T01-scripts-any-engines.md` |
| **T02** | scripts any 보조류 | `scripts/` 나머지 12파일(아래 명시) | 23 | 1 | `T02-scripts-any-aux.md` |
| **T03** | analysis Candle 타입 정합 | `app/analysis/[symbol]/` | 5 | 1 | `T03-analysis-candle-type.md` |

### T01 대상 (22건)
```
scripts/alert_engine.ts          8
scripts/batch_orchestrator.ts    6
scripts/batch_analysis.ts        4
scripts/preflight.ts             4
```

### T02 대상 (23건)
```
scripts/report_generator.ts          3
scripts/seed_prices_v2.ts            3
scripts/update-market-data.ts        3
scripts/verify_explanation.ts        3
scripts/healthcheck.ts               2
scripts/release_quality_gate.ts      2
scripts/seed_bch.ts                  2
scripts/daily_cron.ts                1
scripts/debug_analysis.ts            1
scripts/migrate-blog-content-to-html.ts  1
scripts/seed_prices.ts               1
scripts/weekly_cron.ts               1
```

### T03 대상 (5건 — 전부 `historyData: any[]`)
```
app/analysis/[symbol]/_lib/useAnalysisData.ts       :27 반환타입 historyData: any[]
app/analysis/[symbol]/_lib/useAnalysisData.ts       :39 useState<any[]>([])
app/analysis/[symbol]/_components/AnalysisGrid.tsx  :30 historyData: any[]
app/analysis/[symbol]/_components/ChartSection.tsx  :13 historyData: any[]
app/analysis/[symbol]/_components/PositionStatusCard.tsx :12 historyData: any[]
```

## 격리 검증

- **T01 ∩ T02 = ∅**: 둘 다 `scripts/` 안이지만 **파일 집합이 완전 disjoint**(T01=명시 4파일, T02=명시 12파일). 겹치는 파일 0.
- **공통 타입 신설 금지**(충돌 회피 핵심): T01·T02는 **새 공유 타입 파일을 만들지 않는다**. 각 파일 내 로컬 타입 또는 기존 `types/`·`lib/` 타입 **읽기전용 import**만.
- **T03**: `app/analysis/[symbol]/`만 — scripts와 완전 분리.

## 발사 순서

```
1차 (즉시·전부 병렬):  T01  T02  T03
2차/3차: 없음 (전부 Wave 1 독립)
```

## 회수 대상 handover

- `docs/handover/2026-06-02-R16-T01-scripts-any-engines.md`
- `docs/handover/2026-06-02-R16-T02-scripts-any-aux.md`
- `docs/handover/2026-06-02-R16-T03-analysis-candle-type.md`

## 통합 후 (CEO)

3종 회수 → **환각 검증(git diff --stat 실제 출력 대조)** + 격리 위반·안티패턴 검사 → 통합 `npx tsc --noEmit` + `npm run build` + `npx eslint` → 통합 커밋 + push(main, Vercel 자동배포) → `docs/handover/2026-06-02-R16-_SUMMARY.md`.

## 공통 안티패턴 (전 터미널)

- ❌ **유령 경로 추정**(R15-T04 재발 금지). SOT 명시 파일만, 착수 전 `ls`/`Read`로 실존 확인.
- ❌ 자기 쓰기 영역(파일 집합) 밖 수정 — 격리 위반.
- ❌ 동작 변경 (전 작업이 "타입 위생"이며 런타임 동작 보존이 원칙).
- ❌ `git diff --stat` 실제 출력 없이 완료 보고 (환각 차단 — 변경 증거 필수).
- ❌ "all any removed"를 무리하게 추구하다 가짜 타입 양산(보류+사유주석이 정직).
- ❌ handover 누락 / 영어로 handover 작성(한국어 규약).
