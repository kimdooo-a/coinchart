# T01 — 홈 컴포넌트 트리 재감사 + dead 컴포넌트 삭제

## 1. 컨텍스트
- 프로젝트: Crypto Chart Analysis (코인 차트 분석) — Next.js 16 App Router + Tailwind v4. v2.0 커뮤니티 피벗(코인판×네이버).
- 작업 디렉토리: `F:\11_dev\260523 코인 차트분석`
- 본 터미널 역할: **T01 / 3** (R9-tree-reconcile, Wave 1) — 홈(`app/page.tsx`) 컴포넌트 트리를 전수 재감사하고, 사용처 0으로 **확정된** 잔재 컴포넌트를 삭제한다.
- 쓰기 영역(격리): `app/page.tsx` + `components/` **루트의 dead 컴포넌트 삭제만**. 그 외 금지.

## 2. 배경 — 핵심 사실 (지휘부 사전 검증)
R8(세션 34)에서 구 다크 랜딩 잔재 3종(`about-section`·`dashboard-grid`·`LanguageSwitcher`)을 이미 삭제했다. R8 cs는 "`_COMPONENT_MAP`/`_WEB_CONTRACT`의 홈 항목이 stale"이라 부분 정정했고, **홈이 실제 어떤 컴포넌트를 쓰는지 재감사**를 R9로 인계했다.

지휘부가 발사 전 grep으로 확인한 사실(반드시 본인이 재확인):
- **`components/hero-section.tsx` = dead 유력** — 자기 파일 외 `import`/`HeroSection` 사용처 grep 0건.
- **`components/footer-section.tsx` = 살아있음** — 6페이지 사용 중(`board/[slug]`·`board/[slug]/write`·`board/[slug]/[postId]`·`coin/[symbol]`·`news`·`page.tsx`). **절대 삭제 금지.**
- 홈 `app/page.tsx`가 import하는 컴포넌트 9종: `BoardRow`(+`BoardTableHeader`)·`NewsRow`·`NewsHeadlineCard`(type only)·`PriceTickerWidget`·`HotIssueWidget`·`FngGaugeWidget`·`OfficialPostsWidget`·`ToolsShortcutWidget`·`FooterSection`.
- `components/` 루트 11파일 전수: `AuthButton`·`DetailedChart`·`ErrorState`·`footer-section`·`global-header`·`hero-chart`·`hero-section`·`InsufficientData`·`news-rotator`·`PremiumLock`·`TradeModal`.

## 3. 공통 SOT (읽기 전용)
- `CLAUDE.md` — 프로젝트 규약·SSOT
- `docs/handover/2026-05-25-session34-r8-page-lightify.md` — R8 dead 삭제·레퍼런스 정정 맥락 (특히 "보존 사유" 패턴: `InsufficientData`는 미사용이나 재사용 프리미티브라 보존)
- `docs/orchestration/2026-05-29-R9-tree-reconcile/_INDEX.md` — 본 라운드 매트릭스·제약

## 4. 작업 목표

### Phase 1: 홈 컴포넌트 트리 확정
- `app/page.tsx`를 정독하고 **실제 렌더 트리**(import + JSX 사용)를 확정. 위 9종 외 누락/추가가 있는지 본인이 직접 검증.
- 산출: 확정 홈 트리 맵(컴포넌트 → 경로 → 역할) — **handover에 기록**(T03이 소비).

### Phase 2: `components/` 루트 dead 전수 스캔
- 루트 11파일 각각에 대해 **자기 파일 외 사용처**를 grep + import 추적으로 전수 확인:
  ```
  grep -rn "<컴포넌트명>\|<파일basename>" app components lib --include=*.tsx --include=*.ts
  ```
- 판정 규칙:
  - **사용처 0건 + 재사용 프리미티브 아님** → dead 확정 → `git rm` 대상
  - **사용처 0건이나 재사용 UI 프리미티브**(예: `ErrorState`·`InsufficientData` 류) → **보존**, handover에 "보존 사유" 기록
  - 조금이라도 불확실 → **삭제하지 말 것**. handover에 후보로만 기록 (R3 stale-snapshot 재발 방지)
- 예상: `hero-section.tsx`는 dead 유력 → 본인 재확인 후 `git rm components/hero-section.tsx`. (`hero-chart`·`news-rotator`·`TradeModal` 등은 사용처 확인 후 판정 — analysis/signal/coin 등에서 쓰일 수 있으니 신중)

### Phase 3: 검증
- dead 삭제 후 tsc·build로 깨짐 0 확인.

## 5. 도구 권장
- Grep/Glob 도구로 사용처 추적, `git rm`으로 삭제(워킹트리+스테이지 동시). 단순 파일 삭제 말고 git 추적.

## 6. 의존성
- **독립** (Wave 1). T02와 쓰기 영역 무충돌.
- 본 산출물(확정 홈 트리 + dead 삭제 목록)은 **T03(레퍼런스 정합)의 입력**. handover에 명확히 기록.

## 7. 검증
```powershell
npx tsc --noEmit                       # 0 에러
npm run build                          # green (54/54 라우트, 모드 회귀 없음)
# 삭제한 컴포넌트의 잔존 import 0 확인 (예시: hero-section)
Select-String -Path app/**/*.tsx,components/**/*.tsx -Pattern 'hero-section|HeroSection'
# footer-section 살아있음 재확인 (삭제 안 했는지)
Test-Path components/footer-section.tsx   # True 여야 함
```
```bash
npx tsc --noEmit && npm run build
grep -rn "hero-section\|HeroSection" app components --include=*.tsx
```

## 8. 완료 신호
`docs/handover/2026-05-29-R9-T01-home-tree-audit.md` 작성. 포함 필수:
- **확정 홈 트리 맵**(T03 입력) — 컴포넌트·경로·역할
- **삭제한 dead 목록**(파일 경로 + 사용처 0 근거 grep 결과)
- **보존 결정 목록**(미사용이나 재사용 프리미티브 — 보존 사유)
- **불확실로 보류한 후보**(있으면)
- tsc 0·build green 결과, 잔존 import 0 근거

## 안티패턴
- ❌ `components/global-header.tsx` 수정 (T02 전담)
- ❌ `docs/references/` 수정 (T03 전담 — T01은 handover에만 기록)
- ❌ `footer-section.tsx` 삭제 (6페이지 사용 중)
- ❌ 사용처 확정 없이 dead 단정 삭제 (R3 stale-snapshot 교훈)
- ❌ 한국어 주석·handover 누락
