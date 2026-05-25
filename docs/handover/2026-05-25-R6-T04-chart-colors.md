# R6-polish T04 — 차트 방향색 KR 정렬 (볼륨·MACD 히스토그램 빨↑/파↓)

- **날짜**: 2026-05-25
- **라운드/터미널**: R6-polish Wave 1 / T04 (5)
- **목표**: 볼륨·MACD 히스토그램 방향색을 미국식(녹↑/빨↓) → 한국식(빨↑/파↓)으로 정렬. theme.ts 헬퍼 SSOT화. className 미수정(T05 전담).
- **상태**: ✅ 완료 (히스토그램 방향색 잔존 0건, 수정 3파일 tsc 에러 0)

## 1. 작업 범위 결론

격리 5파일 중 **실제 히스토그램(볼륨·MACD)을 가진 파일은 2개**(`CryptoChart.tsx`, `StockChart.tsx`)뿐.
- `components/DetailedChart.tsx` — 볼륨/MACD 히스토그램 **없음**(캔들/라인만). 방향색 hex 매치 0건 → 변경 없음.
- `components/hero-chart.tsx` — 히스토그램 **없음**. 녹색 매치는 "LIVE BINANCE DATA" 인디케이터 className(`bg-green-500`/`text-green-400`)뿐 → className은 T05 전담이므로 **보존**(미수정).

→ 지시서의 "4종 차트"는 4파일 중 히스토그램 보유분만 대상. 실제 색 교체는 2파일에서 수행, 나머지 2파일은 대상 없음으로 무변경 확정.

## 2. theme.ts 헬퍼 추가 (`lib/chart/theme.ts`)

캔들 KR(`KR_CANDLE_COLORS`)과 **동일 hex 재사용**으로 톤 일관성 확보.

```ts
// MACD 히스토그램·시리즈 기본색용 불투명 방향색
export const KR_DIRECTION_COLORS = { up: '#ba1a1a', down: '#0050cb' }; // 빨↑/파↓
export const US_DIRECTION_COLORS = { up: '#26a69a', down: '#ef5350' }; // 녹↑/빨↓
export function getDirectionColors(scheme: CandleScheme = 'kr') { ... }

// 볼륨 히스토그램 막대용 반투명(alpha 0.5) 방향색 (위 방향색과 동일 RGB)
export const KR_VOLUME_COLORS = { up: 'rgba(186, 26, 26, 0.5)', down: 'rgba(0, 80, 203, 0.5)' };
export const US_VOLUME_COLORS = { up: 'rgba(38, 166, 154, 0.5)', down: 'rgba(239, 83, 80, 0.5)' };
export function getVolumeColors(scheme: CandleScheme = 'kr') { ... }
```

- `#ba1a1a` = rgba(186,26,26), `#0050cb` = rgba(0,80,203) — 캔들 KR과 동일 RGB의 0.5 투명도 변형.
- `US_DIRECTION_COLORS`/`US_VOLUME_COLORS`는 기존 `US_CANDLE_COLORS`와 동일 패턴의 **scheme 토글용 정의**(현재 호출 안 됨). 미국식 hex(`#26a69a`/`#ef5350`)가 theme.ts에 남는 것은 의도된 스킴 정의이며 하드코딩 잔존이 아님.

## 3. 히스토그램 색 before → after

두 컴포넌트 모두 상단에 import + 모듈 상수 추가:
- import: `getDirectionColors, getVolumeColors` 추가 (line 6~7)
- `const DIRECTION_COLORS = getDirectionColors('kr');` (line 13)
- `const VOLUME_COLORS = getVolumeColors('kr');` (line 14)

### components/Chart/CryptoChart.tsx
| 위치 | before | after | 비고 |
|------|--------|-------|------|
| L163 | MACD 시리즈 init `color: '#26a69a'` | `color: DIRECTION_COLORS.up` | 빨 |
| L183 | 볼륨 시리즈 init `color: '#26a69a'` | `color: VOLUME_COLORS.up` | 빨(반투명) |
| L267 | 볼륨 바 `'rgba(38,166,154,0.5)' : 'rgba(239,83,80,0.5)'` | `VOLUME_COLORS.up : VOLUME_COLORS.down` | 빨↑/파↓ |
| L319 | MACD 히스토그램 `'#26a69a' : '#ef5350'` | `DIRECTION_COLORS.up : DIRECTION_COLORS.down` | 빨↑/파↓ |

