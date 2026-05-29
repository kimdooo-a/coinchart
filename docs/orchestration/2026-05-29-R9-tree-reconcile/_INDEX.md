# R9 — tree-reconcile 라운드 인덱스 (정합·정리)

> 작성일: 2026-05-29 · 지휘부(CEO) 세션 · 라운드: R9
> 이전 라운드: R8(세션 34, 페이지 다크 잔재 라이트화 + dead 3종 삭제 — orchestration 없는 단독 세션)
> 직전 handover: [session34-r8-page-lightify](../../handover/2026-05-25-session34-r8-page-lightify.md)

## 목적

세션 34(R8) cs가 인계한 **R9 후보 #1**(홈 컴포넌트 트리 재감사 + 레퍼런스 정합)을 중심으로, `/history` 메뉴 정합을 묶어 **정합·정리** 성격으로 완결한다. 신규 기능 없음. (807줄 리팩토링·Giscus App 설치는 본 라운드 범위 밖 — 별도 라운드/수동.)

## 지휘부 사전 검증 결과 (stale 가정 정정 — R3 stale-snapshot 교훈)

발사 전 지휘부가 grep으로 후보 작업의 실제 현 상태를 확인한 결과:

- ✅ **`components/hero-section.tsx` = 진짜 dead** — 자기 파일 외 사용처 0건 → `git rm` 대상
- ⚠️ **`components/footer-section.tsx` = 살아있음** — 6개 페이지(`board/[slug]`·`board/[slug]/write`·`board/[slug]/[postId]`·`coin/[symbol]`·`news`·`page.tsx`)가 import → **삭제 금지**. (next-dev-prompt의 "hero/footer dead 여부" 가정 중 footer는 오판이었음)
- ✅ **`/history` 라우트 실존** (`app/history/page.tsx`) + `lib/translations.ts`에 메뉴 텍스트 존재("코인 역사"/"코인 대서사시") → **폐기가 아니라 헤더 메뉴 노출 정합** 문제
- ✅ **`.env.local` UTF-8 BOM = 이미 제거됨**(`BOM 없음`) — R9 후보 #2는 사실상 해소(본 라운드 제외)
- 홈 트리 실제 import 9종: `BoardRow`(+`BoardTableHeader`)·`NewsRow`·`NewsHeadlineCard`(type)·위젯 5종(`PriceTickerWidget`·`HotIssueWidget`·`FngGaugeWidget`·`OfficialPostsWidget`·`ToolsShortcutWidget`)·`FooterSection`
- `components/` 루트 11파일: `AuthButton`·`DetailedChart`·`ErrorState`·`footer-section`·`global-header`·`hero-chart`·`hero-section`·`InsufficientData`·`news-rotator`·`PremiumLock`·`TradeModal`

## 매트릭스 (평면 3터미널)

| T | 작업 | 쓰기 영역(격리) | Wave | 의존 |
|---|------|----------------|------|------|
| **T01** | 홈 컴포넌트 트리 재감사 + dead 컴포넌트 삭제 | `app/page.tsx`·`components/` **루트 dead 컴포넌트 삭제만**(`hero-section` 등) | 1 | 독립 |
| **T02** | `/history` 메뉴 정합 — 도구 드롭다운 노출 정리 | `components/global-header.tsx`·`lib/translations.ts`·`app/history/`(폐기 시) | 1 | 독립 |
| **T03** | 레퍼런스 전수 정합 (`_COMPONENT_MAP`·`_WEB_CONTRACT`) | `docs/references/` | **2** | T01+T02 (lazy) |

## DAG / 발사 순서

```
Wave 1 (즉시 동시 발사):  T01   T02         ← 쓰기 영역 독립, 충돌 0
                            │     │
                            └──┬──┘
                       (T01·T02 회수·통합·커밋)
                                  │
                                  ▼
Wave 2 (Wave1 통합 후):   T03                ← T01 dead 삭제 + T02 메뉴 변경을 반영해 레퍼런스 정합
```

### ⚠️ T03을 Wave 2로 분리한 이유
T03(레퍼런스 정합)은 T01의 dead 컴포넌트 삭제 결과 + T02의 메뉴 변경을 **확정 입력**으로 받아야 정확히 정합된다. Wave1과 동시 발사하면 미확정 상태를 기록하게 되어 또 stale을 만든다. T01·T02 통합·커밋 후 발사.
- **lazy 진행 가능**: T01/T02 handover가 아직 없어도 T03은 현 코드를 직접 스캔해 정합할 수 있으나, **권장은 Wave1 통합 후**. 지휘부 "T03 발사 가능" 신호 대기.

### Wave1 일꾼 공통 제약
- **T01은 `components/global-header.tsx`를 건드리지 말 것** — 헤더는 살아있는 컴포넌트이며 메뉴 정합은 T02 전담.
- **T01은 `docs/references/`를 수정하지 말 것** — 레퍼런스 정합은 T03 전담. T01은 dead 목록·확정 홈 트리를 **handover에만 기록**.
- **T02는 `app/page.tsx`·`components/` 루트 dead를 건드리지 말 것** — 홈 트리·dead 삭제는 T01 전담.

## 결정 사항 (사용자 승인 2026-05-29)
- **범위**: 정합·정리 라운드. 807줄 리팩토링 별도 분리. `.env.local` BOM 이미 해소라 제외. Giscus App 설치는 수동(코드 외).
- **dead 삭제 정책**: 사용처 0건이 **grep + import 추적으로 확정된 것만** 삭제. 불확실하면 삭제하지 말고 handover에 "보존 사유" 기록(R8의 `InsufficientData` 패턴 — 미사용이나 재사용 프리미티브는 보존).
- **footer-section 보존**: 6페이지 사용 중이므로 절대 삭제 금지.

## 배포 모델 (R1~R8 라이브 반영됨 — 참고)
- 프로덕션 배포 = GitHub Release 발행(`release: published` → Vercel prod). main push만으로 자동 배포 안 됨.
- 본 라운드는 dead 삭제 + 메뉴 정합 + 문서 정합뿐 → 런타임 동작 변화 최소(시각 회귀 0 목표).

## 공통 SOT (전 터미널 읽기 전용)
- `CLAUDE.md` — 프로젝트 규약·기술 스택·SSOT 규칙·v2.0 커뮤니티 피벗
- `docs/status/current.md` — 현재 상태
- `docs/handover/2026-05-25-session34-r8-page-lightify.md` — 직전 세션(R8) 인계 (dead 3종 삭제·레퍼런스 stale 정정 맥락)
- `docs/references/_COMPONENT_MAP.md`·`_WEB_CONTRACT.md` — 컴포넌트 맵·웹 계약 (T03이 정합 대상, T01/T02는 읽기만)

## handover 규약
각 일꾼은 완료 시 `docs/handover/2026-05-29-R9-T0N-<short-name>.md` 작성 (handover-template 표준).

## 안티패턴 (전 터미널 공통)
- ❌ 자기 쓰기 영역 밖 파일 수정 (격리 위반)
- ❌ 공통 SOT(`CLAUDE.md`) 수정 (지휘자 전담)
- ❌ 사용처 확정 없이 dead 단정 삭제 (R3 stale-snapshot 재발 방지)
- ❌ `footer-section.tsx` 삭제 (6페이지 사용 중)
- ❌ 한국어 주석·handover 누락 / `.env`·`nul` 커밋

## 관련
- 진입점: `../../../CLAUDE.md`
- R9 후보 출처: `docs/handover/next-dev-prompt.md` (§R9 후보)
