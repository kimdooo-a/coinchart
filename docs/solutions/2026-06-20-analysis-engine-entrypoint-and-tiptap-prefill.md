---
title: 분석 엔진 진입점 선택(analyzeMarket vs analyzeCrypto) + TipTap 비동기 prefill + bcryptjs 베이스라인
date: 2026-06-20
session: 52
tags: [lib-analysis, analyzeMarket, analyzeCrypto, candles, IndicatorSignal, tiptap, blogeditor, prefill, bcryptjs, tsc-baseline, server-component]
category: pattern
confidence: high
---

## 문제

세션 52 R-B 구현에서 새 소비처(코인룸 서버 컴포넌트)가 분석 결과를 얻으려 할 때 어떤 엔진 함수를 호출해야 하는지 비자명했다. 추가로 ① 게시글 수정 폼의 TipTap 에디터가 비동기 로드한 본문을 표시하지 못할 위험, ② tsc 베이스라인이 bcryptjs로 깨져 있던 문제가 있었다.

## 원인

### 1. 분석 엔진 진입점 — signals 사전구성 여부가 갈림
`lib/analysis/`에는 결과 형태가 비슷한 진입점이 여럿 있으나 **입력 계약이 다르다**:
- `analyzeCrypto(input: CryptoAnalysisInput)` (`lib/analysis/crypto.ts`) — `input.signals: IndicatorSignal[]` **사전구성 요구**.
- `performAnalysis(input: AnalysisInput)` (`lib/analysis/orchestrator.ts`) — 마찬가지로 `signals: IndicatorSignal[]` 요구.
- `analyzeMarket(candles: CandleData[], options?)` (`lib/analysis.ts`) — **원시 캔들을 직접 받아** 지표→시그널→분류 풀파이프라인 실행.

기존 소비처 `app/analysis/[symbol]/_lib/useAnalysisData.ts`는 `performAnalysis`를 쓰면서 RSI/MACD/trend/stochastic/CCI 등을 약 150줄로 직접 계산해 `IndicatorSignal[]`를 만든 뒤 넘긴다. 새 소비처가 이를 모르고 `analyzeCrypto`/`performAnalysis`를 고르면 그 150줄을 복제해야 한다. (R-B 계획서조차 "@/lib/analysis/crypto 경유"라고 잘못 지목했다.)

### 2. TipTap content는 초기값 전용
`BlogEditor`(`components/Blog/editor/BlogEditor.tsx`)는 `useEditor({ content })`로 초기화하며 **이후 `content` prop 변경을 감지하지 않는다**. 폼이 마운트 시 빈 content로 렌더되고 나서 async fetch로 prefill하면, 에디터는 빈 채로 고정된다.

### 3. bcryptjs가 package.json엔 있으나 node_modules에 없음
`bcryptjs`/`@types/bcryptjs`가 package.json·lockfile에 선언됐지만 로컬 node_modules에 미설치 → `npx tsc --noEmit`이 TS2307로 EXIT 1. 이 상태면 task별 "tsc 0" 검증 게이트가 무의미해진다.

## 해결

### 1. 원시 캔들 → `analyzeMarket` 사용
서버 컴포넌트에서 캔들만 있을 때는 `analyzeMarket(candles)`을 호출한다. crypto SSOT `fetchCryptoMarketPrices(symbol, limit)`로 캔들을 받고(이미 ascending 정렬), `CryptoPriceData`→`CandleData` 매핑 후 호출. 결과의 `signal`(BUY/SELL/NEUTRAL)·`recommendation`·`marketState`·`winRate`를 위젯 형태로 매핑.
- eslint `no-restricted-imports`가 `@/lib/analysis`(bare)를 막고 `@/lib/analysis/crypto`만 화이트리스트 → 현재는 `lib/analysis/crypto.ts`가 `analyzeMarket`을 재수출(상대경로 `../analysis`)해 경유. (모듈 경계상 깔끔하진 않음 — 후속으로 `lib/analysis/market.ts` 독립 노출 또는 eslint override 검토.)
- candle limit은 300이면 지표 계산 충분(990은 과다, 서버 렌더 비용↑).

### 2. TipTap prefill = 로드 완료 후에만 에디터 마운트
폼을 `loadState==='ready'`(content가 이미 set된 상태)에서만 렌더하면 BlogEditor 첫 마운트가 prefill된 content를 받는다. `key={postId}`로 강제 재마운트도 가능하나, ready-게이팅이 이미 보장하면 key는 no-op(`key={content}`는 매 타이핑 재마운트라 금지).

### 3. `npm install`로 베이스라인 정상화
의존성이 선언만 되고 미설치면 `npm install` 후 tsc EXIT 0 확인. 검증 게이트를 신뢰하기 전 베이스라인부터 클린으로 만들 것.

## 교훈
- 분석 엔진은 **입력 계약(원시 캔들 vs 사전구성 signals)**으로 진입점을 고른다. 새 소비처는 `analyzeMarket(candles)`이 기본. 계획서/주석의 지목도 의심하고 실제 시그니처를 읽어라.
- 비제어 에디터(TipTap 등)에 비동기 prefill할 땐 "로드 후 마운트" 또는 안정 key 재마운트. 초기값 prop만 바꾸면 반영 안 된다.
- task별 "tsc 0" 검증 전, 베이스라인 tsc가 실제 0인지 먼저 확인(선언-설치 불일치 함정).

## 관련 파일
- `lib/analysis.ts` (`analyzeMarket`), `lib/analysis/crypto.ts`·`lib/analysis/orchestrator.ts`
- `lib/community/coin-server.ts`, `lib/supabase/crypto.ts` (`fetchCryptoMarketPrices`)
- `app/board/[slug]/[postId]/edit/page.tsx`, `components/Blog/editor/BlogEditor.tsx`
- `eslint.config.mjs` (no-restricted-imports)
