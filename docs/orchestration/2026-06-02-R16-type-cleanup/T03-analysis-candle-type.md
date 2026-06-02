# T03 — analysis 라우트 Candle 타입 정합 (`historyData: any[]` 5건 해소)

## 1. 🚨 착수 전 게이트 (실존 확인)

```powershell
# 본 작업 대상 영역·파일 실존 확인 (전부 True 여야 함)
'app/analysis/[symbol]/_lib/useAnalysisData.ts','app/analysis/[symbol]/_components/AnalysisGrid.tsx','app/analysis/[symbol]/_components/ChartSection.tsx','app/analysis/[symbol]/_components/PositionStatusCard.tsx' | ForEach-Object { "$_  $(Test-Path $_)" }
```

**각 파일을 `Read`로 직접 열어 실제 라인을 본 뒤에만 `Edit`한다.**

## 2. 컨텍스트

- 프로젝트: Crypto Chart Analysis (코인 차트 분석)
- 본 터미널 역할: **T03 / 3** (R16 type-cleanup, Wave 1 독립)
- 작업 디렉토리(쓰기 허용): **`app/analysis/[symbol]/` 하위만**
- 배경: R11(세션37)에서 `app/analysis/[symbol]/page.tsx`를 807→78줄로 분해(`_components/`·`_lib/`)하면서 `historyData`(캔들 배열)가 `any[]`로 남음. R15-T02가 "다운스트림 동시변경 필요로 보류·별도 티켓 권고"한 그것을 R16에서 마감.

## 3. 지상 진실 — 해소 대상 (CEO가 2026-06-02 grep 검증, 정확히 5건)

```
app/analysis/[symbol]/_lib/useAnalysisData.ts       :27  반환타입  historyData: any[]
app/analysis/[symbol]/_lib/useAnalysisData.ts       :39  useState<any[]>([])
app/analysis/[symbol]/_components/AnalysisGrid.tsx  :30  historyData: any[]
app/analysis/[symbol]/_components/ChartSection.tsx  :13  historyData: any[]
app/analysis/[symbol]/_components/PositionStatusCard.tsx :12  historyData: any[]
```

전부 같은 캔들 배열을 가리키는 `any[]`이므로 **Candle 타입 1개로 5건 일괄 해소** 가능.

## 4. 작업 절차

1. **실제 shape 확인**(추측 금지): `useAnalysisData.ts`에서 `setHistoryData(...)`에 주입되는 데이터의 실제 출처·필드를 Read로 확인(fetch 응답 매핑부). `historyData[i]`가 차트/지표 계산·`PositionStatusCard`·`AnalysisGrid`에서 **실제로 접근하는 필드**(예: time/open/high/low/close/volume 등)를 전부 수집.
2. **기존 타입 재사용 우선**: `types/`·`lib/chart/`·`lib/supabase/crypto.ts`·`lib/indicators.ts` 등에 캔들/kline 타입(예: `Candle`·`Kline`·`OHLCV`·lightweight-charts `CandlestickData`)이 이미 있으면 **그것을 import**해 사용. (있으면 신설하지 말 것.)
3. **없으면 route-local 신설**: `app/analysis/[symbol]/_lib/types.ts`(또는 `useAnalysisData.ts` 내부)에 최소 `Candle` 인터페이스 정의 — **실제 접근 필드만** 포함. 과한 필드 추정 금지.
4. 위 5개 지점의 `any[]` → `Candle[]`로 교체. 4개 파일이 같은 타입을 import하도록 정합.

## 5. 작업 원칙

- **동작·렌더 결과는 절대 바꾸지 않는다.** 타입 표면만.
- 필드 접근이 실제 코드와 어긋나면 안 됨 — 접근하는 필드만 타입에 넣고, optional 여부도 실제 사용에 맞춤.
- `tsc` 새 에러를 만들면 해당 변경 원복 + handover에 "보류" 기록.

## 6. 의존성

- **독립** (Wave 1). `app/analysis/[symbol]/` 외 수정 금지(`types/`·`lib/`는 읽기전용 import만 — 기존 타입 재사용 시).

## 7. 검증 (자가 — handover에 실제 출력 첨부 필수)

```powershell
# 1) 대상 영역 any 잔존 (착수 전 5 → 0 목표. 남으면 사유 보고)
Select-String -Path "app/analysis/[symbol]/_lib/*.ts","app/analysis/[symbol]/_components/*.tsx" -Pattern ":\s*any\b|as any|<any>|any\[\]" | Select-Object Path,LineNumber,Line

# 2) 타입체크 — 반드시 EXIT 0
npx tsc --noEmit

# 3) 빌드 (analysis 라우트 정상 — ƒ /analysis/[symbol])
npm run build

# 4) 변경 증거
git diff --stat "app/analysis/[symbol]/"
```

## 8. 완료 신호

`docs/handover/2026-06-02-R16-T03-analysis-candle-type.md` 작성:
- Candle 타입을 **신설했는지/기존 재사용했는지** + 포함 필드 목록과 그 근거(실제 접근 코드)
- 5건 해소 결과(잔존 any 건수)
- `npx tsc --noEmit` EXIT 0 + `npm run build` 성공 확인
- **`git diff --stat` 실제 출력 붙여넣기**

## 안티패턴

- ❌ 실제 접근 안 하는 필드를 추정으로 타입에 채움(과잉 타입).
- ❌ `app/analysis/[symbol]/` 외 수정(`types/`·`lib/` 쓰기 — import만).
- ❌ 동작/렌더 변경 / tsc·build 에러 잔존.
- ❌ `git diff --stat` 없이 완료 보고 / handover 누락 / 영어 작성.
