# R6 — polish 라운드 인덱스 (정합·정리·일관성)

> 작성일: 2026-05-25 · 지휘부(CEO) 세션
> 이전 라운드: [R4 community-wiring](../2026-05-25-R4-community-wiring/_INDEX.md) · R5는 단독 세션(orchestration 없음)
> 직전 handover: [session30-r5](../../handover/2026-05-25-session30-r5.md)

## 목적

세션 30(R5) cs가 인계한 R6 후보 5건을 N-터미널 분산으로 완결한다. 전부 **정합·정리·일관성** 성격(신규 기능 없음).

## 매트릭스 (평면 5터미널)

| T | 작업 | 쓰기 영역(격리) | Wave | 의존 |
|---|------|----------------|------|------|
| **T01** | AD1 관리자 storageState — E2E 인증 셋업 | `e2e/` (auth.setup.ts 신규·playwright.config.ts·community-admin.spec.ts) | 1 | 독립 |
| **T02** | 마이그 파일명 14자리 정규화 + config.toml + backfill SQL (코드만) | `supabase/migrations/*` rename·`supabase/config.toml`·`supabase/*.sql`·`docs/db/` | 1 | 독립 |
| **T03** | queries.ts SSOT 환원 — fetchMainPageData anon 단일화 | `app/page.tsx`·`lib/community/queries.ts` | 1 | 독립 |
| **T04** | 차트 방향색 KR 정렬 — 볼륨·MACD 히스토그램 빨↑/파↓ | `components/Chart/*`·`components/DetailedChart.tsx`·`components/hero-chart.tsx`·`lib/chart/theme.ts` | 1 | 독립 |
| **T05** | 토큰계 통일 — `on-surface-variant`/`muted-foreground` 단일화 (89파일) | **전역 className** (app/·components/·globals.css) | **2** | T01~T04 통합 후 |

## DAG / 발사 순서

```
Wave 1 (즉시 동시 발사):  T01  T02  T03  T04     ← 서로 디렉토리 독립, 충돌 0
                                  │
                          (4종 회수·통합·커밋)
                                  │
                                  ▼
Wave 2 (Wave1 통합 후):   T05                      ← 전역 토큰 통일 단독, 같은 파일 동시수정 회피
```

### ⚠️ T05를 Wave 2로 분리한 이유
T05는 89개 파일(`on-surface-variant` 59 + `muted-foreground` 30)에 걸친 **전역 className 교체**라, T03(`app/page.tsx`)·T04(차트 컴포넌트)와 같은 파일을 건드린다. Wave1과 동시 발사하면 머지 충돌이 불가피하므로, Wave1 4종을 먼저 통합·커밋한 뒤 T05를 단독 발사한다.

### Wave1 일꾼 공통 제약
- **T03·T04는 자기 파일의 className(토큰)을 건드리지 말 것** — 토큰 통일은 T05 전담 영역.

## 결정 사항 (사용자 승인 2026-05-25)
- **T05 발사 전략**: Wave 2 단독 (충돌 0)
- **T02 backfill 범위**: 코드만 (운영 DB 미적용 — 파일명 정규화 + config.toml + backfill SQL 작성까지, 적용은 사용자 별도 db push). R5 "운영 DB 직접 변경 회피" 정책 유지.
- **T01 라이브 DB**: "그냥 진행" 채택하되 §2-1 안전장치 필수(정리 `finally` 보장·`[E2E-TEST]` 마커·스냅샷 원복·잔여 0 증거). 실 트래픽 미미한 피벗 직후 단계라 짧은 노출 무해, 중단 시 잔존만 차단.
- **배포 검증**: 코드 검증까지만(tsc 0·build green·렌더모드 유지). T06 추가 없음.

## 배포 모델 (R1~R5 라이브 반영됨)
- **프로덕션 배포 = GitHub Release 발행**(`release: published` → Vercel prod). **main push만으로 자동 배포 안 됨** → R6 코드 커밋은 Release 발행 전까지 라이브 미반영(명시적 게이트).
- **마이그레이션 자동 적용 없음**(워크플로우에 `db push` 부재) → T02 코드 정규화는 프로덕션 DB 영향 0. 운영 DB는 R4 Management API 수동 적용분.
- **라이브 쓰기는 T01뿐** → §2-1 안전장치로 격리.

## 공통 SOT (전 터미널 읽기 전용)
- `CLAUDE.md` — 프로젝트 규약·기술 스택·SSOT 규칙
- `docs/status/current.md` — 현재 상태
- `docs/handover/2026-05-25-session30-r5.md` — 직전 세션(R5) 인계
- `docs/references/_SCHEMA_REFERENCE.md`·`_API_REFERENCE.md` — 스키마·API 레퍼런스

## handover 규약
각 일꾼은 완료 시 `docs/handover/2026-05-25-R6-T0N-<short-name>.md` 작성.

## 안티패턴 (전 터미널 공통)
- ❌ 자기 쓰기 영역 밖 파일 수정 (격리 위반)
- ❌ 공통 SOT(`CLAUDE.md`·`docs/references/*`) 수정 (지휘자 전담)
- ❌ 한국어 주석/커밋 메시지 누락 (글로벌 룰)
- ❌ `.env`·`.env.local`·`nul` 커밋 (글로벌 룰)
- ❌ Wave1 일꾼이 토큰 className 수정 (T05 영역 침범)
- ❌ handover 누락
