# R16-T03 인수인계 — analysis 라우트 Candle 타입 정합 (`historyData: any[]` 5건 해소)

- 날짜: 2026-06-02
- 터미널: T03 / 3 (R16 type-cleanup, Wave 1 독립)
- 작업 영역: `app/analysis/[symbol]/` 하위만 (외부는 읽기전용 import 조사만)
- 상태: ✅ 완료 (5건 → 0건, tsc EXIT 0, build EXIT 0)

## 1. 결론: Candle 타입 **신설** (기존 재사용 부적합)

route-local `Candle` 인터페이스를 **신설**했다 — `app/analysis/[symbol]/_lib/types.ts`(이미 존재하던 route-local 공유 타입 파일).

### 신설 이유 (기존 타입 재사용 부적합)

| 후보 기존 타입 | shape | 부적합 사유 |
|----------------|-------|-------------|
| `lib/supabase/crypto.ts` `CryptoPriceData` | `time: number` + 필수 `symbol` | 본 데이터는 `time`=DB date **문자열**, `symbol` 없음 |
| `lib/api/binance.ts` `CandleData` | `time: number` | 동일하게 `time: number` 불일치 |
| `lib/backtest/engine.ts` `CandleData` / `lib/signal_engine.ts` `Candle` | `time: number` | 동일 |
| `components/DetailedChart.tsx` `ChartData` | `time: string`, OHLC만 (volume 없음, **비export 로컬**) | export 안 됨 + volume 누락 → 그대로 재사용 불가 |

→ 본 라우트의 캔들은 `time`이 **string**(DB `date` 컬럼)인데 기존 캔들 타입은 전부 `time: number`(Unix sec). shape가 근본적으로 다르므로 재사용 시 오히려 잘못된 타입이 됨. **route-local 신설이 정답.**

### 실제 접근 필드 근거 (추측 아님 — 실코드 확인)

- **데이터 출처** (`useAnalysisData.ts:102-120`): `market_prices`에서 `date, open, high, low, close, volume` select → `{ time: p.date, open, high, low, close, volume }`로 매핑 후 `setHistoryData`.
- **`time: string`**: `p.date`는 DB date 문자열. `DetailedChart`의 `ChartData.time: string` 계약과 정렬됨 (`ChartSection`이 `data={historyData}`로 전달 → `time:string` 필요).
- **OHLCV: number**: `PositionStatusCard`는 `historyData[i].close` 접근(`PositionStatusCard.tsx:28-36`). `DetailedChart`는 time/open/high/low/close 사용. volume은 매핑 시 채워지므로 shape 정합 위해 포함.
- `AnalysisGrid`는 `historyData.length`만 접근.

### 신설한 타입

```ts
export interface Candle {
    time: string
    open: number
    high: number
    low: number
    close: number
    volume: number
}
```

`Candle` → `DetailedChart`의 `ChartData`(time:string + OHLC:number)에 할당 가능(여분 volume 허용), `.close` 산술 정상. 동작/렌더 불변.

## 2. 5건 해소 결과 (전부 `Candle[]`로 교체)

| 파일 | 위치 | 변경 |
|------|------|------|
| `_lib/useAnalysisData.ts` | 반환타입 `UseAnalysisData.historyData` | `any[]` → `Candle[]` |
| `_lib/useAnalysisData.ts` | `useState<any[]>([])` | `useState<Candle[]>([])` |
| `_components/AnalysisGrid.tsx` | `AnalysisGridProps.historyData` | `any[]` → `Candle[]` |
| `_components/ChartSection.tsx` | `ChartSectionProps.historyData` | `any[]` → `Candle[]` |
| `_components/PositionStatusCard.tsx` | `PositionStatusCardProps.historyData` | `any[]` → `Candle[]` |

import 정합: `useAnalysisData.ts`는 `import type { Candle } from './types'`, 3개 컴포넌트는 기존 `'../_lib/types'` import에 `Candle` 추가.

**대상 영역 잔존 any: 0건** (`Select-String`/`Grep` `:\s*any\b|as any|<any>|any\[\]` → No matches found)

## 3. 검증 출력

```
# 1) any 잔존 검사 (Grep ':\s*any\b|as any|<any>|any\[\]' over app/analysis/[symbol])
No matches found        # 착수 전 5 → 0 ✅

# 2) npx tsc --noEmit
EXIT=0                  ✅

# 3) npm run build
EXIT=0                  ✅
ƒ /analysis/[symbol]    # analysis 라우트 정상 (dynamic) ✅
```

## 4. `git diff --stat` 실제 출력

```
 app/analysis/[symbol]/_components/AnalysisGrid.tsx       |  4 ++--
 app/analysis/[symbol]/_components/ChartSection.tsx       |  4 ++--
 app/analysis/[symbol]/_components/PositionStatusCard.tsx |  4 ++--
 app/analysis/[symbol]/_lib/types.ts                      | 15 +++++++++++++++
 app/analysis/[symbol]/_lib/useAnalysisData.ts            |  5 +++--
 5 files changed, 24 insertions(+), 8 deletions(-)
```

(git이 LF→CRLF 경고 출력했으나 내용 변경 아님 — 줄바꿈 정규화 경고일 뿐.)

## 5. 원칙 준수

- 동작/렌더 변경 없음 — 타입 표면만 교체.
- `app/analysis/[symbol]/` 외 수정 없음 (`lib/`·`types`·`components`는 읽기전용 import 조사만, `DetailedChart`는 import도 추가 안 함).
- 과잉 타입 없음 — 실제 접근/매핑 필드만 포함.
- 보류 항목 없음.
