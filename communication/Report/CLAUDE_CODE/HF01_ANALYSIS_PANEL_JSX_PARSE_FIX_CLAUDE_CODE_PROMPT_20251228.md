# HF01_ANALYSIS_PANEL_JSX_PARSE_FIX - PROMPT

## Task Information
- **Task Name**: HF01_ANALYSIS_PANEL_JSX_PARSE_FIX
- **Agent**: CLAUDE CODE
- **Date**: 2025-12-28
- **Target**: http://localhost:3000/analysis 빌드 파싱 에러 즉시 해결

## Original Error
```
components/Analysis/AnalysisPanel.tsx:288:13
Parsing ecmascript source code failed
JSX 주석 파싱 실패: Expected ',', got '{'
```

## Problem Description
- **File**: `components/Analysis/AnalysisPanel.tsx`
- **Line**: 288
- **Issue**: JSX 주석 문법 오류 - `{/* Premium Modal Overlay */ }` (닫는 중괄호 앞 공백)
- **Secondary Issue**: 중괄호 블록이 별도 라인으로 분리되어 파싱 에러 발생

## Constraints (DO NOT TOUCH)
- 로직 변경 금지
- 이벤트/상태 변경 금지
- UI 구조 대규모 변경 금지
- 다른 파일 수정 금지

## Fix Specification
주석을 정상 JSX 주석 문법으로 교체:
- `{/* ... */ }` -> `{/* ... */}`
- 별도 중괄호 블록 병합
