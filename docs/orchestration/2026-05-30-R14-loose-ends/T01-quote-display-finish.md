# T01 — 시세 구독 잔여 롤아웃 (FngGauge·HotIssue 등락색 `useDisplaySettings` 구독)

## 1. 컨텍스트

- 프로젝트: Crypto Chart Analysis (코인 차트 분석, Next.js 16 + Tailwind v4)
- 작업 디렉토리(쓰기 허용): **`components/community/widgets/` 만**
- 본 터미널 역할: **T01 / 4** — R13에서 시작한 표시 환경설정(S2 전역 적용)의 **잔여 위젯 2종**을 동일 패턴으로 마감
- 라운드: **R14 (loose-ends)** / Wave 1 (독립)

## 2. 배경 (왜 이 작업인가)

R12에서 `useDisplaySettings()` Context(통화 USD↔KRW · 등락색 KR↔GLOBAL)를 구축하고, R13에서 시세 컴포넌트 다수(CoinHero·PriceTickerWidget·Ticker·StockTicker)를 구독 전환했다. **사이드바 위젯 2종이 아직 등락색을 하드코딩**하고 있어 표시설정 토글을 따르지 않는다. 이를 구독으로 전환하는 것이 본 작업.

> ⚠️ R13에서 **KimchiPremium(단위 고정 컬럼·임계값 의미색)·StockTicker(이미 전환 완료)는 결론 확정** → 본 라운드 대상 아님. 건드리지 말 것.

## 3. 공통 SOT (읽기 전용)

```
lib/config/display-settings.tsx        useDisplaySettings()·changeColorClass()·getChangeColorClass() API (수정 금지)
components/Chart/Ticker.tsx            R13 T-A2 전환 레퍼런스 (가격 formatPrice·색 changeColorClass·배지 중립화 패턴)
components/Watchlist/WatchlistTable.tsx  R12 S2 구독 원조 레퍼런스
docs/handover/2026-05-30-R13-T-A2-ticker-kimchi.md  의미색 보존 판단 기준 (KimchiPremium 왜 제외했는지)
```

## 4. 작업 목표

### 대상 1: `components/community/widgets/FngGaugeWidget.tsx`

- 파일 최상단에 `'use client';` 추가 (현재 서버 컴포넌트 — client hook `useDisplaySettings` 사용 위해 필수). 루트 `app/layout.tsx`에 `DisplaySettingsProvider`가 이미 마운트돼 있어 Provider 하위에서 안전.
- `useDisplaySettings()` 구독 → **`delta`(어제 대비 변동) 색만** 하드코딩(`text-[var(--color-kr-up)]`/`text-[var(--color-kr-down)]`)을 `changeColorClass(delta)`로 교체.
- ⚠️ **게이지 색(`FNG_LEVELS`의 5단계 색)은 의미색**(공포/탐욕 구간) — **절대 변경 금지**. delta 텍스트 색만 등락색 체계 구독.

### 대상 2: `components/community/widgets/HotIssueWidget.tsx`

- 파일 최상단에 `'use client';` 추가.
- `useDisplaySettings()` 구독 → `TREND_LABEL`의 **`up`/`down`만** 하드코딩(`text-[var(--color-kr-up/down)]`)을 `changeColorClass`로 교체. `up` → `changeColorClass(1)`, `down` → `changeColorClass(-1)`.
- `TREND_LABEL`이 모듈 상수라 컴포넌트 밖에서 `changeColorClass`를 못 쓴다 → **컴포넌트 내부에서 trend별 className을 계산**하도록 리팩토링(텍스트 기호 `↑↓NEW−`는 그대로, className만 동적).
- ⚠️ `new`(text-secondary)·`same`(text-on-surface-variant)은 등락이 아닌 상태 표시 → **보존**.

### 공통 주의

- 색만 표시설정 구독으로 전환. **데이터·레이아웃·기호·게이지 로직 무변경.**
- `text-[var(--color-kr-*)]` 임의값 클래스가 제거되어 R13 dev500(Tailwind v4 content 오염)과도 무관해진다(부수 이점).
- 두 위젯의 **props 인터페이스는 변경 금지**(부모 사이드바가 그대로 호출).

## 5. 도구 권장

- 직접 편집(Edit). 레퍼런스 `Ticker.tsx`의 구독 도입부를 그대로 따를 것.

## 6. 의존성

- **독립** (Wave 1). 선행 없음. 다른 터미널과 파일 겹침 없음.

## 7. 검증 (자가 — 실제 실행 후 결과를 handover에 기록)

```powershell
npx tsc --noEmit
npx eslint components/community/widgets/FngGaugeWidget.tsx components/community/widgets/HotIssueWidget.tsx
npm run build
# 하드코딩 잔존 0 확인 (대상 2파일에서 kr-up/kr-down 임의값 클래스가 사라졌는지)
Select-String -Path components/community/widgets/FngGaugeWidget.tsx,components/community/widgets/HotIssueWidget.tsx -Pattern 'var\(--color-kr-(up|down)\)'
```

## 8. 완료 신호

`docs/handover/2026-05-30-R14-T01-quote-display.md` 작성 — 수정 2파일 diff 요약 + 검증 3종 결과 + "게이지 색/new/same 보존" 확인 + KimchiPremium·StockTicker 미접촉 명시.

## 안티패턴

- ❌ `lib/config/display-settings.tsx` 수정 (읽기 전용 SOT)
- ❌ `components/community/widgets/` 밖 쓰기 (KimchiPremium·Ticker·StockTicker 등 미접촉)
- ❌ 게이지 의미색(FNG_LEVELS)·new/same 상태색을 등락색으로 바꾸기 (정보 손실)
- ❌ props 인터페이스 변경 (부모 호출부 깨짐)
- ❌ 한국어 주석 누락 / `.env` 커밋 (글로벌 룰)
- ❌ 검증 미실행 상태로 handover 작성 (PASS는 실제 실행 증거로만)
