# T03 — 레퍼런스 전수 정합 (_COMPONENT_MAP · _WEB_CONTRACT)

> **⚠️ Wave 2 — T01·T02(Wave1)가 통합·커밋된 뒤에 발사할 것.** 본 작업은 T01의 dead 삭제 결과 + T02의 메뉴/라우트 변경을 **확정 입력**으로 받아야 정확히 정합된다. Wave1 미통합 상태로 발사하면 미확정 상태를 기록해 또 stale을 만든다. 지휘부 "T03 발사 가능" 신호 후 시작. (lazy 진행 시 현 코드를 직접 스캔할 수 있으나 권장은 통합 후.)

## 1. 컨텍스트
- 프로젝트: Crypto Chart Analysis (코인 차트 분석) — Next.js 16. v2.0 커뮤니티 피벗.
- 작업 디렉토리: `F:\11_dev\260523 코인 차트분석`
- 본 터미널 역할: **T03 / 3** (R9-tree-reconcile, Wave 2) — `_COMPONENT_MAP.md`·`_WEB_CONTRACT.md`를 현 코드 + T01/T02 변경 결과와 정합한다.
- 쓰기 영역(격리): `docs/references/` (`_COMPONENT_MAP.md`·`_WEB_CONTRACT.md`).

## 2. 배경 — 핵심 사실
R8(세션 34) cs가 "`_COMPONENT_MAP`/`_WEB_CONTRACT`의 홈 항목이 stale(과거 import 표기가 현 커뮤니티 SSR 구조와 불일치)"임을 **부분 정정**했으나 완결하지 못하고 R9로 인계했다. 본 라운드에서 T01이 홈 트리를 재감사·dead 삭제하고 T02가 `/history` 메뉴를 정합했으므로, 그 결과를 레퍼런스에 반영해 **완결**한다.

## 3. 공통 SOT (읽기 전용 — 단 _COMPONENT_MAP·_WEB_CONTRACT는 본인 쓰기 대상)
- `CLAUDE.md` — 레퍼런스 관리 규칙(변경 시 즉시 갱신)
- `docs/handover/2026-05-29-R9-T01-home-tree-audit.md` — **T01 산출**(확정 홈 트리 + dead 삭제 목록) ← 핵심 입력
- `docs/handover/2026-05-29-R9-T02-history-menu.md` — **T02 산출**(메뉴/라우트 변경) ← 핵심 입력
- `docs/handover/2026-05-25-session34-r8-page-lightify.md` — R8의 부분 정정 내역(이어받아 완결)
- 현 코드: `app/page.tsx`·`components/` 트리 (실제 정합 기준)

## 4. 작업 목표

### Phase 1: 정합 대상 식별
- `_COMPONENT_MAP.md`에서 **삭제된 컴포넌트 항목**(R8의 about-section·dashboard-grid·LanguageSwitcher + R9/T01이 삭제한 hero-section 등)이 잔존하는지 확인 → 제거.
- 홈(`app/page.tsx`) 의존 항목이 현 트리(T01 확정 맵)와 일치하는지 정합 — 과거 import 표기/잘못된 자식 컴포넌트 정정.
- `_WEB_CONTRACT.md`에서 홈/`/history` 관련 계약 항목이 현 라우트·컴포넌트와 일치하는지 정합(T02 메뉴/라우트 변경 반영).

### Phase 2: 정합 반영
- 삭제 컴포넌트 항목 제거, 홈 트리 항목을 T01 확정 맵으로 갱신, `/history` 메뉴/라우트 상태를 T02 결정대로 반영.
- 두 레퍼런스의 **상호 정합**(컴포넌트 맵 ↔ 웹 계약 간 모순 없게).

### Phase 3: 교차 검증
- 레퍼런스에 적힌 컴포넌트가 실제 파일로 존재하는지 grep/Test-Path로 표본 검증(삭제분이 더 이상 언급 안 되는지, 살아있는 분이 정확히 표기됐는지).

## 5. 도구 권장
- T01/T02 handover를 먼저 정독 → 현 코드와 대조하며 Edit. 추측 금지(R3 stale 교훈), 코드/​handover 근거로만 정합.

## 6. 의존성
- **Wave 2**, depends **T01 + T02** (lazy 가능하나 권장은 통합 후).
- 본 산출물로 R9 정합·정리 라운드 완결.

## 7. 검증
```powershell
# 삭제 컴포넌트가 레퍼런스에 잔존하지 않는지 (예시)
Select-String -Path docs/references/_COMPONENT_MAP.md,docs/references/_WEB_CONTRACT.md -Pattern 'hero-section|about-section|dashboard-grid|LanguageSwitcher'   # 0건 목표(맥락 설명 제외)
# 레퍼런스에 적힌 홈 컴포넌트가 실제 존재하는지 표본 확인
Test-Path components/footer-section.tsx   # True
Test-Path components/hero-section.tsx     # False (T01이 삭제했으면)
```
```bash
grep -nE "hero-section|about-section|dashboard-grid|LanguageSwitcher" docs/references/_COMPONENT_MAP.md docs/references/_WEB_CONTRACT.md
```

## 8. 완료 신호
`docs/handover/2026-05-29-R9-T03-reference-reconcile.md` 작성. 포함 필수:
- 정합한 항목 목록(`_COMPONENT_MAP`·`_WEB_CONTRACT` 각각 무엇을 제거/정정/추가했는지)
- T01/T02 입력 반영 내역
- 교차 검증 결과(삭제분 0 언급·살아있는 분 정확 표기)
- 잔여 stale(있으면 다음 라운드 후보로)

## 안티패턴
- ❌ `docs/references/` 외 파일 수정 (T03은 문서 정합 전담)
- ❌ T01/T02 미통합 상태에서 추정으로 정합 (확정 입력 대기 — Wave2)
- ❌ 코드 근거 없이 레퍼런스 임의 작성 (추측 금지)
- ❌ `_COMPONENT_MAP`·`_WEB_CONTRACT` 간 상호 모순 방치
- ❌ 한국어 주석·handover 누락