### components/Chart/StockChart.tsx (구조 동일)
| 위치 | before | after | 비고 |
|------|--------|-------|------|
| L154 | MACD 시리즈 init `color: '#26a69a'` | `color: DIRECTION_COLORS.up` | 빨 |
| L174 | 볼륨 시리즈 init `color: '#26a69a'` | `color: VOLUME_COLORS.up` | 빨(반투명) |
| L259 | 볼륨 바 `'rgba(38,166,154,0.5)' : 'rgba(239,83,80,0.5)'` | `VOLUME_COLORS.up : VOLUME_COLORS.down` | 빨↑/파↓ |
| L311 | MACD 히스토그램 `'#26a69a' : '#ef5350'` | `DIRECTION_COLORS.up : DIRECTION_COLORS.down` | 빨↑/파↓ |

- **방향 분기 로직 보존**: 볼륨 `d.close >= d.open`, MACD `histogram[i]! >= 0` 그대로. 색 매핑만 교체(녹→빨, 빨→파).

## 4. 보존한 라인/오버레이 색 (범위 밖, 무변경)

| 항목 | 색 | 위치 |
|------|-----|------|
| RSI 라인 | `#9c27b0` | Crypto L144 / Stock 대응 |
| MACD 라인 | `#2962FF` | L161/L152 |
| MACD 시그널 라인 | `#FF6D00` | L162/L153 |
| MA7/MA25/MA99 라인 | `#E91E63`/`#2196F3`/`#FFEA00` | Manage MA |
| BB 라인 | 기존값 | Manage BB |
| 크로스헤어 | `#0050cb` | theme.ts LIGHT_CHART_THEME L19~20 (방향성 무관, 기존 톤) |
| className(text-green/red, bg-*) | — | Ticker/StockTicker, hero-chart LIVE 인디케이터, 에러 박스 — **T05 전담, 미수정** |

## 5. 검증 결과

| 항목 | 결과 |
|------|------|
| `npx tsc --noEmit` (수정 3파일) | ✅ 에러 0 (theme.ts / CryptoChart / StockChart) |
| 히스토그램 녹↑ 잔존 (`#26a69a`·`#16a34a`·`#22c55e`·녹 rgba) — 4 컴포넌트 | ✅ 0건 |
| 히스토그램 빨↓ 미국식 잔존 (`#ef5350`·`#ef4444`·`#dc2626`) — 2 차트 | ✅ 0건 |
| theme.ts KR 방향색 적용 (`#ba1a1a`·`#0050cb`·rgba 변형) | ✅ 확인 |
| 4종 차트 빨↑/파↓ | ✅ Crypto·Stock 교체 / Detailed·hero 히스토그램 없음(대상 외) |

### ⚠️ 전체 tsc/build 차단 — 본 작업 무관 (다른 터미널 WIP)
`npx tsc --noEmit` 전체 실행 시 **`app/page.tsx`에서만** 15건 에러(`MainPageData`/`createAnonClient`/`fetchCommunityTickers`/`fetchFng`/`MainCoinCard` 미정의 등). 이는 차트 색과 무관하며, `git status`상 동시 수정 중인 `app/page.tsx`·`lib/community/queries.ts`(R6-polish 다른 터미널 WIP) 때문. **본 T04 격리 3파일에는 에러 0건**이므로 `npm run build`(green)는 통합 지휘자 터미널이 전 워커 병합 후 최종 수행 권장. 본 워커는 `app/page.tsx`를 침범하지 않았음.

## 6. 변경 파일
- `lib/chart/theme.ts` — 방향색 헬퍼 4상수 + 2함수 추가
- `components/Chart/CryptoChart.tsx` — import + 모듈 상수 2 + 히스토그램 색 참조 4
- `components/Chart/StockChart.tsx` — 동일

## 7. 안티패턴 준수 확인
- ✅ 지정 5파일 밖 무수정 (app/page.tsx 등 미침범)
- ✅ className/토큰 무수정 (T05 영역 보존)
- ✅ 라인·축·격자색 무분별 교체 안 함 (히스토그램 방향색만)
- ✅ 한국어 주석 작성, handover 작성
