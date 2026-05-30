# R13 / T-A2 — 티커·김프 시세 전역 구독 (인수인계)

- **라운드**: R13 display-rollout / Wave1
- **터미널**: 일꾼 T-A2
- **쓰기 영역**: `components/Chart/`·`components/Market/`
- **작성일**: 2026-05-30

## 1. 목표

R12에서 구축한 표시 환경설정 Context(`useDisplaySettings()` — 통화 USD↔KRW·등락색 KR↔GLOBAL)를 시세 표시 컴포넌트(Ticker·StockTicker·KimchiPremium)로 확산. 레퍼런스 구현은 `components/Watchlist/WatchlistTable.tsx`.

## 2. 수정 파일 목록 + 변경 요약

### 2-1. `components/Chart/Ticker.tsx` (crypto 티커) — 전환 완료

- `useDisplaySettings()` 구독 추가 (`formatPrice`, `changeColorClass`).
- **가격**: `${Number(data.price).toLocaleString(...)}` 하드코딩 → `formatPrice(Number(data.price))`.
  - 근거: crypto는 USDT 페어이므로 `TickerData.price`는 **USD 네이티브** → `formatPrice`(USD 입력 가정) 적용 정당. KRW 모드 시 환율 환산 정상.
- **등락 색**: `isPositive ? 'text-green-500' : 'text-red-500'` 하드코딩 → `changeColorClass(data.changePercent)`.
- **% 배지 배경**: `bg-green-500/10`·`bg-red-500/10` 하드코딩 녹/빨 → 중립 컨테이너 `bg-surface-container-high`로 통일. 배지 텍스트 색도 `changeColorClass`로 일원화(KR 모드에서 상승=빨강 텍스트인데 배경만 녹색이던 색 체계 모순 제거).

### 2-2. `components/Chart/StockTicker.tsx` (주식 티커) — 전환 완료

- `useDisplaySettings()` 구독 추가, 변경 패턴은 Ticker.tsx와 동일(가격 `formatPrice`, 색 `changeColorClass`, 배지 배경 중립화).
- **StockTicker 가격 단위 판단 (KRW 네이티브 여부)** — ⚠️ 핵심:
  - `TwelveDataTicker`에는 통화 메타가 **없다**(`{ symbol, price, changePercent }`).
  - 사용처를 추적한 결과 **유일한 호출처는 `app/stock/page.tsx`("🇺🇸 미국 주식 분석실")이며 심볼은 `TOP_US_STOCKS`(AAPL/NVDA/TSLA 등 미국 종목) 전용**. 한국 주식 심볼은 들어오지 않는다.
  - 따라서 TwelveData quote 가격은 **USD 네이티브 → KRW 네이티브 아님**. `formatPrice` 적용 시 1450배 오류 위험 없음. 가격 전환을 정상 적용했다.
  - (후속 주의) 향후 StockTicker를 한국 주식(`.KS`/`.KQ` 등 KRW 네이티브 종목)에 재사용하게 되면, `TwelveDataTicker`에 `currency` 필드를 추가하고 그 값에 따라 `formatPrice` 적용 여부를 분기해야 한다. 현재 사용 범위에서는 안전.

### 2-3. `components/Market/KimchiPremium.tsx` — 변경 없음 (의도적)

분석 결과 통화 전환·등락색 전환 모두 **부적합**하여 코드를 변경하지 않았다. 근거:

- **가격(통화) 전환 부적합 — 단위 고정 컬럼**:
  - 김프 테이블은 `Upbit (KRW)` 컬럼(`krwPrice`, **KRW 네이티브**)과 `Global ($)` 컬럼(`usdPrice`, USD)을 **나란히 비교 표시**하는 것이 본질. 컬럼 헤더에 단위가 고정 명시돼 있다.
  - `krwPrice`에 `formatPrice`(USD 입력 가정)를 적용하면 ₩값을 다시 ×1450 하는 **1450배 환산 오류** 발생. 절대 금지.
  - 두 컬럼은 "KRW 원본 vs USD 원본 가격차"를 보이는 것이 목적이므로 표시설정 통화로 환산하면 비교 의미가 사라진다 → 단위 고정 유지.
  - `formatPrice` 로컬 구현(`Intl.NumberFormat`)은 단위(₩/$)를 JSX에 직접 붙여 쓰는 표시용이며 표시설정 통화와 무관 → 유지.
- **프리미엄 배지 색 — 의미색 보존(표시설정과 충돌)**:
  - premium 배지 색은 부호 기반 단순 등락색이 아니라 **임계값 구간 의미색**: `>5%` 빨강(과열)·`>2%` 주황·`<0%` 파랑(역프)·그 외 녹색.
  - `changeColorClass`는 부호(+/−)만 보는 2색(또는 중립) 체계라 구간 의미(5%·2% 경계, 주황 단계)를 표현 불가 → 적용하면 정보 손실.
  - 또한 GLOBAL 모드(녹↑빨↓)에서 "김프 과열=빨강"이라는 도메인 의미색과 정면 충돌. **지침대로 의미색 우선 보존**.
  - `USD/KRW` 환율 표시의 `text-blue-400`은 등락/프리미엄 색이 아닌 단순 강조색 → 전환 대상 아님.

## 3. 검증 결과 (PASS 증거)

| 명령 | 결과 |
|------|------|
| `npx tsc --noEmit` | **exit 0** (타입 오류 0) |
| `npx eslint components/Chart/Ticker.tsx components/Chart/StockTicker.tsx components/Market/KimchiPremium.tsx` | **exit 0** (error 0) — `.eslintignore` deprecation 경고만 출력(무해) |
| `npm run build` | **exit 0** (전 라우트 빌드 성공) |

## 4. 미해결 / 후속 사항

- **StockTicker 다통화 대응**: 위 2-2 후속 주의 참조. 한국 주식 확장 시 `TwelveDataTicker.currency` 필드 도입 필요.
- **티커 배지 배경 중립화**: 디자인상 기존 녹/빨 반투명 배경을 `bg-surface-container-high`로 통일했다. 톤이 옅어진 만큼, 디자인 검토(T-A1/지휘자) 시 배지 강조가 약하다고 판단되면 색 체계에 대응하는 bg 토큰(예: KR/GLOBAL별 배경) 도입을 검토 가능. 현재는 색 체계 일관성·하드코딩 제거를 우선했다.
- **KimchiPremium**: 표시설정 구독을 추가하지 않았으므로 이 라운드 이후에도 통화/색 토글의 영향을 받지 않는다(설계 의도).

## 5. 안티패턴 준수 확인

- ✅ `lib/config/display-settings.tsx` 미수정
- ✅ `components/Chart/`·`components/Market/` 외부 미수정
- ✅ crypto↔stock SSOT 교차 임포트 없음
- ✅ USD 아닌 값(`krwPrice`)에 `formatPrice` 미적용 (1450배 오류 방지)
- ✅ 신규 시세 fetch API 미생성
- ✅ 검증 3종 실제 실행 후 PASS 확인
