# R14 / T01 — 시세 구독 잔여 마감 (FngGauge·HotIssue 등락색 `useDisplaySettings` 구독)

- **라운드**: R14 (loose-ends) / Wave 1 (독립)
- **터미널 역할**: T01 / 4
- **작업 디렉토리**: `components/community/widgets/` (쓰기 허용 범위 준수)
- **일자**: 2026-05-30
- **결과**: ✅ 완료 (검증 4종 PASS)

## 1. 작업 요약

R13에서 시작한 표시 환경설정(S2 전역 적용)의 **잔여 사이드바 위젯 2종**을 동일 패턴으로 마감.
하드코딩된 `text-[var(--color-kr-up/down)]` 임의값 클래스를 `useDisplaySettings().changeColorClass()` 구독으로 전환하여, 표시설정 토글(KR 빨↑파↓ ↔ GLOBAL 녹↑빨↓)을 따르도록 함.

## 2. 수정 파일 diff 요약 (2파일)

### `components/community/widgets/FngGaugeWidget.tsx`

- 최상단 `'use client';` 추가 (client hook 사용 위해 서버 컴포넌트 → 클라이언트 전환). 루트 `app/layout.tsx`에 `DisplaySettingsProvider` 마운트 확인됨.
- `import { useDisplaySettings } from "@/lib/config/display-settings";` 추가.
- 컴포넌트 본문에서 `const { changeColorClass } = useDisplaySettings();` 구독.
- delta 색 삼항 분기
  `delta > 0 ? "text-[var(--color-kr-up)]" : delta < 0 ? "text-[var(--color-kr-down)]" : "text-on-surface-variant"`
  → `changeColorClass(delta)` 한 줄로 교체 (양수/음수/0 분기를 함수가 내장 처리).
- **게이지 색(`FNG_LEVELS` 5단계 색 = 공포/탐욕 구간 의미색) 무변경** — `level.color` SVG stroke·라벨 색 그대로.

### `components/community/widgets/HotIssueWidget.tsx`

- 최상단 `'use client';` 추가.
- `import { useDisplaySettings } from "@/lib/config/display-settings";` 추가.
- 모듈 상수 `TREND_LABEL`(text+className 묶음)을 **기호만 가진 `TREND_TEXT`**로 축소 (className 분리).
- 컴포넌트 내부에 `trendClassName(trend)` 헬퍼 추가:
  - `up` → `changeColorClass(1)`, `down` → `changeColorClass(-1)` (등락색 구독)
  - `new` → `"text-secondary"`, `same` → `"text-on-surface-variant"` (상태색 **보존**)
- map 렌더에서 `trend.className` → `trendClassName(it.trend)`, `trend.text` → `TREND_TEXT[it.trend]`로 교체.
- **props 인터페이스(`HotIssue`·`HotIssueTrend`·컴포넌트 props) 무변경** — 부모 호출부 영향 없음.

## 3. 검증 결과 (실제 실행)

| 검증 | 명령 | 결과 |
|------|------|------|
| 타입 | `npx tsc --noEmit` | ✅ EXIT 0 (에러 0) |
| 린트 | `npx eslint components/community/widgets/FngGaugeWidget.tsx components/community/widgets/HotIssueWidget.tsx` | ✅ EXIT 0 (경고/에러 0, `.eslintignore` deprecation 경고만 — 무관) |
| 빌드 | `npm run build` | ✅ EXIT 0 (전 라우트 정상 생성) |
| 하드코딩 잔존 | `grep -nE 'var\(--color-kr-(up\|down)\)' [2파일]` | ✅ 0건 (no match) |

## 4. 보존 항목 확인

- ✅ **게이지 의미색 보존**: `FngGaugeWidget`의 `FNG_LEVELS` 5단계 색(극단적공포~극단적탐욕)·`level.color` 미접촉.
- ✅ **new/same 상태색 보존**: `HotIssueWidget`의 `new`(text-secondary)·`same`(text-on-surface-variant) 유지.
- ✅ **데이터·레이아웃·기호 무변경**: `↑↓NEW−` 기호, grid 레이아웃, delta 숫자 표시 로직 그대로.

## 5. 미접촉 명시 (안티패턴 회피)

- ❌ `lib/config/display-settings.tsx` — 읽기 전용 SOT, 미접촉.
- ❌ `components/Chart/Ticker.tsx`, `components/Market/KimchiPremium*`, StockTicker — R13에서 결론 확정된 컴포넌트, 미접촉.
- ❌ `components/community/widgets/` 밖 어떤 파일도 미접촉.

## 6. 부수 이점

`text-[var(--color-kr-*)]` 임의값 클래스가 제거되어 정적 클래스(`text-kr-up`/`text-kr-down`/`text-on-surface-variant`)로 전환 → R13 dev500(Tailwind v4 content 오염)과 무관해짐.

## 7. 다음 작업 제안

- 본 R14 loose-ends의 나머지 T02~T04 진행 (있다면).
- 동일 패턴 잔여 시세 위젯이 더 있는지 `grep -rE 'var\(--color-kr-(up|down)\)' components/` 전역 스윕 권장.
