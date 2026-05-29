# R12 / T-E — S2 표시설정 전역 적용 (일꾼 통합 프롬프트) · Wave 2

## 0. 정체성
- 너는 **R12 Wave 2 일꾼 T-E**. 역할은 T-B가 만든 표시 환경설정(통화·등락색상)을 **전역 적용**(S2). 지휘관 아님 — handover만, cs 금지.

## 1. 컨텍스트
- 프로젝트: 코인차트분석 (Next.js 16·TS·Tailwind v4). R12 Wave 1(T-A watchlist·T-B settings·T-C DB·API)은 회수·검증 PASS 완료(미커밋, 같은 워킹트리에 존재).
- **쓰기 허용**: `app/layout.tsx`, `components/Watchlist/` **만**. (그 외 시세 컴포넌트 전역 롤아웃은 R13 후속 — 본 라운드는 MVP 표면만.)

## 2. 공통 SOT (읽기 전용 — 먼저 정독)
- `docs/handover/2026-05-29-R12-TB-settings.md` **§2 + §2-4(S2 착수 가이드)** ← 핵심
- `lib/config/display-settings.tsx` (T-B 산출 — `DisplaySettingsProvider`·`useDisplaySettings`·`formatPrice`·`changeColorClass`)
- `docs/handover/2026-05-29-R12-TA-watchlist.md` §4(S2 연동 지점)
- `components/Watchlist/WatchlistTable.tsx`·`WatchlistView.tsx` (구독 대상 — T-A 산출)
- `app/layout.tsx` (현재 Provider 구성 — `LanguageProvider` 위치 확인)

## 3. 작업 목표 + 산출물
1. **Provider 루트 승격**: `DisplaySettingsProvider`를 `app/layout.tsx` 루트에 마운트(`LanguageProvider` 안쪽 권장). 단일 마운트.
2. **settings 페이지 로컬 래퍼 제거 안내**: `app/settings/page.tsx`의 로컬 `<DisplaySettingsProvider>`는 T-B 영역이라 **직접 수정 금지** — handover에 "settings 로컬 래퍼 제거 필요(중첩 무해하나 단일 마운트 정석)"로 명기해 후속/지휘관이 처리. (중첩돼도 동작은 정상 — 같은 localStorage·이벤트.)
3. **watchlist 표 구독**: `WatchlistTable`(+`WatchlistView`)이 한국식 하드코딩 대신 `useDisplaySettings()` 구독:
   - 가격: `formatPrice(usdValue)` → USD↔KRW 전환 표시.
   - 등락 색: `changeColorClass(value)` → 한국식(빨↑파↓)/글로벌(녹↑빨↓) 전환.
   - 기존 `--color-kr-up`/`--color-kr-down` 직접 사용부를 Context 구독으로 대체.

## 4. 의존성
- 선행: T-B(`lib/config/display-settings.tsx`)·T-A(watchlist 표) 완료 — 충족됨.
- 병렬 안전: T-F(D3)는 `components/hooks/`만, T-D(nav)는 `components/Common/`만 — 본 작업과 파일 겹침 0.

## 5. 검증
- `npx tsc --noEmit`·`npx eslint app/layout.tsx components/Watchlist` 통과.
- 수동: settings에서 통화 KRW·색상 글로벌 전환 → `/watchlist` 표가 즉시 환율 환산·색 반전.

## 6. 완료 신호
- `docs/handover/2026-05-30-R12-TE-s2-global.md`: 산출 파일 / settings 로컬 래퍼 제거 필요 명기 / 구독 적용 컴포넌트 목록 / 검증 / 격리 확인. **cs 금지**.

## 7. 안티패턴
- `app/settings/`·`components/Settings/`·`lib/config/` 직접 수정(T-B 영역 침범) · `components/hooks/`(T-F)·`components/Common/`(T-D) 침범 · 프로젝트 전역 시세 컴포넌트 전부 손대기(범위 초과 — MVP 표면만) · 지휘관 자칭.
