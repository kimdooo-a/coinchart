# HF02_SSOT_SUPABASE_FETCH_FIX - PROMPT

## Task Information
- **Task Name**: HF02_SSOT_SUPABASE_FETCH_FIX
- **Agent**: CLAUDE CODE
- **Date**: 2025-12-28
- **Priority**: HIGH (분석 페이지 차단 이슈)

## Original Error
```
SSOT Fetch Error: {}
at AnalysisPanel.useEffect.fetchAnalysisData
```

## Problem Description
- **File**: `components/Analysis/AnalysisPanel.tsx`
- **Function**: `fetchAnalysisData` inside `useEffect`
- **Issue**: Supabase fetch 실패 시 에러 객체가 `{}` (빈 객체)로 출력되어 원인 추적 불가

## Root Cause Analysis
1. Supabase PostgrestError 객체가 non-enumerable properties를 가져 `{}` 로 직렬화됨
2. try-catch 래핑 없음 - 예외 발생 시 처리 불가
3. RLS ON + 정책 없음 시 `data=null, error=undefined` 케이스 미처리

## Fix Objectives
1. Supabase fetch 실패의 실제 원인 노출
2. SSOT fetch 실패 시 `{}` 대신 의미 있는 에러 로그 출력
3. Supabase 쿼리가 정상일 경우 `/analysis` 페이지 정상 동작
4. 기능/데이터 구조는 그대로 유지 (로직 최소 수정)

## Constraints (DO NOT TOUCH)
- UI 레이아웃 / className
- 차트 렌더링 로직 (DetailedChart)
- 다른 페이지 (/market, /signal, /news)
- 라우팅 구조
