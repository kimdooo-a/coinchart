# 인수인계서 — 세션 34 (R8 마감: 페이지 컴포넌트 다크 잔재 라이트화 + dead code 삭제)

> 작성일: 2026-05-25
> 이전 세션: [session33 (R7 마감)](./2026-05-25-R7-34-chart-lines-tokens.md)
> 세션 저널: [journal-2026-05-25.md](../logs/journal-2026-05-25.md)

---

## 작업 요약

R8 후보(페이지 컴포넌트 다크 잔재) 7종의 사용처를 전수 추적한 결과 **4종이 dead code**임을 발견. 사용자 승인 하에 **구 다크 랜딩 잔재 3종 삭제 + 살아있는 4종 및 재사용 프리미티브 1종 라이트화**로 처리. 레퍼런스 동기화까지 완료. tsc 0·build green(54/54)·다크 잔재 grep 0.

## 대화 다이제스트

### 토픽 1: 세션 시작 + git 상태 불일치 검증
> **사용자**: "다음 라운드(R8) 진행 ... 세션 33 종료 완료 ✅" (세션 33 cs 요약표 첨부)

`current.md`·세션 33 handover·`next-dev-prompt.md` 확인. 첨부된 세션 33 요약은 "29a00d5로 커밋·푸시 완료"라는데, 대화 시작 git 스냅샷에는 차트 5파일이 미커밋(M)·HEAD가 `eb1e9c7`로 표시되어 **불일치**. `git status`/`git log` 실측 → 실제 HEAD=`29a00d5`·워킹트리 **clean**. 시작 스냅샷이 세션 33 cs 커밋 **직전** 시점이었던 것으로, 우려했던 미커밋 잔여는 없음.

**결론**: 세션 33 정상 마감 확인. R8 진행.

### 토픽 2: R8 후보 사용처 추적 → dead code 발견
R8 후보 7종(`about-section`·`AuthButton`·`Chart/Ticker`·`Chart/StockTicker`·`InsufficientData`·`PremiumLock`·`LanguageSwitcher`·`dashboard-grid`)의 다크 클래스 맥락을 읽고, `.ts/.tsx/.js/.jsx` 전 범위에서 import 사용처를 추적.

| 컴포넌트 | 상태 | 맥락 |
|---|---|---|
| `Chart/Ticker` | 사용 중 | `app/analysis/page.tsx:124` (라이트 페이지) |
| `Chart/StockTicker` | 사용 중 | `app/stock/page.tsx:81` (라이트 페이지) |
| `PremiumLock` | 사용 중 | `Analysis/StockPanel.tsx:175` (라이트 오버레이 내부) |
| `AuthButton` | 사용 중 | `global-header.tsx:146` (라이트 헤더) |
| `about-section` | **dead** | import 0건, 구 다크 랜딩 |
| `dashboard-grid` | **dead** | import 0건, 구 벤토 그리드(홈=커뮤니티 SSR 재구축) |
| `LanguageSwitcher` | **dead** | import 0건, 헤더에 EN/KR 토글 이미 존재(중복) |
| `InsufficientData` | **dead** | import 0건, 단 재사용 UI 프리미티브 |

**결론**: handover가 "라이트화 누락분"으로 묶었으나 절반이 dead. (`hero-chart`는 R7 처리분이라 제외.)

### 토픽 3: 처리 방향 결정
> **AskUserQuestion**: dead 4종을 어떻게? → 사용자 **"삭제 + 선별 라이트화 (권장)"** 선택

**결론**: 구 다크 랜딩 3종(`about-section`·`dashboard-grid`·`LanguageSwitcher`)은 `git rm` 삭제, 재사용 프리미티브 `InsufficientData`는 라이트화 보존, 살아있는 4종 라이트화.

