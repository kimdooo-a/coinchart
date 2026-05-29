# R11 — reconcile-refactor 라운드 인덱스 (정합·정리·리팩토링·기획)

> 작성일: 2026-05-29 · 지휘부(CEO) 세션 · 라운드: R11
> 이전 라운드: R10(세션 36, 미완성 점검 + kdyswarm 3트랙 — signal 연결·데드코드 6종·데이터 정확도)
> 직전 handover: [session36-r10-dev-gap](../../handover/2026-05-29-session36-r10-dev-gap.md)

## 목적

R9 `_SUMMARY` 이월 stale(라우트 레지스트리 미정합) + R10 known issues(lint 잔여) + 장기 플래그(807줄 리팩토링) + 신규 기능 기획(watchlist/settings)을 **평면 4터미널**로 처리한다. T01·T02는 정합·정리(회귀 위험 0), T03은 리팩토링(동작 보존), T04는 **기획·스펙 산출**(구현 아님 — 후속 라운드 입력).

## 지휘부 사전 검증 결과 (stale 가정 정정 — R3 stale-snapshot 교훈)

발사 전 지휘부가 grep + Read + build로 확인한 실제 현 상태:

- ✅ **`npm run build` = green** (exit 0, 54 라우트) — R10이 tsc만 확인한 build #1 후보 해소. 배포(Release 게이트)는 사용자 액션.
- ❌ **`/blog` = 고아 아님** — `components/footer-section.tsx:35` "공식글" 진입점 + `_WEB_CONTRACT` R-024 등록됨. R9 `_SUMMARY` "/blog 고아 가능성" 플래그는 **stale 가정**.
- ⚠️ **라우트 레지스트리 괴리 확정** — `_WEB_CONTRACT` R-001~R-030(30행) ↔ 빌드 **54 라우트**. v2.0 커뮤니티 라우트(`/board/[slug]`·`/board/[slug]/write`·`/board/[slug]/[postId]`·`/coin/[symbol]` 등)가 정식 R-### 행으로 미등록. §8 연결성 카운트 "등록 23 / 활성 19"는 stale(최종 2026-02-20).
- ⚠️ **watchlist/settings = 의도적 "준비 중(Coming Soon)" 스텁** — `app/watchlist/page.tsx`(66줄)·`app/settings/page.tsx`(78줄). 깨진 게 아니라 플레이스홀더. 신규 구현은 **brainstorming 선행** 필요 → R11은 **기획만**(T04).
- ⚠️ **`app/analysis/[symbol]/page.tsx` = 807줄** — 장기 리팩토링 플래그. 라이브 페이지라 동작 보존 필수.
- ⚠️ **lint 잔여** — `components/Analysis/ChartAnalysisPanel.tsx` `calculateRSI` 미사용 import + `components/Chart/CryptoChart.tsx` 주석처리 잔존(R10 known issue).

## 매트릭스 (평면 4터미널)

| T | 작업 | 쓰기 영역(격리) | Wave | 의존 |
|---|------|----------------|------|------|
| **T01** | 라우트 레지스트리 전수 정합 (54 라우트 1:1 등록 + §8 카운트 갱신 + Footer 실코드 대조) | `docs/references/_WEB_CONTRACT.md` | 1 | 독립 |
| **T02** | lint/데드코드 잔여 정리 (`calculateRSI` 미사용·`CryptoChart` 주석 등 순수 정리) | `components/Analysis/`·`components/Chart/` | 1 | 독립 |
| **T03** | `analysis/[symbol]` 807줄 리팩토링 (route-local 분해, 동작 보존) | `app/analysis/[symbol]/` | 1 | 독립 |
| **T04** | watchlist/settings 신규 기능 **기획·스펙 산출**(구현 아님) | `docs/design-brief/` | 1 | 독립 |

## DAG / 발사 순서

```
Wave 1 (즉시 동시 발사):  T01  T02  T03  T04     ← 쓰기 영역 전부 분리, 충돌 0
                           └────┬────┬────┘
                       (4/4 회수·통합·검증·커밋)
                                  │
                                  ▼
                 지휘자: build 재확정 + 배포 게이트 점검
```

전부 Wave 1 독립. 차수 분리 불필요.

### ⚠️ 쓰기 영역 충돌 방지 (핵심 제약)

| 터미널 | 쓰기 허용 | 절대 금지 |
|--------|----------|----------|
| T01 | `docs/references/_WEB_CONTRACT.md` | 코드·다른 docs |
| T02 | `components/Analysis/`·`components/Chart/` (순수 lint 정리) | `app/analysis/[symbol]/`(T03)·구조 리팩토링·공유 컴포넌트 신설 |
| T03 | `app/analysis/[symbol]/`(route-local 분해만) | `components/` 공유 컴포넌트로 추출(T02 영역 침범)·기능 변경 |
| T04 | `docs/design-brief/`(신규 기획 문서) | 코드·`docs/references/`(T01) |

- **T02 ↔ T03 경계**: T02는 `components/Analysis/ChartAnalysisPanel.tsx` 등 컴포넌트의 미사용 import만 제거. T03은 `app/analysis/[symbol]/page.tsx`를 route-local 하위 파일로 분해하되 `components/`로 빼지 않는다. 두 영역이 겹치지 않음.
- **T01 ↔ T04 경계**: 둘 다 docs지만 T01=`docs/references/`, T04=`docs/design-brief/`. 디렉토리 분리.

## 결정 사항 (사용자 승인 2026-05-29)
- **범위**: 정합·정리(T01·T02) + 리팩토링(T03) + 기획(T04). 4터미널.
- **watchlist/settings는 기획만**: 신규 기능 구현은 brainstorming 선행이라 R11에서 스펙·계획만 산출. 구현은 R12 후보.
- **리팩토링 회귀 0 목표**: T03은 동작·시각 보존. tsc·build·렌더 동작 검증 필수.

## 공통 SOT (전 터미널 읽기 전용)
- `CLAUDE.md` — 프로젝트 규약·기술 스택·SSOT 규칙·v2.0 커뮤니티 피벗
- `docs/status/current.md` — 현재 상태(세션 36까지)
- `docs/handover/2026-05-29-session36-r10-dev-gap.md` — 직전 세션(R10) 인계
- `docs/references/_WEB_CONTRACT.md` — 웹 계약(T01 정합 대상, T02/T03/T04는 읽기만)
- `docs/PROJECT_DIRECTION.md` — v2.0 방향성(T04 기획 정합 기준)

## handover 규약
각 일꾼은 완료 시 `docs/handover/2026-05-29-R11-T0N-<short-name>.md` 작성.

## 안티패턴 (전 터미널 공통)
- ❌ 자기 쓰기 영역 밖 파일 수정 (격리 위반)
- ❌ 공통 SOT(`CLAUDE.md`) 수정 (지휘자 전담)
- ❌ T03이 `components/`로 컴포넌트 추출 (T02 영역 침범) / T02가 구조 리팩토링
- ❌ T04가 코드 작성 (기획·스펙 산출만 — 구현은 후속 라운드)
- ❌ 사용처 확정 없이 dead 단정 삭제 (R3 stale-snapshot 재발 방지)
- ❌ 한국어 주석·handover 누락 / `.env`·`nul` 커밋

## 관련
- 진입점: `../../../CLAUDE.md`
- R11 후보 출처: R10 handover "다음 작업 제안" + R9 `_SUMMARY` 잔여 stale
