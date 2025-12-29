# RESULT_PHASE4_STEP4-4_ANTIGRAVITY

## 1. 개요
Phase 4-4에서 적용할 **최적화 규격(Optimization Specs)**을 정의한다.
현재 `/analysis` 라우트에서 발견된 **중복 데이터 호출(Duplicate Fetching)**을 제거하고, 아직 남아있는 Binance API 직접 호출을 최소화하여 시스템 부하를 줄이고 SSOT를 강제하는 것이 목표다.

## 2. /analysis 최적화 규격 (Single Fetch, Single Analysis)

### 2.1 현상 진단 (AS-IS)
현재 구조에서는 동일한 데이터를 두 번 요청하고 있다.
1.  `app/analysis/page.tsx`: Chart 렌더링을 위해 Supabase `market_prices` 호출.
2.  `components/Analysis/AnalysisPanel.tsx`: 분석(Analysis)을 위해 Supabase `market_prices` **재호출**.

### 2.2 최적화 규격 (TO-BE)
**"페이지 레벨 단일 호출, 컴포넌트 데이터 주입 (Lift State Up)"**

1.  **Data Fetching 위치**: `app/analysis/page.tsx` (Page Level) 단일화.
2.  **Prop Drilling**: Fetch된 `historyData`를 `AnalysisPanel`에 Props로 전달.
    *   `app/analysis/page.tsx`:
        ```tsx
        // Fetch Logic Here
        <AnalysisPanel data={historyData} symbol={symbol} ... />
        ```
    *   `components/Analysis/AnalysisPanel.tsx`:
        *   `useEffect` 내부의 **Supabase 호출 로직 제거**.
        *   Props로 받은 `data`가 변경될 때만 `useMemo`를 통해 `performAnalysis` 재실행.

### 2.3 실행 보장 규칙 (Execution Guards)
1.  **Single Analysis**: `performAnalysis`는 `data` 또는 `symbol`이 변경될 때만 1회 실행되어야 한다. (`useMemo` Dependency Array 최적화)
2.  **AbortController**: `page.tsx`의 `useEffect` 내에서 `AbortController`를 사용하여, 사용자가 심볼을 빠르게 변경할 경우 이전 요청을 취소(Cancel)해야 한다.
3.  **Loading Synced**: 차트와 분석 패널의 로딩 상태가 동기화되어야 한다. (Page가 `isLoading`을 관리하고 Panel에 전달)

## 3. Binance 직접 호출 최소화 (Minimization Targets)

`/analysis` 라우트는 이미 **0회**를 달성했으나, 앱 전반의 일관성을 위해 다음 파일들의 `getKlines` 사용을 점검하고 제거/대체해야 한다.

### 3.1 잔존 호출 발견 대상
| 우선순위 | 파일 경로 | 현재 상태 | 조치 계획 |
| :--- | :--- | :--- | :--- |
| **High** | `components/hero-chart.tsx` | `getKlines` 직접 호출 중 | 메인 랜딩 페이지용이므로 허용 가능할 수 있으나, 장기적으로 Supabase Cached Data 또는 StaticProps 권장. |
| **Medium** | `lib/api/binance.ts` | 함수 정의 존재 | 제거하지 않고 유지하되, 서버 사이드 백업용으로만 사용 제한. |
| **Low** | `components/Chart/Ticker.tsx` | `subscribeToTicker` (WS) | 실시간 가격 표시용이므로 **허용 (Exception)**. |

> **Next Step Action**: `components/hero-chart.tsx`는 UI 전용이므로 Phase 4-4 범위 밖일 수 있으나, 기회가 된다면 정적 데이터 또는 Supabase 데이터로 교체 권장.

## 4. 캐싱 정책 권장안 (Caching Policy)

Supabase 요청 부하를 줄이기 위한 캐싱 전략.

1.  **Browser Cache (Client-Side)**:
    *   React `useState`/`useMemo`를 통해 현재 세션 내 심볼 변경 시 재요청하되, 뒤로 가기 등으로 재진입 시 상태 보존 (선택 사항).
2.  **Next.js Request Memoization (Server-Side/Proxy)**:
    *   현재 클라이언트 사이드(`use client`)에서 직접 Supabase를 호출하므로 Next.js fetch cache는 적용되지 않음.
    *   **권장**: `react-query` 또는 `swr` 도입을 고려할 시점이나, 현재는 **"중복 호출 제거"만으로도 충분한 최적화 효과**가 있음. 이번 단계에서는 라이브러리 추가 없이 Logic Refactoring에 집중.

## 5. 검증 체크리스트 (Verification Checklist)

Phase 4-4 코드 수정 후 통과해야 할 기준.

1.  **Network Tab (Filter: supabase / binance)**
    *   `/analysis` 진입 시:
        *   `market_prices` (Supabase) 요청: **1회** (성공해야 함).
        *   `klines` (Binance) 요청: **0회**.
2.  **Console Log**
    *   Analysis 실행 로그 ("Performing analysis...")가 **페이지 로드 당 1회 (Strict Mode에서는 2회 허용)**만 찍혀야 함.
    *   심볼 변경 시 새로운 요청 1회 발생 확인.
3.  **React Profiler**
    *   `AnalysisPanel`이 데이터 로드 완료 시 1번만 리렌더링 되는지 확인.

## 6. 결론 (Action Item)
다음 스텝(코드 수정)에서 `app/analysis/page.tsx`가 데이터를 가져와 `AnalysisPanel`로 내려주는 구조로 **리팩토링**한다. 이를 통해 DB 부하를 50% 절감하고 UI 동기화를 보장한다.