### 토픽 4: 라이트화 토큰 매핑 + 의미색 판별
`globals.css` `@theme` 정의를 직접 확인(추측 금지)하여 실제 라이트 토큰만 사용:
- 표면 `surface`(#faf8ff)/`surface-container`(#ecedfa)/`surface-container-lowest`(#fff)/`surface-container-high`
- 텍스트 `on-surface`(#191b24)/`on-surface-variant`(#424656), 경계 `outline-variant`(#c2c6d8), 브랜드 `primary`(#0050cb), 오류 `error`(#ba1a1a)

**의미색 보존 판별**: 빨/파 시세색·노랑 프리미엄(Lock·PRO 뱃지·글로우)·주황 경고(아이콘·불릿)는 의미색이라 유지. 그라데이션(블루→퍼플/블루) 위 흰 글씨(아바타·로그인 CTA)는 의도적 대비라 보존. 순수 다크 표면(gray-900/black/gray-800 border/회색 텍스트)만 교체. 등락 뱃지 `text-green/red-400`→`-600`은 R7 hero LIVE 선례 따라 흰 배경 가독 보강.

**결론**: 5종 라이트화 완료(상세 아래).

## 의사결정 요약

| # | 결정 | 선택지 | 선택 이유 |
|---|------|--------|----------|
| 1 | dead 4종 처리 | ①삭제+선별 라이트화 ②전부 라이트화(삭제X) ③살아있는 것만 | ① — 구 랜딩 3종은 v2.0 피벗 후 부활 계획 없는 dead라 정리, 재사용 프리미티브는 보존 (가장 깔끔) |
| 2 | 등락 뱃지/시세 방향색 | 빨/파 KR 통일 vs 기존 녹/빨 유지 | 기존 유지 — R8 범위는 "다크 잔재 라이트화"지 방향색 재정렬이 아님. 가독성만 `-400→-600` 보강 |
| 3 | 로그인 CTA·아바타 흰 글씨 | 토큰 교체 vs 보존 | 보존 — 블루 그라데이션 위 흰 글씨는 온브랜드 대비(다크 잔재 아님) |

## 수정 파일 (삭제 3 + 수정 5 + 레퍼런스 2 = 10개)

| # | 파일 | 변경 |
|---|------|------|
| 1 | `components/about-section.tsx` | **삭제**(dead) |
| 2 | `components/dashboard-grid.tsx` | **삭제**(dead) |
| 3 | `components/LanguageSwitcher.tsx` | **삭제**(dead) |
| 4 | `components/Chart/Ticker.tsx` | 컨테이너·텍스트 라이트화, 등락 뱃지 가독 |
| 5 | `components/Chart/StockTicker.tsx` | 동일 + "No Data" `text-error`·"Delayed" 토큰 |
| 6 | `components/PremiumLock.tsx` | 카드·블러 오버레이·흰 글씨 라이트화(노랑 프리미엄 보존) |
| 7 | `components/InsufficientData.tsx` | 카드·텍스트 라이트화(주황 경고 보존) |
| 8 | `components/AuthButton.tsx` | 로그인 알약·내부 회색/blue-400/white hover 라이트화(아바타·로그인 CTA 보존) |
| 9 | `docs/references/_COMPONENT_MAP.md` | 삭제 3종 제거 + 홈 항목 stale 정정 + dead-code 표 갱신 |
| 10 | `docs/references/_WEB_CONTRACT.md` | 레지스트리·R-001에서 삭제 3종 제거 |

## 상세 변경 사항

### 라이트화 토큰 매핑 (공통)
- `bg-gray-900`/`bg-gray-900/50`/`bg-gray-900/80` → `bg-surface-container(-lowest)` 또는 `/60`
- `bg-black/40` → `bg-surface/50` (프로스트 블러 유지)
- `border-gray-700`/`border-gray-800` → `border-outline-variant`
- `text-gray-300/400/500/600` → `text-on-surface` / `text-on-surface-variant`
- `text-blue-400`(이름) → `text-primary`, `hover:bg-white/10` → `hover:bg-surface-container-high`, `bg-gray-700`(divider) → `bg-outline-variant`
- 등락 뱃지 `text-green-400`/`text-red-400` → `-600`, "No Data" `text-red-400` → `text-error`

### 보존 항목
- 빨/파 시세 큰 글씨(`text-green-500`/`text-red-500`), 노랑 프리미엄(Lock·PRO·글로우), 주황 경고(아이콘·불릿·라벨), 아바타 그라데이션 + 흰 글씨, 로그인 CTA 블루 그라데이션 + 흰 글씨

## 검증 결과
- `npx tsc --noEmit` — **0 에러**
- `npm run build` — **✓ Compiled successfully (54/54)**, 삭제로 인한 dangling import 0
- 다크 잔재 grep(5 라이트화 파일) — 그라데이션 위 흰 글씨 2건만(의도 보존), 다크 표면 0
- `git diff --stat`(수정 5파일) — 26/26 대칭(순수 클래스 교체)

## 터치하지 않은 영역
- `app/page.tsx`(홈) 자체의 잔재 컴포넌트 사용 여부 — 레퍼런스의 홈 항목이 stale했음(과거 import 표기가 현 SSR 구조와 불일치). 본 세션은 삭제 3종 제거만 반영, **홈 컴포넌트 트리 전면 재감사는 후속 권장**
- `hero-section`/`footer-section` 등 다른 랜딩 잔재 — dead 여부 미확정(R8 후보 외)
- 스킬 sync(4.6단계): 본 세션 `03-skills/`·글로벌 스킬 변경 없음 → 해당 없음

## 알려진 이슈
- 없음. (R8 후보 7종 전부 처리 완료 — 삭제 3 + 라이트화 5, hero-chart는 R7 귀속)

## 다음 작업 제안
- **R9 후보**: (1) `app/page.tsx` 홈 컴포넌트 트리 재감사(레퍼런스 stale 정정 + 잔재 컴포넌트 dead 여부 확정), (2) 운영 DB `.env.local` UTF-8 BOM 제거(supabase CLI 직접 사용 복구), (3) Giscus App 설치(수동), (4) `/history` 메뉴 정리, (5) 대형 파일 리팩토링(`app/analysis/[symbol]/page.tsx` 807줄)

---
[← docs/status/current.md](../status/current.md)
