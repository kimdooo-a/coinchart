# RESULT_PHASE4_STEP4-3_ANTIGRAVITY

## 1. 개요
본 문서는 Phase 4-3의 **Single Source of Truth(SSOT)** 강제 규격을 정의한다.
Data Flow Integrity를 위해 분석(Analysis) 로직은 반드시 **Supabase의 검증된 데이터**만을 입력으로 받아야 한다.

---

## 2. 금지 경로 목록 (Forbidden Sources)
다음 함수들은 **분석(Analysis) 로직의 입력**으로 직접 사용되는 것이 영구적으로 **금지**된다.
단, 단순 시세 조회 UI(Ticker Tape)나 Chart의 시각적 보조 용도로는 사용 가능하다.

| 파일 경로 | 함수명 | 금지 사유 |
|---|---|---|
| `lib/api/binance.ts` | `getKlines(...)` | 검증되지 않은 Raw Data 직수입 금지 |
| `lib/api/binance.ts` | `subscribeToKlines(...)` | 실시간 변동성 오염 방지 (Snapshot 원칙 위배) |
| `lib/api/binance.ts` | `subscribeToTicker(...)` | 분석 정합성 깨짐 (분석은 닫힌 캔들 기반이어야 함) |
| `app/analysis/page.tsx` | 내부의 `fetch(External API)` | 클라이언트 사이드 직접 호출 금지 |

---

## 3. 허용 경로 및 규격 (Allowed Sources) 
모든 분석(`performAnalysis`)의 입력 데이터는 다음 경로를 통해서만 주입되어야 한다.

### 3.1 Primary Source
*   **Path**: `lib/supabase/market.ts` (또는 유사한 Data Access Layer)
*   **Query Constraint**:
    ```typescript
    supabase.from('market_prices')
        .select('*')
        .eq('symbol', targetSymbol)
        .order('time', { ascending: false })
        .limit(990) // 최대 허용치 (Backtest 최소 요건 + 여유분)
    ```
*   **Validation**: 가져온 데이터는 반드시 다음 스키마 검증을 통과해야 한다.
    *   `time`: Not Null, Unique
    *   `close`: > 0
    *   `volume`: >= 0

---

## 4. Dev-only Assertion 규칙
개발 단계에서 SSOT 위반을 감지하기 위해, `orchestrator.ts` 또는 진입점에 다음 Assertion을 심어야 한다.

```typescript
// in lib/analysis/orchestrator.ts

export async function performAnalysis(inputs: AnalysisInputs) {
    // 1. Data Source Validation (Dev environment only)
    if (process.env.NODE_ENV === 'development') {
        const isFromSupabase = inputs.sourceTag === 'SUPABASE_MARKET_PRICES';
        if (!isFromSupabase) {
            console.error('🚨 [SSOT VIOLATION] Analysis inputs must come from Supabase!');
            // throw new Error('SSOT Violation: Use Supabase data only.'); // 강제 시 주석 해제
        }
    }
    
    // ... logic
}
```
*   **Action**: 모든 `performAnalysis` 호출부는 `sourceTag`를 명시적으로 전달해야 하며, 이를 통해 출처를 보증해야 한다.

---

## 5. UI 고지 문구 삽입 위치
사용자에게 분석 데이터의 시점(Snapshot)을 명확히 인지시켜야 한다.

| 페이지/컴포넌트 | 위치 | 필수 문구 예시 |
|---|---|---|
| `AnalysisPanel.tsx` | Header 또는 Title 옆 | "Data Snapshot: {HH:mm}" (분석 기준 시각) |
| `AnalysisPanel.tsx` | Footer | "본 분석은 마감된 캔들 데이터를 기준으로 합니다." |
| `ChartArea` | Legend | "Real-time updates may differ from Analysis snapshot." |

---

## 6. Grep 패턴 최종 리스트 (Prohibited Terms)
다음 패턴이 발견되면 CI/CD 파이프라인에서 빌드를 실패시켜야 한다.

| 구분 | 정규식 패턴 (Regex) | 설명 |
|---|---|---|
| **AI/ML 과장** | `/AI\s*(예측|픽|추천)/i` | AI가 직접 찍어준다는 뉘앙스 금지 |
| **수익 보장** | `/(무조건|확실한|보장된)\s*(수익|상승)/` | 확정적 미래 표현 금지 |
| **과도한 안정성** | `/(손실\s*없는|무패)/` | 리스크 Zero 표현 금지 |
| **예측 행위** | `/(주가|코인)\s*예측/` | '예측' 대신 '분석' 또는 '전망' 사용 권장 |

---

## 7. 결론
이 문서는 **Phase 4-3**의 결과물로서, 데이터 흐름의 투명성과 신뢰성을 기술적으로 강제하는 기준이다.
이후의 모든 기능 추가는 이 SSOT 규격을 준수해야 한다.
