# T02 — lint/데드코드 잔여 정리

## 0. 자기 정체성
너는 **R11 평면 4터미널 중 T02 일꾼**이다. 지휘자가 아니다. 본 작업만 자기완결로 수행하고 handover를 남긴다. **순수 정리만** — 구조 리팩토링 금지(그건 T03 영역).

## 1. 컨텍스트
- 프로젝트: Crypto Chart Analysis — Next.js 16 App Router. v2.0 커뮤니티 피벗.
- 작업 디렉토리: `F:\11_dev\260523 코인 차트분석`
- 본 터미널 역할: **T02 / 4** (R11-reconcile-refactor, Wave 1).
- 쓰기 영역(격리): **`components/Analysis/`·`components/Chart/`** (해당 파일의 미사용 import·죽은 주석 정리만). `app/analysis/[symbol]/`는 **T03 전담 — 미접촉**.

## 2. 배경 — 핵심 사실 (R10 known issues)
R10 handover(`2026-05-29-session36-r10-dev-gap.md`)가 남긴 정리 후보:
- **`components/Analysis/ChartAnalysisPanel.tsx`**: `calculateRSI` **미사용 import**(기존 lint warning, 빌드 무관). 제거 대상.
- **`components/Chart/CryptoChart.tsx`**: 주석처리 잔존 코드(R10 "주석처리 잔존 후보") 정리.
- R10이 이미 데드코드 6종(`TradingStrategyGuide`·`ErrorState`·`InsufficientData`·`StockSectorPerformance`·`useSubscription`·`economic_events`)을 삭제했으므로, **그 잔재 import가 남아있는지** 확인.

## 3. 공통 SOT (읽기 전용)
- `CLAUDE.md` — SSOT 규칙
- `docs/handover/2026-05-29-session36-r10-dev-gap.md` — R10 삭제 6종·known issues
- `docs/references/_COMPONENT_MAP.md` — 컴포넌트 의존성(읽기만, T01과 무관한 별도 파일이나 수정 금지)

## 4. 작업 목표

### Phase 1: 미사용 import / 죽은 주석 전수 스캔
- `components/Analysis/`·`components/Chart/` 하위 파일을 대상으로:
  - 미사용 import 식별(`calculateRSI` 등) — **실사용처 grep으로 확정 후** 제거(추측 금지).
  - 주석처리된 dead 코드 블록(`CryptoChart` 등) 식별.
  - R10 삭제 6종을 import하던 잔재가 있으면 제거(이미 tsc 0이면 없을 것이나 확인).

### Phase 2: 순수 정리 적용
- 미사용 import 제거·죽은 주석 블록 삭제. **로직·동작·구조 변경 0**.
- 의미 있는 설명 주석(한국어 의도 주석)은 보존 — dead 코드 주석만 제거.

### Phase 3: 검증
- tsc 0·build green·동작 보존.

## 5. 도구 권장
- Grep으로 각 심볼의 실사용처 확정 후에만 제거. eslint 출력으로 미사용 경고 목록 확보 가능.

## 6. 의존성
- **독립** (Wave 1). `app/analysis/[symbol]/`(T03)와 파일 분리. `docs`(T01·T04)와 무관.
- ⚠️ **T03 경계**: T03이 `app/analysis/[symbol]/page.tsx`를 리팩토링하지만 그건 `app/` 하위라 본 영역(`components/`)과 겹치지 않음. 단 본 작업이 `components/Analysis/ChartAnalysisPanel.tsx`의 **export 시그니처를 바꾸면 안 됨**(import만 정리) — T03 페이지가 이 컴포넌트를 쓸 수 있으므로 인터페이스 불변.

## 7. 검증
```powershell
npx tsc --noEmit                       # 0
npm run build                          # green
npx eslint components/Analysis components/Chart   # 미사용 경고 감소 확인(가능 시)
```

## 8. 완료 신호
`docs/handover/2026-05-29-R11-T02-lint-deadcode.md` 작성. 포함 필수:
- 제거한 미사용 import 목록(파일·심볼·실사용처 0건 근거)
- 삭제한 죽은 주석 블록
- 보존한 항목(의도 주석 등)
- tsc 0·build green 근거 / export 시그니처 불변 확인

## 안티패턴
- ❌ `app/analysis/[symbol]/` 수정(T03 전담) / `docs/` 수정
- ❌ 구조 리팩토링·로직 변경(순수 정리만)
- ❌ 사용처 확정 없이 import 제거(빌드 깨짐)
- ❌ export 시그니처 변경(T03 페이지 의존 가능)
- ❌ 의도 주석(한국어 설명) 삭제 / 한국어 handover 누락
